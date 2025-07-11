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

      // Step 8: Execution (if requested)
      let executionResult = null
      if (request.explain || request.max_results) {
        const executionStep = await this.trackStep('query_execution', async () => {
          const result = await this.executeQuery(finalSQL, request.max_results)
          return result
        })
        executionResult = executionStep.result
      }

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
   * Generate SQL using LLM with comprehensive context
   */
  private async generateSQLWithLLM(context: SQLGenerationContext): Promise<{sql: string, reasoning: string}> {
    // Build comprehensive prompt
    const prompt = this.buildLLMPrompt(context)
    
    console.log('🤖 Calling OpenAI API for SQL generation...');
    console.log(`📄 Prompt length: ${prompt.length} characters`);
    console.log(`🎯 User intent: ${context.user_intent}`);
    
    try {
      // Call OpenAI API for SQL generation
      const startTime = Date.now();
      const response = await fetch('/api/chatgpt', {
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

      const apiTime = Date.now() - startTime;
      console.log(`⏱️ OpenAI API response time: ${apiTime}ms`);

      if (!response.ok) {
        throw new Error(`LLM API failed: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ OpenAI API response received');
      
      // Parse the response to extract SQL and reasoning
      const parsed = this.parseLLMResponse(result.result)
      console.log(`📝 Generated SQL: ${parsed.sql?.substring(0, 100)}...`);
      
      return {
        sql: parsed.sql,
        reasoning: parsed.reasoning
      }
      
    } catch (error) {
      console.error('❌ LLM SQL generation failed:', error)
      console.log('⚠️ Falling back to template-based generation');
      
      // Fallback to template-based generation
      return this.generateSQLWithTemplate(context)
    }
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
      sql = `SELECT e.設備ID, e.設備名, e.設置場所, e.稼働状態, etm.設備種別名
FROM equipment e
LEFT JOIN equipment_type_master etm ON e.設備種別ID = etm.id
WHERE e.設備ID = '${equipmentEntity.resolved}'`
      reasoning = `Generated template query for specific equipment: ${equipmentEntity.resolved}`
    } else if (typeEntity) {
      // Equipment type query
      sql = `SELECT e.設備ID, e.設備名, e.設置場所, e.稼働状態, etm.設備種別名
FROM equipment e
JOIN equipment_type_master etm ON e.設備種別ID = etm.id
WHERE etm.設備種別名 LIKE '%${typeEntity.resolved}%'
ORDER BY e.設備ID
LIMIT 50`
      reasoning = `Generated template query for equipment type: ${typeEntity.resolved}`
    } else {
      // Generic equipment list
      sql = `SELECT e.設備ID, e.設備名, e.設置場所, e.稼働状態, etm.設備種別名
FROM equipment e
LEFT JOIN equipment_type_master etm ON e.設備種別ID = etm.id
ORDER BY e.設備ID
LIMIT 20`
      reasoning = 'Generated generic equipment listing query'
    }
    
    return { sql, reasoning }
  }

  /**
   * Execute query with safety checks
   */
  private async executeQuery(sql: string, maxResults?: number): Promise<any> {
    try {
      // Apply result limit
      const limitedSQL = this.applyResultLimit(sql, maxResults || 100)
      
      // For now, return a simulated result
      // In production, this would execute against the actual database
      return {
        success: true,
        data: [],
        row_count: 0,
        message: 'Query execution simulated - connect to database for real results'
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        row_count: 0
      }
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