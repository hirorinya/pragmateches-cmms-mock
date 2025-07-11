/**
 * Few-Shot Learning Service for Text-to-SQL
 * Provides CMMS-specific examples for better SQL generation
 */

import { schemaContextService } from './schema-context-service'

export interface FewShotExample {
  natural_language: string
  sql: string
  explanation: string
  tables_used: string[]
  complexity_level: 'basic' | 'intermediate' | 'advanced'
  category: string
  result_description: string
}

export interface FewShotContext {
  examples: FewShotExample[]
  explanation: string
  best_practices: string[]
}

export class FewShotLearningService {
  private examples: FewShotExample[] = []

  constructor() {
    this.initializeExamples()
  }

  private initializeExamples() {
    this.examples = [
      // Basic Equipment Queries
      {
        natural_language: "Tell me about equipment HX-101",
        sql: `SELECT e.設備ID, e.設備名, e.設置場所, e.稼働状態, etm.設備種別名
FROM equipment e
LEFT JOIN equipment_type_master etm ON e.設備種別ID = etm.id
WHERE e.設備ID = 'HX-101'`,
        explanation: "Basic equipment information lookup with type details",
        tables_used: ['equipment', 'equipment_type_master'],
        complexity_level: 'basic',
        category: 'equipment_info',
        result_description: "Returns basic equipment details including name, location, status, and type"
      },
      {
        natural_language: "Show me all heat exchangers",
        sql: `SELECT e.設備ID, e.設備名, e.設置場所, e.稼働状態
FROM equipment e
JOIN equipment_type_master etm ON e.設備種別ID = etm.id
WHERE etm.設備種別名 LIKE '%熱交換器%' OR etm.設備種別名 LIKE '%Heat Exchanger%'`,
        explanation: "Filter equipment by type using JOIN with type master table",
        tables_used: ['equipment', 'equipment_type_master'],
        complexity_level: 'basic',
        category: 'equipment_filtering',
        result_description: "Returns all equipment of heat exchanger type"
      },
      {
        natural_language: "What equipment is in the process area?",
        sql: `SELECT 設備ID, 設備名, 設置場所, 稼働状態
FROM equipment
WHERE 設置場所 LIKE '%プロセス%' OR 設置場所 LIKE '%Process%'`,
        explanation: "Filter equipment by location using pattern matching",
        tables_used: ['equipment'],
        complexity_level: 'basic',
        category: 'location_filtering',
        result_description: "Returns equipment located in process areas"
      },

      // Maintenance History Queries
      {
        natural_language: "Show me maintenance history for HX-101",
        sql: `SELECT mh.実施日, mh.作業内容, mh.作業結果, mh.コスト, e.設備名
FROM maintenance_history mh
JOIN equipment e ON mh.設備ID = e.設備ID
WHERE mh.設備ID = 'HX-101'
ORDER BY mh.実施日 DESC`,
        explanation: "Equipment-specific maintenance history with chronological ordering",
        tables_used: ['maintenance_history', 'equipment'],
        complexity_level: 'basic',
        category: 'maintenance_history',
        result_description: "Returns maintenance records for specific equipment ordered by date"
      },
      {
        natural_language: "What maintenance was done in the last 30 days?",
        sql: `SELECT mh.設備ID, e.設備名, mh.実施日, mh.作業内容, mh.コスト
FROM maintenance_history mh
JOIN equipment e ON mh.設備ID = e.設備ID
WHERE mh.実施日 >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY mh.実施日 DESC`,
        explanation: "Time-based maintenance query using date arithmetic",
        tables_used: ['maintenance_history', 'equipment'],
        complexity_level: 'intermediate',
        category: 'time_based_maintenance',
        result_description: "Returns recent maintenance activities within specified timeframe"
      },
      {
        natural_language: "Show me equipment with maintenance in the last month",
        sql: `SELECT e.設備ID, e.設備名, 
       COUNT(mh.id) as メンテナンス回数,
       MAX(mh.実施日) as 最新メンテナンス日,
       SUM(mh.コスト) as 総コスト
FROM equipment e
JOIN maintenance_history mh ON e.設備ID = mh.設備ID
WHERE mh.実施日 >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY e.設備ID, e.設備名
ORDER BY 最新メンテナンス日 DESC`,
        explanation: "Aggregate maintenance data by equipment with grouping and calculations",
        tables_used: ['equipment', 'maintenance_history'],
        complexity_level: 'intermediate',
        category: 'maintenance_aggregation',
        result_description: "Returns equipment with maintenance counts, latest dates, and total costs"
      },

      // Risk Analysis Queries
      {
        natural_language: "Show me high-risk equipment",
        sql: `SELECT era.設備ID, e.設備名, era.故障モード, era.リスクスコア, era.影響度ランク
FROM equipment_risk_assessment era
JOIN equipment e ON era.設備ID = e.設備ID
WHERE era.リスクスコア > 100
ORDER BY era.リスクスコア DESC`,
        explanation: "Risk-based filtering with threshold and ranking",
        tables_used: ['equipment_risk_assessment', 'equipment'],
        complexity_level: 'intermediate',
        category: 'risk_analysis',
        result_description: "Returns equipment with high risk scores above threshold"
      },
      {
        natural_language: "What are the risk factors for equipment HX-101?",
        sql: `SELECT era.故障モード, era.リスクスコア, era.影響度ランク, era.信頼性ランク, 
       era.検出性ランク, era.対策内容
FROM equipment_risk_assessment era
WHERE era.設備ID = 'HX-101'
ORDER BY era.リスクスコア DESC`,
        explanation: "Comprehensive risk assessment for specific equipment",
        tables_used: ['equipment_risk_assessment'],
        complexity_level: 'basic',
        category: 'equipment_risk_details',
        result_description: "Returns detailed risk assessment including all risk factors"
      },
      {
        natural_language: "Which equipment has corrosion risk?",
        sql: `SELECT era.設備ID, e.設備名, era.リスクスコア, era.影響度ランク
FROM equipment_risk_assessment era
JOIN equipment e ON era.設備ID = e.設備ID
WHERE era.故障モード LIKE '%腐食%' OR era.故障モード LIKE '%Corrosion%'
ORDER BY era.リスクスコア DESC`,
        explanation: "Failure mode specific risk analysis using pattern matching",
        tables_used: ['equipment_risk_assessment', 'equipment'],
        complexity_level: 'intermediate',
        category: 'failure_mode_analysis',
        result_description: "Returns equipment with corrosion-related risks"
      },

      // Thickness Measurement Queries
      {
        natural_language: "Show me thickness measurements for HX-101",
        sql: `SELECT tm.検査日, tm.測定箇所, tm.肉厚測定値, tm.最小許容肉厚,
       (tm.肉厚測定値 - tm.最小許容肉厚) as 余裕厚さ
FROM thickness_measurement tm
WHERE tm.設備ID = 'HX-101'
ORDER BY tm.検査日 DESC, tm.測定箇所`,
        explanation: "Thickness data with calculated margin and temporal ordering",
        tables_used: ['thickness_measurement'],
        complexity_level: 'intermediate',
        category: 'thickness_analysis',
        result_description: "Returns thickness measurements with safety margins"
      },
      {
        natural_language: "Which equipment is approaching minimum thickness?",
        sql: `SELECT tm.設備ID, e.設備名, tm.測定箇所, tm.肉厚測定値, tm.最小許容肉厚,
       ((tm.肉厚測定値 - tm.最小許容肉厚) / tm.最小許容肉厚 * 100) as 余裕率
FROM thickness_measurement tm
JOIN equipment e ON tm.設備ID = e.設備ID
WHERE tm.肉厚測定値 < tm.最小許容肉厚 * 1.2
ORDER BY 余裕率 ASC`,
        explanation: "Critical thickness analysis with percentage calculations",
        tables_used: ['thickness_measurement', 'equipment'],
        complexity_level: 'advanced',
        category: 'critical_thickness',
        result_description: "Returns equipment approaching minimum thickness limits"
      },

      // Complex Multi-Table Queries
      {
        natural_language: "Show me equipment with both high risk and recent maintenance",
        sql: `SELECT e.設備ID, e.設備名, 
       era.リスクスコア, era.故障モード,
       mh.実施日 as 最新メンテナンス日, mh.作業内容
FROM equipment e
JOIN equipment_risk_assessment era ON e.設備ID = era.設備ID
JOIN maintenance_history mh ON e.設備ID = mh.設備ID
WHERE era.リスクスコア > 100 
  AND mh.実施日 >= CURRENT_DATE - INTERVAL '90 days'
  AND mh.実施日 = (
    SELECT MAX(mh2.実施日) 
    FROM maintenance_history mh2 
    WHERE mh2.設備ID = e.設備ID
  )
ORDER BY era.リスクスコア DESC`,
        explanation: "Multi-table query with risk and maintenance correlation using subquery",
        tables_used: ['equipment', 'equipment_risk_assessment', 'maintenance_history'],
        complexity_level: 'advanced',
        category: 'risk_maintenance_correlation',
        result_description: "Returns high-risk equipment with recent maintenance activities"
      },
      {
        natural_language: "What's the maintenance cost trend for heat exchangers?",
        sql: `SELECT 
  DATE_TRUNC('month', mh.実施日) as 月,
  COUNT(*) as メンテナンス回数,
  SUM(mh.コスト) as 月間コスト,
  AVG(mh.コスト) as 平均コスト
FROM maintenance_history mh
JOIN equipment e ON mh.設備ID = e.設備ID
JOIN equipment_type_master etm ON e.設備種別ID = etm.id
WHERE etm.設備種別名 LIKE '%熱交換器%'
  AND mh.実施日 >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', mh.実施日)
ORDER BY 月 DESC`,
        explanation: "Time series analysis with aggregation and date functions",
        tables_used: ['maintenance_history', 'equipment', 'equipment_type_master'],
        complexity_level: 'advanced',
        category: 'cost_trend_analysis',
        result_description: "Returns monthly maintenance cost trends for equipment type"
      },

      // System-based Queries
      {
        natural_language: "Show me all equipment in the cooling system",
        sql: `SELECT e.設備ID, e.設備名, e.設置場所, e.稼働状態, etm.設備種別名
FROM equipment e
JOIN equipment_type_master etm ON e.設備種別ID = etm.id
WHERE e.設備ID LIKE 'HX-%' OR e.設備ID LIKE 'PU-%'
ORDER BY e.設備ID`,
        explanation: "System-based equipment filtering using ID patterns",
        tables_used: ['equipment', 'equipment_type_master'],
        complexity_level: 'basic',
        category: 'system_equipment',
        result_description: "Returns equipment belonging to specific systems"
      },

      // Performance and Efficiency Queries
      {
        natural_language: "Which equipment has the highest maintenance frequency?",
        sql: `SELECT e.設備ID, e.設備名, 
       COUNT(mh.id) as メンテナンス回数,
       MIN(mh.実施日) as 初回メンテナンス,
       MAX(mh.実施日) as 最新メンテナンス,
       EXTRACT(DAYS FROM (MAX(mh.実施日) - MIN(mh.実施日))) / NULLIF(COUNT(mh.id) - 1, 0) as 平均間隔日数
FROM equipment e
JOIN maintenance_history mh ON e.設備ID = mh.設備ID
GROUP BY e.設備ID, e.設備名
HAVING COUNT(mh.id) > 1
ORDER BY メンテナンス回数 DESC, 平均間隔日数 ASC`,
        explanation: "Frequency analysis with interval calculations and filtering",
        tables_used: ['equipment', 'maintenance_history'],
        complexity_level: 'advanced',
        category: 'maintenance_frequency',
        result_description: "Returns equipment ranked by maintenance frequency and intervals"
      }
    ]
  }

