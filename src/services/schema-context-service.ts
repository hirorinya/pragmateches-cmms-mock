/**
 * Schema Context Service for Text-to-SQL
 * Provides semantic understanding of database structure following Google Cloud best practices
 */

import { supabase } from '@/lib/supabase'

export interface TableSchema {
  table_name: string
  description: string
  columns: ColumnSchema[]
  relationships: RelationshipSchema[]
  business_context: string
  common_queries: string[]
  aliases: string[]
}

export interface ColumnSchema {
  column_name: string
  data_type: string
  description: string
  business_meaning: string
  sample_values: string[]
  is_foreign_key: boolean
  references?: {
    table: string
    column: string
  }
  aliases: string[]
}

export interface RelationshipSchema {
  from_table: string
  from_column: string
  to_table: string
  to_column: string
  relationship_type: 'one_to_one' | 'one_to_many' | 'many_to_many'
  description: string
}

export interface SchemaContext {
  tables: TableSchema[]
  entity_mappings: EntityMapping[]
  business_glossary: BusinessTerm[]
  common_patterns: QueryPattern[]
}

export interface EntityMapping {
  entity_type: string
  table_name: string
  id_column: string
  name_column: string
  description: string
  examples: string[]
}

export interface BusinessTerm {
  term: string
  definition: string
  related_tables: string[]
  related_columns: string[]
  synonyms: string[]
}

export interface QueryPattern {
  pattern_name: string
  description: string
  natural_language_examples: string[]
  sql_template: string
  required_tables: string[]
  common_filters: string[]
}

export class SchemaContextService {
  private schemaContext: SchemaContext | null = null
  private lastUpdated: Date | null = null
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

  constructor() {
    this.initializeSchema()
  }

