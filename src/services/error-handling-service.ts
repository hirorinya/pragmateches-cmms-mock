/**
 * Centralized Error Handling Service
 * Provides contextual error messages and recovery guidance for AI system failures
 */

export interface AIQueryResponse {
  query: string
  intent: string
  confidence: number
  results: any[]
  summary: string
  recommendations?: string[]
  execution_time: number
  source: 'database' | 'ai' | 'hybrid' | 'error_handler'
  context?: any
}

export interface ErrorContext {
  query: string
  intent?: string
  user_id?: string
  timestamp: number
  attempt_count?: number
  previous_errors?: string[]
}

export interface ErrorClassification {
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  is_retryable: boolean
  user_actionable: boolean
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService
  private errorHistory: Map<string, any[]> = new Map()
  private readonly MAX_ERROR_HISTORY = 100

  constructor() {
    if (ErrorHandlingService.instance) {
      return ErrorHandlingService.instance
    }
    ErrorHandlingService.instance = this
  }

  /**
   * Main error handling entry point
   */
  static handleAIServiceError(error: any, context: ErrorContext): AIQueryResponse {
    const service = new ErrorHandlingService()
    return service.processError(error, context)
  }

  /**
   * Process error and generate appropriate response
   */
  private processError(error: any, context: ErrorContext): AIQueryResponse {
    console.error('🚨 Processing AI service error:', error)
    
    // Record error for analysis
    this.recordError(error, context)
    
    // Classify the error
    const classification = this.classifyError(error)
    
    // Generate user-friendly response
    const response = this.generateErrorResponse(error, context, classification)
    
    // Log for monitoring
    this.logErrorForMonitoring(error, context, classification)
    
    return response
  }

  /**
   * Classify error type and determine handling strategy
   */
  private classifyError(error: any): ErrorClassification {
    const errorMessage = error.message?.toLowerCase() || ''
    const errorStack = error.stack?.toLowerCase() || ''
    
    // API Configuration Errors
    if (errorMessage.includes('api key') || errorMessage.includes('openai_api_key')) {
      return {
        type: 'API_CONFIG',
        severity: 'critical',
        is_retryable: false,
        user_actionable: false
      }
    }
    
    // Rate Limiting
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return {
        type: 'RATE_LIMIT',
        severity: 'medium',
        is_retryable: true,
        user_actionable: true
      }
    }
    
    // Network/Timeout Issues
    if (errorMessage.includes('timeout') || errorMessage.includes('network') || 
        errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      return {
        type: 'NETWORK',
        severity: 'medium',
        is_retryable: true,
        user_actionable: true
      }
    }
    
    // Server Errors
    if (errorMessage.includes('502') || errorMessage.includes('503') || 
        errorMessage.includes('504') || errorMessage.includes('server')) {
      return {
        type: 'SERVER_ERROR',
        severity: 'high',
        is_retryable: true,
        user_actionable: false
      }
    }
    
    // Database Errors
    if (errorMessage.includes('database') || errorMessage.includes('supabase') ||
        errorMessage.includes('sql') || errorMessage.includes('query')) {
      return {
        type: 'DATABASE',
        severity: 'high',
        is_retryable: false,
        user_actionable: false
      }
    }
    
    // Parsing/Response Errors
    if (errorMessage.includes('parse') || errorMessage.includes('json') ||
        errorMessage.includes('invalid response') || errorMessage.includes('empty')) {
      return {
        type: 'PARSING',
        severity: 'medium',
        is_retryable: true,
        user_actionable: true
      }
    }
    
    // Authentication/Permission Errors
    if (errorMessage.includes('401') || errorMessage.includes('403') ||
        errorMessage.includes('unauthorized') || errorMessage.includes('permission')) {
      return {
        type: 'AUTH',
        severity: 'high',
        is_retryable: false,
        user_actionable: false
      }
    }
    
