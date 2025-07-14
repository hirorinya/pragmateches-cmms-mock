/**
 * Rate Limiting and Queue Management Service
 * Prevents API abuse and manages request flow for OpenAI and database queries
 */

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  queueLimit: number // Maximum queued requests
  priority: 'low' | 'medium' | 'high'
}

interface QueuedRequest {
  id: string
  timestamp: number
  priority: 'low' | 'medium' | 'high'
  resolve: (value: any) => void
  reject: (reason: any) => void
  request: () => Promise<any>
  timeout: number
}

interface RateLimitStatus {
  requests_in_window: number
  remaining_requests: number
  reset_time: number
  queue_length: number
  estimated_wait_time: number
}

export class RateLimitingService {
  private static instance: RateLimitingService
  
  // Rate limit tracking per service
  private requestCounts: Map<string, number[]> = new Map()
  private requestQueues: Map<string, QueuedRequest[]> = new Map()
  private processingQueues: Map<string, boolean> = new Map()
  
  // Configuration per service type
  private configs: Map<string, RateLimitConfig> = new Map([
    ['openai', {
      windowMs: 60 * 1000, // 1 minute window
      maxRequests: 50, // Conservative limit for OpenAI
      queueLimit: 20, // Max 20 queued requests
      priority: 'high'
    }],
    ['supabase', {
      windowMs: 60 * 1000, // 1 minute window
      maxRequests: 200, // Higher limit for database
      queueLimit: 50, // More queued requests allowed
      priority: 'medium'
    }],
    ['text_to_sql', {
      windowMs: 60 * 1000,
      maxRequests: 30, // Lower for complex SQL generation
      queueLimit: 15,
      priority: 'high'
    }],
    ['pattern_matching', {
      windowMs: 60 * 1000,
      maxRequests: 500, // Very high for local processing
      queueLimit: 100,
      priority: 'low'
    }]
  ])

  constructor() {
    if (RateLimitingService.instance) {
      return RateLimitingService.instance
    }
    RateLimitingService.instance = this
    this.startQueueProcessor()
  }

  /**
   * Execute a request with rate limiting and queuing
   */
  async executeWithRateLimit<T>(
    serviceType: string,
    request: () => Promise<T>,
    priority: 'low' | 'medium' | 'high' = 'medium',
    timeoutMs: number = 30000
  ): Promise<T> {
    const config = this.configs.get(serviceType)
    if (!config) {
      throw new Error(`Unknown service type: ${serviceType}`)
    }

    // Check if we can execute immediately
    if (this.canExecuteNow(serviceType)) {
      try {
        this.recordRequest(serviceType)
        return await Promise.race([
          request(),
          this.createTimeoutPromise(timeoutMs)
        ])
      } catch (error) {
        console.error(`Rate limited request failed for ${serviceType}:`, error)
        throw error
      }
    }

    // Need to queue the request
    return this.queueRequest(serviceType, request, priority, timeoutMs)
  }

  /**
   * Check if a request can be executed immediately
   */
  private canExecuteNow(serviceType: string): boolean {
    const config = this.configs.get(serviceType)!
    const requests = this.requestCounts.get(serviceType) || []
    const now = Date.now()
    
    // Clean old requests outside the window
    const validRequests = requests.filter(timestamp => 
      now - timestamp < config.windowMs
    )
    this.requestCounts.set(serviceType, validRequests)

    return validRequests.length < config.maxRequests
  }

  /**
   * Record a request execution
   */
  private recordRequest(serviceType: string): void {
    const requests = this.requestCounts.get(serviceType) || []
    requests.push(Date.now())
    this.requestCounts.set(serviceType, requests)
  }

