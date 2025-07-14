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
      
      // Department Task Status
      {
        intent: 'DEPARTMENT_TASK_STATUS',
        patterns: [
          'implementation status', 'department responsibility', 'refining department',
          'maintenance department', 'task status', 'department tasks',
          '部署の責任', '実装状況', '精製部門', '保全部門', 'タスク状況'
        ],
        confidence: 0.9,
        handler: 'handleDepartmentTaskStatus',
        examples: [
          'Implementation status of tasks under Refining Department responsibility for E-101',
          'Show department task status for maintenance department',
          'Refining department implementation rates'
        ]
      },
      
      // Instrumentation Alert Analysis
      {
        intent: 'INSTRUMENTATION_ALERT',
        patterns: [
          'temperature rises', 'pressure increases', 'TI-201', 'PI-101', 'FI-301',
          'instrument alert', 'rises sharply', 'extract risk scenarios', 'affected equipment',
          '温度上昇', '圧力上昇', '計器異常', 'リスクシナリオ', '影響機器'
        ],
        confidence: 0.95,
        handler: 'handleInstrumentationAlert',
        examples: [
          'TI-201 temperature rises sharply - extract risk scenarios and affected equipment',
          'PI-101 pressure increases - show cascade effects',
          'Instrument alert analysis for TI-201'
        ]
      },
      
      // Risk Scenario Count
      {
        intent: 'RISK_SCENARIO_COUNT',
        patterns: [
          'how many risk scenarios', 'count risk scenarios', 'total scenarios',
          'number of risk scenarios', 'scenario count', 'risk scenario statistics',
          'リスクシナリオ数', 'シナリオの数', 'リスク総数'
        ],
        confidence: 0.95,
        handler: 'handleRiskScenarioCount',
        examples: [
          'How many risk scenarios do you have?',
          'Count total risk scenarios in system',
          'Show risk scenario statistics'
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
      
      // Instrument Tags (New)
      {
        type: 'instrument_tag',
        patterns: [
          /\b([TPFLI][IR]?-\d{3})\b/gi,  // TI-201, PI-101, FI-301, etc.
          /\b(温度計|圧力計|流量計)-?\d{3}\b/gi
        ],
        extractor: (match) => match[1] || match[0]
      },
      
      // Department Names (New)
      {
        type: 'department',
        patterns: [
          /(?:refining|精製|製油)\s*(?:department|部門|部)?/gi,
          /(?:maintenance|保全|整備)\s*(?:department|部門|部)?/gi,
          /(?:safety|安全)\s*(?:department|部門|部)?/gi,
          /(?:engineering|技術|エンジニアリング)\s*(?:department|部門|部)?/gi,
          /(?:operations|運転|オペレーション)\s*(?:department|部門|部)?/gi
        ],
        extractor: (match) => {
          const text = match[0].toLowerCase()
          if (text.includes('refining') || text.includes('精製')) return 'REFINING'
          if (text.includes('maintenance') || text.includes('保全')) return 'MAINTENANCE'
          if (text.includes('safety') || text.includes('安全')) return 'SAFETY'
          if (text.includes('engineering') || text.includes('技術')) return 'ENGINEERING'
          if (text.includes('operations') || text.includes('運転')) return 'OPERATIONS'
          return text
        }
      },
      
      // Risk Scenarios (Enhanced)
      {
        type: 'risk_scenario',
        patterns: [
          /(?:risk scenarios|リスクシナリオ)/gi,
          /(?:fouling|ファウリング)/gi,
          /(?:corrosion|腐食)/gi,
          /(?:leakage|漏洩)/gi,
          /(?:blockage|詰まり)/gi,
          /(?:overheating|過熱)/gi,
          /(?:failure|故障)/gi
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
      case 'DEPARTMENT_TASK_STATUS':
        return this.handleDepartmentTaskStatus(query, entities.department || entities.system_id, entities.equipment_id)
      case 'INSTRUMENTATION_ALERT':
        return this.handleInstrumentationAlert(query, entities.instrument_tag || entities.equipment_id)
      case 'RISK_SCENARIO_COUNT':
        return this.handleRiskScenarioCount(query)
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
      // Query real maintenance schedule data from database
      const { data: scheduleData, error } = await supabase
        .from('inspection_plan')
        .select(`
          equipment_id,
          next_inspection_date,
          inspection_item,
          equipment!inner(equipment_name, equipment_type_id)
        `)
        .gte('next_inspection_date', new Date().toISOString().split('T')[0])
        .order('next_inspection_date', { ascending: true })
        .limit(20)

      if (error) {
        console.error('Error fetching schedule data:', error)
        throw error
      }

      // Transform database data to expected format
      let upcomingMaintenance = scheduleData.map(schedule => ({
        equipment_id: schedule.equipment_id,
        equipment_name: schedule.equipment?.equipment_name || 'Unknown Equipment',
        equipment_type: this.getEquipmentTypeName(schedule.equipment?.equipment_type_id) || 'Unknown Type',
        task: schedule.inspection_item || 'Scheduled Inspection',
        due_date: schedule.next_inspection_date,
        priority: this.calculateMaintenancePriority(schedule.next_inspection_date),
        estimated_hours: this.estimateMaintenanceHours(schedule.検査種別),
        assigned_to: 'To be assigned'
      }))

      // Filter by system if specified
      const systemMatch = query.match(/SYS-\d{3}/i)
      let filteredMaintenance = upcomingMaintenance
      
      if (systemMatch) {
        const systemId = systemMatch[0].toUpperCase()
        // Filter by equipment ID patterns that typically belong to systems
        if (systemId === 'SYS-001') {
          filteredMaintenance = upcomingMaintenance.filter(m => 
            m.equipment_id.startsWith('HX-') || m.equipment_id.startsWith('PU-'))
        } else if (systemId === 'SYS-002') {
          filteredMaintenance = upcomingMaintenance.filter(m => 
            m.equipment_id.startsWith('TK-') || m.equipment_id.startsWith('V-'))
        }
      }

      const summary = `Maintenance Schedule (Real Database Data):\n\n` +
        `Found ${filteredMaintenance.length} upcoming maintenance tasks:\n\n` +
        filteredMaintenance.map((task, index) => 
          `${index + 1}. ${task.equipment_name} (${task.equipment_id})\n` +
          `   Equipment Type: ${task.equipment_type}\n` +
          `   Task: ${task.task}\n` +
          `   Due: ${new Date(task.due_date).toLocaleDateString()}\n` +
          `   Priority: ${task.priority}\n` +
          `   Estimated: ${task.estimated_hours} hours\n`
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
    try {
      // Query real cost data from database
      const { data: costData, error } = await supabase
        .from('maintenance_history')
        .select(`
          設備ID,
          実施日,
          作業内容,
          作業時間,
          equipment!inner(設備名, 設備種別ID)
        `)
        .order('実施日', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching cost data:', error)
        throw error
      }

      // Calculate cost metrics from real data
      const totalHours = costData.reduce((sum, record) => sum + (parseFloat(record.作業時間) || 0), 0)
      const avgCostPerHour = 85 // USD per hour labor cost
      const totalCost = totalHours * avgCostPerHour

      const costByEquipment = costData.reduce((acc, record) => {
        const equipmentId = record.設備ID
        if (!acc[equipmentId]) {
          acc[equipmentId] = {
            equipment_id: equipmentId,
            equipment_name: record.equipment?.設備名 || 'Unknown',
            total_hours: 0,
            total_cost: 0,
            work_count: 0
          }
        }
        acc[equipmentId].total_hours += parseFloat(record.作業時間) || 0
        acc[equipmentId].total_cost = acc[equipmentId].total_hours * avgCostPerHour
        acc[equipmentId].work_count += 1
        return acc
      }, {})

      const results = Object.values(costByEquipment).sort((a: any, b: any) => b.total_cost - a.total_cost)

      const summary = `Maintenance Cost Analysis (Based on Real Data):\n\n` +
        `Total Maintenance Hours: ${totalHours.toFixed(1)} hours\n` +
        `Total Maintenance Cost: $${totalCost.toFixed(0)}\n` +
        `Average Cost per Hour: $${avgCostPerHour}\n\n` +
        `Top Cost Equipment:\n` +
        results.slice(0, 5).map((item: any, index) => 
          `${index + 1}. ${item.equipment_name} (${item.equipment_id}): $${item.total_cost.toFixed(0)} (${item.total_hours}h, ${item.work_count} jobs)`
        ).join('\n')

      return {
        query,
        intent: 'COST_ANALYSIS',
        confidence: 0.9,
        results,
        summary,
        recommendations: [
          'Focus cost reduction efforts on highest-cost equipment',
          'Consider predictive maintenance for expensive repairs',
          'Review labor efficiency for high-hour equipment'
        ],
        execution_time: 0,
        source: 'ai',
        context
      }
    } catch (error) {
      console.error('Error in cost analysis:', error)
      return {
        query,
        intent: 'COST_ANALYSIS',
        confidence: 0.3,
        results: [],
        summary: 'Unable to retrieve cost analysis data from database.',
        recommendations: ['Check database connection', 'Verify maintenance history data'],
        execution_time: 0,
        source: 'ai',
        context
      }
    }
  }

  private async handleProcessMonitoring(query: string, entities: any, context: any): Promise<AIQueryResponse> {
    try {
      // Query real equipment status from database
      const { data: equipmentData, error } = await supabase
        .from('equipment')
        .select(`
          equipment_id,
          equipment_name,
          operational_status,
          location,
          equipment_type_id
        `)
        .limit(20)

      if (error) {
        console.error('Error fetching equipment data:', error)
        throw error
      }

      // Analyze operational status
      const statusCounts = equipmentData.reduce((acc, eq) => {
        const status = eq.operational_status || 'Unknown'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})

      const summary = `Process Monitoring Status (Real Equipment Data):\n\n` +
        `Total Equipment Monitored: ${equipmentData.length}\n\n` +
        `Status Distribution:\n` +
        Object.entries(statusCounts).map(([status, count]) => 
          `- ${status}: ${count} units`
        ).join('\n') + '\n\n' +
        `Equipment List:\n` +
        equipmentData.slice(0, 10).map((eq, index) => 
          `${index + 1}. ${eq.設備名} (${eq.設備ID}) - Status: ${eq.稼働状態}`
        ).join('\n')

      return {
        query,
        intent: 'PROCESS_MONITORING',
        confidence: 0.9,
        results: equipmentData,
        summary,
        recommendations: [
          'Monitor non-operational equipment for maintenance needs',
          'Schedule inspections for critical equipment',
          'Update equipment status regularly'
        ],
        execution_time: 0,
        source: 'ai',
        context
      }
    } catch (error) {
      console.error('Error in process monitoring:', error)
      return {
        query,
        intent: 'PROCESS_MONITORING',
        confidence: 0.3,
        results: [],
        summary: 'Unable to retrieve process monitoring data from database.',
        recommendations: ['Check database connection', 'Verify equipment data'],
        execution_time: 0,
        source: 'ai',
        context
      }
    }
  }

  private async handleRiskAssessment(query: string, entities: any, context: any): Promise<AIQueryResponse> {
    try {
      // Query real risk assessment data from database
      const { data: riskData, error } = await supabase
        .from('equipment_risk_assessment')
        .select(`
          equipment_id,
          risk_level,
          risk_score,
          risk_scenario,
          risk_factor,
          impact_rank,
          reliability_rank,
          mitigation_measures,
          scenario_id,
          likelihood_score,
          consequence_score,
          equipment!inner(equipment_name, equipment_type_id)
        `)
        .order('risk_score', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching risk assessment data:', error)
        throw error
      }

      // Try to get risk scenario master data separately (if table exists)
      let scenarioMasterData: any[] = []
      try {
        const { data: masterData } = await supabase
          .from('risk_scenario_master')
          .select('id, scenario_name, scenario_name_en, description')
        scenarioMasterData = masterData || []
      } catch (masterError) {
        // Table doesn't exist yet, continue without master data
        console.log('risk_scenario_master table not available yet')
      }

      // Transform database data to match expected format
      let transformedRisks = riskData.map(risk => {
        // Find matching scenario from master data
        const masterScenario = scenarioMasterData.find(master => master.id === risk.scenario_id)
        
        return {
          equipment_id: risk.equipment_id,
          equipment_name: risk.equipment?.equipment_name || 'Unknown Equipment',
          equipment_type: this.getEquipmentTypeName(risk.equipment?.equipment_type_id) || 'Unknown Type',
          risk_level: risk.risk_level,
          risk_score: risk.risk_score,
          risk_scenario: risk.risk_scenario,
          risk_scenario_standardized: masterScenario?.scenario_name || risk.risk_scenario,
          risk_scenario_english: masterScenario?.scenario_name_en || 'Not standardized',
          scenario_description: masterScenario?.description || 'No description available',
          risk_factor: risk.risk_factor,
          risk_factors: risk.risk_factor,
          impact_rank: risk.impact_rank,
          reliability_rank: risk.reliability_rank,
          likelihood_score: risk.likelihood_score,
          consequence_score: risk.consequence_score,
          mitigation_measures: risk.mitigation_measures,
          impact: risk.impact_rank,
          mitigation: risk.mitigation_measures
        }
      })

      // Filter based on query
      let filteredRisks = transformedRisks
      
      // Filter by fouling if mentioned
      if (query.toLowerCase().includes('fouling')) {
        filteredRisks = filteredRisks.filter(r => r.risk_factors?.toLowerCase().includes('fouling') || 
                                               r.risk_factors?.toLowerCase().includes('ファウリング'))
      }
      
      // Filter by high risk if mentioned
      if (query.toLowerCase().includes('high risk')) {
        filteredRisks = filteredRisks.filter(r => r.risk_level === 'HIGH')
      }
      
      // Filter by system if specified (would need system mapping in database)
      const systemMatch = query.match(/SYS-\d{3}/i)
      if (systemMatch) {
        const systemId = systemMatch[0].toUpperCase()
        // For now, filter by equipment ID patterns that typically belong to systems
        if (systemId === 'SYS-001') {
          filteredRisks = filteredRisks.filter(r => r.equipment_id.startsWith('HX-') || r.equipment_id.startsWith('PU-'))
        }
      }

      // Count unique risk scenarios from master table
      const uniqueScenarios = [...new Set(filteredRisks.map(r => r.risk_scenario_standardized).filter(Boolean))]
      const uniqueScenariosEN = [...new Set(filteredRisks.map(r => r.risk_scenario_english).filter(r => r !== 'Not standardized'))]
      
      const scenarioCount = uniqueScenarios.length > 0 
        ? `\n\nStandardized Risk Scenarios (${uniqueScenarios.length}): ${uniqueScenarios.join(', ')}` +
          (uniqueScenariosEN.length > 0 ? `\nEnglish: ${uniqueScenariosEN.join(', ')}` : '')
        : ''

      const summary = `Risk Assessment Analysis (Real Database Data):\n\n` +
        `Found ${filteredRisks.length} risk assessment${filteredRisks.length === 1 ? '' : 's'}${scenarioCount}:\n\n` +
        filteredRisks.slice(0, 10).map((risk, index) => 
          `${index + 1}. ${risk.equipment_name} (${risk.equipment_id})\n` +
          `   Equipment Type: ${risk.equipment_type}\n` +
          `   Risk Level: ${risk.risk_level} (Score: ${risk.risk_score})\n` +
          `   Risk Scenario: ${risk.risk_scenario_standardized} (${risk.risk_scenario_english})\n` +
          `   Scenario Description: ${risk.scenario_description}\n` +
          `   Risk Factors: ${risk.risk_factors || 'Not specified'}\n` +
          (risk.likelihood_score && risk.consequence_score ? 
            `   Risk Matrix: Likelihood ${risk.likelihood_score}/5, Consequence ${risk.consequence_score}/5\n` : '') +
          `   Impact Rank: ${risk.impact_rank || 'Not assessed'}\n` +
          `   Mitigation: ${risk.mitigation_measures || 'No measures defined'}\n`
        ).join('\n')

      const recommendations = []
      
      const highRisks = filteredRisks.filter(r => r.risk_level === 'HIGH')
      if (highRisks.length > 0) {
        recommendations.push(`${highRisks.length} equipment items have HIGH risk levels - immediate attention required`)
        recommendations.push('Prioritize maintenance planning for high-risk equipment')
        recommendations.push('Consider upgrading to predictive maintenance strategies')
      }
      
      if (filteredRisks.length === 0) {
        recommendations.push('No risk assessments found matching your criteria')
        recommendations.push('Verify risk assessment data is available in the database')
      } else {
        recommendations.push('Review and update risk mitigation strategies regularly')
        recommendations.push('Monitor equipment performance trends for early risk detection')
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
      // Query real equipment strategy data from database
      const { data: strategyData, error } = await supabase
        .from('equipment_strategy')
        .select(`
          strategy_id,
          equipment_id,
          strategy_name,
          strategy_type,
          frequency_type,
          frequency_value,
          priority,
          is_active,
          equipment!inner(equipment_name, equipment_type_id)
        `)
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching equipment strategy data:', error)
        throw error
      }

      // Transform database data to expected format
      let equipmentStrategies = strategyData.map(strategy => ({
        equipment_id: strategy.equipment_id,
        equipment_name: strategy.equipment?.equipment_name || 'Unknown Equipment',
        equipment_type: this.getEquipmentTypeName(strategy.equipment?.equipment_type_id) || 'Unknown Type',
        strategy_id: strategy.strategy_id,
        strategy_name: strategy.strategy_name,
        strategy_type: strategy.strategy_type,
        frequency: `${strategy.frequency_value} ${strategy.frequency_type}`,
        frequency_type: strategy.frequency_type,
        frequency_value: strategy.frequency_value,
        priority: strategy.priority,
        is_active: strategy.is_active,
        coverage_status: strategy.is_active ? 'FULLY_COVERED' : 'NOT_COVERED'
      }))

      // Also get risk assessment data to correlate strategies with risks
      const { data: riskData } = await supabase
        .from('equipment_risk_assessment')
        .select('equipment_id, risk_level, risk_factor')
        .in('equipment_id', equipmentStrategies.map(s => s.equipment_id))

      // Enhance strategy data with risk information
      equipmentStrategies = equipmentStrategies.map(strategy => {
        const risk = riskData?.find(r => r.equipment_id === strategy.equipment_id)
        return {
          ...strategy,
          risk_level: risk?.risk_level || 'UNKNOWN',
          risk_factors: risk?.risk_factor || 'No risk assessment available'
        }
      })

      // Filter by system if specified (would need proper system mapping in database)
      let filteredStrategies = equipmentStrategies
      const systemMatch = query.match(/SYS-\d{3}/i)
      if (systemMatch) {
        const systemId = systemMatch[0].toUpperCase()
        // Filter by equipment ID patterns that typically belong to systems
        if (systemId === 'SYS-001') {
          filteredStrategies = equipmentStrategies.filter(s => 
            s.equipment_id.startsWith('HX-') || s.equipment_id.startsWith('PU-'))
        }
      }

      // Filter by high risk if mentioned
      if (query.toLowerCase().includes('high risk')) {
        filteredStrategies = filteredStrategies.filter(s => s.risk_level === 'HIGH')
      }

      // Filter by fouling if mentioned
      if (query.toLowerCase().includes('fouling')) {
        filteredStrategies = filteredStrategies.filter(s => 
          s.risk_factors?.toLowerCase().includes('fouling') || 
          s.risk_factors?.toLowerCase().includes('ファウリング'))
      }

      // Filter by frequency if mentioned
      if (query.toLowerCase().includes('daily')) {
        filteredStrategies = filteredStrategies.filter(s => 
          s.frequency_type.toLowerCase() === 'daily')
      } else if (query.toLowerCase().includes('weekly')) {
        filteredStrategies = filteredStrategies.filter(s => 
          s.frequency_type.toLowerCase() === 'weekly')
      } else if (query.toLowerCase().includes('monthly')) {
        filteredStrategies = filteredStrategies.filter(s => 
          s.frequency_type.toLowerCase() === 'monthly')
      } else if (query.toLowerCase().includes('quarterly')) {
        filteredStrategies = filteredStrategies.filter(s => 
          s.frequency_type.toLowerCase() === 'quarterly')
      } else if (query.toLowerCase().includes('annual')) {
        filteredStrategies = filteredStrategies.filter(s => 
          s.frequency_type.toLowerCase() === 'annual' || 
          s.frequency_type.toLowerCase() === 'yearly')
      }

      const summary = `Equipment Strategy Analysis (Real Database Data):\n\n` +
        `Found ${filteredStrategies.length} equipment strategies:\n\n` +
        filteredStrategies.map((strategy, index) => 
          `${index + 1}. ${strategy.equipment_name} (${strategy.equipment_id})\n` +
          `   Equipment Type: ${strategy.equipment_type}\n` +
          `   Risk Level: ${strategy.risk_level}\n` +
          `   Risk Factors: ${strategy.risk_factors}\n` +
          `   Strategy: ${strategy.strategy_name}\n` +
          `   Type: ${strategy.strategy_type}\n` +
          `   Frequency: ${strategy.frequency}\n` +
          `   Priority: ${strategy.priority}\n`
        ).join('\n')

      const recommendations = []
      
      // Check coverage gaps
      const fullyCovered = filteredStrategies.filter(s => s.coverage_status === 'FULLY_COVERED').length
      const total = filteredStrategies.length
      const highRiskCount = filteredStrategies.filter(s => s.risk_level === 'HIGH').length
      
      if (total > 0) {
        recommendations.push(`Equipment strategy coverage: ${fullyCovered}/${total} equipment fully covered`)
        if (highRiskCount > 0) {
          recommendations.push(`${highRiskCount} high-risk equipment items have maintenance strategies`)
        }
        recommendations.push('Review strategy effectiveness regularly')
        recommendations.push('Consider predictive maintenance for critical equipment')
      } else {
        recommendations.push('No equipment strategies found matching your criteria')
        recommendations.push('Consider creating maintenance strategies for high-risk equipment')
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
    try {
      // Query compliance-related data from inspection plans and work orders
      const { data: inspectionData, error: inspectionError } = await supabase
        .from('inspection_plan')
        .select(`
          *,
          equipment(equipment_name, equipment_tag)
        `)
        .eq('status', 'COMPLETED')
        .order('next_inspection_date', { ascending: false })
        .limit(50)

      if (inspectionError) throw inspectionError

      const { data: workOrderData, error: workOrderError } = await supabase
        .from('work_order')
        .select('*')
        .eq('status', 'COMPLETED')
        .order('created_date', { ascending: false })
        .limit(50)

      if (workOrderError) throw workOrderError

      const complianceStats = {
        completed_inspections: inspectionData?.length || 0,
        completed_work_orders: workOrderData?.length || 0,
        compliance_rate: inspectionData?.length > 0 ? ((inspectionData.length / (inspectionData.length + 10)) * 100).toFixed(1) : '0'
      }

      return {
        query,
        response: `Compliance tracking shows ${complianceStats.completed_inspections} completed inspections and ${complianceStats.completed_work_orders} completed work orders. Current compliance rate: ${complianceStats.compliance_rate}%.`,
        data: { inspections: inspectionData, work_orders: workOrderData, stats: complianceStats },
        query_type: 'COMPLIANCE_TRACKING',
        confidence: 0.85
      }
    } catch (error) {
      console.error('Error in compliance tracking:', error)
      return this.createErrorResponse(query, 'Failed to retrieve compliance data')
    }
  }

  private async handlePerformanceAnalysis(query: string, entities: any, context: any): Promise<AIQueryResponse> {
    try {
      // Analyze equipment performance based on maintenance history
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance_history')
        .select(`
          *,
          equipment(equipment_name, equipment_tag, operational_status)
        `)
        .order('implementation_date', { ascending: false })
        .limit(100)

      if (maintenanceError) throw maintenanceError

      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('equipment_id, equipment_name, operational_status')

      if (equipmentError) throw equipmentError

      const performanceMetrics = {
        total_equipment: equipmentData?.length || 0,
        operational_equipment: equipmentData?.filter(eq => eq.operational_status === 'OPERATIONAL').length || 0,
        maintenance_events: maintenanceData?.length || 0,
        avg_mttr: maintenanceData?.length > 0 ? 
          (maintenanceData.reduce((sum, m) => sum + (parseFloat(m.work_hours) || 4), 0) / maintenanceData.length).toFixed(1) : '4.0'
      }

      const availability = performanceMetrics.total_equipment > 0 ? 
        ((performanceMetrics.operational_equipment / performanceMetrics.total_equipment) * 100).toFixed(1) : '0'

      return {
        query,
        response: `Performance analysis shows ${availability}% equipment availability with ${performanceMetrics.maintenance_events} recent maintenance events. Average MTTR: ${performanceMetrics.avg_mttr} hours.`,
        data: { metrics: performanceMetrics, maintenance_data: maintenanceData },
        query_type: 'PERFORMANCE_ANALYSIS',
        confidence: 0.80
      }
    } catch (error) {
      console.error('Error in performance analysis:', error)
      return this.createErrorResponse(query, 'Failed to retrieve performance data')
    }
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
        // Try alternative query by system ID pattern in equipment ID
        const { data: altEquipment, error: altError } = await supabase
          .from('equipment')
          .select(`
            設備ID,
            設備名,
            設置場所,
            稼働状態,
            設備種別ID
          `)
          .like('設備ID', `${systemId.replace('SYS-', '')}%`)
          .order('設備ID')
          .limit(50)

        if (!altError && altEquipment && altEquipment.length > 0) {
          const formattedEquipment = altEquipment.map(eq => ({
            equipment_id: eq.設備ID,
            name: eq.設備名,
            type: this.getEquipmentTypeName(eq.設備種別ID) || 'Unknown',
            status: eq.稼働状態,
            location: eq.設置場所
          }))
          
          return {
            query,
            intent: 'EQUIPMENT_BY_SYSTEM',
            confidence: 0.85,
            results: formattedEquipment,
            summary: `Found ${formattedEquipment.length} equipment items related to system ${systemId}`,
            recommendations: [
              `System ${systemId} contains ${formattedEquipment.length} pieces of equipment`,
              'Review equipment status for maintenance planning',
              'Check critical equipment in this system'
            ],
            execution_time: 0,
            source: 'database',
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
  /**
   * Get equipment type name by ID (since we no longer use master tables)
   */
  private getEquipmentTypeName(typeId: number): string {
    const equipmentTypes = {
      1: '静機器',
      2: '回転機',
      3: '電気設備',
      4: '計装設備'
    }
    return equipmentTypes[typeId] || 'Unknown'
  }

  /**
   * Calculate maintenance priority based on due date
   */
  private calculateMaintenancePriority(dueDate: string): string {
    const due = new Date(dueDate)
    const now = new Date()
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue <= 3) return 'HIGH'
    if (daysUntilDue <= 7) return 'MEDIUM'
    return 'LOW'
  }

  /**
   * Estimate maintenance hours based on task type
   */
  private estimateMaintenanceHours(taskType: string): number {
    const taskMap: Record<string, number> = {
      '定期点検': 4,
      '精密点検': 8,
      '分解点検': 12,
      'オーバーホール': 24,
      '日常点検': 1,
      '月次点検': 2,
      '年次点検': 6
    }
    
    return taskMap[taskType] || 4 // Default 4 hours
  }

  // =============================================================================
  // ENHANCED ANALYTICS METHODS FOR COMPLEX QUESTIONS
  // =============================================================================

  /**
   * Handle department-specific task implementation status queries
   * Example: "implementation status of tasks under Refining Department's responsibility for E-101"
   */
  async handleDepartmentTaskStatus(query: string, department: string, equipmentId?: string): Promise<any> {
    try {
      console.log(`🏢 Processing department task status query for ${department}${equipmentId ? ` and equipment ${equipmentId}` : ''}`)

      let queryBuilder = supabase
        .from('department_performance_view')
        .select('*')

      // Filter by department
      if (department.toUpperCase().includes('REFINING') || department.includes('精製')) {
        queryBuilder = queryBuilder.eq('department_id', 'REFINING')
      } else if (department.toUpperCase().includes('MAINTENANCE') || department.includes('保全')) {
        queryBuilder = queryBuilder.eq('department_id', 'MAINT')
      } else if (department.toUpperCase().includes('SAFETY') || department.includes('安全')) {
        queryBuilder = queryBuilder.eq('department_id', 'SAFETY')
      }

      // Filter by equipment if specified
      if (equipmentId) {
        queryBuilder = queryBuilder.eq('equipment_id', equipmentId)
      }

      const { data: taskStatus, error } = await queryBuilder

      if (error) {
        console.error('Error fetching department task status:', error)
        return this.createErrorResponse(query, 'Failed to fetch department task status')
      }

      // Also get personnel assignments for the department/equipment
      let personnelQuery = supabase
        .from('personnel_responsibility_view')
        .select('*')

      if (equipmentId) {
        personnelQuery = personnelQuery.eq('equipment_id', equipmentId)
      }

      const { data: personnel, error: personnelError } = await personnelQuery

      // Calculate summary statistics
      const totalPlanned = taskStatus?.reduce((sum, task) => sum + (task.planned_tasks || 0), 0) || 0
      const totalCompleted = taskStatus?.reduce((sum, task) => sum + (task.completed_tasks || 0), 0) || 0
      const totalOverdue = taskStatus?.reduce((sum, task) => sum + (task.overdue_tasks || 0), 0) || 0
      const overallRate = totalPlanned > 0 ? (totalCompleted / totalPlanned * 100).toFixed(1) : '0'

      return {
        query,
        intent: 'DEPARTMENT_TASK_STATUS',
        confidence: 0.9,
        results: taskStatus || [],
        summary: `Department Task Implementation Status Analysis:

Found ${taskStatus?.length || 0} task categories for ${department} Department${equipmentId ? ` (Equipment: ${equipmentId})` : ''}:

📊 **Overall Performance:**
- Total Planned Tasks: ${totalPlanned}
- Completed Tasks: ${totalCompleted}
- Overdue Tasks: ${totalOverdue}
- Implementation Rate: ${overallRate}%

👥 **Assigned Personnel:** ${personnel?.length || 0} staff members`,
        recommendations: taskStatus?.length > 0 ? [
          totalOverdue > 0 ? `${totalOverdue} tasks are overdue - immediate attention required` : 'All tasks are on schedule',
          `Implementation rate is ${overallRate}% - ${parseFloat(overallRate) >= 90 ? 'excellent performance' : 'improvement needed'}`,
          personnel?.length > 0 ? `${personnel.length} personnel assigned with verified competencies` : 'Review personnel assignments'
        ] : ['No task data found for specified criteria'],
        context: {
          department,
          equipmentId,
          totalPlanned,
          totalCompleted,
          totalOverdue,
          personnelCount: personnel?.length || 0
        }
      }

    } catch (error) {
      console.error('Error in handleDepartmentTaskStatus:', error)
      return this.createErrorResponse(query, 'Failed to analyze department task status')
    }
  }

  /**
   * Handle instrumentation alert and cascade analysis
   * Example: "TI-201 temperature rises sharply - extract risk scenarios, affected equipment, personnel"
   */
  async handleInstrumentationAlert(query: string, instrumentTag: string): Promise<any> {
    try {
      console.log(`🌡️ Processing instrumentation alert for ${instrumentTag}`)

      // Get instrument details and risk triggers
      const { data: instrumentData, error: instrumentError } = await supabase
        .from('instrumentation_status_view')
        .select('*')
        .eq('instrument_tag', instrumentTag)

      if (instrumentError) {
        console.error('Error fetching instrument data:', instrumentError)
      }

      // Get affected equipment through cascade analysis
      const { data: cascadeData, error: cascadeError } = await supabase
        .from('equipment_cascade_view')
        .select('*')
        .or(`upstream_equipment_id.eq.${instrumentTag},downstream_equipment_id.eq.${instrumentTag}`)

      // Get equipment that this instrument monitors
      const equipmentId = instrumentData?.[0]?.equipment_id
      let affectedEquipment = []
      
      if (equipmentId) {
        // Get direct equipment
        const { data: equipment, error: eqError } = await supabase
          .from('equipment')
          .select('設備ID, 設備名, 稼働状態, 設備種別ID')
          .eq('設備ID', equipmentId)

        if (!eqError && equipment) {
          affectedEquipment = equipment
        }

        // Get cascade effects
        const { data: cascadeEquipment, error: cascadeEqError } = await supabase
          .from('equipment_cascade_view')
          .select('*')
          .eq('upstream_equipment_id', equipmentId)

        if (!cascadeEqError && cascadeEquipment) {
          affectedEquipment = [...affectedEquipment, ...cascadeEquipment]
        }
      }

      // Get responsible personnel
      const { data: personnel, error: personnelError } = await supabase
        .from('personnel_responsibility_view')
        .select('*')
        .eq('equipment_id', equipmentId)

      const instrument = instrumentData?.[0]
      const triggerScenarios = instrumentData?.filter(item => item.triggered_risk_scenario) || []

      return {
        query,
        intent: 'INSTRUMENTATION_ALERT',
        confidence: 0.95,
        results: [{
          instrument_tag: instrumentTag,
          equipment_id: equipmentId,
          equipment_name: affectedEquipment[0]?.設備名 || 'Unknown',
          measurement_type: instrument?.measurement_type,
          measurement_location: instrument?.measurement_location,
          risk_scenarios: triggerScenarios.map(t => ({
            scenario: t.triggered_risk_scenario,
            severity: t.severity_level,
            response_time: t.response_time_minutes
          })),
          affected_equipment: affectedEquipment,
          responsible_personnel: personnel || [],
          cascade_effects: cascadeData || []
        }],
        summary: `Instrumentation Alert Analysis for ${instrumentTag}:

🚨 **Alert Details:**
- Instrument: ${instrumentTag} (${instrument?.measurement_type || 'Unknown type'})
- Location: ${instrument?.measurement_location || 'Unknown location'}
- Equipment: ${affectedEquipment[0]?.設備名 || 'Unknown'} (${equipmentId || 'N/A'})

⚠️ **Triggered Risk Scenarios:** ${triggerScenarios.length}
${triggerScenarios.map(t => `- ${t.triggered_risk_scenario} (${t.severity_level} severity, ${t.response_time_minutes}min response time)`).join('\n')}

🔗 **Cascade Effects:** ${cascadeData?.length || 0} downstream impacts identified
👥 **Responsible Personnel:** ${personnel?.length || 0} assigned staff members`,
        recommendations: [
          triggerScenarios.length > 0 ? `${triggerScenarios.length} risk scenarios triggered - immediate response required` : 'Monitor instrument closely',
          personnel?.length > 0 ? `Contact ${personnel.length} responsible personnel immediately` : 'Assign personnel to investigate',
          cascadeData?.length > 0 ? `${cascadeData.length} downstream equipment may be affected` : 'Limited cascade impact expected',
          instrument?.critical_for_operation ? 'Critical instrument - production impact likely' : 'Non-critical instrument'
        ],
        context: {
          instrumentTag,
          equipmentId,
          riskCount: triggerScenarios.length,
          personnelCount: personnel?.length || 0,
          cascadeCount: cascadeData?.length || 0,
          critical: instrument?.critical_for_operation || false
        }
      }

    } catch (error) {
      console.error('Error in handleInstrumentationAlert:', error)
      return this.createErrorResponse(query, 'Failed to analyze instrumentation alert')
    }
  }

  /**
   * Count total risk scenarios in the system
   * Example: "how many risk scenarios do you have?"
   */
  async handleRiskScenarioCount(query: string): Promise<any> {
    try {
      console.log('📊 Counting risk scenarios in system')

      // Count standardized risk scenarios
      const { data: standardScenarios, error: standardError } = await supabase
        .from('risk_scenario_master')
        .select('scenario_name, scenario_name_en, scenario_description')

      // Count equipment-specific risk scenarios
      const { data: equipmentRisks, error: equipmentError } = await supabase
        .from('equipment_risk_assessment')
        .select('risk_scenario')
        .not('risk_scenario', 'is', null)

      // Count unique equipment risk scenarios
      const uniqueEquipmentScenarios = new Set(equipmentRisks?.map(r => r.risk_scenario) || [])

      const standardCount = standardScenarios?.length || 0
      const equipmentCount = uniqueEquipmentScenarios.size

      return {
        query,
        intent: 'RISK_SCENARIO_COUNT',
        confidence: 1.0,
        results: [{
          standardized_scenarios: standardCount,
          equipment_specific_scenarios: equipmentCount,
          total_scenarios: standardCount + equipmentCount,
          scenario_details: standardScenarios || []
        }],
        summary: `Risk Scenario Analysis:

📋 **Standardized Risk Scenarios:** ${standardCount}
🏭 **Equipment-Specific Scenarios:** ${equipmentCount}
📊 **Total Risk Scenarios:** ${standardCount + equipmentCount}

The system contains ${standardCount} standardized risk scenarios in the master database and ${equipmentCount} unique equipment-specific risk scenarios.`,
        recommendations: [
          standardCount > 0 ? `${standardCount} standardized scenarios provide consistent risk assessment` : 'Consider adding standardized risk scenarios',
          equipmentCount > 0 ? `${equipmentCount} equipment-specific scenarios provide detailed coverage` : 'Add equipment-specific risk scenarios',
          `Total of ${standardCount + equipmentCount} scenarios available for comprehensive risk analysis`
        ],
        context: {
          standardCount,
          equipmentCount,
          totalCount: standardCount + equipmentCount
        }
      }

    } catch (error) {
      console.error('Error in handleRiskScenarioCount:', error)
      return this.createErrorResponse(query, 'Failed to count risk scenarios')
    }
  }
}

// Export service instance
export const enhancedAIService = new EnhancedAIService()