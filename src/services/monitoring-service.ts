/**
 * Comprehensive Logging and Monitoring Service
 * Advanced monitoring, logging, and observability for the CMMS AI assistant
 */

interface LogEntry {
  timestamp: number
  level: 'debug' | 'info' | 'warn' | 'error'
  category: string
  message: string
  metadata?: any
  requestId?: string
  userId?: string
  sessionId?: string
  duration?: number
  stackTrace?: string
}

interface MetricEntry {
  name: string
  value: number
  type: 'counter' | 'gauge' | 'histogram' | 'timer'
  tags: Record<string, string>
  timestamp: number
}

interface PerformanceMetrics {
  requestCount: number
  errorCount: number
  averageResponseTime: number
  p95ResponseTime: number
  cacheHitRate: number
  successRate: number
  activeConnections: number
  memoryUsage: number
  cpuUsage: number
}

interface AlertRule {
  name: string
  condition: (metrics: PerformanceMetrics) => boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  cooldownMs: number
  lastTriggered?: number
}

interface SystemHealthCheck {
  service: string
  status: 'healthy' | 'degraded' | 'critical'
  responseTime: number
  lastCheck: number
  details?: any
  errorMessage?: string
}

export class MonitoringService {
  private static instance: MonitoringService
  
  // Storage for logs and metrics
  private logs: LogEntry[] = []
  private metrics: MetricEntry[] = []
  private responseTimes: number[] = []
  private requestCounts: Map<string, number> = new Map()
  private errorCounts: Map<string, number> = new Map()
  
  // Health checks
  private healthChecks: Map<string, SystemHealthCheck> = new Map()
  
  // Alert rules
  private alertRules: AlertRule[] = [
    {
      name: 'HIGH_ERROR_RATE',
      condition: (metrics) => metrics.errorCount > 10 && metrics.successRate < 0.9,
      severity: 'high',
      description: 'Error rate exceeds 10% threshold',
      cooldownMs: 5 * 60 * 1000 // 5 minutes
    },
    {
      name: 'SLOW_RESPONSE_TIME',
      condition: (metrics) => metrics.p95ResponseTime > 5000,
      severity: 'medium',
      description: '95th percentile response time exceeds 5 seconds',
      cooldownMs: 10 * 60 * 1000 // 10 minutes
    },
    {
      name: 'LOW_CACHE_HIT_RATE',
      condition: (metrics) => metrics.cacheHitRate < 0.6,
      severity: 'low',
      description: 'Cache hit rate below 60%',
      cooldownMs: 30 * 60 * 1000 // 30 minutes
    },
    {
      name: 'HIGH_MEMORY_USAGE',
      condition: (metrics) => metrics.memoryUsage > 0.85,
      severity: 'critical',
      description: 'Memory usage exceeds 85%',
      cooldownMs: 2 * 60 * 1000 // 2 minutes
    }
  ]
  
  // Configuration
  private config = {
    maxLogEntries: 10000,
    maxMetricEntries: 50000,
    logRetentionMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    metricsRetentionMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    healthCheckIntervalMs: 60 * 1000, // 1 minute
    metricsAggregationIntervalMs: 30 * 1000 // 30 seconds
  }

  constructor() {
    if (MonitoringService.instance) {
      return MonitoringService.instance
    }
    MonitoringService.instance = this
    this.startBackgroundTasks()
  }

