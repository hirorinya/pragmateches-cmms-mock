/**
 * Intelligent Caching Service for CMMS Queries
 * Multi-layer caching with intelligent invalidation and query optimization
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  lastAccessed: number
  hitCount: number
  ttl: number
  tags: string[]
  queryHash: string
}

interface CacheConfig {
  maxSize: number
  defaultTtl: number
  maxAge: number
  compressionThreshold: number
  hitRatioThreshold: number
}

interface CacheStats {
  hits: number
  misses: number
  hitRatio: number
  totalSize: number
  evictions: number
  compressions: number
}

interface QueryPattern {
  pattern: RegExp
  ttl: number
  tags: string[]
  description: string
}

export class CacheService {
  private static instance: CacheService
  
  // Multi-layer cache storage
  private memoryCache: Map<string, CacheEntry<any>> = new Map()
  private queryResultCache: Map<string, CacheEntry<any>> = new Map()
  private entityCache: Map<string, CacheEntry<any>> = new Map()
  
  // Cache configuration
  private config: CacheConfig = {
    maxSize: 1000, // Maximum cache entries
    defaultTtl: 5 * 60 * 1000, // 5 minutes default TTL
    maxAge: 60 * 60 * 1000, // 1 hour maximum age
    compressionThreshold: 1024, // Compress entries larger than 1KB
    hitRatioThreshold: 0.8 // Minimum hit ratio to keep entry
  }
  
  // Cache statistics
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRatio: 0,
    totalSize: 0,
    evictions: 0,
    compressions: 0
  }
  
  // Query patterns for intelligent caching
  private queryPatterns: QueryPattern[] = [
    {
      pattern: /equipment.*status|status.*equipment/i,
      ttl: 2 * 60 * 1000, // 2 minutes for status queries
      tags: ['equipment', 'status'],
      description: 'Equipment status queries'
    },
    {
      pattern: /maintenance.*history|history.*maintenance/i,
      ttl: 30 * 60 * 1000, // 30 minutes for history
      tags: ['maintenance', 'history'],
      description: 'Maintenance history queries'
    },
    {
      pattern: /risk.*assessment|assessment.*risk/i,
      ttl: 60 * 60 * 1000, // 1 hour for risk assessments
      tags: ['risk', 'assessment'],
      description: 'Risk assessment queries'
    },
    {
      pattern: /thickness.*measurement|measurement.*thickness/i,
      ttl: 15 * 60 * 1000, // 15 minutes for measurements
      tags: ['thickness', 'measurement'],
      description: 'Thickness measurement queries'
    },
    {
      pattern: /strategy.*coverage|coverage.*strategy/i,
      ttl: 45 * 60 * 1000, // 45 minutes for strategy queries
      tags: ['strategy', 'coverage'],
      description: 'Strategy coverage queries'
    },
    {
      pattern: /department.*completion|completion.*department/i,
      ttl: 10 * 60 * 1000, // 10 minutes for completion rates
      tags: ['department', 'completion'],
      description: 'Department completion queries'
    }
  ]

  constructor() {
    if (CacheService.instance) {
      return CacheService.instance
    }
    CacheService.instance = this
    this.startCacheManagement()
  }

  /**
   * Get cached data or execute function if cache miss
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: {
      ttl?: number
      tags?: string[]
      cacheType?: 'memory' | 'query' | 'entity'
      query?: string
    } = {}
  ): Promise<T> {
    const {
      ttl,
      tags = [],
      cacheType = 'memory',
      query
    } = options

    const cache = this.getCache(cacheType)
    const cacheKey = this.generateCacheKey(key, query)
    
    // Try to get from cache
    const cached = this.get(cacheKey, cacheType)
    if (cached !== null) {
      return cached
    }

    // Cache miss - fetch data
    try {
      const data = await fetchFunction()
      
      // Determine TTL based on query pattern
      const effectiveTtl = this.determineTtl(query || key, ttl)
      const effectiveTags = this.determineTags(query || key, tags)
      
      // Store in cache
      this.set(cacheKey, data, {
        ttl: effectiveTtl,
        tags: effectiveTags,
        cacheType,
        query: query || key
      })
      
      return data
    } catch (error) {
      console.error(`Cache fetch function failed for key ${cacheKey}:`, error)
      throw error
    }
  }

  /**
   * Get data from cache
   */
  get<T>(key: string, cacheType: 'memory' | 'query' | 'entity' = 'memory'): T | null {
    const cache = this.getCache(cacheType)
    const entry = cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      this.updateHitRatio()
      return null
    }
    
    const now = Date.now()
    
    // Check if expired
    if (now > entry.timestamp + entry.ttl) {
      cache.delete(key)
      this.stats.misses++
      this.stats.evictions++
      this.updateHitRatio()
      return null
    }
    
    // Update access info
    entry.lastAccessed = now
    entry.hitCount++
    
    this.stats.hits++
    this.updateHitRatio()
    
    return entry.data
  }

  /**
   * Set data in cache
   */
  set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number
      tags?: string[]
      cacheType?: 'memory' | 'query' | 'entity'
      query?: string
    } = {}
  ): void {
    const {
      ttl = this.config.defaultTtl,
      tags = [],
      cacheType = 'memory',
      query = ''
    } = options

    const cache = this.getCache(cacheType)
    const now = Date.now()
    
    // Check cache size limits
    if (cache.size >= this.config.maxSize) {
      this.evictLeastUsed(cacheType)
    }
    
    // Create cache entry
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      lastAccessed: now,
      hitCount: 0,
      ttl,
      tags,
      queryHash: this.hashQuery(query)
    }
    
    // Compress large entries
    if (this.getDataSize(data) > this.config.compressionThreshold) {
      entry.data = this.compressData(data)
      this.stats.compressions++
    }
    
    cache.set(key, entry)
    this.updateTotalSize()
  }

  /**
   * Delete from cache
   */
  delete(key: string, cacheType: 'memory' | 'query' | 'entity' = 'memory'): boolean {
    const cache = this.getCache(cacheType)
    const deleted = cache.delete(key)
    
    if (deleted) {
      this.updateTotalSize()
    }
    
    return deleted
  }

  /**
   * Clear cache by tags
   */
  clearByTags(tags: string[], cacheType?: 'memory' | 'query' | 'entity'): number {
    let cleared = 0
    
    const cachesToClear = cacheType ? [cacheType] : ['memory', 'query', 'entity'] as const
    
    for (const type of cachesToClear) {
      const cache = this.getCache(type)
      
      for (const [key, entry] of cache.entries()) {
        if (tags.some(tag => entry.tags.includes(tag))) {
          cache.delete(key)
          cleared++
        }
      }
    }
    
    this.updateTotalSize()
    console.log(`Cleared ${cleared} cache entries with tags: ${tags.join(', ')}`)
    
    return cleared
  }

  /**
   * Invalidate equipment-related cache when equipment data changes
   */
  invalidateEquipment(equipmentId?: string): void {
    const tags = equipmentId ? ['equipment', `equipment:${equipmentId}`] : ['equipment']
    this.clearByTags(tags)
  }

  /**
   * Invalidate maintenance-related cache
   */
  invalidateMaintenance(equipmentId?: string): void {
    const tags = equipmentId 
      ? ['maintenance', `maintenance:${equipmentId}`] 
      : ['maintenance']
    this.clearByTags(tags)
  }

  /**
   * Intelligent cache warming for common queries
   */
  async warmCache(commonQueries: Array<{
    key: string
    fetchFunction: () => Promise<any>
    priority: 'high' | 'medium' | 'low'
  }>): Promise<void> {
    console.log('Starting cache warming...')
    
    // Sort by priority
    const sortedQueries = commonQueries.sort((a, b) => {
      const priorities = { high: 3, medium: 2, low: 1 }
      return priorities[b.priority] - priorities[a.priority]
    })
    
    const promises = sortedQueries.map(async ({ key, fetchFunction }) => {
      try {
        await this.getOrSet(key, fetchFunction, {
          tags: ['preloaded'],
          ttl: this.config.defaultTtl * 2 // Longer TTL for preloaded data
        })
      } catch (error) {
        console.warn(`Cache warming failed for ${key}:`, error)
      }
    })
    
    await Promise.allSettled(promises)
    console.log(`Cache warming completed for ${commonQueries.length} queries`)
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & {
    memoryCacheSize: number
    queryCacheSize: number
    entityCacheSize: number
  } {
    return {
      ...this.stats,
      memoryCacheSize: this.memoryCache.size,
      queryCacheSize: this.queryResultCache.size,
      entityCacheSize: this.entityCache.size
    }
  }

  /**
   * Get detailed cache analysis
   */
  getCacheAnalysis(): {
    topQueries: Array<{ query: string; hits: number; lastAccessed: Date }>
    tagDistribution: Record<string, number>
    sizeDistribution: Record<string, number>
    recommendations: string[]
  } {
    const allEntries = [
      ...Array.from(this.memoryCache.entries()),
      ...Array.from(this.queryResultCache.entries()),
      ...Array.from(this.entityCache.entries())
    ]
    
    // Top queries by hit count
    const topQueries = allEntries
      .map(([key, entry]) => ({
        query: key,
        hits: entry.hitCount,
        lastAccessed: new Date(entry.lastAccessed)
      }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10)
    
    // Tag distribution
    const tagDistribution: Record<string, number> = {}
    allEntries.forEach(([_, entry]) => {
      entry.tags.forEach(tag => {
        tagDistribution[tag] = (tagDistribution[tag] || 0) + 1
      })
    })
    
    // Size distribution
    const sizeDistribution: Record<string, number> = {
      small: 0, // < 1KB
      medium: 0, // 1KB - 10KB
      large: 0 // > 10KB
    }
    
    allEntries.forEach(([_, entry]) => {
      const size = this.getDataSize(entry.data)
      if (size < 1024) sizeDistribution.small++
      else if (size < 10240) sizeDistribution.medium++
      else sizeDistribution.large++
    })
    
    // Generate recommendations
    const recommendations: string[] = []
    
    if (this.stats.hitRatio < 0.6) {
      recommendations.push('Low hit ratio detected. Consider adjusting TTL values or cache strategy.')
    }
    
    if (sizeDistribution.large > allEntries.length * 0.2) {
      recommendations.push('Many large cache entries detected. Consider data compression or pagination.')
    }
    
    if (this.stats.evictions > this.stats.hits * 0.1) {
      recommendations.push('High eviction rate. Consider increasing cache size or optimizing TTL.')
    }
    
    return {
      topQueries,
      tagDistribution,
      sizeDistribution,
      recommendations
    }
  }

  /**
   * Helper methods
   */
  private getCache(type: 'memory' | 'query' | 'entity'): Map<string, CacheEntry<any>> {
    switch (type) {
      case 'memory': return this.memoryCache
      case 'query': return this.queryResultCache
      case 'entity': return this.entityCache
      default: return this.memoryCache
    }
  }

  private generateCacheKey(key: string, query?: string): string {
    const baseKey = key.toLowerCase().trim()
    
    if (query) {
      const queryHash = this.hashQuery(query)
      return `${baseKey}:${queryHash}`
    }
    
    return baseKey
  }

  private hashQuery(query: string): string {
    // Simple hash function for query strings
    let hash = 0
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  private determineTtl(query: string, defaultTtl?: number): number {
    if (defaultTtl) return defaultTtl
    
    const pattern = this.queryPatterns.find(p => p.pattern.test(query))
    return pattern ? pattern.ttl : this.config.defaultTtl
  }

  private determineTags(query: string, defaultTags: string[]): string[] {
    const pattern = this.queryPatterns.find(p => p.pattern.test(query))
    const patternTags = pattern ? pattern.tags : []
    
    return [...new Set([...defaultTags, ...patternTags])]
  }

  private evictLeastUsed(cacheType: 'memory' | 'query' | 'entity'): void {
    const cache = this.getCache(cacheType)
    
    // Find least recently used entry
    let lruKey = ''
    let lruTime = Date.now()
    
    for (const [key, entry] of cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed
        lruKey = key
      }
    }
    
    if (lruKey) {
      cache.delete(lruKey)
      this.stats.evictions++
    }
  }

  private getDataSize(data: any): number {
    return JSON.stringify(data).length * 2 // Rough estimate in bytes
  }

  private compressData<T>(data: T): T {
    // Simple compression simulation - in production use actual compression
    return data
  }

  private updateTotalSize(): void {
    this.stats.totalSize = this.memoryCache.size + this.queryResultCache.size + this.entityCache.size
  }

  private updateHitRatio(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRatio = total > 0 ? this.stats.hits / total : 0
  }

  private startCacheManagement(): void {
    // Cleanup expired entries every 5 minutes
    setInterval(() => {
      this.cleanupExpired()
    }, 5 * 60 * 1000)
    
    // Performance analysis every hour
    setInterval(() => {
      this.logPerformanceAnalysis()
    }, 60 * 60 * 1000)
  }

  private cleanupExpired(): void {
    const now = Date.now()
    let cleaned = 0
    
    const caches = [
      { name: 'memory', cache: this.memoryCache },
      { name: 'query', cache: this.queryResultCache },
      { name: 'entity', cache: this.entityCache }
    ]
    
    for (const { name, cache } of caches) {
      for (const [key, entry] of cache.entries()) {
        if (now > entry.timestamp + entry.ttl) {
          cache.delete(key)
          cleaned++
        }
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} expired cache entries`)
      this.updateTotalSize()
    }
  }

  private logPerformanceAnalysis(): void {
    const stats = this.getStats()
    const analysis = this.getCacheAnalysis()
    
    console.log('📊 Cache Performance Analysis:', {
      hitRatio: `${(stats.hitRatio * 100).toFixed(2)}%`,
      totalSize: stats.totalSize,
      evictions: stats.evictions,
      topQuery: analysis.topQueries[0]?.query || 'none',
      recommendations: analysis.recommendations.length
    })
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.memoryCache.clear()
    this.queryResultCache.clear()
    this.entityCache.clear()
    
    this.stats = {
      hits: 0,
      misses: 0,
      hitRatio: 0,
      totalSize: 0,
      evictions: 0,
      compressions: 0
    }
    
    console.log('All caches cleared')
  }
}

// Export singleton instance
export const cacheService = new CacheService()