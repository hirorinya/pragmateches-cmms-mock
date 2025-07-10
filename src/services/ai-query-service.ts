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
    
    try {
      // Try OpenAI API first
      const openaiResponse = await this.tryOpenAI(query)
      if (openaiResponse) {
        openaiResponse.execution_time = Date.now() - startTime
        openaiResponse.source = 'openai'
        return openaiResponse
      }
    } catch (error) {
      console.warn('OpenAI API failed, falling back to mock service:', error)
    }

    // Fallback to mock service
    if (!this.mockService) {
      await this.initializeMockService()
    }
    
    const mockResponse = await this.mockService.processQuery(query)
    mockResponse.source = 'mock'
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
    // Try to extract structured data from OpenAI response
    const intent = this.detectIntentFromResponse(aiResponse)
    const confidence = this.calculateConfidence(aiResponse)
    
    // Extract equipment mentions
    const equipmentMatches = aiResponse.match(/[EPT]-\d+/g) || []
    
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