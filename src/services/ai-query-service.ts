// Enhanced AI Query Service with OpenAI integration
// Falls back to enhanced AI service and then database service if OpenAI is not available

interface AIQueryResponse {
  query: string
  intent: string
  confidence: number
  results: any[]
  summary: string
  recommendations?: string[]
  execution_time: number
  source: 'openai' | 'enhanced_ai' | 'database'
}

export class AIQueryService {
  private databaseService: any
  private enhancedAIService: any

  constructor() {
    // Import services for fallback
    this.initializeServices()
  }

  private async initializeServices() {
    const { AIDatabaseService } = await import('./ai-database-service')
    const { enhancedAIService } = await import('./enhanced-ai-service')
    this.databaseService = new AIDatabaseService()
    this.enhancedAIService = enhancedAIService
  }

  /**
   * Main query processing function
   * Database-first approach: Enhanced AI → Database → OpenAI (last resort)
   */
  async processQuery(query: string): Promise<AIQueryResponse> {
    const startTime = Date.now()
    
    // Always ensure services are available
    if (!this.databaseService || !this.enhancedAIService) {
      await this.initializeServices()
    }
    
    try {
      // Try enhanced AI service first (has database access and better understanding)
      const enhancedResponse = await this.enhancedAIService.processQuery(query)
      enhancedResponse.execution_time = Date.now() - startTime
      enhancedResponse.source = 'enhanced_ai'
      console.log('✅ Enhanced AI service response successful')
      return enhancedResponse
    } catch (error) {
      console.warn('❌ Enhanced AI service failed, trying basic database service:', error.message)
    }

    try {
      // Fallback to basic database service (reliable database queries)
      const databaseResponse = await this.databaseService.processQuery(query)
      databaseResponse.execution_time = Date.now() - startTime
      databaseResponse.source = 'database'
      console.log('✅ Database service response successful')
      return databaseResponse
    } catch (error) {
      console.warn('❌ Database service failed, trying OpenAI as last resort:', error.message)
    }

    try {
      // Last resort: OpenAI API (only for completely unknown queries)
      const openaiPromise = this.tryOpenAI(query)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI timeout')), 5000)
      )
      
      const openaiResponse = await Promise.race([openaiPromise, timeoutPromise]) as AIQueryResponse | null
      
      if (openaiResponse && openaiResponse.summary && openaiResponse.intent && openaiResponse !== null) {
        openaiResponse.execution_time = Date.now() - startTime
        openaiResponse.source = 'openai'
        console.log('⚠️ OpenAI response used as last resort')
        return openaiResponse
      } else {
        throw new Error('OpenAI response incomplete or malformed')
      }
    } catch (error) {
      console.error('❌ All AI services failed:', error.message)
    }