  /**
   * Initialize schema context with CMMS-specific semantic layer
   */
  private async initializeSchema() {
    this.schemaContext = {
      tables: [
        {
          table_name: 'equipment',
          description: 'Master table for all equipment and assets in the facility',
          business_context: 'Contains all physical equipment that requires maintenance, monitoring, and management',
          common_queries: [
            'Find all equipment by type',
            'Get equipment in specific location',
            'List equipment by operational status',
            'Show equipment details'
          ],
          aliases: ['設備', 'assets', 'machines', 'units'],
          columns: [
            {
              column_name: 'equipment_id',
              data_type: 'varchar',
              description: 'Unique identifier for equipment',
              business_meaning: 'Primary key for equipment records, follows naming convention like HX-101, PU-200',
              sample_values: ['HX-101', 'PU-200', 'TK-101', 'HX-102'],
              is_foreign_key: false,
              aliases: ['equipment_id', 'asset_id', 'unit_id']
            },
            {
              column_name: 'equipment_name',
              data_type: 'varchar',
              description: 'Human-readable name of the equipment',
              business_meaning: 'Business name used by operators and maintenance staff',
              sample_values: ['熱交換器', 'ポンプ', 'タンク', 'Heat Exchanger'],
              is_foreign_key: false,
              aliases: ['equipment_name', 'asset_name', 'name']
            },
            {
              column_name: 'equipment_type_id',
              data_type: 'int',
              description: 'Foreign key to equipment type master',
              business_meaning: 'Categories equipment for maintenance planning and analysis',
              sample_values: ['1', '2', '3', '4'],
              is_foreign_key: true,
              references: {
                table: 'equipment_type_master',
                column: 'id'
              },
              aliases: ['equipment_type_id', 'type_id']
            },
            {
              column_name: '設置場所',
              data_type: 'varchar',
              description: 'Physical location where equipment is installed',
              business_meaning: 'Used for maintenance routing and emergency response',
              sample_values: ['プロセスエリア', 'ユーティリティ', 'Process Area', 'Utility Area'],
              is_foreign_key: false,
              aliases: ['location', 'installation_location', 'area']
            },
            {
              column_name: 'operational_status',
              data_type: 'varchar',
              description: 'Current operational status',
              business_meaning: 'Indicates if equipment is running, stopped, or under maintenance',
              sample_values: ['OPERATIONAL', 'STOPPED', 'MAINTENANCE', 'Running', 'Stopped'],
              is_foreign_key: false,
              aliases: ['operating_status', 'status', 'state']
            }
          ],
          relationships: [
            {
              from_table: 'equipment',
              from_column: 'equipment_type_id',
              to_table: 'equipment_type_master',
              to_column: 'id',
              relationship_type: 'many_to_one',
              description: 'Equipment belongs to a specific type category'
            }
          ]
        },
        {
          table_name: 'maintenance_history',
          description: 'Historical record of all maintenance activities performed',
          business_context: 'Tracks when maintenance was performed, what was done, and results',
          common_queries: [
            'Get maintenance history for equipment',
            'Find recent maintenance activities',
            'Analyze maintenance frequency',
            'Check maintenance costs'
          ],
          aliases: ['保全履歴', 'maintenance_records', 'work_orders', 'maintenance_log'],
          columns: [
            {
              column_name: 'equipment_id',
              data_type: 'varchar',
              description: 'Equipment that received maintenance',
              business_meaning: 'Links maintenance activity to specific equipment',
              sample_values: ['HX-101', 'PU-200', 'TK-101'],
              is_foreign_key: true,
              references: {
                table: 'equipment',
                column: 'equipment_id'
              },
              aliases: ['equipment_id']
            },
            {
              column_name: '実施日',
              data_type: 'date',
              description: 'Date when maintenance was performed',
              business_meaning: 'Critical for scheduling and frequency analysis',
              sample_values: ['2024-01-15', '2024-02-20', '2024-03-10'],
              is_foreign_key: false,
              aliases: ['maintenance_date', 'work_date', 'completion_date']
            },
            {
              column_name: '作業内容',
              data_type: 'text',
              description: 'Description of maintenance work performed',
              business_meaning: 'Details what was actually done during maintenance',
              sample_values: ['定期点検', '清掃作業', '部品交換', 'Routine inspection'],
              is_foreign_key: false,
              aliases: ['work_description', 'maintenance_type', 'activity']
            },
            {
              column_name: 'コスト',
              data_type: 'decimal',
              description: 'Cost of maintenance activity',
              business_meaning: 'Used for budgeting and cost analysis',
              sample_values: ['50000', '25000', '100000'],
              is_foreign_key: false,
              aliases: ['cost', 'expense', 'price']
            }
          ],
          relationships: [
            {
              from_table: 'maintenance_history',
              from_column: 'equipment_id',
              to_table: 'equipment',
              to_column: 'equipment_id',
              relationship_type: 'many_to_one',
              description: 'Multiple maintenance records per equipment'
            }
          ]
        },
        {
          table_name: 'equipment_risk_assessment',
          description: 'Risk analysis data for equipment including failure modes and mitigation measures',
          business_context: 'Used for risk-based maintenance and safety planning',
          common_queries: [
            'Find high-risk equipment',
            'Get risk assessment for specific equipment',
            'Analyze risk by failure mode',
            'Check mitigation status'
          ],
          aliases: ['リスク評価', 'risk_analysis', 'failure_analysis'],
          columns: [
            {
              column_name: 'equipment_id',
              data_type: 'varchar',
              description: 'Equipment being assessed',
              business_meaning: 'Links risk data to specific equipment',
              sample_values: ['HX-101', 'PU-200', 'TK-101'],
              is_foreign_key: true,
              references: {
                table: 'equipment',
                column: 'equipment_id'
              },
              aliases: ['equipment_id']
            },
            {
              column_name: '故障モード',
              data_type: 'varchar',
              description: 'Type of failure being analyzed',
              business_meaning: 'Specific way the equipment can fail',
              sample_values: ['腐食', '摩耗', '疲労', 'Corrosion', 'Wear'],
              is_foreign_key: false,
              aliases: ['failure_mode', 'failure_type']
            },
            {
              column_name: 'リスクスコア',
              data_type: 'decimal',
              description: 'Calculated risk score (RPN)',
              business_meaning: 'Priority indicator for maintenance planning',
              sample_values: ['120', '80', '200', '45'],
              is_foreign_key: false,
              aliases: ['risk_score', 'rpn', 'priority_score']
            },
            {
              column_name: '影響度ランク',
              data_type: 'varchar',
              description: 'Impact level if failure occurs',
              business_meaning: 'Consequences of equipment failure',
              sample_values: ['高い', '中程度', '低い', 'High', 'Medium', 'Low'],
              is_foreign_key: false,
              aliases: ['impact_rank', 'consequence_level', 'severity']
            }
          ],
          relationships: [
            {
              from_table: 'equipment_risk_assessment',
              from_column: 'equipment_id',
              to_table: 'equipment',
              to_column: 'equipment_id',
              relationship_type: 'many_to_one',
              description: 'Multiple risk assessments per equipment'
            }
          ]
        },
        {
          table_name: 'thickness_measurement',
          description: 'Wall thickness measurements for corrosion monitoring',
          business_context: 'Critical for structural integrity and safety of pressure equipment',
          common_queries: [
            'Get thickness trends over time',
            'Find equipment approaching minimum thickness',
            'Check latest thickness measurements',
            'Identify corrosion rates'
          ],
          aliases: ['肉厚測定', 'thickness_data', 'corrosion_monitoring'],
          columns: [
            {
              column_name: 'equipment_id',
              data_type: 'varchar',
              description: 'Equipment being measured',
              business_meaning: 'Links thickness data to specific equipment',
              sample_values: ['HX-101', 'TK-101', 'PU-200'],
              is_foreign_key: true,
              references: {
                table: 'equipment',
                column: 'equipment_id'
              },
              aliases: ['equipment_id']
            },
            {
              column_name: '検査日',
              data_type: 'date',
              description: 'Date of thickness measurement',
              business_meaning: 'Timeline for corrosion monitoring',
              sample_values: ['2024-01-15', '2024-06-15', '2024-12-15'],
              is_foreign_key: false,
              aliases: ['inspection_date', 'measurement_date']
            },
            {
              column_name: '肉厚測定値(mm)',
              data_type: 'decimal',
              description: 'Measured wall thickness in millimeters',
              business_meaning: 'Actual thickness measurement for integrity assessment',
              sample_values: ['12.5', '11.8', '10.2', '9.5'],
              is_foreign_key: false,
              aliases: ['thickness_value', 'measured_thickness', 'thickness_mm']
            },
            {
              column_name: '最小許容肉厚(mm)',
              data_type: 'decimal',
              description: 'Minimum allowable thickness for safe operation',
              business_meaning: 'Safety limit below which equipment must be replaced',
              sample_values: ['8.0', '6.0', '10.0', '5.0'],
              is_foreign_key: false,
              aliases: ['minimum_thickness', 'safety_limit', 'minimum_allowable']
            }
          ],
          relationships: [
            {
              from_table: 'thickness_measurement',
              from_column: 'equipment_id',
              to_table: 'equipment',
              to_column: 'equipment_id',
              relationship_type: 'many_to_one',
              description: 'Multiple thickness measurements per equipment over time'
            }
          ]
        }
      ],
      entity_mappings: [
        {
          entity_type: 'equipment',
          table_name: 'equipment',
          id_column: 'equipment_id',
          name_column: 'equipment_name',
          description: 'Physical equipment and assets in the facility',
          examples: ['HX-101', 'PU-200', 'TK-101', 'heat exchanger', 'pump', 'tank']
        },
        {
          entity_type: 'maintenance',
          table_name: 'maintenance_history',
          id_column: 'id',
          name_column: '作業内容',
          description: 'Maintenance activities and work orders',
          examples: ['routine inspection', 'cleaning', 'part replacement', '定期点検']
        },
        {
          entity_type: 'risk',
          table_name: 'equipment_risk_assessment',
          id_column: 'id',
          name_column: '故障モード',
          description: 'Risk assessments and failure mode analysis',
          examples: ['corrosion', 'wear', 'fatigue', 'high risk', 'low risk']
        }
      ],
      business_glossary: [
        {
          term: 'equipment',
          definition: 'Physical assets requiring maintenance and monitoring',
          related_tables: ['equipment', 'maintenance_history', 'equipment_risk_assessment'],
          related_columns: ['equipment_id', 'equipment_name', 'equipment_type_id'],
          synonyms: ['asset', 'machine', 'unit', 'device', '設備', '機器']
        },
        {
          term: 'maintenance',
          definition: 'Activities performed to keep equipment operational',
          related_tables: ['maintenance_history'],
          related_columns: ['作業内容', '実施日', 'コスト'],
          synonyms: ['repair', 'service', 'work', 'upkeep', '保全', 'メンテナンス']
        },
        {
          term: 'risk',
          definition: 'Probability and consequence of equipment failure',
          related_tables: ['equipment_risk_assessment'],
          related_columns: ['リスクスコア', '故障モード', '影響度ランク'],
          synonyms: ['failure', 'hazard', 'danger', 'threat', 'リスク', '危険']
        },
        {
          term: 'thickness',
          definition: 'Wall thickness measurements for structural integrity',
          related_tables: ['thickness_measurement'],
          related_columns: ['肉厚測定値(mm)', '最小許容肉厚(mm)'],
          synonyms: ['corrosion', 'wall thickness', 'structural integrity', '肉厚', '腐食']
        }
      ],
      common_patterns: [
        {
          pattern_name: 'equipment_info',
          description: 'Get basic information about specific equipment',
          natural_language_examples: [
            'Tell me about equipment HX-101',
            'Show me details for HX-101',
            'What is the status of HX-101?'
          ],
          sql_template: `
            SELECT e.equipment_id, e.equipment_name, e.installation_location, e.operational_status, e.equipment_type_id
            FROM equipment e
            WHERE e.equipment_id = ?
          `,
          required_tables: ['equipment', 'equipment_type_master'],
          common_filters: ['equipment_id']
        },
        {
          pattern_name: 'maintenance_history',
          description: 'Get maintenance history for equipment or time period',
          natural_language_examples: [
            'Show me maintenance history for HX-101',
            'What maintenance was done last month?',
            'Recent maintenance activities'
          ],
          sql_template: `
            SELECT mh.equipment_id, mh.implementation_date, mh.work_content, mh.cost, e.equipment_name
            FROM maintenance_history mh
            JOIN equipment e ON mh.equipment_id = e.equipment_id
            WHERE mh.equipment_id = ? OR mh.implementation_date >= ?
            ORDER BY mh.実施日 DESC
          `,
          required_tables: ['maintenance_history', 'equipment'],
          common_filters: ['equipment_id', 'implementation_date']
        },
        {
          pattern_name: 'risk_analysis',
          description: 'Analyze risk levels and failure modes',
          natural_language_examples: [
            'Show me high-risk equipment',
            'What are the risk factors for HX-101?',
            'Equipment with corrosion risk'
          ],
          sql_template: `
            SELECT era.equipment_id, era.failure_mode, era.risk_score, era.impact_level, e.equipment_name
            FROM equipment_risk_assessment era
            JOIN equipment e ON era.equipment_id = e.equipment_id
            WHERE era.risk_score > ? OR era.equipment_id = ?
            ORDER BY era.リスクスコア DESC
          `,
          required_tables: ['equipment_risk_assessment', 'equipment'],
          common_filters: ['risk_score', 'equipment_id', 'failure_mode']
        }
      ]
    }

    this.lastUpdated = new Date()
  }

