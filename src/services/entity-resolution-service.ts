/**
 * Entity Resolution Service for Text-to-SQL
 * Handles mapping of natural language entities to database identifiers
 */

import { supabase } from '@/lib/supabase'
import { schemaContextService } from './schema-context-service'

export interface EntityResolution {
  original: string
  resolved: string
  confidence: number
  type: 'equipment' | 'system' | 'location' | 'parameter' | 'status' | 'department' | 'time_period'
  alternative_matches?: string[]
  context?: any
}

export interface EntityExtractionResult {
  entities: EntityResolution[]
  unresolved: string[]
  confidence: number
  suggestions: string[]
}

export interface EntityPattern {
  regex: RegExp
  type: string
  resolver: (match: string) => Promise<EntityResolution[]>
  priority: number
}

export class EntityResolutionService {
  private patterns: EntityPattern[] = []
  private equipmentCache: Map<string, any> = new Map()
  private systemCache: Map<string, any> = new Map()
  private lastCacheUpdate: Date | null = null
  private readonly CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

  constructor() {
    this.initializePatterns()
    this.loadEntityCaches()
  }

  private initializePatterns() {
    this.patterns = [
      // Equipment ID patterns (highest priority)
      {
        regex: /\b([A-Z]{1,3}-?\d{1,4})\b/g,
        type: 'equipment',
        resolver: this.resolveEquipmentId.bind(this),
        priority: 10
      },
      {
        regex: /(?:equipment|機器|設備)\s*([A-Z]{1,3}-?\d{1,4})/gi,
        type: 'equipment',
        resolver: this.resolveEquipmentId.bind(this),
        priority: 9
      },
      
      // System patterns
      {
        regex: /\b(SYS-\d{3})\b/gi,
        type: 'system',
        resolver: this.resolveSystemId.bind(this),
        priority: 8
      },
      {
        regex: /(?:system|システム)\s*([A-Za-z]\d*)/gi,
        type: 'system',
        resolver: this.resolveSystemName.bind(this),
        priority: 7
      },
      
      // Equipment type patterns
      {
        regex: /\b(?:heat\s*exchanger|熱交換器|HX)\b/gi,
        type: 'equipment_type',
        resolver: this.resolveEquipmentType.bind(this),
        priority: 6
      },
      {
        regex: /\b(?:pump|ポンプ|PU)\b/gi,
        type: 'equipment_type',
        resolver: this.resolveEquipmentType.bind(this),
        priority: 6
      },
      {
        regex: /\b(?:tank|タンク|TK)\b/gi,
        type: 'equipment_type',
        resolver: this.resolveEquipmentType.bind(this),
        priority: 6
      },
      {
        regex: /\b(?:vessel|容器|VE)\b/gi,
        type: 'equipment_type',
        resolver: this.resolveEquipmentType.bind(this),
        priority: 6
      },
      
      // Location patterns
      {
        regex: /\b(?:process\s*area|プロセスエリア|プロセス区域)\b/gi,
        type: 'location',
        resolver: this.resolveLocation.bind(this),
        priority: 5
      },
      {
        regex: /\b(?:utility\s*area|ユーティリティエリア|ユーティリティ区域)\b/gi,
        type: 'location',
        resolver: this.resolveLocation.bind(this),
        priority: 5
      },
      {
        regex: /\b(?:control\s*room|制御室|計器室)\b/gi,
        type: 'location',
        resolver: this.resolveLocation.bind(this),
        priority: 5
      },
      
      // Parameter patterns
      {
        regex: /\b(?:temperature|温度|temp)\b/gi,
        type: 'parameter',
        resolver: this.resolveParameter.bind(this),
        priority: 4
      },
      {
        regex: /\b(?:pressure|圧力|press)\b/gi,
        type: 'parameter',
        resolver: this.resolveParameter.bind(this),
        priority: 4
      },
      {
        regex: /\b(?:flow|流量|flow\s*rate)\b/gi,
        type: 'parameter',
        resolver: this.resolveParameter.bind(this),
        priority: 4
      },
      {
        regex: /\b(?:level|レベル|液位)\b/gi,
        type: 'parameter',
        resolver: this.resolveParameter.bind(this),
        priority: 4
      },
      {
        regex: /\b(?:thickness|肉厚|wall\s*thickness)\b/gi,
        type: 'parameter',
        resolver: this.resolveParameter.bind(this),
        priority: 4
      },
      
      // Status patterns
      {
        regex: /\b(?:running|稼働中|operating|運転中)\b/gi,
        type: 'status',
        resolver: this.resolveStatus.bind(this),
        priority: 3
      },
      {
        regex: /\b(?:stopped|停止中|shutdown|停止)\b/gi,
        type: 'status',
        resolver: this.resolveStatus.bind(this),
        priority: 3
      },
      {
        regex: /\b(?:maintenance|保守中|メンテナンス中|under\s*maintenance)\b/gi,
        type: 'status',
        resolver: this.resolveStatus.bind(this),
        priority: 3
      },
      
      // Department patterns
      {
        regex: /\b(?:refinery|製油所|refining)\b/gi,
        type: 'department',
        resolver: this.resolveDepartment.bind(this),
        priority: 2
      },
      {
        regex: /\b(?:maintenance|保全部|メンテナンス部)\b/gi,
        type: 'department',
        resolver: this.resolveDepartment.bind(this),
        priority: 2
      },
      
      // Time period patterns
      {
        regex: /\b(?:last|past|recent)\s*(\d+)\s*(day|week|month|year)s?\b/gi,
        type: 'time_period',
        resolver: this.resolveTimePeriod.bind(this),
        priority: 1
      },
      {
        regex: /\b(?:直近|過去|最近)\s*(\d+)\s*(日|週|月|年)\b/gi,
        type: 'time_period',
        resolver: this.resolveTimePeriod.bind(this),
        priority: 1
      },
      {
        regex: /\b(?:today|yesterday|this\s*week|this\s*month|this\s*year)\b/gi,
        type: 'time_period',
        resolver: this.resolveTimePeriod.bind(this),
        priority: 1
      },
      {
        regex: /\b(?:今日|昨日|今週|今月|今年)\b/gi,
        type: 'time_period',
        resolver: this.resolveTimePeriod.bind(this),
        priority: 1
      }
    ]
  }

