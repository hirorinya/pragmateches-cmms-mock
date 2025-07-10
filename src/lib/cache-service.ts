/**
 * In-memory cache service for expensive database operations
 * Production note: Consider Redis for distributed caching in production
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>()
  private hitCount = 0
  private missCount = 0

  /**
   * Get cached data or execute function if not cached
   */
  async get<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    ttlMinutes: number = 15
  ): Promise<T> {
    const cachedItem = this.cache.get(key)
    const now = Date.now()

    // Check if cached data exists and is still valid
    if (cachedItem && (now - cachedItem.timestamp) < cachedItem.ttl) {
      this.hitCount++
      console.log(`Cache HIT for key: ${key}`)
      return cachedItem.data
    }

    // Cache miss - fetch new data
    this.missCount++
    console.log(`Cache MISS for key: ${key}`)
    
    try {
      const data = await fetchFunction()
      
      // Store in cache
      this.cache.set(key, {
        data,
        timestamp: now,
        ttl: ttlMinutes * 60 * 1000 // Convert to milliseconds
      })

      return data
    } catch (error) {
      console.error(`Error fetching data for cache key ${key}:`, error)
      
      // Return stale data if available
      if (cachedItem) {
        console.log(`Returning stale data for key: ${key}`)
        return cachedItem.data
      }
      
      throw error
    }
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key)
    console.log(`Cache invalidated for key: ${key}`)
  }

  /**
   * Invalidate cache keys matching pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        console.log(`Cache invalidated for pattern ${pattern}, key: ${key}`)
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.hitCount = 0
    this.missCount = 0
    console.log('Cache cleared')
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.hitCount + this.missCount
    const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0
    
    return {
      size: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: `${hitRate.toFixed(2)}%`,
      totalRequests
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now()
    let cleaned = 0
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp >= item.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cache cleanup: removed ${cleaned} expired entries`)
    }
  }

  /**
   * Start periodic cleanup
   */
  startPeriodicCleanup(intervalMinutes: number = 30): void {
    setInterval(() => {
      this.cleanup()
    }, intervalMinutes * 60 * 1000)
    
    console.log(`Started cache cleanup every ${intervalMinutes} minutes`)
  }
}

// Singleton instance
export const cacheService = new CacheService()

// Start cleanup on module load
cacheService.startPeriodicCleanup(30)

// Cache key generators for consistent naming
export const CacheKeys = {
  // Equipment data
  equipmentInfo: (equipmentId: string) => `equipment:info:${equipmentId}`,
  equipmentsBySystem: (systemId: string) => `equipment:system:${systemId}`,
  allSystems: () => 'systems:all',
  
  // Performance data
  thicknessMeasurements: (equipmentId: string) => `thickness:${equipmentId}`,
  maintenanceHistory: (equipmentId: string) => `maintenance:${equipmentId}`,
  riskAssessment: (equipmentId: string) => `risk:${equipmentId}`,
  
  // Analytics and aggregations
  systemHealthSummary: (systemId: string) => `health:system:${systemId}`,
  equipmentHealthSummary: () => 'health:equipment:all',
  costAnalysis: (timeframe: string) => `cost:analysis:${timeframe}`,
  riskMatrix: () => 'risk:matrix:all',
  
  // Process monitoring
  processDataTrends: (parameterId: string, hours: number) => `process:trends:${parameterId}:${hours}h`,
  alertsSummary: () => 'alerts:summary',
  complianceStatus: () => 'compliance:status',
  
  // Task and scheduling
  dueTasks: () => 'tasks:due',
  maintenanceSchedule: (days: number) => `schedule:maintenance:${days}d`,
  inspectionSchedule: (days: number) => `schedule:inspection:${days}d`
}

// Cache TTL configurations (in minutes)
export const CacheTTL = {
  // Static data - longer TTL
  equipmentInfo: 60,        // 1 hour
  systemsList: 120,        // 2 hours
  
  // Semi-dynamic data - medium TTL
  thicknessMeasurements: 30,  // 30 minutes
  maintenanceHistory: 30,     // 30 minutes
  riskAssessment: 60,         // 1 hour
  
  // Dynamic data - shorter TTL
  processData: 5,             // 5 minutes
  alerts: 2,                  // 2 minutes
  realTimeStatus: 1,          // 1 minute
  
  // Analytics - medium TTL
  healthSummary: 15,          // 15 minutes
  costAnalysis: 60,           // 1 hour
  riskMatrix: 30,             // 30 minutes
  
  // Scheduling - short TTL
  dueTasks: 10,               // 10 minutes
  schedules: 30               // 30 minutes
}