  /**
   * Get schema context for text-to-SQL generation
   */
  async getSchemaContext(): Promise<SchemaContext> {
    if (!this.schemaContext || this.needsRefresh()) {
      await this.initializeSchema()
    }
    return this.schemaContext!
  }

  /**
   * Get relevant tables for a query
   */
  async getRelevantTables(query: string): Promise<TableSchema[]> {
    const context = await this.getSchemaContext()
    const queryLower = query.toLowerCase()
    
    const relevantTables = context.tables.filter(table => {
      // Check if query mentions table name or aliases
      const tableMatches = [table.table_name, ...table.aliases].some(name => 
        queryLower.includes(name.toLowerCase())
      )
      
      // Check if query mentions any columns
      const columnMatches = table.columns.some(col => 
        [col.column_name, ...col.aliases].some(name => 
          queryLower.includes(name.toLowerCase())
        )
      )
      
      // Check business context
      const contextMatches = table.business_context.toLowerCase().includes(queryLower) ||
        table.common_queries.some(q => q.toLowerCase().includes(queryLower))
      
      return tableMatches || columnMatches || contextMatches
    })
    
    return relevantTables.length > 0 ? relevantTables : context.tables
  }

  /**
   * Get business context for query understanding
   */
  async getBusinessContext(query: string): Promise<{
    terms: BusinessTerm[]
    patterns: QueryPattern[]
    entities: EntityMapping[]
  }> {
    const context = await this.getSchemaContext()
    const queryLower = query.toLowerCase()
    
    const relevantTerms = context.business_glossary.filter(term =>
      [term.term, ...term.synonyms].some(syn => 
        queryLower.includes(syn.toLowerCase())
      )
    )
    
    const relevantPatterns = context.common_patterns.filter(pattern =>
      pattern.natural_language_examples.some(example =>
        this.calculateSimilarity(example.toLowerCase(), queryLower) > 0.5
      )
    )
    
    const relevantEntities = context.entity_mappings.filter(entity =>
      entity.examples.some(example =>
        queryLower.includes(example.toLowerCase())
      )
    )
    
    return {
      terms: relevantTerms,
      patterns: relevantPatterns,
      entities: relevantEntities
    }
  }