  /**
   * Get relevant examples for a given query
   */
  getFewShotExamples(query: string, maxExamples: number = 5): FewShotExample[] {
    const queryLower = query.toLowerCase()
    
    // Score examples based on relevance
    const scoredExamples = this.examples.map(example => {
      let score = 0
      
      // Direct natural language similarity
      const nlSimilarity = this.calculateSimilarity(example.natural_language.toLowerCase(), queryLower)
      score += nlSimilarity * 3
      
      // Category relevance
      if (this.detectCategory(queryLower) === example.category) {
        score += 2
      }
      
      // Keyword matching
      const keywords = this.extractKeywords(queryLower)
      const exampleKeywords = this.extractKeywords(example.natural_language.toLowerCase())
      const keywordOverlap = keywords.filter(k => exampleKeywords.includes(k)).length
      score += keywordOverlap * 0.5
      
      // Table relevance
      const queryTables = this.extractTableReferences(queryLower)
      const tableOverlap = queryTables.filter(t => example.tables_used.includes(t)).length
      score += tableOverlap * 1.5
      
      return { example, score }
    })
    
    // Sort by score and return top examples
    return scoredExamples
      .sort((a, b) => b.score - a.score)
      .slice(0, maxExamples)
      .map(item => item.example)
  }

  /**
   * Generate few-shot prompt for LLM
   */
  async generateFewShotPrompt(query: string): Promise<string> {
    const examples = this.getFewShotExamples(query)
    const schemaPrompt = await schemaContextService.generateSchemaPrompt(query)
    
    let prompt = `# Text-to-SQL for CMMS Database\n\n`
    
    // Add schema context
    prompt += schemaPrompt
    
    // Add few-shot examples
    prompt += `## Example Queries:\n\n`
    
    examples.forEach((example, index) => {
      prompt += `### Example ${index + 1}:\n`
      prompt += `**Natural Language:** ${example.natural_language}\n`
      prompt += `**SQL:**\n\`\`\`sql\n${example.sql}\n\`\`\`\n`
      prompt += `**Explanation:** ${example.explanation}\n`
      prompt += `**Expected Result:** ${example.result_description}\n\n`
    })
    
    // Add best practices
    prompt += `## Best Practices:\n`
    prompt += `1. Always join with equipment table to get equipment names\n`
    prompt += `2. Use proper date filtering for time-based queries\n`
    prompt += `3. Order results by relevance (date DESC, risk score DESC, etc.)\n`
    prompt += `4. Include calculated fields when useful (margins, percentages)\n`
    prompt += `5. Use appropriate JOINs based on relationships\n`
    prompt += `6. Handle both Japanese and English column names\n`
    prompt += `7. Use pattern matching for flexible text searches\n`
    prompt += `8. Always include equipment ID and name in results\n\n`
    
    return prompt
  }