  /**
   * Extract and resolve entities from natural language query
   */
  async extractAndResolveEntities(query: string): Promise<EntityExtractionResult> {
    const resolvedEntities: EntityResolution[] = []
    const processedRanges: Array<{start: number, end: number}> = []
    const unresolved: string[] = []
    
    // Sort patterns by priority (highest first)
    const sortedPatterns = [...this.patterns].sort((a, b) => b.priority - a.priority)
    
    for (const pattern of sortedPatterns) {
      const matches = [...query.matchAll(pattern.regex)]
      
      for (const match of matches) {
        const matchStart = match.index!
        const matchEnd = matchStart + match[0].length
        
        // Check if this range overlaps with already processed ranges
        const overlaps = processedRanges.some(range => 
          (matchStart >= range.start && matchStart < range.end) ||
          (matchEnd > range.start && matchEnd <= range.end) ||
          (matchStart < range.start && matchEnd > range.end)
        )
        
        if (!overlaps) {
          try {
            const entities = await pattern.resolver(match[0])
            if (entities.length > 0) {
              resolvedEntities.push(...entities)
              processedRanges.push({start: matchStart, end: matchEnd})
            } else {
              unresolved.push(match[0])
            }
          } catch (error) {
            console.warn(`Entity resolution failed for ${match[0]}:`, error)
            unresolved.push(match[0])
          }
        }
      }
    }
    
    // Calculate overall confidence
    const totalMatches = resolvedEntities.length + unresolved.length
    const confidence = totalMatches > 0 ? resolvedEntities.length / totalMatches : 0
    
    // Generate suggestions for unresolved entities
    const suggestions = await this.generateSuggestions(unresolved)
    
    return {
      entities: resolvedEntities,
      unresolved,
      confidence,
      suggestions
    }
  }

  /**
   * Resolve equipment ID
   */
  private async resolveEquipmentId(match: string): Promise<EntityResolution[]> {
    await this.refreshCacheIfNeeded()
    
    // Normalize equipment ID format
    const normalizedId = this.normalizeEquipmentId(match)
    
    // Try exact match first
    if (this.equipmentCache.has(normalizedId)) {
      const equipment = this.equipmentCache.get(normalizedId)
      return [{
        original: match,
        resolved: normalizedId,
        confidence: 1.0,
        type: 'equipment',
        context: equipment
      }]
    }
    
    // Try fuzzy matching
    const fuzzyMatches = this.findFuzzyEquipmentMatches(normalizedId)
    if (fuzzyMatches.length > 0) {
      return fuzzyMatches.map(fuzzyMatch => ({
        original: match,
        resolved: fuzzyMatch.id,
        confidence: fuzzyMatch.confidence,
        type: 'equipment' as const,
        context: fuzzyMatch.equipment,
        alternative_matches: fuzzyMatches.slice(1, 4).map(m => m.id)
      }))
    }
    
    return []
  }

  /**
   * Resolve system ID
   */
  private async resolveSystemId(match: string): Promise<EntityResolution[]> {
    await this.refreshCacheIfNeeded()
    
    const normalizedId = match.toUpperCase()
    
    if (this.systemCache.has(normalizedId)) {
      const system = this.systemCache.get(normalizedId)
      return [{
        original: match,
        resolved: normalizedId,
        confidence: 1.0,
        type: 'system',
        context: system
      }]
    }
    
    return []
  }

  /**
   * Resolve system name
   */
  private async resolveSystemName(match: string): Promise<EntityResolution[]> {
    await this.refreshCacheIfNeeded()
    
    const normalized = match.toLowerCase()
    
    // Map common system names
    const systemMappings = {
      'system a': 'SYS-001',
      'system b': 'SYS-002',
      'system c': 'SYS-003',
      'システムa': 'SYS-001',
      'システムb': 'SYS-002',
      'システムc': 'SYS-003'
    }
    
    const mappedSystem = systemMappings[normalized as keyof typeof systemMappings]
    if (mappedSystem && this.systemCache.has(mappedSystem)) {
      const system = this.systemCache.get(mappedSystem)
      return [{
        original: match,
        resolved: mappedSystem,
        confidence: 0.9,
        type: 'system',
        context: system
      }]
    }
    
    return []
  }

  /**
   * Resolve equipment type
   */
  private async resolveEquipmentType(match: string): Promise<EntityResolution[]> {
    const typeMap = {
      'heat exchanger': 'HEAT_EXCHANGER',
      '熱交換器': 'HEAT_EXCHANGER',
      'hx': 'HEAT_EXCHANGER',
      'pump': 'PUMP',
      'ポンプ': 'PUMP',
      'pu': 'PUMP',
      'tank': 'TANK',
      'タンク': 'TANK',
      'tk': 'TANK',
      'vessel': 'VESSEL',
      '容器': 'VESSEL',
      've': 'VESSEL'
    }
    
    const normalized = match.toLowerCase()
    const resolved = typeMap[normalized as keyof typeof typeMap]
    
    if (resolved) {
      return [{
        original: match,
        resolved: resolved,
        confidence: 0.95,
        type: 'equipment_type' as any,
        context: { type_name: resolved }
      }]
    }
    
    return []
  }

  /**
   * Resolve location
   */
  private async resolveLocation(match: string): Promise<EntityResolution[]> {
    const locationMap = {
      'process area': 'プロセスエリア',
      'プロセスエリア': 'プロセスエリア',
      'プロセス区域': 'プロセスエリア',
      'utility area': 'ユーティリティエリア',
      'ユーティリティエリア': 'ユーティリティエリア',
      'ユーティリティ区域': 'ユーティリティエリア',
      'control room': '制御室',
      '制御室': '制御室',
      '計器室': '制御室'
    }
    
    const normalized = match.toLowerCase()
    const resolved = locationMap[normalized as keyof typeof locationMap]
    
    if (resolved) {
      return [{
        original: match,
        resolved: resolved,
        confidence: 0.9,
        type: 'location',
        context: { location_name: resolved }
      }]
    }
    
    return []
  }

  /**
   * Resolve parameter
   */
  private async resolveParameter(match: string): Promise<EntityResolution[]> {
    const parameterMap = {
      'temperature': '温度',
      '温度': '温度',
      'temp': '温度',
      'pressure': '圧力',
      '圧力': '圧力',
      'press': '圧力',
      'flow': '流量',
      '流量': '流量',
      'flow rate': '流量',
      'level': 'レベル',
      'レベル': 'レベル',
      '液位': 'レベル',
      'thickness': '肉厚',
      '肉厚': '肉厚',
      'wall thickness': '肉厚'
    }
    
    const normalized = match.toLowerCase()
    const resolved = parameterMap[normalized as keyof typeof parameterMap]
    
    if (resolved) {
      return [{
        original: match,
        resolved: resolved,
        confidence: 0.95,
        type: 'parameter',
        context: { parameter_name: resolved }
      }]
    }
    
    return []
  }

  /**
   * Resolve status
   */
  private async resolveStatus(match: string): Promise<EntityResolution[]> {
    const statusMap = {
      'running': '稼働中',
      '稼働中': '稼働中',
      'operating': '稼働中',
      '運転中': '稼働中',
      'stopped': '停止中',
      '停止中': '停止中',
      'shutdown': '停止中',
      '停止': '停止中',
      'maintenance': '保守中',
      '保守中': '保守中',
      'メンテナンス中': '保守中',
      'under maintenance': '保守中'
    }
    
    const normalized = match.toLowerCase()
    const resolved = statusMap[normalized as keyof typeof statusMap]
    
    if (resolved) {
      return [{
        original: match,
        resolved: resolved,
        confidence: 0.9,
        type: 'status',
        context: { status_name: resolved }
      }]
    }
    
    return []
  }

  /**
   * Resolve department
   */
  private async resolveDepartment(match: string): Promise<EntityResolution[]> {
    const departmentMap = {
      'refinery': 'REFINERY',
      '製油所': 'REFINERY',
      'refining': 'REFINERY',
      'maintenance': 'MAINTENANCE',
      '保全部': 'MAINTENANCE',
      'メンテナンス部': 'MAINTENANCE'
    }
    
    const normalized = match.toLowerCase()
    const resolved = departmentMap[normalized as keyof typeof departmentMap]
    
    if (resolved) {
      return [{
        original: match,
        resolved: resolved,
        confidence: 0.9,
        type: 'department',
        context: { department_name: resolved }
      }]
    }
    
    return []
  }

  /**
   * Resolve time period
   */
  private async resolveTimePeriod(match: string): Promise<EntityResolution[]> {
    const timePattern = /(?:last|past|recent|直近|過去|最近)?\s*(\d+)?\s*(day|week|month|year|日|週|月|年)s?/i
    const specialPattern = /today|yesterday|this\s*week|this\s*month|this\s*year|今日|昨日|今週|今月|今年/i
    
    let resolved: string
    let confidence = 0.95
    
    if (specialPattern.test(match)) {
      const specialMap = {
        'today': 'today',
        'yesterday': 'yesterday',
        'this week': 'this_week',
        'this month': 'this_month',
        'this year': 'this_year',
        '今日': 'today',
        '昨日': 'yesterday',
        '今週': 'this_week',
        '今月': 'this_month',
        '今年': 'this_year'
      }
      
      const normalized = match.toLowerCase()
      resolved = specialMap[normalized as keyof typeof specialMap] || match
    } else {
      const timeMatch = match.match(timePattern)
      if (timeMatch) {
        const number = timeMatch[1] || '1'
        const unit = timeMatch[2]
        
        const unitMap = {
          'day': 'days',
          'week': 'weeks',
          'month': 'months',
          'year': 'years',
          '日': 'days',
          '週': 'weeks',
          '月': 'months',
          '年': 'years'
        }
        
        const normalizedUnit = unitMap[unit as keyof typeof unitMap] || unit
        resolved = `${number}_${normalizedUnit}`
      } else {
        resolved = match
        confidence = 0.7
      }
    }
    
    return [{
      original: match,
      resolved: resolved,
      confidence: confidence,
      type: 'time_period',
      context: { period_description: resolved }
    }]
  }

  /**
   * Load entity caches from database
   */
  private async loadEntityCaches(): Promise<void> {
    try {
      // Load equipment cache
      const { data: equipmentData } = await supabase
        .from('equipment')
        .select('equipment_id, equipment_name, location, operational_status, equipment_type_master(equipment_type_name)')
      
      if (equipmentData) {
        this.equipmentCache.clear()
        equipmentData.forEach(equipment => {
          this.equipmentCache.set(equipment.equipment_id, equipment)
        })
      }
      
      // Load system cache (if systems table exists)
      const { data: systemData } = await supabase
        .from('equipment')
        .select('equipment_id')
        .limit(1)
      
      // For now, create a simple system cache
      this.systemCache.clear()
      this.systemCache.set('SYS-001', { system_id: 'SYS-001', system_name: 'プロセス冷却系統' })
      this.systemCache.set('SYS-002', { system_id: 'SYS-002', system_name: '原料供給系統' })
      this.systemCache.set('SYS-003', { system_id: 'SYS-003', system_name: 'ユーティリティ系統' })
      
      this.lastCacheUpdate = new Date()
    } catch (error) {
      console.error('Failed to load entity caches:', error)
    }
  }

  /**
   * Refresh cache if needed
   */
  private async refreshCacheIfNeeded(): Promise<void> {
    if (!this.lastCacheUpdate || 
        Date.now() - this.lastCacheUpdate.getTime() > this.CACHE_DURATION) {
      await this.loadEntityCaches()
    }
  }

  /**
   * Normalize equipment ID format
   */
  private normalizeEquipmentId(id: string): string {
    // Remove spaces and convert to uppercase
    let normalized = id.replace(/\s+/g, '').toUpperCase()
    
    // Ensure proper format with hyphen
    const match = normalized.match(/^([A-Z]+)(\d+)$/)
    if (match) {
      normalized = `${match[1]}-${match[2]}`
    }
    
    return normalized
  }

  /**
   * Find fuzzy matches for equipment IDs
   */
  private findFuzzyEquipmentMatches(targetId: string): Array<{id: string, confidence: number, equipment: any}> {
    const matches: Array<{id: string, confidence: number, equipment: any}> = []
    
    for (const [equipmentId, equipment] of this.equipmentCache) {
      const similarity = this.calculateStringSimilarity(targetId, equipmentId)
      if (similarity > 0.7) {
        matches.push({
          id: equipmentId,
          confidence: similarity,
          equipment: equipment
        })
      }
    }
    
    return matches.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Calculate string similarity (Levenshtein distance based)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length
    const len2 = str2.length
    
    if (len1 === 0) return len2 === 0 ? 1 : 0
    if (len2 === 0) return 0
    
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null))
    
    for (let i = 0; i <= len1; i++) matrix[i][0] = i
    for (let j = 0; j <= len2; j++) matrix[0][j] = j
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        )
      }
    }
    
    const maxLen = Math.max(len1, len2)
    return (maxLen - matrix[len1][len2]) / maxLen
  }

  /**
   * Generate suggestions for unresolved entities
   */
  private async generateSuggestions(unresolved: string[]): Promise<string[]> {
    const suggestions: string[] = []
    
    for (const entity of unresolved) {
      if (entity.match(/^[A-Z]{1,3}\d+$/)) {
        // Looks like an equipment ID without hyphen
        suggestions.push(`Try "${entity.replace(/([A-Z]+)(\d+)/, '$1-$2')}" instead of "${entity}"`)
      } else if (entity.toLowerCase().includes('system')) {
        suggestions.push(`Use specific system IDs like "SYS-001" instead of "${entity}"`)
      } else if (entity.match(/\d+\s*(day|week|month|year)/)) {
        suggestions.push(`Use "last ${entity}" or "past ${entity}" for time references`)
      }
    }
    
    // Add general suggestions
    if (unresolved.length > 0) {
      suggestions.push('Check spelling and use standard naming conventions')
      suggestions.push('Use equipment IDs in format: HX-101, PU-200, TK-101')
    }
    
    return suggestions
  }

  /**
   * Get resolved entities by type
   */
  getEntitiesByType(entities: EntityResolution[], type: string): EntityResolution[] {
    return entities.filter(entity => entity.type === type)
  }

  /**
   * Get highest confidence entity of a type
   */
  getBestEntityOfType(entities: EntityResolution[], type: string): EntityResolution | null {
    const typeEntities = this.getEntitiesByType(entities, type)
    if (typeEntities.length === 0) return null
    
    return typeEntities.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    )
  }

  /**
   * Get service statistics
   */
  getStats(): {
    patterns: number
    equipmentCacheSize: number
    systemCacheSize: number
    lastCacheUpdate: Date | null
  } {
    return {
      patterns: this.patterns.length,
      equipmentCacheSize: this.equipmentCache.size,
      systemCacheSize: this.systemCache.size,
      lastCacheUpdate: this.lastCacheUpdate
    }
  }
}

// Export singleton instance
export const entityResolutionService = new EntityResolutionService()