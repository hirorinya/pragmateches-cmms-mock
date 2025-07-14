/**
 * Circuit Breaker Service for External Services
 * Prevents cascading failures and provides fast-fail behavior for unhealthy services
 */

interface CircuitBreakerConfig {
  failureThreshold: number // Number of failures before opening circuit
  recoveryTimeout: number // Time in ms before attempting to recover
  successThreshold: number // Number of successes needed to close circuit in half-open state
  monitoringWindow: number // Time window for failure counting
  volumeThreshold: number // Minimum requests before circuit can open
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open'
  failures: number
  successes: number
  lastFailureTime: number
  lastSuccessTime: number
  requestCount: number
  stateChangeTime: number
}

interface CircuitBreakerMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  rejectedRequests: number
  averageResponseTime: number
  errorRate: number
  uptime: number
}

export class CircuitBreakerService {
  private static instance: CircuitBreakerService
  
  // Circuit breaker configurations per service
  private configs: Map<string, CircuitBreakerConfig> = new Map([
    ['openai', {
      failureThreshold: 5,
      recoveryTimeout: 30000, // 30 seconds
      successThreshold: 3,
      monitoringWindow: 60000, // 1 minute
      volumeThreshold: 10
    }],
    ['supabase', {
      failureThreshold: 8,
      recoveryTimeout: 15000, // 15 seconds
      successThreshold: 5,
      monitoringWindow: 60000,
      volumeThreshold: 20
    }],
    ['external_api', {
      failureThreshold: 3,
      recoveryTimeout: 60000, // 1 minute
      successThreshold: 2,
      monitoringWindow: 120000, // 2 minutes
      volumeThreshold: 5
    }]
  ])

  // Circuit breaker states
  private states: Map<string, CircuitBreakerState> = new Map()
  
  // Metrics tracking
  private metrics: Map<string, CircuitBreakerMetrics> = new Map()
  private requestTimes: Map<string, number[]> = new Map()

  constructor() {
    if (CircuitBreakerService.instance) {
      return CircuitBreakerService.instance
    }
    CircuitBreakerService.instance = this
    this.initializeStates()
    this.startMetricsCollection()
  }

