// Enhanced AI Query Service with OpenAI integration
// Falls back to mock responses if OpenAI is not available

interface AIQueryResponse {
  query: string
  intent: string
  confidence: number
  results: any[]
  summary: string
  recommendations?: string[]
  execution_time: number
  source: 'openai' | 'mock'
}

export class AIQueryService {
  private mockService: any

  constructor() {
    // Import mock service for fallback
    this.initializeMockService()
  }

  private async initializeMockService() {
    const { AIQueryMockService } = await import('./ai-query-mock')
    this.mockService = new AIQueryMockService()
  }

  /**
   * Main query processing function
   * Tries OpenAI first, falls back to mock service
   */
  async processQuery(query: string): Promise<AIQueryResponse> {
    const startTime = Date.now()
    
    // Always ensure mock service is available for fallback
    if (!this.mockService) {
      await this.initializeMockService()
    }
    
    try {
      // Try OpenAI API first (with timeout)
      const openaiPromise = this.tryOpenAI(query)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI timeout')), 8000)
      )
      
      const openaiResponse = await Promise.race([openaiPromise, timeoutPromise]) as AIQueryResponse | null
      
      if (openaiResponse && openaiResponse.summary && openaiResponse.intent) {
        openaiResponse.execution_time = Date.now() - startTime
        openaiResponse.source = 'openai'
        console.log('✅ OpenAI response successful')
        return openaiResponse
      } else {
        console.warn('⚠️ OpenAI response incomplete, using mock fallback')
        throw new Error('Incomplete OpenAI response')
      }
    } catch (error) {
      console.warn('❌ OpenAI failed, using reliable mock service:', error.message)
    }

    // Reliable fallback to mock service
    const mockResponse = await this.mockService.processQuery(query)
    mockResponse.execution_time = Date.now() - startTime
    mockResponse.source = 'mock'
    console.log('✅ Mock service response successful')
    return mockResponse
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
            systems: ['SYS-001', 'SYS-002'],
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
      // Try to parse as JSON first (new structured format)
      const jsonResponse = JSON.parse(aiResponse)
      
      if (jsonResponse.intent && jsonResponse.summary) {
        return {
          query,
          intent: jsonResponse.intent,
          confidence: jsonResponse.confidence || 0.85,
          results: jsonResponse.results || [],
          summary: jsonResponse.summary,
          recommendations: jsonResponse.recommendations,
          execution_time: 0, // Will be set by caller
          source: 'openai'
        }
      }
    } catch (error) {
      console.warn('OpenAI response is not JSON, parsing as text:', error)
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