  /**
   * Generate schema context for LLM prompt
   */
  async generateSchemaPrompt(query: string): Promise<string> {
    const relevantTables = await this.getRelevantTables(query)
    const businessContext = await this.getBusinessContext(query)
    
    let prompt = `# Database Schema Context\n\n`
    
    // Add relevant tables
    prompt += `## Tables:\n`
    relevantTables.forEach(table => {
      prompt += `### ${table.table_name}\n`
      prompt += `**Description:** ${table.description}\n`
      prompt += `**Business Context:** ${table.business_context}\n`
      prompt += `**Aliases:** ${table.aliases.join(', ')}\n\n`
      
      prompt += `**Columns:**\n`
      table.columns.forEach(col => {
        prompt += `- **${col.column_name}** (${col.data_type}): ${col.business_meaning}\n`
        if (col.aliases.length > 0) {
          prompt += `  - Aliases: ${col.aliases.join(', ')}\n`
        }
        if (col.sample_values.length > 0) {
          prompt += `  - Sample values: ${col.sample_values.join(', ')}\n`
        }
      })
      prompt += `\n`
    })
    
    // Add business terms
    if (businessContext.terms.length > 0) {
      prompt += `## Business Terms:\n`
      businessContext.terms.forEach(term => {
        prompt += `- **${term.term}**: ${term.definition}\n`
        if (term.synonyms.length > 0) {
          prompt += `  - Synonyms: ${term.synonyms.join(', ')}\n`
        }
      })
      prompt += `\n`
    }
    
    // Add query patterns
    if (businessContext.patterns.length > 0) {
      prompt += `## Common Query Patterns:\n`
      businessContext.patterns.forEach(pattern => {
        prompt += `- **${pattern.pattern_name}**: ${pattern.description}\n`
        prompt += `  - Examples: ${pattern.natural_language_examples.join(', ')}\n`
      })
      prompt += `\n`
    }
    
    return prompt
  }

  /**
   * Check if schema needs refresh
   */
  private needsRefresh(): boolean {
    if (!this.lastUpdated) return true
    return Date.now() - this.lastUpdated.getTime() > this.CACHE_DURATION
  }

  /**
   * Calculate similarity between two strings (simple implementation)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ')
    const words2 = str2.split(' ')
    const common = words1.filter(word => words2.includes(word))
    return common.length / Math.max(words1.length, words2.length)
  }

  /**
   * Get all supported entity types
   */
  async getSupportedEntities(): Promise<string[]> {
    const context = await this.getSchemaContext()
    return context.entity_mappings.map(mapping => mapping.entity_type)
  }

  /**
   * Get table relationships for join planning
   */
  async getTableRelationships(tableNames: string[]): Promise<RelationshipSchema[]> {
    const context = await this.getSchemaContext()
    const relationships: RelationshipSchema[] = []
    
    context.tables.forEach(table => {
      if (tableNames.includes(table.table_name)) {
        relationships.push(...table.relationships)
      }
    })
    
    return relationships
  }
}

// Export singleton instance
export const schemaContextService = new SchemaContextService()