  /**
   * Log an event with structured data
   */
  log(
    level: 'debug' | 'info' | 'warn' | 'error',
    category: string,
    message: string,
    metadata?: any,
    requestId?: string,
    userId?: string
  ): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      metadata,
      requestId,
      userId,
      sessionId: this.getCurrentSessionId()
    }

    // Add stack trace for errors
    if (level === 'error') {
      entry.stackTrace = new Error().stack
    }

    this.logs.push(entry)
    
    // Trim logs if needed
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs = this.logs.slice(-this.config.maxLogEntries)
    }

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date(entry.timestamp).toISOString()
      const prefix = `[${timestamp}] [${level.toUpperCase()}] [${category}]`
      
      if (level === 'error') {
        console.error(`${prefix} ${message}`, metadata || '')
      } else if (level === 'warn') {
        console.warn(`${prefix} ${message}`, metadata || '')
      } else {
        console.log(`${prefix} ${message}`, metadata || '')
      }
    }
  }

  /**
   * Record a metric
   */
  recordMetric(
    name: string,
    value: number,
    type: 'counter' | 'gauge' | 'histogram' | 'timer',
    tags: Record<string, string> = {}
  ): void {
    const entry: MetricEntry = {
      name,
      value,
      type,
      tags,
      timestamp: Date.now()
    }

    this.metrics.push(entry)
    
    // Trim metrics if needed
    if (this.metrics.length > this.config.maxMetricEntries) {
      this.metrics = this.metrics.slice(-this.config.maxMetricEntries)
    }
  }

  /**
   * Start timing an operation
   */
  startTimer(name: string): () => void {
    const startTime = Date.now()
    
    return () => {
      const duration = Date.now() - startTime
      this.recordMetric(name, duration, 'timer')
      return duration
    }
  }

  /**
   * Track API request
   */
  trackRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    userId?: string,
    requestId?: string
  ): void {
    const category = `api_${method.toLowerCase()}`
    const success = statusCode >= 200 && statusCode < 400
    
    // Log the request
    this.log(
      success ? 'info' : 'warn',
      category,
      `${method} ${endpoint} -> ${statusCode}`,
      {
        method,
        endpoint,
        statusCode,
        responseTime,
        success
      },
      requestId,
      userId
    )

    // Record metrics
    this.recordMetric('http_requests_total', 1, 'counter', {
      method,
      endpoint,
      status: statusCode.toString()
    })

    this.recordMetric('http_request_duration', responseTime, 'histogram', {
      method,
      endpoint
    })

    // Track response times
    this.responseTimes.push(responseTime)
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000)
    }

    // Update counters
    const key = `${method}:${endpoint}`
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1)
    
    if (!success) {
      this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1)
    }
  }

  /**
   * Track AI service usage
   */
  trackAIUsage(
    service: 'openai' | 'pattern_matching' | 'text_to_sql',
    operation: string,
    success: boolean,
    responseTime: number,
    tokensUsed?: number,
    requestId?: string
  ): void {
    this.log(
      'info',
      'ai_service',
      `${service}.${operation} ${success ? 'success' : 'failed'}`,
      {
        service,
        operation,
        success,
        responseTime,
        tokensUsed
      },
      requestId
    )

    this.recordMetric('ai_requests_total', 1, 'counter', {
      service,
      operation,
      success: success.toString()
    })

    this.recordMetric('ai_response_time', responseTime, 'histogram', {
      service,
      operation
    })

    if (tokensUsed) {
      this.recordMetric('ai_tokens_used', tokensUsed, 'counter', {
        service,
        operation
      })
    }
  }

  /**
   * Track cache performance
   */
  trackCacheOperation(
    operation: 'hit' | 'miss' | 'set' | 'evict',
    cacheType: string,
    key?: string
  ): void {
    this.recordMetric('cache_operations_total', 1, 'counter', {
      operation,
      cache_type: cacheType
    })

    this.log('debug', 'cache', `Cache ${operation} for ${cacheType}`, {
      operation,
      cacheType,
      key
    })
  }

  /**
   * Register a health check
   */
  registerHealthCheck(
    serviceName: string,
    checkFunction: () => Promise<{
      status: 'healthy' | 'degraded' | 'critical'
      details?: any
      responseTime?: number
    }>
  ): void {
    // Store the check function for periodic execution
    setInterval(async () => {
      const startTime = Date.now()
      
      try {
        const result = await checkFunction()
        const responseTime = Date.now() - startTime
        
        this.healthChecks.set(serviceName, {
          service: serviceName,
          status: result.status,
          responseTime: result.responseTime || responseTime,
          lastCheck: Date.now(),
          details: result.details
        })

        this.recordMetric('health_check_duration', responseTime, 'gauge', {
          service: serviceName,
          status: result.status
        })

      } catch (error: any) {
        this.healthChecks.set(serviceName, {
          service: serviceName,
          status: 'critical',
          responseTime: Date.now() - startTime,
          lastCheck: Date.now(),
          errorMessage: error.message
        })

        this.log('error', 'health_check', `Health check failed for ${serviceName}`, {
          service: serviceName,
          error: error.message
        })
      }
    }, this.config.healthCheckIntervalMs)
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const now = Date.now()
    const last5Minutes = now - (5 * 60 * 1000)
    
    // Calculate recent metrics
    const recentLogs = this.logs.filter(log => log.timestamp >= last5Minutes)
    const recentErrors = recentLogs.filter(log => log.level === 'error')
    const recentRequests = recentLogs.filter(log => log.category.startsWith('api_'))
    
    const totalRequests = recentRequests.length
    const errorCount = recentErrors.length
    const successRate = totalRequests > 0 ? (totalRequests - errorCount) / totalRequests : 1
    
    // Response time calculations
    const recentResponseTimes = this.responseTimes.filter((_, index) => 
      index >= this.responseTimes.length - Math.min(100, this.responseTimes.length)
    )
    
    const averageResponseTime = recentResponseTimes.length > 0 
      ? recentResponseTimes.reduce((sum, time) => sum + time, 0) / recentResponseTimes.length
      : 0
    
    const sortedTimes = [...recentResponseTimes].sort((a, b) => a - b)
    const p95Index = Math.floor(sortedTimes.length * 0.95)
    const p95ResponseTime = sortedTimes.length > 0 ? sortedTimes[p95Index] || 0 : 0
    
    // Cache hit rate (simplified)
    const cacheMetrics = this.metrics.filter(m => 
      m.name === 'cache_operations_total' && m.timestamp >= last5Minutes
    )
    
    const cacheHits = cacheMetrics.filter(m => m.tags.operation === 'hit').length
    const cacheMisses = cacheMetrics.filter(m => m.tags.operation === 'miss').length
    const cacheHitRate = (cacheHits + cacheMisses) > 0 ? cacheHits / (cacheHits + cacheMisses) : 0
    
    // System metrics (simplified - in production would use actual system monitoring)
    const memoryUsage = process.memoryUsage()
    const memoryUtilization = memoryUsage.heapUsed / memoryUsage.heapTotal

    return {
      requestCount: totalRequests,
      errorCount,
      averageResponseTime,
      p95ResponseTime,
      cacheHitRate,
      successRate,
      activeConnections: 0, // Would be tracked separately
      memoryUsage: memoryUtilization,
      cpuUsage: 0 // Would require system monitoring
    }
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    overall: 'healthy' | 'degraded' | 'critical'
    services: SystemHealthCheck[]
    lastUpdate: number
  } {
    const services = Array.from(this.healthChecks.values())
    
    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy'
    
    if (services.some(s => s.status === 'critical')) {
      overall = 'critical'
    } else if (services.some(s => s.status === 'degraded')) {
      overall = 'degraded'
    }

    return {
      overall,
      services,
      lastUpdate: Date.now()
    }
  }

  /**
   * Query logs with filtering
   */
  queryLogs(filters: {
    level?: 'debug' | 'info' | 'warn' | 'error'
    category?: string
    fromTime?: number
    toTime?: number
    requestId?: string
    userId?: string
    limit?: number
  }): LogEntry[] {
    let filtered = this.logs

    if (filters.level) {
      filtered = filtered.filter(log => log.level === filters.level)
    }

    if (filters.category) {
      filtered = filtered.filter(log => log.category.includes(filters.category))
    }

    if (filters.fromTime) {
      filtered = filtered.filter(log => log.timestamp >= filters.fromTime!)
    }

    if (filters.toTime) {
      filtered = filtered.filter(log => log.timestamp <= filters.toTime!)
    }

    if (filters.requestId) {
      filtered = filtered.filter(log => log.requestId === filters.requestId)
    }

    if (filters.userId) {
      filtered = filtered.filter(log => log.userId === filters.userId)
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp)

    // Apply limit
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit)
    }

    return filtered
  }

  /**
   * Get monitoring dashboard data
   */
  getDashboardData(): {
    metrics: PerformanceMetrics
    health: any
    recentErrors: LogEntry[]
    alertsTriggered: string[]
    topEndpoints: Array<{ endpoint: string; requests: number; errors: number }>
  } {
    const metrics = this.getPerformanceMetrics()
    const health = this.getSystemHealth()
    
    // Recent errors
    const recentErrors = this.queryLogs({
      level: 'error',
      fromTime: Date.now() - (60 * 60 * 1000), // Last hour
      limit: 10
    })

    // Check alerts
    const alertsTriggered = this.checkAlerts(metrics)

    // Top endpoints
    const endpointStats = Array.from(this.requestCounts.entries())
      .map(([endpoint, requests]) => ({
        endpoint,
        requests,
        errors: this.errorCounts.get(endpoint) || 0
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10)

    return {
      metrics,
      health,
      recentErrors,
      alertsTriggered,
      topEndpoints: endpointStats
    }
  }

  /**
   * Private helper methods
   */
  private checkAlerts(metrics: PerformanceMetrics): string[] {
    const triggeredAlerts: string[] = []
    const now = Date.now()

    for (const rule of this.alertRules) {
      // Check cooldown
      if (rule.lastTriggered && (now - rule.lastTriggered) < rule.cooldownMs) {
        continue
      }

      // Check condition
      if (rule.condition(metrics)) {
        triggeredAlerts.push(rule.name)
        rule.lastTriggered = now

        this.log('warn', 'alert', `Alert triggered: ${rule.name}`, {
          rule: rule.name,
          severity: rule.severity,
          description: rule.description,
          metrics
        })
      }
    }

    return triggeredAlerts
  }

  private getCurrentSessionId(): string {
    // In a real implementation, this would track actual user sessions
    return 'session_' + Date.now().toString(36)
  }

  private startBackgroundTasks(): void {
    // Cleanup old logs and metrics
    setInterval(() => {
      this.cleanupOldData()
    }, 60 * 60 * 1000) // Every hour

    // Aggregate metrics
    setInterval(() => {
      this.aggregateMetrics()
    }, this.config.metricsAggregationIntervalMs)

    // Performance monitoring
    setInterval(() => {
      const metrics = this.getPerformanceMetrics()
      this.checkAlerts(metrics)
    }, 30 * 1000) // Every 30 seconds
  }

  private cleanupOldData(): void {
    const now = Date.now()
    
    // Clean old logs
    const logCutoff = now - this.config.logRetentionMs
    this.logs = this.logs.filter(log => log.timestamp >= logCutoff)
    
    // Clean old metrics
    const metricCutoff = now - this.config.metricsRetentionMs
    this.metrics = this.metrics.filter(metric => metric.timestamp >= metricCutoff)
    
    this.log('debug', 'monitoring', 'Cleaned up old logs and metrics', {
      logsRemaining: this.logs.length,
      metricsRemaining: this.metrics.length
    })
  }

  private aggregateMetrics(): void {
    // In a production system, this would aggregate metrics for efficient querying
    const now = Date.now()
    const metrics = this.getPerformanceMetrics()
    
    // Record aggregated metrics
    Object.entries(metrics).forEach(([key, value]) => {
      if (typeof value === 'number') {
        this.recordMetric(`aggregated_${key}`, value, 'gauge')
      }
    })
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService()