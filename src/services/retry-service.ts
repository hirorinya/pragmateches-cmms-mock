/**
 * Comprehensive Retry Service with Exponential Backoff
 * Handles retry logic for all external API calls and database operations
 */

interface RetryConfig {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
  exponentialBase: number
  jitterMs: number
  retryableErrors: string[]
  circuitBreakerThreshold?: number
}

interface RetryContext {
  attempt: number
  totalElapsed: number
  lastError?: Error
  service: string
  operation: string
}

interface RetryResult<T> {
  success: boolean
  result?: T
  error?: Error
  attempts: number
  totalTime: number
  retryLog: string[]
}

export class RetryService {
  private static instance: RetryService
  
  // Retry configurations per service type
  private configs: Map<string, RetryConfig> = new Map([
    ['openai', {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      exponentialBase: 2,
      jitterMs: 500,
      retryableErrors: [
        '429', 'rate limit', 'timeout', 'network', 'connection',
        'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'temporary'
      ],
      circuitBreakerThreshold: 5
    }],
    ['supabase', {
      maxAttempts: 4,
      baseDelayMs: 500,
      maxDelayMs: 10000,
      exponentialBase: 1.5,
      jitterMs: 200,
      retryableErrors: [
        'connection', 'timeout', 'network', 'temporary',
        'PGRST', '503', '502', '504', 'unavailable'
      ],
      circuitBreakerThreshold: 10
    }],
    ['text_generation', {
      maxAttempts: 2,
      baseDelayMs: 2000,
      maxDelayMs: 20000,
      exponentialBase: 2,
      jitterMs: 1000,
      retryableErrors: [
        '429', 'rate limit', 'timeout', 'overloaded',
        'busy', 'temporary', 'network'
      ]
    }],
    ['database_query', {
      maxAttempts: 3,
      baseDelayMs: 300,
      maxDelayMs: 5000,
      exponentialBase: 1.8,
      jitterMs: 100,
      retryableErrors: [
        'connection', 'timeout', 'lock', 'deadlock',
        'temporary', 'busy', 'unavailable'
      ]
    }]
  ])

  // Circuit breaker state tracking
  private failureCounts: Map<string, number> = new Map()
  private circuitState: Map<string, 'closed' | 'open' | 'half-open'> = new Map()
  private lastFailureTime: Map<string, number> = new Map()

  constructor() {
    if (RetryService.instance) {
      return RetryService.instance
    }
    RetryService.instance = this
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    serviceType: string,
    operation: () => Promise<T>,
    operationName: string = 'unknown',
    customConfig?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const config = { ...this.configs.get(serviceType)!, ...customConfig }
    const startTime = Date.now()
    const retryLog: string[] = []
    
    // Check circuit breaker
    if (this.isCircuitOpen(serviceType)) {
      const error = new Error(`Circuit breaker is open for ${serviceType}`)
      return {
        success: false,
        error,
        attempts: 0,
        totalTime: Date.now() - startTime,
        retryLog: [`Circuit breaker open for ${serviceType}`]
      }
    }

    let lastError: Error
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      const context: RetryContext = {
        attempt,
        totalElapsed: Date.now() - startTime,
        lastError,
        service: serviceType,
        operation: operationName
      }

      try {
        retryLog.push(`Attempt ${attempt}/${config.maxAttempts} for ${serviceType}.${operationName}`)
        
        const result = await operation()
        
        // Success - reset failure count and close circuit
        this.onSuccess(serviceType)
        
        retryLog.push(`✅ Success on attempt ${attempt}`)
        return {
          success: true,
          result,
          attempts: attempt,
          totalTime: Date.now() - startTime,
          retryLog
        }

      } catch (error: any) {
        lastError = error
        retryLog.push(`❌ Attempt ${attempt} failed: ${error.message}`)
        
        // Check if error is retryable
        if (!this.isRetryableError(error, config)) {
          retryLog.push(`Non-retryable error, aborting`)
          this.onFailure(serviceType)
          return {
            success: false,
            error,
            attempts: attempt,
            totalTime: Date.now() - startTime,
            retryLog
          }
        }

        // Last attempt failed
        if (attempt === config.maxAttempts) {
          retryLog.push(`Max attempts reached, operation failed`)
          this.onFailure(serviceType)
          return {
            success: false,
            error,
            attempts: attempt,
            totalTime: Date.now() - startTime,
            retryLog
          }
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, config, context)
        retryLog.push(`Waiting ${delay}ms before retry...`)
        
        await this.sleep(delay)
      }
    }