  /**
   * Queue a request for later execution
   */
  private async queueRequest<T>(
    serviceType: string,
    request: () => Promise<T>,
    priority: 'low' | 'medium' | 'high',
    timeoutMs: number
  ): Promise<T> {
    const config = this.configs.get(serviceType)!
    const queue = this.requestQueues.get(serviceType) || []

    // Check queue limit
    if (queue.length >= config.queueLimit) {
      throw new Error(`Request queue full for ${serviceType}. Try again later.`)
    }

    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: `${serviceType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        priority,
        resolve,
        reject,
        request: request as () => Promise<any>,
        timeout: timeoutMs
      }

      // Insert based on priority
      this.insertByPriority(queue, queuedRequest)
      this.requestQueues.set(serviceType, queue)

      console.log(`Request queued for ${serviceType}. Queue length: ${queue.length}`)
    })
  }

  /**
   * Insert request into queue based on priority
   */
  private insertByPriority(queue: QueuedRequest[], request: QueuedRequest): void {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const requestPriority = priorityOrder[request.priority]

    let insertIndex = queue.length
    for (let i = 0; i < queue.length; i++) {
      const queuePriority = priorityOrder[queue[i].priority]
      if (requestPriority > queuePriority) {
        insertIndex = i
        break
      }
    }

    queue.splice(insertIndex, 0, request)
  }

  /**
   * Start the queue processor
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      for (const serviceType of this.configs.keys()) {
        this.processQueue(serviceType)
      }
    }, 1000) // Process queues every second
  }

  /**
   * Process queued requests for a service
   */
  private async processQueue(serviceType: string): Promise<void> {
    if (this.processingQueues.get(serviceType)) {
      return // Already processing
    }

    const queue = this.requestQueues.get(serviceType) || []
    if (queue.length === 0 || !this.canExecuteNow(serviceType)) {
      return
    }

    this.processingQueues.set(serviceType, true)

    try {
      const request = queue.shift()!
      this.requestQueues.set(serviceType, queue)

      // Check if request has timed out
      if (Date.now() - request.timestamp > request.timeout) {
        request.reject(new Error('Request timeout in queue'))
        return
      }

      this.recordRequest(serviceType)
      
      try {
        const result = await Promise.race([
          request.request(),
          this.createTimeoutPromise(request.timeout)
        ])
        request.resolve(result)
      } catch (error) {
        request.reject(error)
      }

    } catch (error) {
      console.error(`Queue processing error for ${serviceType}:`, error)
    } finally {
      this.processingQueues.set(serviceType, false)
    }
  }

  /**
   * Create a timeout promise
   */
  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeoutMs}ms`))
      }, timeoutMs)
    })
  }

  /**
   * Get rate limit status for a service
   */
  getRateLimitStatus(serviceType: string): RateLimitStatus {
    const config = this.configs.get(serviceType)
    if (!config) {
      throw new Error(`Unknown service type: ${serviceType}`)
    }

    const requests = this.requestCounts.get(serviceType) || []
    const queue = this.requestQueues.get(serviceType) || []
    const now = Date.now()

    // Clean old requests
    const validRequests = requests.filter(timestamp => 
      now - timestamp < config.windowMs
    )

    const oldestRequest = validRequests[0]
    const resetTime = oldestRequest ? oldestRequest + config.windowMs : now

    return {
      requests_in_window: validRequests.length,
      remaining_requests: Math.max(0, config.maxRequests - validRequests.length),
      reset_time: resetTime,
      queue_length: queue.length,
      estimated_wait_time: this.calculateEstimatedWaitTime(serviceType, queue.length)
    }
  }

  /**
   * Calculate estimated wait time for queued requests
   */
  private calculateEstimatedWaitTime(serviceType: string, queuePosition: number): number {
    const config = this.configs.get(serviceType)!
    const status = this.getRateLimitStatus(serviceType)
    
    if (status.remaining_requests > 0) {
      return 0 // Can execute immediately
    }

    // Estimate based on average processing time and queue position
    const avgProcessingTime = 2000 // 2 seconds average
    const timeUntilReset = Math.max(0, status.reset_time - Date.now())
    const requestsPerSecond = config.maxRequests / (config.windowMs / 1000)
    
    return Math.max(
      timeUntilReset,
      (queuePosition / requestsPerSecond) * 1000 + avgProcessingTime
    )
  }

  /**
   * Update rate limit configuration for a service
   */
  updateConfig(serviceType: string, config: Partial<RateLimitConfig>): void {
    const currentConfig = this.configs.get(serviceType)
    if (!currentConfig) {
      throw new Error(`Unknown service type: ${serviceType}`)
    }

    this.configs.set(serviceType, { ...currentConfig, ...config })
    console.log(`Rate limit config updated for ${serviceType}:`, { ...currentConfig, ...config })
  }

  /**
   * Clear all queues and reset counters (for testing/emergency)
   */
  reset(): void {
    this.requestCounts.clear()
    this.requestQueues.clear()
    this.processingQueues.clear()
    console.log('Rate limiting service reset')
  }

  /**
   * Get comprehensive status for all services
   */
  getAllServiceStatus(): Record<string, RateLimitStatus> {
    const status: Record<string, RateLimitStatus> = {}
    
    for (const serviceType of this.configs.keys()) {
      status[serviceType] = this.getRateLimitStatus(serviceType)
    }
    
    return status
  }

  /**
   * Check if system is under heavy load
   */
  isSystemUnderLoad(): boolean {
    const statuses = this.getAllServiceStatus()
    
    // System is under load if any service has:
    // - Queue length > 50% of limit
    // - Less than 25% remaining requests
    return Object.entries(statuses).some(([serviceType, status]) => {
      const config = this.configs.get(serviceType)!
      const queueThreshold = config.queueLimit * 0.5
      const requestThreshold = config.maxRequests * 0.25
      
      return status.queue_length > queueThreshold || 
             status.remaining_requests < requestThreshold
    })
  }
}

// Export singleton instance
export const rateLimitingService = new RateLimitingService()