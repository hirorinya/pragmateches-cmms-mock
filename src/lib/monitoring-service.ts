/**
 * Performance monitoring and error tracking service
 * Production note: Consider integration with external monitoring services like DataDog, New Relic
 */

interface PerformanceMetric {
  operation: string
  duration: number
  timestamp: number
  success: boolean
  error?: string
  metadata?: Record<string, any>
}

interface ErrorEvent {
  error: Error
  context: string
  timestamp: number
  metadata?: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface SystemHealth {
  timestamp: number
  database: {
    connectionStatus: 'healthy' | 'degraded' | 'error'
    responseTime: number
    activeConnections?: number
  }
  cache: {
    hitRate: number
    size: number
    status: 'healthy' | 'degraded' | 'error'
  }
  memory: {
    usage: number
    available: number
    status: 'healthy' | 'degraded' | 'error'
  }
}

class MonitoringService {
  private performanceMetrics: PerformanceMetric[] = []
  private errorEvents: ErrorEvent[] = []
  private maxMetricsHistory = 1000
  private maxErrorHistory = 500

  /**
   * Track performance of database operations
   */
  async trackPerformance<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now()
    let success = true
    let error: string | undefined

    try {
      const result = await fn()
      return result
    } catch (err) {
      success = false
      error = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      const duration = Date.now() - startTime
      
      this.recordMetric({
        operation,
        duration,
        timestamp: Date.now(),
        success,
        error,
        metadata
      })

      // Log slow operations
      if (duration > 5000) { // 5 seconds
        console.warn(`Slow operation detected: ${operation} took ${duration}ms`)
      }
    }
  }

  /**
   * Record error event
   */
  recordError(
    error: Error,
    context: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    metadata?: Record<string, any>
  ): void {
    const errorEvent: ErrorEvent = {
      error,
      context,
      timestamp: Date.now(),
      metadata,
      severity
    }

    this.errorEvents.push(errorEvent)
    
    // Limit history size
    if (this.errorEvents.length > this.maxErrorHistory) {
      this.errorEvents = this.errorEvents.slice(-this.maxErrorHistory)
    }

    // Log based on severity
    switch (severity) {
      case 'critical':
        console.error(`CRITICAL ERROR in ${context}:`, error, metadata)
        break
      case 'high':
        console.error(`High severity error in ${context}:`, error, metadata)
        break
      case 'medium':
        console.warn(`Error in ${context}:`, error.message, metadata)
        break
      case 'low':
        console.log(`Low severity error in ${context}:`, error.message)
        break
    }
  }