    // Should never reach here, but TypeScript requires it
    return {
      success: false,
      error: lastError!,
      attempts: config.maxAttempts,
      totalTime: Date.now() - startTime,
      retryLog
    }
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any, config: RetryConfig): boolean {
    const errorMessage = error.message?.toLowerCase() || ''
    const errorCode = error.code?.toString() || ''
    const errorStatus = error.status?.toString() || error.response?.status?.toString() || ''
    
    return config.retryableErrors.some(pattern => 
      errorMessage.includes(pattern.toLowerCase()) ||
      errorCode.includes(pattern) ||
      errorStatus.includes(pattern)
    )
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig, context: RetryContext): number {
    // Base exponential backoff
    const exponentialDelay = config.baseDelayMs * Math.pow(config.exponentialBase, attempt - 1)
    
    // Add jitter to avoid thundering herd
    const jitter = Math.random() * config.jitterMs
    
    // Cap at maximum delay
    const totalDelay = Math.min(exponentialDelay + jitter, config.maxDelayMs)
    
    return Math.round(totalDelay)
  }

  /**
   * Sleep for specified milliseconds
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Handle successful operation
   */
  private onSuccess(serviceType: string): void {
    this.failureCounts.set(serviceType, 0)
    this.circuitState.set(serviceType, 'closed')
    this.lastFailureTime.delete(serviceType)
  }

  /**
   * Handle failed operation
   */
  private onFailure(serviceType: string): void {
    const currentFailures = this.failureCounts.get(serviceType) || 0
    const newFailures = currentFailures + 1
    
    this.failureCounts.set(serviceType, newFailures)
    this.lastFailureTime.set(serviceType, Date.now())
    
    const config = this.configs.get(serviceType)
    if (config?.circuitBreakerThreshold && newFailures >= config.circuitBreakerThreshold) {
      this.circuitState.set(serviceType, 'open')
      console.warn(`🔴 Circuit breaker opened for ${serviceType} after ${newFailures} failures`)
    }
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(serviceType: string): boolean {
    const state = this.circuitState.get(serviceType) || 'closed'
    
    if (state === 'closed') {
      return false
    }
    
    if (state === 'open') {
      // Check if we should try half-open
      const lastFailure = this.lastFailureTime.get(serviceType) || 0
      const timeoutMs = 60000 // 1 minute circuit breaker timeout
      
      if (Date.now() - lastFailure > timeoutMs) {
        this.circuitState.set(serviceType, 'half-open')
        console.log(`🟡 Circuit breaker half-open for ${serviceType}`)
        return false
      }
      
      return true
    }
    
    // half-open state - allow one attempt
    return false
  }

  /**
   * Manually reset circuit breaker
   */
  resetCircuitBreaker(serviceType: string): void {
    this.failureCounts.set(serviceType, 0)
    this.circuitState.set(serviceType, 'closed')
    this.lastFailureTime.delete(serviceType)
    console.log(`🟢 Circuit breaker manually reset for ${serviceType}`)
  }

  /**
   * Get retry statistics for a service
   */
  getServiceStats(serviceType: string): {
    failures: number
    circuitState: string
    lastFailure?: number
    isRetryable: boolean
  } {
    return {
      failures: this.failureCounts.get(serviceType) || 0,
      circuitState: this.circuitState.get(serviceType) || 'closed',
      lastFailure: this.lastFailureTime.get(serviceType),
      isRetryable: !this.isCircuitOpen(serviceType)
    }
  }

  /**
   * Update retry configuration
   */
  updateConfig(serviceType: string, config: Partial<RetryConfig>): void {
    const currentConfig = this.configs.get(serviceType)
    if (!currentConfig) {
      throw new Error(`Unknown service type: ${serviceType}`)
    }
    
    this.configs.set(serviceType, { ...currentConfig, ...config })
    console.log(`Retry config updated for ${serviceType}`)
  }

  /**
   * Get all service statistics
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {}
    
    for (const serviceType of this.configs.keys()) {
      stats[serviceType] = this.getServiceStats(serviceType)
    }
    
    return stats
  }

  /**
   * Helper method for common OpenAI API calls
   */
  async retryOpenAICall<T>(operation: () => Promise<T>, operationName: string = 'openai_call'): Promise<T> {
    const result = await this.executeWithRetry('openai', operation, operationName)
    
    if (!result.success) {
      console.error(`OpenAI operation failed after retries:`, {
        operation: operationName,
        attempts: result.attempts,
        totalTime: result.totalTime,
        error: result.error?.message,
        retryLog: result.retryLog
      })
      throw result.error
    }
    
    return result.result!
  }

  /**
   * Helper method for common Supabase calls
   */
  async retrySupabaseCall<T>(operation: () => Promise<T>, operationName: string = 'supabase_query'): Promise<T> {
    const result = await this.executeWithRetry('supabase', operation, operationName)
    
    if (!result.success) {
      console.error(`Supabase operation failed after retries:`, {
        operation: operationName,
        attempts: result.attempts,
        totalTime: result.totalTime,
        error: result.error?.message,
        retryLog: result.retryLog
      })
      throw result.error
    }
    
    return result.result!
  }

  /**
   * Reset all failure counters and circuit breakers
   */
  resetAll(): void {
    this.failureCounts.clear()
    this.circuitState.clear()
    this.lastFailureTime.clear()
    console.log('All retry service state reset')
  }
}

// Export singleton instance
export const retryService = new RetryService()