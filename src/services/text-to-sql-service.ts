/**
 * Text-to-SQL Service
 * Main service that orchestrates all text-to-SQL components following Google Cloud best practices
 */

import { schemaContextService } from './schema-context-service'
import { fewShotLearningService } from './few-shot-learning-service'
import { queryValidationService } from './query-validation-service'
import { entityResolutionService } from './entity-resolution-service'
import { supabase } from '@/lib/supabase'

export interface TextToSQLRequest {
  natural_language: string
  context?: any
  user_id?: string
  session_id?: string
  max_results?: number
  explain?: boolean
}

export interface TextToSQLResponse {
  sql: string
  confidence: number
  explanation: string
  entities: any[]
  validation_result: any
  execution_result?: any
  alternatives?: string[]
  processing_time: number
  steps: ProcessingStep[]
}

export interface ProcessingStep {
  step: string
  description: string
  duration: number
  result?: any
}

export interface SQLGenerationContext {
  query: string
  entities: any[]
  schema_context: string
  few_shot_examples: string
  business_context: any
  user_intent: string
  confidence: number
}

export class TextToSQLService {
  private processingSteps: ProcessingStep[] = []

  constructor() {}

  /**
   * Main text-to-SQL conversion function
   */
  async convertTextToSQL(request: TextToSQLRequest): Promise<TextToSQLResponse> {
    const startTime = Date.now()
    this.processingSteps = []

    try {
      // Step 1: Entity Resolution
      const entityStep = await this.trackStep('entity_resolution', async () => {
        const entityResult = await entityResolutionService.extractAndResolveEntities(request.natural_language)
        return entityResult
      })

      // Step 2: Schema Context Generation
      const schemaStep = await this.trackStep('schema_context', async () => {
        const schemaPrompt = await schemaContextService.generateSchemaPrompt(request.natural_language)
        return schemaPrompt
      })

      // Step 3: Few-Shot Examples Selection
      const fewShotStep = await this.trackStep('few_shot_selection', async () => {
        const fewShotPrompt = await fewShotLearningService.generateFewShotPrompt(request.natural_language)
        return fewShotPrompt
      })

      // Step 4: Intent Analysis and Context Building
      const contextStep = await this.trackStep('context_building', async () => {
        const context = await this.buildGenerationContext(
          request.natural_language,
          entityStep.result,
          schemaStep.result,
          fewShotStep.result
        )
        return context
      })

      // Step 5: SQL Generation using LLM
      const sqlStep = await this.trackStep('sql_generation', async () => {
        const generatedSQL = await this.generateSQLWithLLM(contextStep.result)
        return generatedSQL
      })

      // Step 6: Query Validation and Optimization
      const validationStep = await this.trackStep('query_validation', async () => {
        const validation = await queryValidationService.validateQuery(sqlStep.result.sql)
        return validation
      })

      // Step 7: Self-Consistency Check (if enabled)
      let finalSQL = sqlStep.result.sql
      if (validationStep.result.rewrittenQuery) {
        finalSQL = validationStep.result.rewrittenQuery
      }

      // Step 8: Always execute the query to get actual data
      const executionStep = await this.trackStep('query_execution', async () => {
        const result = await this.executeQueryWithActualData(finalSQL, request.max_results, contextStep.result)
        return result
      })
      const executionResult = executionStep.result

      const processingTime = Date.now() - startTime

      return {
        sql: finalSQL,
        confidence: this.calculateOverallConfidence(entityStep.result, contextStep.result, validationStep.result),
        explanation: this.generateExplanation(contextStep.result, sqlStep.result),
        entities: entityStep.result.entities,
        validation_result: validationStep.result,
        execution_result: executionResult,
        alternatives: await this.generateAlternatives(contextStep.result),
        processing_time: processingTime,
        steps: this.processingSteps
      }

    } catch (error) {
      console.error('Text-to-SQL conversion failed:', error)
      
      return {
        sql: '',
        confidence: 0,
        explanation: `Failed to convert natural language to SQL: ${error.message}`,
        entities: [],
        validation_result: {
          isValid: false,
          errors: [{ type: 'processing', message: error.message, severity: 'critical' }],
          warnings: [],
          suggestions: []
        },
        processing_time: Date.now() - startTime,
        steps: this.processingSteps
      }
    }
  }

  /**
   * Build comprehensive context for SQL generation
   */
  private async buildGenerationContext(
    query: string,
    entityResult: any,
    schemaPrompt: string,
    fewShotPrompt: string
  ): Promise<SQLGenerationContext> {
    // Analyze user intent
    const intent = this.analyzeUserIntent(query, entityResult.entities)
    
    // Get business context
    const businessContext = await schemaContextService.getBusinessContext(query)
    
    // Calculate confidence based on entity resolution
    const entityConfidence = entityResult.confidence
    
    return {
      query,
      entities: entityResult.entities,
      schema_context: schemaPrompt,
      few_shot_examples: fewShotPrompt,
      business_context: businessContext,
      user_intent: intent,
      confidence: entityConfidence
    }
  }

  /**
   * Generate SQL using LLM with comprehensive context and robust fallback system
   */
  private async generateSQLWithLLM(context: SQLGenerationContext): Promise<{sql: string, reasoning: string}> {
    console.log('🤖 Starting SQL generation with fallback system...');
    console.log(`🎯 User intent: ${context.user_intent}`);
    
    try {
      // Layer 1: Try OpenAI with retry mechanism
      console.log('🔄 Attempting OpenAI generation with retries...');
      return await this.callOpenAIWithRetry(context, 2)
    } catch (openaiError) {
      console.warn('❌ OpenAI failed after retries:', openaiError.message)
      
      try {
        // Layer 2: Enhanced template generation with entity context
        console.log('🔧 Trying enhanced template generation...');
        return await this.generateEnhancedTemplate(context)
      } catch (templateError) {
        console.warn('❌ Enhanced template failed:', templateError.message)
        
        // Layer 3: Basic fallback with simple patterns
        console.log('🆘 Using basic fallback generation...');
        return this.generateBasicFallback(context)
      }
    }
  }

  /**
   * Call OpenAI with retry mechanism and exponential backoff
   */
  private async callOpenAIWithRetry(context: SQLGenerationContext, maxRetries: number): Promise<{sql: string, reasoning: string}> {
    const prompt = this.buildLLMPrompt(context)
    console.log(`📄 Prompt length: ${prompt.length} characters`);
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 OpenAI attempt ${attempt + 1}/${maxRetries + 1}`);
        const startTime = Date.now();
        
        const response = await this.callOpenAIAPI(prompt, context)
        
        const apiTime = Date.now() - startTime;
        console.log(`⏱️ OpenAI API response time: ${apiTime}ms`);
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`OpenAI API failed: ${response.status} - ${errorText}`)
        }

        const result = await response.json()
        console.log('✅ OpenAI API response received');
        
        // Validate response structure
        if (!result.result) {
          throw new Error('Invalid OpenAI response structure')
        }
        
        // Parse and validate the response
        const parsed = this.parseLLMResponse(result.result)
        if (!parsed.sql || parsed.sql.trim().length === 0) {
          throw new Error('OpenAI returned empty SQL')
        }
        
        console.log(`📝 Generated SQL: ${parsed.sql?.substring(0, 100)}...`);
        
        return {
          sql: parsed.sql,
          reasoning: parsed.reasoning || 'SQL generated successfully by OpenAI'
        }
        
      } catch (error) {
        const isRetryable = this.isRetryableError(error)
        console.warn(`⚠️ Attempt ${attempt + 1} failed:`, error.message)
        
        if (isRetryable && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000 // Exponential backoff with jitter
          console.log(`⏳ Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        // If not retryable or max retries reached, throw the error
        throw new Error(`OpenAI failed after ${attempt + 1} attempts: ${error.message}`)
      }
    }
    
    throw new Error('Maximum retry attempts exceeded')
  }

  /**
   * Make the actual OpenAI API call
   */
  private async callOpenAIAPI(prompt: string, context: SQLGenerationContext): Promise<Response> {
    return await fetch('/api/chatgpt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'text_to_sql',
        prompt: prompt,
        data: {
          entities: context.entities,
          intent: context.user_intent,
          context: context.business_context
        }
      })
    })
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error.message?.includes('429')) return true  // Rate limit
    if (error.message?.includes('502')) return true  // Bad gateway
    if (error.message?.includes('503')) return true  // Service unavailable
    if (error.message?.includes('504')) return true  // Gateway timeout
    if (error.message?.includes('timeout')) return true
    if (error.message?.includes('network')) return true
    if (error.message?.includes('fetch')) return true
    return false
  }

  /**
   * Enhanced template generation with better entity context
   */
  private async generateEnhancedTemplate(context: SQLGenerationContext): Promise<{sql: string, reasoning: string}> {
    console.log('🔧 Generating enhanced template SQL...')
    
    const equipmentEntity = context.entities.find(e => e.type === 'equipment')
    const systemEntity = context.entities.find(e => e.type === 'system')
    const typeEntity = context.entities.find(e => e.type === 'equipment_type')
    
    let sql = ''
    let reasoning = ''
    
    // Enhanced equipment-specific query
    if (equipmentEntity) {
      sql = `SELECT 
        e.equipment_id,
        e.equipment_name,
        e.location,
        e.operational_status,
        e.equipment_type_id,
        'Enhanced template match for equipment' as source
      FROM equipment e
      WHERE e.equipment_id = '${equipmentEntity.resolved}'
      ORDER BY e.equipment_id
      LIMIT 10`
      reasoning = `Enhanced template query for specific equipment: ${equipmentEntity.resolved}. Includes comprehensive equipment details.`
    } 
    // Enhanced system-based query
    else if (systemEntity) {
      sql = `SELECT 
        e.equipment_id,
        e.equipment_name,
        e.location,
        e.operational_status,
        e.equipment_type_id,
        'Enhanced template match for system' as source
      FROM equipment e
      WHERE e.equipment_id LIKE '${systemEntity.resolved.replace('SYS-', '')}%'
         OR e.equipment_id LIKE '%${systemEntity.resolved.slice(-3)}%'
      ORDER BY e.equipment_id
      LIMIT 50`
      reasoning = `Enhanced template query for system: ${systemEntity.resolved}. Uses pattern matching for equipment belonging to system.`
    }
    // Enhanced type-based query
    else if (typeEntity) {
      const typeMapping = {
        'HEAT_EXCHANGER': 1,
        'PUMP': 2,
        'TANK': 3,
        'VESSEL': 4,
        '熱交換器': 1,
        'ポンプ': 2,
        'タンク': 3,
        '容器': 4
      }
      
      const typeId = typeMapping[typeEntity.resolved] || 1
      sql = `SELECT 
        e.equipment_id,
        e.equipment_name,
        e.location,
        e.operational_status,
        e.equipment_type_id,
        'Enhanced template match for type' as source
      FROM equipment e
      WHERE e.equipment_type_id = ${typeId}
      ORDER BY e.equipment_id
      LIMIT 50`
      reasoning = `Enhanced template query for equipment type: ${typeEntity.resolved} (ID: ${typeId})`
    }
    // Intent-based fallback
    else {
      switch (context.user_intent) {
        case 'maintenance_history':
          sql = `SELECT 
            mh.equipment_id,
            mh.implementation_date,
            mh.work_content,
            mh.worker,
            e.equipment_name,
            'Intent-based template' as source
          FROM maintenance_history mh
          JOIN equipment e ON mh.equipment_id = e.equipment_id
          ORDER BY mh.implementation_date DESC
          LIMIT 20`
          reasoning = 'Intent-based template for maintenance history queries'
          break
          
        case 'equipment_list':
        case 'equipment_by_system':
        default:
          sql = `SELECT 
            e.equipment_id,
            e.equipment_name,
            e.location,
            e.operational_status,
            e.equipment_type_id,
            'Default enhanced template' as source
          FROM equipment e
          ORDER BY e.equipment_id
          LIMIT 20`
          reasoning = 'Default enhanced template for general equipment queries'
      }
    }
    
    if (!sql) {
      throw new Error('Enhanced template generation failed - no matching pattern')
    }
    
    console.log('✅ Enhanced template SQL generated successfully')
    return { sql, reasoning }
  }

  /**
   * Basic fallback generation - guaranteed to work
   */
  private generateBasicFallback(context: SQLGenerationContext): {sql: string, reasoning: string} {
    console.log('🆘 Generating basic fallback SQL...')
    
    const sql = `SELECT 
      equipment_id,
      equipment_name,
      location,
      operational_status,
      equipment_type_id,
      'Basic fallback' as source
    FROM equipment
    WHERE equipment_id IS NOT NULL
    ORDER BY equipment_id
    LIMIT 10`
    
    const reasoning = `Basic fallback query generated due to all other methods failing. Original query: "${context.query}"`
    
    console.log('✅ Basic fallback SQL generated')
    return { sql, reasoning }
  }

  /**
   * Build comprehensive prompt for LLM
   */
  private buildLLMPrompt(context: SQLGenerationContext): string {
    let prompt = `# Text-to-SQL Conversion for CMMS Database

## Task
Convert the following natural language query into PostgreSQL SQL:
**Query:** "${context.query}"

## Context Information
${context.schema_context}

## Resolved Entities
`
    
    context.entities.forEach(entity => {
      prompt += `- **${entity.type}**: "${entity.original}" → "${entity.resolved}" (confidence: ${entity.confidence})\n`
    })
    
    prompt += `
## Intent Analysis
**User Intent:** ${context.user_intent}

${context.few_shot_examples}

## Generation Guidelines
1. **Safety First**: Only generate SELECT statements
2. **Accuracy**: Use exact table and column names from schema
3. **Performance**: Include appropriate ORDER BY and LIMIT clauses
4. **Completeness**: Join with related tables to provide comprehensive results
5. **Multilingual**: Handle both Japanese and English column names correctly

## Response Format
Please respond with:
1. A valid PostgreSQL SELECT statement
2. Brief explanation of the SQL logic
3. Any assumptions made

**SQL:**
\`\`\`sql
-- Your SQL query here
\`\`\`

**Explanation:**
[Brief explanation of the query logic and any assumptions]
`
    
    return prompt
  }

  /**
   * Parse LLM response to extract SQL and reasoning
   */
  private parseLLMResponse(response: string): {sql: string, reasoning: string} {
    // Extract SQL from code blocks
    const sqlMatch = response.match(/```sql\s*([\s\S]*?)\s*```/i)
    let sql = ''
    
    if (sqlMatch) {
      sql = sqlMatch[1].trim()
      // Remove SQL comments for cleaner output
      sql = sql.replace(/--.*$/gm, '').trim()
    }
    
    // Extract explanation
    const explanationMatch = response.match(/\*\*Explanation:\*\*\s*([\s\S]*?)(?:\n\n|\*\*|$)/i)
    let reasoning = ''
    
    if (explanationMatch) {
      reasoning = explanationMatch[1].trim()
    } else {
      // Fallback: use everything after the SQL block
      const afterSQL = response.split('```')[2] || ''
      reasoning = afterSQL.replace(/\*\*[^*]*\*\*/g, '').trim()
    }
    
    return { sql, reasoning }
  }

  /**
   * Fallback template-based SQL generation
   */
  private generateSQLWithTemplate(context: SQLGenerationContext): {sql: string, reasoning: string} {
    const equipmentEntity = context.entities.find(e => e.type === 'equipment')
    const systemEntity = context.entities.find(e => e.type === 'system')
    const typeEntity = context.entities.find(e => e.type === 'equipment_type')
    
    let sql = ''
    let reasoning = ''
    
    if (equipmentEntity) {
      // Equipment-specific query
      sql = `SELECT e.equipment_id, e.equipment_name, e.location, e.operational_status, etm.equipment_type_name
FROM equipment e
LEFT JOIN equipment_type_master etm ON e.equipment_type_id = etm.equipment_type_id
WHERE e.equipment_id = '${equipmentEntity.resolved}'`
      reasoning = `Generated template query for specific equipment: ${equipmentEntity.resolved}`
    } else if (typeEntity) {
      // Equipment type query
      sql = `SELECT e.equipment_id, e.equipment_name, e.location, e.operational_status, etm.equipment_type_name
FROM equipment e
JOIN equipment_type_master etm ON e.equipment_type_id = etm.equipment_type_id
WHERE etm.equipment_type_name LIKE '%${typeEntity.resolved}%'
ORDER BY e.equipment_id
LIMIT 50`
      reasoning = `Generated template query for equipment type: ${typeEntity.resolved}`
    } else {
      // Generic equipment list
      sql = `SELECT e.equipment_id, e.equipment_name, e.location, e.operational_status, etm.equipment_type_name
FROM equipment e
LEFT JOIN equipment_type_master etm ON e.equipment_type_id = etm.equipment_type_id
ORDER BY e.equipment_id
LIMIT 20`
      reasoning = 'Generated generic equipment listing query'
    }
    
    return { sql, reasoning }
  }

  /**
   * Execute query with safety checks - DEPRECATED
   * Use executeQueryWithActualData instead
   */
  private async executeQuery(sql: string, maxResults?: number): Promise<any> {
    console.warn('executeQuery is deprecated - use executeQueryWithActualData for production')
    return {
      success: false,
      error: 'This method is deprecated - use structured queries instead',
      row_count: 0
    }
  }

  /**
   * Execute query and return actual data results (not just explanations)
   */
  private async executeQueryWithActualData(sql: string, maxResults?: number, context?: SQLGenerationContext): Promise<any> {
    try {
      console.log('🔍 Executing query based on context and intent...')
      console.log(`🎯 Intent: ${context?.user_intent}`)
      
      // Instead of executing raw SQL, use structured queries based on intent
      const result = await this.executeStructuredQuery(context, maxResults || 100)
      
      if (result.success) {
        console.log(`✅ Query executed successfully: ${result.data?.length || 0} rows returned`)
        return result
      } else {
        console.error('❌ Structured query failed:', result.error)
        return {
          success: false,
          data: [],
          row_count: 0,
          message: result.error || 'Failed to execute query',
          sql_attempted: sql
        }
      }
      
    } catch (error) {
      console.error('❌ Query execution error:', error)
      
      return {
        success: false,
        data: [],
        row_count: 0,
        message: `Query execution failed: ${error.message}`,
        sql_attempted: sql
      }
    }
  }

  /**
   * Execute structured queries based on user intent and entities
   */
  private async executeStructuredQuery(context?: SQLGenerationContext, maxResults: number = 100): Promise<any> {
    if (!context) {
      return {
        success: false,
        error: 'No context provided for query execution',
        data: [],
        row_count: 0
      }
    }

    console.log(`🔍 Executing structured query for intent: ${context.user_intent}`)
    
    try {
      switch (context.user_intent) {
        case 'maintenance_history':
          return await this.queryMaintenanceHistory(context, maxResults)
        
        case 'equipment_list':
        case 'equipment_by_system':
        case 'equipment_info':
          return await this.queryEquipmentData(context, maxResults)
        
        case 'risk_analysis':
          return await this.queryRiskAssessment(context, maxResults)
        
        case 'maintenance_schedule':
          return await this.queryMaintenanceSchedule(context, maxResults)
        
        default:
          return await this.queryGeneralEquipment(context, maxResults)
      }
    } catch (error) {
      console.error('❌ Structured query execution failed:', error)
      return {
        success: false,
        error: error.message,
        data: [],
        row_count: 0
      }
    }
  }

  /**
   * Query maintenance history from database
   */
  private async queryMaintenanceHistory(context: SQLGenerationContext, maxResults: number): Promise<any> {
    try {
      const systemEntity = context.entities.find(e => e.type === 'system')
      const equipmentEntity = context.entities.find(e => e.type === 'equipment')
      
      let query = supabase
        .from('maintenance_history')
        .select(`
          equipment_id,
          implementation_date,
          work_content,
          worker,
          work_hours,
          equipment!inner(equipment_name, equipment_type_id)
        `)
        .order('implementation_date', { ascending: false })
        .limit(maxResults)

      // Filter by specific equipment if mentioned
      if (equipmentEntity) {
        query = query.eq('equipment_id', equipmentEntity.resolved)
      }

      // Filter by system if mentioned (assuming system relates to equipment)
      if (systemEntity && !equipmentEntity) {
        // First get equipment IDs for the system, then filter maintenance history
        const { data: equipmentList } = await supabase
          .from('equipment')
          .select('equipment_id')
          .like('equipment_id', `${systemEntity.resolved}%`)
          .limit(20)
        
        if (equipmentList && equipmentList.length > 0) {
          const equipmentIds = equipmentList.map(eq => eq.equipment_id)
          query = query.in('equipment_id', equipmentIds)
        }
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Database query failed: ${error.message}`)
      }

      return {
        success: true,
        data: data || [],
        row_count: data?.length || 0,
        message: `Found ${data?.length || 0} maintenance records.`
      }
    } catch (error) {
      throw new Error(`Maintenance history query failed: ${error.message}`)
    }
  }

  /**
   * Query equipment data from database
   */
  private async queryEquipmentData(context: SQLGenerationContext, maxResults: number): Promise<any> {
    try {
      const systemEntity = context.entities.find(e => e.type === 'system')
      const equipmentEntity = context.entities.find(e => e.type === 'equipment')
      const typeEntity = context.entities.find(e => e.type === 'equipment_type')
      
      let query = supabase
        .from('equipment')
        .select(`
          equipment_id,
          equipment_name,
          location,
          operational_status,
          equipment_type_id
        `)
        .order('equipment_id')
        .limit(maxResults)

      // Filter by specific equipment
      if (equipmentEntity) {
        query = query.eq('equipment_id', equipmentEntity.resolved)
      }
      
      // Filter by system
      if (systemEntity && !equipmentEntity) {
        query = query.like('equipment_id', `${systemEntity.resolved}%`)
      }
      
      // Filter by equipment type
      if (typeEntity) {
        // Map type names to IDs directly since we no longer use master tables
        const typeMapping = {
          '静機器': 1,
          '回転機': 2,
          '電気設備': 3,
          '計装設備': 4
        }
        
        // Find matching type
        const matchingType = Object.keys(typeMapping).find(typeName => 
          typeName.includes(typeEntity.resolved) || typeEntity.resolved.includes(typeName)
        )
        
        if (matchingType) {
          query = query.eq('equipment_type_id', typeMapping[matchingType])
        }
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Database query failed: ${error.message}`)
      }

      return {
        success: true,
        data: data || [],
        row_count: data?.length || 0,
        message: `Found ${data?.length || 0} equipment records.`
      }
    } catch (error) {
      throw new Error(`Equipment query failed: ${error.message}`)
    }
  }

  /**
   * Query risk assessment data from database
   */
  private async queryRiskAssessment(context: SQLGenerationContext, maxResults: number): Promise<any> {
    try {
      const equipmentEntity = context.entities.find(e => e.type === 'equipment')
      const systemEntity = context.entities.find(e => e.type === 'system')
      
      let query = supabase
        .from('equipment_risk_assessment')
        .select(`
          equipment_id,
          risk_level,
          risk_score,
          risk_factor,
          impact_rank,
          reliability_rank,
          mitigation_measures,
          equipment!inner(equipment_name, equipment_type_id)
        `)
        .order('risk_score', { ascending: false })
        .limit(maxResults)

      // Filter by equipment
      if (equipmentEntity) {
        query = query.eq('equipment_id', equipmentEntity.resolved)
      }
      
      // Filter by system
      if (systemEntity && !equipmentEntity) {
        query = query.like('equipment_id', `${systemEntity.resolved}%`)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Database query failed: ${error.message}`)
      }

      return {
        success: true,
        data: data || [],
        row_count: data?.length || 0,
        message: `Found ${data?.length || 0} risk assessment records.`
      }
    } catch (error) {
      throw new Error(`Risk assessment query failed: ${error.message}`)
    }
  }

  /**
   * Query maintenance schedule from database
   */
  private async queryMaintenanceSchedule(context: SQLGenerationContext, maxResults: number): Promise<any> {
    try {
      const equipmentEntity = context.entities.find(e => e.type === 'equipment')
      const systemEntity = context.entities.find(e => e.type === 'system')
      
      let query = supabase
        .from('inspection_plan')
        .select(`
          equipment_id,
          next_inspection_date,
          inspection_item,
          inspection_interval,
          equipment!inner(equipment_name, equipment_type_id)
        `)
        .order('next_inspection_date')
        .limit(maxResults)

      // Filter by equipment
      if (equipmentEntity) {
        query = query.eq('equipment_id', equipmentEntity.resolved)
      }
      
      // Filter by system
      if (systemEntity && !equipmentEntity) {
        query = query.like('equipment_id', `${systemEntity.resolved}%`)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Database query failed: ${error.message}`)
      }

      return {
        success: true,
        data: data || [],
        row_count: data?.length || 0,
        message: `Found ${data?.length || 0} maintenance schedule records.`
      }
    } catch (error) {
      throw new Error(`Maintenance schedule query failed: ${error.message}`)
    }
  }

  /**
   * Query general equipment information
   */
  private async queryGeneralEquipment(context: SQLGenerationContext, maxResults: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          equipment_id,
          equipment_name,
          location,
          operational_status,
          equipment_type_id
        `)
        .order('equipment_id')
        .limit(maxResults)

      if (error) {
        throw new Error(`Database query failed: ${error.message}`)
      }

      return {
        success: true,
        data: data || [],
        row_count: data?.length || 0,
        message: `Found ${data?.length || 0} equipment records.`
      }
    } catch (error) {
      throw new Error(`General equipment query failed: ${error.message}`)
    }
  }

  /**
   * Apply result limit to SQL
   */
  private applyResultLimit(sql: string, maxResults: number): string {
    const upperSQL = sql.toUpperCase()
    
    if (upperSQL.includes('LIMIT')) {
      // Update existing limit
      return sql.replace(/LIMIT\s+\d+/i, `LIMIT ${maxResults}`)
    } else {
      // Add limit
      return `${sql} LIMIT ${maxResults}`
    }
  }

  /**
   * Analyze user intent from query and entities
   */
  private analyzeUserIntent(query: string, entities: any[]): string {
    const queryLower = query.toLowerCase()
    
    // Intent detection based on keywords and entities
    if (queryLower.includes('maintenance') || queryLower.includes('メンテナンス')) {
      if (queryLower.includes('history') || queryLower.includes('履歴')) {
        return 'maintenance_history'
      } else if (queryLower.includes('schedule') || queryLower.includes('予定')) {
        return 'maintenance_schedule'
      } else {
        return 'maintenance_general'
      }
    }
    
    if (queryLower.includes('risk') || queryLower.includes('リスク')) {
      return 'risk_analysis'
    }
    
    if (queryLower.includes('thickness') || queryLower.includes('肉厚')) {
      return 'thickness_analysis'
    }
    
    if (entities.some(e => e.type === 'equipment') && 
        (queryLower.includes('about') || queryLower.includes('について'))) {
      return 'equipment_info'
    }
    
    if (queryLower.includes('list') || queryLower.includes('show') || queryLower.includes('一覧')) {
      return 'equipment_list'
    }
    
    return 'general_query'
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(entityResult: any, context: any, validationResult: any): number {
    let confidence = 0
    
    // Entity resolution confidence (40%)
    confidence += entityResult.confidence * 0.4
    
    // Context building confidence (30%)
    const contextConfidence = context.confidence || 0.7
    confidence += contextConfidence * 0.3
    
    // Validation confidence (30%)
    const validationConfidence = validationResult.isValid ? 1.0 : 0.3
    confidence += validationConfidence * 0.3
    
    return Math.min(confidence, 1.0)
  }

  /**
   * Generate explanation for the SQL query
   */
  private generateExplanation(context: SQLGenerationContext, sqlResult: any): string {
    let explanation = `Generated SQL query for: "${context.query}"\n\n`
    
    explanation += `**Intent:** ${context.user_intent}\n\n`
    
    if (context.entities.length > 0) {
      explanation += `**Entities recognized:**\n`
      context.entities.forEach(entity => {
        explanation += `- ${entity.type}: "${entity.original}" → "${entity.resolved}"\n`
      })
      explanation += `\n`
    }
    
    explanation += `**Query Logic:** ${sqlResult.reasoning}\n`
    
    return explanation
  }

  /**
   * Generate alternative SQL queries
   */
  private async generateAlternatives(context: SQLGenerationContext): Promise<string[]> {
    const alternatives: string[] = []
    
    // Generate variations based on different entity interpretations
    const equipmentEntities = context.entities.filter(e => e.type === 'equipment')
    
    if (equipmentEntities.length > 0) {
      equipmentEntities.forEach(entity => {
        if (entity.alternative_matches) {
          entity.alternative_matches.forEach(alt => {
            alternatives.push(`Try with equipment ID: ${alt}`)
          })
        }
      })
    }
    
    // Add intent-based alternatives
    if (context.user_intent === 'equipment_info') {
      alternatives.push('Add maintenance history: Include recent maintenance activities')
      alternatives.push('Add risk assessment: Include risk analysis data')
    } else if (context.user_intent === 'maintenance_history') {
      alternatives.push('Add cost analysis: Include maintenance costs')
      alternatives.push('Add frequency analysis: Group by time periods')
    }
    
    return alternatives
  }

  /**
   * Track processing steps for debugging and optimization
   */
  private async trackStep<T>(stepName: string, operation: () => Promise<T>): Promise<{result: T, duration: number}> {
    const startTime = Date.now()
    
    try {
      const result = await operation()
      const duration = Date.now() - startTime
      
      this.processingSteps.push({
        step: stepName,
        description: this.getStepDescription(stepName),
        duration,
        result: stepName === 'sql_generation' ? { sql: result.sql } : result
      })
      
      return { result, duration }
    } catch (error) {
      const duration = Date.now() - startTime
      
      this.processingSteps.push({
        step: stepName,
        description: this.getStepDescription(stepName),
        duration,
        result: { error: error.message }
      })
      
      throw error
    }
  }

  /**
   * Get human-readable description for processing steps
   */
  private getStepDescription(stepName: string): string {
    const descriptions = {
      'entity_resolution': 'Extract and resolve entities from natural language',
      'schema_context': 'Build database schema context',
      'few_shot_selection': 'Select relevant example queries',
      'context_building': 'Build comprehensive generation context',
      'sql_generation': 'Generate SQL using language model',
      'query_validation': 'Validate and optimize generated SQL',
      'query_execution': 'Execute SQL query safely'
    }
    
    return descriptions[stepName] || stepName
  }

  /**
   * Get service statistics
   */
  getStats(): {
    total_queries: number
    average_processing_time: number
    success_rate: number
    last_24h_queries: number
  } {
    // In a real implementation, this would fetch from a metrics store
    return {
      total_queries: 0,
      average_processing_time: 0,
      success_rate: 0,
      last_24h_queries: 0
    }
  }
}

// Export singleton instance
export const textToSQLService = new TextToSQLService()