    // Default unknown error
    return {
      type: 'UNKNOWN',
      severity: 'medium',
      is_retryable: false,
      user_actionable: true
    }
  }

  /**
   * Generate user-friendly error response
   */
  private generateErrorResponse(error: any, context: ErrorContext, classification: ErrorClassification): AIQueryResponse {
    const summary = this.getUserFriendlyMessage(classification, context)
    const recommendations = this.getRecoveryActions(classification, context, error)
    const alternativeSuggestions = this.generateAlternativeSuggestions(context)
    
    return {
      query: context.query,
      intent: 'ERROR',
      confidence: 0,
      results: [],
      summary,
      recommendations: [...recommendations, ...alternativeSuggestions],
      execution_time: 0,
      source: 'error_handler',
      context: {
        error_type: classification.type,
        severity: classification.severity,
        is_retryable: classification.is_retryable,
        user_actionable: classification.user_actionable,
        timestamp: context.timestamp,
        debug_info: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    }
  }

  /**
   * Generate user-friendly error messages
   */
  private getUserFriendlyMessage(classification: ErrorClassification, context: ErrorContext): string {
    const messages = {
      'API_CONFIG': {
        title: 'AI Service Configuration Issue',
        description: 'The AI service is temporarily unavailable due to a configuration issue. We\'ve switched to our backup database search system to help you find the information you need.'
      },
      'RATE_LIMIT': {
        title: 'High Demand Detected',
        description: 'Many users are currently using the AI assistant. Please wait a moment and try your query again. Your request will be processed shortly.'
      },
      'NETWORK': {
        title: 'Connection Issue',
        description: 'We\'re experiencing a temporary connection issue with our AI service. Please check your network connection and try again in a few moments.'
      },
      'SERVER_ERROR': {
        title: 'Service Temporarily Unavailable',
        description: 'Our AI service is experiencing temporary difficulties. We\'re working to resolve this quickly. In the meantime, try using our database search system.'
      },
      'DATABASE': {
        title: 'Database Query Issue',
        description: 'There was an issue accessing the equipment database. Please try rephrasing your question or contact support if the problem persists.'
      },
      'PARSING': {
        title: 'Response Processing Issue',
        description: 'We received a response from the AI service but had trouble understanding it. Please try rephrasing your question in a different way.'
      },
      'AUTH': {
        title: 'Authentication Required',
        description: 'Access to the AI service requires proper authentication. Please contact your system administrator to resolve this issue.'
      },
      'UNKNOWN': {
        title: 'Unexpected Issue',
        description: 'An unexpected issue occurred while processing your request. Please try rephrasing your question or contact support for assistance.'
      }
    }
    
    const message = messages[classification.type] || messages['UNKNOWN']
    
    return `## ${message.title}\n\n${message.description}`
  }

  /**
   * Generate specific recovery actions based on error type
   */
  private getRecoveryActions(classification: ErrorClassification, context: ErrorContext, error: any): string[] {
    const baseActions = {
      'API_CONFIG': [
        'Try using simpler queries that can be handled by our database search',
        'Contact system administrator to check AI service configuration',
        'Use specific equipment IDs (like HX-101) for direct database queries'
      ],
      'RATE_LIMIT': [
        'Wait 30-60 seconds and try your query again',
        'Try breaking complex queries into simpler parts',
        'Use specific equipment IDs to bypass the AI service'
      ],
      'NETWORK': [
        'Check your internet connection',
        'Try again in 1-2 minutes',
        'Use simpler queries that can work offline'
      ],
      'SERVER_ERROR': [
        'Try again in a few minutes',
        'Use our backup database search instead',
        'Contact support if the issue persists'
      ],
      'DATABASE': [
        'Try rephrasing your question',
        'Use specific equipment IDs (e.g., "show equipment HX-101")',
        'Check that the equipment or system names are correct'
      ],
      'PARSING': [
        'Rephrase your question more simply',
        'Try using specific equipment IDs or system names',
        'Break complex requests into multiple simpler questions'
      ],
      'AUTH': [
        'Contact your system administrator',
        'Check that you have proper access permissions',
        'Try logging out and logging back in'
      ],
      'UNKNOWN': [
        'Try rephrasing your question differently',
        'Use more specific terms (equipment IDs, system names)',
        'Break complex requests into simpler parts',
        'Contact support if the problem continues'
      ]
    }
    
    let actions = baseActions[classification.type] || baseActions['UNKNOWN']
    
    // Add context-specific actions
    if (context.attempt_count && context.attempt_count > 1) {
      actions = [
        `This is attempt #${context.attempt_count}. Consider trying a different approach.`,
        ...actions
      ]
    }
    
    if (this.hasRecentSimilarErrors(context.query)) {
      actions = [
        'Similar queries have been failing recently. Try a different approach.',
        ...actions
      ]
    }
    
    return actions
  }

  /**
   * Generate alternative query suggestions
   */
  private generateAlternativeSuggestions(context: ErrorContext): string[] {
    const suggestions = []
    
    // Equipment ID patterns
    const equipmentMatch = context.query.match(/\b([A-Z]{1,3}-?\d{1,4})\b/i)
    if (equipmentMatch) {
      suggestions.push(`Try: "show details for ${equipmentMatch[1]}"`)
      suggestions.push(`Try: "status of ${equipmentMatch[1]}"`)
    }
    
    // System patterns
    const systemMatch = context.query.match(/\b(SYS-\d{3})\b/i)
    if (systemMatch) {
      suggestions.push(`Try: "list equipment in ${systemMatch[1]}"`)
    }
    
    // General suggestions based on query type
    if (context.query.toLowerCase().includes('maintenance')) {
      suggestions.push('Try: "show recent maintenance history"')
      suggestions.push('Try: "list maintenance for specific equipment ID"')
    }
    
    if (context.query.toLowerCase().includes('risk')) {
      suggestions.push('Try: "show risk assessment for [equipment ID]"')
      suggestions.push('Try: "list high risk equipment"')
    }
    
    if (context.query.toLowerCase().includes('department')) {
      suggestions.push('Try: "show department task status"')
      suggestions.push('Try: "which department has highest completion rate"')
    }
    
    // Add fallback suggestions if no specific ones were generated
    if (suggestions.length === 0) {
      suggestions.push('Try using specific equipment IDs like HX-101, PU-200, or TK-101')
      suggestions.push('Try asking about specific systems like SYS-001 or SYS-002')
      suggestions.push('Try simpler questions about equipment status or maintenance')
    }
    
    return suggestions
  }

  /**
   * Record error for analysis and pattern detection
   */
  private recordError(error: any, context: ErrorContext): void {
    const errorRecord = {
      timestamp: context.timestamp,
      query: context.query,
      error_message: error.message,
      error_type: error.constructor.name,
      stack_trace: error.stack,
      context
    }
    
    const userKey = context.user_id || 'anonymous'
    const userErrors = this.errorHistory.get(userKey) || []
    userErrors.push(errorRecord)
    
    // Keep only recent errors
    if (userErrors.length > this.MAX_ERROR_HISTORY) {
      userErrors.splice(0, userErrors.length - this.MAX_ERROR_HISTORY)
    }
    
    this.errorHistory.set(userKey, userErrors)
  }

  /**
   * Check if there have been similar errors recently
   */
  private hasRecentSimilarErrors(query: string): boolean {
    const recentTime = Date.now() - (10 * 60 * 1000) // Last 10 minutes
    
    for (const userErrors of this.errorHistory.values()) {
      const recentErrors = userErrors.filter(e => e.timestamp > recentTime)
      
      for (const error of recentErrors) {
        // Simple similarity check
        const similarity = this.calculateQuerySimilarity(query, error.query)
        if (similarity > 0.7) {
          return true
        }
      }
    }
    
    return false
  }

  /**
   * Calculate similarity between queries (simple word overlap)
   */
  private calculateQuerySimilarity(query1: string, query2: string): number {
    const words1 = new Set(query1.toLowerCase().split(/\s+/))
    const words2 = new Set(query2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }

  /**
   * Log error for monitoring and alerting
   */
  private logErrorForMonitoring(error: any, context: ErrorContext, classification: ErrorClassification): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: classification.severity,
      service: 'ai-assistant',
      error_type: classification.type,
      query: context.query,
      user_id: context.user_id,
      error_message: error.message,
      is_retryable: classification.is_retryable,
      user_actionable: classification.user_actionable
    }
    
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 AI Service Error Log:', logEntry)
    }
    
    // In production, this would send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service like DataDog, New Relic, etc.
      this.sendToMonitoringService(logEntry)
    }
  }

  /**
   * Send error to external monitoring service
   */
  private sendToMonitoringService(logEntry: any): void {
    // Placeholder for monitoring service integration
    // In real implementation, integrate with:
    // - DataDog: datadog.increment('ai.service.error', 1, ['type:' + logEntry.error_type])
    // - New Relic: newrelic.recordCustomEvent('AIServiceError', logEntry)
    // - Sentry: Sentry.captureException(error, { extra: logEntry })
    console.log('📊 Would send to monitoring service:', logEntry)
  }

  /**
   * Get error statistics for monitoring dashboard
   */
  static getErrorStatistics(): any {
    const service = new ErrorHandlingService()
    const stats = {
      total_errors: 0,
      errors_by_type: {},
      errors_by_severity: {},
      recent_error_rate: 0,
      top_failing_queries: []
    }
    
    const recentTime = Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
    
    for (const userErrors of service.errorHistory.values()) {
      const recentErrors = userErrors.filter(e => e.timestamp > recentTime)
      stats.total_errors += recentErrors.length
      
      for (const error of recentErrors) {
        // Count by type
        const type = error.error_type || 'unknown'
        stats.errors_by_type[type] = (stats.errors_by_type[type] || 0) + 1
        
        // Count by severity (would need classification)
        stats.errors_by_severity['medium'] = (stats.errors_by_severity['medium'] || 0) + 1
      }
    }
    
    return stats
  }
}

// Export singleton instance
export const errorHandlingService = new ErrorHandlingService()