  /**
   * Initialize circuit breaker states for all configured services
   */
  private initializeStates(): void {
    for (const serviceType of this.configs.keys()) {
      this.states.set(serviceType, {
        state: 'closed',
        failures: 0,
        successes: 0,
        lastFailureTime: 0,
        lastSuccessTime: 0,
        requestCount: 0,
        stateChangeTime: Date.now()
      })
      
      this.metrics.set(serviceType, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        rejectedRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        uptime: 100
      })
      
      this.requestTimes.set(serviceType, [])
    }
  }

  /**
   * Execute operation through circuit breaker
   */
  async execute<T>(
    serviceType: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T> | T
  ): Promise<T> {
    const config = this.configs.get(serviceType)
    const state = this.states.get(serviceType)
    
    if (!config || !state) {
      throw new Error(`Circuit breaker not configured for service: ${serviceType}`)
    }

    // Check if circuit is open
    if (this.shouldRejectRequest(serviceType)) {
      this.recordRejection(serviceType)
      
      if (fallback) {
        console.warn(`Circuit breaker OPEN for ${serviceType}, using fallback`)
        return typeof fallback === 'function' ? await fallback() : fallback
      }
      
      throw new Error(`Circuit breaker is OPEN for ${serviceType}. Service temporarily unavailable.`)
    }

    const startTime = Date.now()
    this.recordRequestStart(serviceType)

    try {
      const result = await operation()
      this.recordSuccess(serviceType, Date.now() - startTime)
      return result
      
    } catch (error) {
      this.recordFailure(serviceType, Date.now() - startTime)
      throw error
    }
  }

  /**
   * Check if request should be rejected
   */
  private shouldRejectRequest(serviceType: string): boolean {
    const state = this.states.get(serviceType)!
    const config = this.configs.get(serviceType)!
    const now = Date.now()

    switch (state.state) {
      case 'closed':
        return false
        
      case 'open':
        // Check if recovery timeout has passed
        if (now - state.stateChangeTime > config.recoveryTimeout) {
          this.transitionToHalfOpen(serviceType)
          return false
        }
        return true
        
      case 'half-open':
        return false
        
      default:
        return false
    }
  }

  /**
   * Record successful request
   */
  private recordSuccess(serviceType: string, responseTime: number): void {
    const state = this.states.get(serviceType)!
    const metrics = this.metrics.get(serviceType)!
    const config = this.configs.get(serviceType)!
    
    state.successes++
    state.lastSuccessTime = Date.now()
    state.requestCount++
    
    metrics.totalRequests++
    metrics.successfulRequests++
    
    this.updateResponseTime(serviceType, responseTime)
    this.updateMetrics(serviceType)
    
    // Check if we should close the circuit from half-open
    if (state.state === 'half-open' && state.successes >= config.successThreshold) {
      this.transitionToClosed(serviceType)
    }
    
    console.log(`✅ ${serviceType} success - State: ${state.state}, Successes: ${state.successes}`)
  }

  /**
   * Record failed request
   */
  private recordFailure(serviceType: string, responseTime: number): void {
    const state = this.states.get(serviceType)!
    const metrics = this.metrics.get(serviceType)!
    const config = this.configs.get(serviceType)!
    const now = Date.now()
    
    state.failures++
    state.lastFailureTime = now
    state.requestCount++
    
    metrics.totalRequests++
    metrics.failedRequests++
    
    this.updateResponseTime(serviceType, responseTime)
    this.updateMetrics(serviceType)
    
    // Reset successes on any failure in half-open state
    if (state.state === 'half-open') {
      state.successes = 0
      this.transitionToOpen(serviceType)
      return
    }
    
    // Check if we should open the circuit
    if (state.state === 'closed' && this.shouldOpenCircuit(serviceType)) {
      this.transitionToOpen(serviceType)
    }
    
    console.log(`❌ ${serviceType} failure - State: ${state.state}, Failures: ${state.failures}`)
  }

  /**
   * Record rejected request
   */
  private recordRejection(serviceType: string): void {
    const metrics = this.metrics.get(serviceType)!
    metrics.rejectedRequests++
    this.updateMetrics(serviceType)
  }

  /**
   * Record request start
   */
  private recordRequestStart(serviceType: string): void {
    const state = this.states.get(serviceType)!
    state.requestCount++
  }

  /**
   * Check if circuit should be opened
   */
  private shouldOpenCircuit(serviceType: string): boolean {
    const state = this.states.get(serviceType)!
    const config = this.configs.get(serviceType)!
    const now = Date.now()
    
    // Need minimum volume before opening
    if (state.requestCount < config.volumeThreshold) {
      return false
    }
    
    // Count failures within monitoring window
    const windowStart = now - config.monitoringWindow
    const recentFailures = this.countRecentFailures(serviceType, windowStart)
    
    return recentFailures >= config.failureThreshold
  }

  /**
   * Count recent failures within time window
   */
  private countRecentFailures(serviceType: string, windowStart: number): number {
    const state = this.states.get(serviceType)!
    
    // Simplified: use total failures if last failure is recent
    if (state.lastFailureTime >= windowStart) {
      return state.failures
    }
    
    return 0
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(serviceType: string): void {
    const state = this.states.get(serviceType)!
    state.state = 'open'
    state.stateChangeTime = Date.now()
    state.successes = 0
    
    console.warn(`🔴 Circuit breaker OPENED for ${serviceType}`)
    this.notifyStateChange(serviceType, 'open')
  }

  /**
   * Transition to HALF-OPEN state
   */
  private transitionToHalfOpen(serviceType: string): void {
    const state = this.states.get(serviceType)!
    state.state = 'half-open'
    state.stateChangeTime = Date.now()
    state.successes = 0
    
    console.log(`🟡 Circuit breaker HALF-OPEN for ${serviceType}`)
    this.notifyStateChange(serviceType, 'half-open')
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(serviceType: string): void {
    const state = this.states.get(serviceType)!
    state.state = 'closed'
    state.stateChangeTime = Date.now()
    state.failures = 0
    state.successes = 0
    state.requestCount = 0
    
    console.log(`🟢 Circuit breaker CLOSED for ${serviceType}`)
    this.notifyStateChange(serviceType, 'closed')
  }

  /**
   * Update response time metrics
   */
  private updateResponseTime(serviceType: string, responseTime: number): void {
    const times = this.requestTimes.get(serviceType)!
    times.push(responseTime)
    
    // Keep only last 100 response times
    if (times.length > 100) {
      times.shift()
    }
    
    const metrics = this.metrics.get(serviceType)!
    metrics.averageResponseTime = times.reduce((sum, time) => sum + time, 0) / times.length
  }

  /**
   * Update service metrics
   */
  private updateMetrics(serviceType: string): void {
    const metrics = this.metrics.get(serviceType)!
    const total = metrics.successfulRequests + metrics.failedRequests
    
    if (total > 0) {
      metrics.errorRate = (metrics.failedRequests / total) * 100
      metrics.uptime = (metrics.successfulRequests / total) * 100
    }
  }

  /**
   * Notify state change (for monitoring/alerting)
   */
  private notifyStateChange(serviceType: string, newState: string): void {
    // In a real implementation, this would send alerts/notifications
    console.log(`Circuit breaker state change: ${serviceType} -> ${newState}`)
  }

  /**
   * Get circuit breaker status
   */
  getStatus(serviceType: string): {
    state: string
    failures: number
    successes: number
    uptime: number
    lastFailure?: Date
    lastSuccess?: Date
    metrics: CircuitBreakerMetrics
  } {
    const state = this.states.get(serviceType)
    const metrics = this.metrics.get(serviceType)
    
    if (!state || !metrics) {
      throw new Error(`Circuit breaker not found for service: ${serviceType}`)
    }
    
    return {
      state: state.state,
      failures: state.failures,
      successes: state.successes,
      uptime: metrics.uptime,
      lastFailure: state.lastFailureTime ? new Date(state.lastFailureTime) : undefined,
      lastSuccess: state.lastSuccessTime ? new Date(state.lastSuccessTime) : undefined,
      metrics
    }
  }

  /**
   * Get status for all services
   */
  getAllStatus(): Record<string, any> {
    const status: Record<string, any> = {}
    
    for (const serviceType of this.configs.keys()) {
      status[serviceType] = this.getStatus(serviceType)
    }
    
    return status
  }

  /**
   * Manually reset circuit breaker
   */
  reset(serviceType: string): void {
    const state = this.states.get(serviceType)
    
    if (!state) {
      throw new Error(`Circuit breaker not found for service: ${serviceType}`)
    }
    
    this.transitionToClosed(serviceType)
    console.log(`Circuit breaker manually reset for ${serviceType}`)
  }

  /**
   * Check if service is healthy
   */
  isHealthy(serviceType: string): boolean {
    const state = this.states.get(serviceType)
    return state ? state.state !== 'open' : false
  }

  /**
   * Update circuit breaker configuration
   */
  updateConfig(serviceType: string, config: Partial<CircuitBreakerConfig>): void {
    const currentConfig = this.configs.get(serviceType)
    
    if (!currentConfig) {
      throw new Error(`Circuit breaker not found for service: ${serviceType}`)
    }
    
    this.configs.set(serviceType, { ...currentConfig, ...config })
    console.log(`Circuit breaker config updated for ${serviceType}`)
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    // Reset failure counts periodically to prevent stale data
    setInterval(() => {
      for (const [serviceType, state] of this.states.entries()) {
        const config = this.configs.get(serviceType)!
        const now = Date.now()
        
        // Reset failures older than monitoring window
        if (state.lastFailureTime && (now - state.lastFailureTime) > config.monitoringWindow) {
          state.failures = 0
        }
        
        // Reset request count periodically
        if ((now - state.stateChangeTime) > config.monitoringWindow) {
          state.requestCount = 0
        }
      }
    }, 30000) // Every 30 seconds
  }

  /**
   * Force circuit state (for testing)
   */
  forceState(serviceType: string, newState: 'closed' | 'open' | 'half-open'): void {
    const state = this.states.get(serviceType)
    
    if (!state) {
      throw new Error(`Circuit breaker not found for service: ${serviceType}`)
    }
    
    switch (newState) {
      case 'closed':
        this.transitionToClosed(serviceType)
        break
      case 'open':
        this.transitionToOpen(serviceType)
        break
      case 'half-open':
        this.transitionToHalfOpen(serviceType)
        break
    }
  }
}

// Export singleton instance
export const circuitBreakerService = new CircuitBreakerService()