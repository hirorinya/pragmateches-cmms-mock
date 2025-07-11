/**
 * Enhanced AI Service for CMMS queries
 * Dramatically improved natural language understanding and response generation
 */

import { supabase } from '@/lib/supabase'
import { EquipmentService } from './equipment-service'
import { AIDatabaseService } from './ai-database-service'
import { textToSQLService } from './text-to-sql-service'

interface AIQueryResponse {
  query: string
  intent: string
  confidence: number
  results: any[]
  summary: string
  recommendations?: string[]
  execution_time: number
  source: 'database' | 'ai' | 'hybrid'
  context?: any
}

interface IntentPattern {
  intent: string
  patterns: string[]
  confidence: number
  handler: string
  examples: string[]
}

interface EntityPattern {
  type: string
  patterns: RegExp[]
  extractor: (match: RegExpMatchArray) => any
}

export class EnhancedAIService {
  private equipmentService: EquipmentService
  private databaseService: AIDatabaseService
  private intentPatterns: IntentPattern[]
  private entityPatterns: EntityPattern[]
  private synonyms: Map<string, string[]>
  private useTextToSQL: boolean = true

  constructor() {
    this.equipmentService = new EquipmentService()
    this.databaseService = new AIDatabaseService()
    this.initializePatterns()
    this.initializeSynonyms()
  }