  /**
   * Get examples by category
   */
  getExamplesByCategory(category: string): FewShotExample[] {
    return this.examples.filter(example => example.category === category)
  }

  /**
   * Get examples by complexity level
   */
  getExamplesByComplexity(level: 'basic' | 'intermediate' | 'advanced'): FewShotExample[] {
    return this.examples.filter(example => example.complexity_level === level)
  }

  /**
   * Add new example (for dynamic learning)
   */
  addExample(example: FewShotExample): void {
    this.examples.push(example)
  }

  /**
   * Get all available categories
   */
  getAvailableCategories(): string[] {
    return [...new Set(this.examples.map(example => example.category))]
  }

  /**
   * Calculate similarity between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(/\s+/)
    const words2 = str2.split(/\s+/)
    const intersection = words1.filter(word => words2.includes(word))
    const union = [...new Set([...words1, ...words2])]
    return intersection.length / union.length
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    const commonWords = ['show', 'get', 'find', 'what', 'which', 'how', 'when', 'where', 'me', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'for', 'with', 'in', 'on', 'at', 'to', 'from', 'of', 'and', 'or', 'but']
    return query.split(/\s+/).filter(word => 
      word.length > 2 && !commonWords.includes(word)
    )
  }

  /**
   * Extract table references from query
   */
  private extractTableReferences(query: string): string[] {
    const tables = []
    if (query.includes('equipment') || query.includes('機器') || query.includes('設備')) {
      tables.push('equipment')
    }
    if (query.includes('maintenance') || query.includes('メンテナンス') || query.includes('保全')) {
      tables.push('maintenance_history')
    }
    if (query.includes('risk') || query.includes('リスク') || query.includes('故障')) {
      tables.push('equipment_risk_assessment')
    }
    if (query.includes('thickness') || query.includes('肉厚') || query.includes('測定')) {
      tables.push('thickness_measurement')
    }
    return tables
  }

  /**
   * Detect query category
   */
  private detectCategory(query: string): string {
    if (query.includes('maintenance') || query.includes('メンテナンス')) {
      if (query.includes('history') || query.includes('履歴')) {
        return 'maintenance_history'
      }
      if (query.includes('cost') || query.includes('trend') || query.includes('コスト')) {
        return 'cost_trend_analysis'
      }
      return 'maintenance_aggregation'
    }
    
    if (query.includes('risk') || query.includes('リスク')) {
      return 'risk_analysis'
    }
    
    if (query.includes('thickness') || query.includes('肉厚')) {
      return 'thickness_analysis'
    }
    
    if (query.includes('equipment') && query.includes('info')) {
      return 'equipment_info'
    }
    
    return 'equipment_filtering'
  }

  /**
   * Get statistics about examples
   */
  getStats(): {
    total: number
    by_category: Record<string, number>
    by_complexity: Record<string, number>
  } {
    const stats = {
      total: this.examples.length,
      by_category: {} as Record<string, number>,
      by_complexity: {} as Record<string, number>
    }
    
    this.examples.forEach(example => {
      stats.by_category[example.category] = (stats.by_category[example.category] || 0) + 1
      stats.by_complexity[example.complexity_level] = (stats.by_complexity[example.complexity_level] || 0) + 1
    })
    
    return stats
  }
}

// Export singleton instance
export const fewShotLearningService = new FewShotLearningService()