    // Final error response
    return {
      query,
      intent: 'ERROR',
      confidence: 0,
      results: [],
      summary: 'Unable to process query. All AI services failed.',
      recommendations: ['Try rephrasing your question', 'Check system status'],
      execution_time: Date.now() - startTime,
      source: 'database'
    }
  }

  /**
   * Try to use OpenAI API for intelligent responses
   */
  private async tryOpenAI(query: string): Promise<AIQueryResponse | null> {
    try {
      const response = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'cmms_query',
          prompt: query,
          data: {
            // Include relevant CMMS context
            equipment_types: ['HEAT_EXCHANGER', 'PUMP', 'TANK'],
            systems: ['SYS-001', 'SYS-002', 'SYS-003', 'SYS-004', 'SYS-005'],
            instruments: ['TI-201', 'PI-101', 'FI-301'],
            departments: ['REFINERY', 'MAINTENANCE'],
            query_context: 'CMMS maintenance management system'
          }
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API failed: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }

      // Parse OpenAI response and format it
      return this.parseOpenAIResponse(query, result.result)
      
    } catch (error) {
      console.error('OpenAI API error:', error)
      return null
    }
  }

  /**
   * Parse OpenAI response into our expected format
   */
  private parseOpenAIResponse(query: string, aiResponse: string): AIQueryResponse {
    try {
      // Clean up the response - remove any markdown formatting
      let cleanResponse = aiResponse.trim()
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/\s*```$/, '')
      }
      
      // Try to fix truncated JSON
      if (cleanResponse.startsWith('{') && !cleanResponse.endsWith('}')) {
        console.warn('Truncated JSON detected, attempting fallback')
        throw new Error('Truncated JSON response')
      }
      
      // Try to parse as JSON first (new structured format)
      const jsonResponse = JSON.parse(cleanResponse)
      
      if (jsonResponse.intent && jsonResponse.summary) {
        // Ensure results is always an array
        let results = jsonResponse.results || []
        if (!Array.isArray(results) && typeof results === 'object') {
          results = [results]
        }
        
        return {
          query,
          intent: jsonResponse.intent,
          confidence: jsonResponse.confidence || 0.85,
          results,
          summary: jsonResponse.summary,
          recommendations: jsonResponse.recommendations || [],
          execution_time: 0, // Will be set by caller
          source: 'openai'
        }
      }
    } catch (error) {
      console.warn('OpenAI JSON parsing failed, falling back to mock service:', error.message)
      // Return null to trigger fallback to mock service
      return null as any
    }
    
    // Fallback to text parsing for older format responses
    const intent = this.detectIntentFromResponse(aiResponse)
    const confidence = this.calculateConfidence(aiResponse)
    
    // Extract recommendations (lines starting with "-" or numbered items)
    const recommendationMatches = aiResponse.match(/(?:^|\n)[-•*]\s*(.+)|(?:^|\n)\d+\.\s*(.+)/gm) || []
    const recommendations = recommendationMatches.map(match => 
      match.replace(/^[-•*\d.\s]+/, '').trim()
    ).filter(rec => rec.length > 0)

    return {
      query,
      intent,
      confidence,
      results: this.extractResultsFromResponse(aiResponse, intent),
      summary: this.extractSummaryFromResponse(aiResponse),
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      execution_time: 0, // Will be set by caller
      source: 'openai'
    }
  }

  private detectIntentFromResponse(response: string): string {
    const lowerResponse = response.toLowerCase()
    
    if (lowerResponse.includes('coverage') || lowerResponse.includes('missing') || lowerResponse.includes('gap')) {
      return 'COVERAGE_ANALYSIS'
    }
    if (lowerResponse.includes('implementation') || lowerResponse.includes('status') || lowerResponse.includes('mitigation')) {
      return 'MITIGATION_STATUS'
    }
    if (lowerResponse.includes('impact') || lowerResponse.includes('affected') || lowerResponse.includes('cascade')) {
      return 'IMPACT_ANALYSIS'
    }
    return 'GENERAL_ANALYSIS'
  }

  private calculateConfidence(response: string): number {
    // Simple confidence calculation based on response characteristics
    let confidence = 0.5
    
    if (response.includes('equipment') || response.includes('maintenance')) confidence += 0.2
    if (response.includes('risk') || response.includes('failure')) confidence += 0.15
    if (response.includes('E-') || response.includes('P-') || response.includes('T-')) confidence += 0.1
    if (response.length > 100) confidence += 0.05
    
    return Math.min(confidence, 0.95)
  }

  private extractResultsFromResponse(response: string, intent: string): any[] {
    // Extract equipment IDs
    const equipmentIds = response.match(/[EPT]-\d+/g) || []
    
    if (intent === 'COVERAGE_ANALYSIS') {
      return equipmentIds.map(id => ({
        equipment_id: id,
        equipment_type: 'HEAT_EXCHANGER',
        missing_risk: 'Identified by AI analysis',
        ai_analysis: true
      }))
    }
    
    if (intent === 'IMPACT_ANALYSIS') {
      return equipmentIds.map(id => ({
        equipment_id: id,
        impact_level: 'MEDIUM',
        ai_analysis: true
      }))
    }
    
    return [{
      analysis_type: intent,
      ai_response: response.substring(0, 200) + '...',
      equipment_count: equipmentIds.length
    }]
  }

  private extractSummaryFromResponse(response: string): string {
    // Extract first paragraph or first sentence as summary
    const sentences = response.split(/[.!?]+/)
    const firstSentence = sentences[0]?.trim()
    
    if (firstSentence && firstSentence.length > 20) {
      return firstSentence + '.'
    }
    
    // Fallback to first 150 characters
    return response.substring(0, 150).trim() + (response.length > 150 ? '...' : '')
  }
}

// Export singleton instance
export const aiQueryService = new AIQueryService()