  /**
   * Record performance metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.performanceMetrics.push(metric)
    
    // Limit history size
    if (this.performanceMetrics.length > this.maxMetricsHistory) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetricsHistory)
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(timeWindowMinutes: number = 60): {
    totalOperations: number
    avgDuration: number
    slowOperations: number
    errorRate: number
    topSlowOperations: Array<{ operation: string; avgDuration: number; count: number }>
  } {
    const cutoffTime = Date.now() - (timeWindowMinutes * 60 * 1000)
    const recentMetrics = this.performanceMetrics.filter(m => m.timestamp > cutoffTime)

    if (recentMetrics.length === 0) {
      return {
        totalOperations: 0,
        avgDuration: 0,
        slowOperations: 0,
        errorRate: 0,
        topSlowOperations: []
      }
    }

    const totalOperations = recentMetrics.length
    const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations
    const slowOperations = recentMetrics.filter(m => m.duration > 2000).length // > 2 seconds
    const errorCount = recentMetrics.filter(m => !m.success).length
    const errorRate = (errorCount / totalOperations) * 100

    // Group by operation and calculate averages
    const operationStats = new Map<string, { durations: number[]; count: number }>()
    recentMetrics.forEach(m => {
      const stats = operationStats.get(m.operation) || { durations: [], count: 0 }
      stats.durations.push(m.duration)
      stats.count++
      operationStats.set(m.operation, stats)
    })

    const topSlowOperations = Array.from(operationStats.entries())
      .map(([operation, stats]) => ({
        operation,
        avgDuration: stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length,
        count: stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10)

    return {
      totalOperations,
      avgDuration,
      slowOperations,
      errorRate,
      topSlowOperations
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(timeWindowMinutes: number = 60): {
    totalErrors: number
    errorsBySeverity: Record<string, number>
    errorsByContext: Record<string, number>
    recentErrors: ErrorEvent[]
  } {
    const cutoffTime = Date.now() - (timeWindowMinutes * 60 * 1000)
    const recentErrors = this.errorEvents.filter(e => e.timestamp > cutoffTime)

    const errorsBySeverity = recentErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const errorsByContext = recentErrors.reduce((acc, error) => {
      acc[error.context] = (acc[error.context] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalErrors: recentErrors.length,
      errorsBySeverity,
      errorsByContext,
      recentErrors: recentErrors.slice(-20) // Last 20 errors
    }
  }

  /**
   * Check system health
   */
  async checkSystemHealth(): Promise<SystemHealth> {
    const health: SystemHealth = {
      timestamp: Date.now(),
      database: {
        connectionStatus: 'healthy',
        responseTime: 0
      },
      cache: {
        hitRate: 0,
        size: 0,
        status: 'healthy'
      },
      memory: {
        usage: 0,
        available: 0,
        status: 'healthy'
      }
    }

    // Check database health
    try {
      const startTime = Date.now()
      // Simple database ping - you could import supabase here for a real check
      await new Promise(resolve => setTimeout(resolve, 10)) // Simulated check
      health.database.responseTime = Date.now() - startTime
      
      if (health.database.responseTime > 1000) {
        health.database.connectionStatus = 'degraded'
      }
    } catch (error) {
      health.database.connectionStatus = 'error'
      this.recordError(
        error instanceof Error ? error : new Error(String(error)),
        'database_health_check',
        'high'
      )
    }

    // Check cache health (would import cacheService here)
    try {
      // This would get actual cache stats
      health.cache = {
        hitRate: 75, // Placeholder
        size: 100,   // Placeholder
        status: 'healthy'
      }
    } catch (error) {
      health.cache.status = 'error'
    }

    // Check memory health
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const memUsage = process.memoryUsage()
        health.memory = {
          usage: memUsage.heapUsed / 1024 / 1024, // MB
          available: memUsage.heapTotal / 1024 / 1024, // MB
          status: 'healthy'
        }
        
        // Mark as degraded if memory usage is > 80%
        if (health.memory.usage / health.memory.available > 0.8) {
          health.memory.status = 'degraded'
        }
      }
    } catch (error) {
      health.memory.status = 'error'
    }

    return health
  }

  /**
   * Get alerting thresholds status
   */
  getAlerts(): Array<{
    type: 'performance' | 'error' | 'health'
    severity: 'warning' | 'critical'
    message: string
    timestamp: number
  }> {
    const alerts: Array<{
      type: 'performance' | 'error' | 'health'
      severity: 'warning' | 'critical'
      message: string
      timestamp: number
    }> = []

    const perfStats = this.getPerformanceStats(30) // Last 30 minutes
    const errorStats = this.getErrorStats(30)

    // Performance alerts
    if (perfStats.errorRate > 10) {
      alerts.push({
        type: 'performance',
        severity: perfStats.errorRate > 25 ? 'critical' : 'warning',
        message: `High error rate: ${perfStats.errorRate.toFixed(1)}% in last 30 minutes`,
        timestamp: Date.now()
      })
    }

    if (perfStats.avgDuration > 3000) {
      alerts.push({
        type: 'performance',
        severity: perfStats.avgDuration > 5000 ? 'critical' : 'warning',
        message: `Slow average response time: ${perfStats.avgDuration.toFixed(0)}ms`,
        timestamp: Date.now()
      })
    }

    // Error alerts
    const criticalErrors = errorStats.errorsBySeverity.critical || 0
    const highErrors = errorStats.errorsBySeverity.high || 0

    if (criticalErrors > 0) {
      alerts.push({
        type: 'error',
        severity: 'critical',
        message: `${criticalErrors} critical errors in last 30 minutes`,
        timestamp: Date.now()
      })
    }

    if (highErrors > 5) {
      alerts.push({
        type: 'error',
        severity: 'warning',
        message: `${highErrors} high severity errors in last 30 minutes`,
        timestamp: Date.now()
      })
    }

    return alerts
  }

  /**
   * Clear old metrics and errors
   */
  cleanup(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000) // 24 hours
    
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp > cutoffTime)
    this.errorEvents = this.errorEvents.filter(e => e.timestamp > cutoffTime)
    
    console.log('Monitoring data cleanup completed')
  }

  /**
   * Start periodic cleanup
   */
  startPeriodicCleanup(intervalHours: number = 6): void {
    setInterval(() => {
      this.cleanup()
    }, intervalHours * 60 * 60 * 1000)
    
    console.log(`Started monitoring cleanup every ${intervalHours} hours`)
  }
}

// Singleton instance
export const monitoringService = new MonitoringService()

// Start cleanup on module load
monitoringService.startPeriodicCleanup(6)

// Export helper functions for common patterns
export const withPerformanceTracking = <T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  return monitoringService.trackPerformance(operation, fn, metadata)
}

export const recordError = (
  error: Error,
  context: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  metadata?: Record<string, any>
): void => {
  monitoringService.recordError(error, context, severity, metadata)
}