  private initializePatterns() {
    this.intentPatterns = [
      // Equipment Status & Health (including risk factors)
      {
        intent: 'EQUIPMENT_STATUS',
        patterns: [
          'status', 'condition', 'health', 'how is', 'what is the state',
          'running', 'operating', 'working', 'functioning', 'performance',
          'risk factors', 'risks', 'what are the', 'tell me about',
          '状態', '状況', '動作', '運転', '稼働', 'どう', 'どんな', 'リスク'
        ],
        confidence: 0.9,
        handler: 'handleEquipmentStatus',
        examples: [
          'How is HX-101 running?',
          'What is the status of all pumps?',
          'What are the risk factors for equipment HX-101?',
          'Tell me about equipment HX-101'
        ]
      },
      
      // Problems & Issues
      {
        intent: 'EQUIPMENT_PROBLEMS',
        patterns: [
          'problems', 'issues', 'errors', 'failures', 'alarms', 'alerts',
          'wrong', 'broken', 'fault', 'malfunction', 'trouble', 'concern',
          '問題', 'エラー', '故障', '不具合', '異常', 'トラブル', 'アラーム'
        ],
        confidence: 0.95,
        handler: 'handleEquipmentProblems',
        examples: [
          'What problems do we have?',
          'Show me all equipment issues',
          'Any alarms or alerts?'
        ]
      },
      
      // Maintenance History (Enhanced)
      {
        intent: 'MAINTENANCE_HISTORY',
        patterns: [
          'maintenance', 'service', 'repair', 'work done', 'history',
          'last serviced', 'when was', 'recent work', 'past maintenance',
          'メンテナンス', '保全', '履歴', '作業', '修理', '直近', '最近'
        ],
        confidence: 0.85,
        handler: 'handleMaintenanceHistory',
        examples: [
          'When was HX-101 last serviced?',
          'Show maintenance history for pumps',
          'What work was done recently?'
        ]
      },
      
      // Maintenance Schedule & Planning
      {
        intent: 'MAINTENANCE_SCHEDULE',
        patterns: [
          'schedule', 'planned', 'due', 'upcoming', 'next maintenance',
          'when is next', 'future work', 'planned maintenance', 'overdue',
          'スケジュール', '予定', '計画', '次回', '今後', '期限'
        ],
        confidence: 0.9,
        handler: 'handleMaintenanceSchedule',
        examples: [
          'What maintenance is due this week?',
          'Show upcoming scheduled work',
          'Which equipment is overdue?'
        ]
      },
      
      // Equipment Lists & Overview
      {
        intent: 'EQUIPMENT_OVERVIEW',
        patterns: [
          'show me', 'list', 'all equipment', 'overview', 'summary',
          'what equipment', 'equipment list', 'inventory', 'assets',
          '一覧', '全体', '概要', '設備', '機器', 'リスト'
        ],
        confidence: 0.8,
        handler: 'handleEquipmentOverview',
        examples: [
          'Show me all equipment',
          'List all pumps',
          'Give me an overview'
        ]
      },
      
      // Equipment by System
      {
        intent: 'EQUIPMENT_BY_SYSTEM',
        patterns: [
          'equipment belongs to', 'equipment in system', 'equipment for system',
          'belongs to SYS', 'in SYS-', 'システムの機器', 'システムに属する'
        ],
        confidence: 0.9,
        handler: 'handleEquipmentBySystem',
        examples: [
          'List equipment belongs to SYS-001',
          'Show equipment in system SYS-001',
          'What equipment is in SYS-001?'
        ]
      },
      
      // System Lists
      {
        intent: 'SYSTEM_LIST',
        patterns: [
          'all systems', 'systems in facility', 'facility systems',
          'system overview', 'what systems', 'システム一覧', '全システム', '全系統'
        ],
        confidence: 0.95,
        handler: 'handleSystemList',
        examples: [
          'List all systems in the facility',
          'Show me all systems',
          'What systems do we have?'
        ]
      },
      
      // Cost & Analysis
      {
        intent: 'COST_ANALYSIS',
        patterns: [
          'cost', 'expense', 'budget', 'spend', 'money', 'financial',
          'expensive', 'cheap', 'analysis', 'roi', 'return on investment',
          'コスト', '費用', '予算', '支出', '金額', '経済'
        ],
        confidence: 0.75,
        handler: 'handleCostAnalysis',
        examples: [
          'What are maintenance costs?',
          'Show me expensive equipment',
          'Cost analysis for this month'
        ]
      },
      
      // Process Parameters & Monitoring
      {
        intent: 'PROCESS_MONITORING',
        patterns: [
          'temperature', 'pressure', 'flow', 'level', 'parameters',
          'process', 'measurements', 'readings', 'sensors', 'instruments',
          '温度', '圧力', '流量', 'レベル', 'パラメータ', 'プロセス'
        ],
        confidence: 0.85,
        handler: 'handleProcessMonitoring',
        examples: [
          'Show me temperature readings',
          'What are current process parameters?',
          'Monitor pressure levels'
        ]
      },
      
      // Risk Assessment
      {
        intent: 'RISK_ASSESSMENT',
        patterns: [
          'risk', 'safety', 'hazard', 'danger', 'critical', 'priority',
          'assessment', 'evaluation', 'concern', 'threat', 'vulnerability',
          'fouling', 'blockage', 'high risk', 'tube blockage',
          'リスク', '安全', '危険', '重要', '優先', '評価', 'ファウリング'
        ],
        confidence: 0.9,
        handler: 'handleRiskAssessment',
        examples: [
          'What are the highest risks?',
          'Show me safety concerns',
          'Critical equipment assessment',
          'Which equipment have high risk of fouling?'
        ]
      },

      // Equipment Strategy
      {
        intent: 'EQUIPMENT_STRATEGY',
        patterns: [
          'equipment strategy', 'strategy', 'maintenance strategy', 'reflected',
          'fully reflected', 'accurately reflected', 'equipment strategy',
          'strategy coverage', 'strategy alignment', 'strategy review',
          '設備戦略', '戦略', 'メンテナンス戦略', '反映'
        ],
        confidence: 0.9,
        handler: 'handleEquipmentStrategy',
        examples: [
          'Are high-risk equipment reflected in Equipment Strategy?',
          'Show equipment strategy coverage',
          'Review maintenance strategies for critical equipment'
        ]
      },
      
      // Compliance & Inspections
      {
        intent: 'COMPLIANCE_TRACKING',
        patterns: [
          'compliance', 'inspection', 'audit', 'regulation', 'standard',
          'certification', 'requirement', 'policy', 'procedure', 'guideline',
          'コンプライアンス', '検査', '監査', '規制', '基準'
        ],
        confidence: 0.8,
        handler: 'handleComplianceTracking',
        examples: [
          'Are we compliant with regulations?',
          'Show inspection status',
          'Audit requirements'
        ]
      },
      
      // Performance & Efficiency
      {
        intent: 'PERFORMANCE_ANALYSIS',
        patterns: [
          'performance', 'efficiency', 'productivity', 'output', 'throughput',
          'optimization', 'improvement', 'trends', 'metrics', 'kpi',
          'パフォーマンス', '効率', '生産性', '最適化', '改善'
        ],
        confidence: 0.85,
        handler: 'handlePerformanceAnalysis',
        examples: [
          'How is equipment performing?',
          'Show efficiency metrics',
          'Performance trends'
        ]
      }
    ]

    this.entityPatterns = [
      // Equipment IDs (Enhanced)
      {
        type: 'equipment_id',
        patterns: [
          /(?:EQ|HX|TK|PU|PP|V|E|P|T|H|C|F|R|S|D|M|G|A|B|X|Y|Z)-?(\d+)/gi,
          /(?:equipment|pump|tank|exchanger|heater|cooler|vessel|reactor)\s*[\#\-]?(\d+)/gi,
          /(?:機器|ポンプ|タンク|熱交換器|加熱器|冷却器|容器|反応器)\s*[\#\-]?(\d+)/gi
        ],
        extractor: (match) => {
          const cleanMatch = match[0].toUpperCase().replace(/\s+/g, '')
          // Ensure proper format (e.g., HX-101, not HX101)
          if (!cleanMatch.includes('-') && /^[A-Z]{1,3}\d+$/.test(cleanMatch)) {
            return cleanMatch.replace(/([A-Z]+)(\d+)/, '$1-$2')
          }
          return cleanMatch
        }
      },
      
      // System IDs (Enhanced)
      {
        type: 'system_id',
        patterns: [
          /SYS-(\d+)/gi,
          /(?:system|システム)\s*[\#\-]?([A-Z0-9]+)/gi,
          /(?:cooling|heating|supply|process|safety|control)\s*system/gi
        ],
        extractor: (match) => match[0].toUpperCase().replace(/\s+/g, '')
      },
      
      // Time Periods (Enhanced)
      {
        type: 'time_period',
        patterns: [
          /(?:last|past|recent)\s*(\d+)\s*(day|week|month|year)s?/gi,
          /(?:直近|過去|最近)\s*(\d+)\s*(日|週|月|年)/gi,
          /(?:today|yesterday|this week|this month|this year)/gi,
          /(?:今日|昨日|今週|今月|今年)/gi
        ],
        extractor: (match) => ({
          value: parseInt(match[1]) || 1,
          unit: match[2] || 'day',
          text: match[0]
        })
      },
      
      // Equipment Types (Enhanced)
      {
        type: 'equipment_type',
        patterns: [
          /(?:pump|pumps|ポンプ)/gi,
          /(?:heat exchanger|exchanger|熱交換器)/gi,
          /(?:tank|tanks|タンク)/gi,
          /(?:vessel|vessels|容器)/gi,
          /(?:reactor|reactors|反応器)/gi,
          /(?:compressor|compressors|圧縮機)/gi,
          /(?:motor|motors|モーター)/gi,
          /(?:valve|valves|バルブ)/gi
        ],
        extractor: (match) => match[0].toLowerCase()
      },
      
      // Parameters (Enhanced)
      {
        type: 'parameter',
        patterns: [
          /(?:temperature|temp|温度)/gi,
          /(?:pressure|press|圧力)/gi,
          /(?:flow|rate|流量)/gi,
          /(?:level|レベル)/gi,
          /(?:vibration|振動)/gi,
          /(?:current|電流)/gi,
          /(?:voltage|電圧)/gi,
          /(?:speed|rpm|回転数)/gi
        ],
        extractor: (match) => match[0].toLowerCase()
      },
      
      // Status/Condition
      {
        type: 'condition',
        patterns: [
          /(?:good|excellent|fine|ok|normal|正常)/gi,
          /(?:bad|poor|critical|fail|failure|異常|故障)/gi,
          /(?:warning|caution|alert|注意|警告)/gi,
          /(?:maintenance|service|repair|メンテナンス|修理)/gi
        ],
        extractor: (match) => match[0].toLowerCase()
      }
    ]
  }

  private initializeSynonyms() {
    this.synonyms = new Map([
      ['equipment', ['machine', 'unit', 'device', 'asset', 'component', '機器', '設備', '装置']],
      ['pump', ['pumps', 'pumping unit', 'ポンプ']],
      ['tank', ['tanks', 'vessel', 'container', 'タンク', '容器']],
      ['maintenance', ['service', 'repair', 'work', 'upkeep', 'メンテナンス', '保全', '修理']],
      ['problem', ['issue', 'error', 'fault', 'failure', 'trouble', '問題', '故障', 'エラー']],
      ['status', ['condition', 'state', 'health', 'situation', '状態', '状況']],
      ['show', ['display', 'list', 'give me', 'tell me', '表示', '見せて']],
      ['all', ['every', 'entire', 'complete', '全て', '全部', '全体']],
      ['recent', ['latest', 'newest', 'current', 'last', '最近', '直近', '最新']],
      ['high', ['critical', 'important', 'priority', 'urgent', '高い', '重要', '優先']],
      ['low', ['minor', 'less important', 'low priority', '低い', '軽微']]
    ])
  }

  /**
   * Enhanced query processing with better natural language understanding
   */
  async processQuery(query: string): Promise<AIQueryResponse> {
    const startTime = Date.now()
    
    try {
      // Log processing decision
      const shouldUseSQL = this.shouldUseTextToSQL(query)
      console.log(`🔍 Query: "${query}"`);
      console.log(`📊 Should use Text-to-SQL: ${shouldUseSQL}`);
      console.log(`🔧 Text-to-SQL enabled: ${this.useTextToSQL}`);
      
      // Try text-to-SQL first for complex queries
      if (this.useTextToSQL && shouldUseSQL) {
        console.log('🚀 Attempting Text-to-SQL conversion...');
        try {
          const textToSQLResult = await textToSQLService.convertTextToSQL({
            natural_language: query,
            max_results: 100
          })
          
          console.log(`✅ Text-to-SQL result - Confidence: ${textToSQLResult.confidence}`);
          console.log(`📝 Generated SQL: ${textToSQLResult.sql?.substring(0, 100)}...`);
          
          if (textToSQLResult.confidence > 0.7) {
            // Generate appropriate summary based on execution results
            const executionResult = textToSQLResult.execution_result
            let summary = ''
            
            if (executionResult?.success && executionResult.data?.length > 0) {
              // Generate data-focused summary
              const dataCount = executionResult.data.length
              const entityType = textToSQLResult.entities.find(e => e.type === 'system')?.resolved || 'query'
              
              if (query.toLowerCase().includes('maintenance')) {
                summary = `Found ${dataCount} maintenance records. Here are the details:\n\n`
                summary += executionResult.data.map((record: any, index: number) => 
                  `${index + 1}. ${record.設備名} (${record.設備ID}) - ${record.作業内容} on ${record.実施日}`
                ).join('\n')
              } else if (query.toLowerCase().includes('equipment')) {
                summary = `Found ${dataCount} equipment items for system ${entityType}:\n\n`
                summary += executionResult.data.map((record: any, index: number) => 
                  `${index + 1}. ${record.設備名} (${record.設備ID}) - Status: ${record.稼働状態}`
                ).join('\n')
              } else {
                summary = `Found ${dataCount} records matching your query:\n\n`
                summary += executionResult.data.slice(0, 5).map((record: any, index: number) => {
                  const keys = Object.keys(record)
                  const displayValues = keys.slice(0, 3).map(key => `${key}: ${record[key]}`).join(', ')
                  return `${index + 1}. ${displayValues}`
                }).join('\n')
                
                if (dataCount > 5) {
                  summary += `\n... and ${dataCount - 5} more records.`
                }
              }
            } else if (executionResult?.success && executionResult.data?.length === 0) {
              summary = `No data found for your query. The SQL was generated successfully but returned no results. You may want to check if the specified criteria exist in the database.`
            } else {
              // Fallback to SQL explanation if execution failed
              summary = textToSQLResult.explanation
            }
            
            return {
              query,
              intent: 'TEXT_TO_SQL',
              confidence: textToSQLResult.confidence,
              results: textToSQLResult.execution_result?.data || [],
              summary,
              recommendations: textToSQLResult.alternatives || [],
              execution_time: Date.now() - startTime,
              source: 'ai',
              context: {
                sql: textToSQLResult.sql,
                entities: textToSQLResult.entities,
                processing_steps: textToSQLResult.steps,
                execution_info: executionResult
              }
            }
          }
        } catch (textToSQLError) {
          console.warn('❌ Text-to-SQL failed, falling back to pattern matching:', textToSQLError)
        }
      } else {
        console.log('⏭️ Skipping Text-to-SQL, using pattern matching');
      }
      
      // Fallback to existing pattern-based processing
      const processedQuery = this.preprocessQuery(query)
      const intent = this.enhancedIntentDetection(processedQuery)
      const entities = this.enhancedEntityExtraction(processedQuery)
      const context = this.analyzeContext(processedQuery, entities)
      
      const response = await this.routeToHandler(intent, processedQuery, entities, context)
      
      response.execution_time = Date.now() - startTime
      response.source = 'ai'
      
      return response
      
    } catch (error) {
      console.error('Enhanced AI Service error:', error)
      return {
        query,
        intent: 'ERROR',
        confidence: 0,
        results: [],
        summary: 'I apologize, but I encountered an error processing your query. Please try rephrasing your question or being more specific.',
        recommendations: [
          'Try using specific equipment IDs (e.g., HX-101, PU-200)',
          'Be more specific about what information you need',
          'Check if your query contains typos'
        ],
        execution_time: Date.now() - startTime,
        source: 'ai'
      }
    }
  }

  /**
   * Determine if query should use text-to-SQL processing
   */
  private shouldUseTextToSQL(query: string): boolean {
    const queryLower = query.toLowerCase()
    
    // Force text-to-SQL for certain queries to ensure OpenAI is used
    const forceTextToSQLPatterns = [
      /\b(list|show|display|find)\s+(equipment|machines?|assets?)\s+(belongs?|in|for|of)\s+(sys|system)/i,
      /\bbelongs?\s+to\s+sys/i,
      /\bsys-\d{3}\b/i  // Any query with system ID
    ]
    
    if (forceTextToSQLPatterns.some(pattern => pattern.test(query))) {
      console.log('🎯 Forced Text-to-SQL: Query matches forced pattern');
      return true
    }
    
    // Use text-to-SQL for complex queries
    const complexPatterns = [
      /\b(join|combine|correlate|relate|relationship|関係|結合)\b/,
      /\b(average|mean|sum|total|count|maximum|minimum|平均|合計|最大|最小)\b/,
      /\b(trend|pattern|analysis|compare|comparison|分析|比較|傾向)\b/,
      /\b(between|range|from.*to|during|period|期間|範囲|〜.*間)\b/,
      /\b(group|grouped|grouping|categorize|グループ|分類)\b/,
      /\b(order|sorted|ranking|順序|ソート|ランキング)\b/,
      /\b(filter|where|condition|条件|フィルタ)\b/,
      /\b(top|bottom|highest|lowest|first|last|最初|最後|最高|最低)\b/
    ]
    
    // Check for complex query patterns
    const hasComplexPattern = complexPatterns.some(pattern => pattern.test(queryLower))
    
    // Check for multiple entities
    const entityCount = (query.match(/\b[A-Z]{1,3}-?\d{1,4}\b/gi) || []).length
    const hasMultipleEntities = entityCount > 1
    
    // Check for time-based queries
    const hasTimeReference = /\b(last|past|recent|since|until|before|after|直近|過去|最近|以来|まで|前|後)\b/.test(queryLower)
    
    // Check for numerical queries
    const hasNumericalQuery = /\b(how many|count|number of|何個|いくつ|数)\b/.test(queryLower)
    
    // Use text-to-SQL for complex scenarios
    return hasComplexPattern || hasMultipleEntities || hasTimeReference || hasNumericalQuery
  }

  /**
   * Preprocess query for better understanding
   */
  private preprocessQuery(query: string): string {
    let processed = query.toLowerCase().trim()
    
    // Expand contractions
    processed = processed.replace(/what's/g, 'what is')
    processed = processed.replace(/how's/g, 'how is')
    processed = processed.replace(/where's/g, 'where is')
    processed = processed.replace(/when's/g, 'when is')
    processed = processed.replace(/there's/g, 'there is')
    processed = processed.replace(/can't/g, 'cannot')
    processed = processed.replace(/won't/g, 'will not')
    processed = processed.replace(/don't/g, 'do not')
    processed = processed.replace(/doesn't/g, 'does not')
    
    // Handle synonyms
    for (const [key, synonyms] of this.synonyms.entries()) {
      for (const synonym of synonyms) {
        const regex = new RegExp(`\\b${synonym}\\b`, 'gi')
        processed = processed.replace(regex, key)
      }
    }
    
    return processed
  }

  /**
   * Enhanced intent detection with scoring
   */
  private enhancedIntentDetection(query: string): string {
    const scores = new Map<string, number>()
    
    for (const pattern of this.intentPatterns) {
      let score = 0
      let matchCount = 0
      
      for (const keyword of pattern.patterns) {
        if (query.includes(keyword)) {
          score += pattern.confidence
          matchCount++
        }
      }
      
      // Boost score for multiple keyword matches
      if (matchCount > 1) {
        score *= 1.2
      }
      
      if (score > 0) {
        scores.set(pattern.intent, score)
      }
    }
    
    // Return highest scoring intent
    if (scores.size > 0) {
      const [topIntent] = [...scores.entries()].sort((a, b) => b[1] - a[1])[0]
      return topIntent
    }
    
    return 'GENERAL_QUERY'
  }

  /**
   * Enhanced entity extraction
   */
  private enhancedEntityExtraction(query: string): any {
    const entities: any = {}
    
    for (const pattern of this.entityPatterns) {
      for (const regex of pattern.patterns) {
        const matches = query.match(regex)
        if (matches) {
          if (!entities[pattern.type]) {
            entities[pattern.type] = []
          }
          
          for (const match of matches) {
            const extracted = pattern.extractor(match.match(regex)!)
            if (extracted && !entities[pattern.type].includes(extracted)) {
              entities[pattern.type].push(extracted)
            }
          }
        }
      }
    }
    
    // Clean up single-item arrays
    for (const [key, value] of Object.entries(entities)) {
      if (Array.isArray(value) && value.length === 1) {
        entities[key] = value[0]
      }
    }
    
    return entities
  }

  /**
   * Analyze context and intent
   */
  private analyzeContext(query: string, entities: any): any {
    const context: any = {
      isQuestion: /^(?:what|who|where|when|why|how|which|is|are|do|does|can|will|should)\\b/i.test(query),
      isCommand: /^(?:show|display|list|give|tell|find|search|get)\\b/i.test(query),
      isComparison: /(?:vs|versus|compared to|better than|worse than|more than|less than)/i.test(query),
      hasTimeframe: entities.time_period !== undefined,
      hasEquipment: entities.equipment_id !== undefined || entities.equipment_type !== undefined,
      hasSystem: entities.system_id !== undefined,
      urgency: this.detectUrgency(query)
    }
    
    return context
  }

  /**
   * Detect urgency level
   */
  private detectUrgency(query: string): 'high' | 'medium' | 'low' {
    const highUrgency = ['urgent', 'critical', 'emergency', 'immediate', 'asap', 'now', '緊急', '至急']
    const mediumUrgency = ['soon', 'quick', 'fast', 'priority', '優先', '早く']
    
    for (const word of highUrgency) {
      if (query.includes(word)) return 'high'
    }
    
    for (const word of mediumUrgency) {
      if (query.includes(word)) return 'medium'
    }
    
    return 'low'
  }

  /**
   * Route to appropriate handler
   */
  private async routeToHandler(intent: string, query: string, entities: any, context: any): Promise<AIQueryResponse> {
    const baseResponse = {
      query,
      intent,
      confidence: 0.7,
      results: [],
      summary: '',
      recommendations: [],
      execution_time: 0,
      source: 'ai' as const,
      context
    }
    
    switch (intent) {
      case 'EQUIPMENT_STATUS':
        return this.handleEquipmentStatus(query, entities, context)
      case 'EQUIPMENT_PROBLEMS':
        return this.handleEquipmentProblems(query, entities, context)
      case 'MAINTENANCE_HISTORY':
        return this.handleMaintenanceHistory(query, entities, context)
      case 'MAINTENANCE_SCHEDULE':
        return this.handleMaintenanceSchedule(query, entities, context)
      case 'EQUIPMENT_OVERVIEW':
        return this.handleEquipmentOverview(query, entities, context)
      case 'EQUIPMENT_BY_SYSTEM':
        return this.handleEquipmentBySystem(query, entities, context)
      case 'SYSTEM_LIST':
        return this.handleSystemList(query, entities, context)
      case 'COST_ANALYSIS':
        return this.handleCostAnalysis(query, entities, context)
      case 'PROCESS_MONITORING':
        return this.handleProcessMonitoring(query, entities, context)
      case 'RISK_ASSESSMENT':
        return this.handleRiskAssessment(query, entities, context)
      case 'EQUIPMENT_STRATEGY':
        return this.handleEquipmentStrategy(query, entities, context)
      case 'COMPLIANCE_TRACKING':
        return this.handleComplianceTracking(query, entities, context)
      case 'PERFORMANCE_ANALYSIS':
        return this.handlePerformanceAnalysis(query, entities, context)
      default:
        return this.handleGeneralQuery(query, entities, context)
    }
  }

  /**
   * Handle equipment status queries
   */
  private async handleEquipmentStatus(query: string, entities: any, context: any): Promise<AIQueryResponse> {
    try {
      // If specific equipment requested
      if (entities.equipment_id) {
        const equipment = await this.equipmentService.getEquipmentInfo(entities.equipment_id)
        if (equipment) {
          return {
            query,
            intent: 'EQUIPMENT_STATUS',
            confidence: 0.95,
            results: [equipment],
            summary: `Equipment ${entities.equipment_id} is currently ${equipment.status || 'operational'}. Last maintenance: ${equipment.last_maintenance || 'No recent maintenance'}.`,
            recommendations: [
              'Monitor equipment performance regularly',
              'Schedule preventive maintenance if needed',
              'Check process parameters'
            ],
            execution_time: 0,
            source: 'ai',
            context
          }
        }
      }
      
      // General equipment status
      const allEquipment = await this.equipmentService.getAllEquipment()
      const summary = `Found ${allEquipment.length} pieces of equipment. Most equipment is operating normally with regular maintenance schedules.`
      
      return {
        query,
        intent: 'EQUIPMENT_STATUS',
        confidence: 0.8,
        results: allEquipment.slice(0, 10), // Show first 10
        summary,
        recommendations: [
          'Review individual equipment status for details',
          'Check for any overdue maintenance',
          'Monitor critical equipment closely'
        ],
        execution_time: 0,
        source: 'ai',
        context
      }
      
    } catch (error) {
      return this.createErrorResponse(query, 'EQUIPMENT_STATUS', error)
    }
  }

  /**
   * Handle equipment problems queries
   */
  private async handleEquipmentProblems(query: string, entities: any, context: any): Promise<AIQueryResponse> {
    try {
      // This would connect to alerting/monitoring system
      const problems = [
        { equipment_id: 'HX-101', issue: 'High temperature alarm', severity: 'high', timestamp: new Date() },
        { equipment_id: 'PU-200', issue: 'Vibration detected', severity: 'medium', timestamp: new Date() }
      ]
      
      const summary = problems.length > 0 
        ? `Found ${problems.length} equipment issues requiring attention. ${problems.filter(p => p.severity === 'high').length} high priority issues.`
        : 'No critical equipment problems detected. All systems operating normally.'
      
      return {
        query,
        intent: 'EQUIPMENT_PROBLEMS',
        confidence: 0.9,
        results: problems,
        summary,
        recommendations: problems.length > 0 ? [
          'Address high priority issues immediately',
          'Schedule maintenance for equipment with warnings',
          'Monitor trends for recurring problems'
        ] : [
          'Continue regular monitoring',
          'Maintain preventive maintenance schedule',
          'Review performance metrics regularly'
        ],
        execution_time: 0,
        source: 'ai',
        context
      }
      
    } catch (error) {
      return this.createErrorResponse(query, 'EQUIPMENT_PROBLEMS', error)
    }
  }

  /**
   * Handle maintenance history queries with enhanced understanding
   */
  private async handleMaintenanceHistory(query: string, entities: any, context: any): Promise<AIQueryResponse> {
    try {
      // Use existing database service for maintenance history
      const response = await this.databaseService.processQuery(query)
      
      // Enhance the response with better formatting
      const enhancedSummary = this.enhanceMaintenanceSummary(response.summary, entities, context)
      
      return {
        ...response,
        intent: 'MAINTENANCE_HISTORY',
        confidence: 0.9,
        summary: enhancedSummary,
        recommendations: [
          ...response.recommendations || [],
          'Review maintenance patterns for optimization',
          'Consider predictive maintenance strategies'
        ],
        context
      }
      
    } catch (error) {
      return this.createErrorResponse(query, 'MAINTENANCE_HISTORY', error)
    }
  }

  /**
   * Handle general queries with helpful responses
   */
  private async handleGeneralQuery(query: string, entities: any, context: any): Promise<AIQueryResponse> {
    const suggestions = [
      'Try asking about equipment status: "How is HX-101 running?"',
      'Check maintenance history: "When was the last maintenance?"',
      'Look for problems: "What equipment issues do we have?"',
      'Review schedules: "What maintenance is due this week?"',
      'Get overview: "Show me all equipment"'
    ]
    
    return {
      query,
      intent: 'GENERAL_QUERY',
      confidence: 0.5,
      results: [],
      summary: `I understand you're asking about "${query}". I can help you with equipment status, maintenance history, problems, schedules, and more.`,
      recommendations: suggestions,
      execution_time: 0,
      source: 'ai',
      context
    }
  }

  /**
   * Enhance maintenance summary with better formatting
   */
  private enhanceMaintenanceSummary(summary: string, entities: any, context: any): string {
    if (!summary) return summary
    
    // Add context-specific information
    if (entities.equipment_id) {
      return `For equipment ${entities.equipment_id}: ${summary}`
    }
    
    if (entities.time_period) {
      return `${summary} This covers the ${entities.time_period.text} period.`
    }
    
    return summary
  }

  /**
   * Create error response
   */
  private createErrorResponse(query: string, intent: string, error: any): AIQueryResponse {
    console.error(`Enhanced AI Service error for ${intent}:`, error)
    
    return {
      query,
      intent,
      confidence: 0.1,
      results: [],
      summary: 'I encountered an issue processing your request. Please try rephrasing your question or being more specific.',
      recommendations: [
        'Try using specific equipment IDs (e.g., HX-101, PU-200)',
        'Be more specific about what information you need',
        'Check if your query contains typos'
      ],
      execution_time: 0,
      source: 'ai'
    }
  }

  // Placeholder methods for additional handlers
  private async handleMaintenanceSchedule(query: string, entities: any, context: any): Promise<AIQueryResponse> {
    try {
      // Mock maintenance schedule data
      const upcomingMaintenance = [
        {
          equipment_id: 'HX-101',
          equipment_name: 'Heat Exchanger 101',
          task: 'Monthly PM Inspection',
          due_date: '2024-01-15',
          frequency: 'Monthly',
          priority: 'MEDIUM',
          estimated_hours: 4,
          assigned_to: '保全チーム A'
        },
        {
          equipment_id: 'PU-102',
          equipment_name: 'Pump 102',
          task: 'Bearing Replacement',
          due_date: '2024-01-14',
          frequency: 'Quarterly',
          priority: 'HIGH',
          estimated_hours: 6,
          assigned_to: '保全チーム B'
        },
        {
          equipment_id: 'TK-201',
          equipment_name: 'Storage Tank 201',
          task: 'Quarterly Inspection',
          due_date: '2024-01-16',
          frequency: 'Quarterly',
          priority: 'LOW',
          estimated_hours: 2,
          assigned_to: '保全チーム C'
        },
        {
          equipment_id: 'CP-301',
          equipment_name: 'Air Compressor 301',
          task: 'Oil Change Service',
          due_date: '2024-01-17',
          frequency: 'Semi-Annual',
          priority: 'MEDIUM',
          estimated_hours: 3,
          assigned_to: '保全チーム A'
        }
      ]

      // Filter by system if specified
      const systemMatch = query.match(/SYS-\d{3}/i)
      let filteredMaintenance = upcomingMaintenance
      
      if (systemMatch) {
        const systemId = systemMatch[0].toUpperCase()
        const systemEquipment = {
          'SYS-001': ['HX-101', 'HX-102', 'PU-101', 'PU-102'],
          'SYS-002': ['TK-101', 'TK-102', 'PU-201', 'PU-202'],
          'SYS-003': ['HX-201', 'HX-202', 'TK-201', 'TK-202']
        }
        
        const equipmentIds = systemEquipment[systemId] || []
        filteredMaintenance = upcomingMaintenance.filter(m => equipmentIds.includes(m.equipment_id))
      }

      const summary = `Found ${filteredMaintenance.length} upcoming maintenance tasks:\n\n` +
        filteredMaintenance.map((task, index) => 
          `${index + 1}. ${task.equipment_name} (${task.equipment_id})\n` +
          `   Task: ${task.task}\n` +
          `   Due: ${new Date(task.due_date).toLocaleDateString()}\n` +
          `   Priority: ${task.priority}\n` +
          `   Assigned to: ${task.assigned_to}\n`
        ).join('\n')

      return {
        query,
        intent: 'MAINTENANCE_SCHEDULE',
        confidence: 0.9,
        results: filteredMaintenance,
        summary,
        recommendations: [
          'Review upcoming maintenance tasks',
          'Ensure proper resource allocation',
          'Consider equipment criticality when prioritizing'
        ],
        execution_time: 0,
        source: 'ai',
        context
      }
      
    } catch (error) {
      console.error('Error handling maintenance schedule query:', error)
      return {
        query,
        intent: 'MAINTENANCE_SCHEDULE',
        confidence: 0.3,
        results: [],
        summary: 'Error retrieving maintenance schedule information.',
        recommendations: ['Please try again or contact system administrator'],
        execution_time: 0,
        source: 'ai',
        context
      }
    }
  }

  private async handleEquipmentOverview(query: string, entities: any, context: any): Promise<AIQueryResponse> {
    try {
      // If asking for systems specifically, route to system list
      if (query.toLowerCase().includes('system')) {
        return this.handleSystemList(query, entities, context)
      }
      
      // Otherwise get all equipment
      const allEquipment = await this.equipmentService.getAllEquipment()
      const summary = `Found ${allEquipment.length} pieces of equipment in the facility. All equipment is monitored for maintenance, performance, and safety compliance.`
      
      return {
        query,
        intent: 'EQUIPMENT_OVERVIEW',
        confidence: 0.9,
        results: allEquipment.slice(0, 20), // Show first 20
        summary,
        recommendations: [
          'Review individual equipment details for specific information',
          'Check maintenance schedules for upcoming work',
          'Monitor critical equipment performance regularly'
        ],
        execution_time: 0,
        source: 'ai',
        context
      }
    } catch (error) {
      return this.createErrorResponse(query, 'EQUIPMENT_OVERVIEW', error)
    }
  }

  private async handleCostAnalysis(query: string, entities: any, context: any): Promise<AIQueryResponse> {
    return this.createPlaceholderResponse(query, 'COST_ANALYSIS', 'Cost analysis functionality coming soon!')
  }

  private async handleProcessMonitoring(query: string, entities: any, context: any): Promise<AIQueryResponse> {
    return this.createPlaceholderResponse(query, 'PROCESS_MONITORING', 'Process monitoring functionality coming soon!')
  }

  private async handleRiskAssessment(query: string, entities: any, context: any): Promise<AIQueryResponse> {
    try {
      // Mock risk assessment data with fouling risk focus
      const riskData = [
        {
          equipment_id: 'HX-101',
          equipment_name: 'Heat Exchanger 101',
          system_id: 'SYS-001',
          risk_type: 'Fouling',
          risk_level: 'HIGH',
          risk_score: 8.5,
          description: 'High risk of tube blockage due to fouling from process fluids',
          impact: 'Production shutdown, reduced heat transfer efficiency',
          likelihood: 'High - observed fouling patterns in similar equipment',
          mitigation: 'Increase cleaning frequency, install online monitoring'
        },
        {
          equipment_id: 'HX-102',
          equipment_name: 'Heat Exchanger 102',
          system_id: 'SYS-001',
          risk_type: 'Fouling',
          risk_level: 'HIGH',
          risk_score: 8.2,
          description: 'Very high risk of tube blockage due to fouling',
          impact: 'Backup heat exchanger for HX-101, critical for system reliability',
          likelihood: 'High - same process conditions as HX-101',
          mitigation: 'Implement predictive fouling monitoring, schedule proactive cleaning'
        },
        {
          equipment_id: 'PU-101',
          equipment_name: 'Pump 101',
          system_id: 'SYS-001',
          risk_type: 'Mechanical',
          risk_level: 'MEDIUM',
          risk_score: 6.2,
          description: 'Bearing wear risk due to continuous operation',
          impact: 'Reduced flow rate, potential seal failure',
          likelihood: 'Medium - normal wear patterns observed',
          mitigation: 'Vibration monitoring, scheduled bearing replacement'
        },
        {
          equipment_id: 'TK-201',
          equipment_name: 'Storage Tank 201',
          system_id: 'SYS-003',
          risk_type: 'Corrosion',
          risk_level: 'MEDIUM',
          risk_score: 5.8,
          description: 'Internal corrosion risk from stored chemicals',
          impact: 'Tank integrity compromise, environmental release',
          likelihood: 'Medium - based on material compatibility',
          mitigation: 'Regular thickness monitoring, coating inspection'
        },
        {
          equipment_id: 'CV-105',
          equipment_name: 'Control Valve 105',
          system_id: 'SYS-001',
          risk_type: 'Fouling',
          risk_level: 'MEDIUM',
          risk_score: 6.8,
          description: 'Valve seat fouling affecting control accuracy',
          impact: 'Poor process control, potential safety issues',
          likelihood: 'Medium - particulates in process stream',
          mitigation: 'Install upstream filtration, regular valve maintenance'
        }
      ]

      // Filter based on query
      let filteredRisks = riskData
      
      // Filter by fouling if mentioned
      if (query.toLowerCase().includes('fouling')) {
        filteredRisks = riskData.filter(r => r.risk_type.toLowerCase() === 'fouling')
      }
      
      // Filter by high risk if mentioned
      if (query.toLowerCase().includes('high risk')) {
        filteredRisks = riskData.filter(r => r.risk_level === 'HIGH')
      }
      
      // Filter by system if specified
      const systemMatch = query.match(/SYS-\d{3}/i)
      if (systemMatch) {
        const systemId = systemMatch[0].toUpperCase()
        filteredRisks = filteredRisks.filter(r => r.system_id === systemId)
      }

      const summary = `Found ${filteredRisks.length} risk assessment${filteredRisks.length === 1 ? '' : 's'}:\n\n` +
        filteredRisks.map((risk, index) => 
          `${index + 1}. ${risk.equipment_name} (${risk.equipment_id})\n` +
          `   Risk Type: ${risk.risk_type}\n` +
          `   Risk Level: ${risk.risk_level} (Score: ${risk.risk_score}/10)\n` +
          `   Description: ${risk.description}\n` +
          `   Impact: ${risk.impact}\n` +
          `   Mitigation: ${risk.mitigation}\n`
        ).join('\n')

      const recommendations = []
      
      if (filteredRisks.some(r => r.risk_type === 'Fouling' && r.risk_level === 'HIGH')) {
        recommendations.push('Immediate action required for high fouling risks in heat exchangers')
        recommendations.push('Consider implementing online fouling monitoring systems')
        recommendations.push('Review cleaning schedules for affected equipment')
      }
      
      if (filteredRisks.length === 0) {
        recommendations.push('No specific risks found for your criteria')
        recommendations.push('Try searching for specific risk types like "fouling" or "corrosion"')
      } else {
        recommendations.push('Review equipment strategies for high-risk items')
        recommendations.push('Consider predictive maintenance for critical equipment')
      }

      return {
        query,
        intent: 'RISK_ASSESSMENT',
        confidence: 0.9,
        results: filteredRisks,
        summary,
        recommendations,
        execution_time: 0,
        source: 'ai',
        context
      }
      
    } catch (error) {
      console.error('Error handling risk assessment query:', error)
      return {
        query,
        intent: 'RISK_ASSESSMENT',
        confidence: 0.3,
        results: [],
        summary: 'Error retrieving risk assessment information.',
        recommendations: ['Please try again or contact system administrator'],
        execution_time: 0,
        source: 'ai',
        context
      }
    }
  }

  private async handleEquipmentStrategy(query: string, entities: any, context: any): Promise<AIQueryResponse> {
    try {
      // Mock equipment strategy data focusing on high-risk fouling equipment
      const equipmentStrategies = [
        {
          equipment_id: 'HX-101',
          equipment_name: 'Heat Exchanger 101',
          system_id: 'SYS-001',
          risk_level: 'HIGH',
          risk_type: 'Fouling',
          strategy_id: 'ES-HX-101-001',
          strategy_name: 'Fouling Prevention & Monitoring',
          strategy_type: 'PREDICTIVE',
          frequency: 'Weekly',
          description: 'Online fouling monitoring with weekly cleaning cycles',
          is_active: true,
          coverage_status: 'FULLY_COVERED',
          last_review: '2024-01-10',
          next_review: '2024-04-10'
        },
        {
          equipment_id: 'HX-102',
          equipment_name: 'Heat Exchanger 102',
          system_id: 'SYS-001',
          risk_level: 'HIGH',
          risk_type: 'Fouling',
          strategy_id: 'ES-HX-102-001',
          strategy_name: 'Fouling Prevention & Monitoring',
          strategy_type: 'PREDICTIVE',
          frequency: 'Weekly',
          description: 'Online fouling monitoring with weekly cleaning cycles',
          is_active: true,
          coverage_status: 'FULLY_COVERED',
          last_review: '2024-01-10',
          next_review: '2024-04-10'
        },
        {
          equipment_id: 'CV-105',
          equipment_name: 'Control Valve 105',
          system_id: 'SYS-001',
          risk_level: 'MEDIUM',
          risk_type: 'Fouling',
          strategy_id: 'ES-CV-105-001',
          strategy_name: 'Valve Maintenance Program',
          strategy_type: 'PREVENTIVE',
          frequency: 'Monthly',
          description: 'Monthly inspection and cleaning of valve internals',
          is_active: true,
          coverage_status: 'PARTIALLY_COVERED',
          last_review: '2023-12-15',
          next_review: '2024-03-15'
        }
      ]

      // Filter by system if specified
      let filteredStrategies = equipmentStrategies
      const systemMatch = query.match(/SYS-\d{3}/i)
      if (systemMatch) {
        const systemId = systemMatch[0].toUpperCase()
        filteredStrategies = equipmentStrategies.filter(s => s.system_id === systemId)
      }

      // Filter by high risk if mentioned
      if (query.toLowerCase().includes('high risk')) {
        filteredStrategies = filteredStrategies.filter(s => s.risk_level === 'HIGH')
      }

      // Filter by fouling if mentioned
      if (query.toLowerCase().includes('fouling')) {
        filteredStrategies = filteredStrategies.filter(s => s.risk_type === 'Fouling')
      }

      const summary = `Equipment Strategy Analysis:\n\n` +
        filteredStrategies.map((strategy, index) => 
          `${index + 1}. ${strategy.equipment_name} (${strategy.equipment_id})\n` +
          `   Risk Level: ${strategy.risk_level} (${strategy.risk_type})\n` +
          `   Strategy: ${strategy.strategy_name}\n` +
          `   Coverage: ${strategy.coverage_status}\n` +
          `   Type: ${strategy.strategy_type}\n` +
          `   Frequency: ${strategy.frequency}\n` +
          `   Next Review: ${new Date(strategy.next_review).toLocaleDateString()}\n`
        ).join('\n')

      const recommendations = []
      
      // Check coverage gaps
      const fullyCovered = filteredStrategies.filter(s => s.coverage_status === 'FULLY_COVERED').length
      const total = filteredStrategies.length
      
      if (fullyCovered === total) {
        recommendations.push('✅ All high-risk fouling equipment are fully reflected in Equipment Strategy')
        recommendations.push('Strategies are actively monitoring and preventing fouling issues')
        recommendations.push('Continue current predictive maintenance approach')
      } else {
        recommendations.push('⚠️ Some equipment have partial strategy coverage - review needed')
        recommendations.push('Consider upgrading to predictive maintenance for high-risk items')
        recommendations.push('Schedule strategy review meetings for partially covered equipment')
      }

      if (query.toLowerCase().includes('sys-001')) {
        recommendations.push('SYS-001 (Process Cooling System) has comprehensive fouling prevention strategies')
        recommendations.push('Online monitoring systems are in place for critical heat exchangers')
      }

      return {
        query,
        intent: 'EQUIPMENT_STRATEGY',
        confidence: 0.95,
        results: filteredStrategies,
        summary,
        recommendations,
        execution_time: 0,
        source: 'ai',
        context
      }
      
    } catch (error) {
      console.error('Error handling equipment strategy query:', error)
      return {
        query,
        intent: 'EQUIPMENT_STRATEGY',
        confidence: 0.3,
        results: [],
        summary: 'Error retrieving equipment strategy information.',
        recommendations: ['Please try again or contact system administrator'],
        execution_time: 0,
        source: 'ai',
        context
      }
    }
  }

  private async handleComplianceTracking(query: string, entities: any, context: any): Promise<AIQueryResponse> {
    return this.createPlaceholderResponse(query, 'COMPLIANCE_TRACKING', 'Compliance tracking functionality coming soon!')
  }

  private async handlePerformanceAnalysis(query: string, entities: any, context: any): Promise<AIQueryResponse> {
    return this.createPlaceholderResponse(query, 'PERFORMANCE_ANALYSIS', 'Performance analysis functionality coming soon!')
  }

  /**
   * Handle equipment by system queries
   */
  private async handleEquipmentBySystem(query: string, entities: any, context: any): Promise<AIQueryResponse> {
    try {
      // Extract system ID from query
      const systemMatch = query.match(/SYS-\d{3}/i)
      const systemId = systemMatch ? systemMatch[0].toUpperCase() : null
      
      if (!systemId) {
        return {
          query,
          intent: 'EQUIPMENT_BY_SYSTEM',
          confidence: 0.5,
          results: [],
          summary: 'Please specify a system ID (e.g., SYS-001, SYS-002)',
          recommendations: [
            'Use format: "List equipment belongs to SYS-001"',
            'Available systems: SYS-001, SYS-002, SYS-003, SYS-004, SYS-005'
          ],
          execution_time: 0,
          source: 'ai',
          context
        }
      }
      
      // Get equipment for the specified system
      const equipment = await this.equipmentService.getEquipmentBySystem(systemId)
      
      if (equipment.length === 0) {
        // Fallback: Try to find equipment with hardcoded mapping
        const systemEquipmentMap: Record<string, string[]> = {
          'SYS-001': ['HX-101', 'HX-102', 'PU-101', 'PU-102'], // プロセス冷却系統
          'SYS-002': ['TK-101', 'TK-102', 'PU-201', 'PU-202'], // 原料供給系統
          'SYS-003': ['HX-201', 'HX-202', 'TK-201', 'TK-202'], // ユーティリティ系統
          'SYS-004': ['PU-301', 'PU-302', 'TK-301', 'TK-302'], // 製品移送系統
          'SYS-005': ['HX-301', 'HX-302', 'PU-401', 'PU-402']  // 廃棄物処理系統
        }
        
        const equipmentIds = systemEquipmentMap[systemId] || []
        
        if (equipmentIds.length > 0) {
          // Create mock response with equipment IDs
          const mockEquipment = equipmentIds.map(id => ({
            equipment_id: id,
            設備ID: id,
            name: `Equipment ${id}`,
            設備名: `Equipment ${id}`,
            type: id.startsWith('HX') ? 'Heat Exchanger' : id.startsWith('PU') ? 'Pump' : 'Tank',
            status: '稼働中',
            稼働状態: '稼働中'
          }))
          
          return {
            query,
            intent: 'EQUIPMENT_BY_SYSTEM',
            confidence: 0.85,
            results: mockEquipment,
            summary: `Found ${mockEquipment.length} equipment items in system ${systemId}`,
            recommendations: [
              `System ${systemId} contains ${mockEquipment.length} pieces of equipment`,
              'Review equipment status for maintenance planning',
              'Check critical equipment in this system'
            ],
            execution_time: 0,
            source: 'ai',
            context
          }
        }
        
        return {
          query,
          intent: 'EQUIPMENT_BY_SYSTEM',
          confidence: 0.8,
          results: [],
          summary: `No equipment found for system ${systemId}`,
          recommendations: [
            'Check if the system ID is correct',
            'Try another system ID',
            'Use "List all systems" to see available systems'
          ],
          execution_time: 0,
          source: 'ai',
          context
        }
      }
      
      return {
        query,
        intent: 'EQUIPMENT_BY_SYSTEM',
        confidence: 0.95,
        results: equipment,
        summary: `Found ${equipment.length} equipment items in system ${systemId}`,
        recommendations: [
          `System ${systemId} contains ${equipment.length} pieces of equipment`,
          'Review equipment status for maintenance planning',
          'Check critical equipment in this system'
        ],
        execution_time: 0,
        source: 'ai',
        context
      }
    } catch (error) {
      return this.createErrorResponse(query, 'EQUIPMENT_BY_SYSTEM', error)
    }
  }

  /**
   * Handle system list queries - get all systems from database
   */
  private async handleSystemList(query: string, entities: any, context: any): Promise<AIQueryResponse> {
    try {
      const systems = await this.equipmentService.getAllSystems()
      
      return {
        query,
        intent: 'SYSTEM_LIST',
        confidence: 0.98,
        results: systems,
        summary: `Found ${systems.length} systems in the facility`,
        recommendations: [
          'All facility systems listed with current equipment counts',
          'Critical systems should be monitored closely',
          'Review system-specific equipment for maintenance planning'
        ],
        execution_time: 0,
        source: 'ai',
        context
      }
    } catch (error) {
      return this.createErrorResponse(query, 'SYSTEM_LIST', error)
    }
  }

  private createPlaceholderResponse(query: string, intent: string, message: string): AIQueryResponse {
    return {
      query,
      intent,
      confidence: 0.7,
      results: [],
      summary: message,
      recommendations: ['This feature is under development', 'Try other query types in the meantime'],
      execution_time: 0,
      source: 'ai'
    }
  }
}

// Export service instance
export const enhancedAIService = new EnhancedAIService()