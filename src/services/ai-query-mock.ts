// Mock AI Query Service for Demo
// This simulates intelligent responses without actual AI backend

interface AIQueryResponse {
  query: string
  intent: string
  confidence: number
  results: any[]
  summary: string
  recommendations?: string[]
  execution_time: number
}

export class AIQueryMockService {
  
  // Mock equipment data with classifications - updated to match actual database
  private mockEquipmentData = {
    // System A (SYS-001) - Process Cooling System
    'HX-101': { type: 'HEAT_EXCHANGER', subtype: 'Shell-and-tube', system: 'SYS-001' },
    'HX-102': { type: 'HEAT_EXCHANGER', subtype: 'Plate', system: 'SYS-001' },
    'HX-103': { type: 'HEAT_EXCHANGER', subtype: 'Air-cooled', system: 'SYS-001' },
    'PU-100': { type: 'PUMP', subtype: 'Centrifugal', system: 'SYS-001' },
    'TK-101': { type: 'TANK', subtype: 'Storage', system: 'SYS-001' },
    // System B (SYS-002) - Distillation System
    'HX-201': { type: 'HEAT_EXCHANGER', subtype: 'Shell-and-tube', system: 'SYS-002' },
    'HX-202': { type: 'HEAT_EXCHANGER', subtype: 'Plate', system: 'SYS-002' },
    'HX-203': { type: 'HEAT_EXCHANGER', subtype: 'Air-cooled', system: 'SYS-002' },
    'PU-200': { type: 'PUMP', subtype: 'Centrifugal', system: 'SYS-002' },
    'TK-201': { type: 'TANK', subtype: 'Storage', system: 'SYS-002' }
  }

  // Mock instrument mappings - updated to match actual equipment IDs
  private mockInstrumentMappings = {
    'TI-201': {
      equipment: ['HX-201', 'HX-202', 'PU-200'],
      parameter: 'TEMPERATURE',
      criticality: 'HIGH'
    },
    'PI-101': {
      equipment: ['PU-100', 'HX-101'],
      parameter: 'PRESSURE', 
      criticality: 'MEDIUM'
    },
    'FI-301': {
      equipment: ['PU-100', 'HX-103'],
      parameter: 'FLOW',
      criticality: 'HIGH'
    }
  }

  // Mock risk scenarios - updated to match actual equipment IDs
  private mockRiskScenarios = {
    // System A equipment with fouling risk coverage
    'HX-101': [
      {
        scenario_id: 'RS-HX101-001',
        failure_mode: 'Tube fouling blockage',
        risk_level: 'HIGH',
        responsible_person: 'ST001',
        department: 'REFINERY',
        mitigation_status: 'IMPLEMENTED'
      },
      {
        scenario_id: 'RS-HX101-002', 
        failure_mode: 'Corrosion leakage',
        risk_level: 'MEDIUM',
        responsible_person: 'ST002',
        department: 'MAINTENANCE',
        mitigation_status: 'PLANNED'
      }
    ],
    // System A equipment WITHOUT fouling risk coverage
    'HX-102': [
      {
        scenario_id: 'RS-HX102-001',
        failure_mode: 'Corrosion leakage', 
        risk_level: 'MEDIUM',
        responsible_person: 'ST001',
        department: 'REFINERY',
        mitigation_status: 'IMPLEMENTED'
      }
      // Note: Missing fouling scenario - will be detected by AI
    ],
    'HX-103': [
      {
        scenario_id: 'RS-HX103-001',
        failure_mode: 'Fan blade damage',
        risk_level: 'LOW',
        responsible_person: 'ST003', 
        department: 'MAINTENANCE',
        mitigation_status: 'IMPLEMENTED'
      }
      // Note: Missing fouling scenario - will be detected by AI
    ],
    // System B equipment with fouling risk coverage
    'HX-201': [
      {
        scenario_id: 'RS-HX201-001',
        failure_mode: 'Tube fouling blockage',
        risk_level: 'HIGH',
        responsible_person: 'ST001',
        department: 'REFINERY',
        mitigation_status: 'IMPLEMENTED'
      }
    ],
    // System B equipment WITHOUT fouling risk coverage
    'HX-202': [
      {
        scenario_id: 'RS-HX202-001',
        failure_mode: 'Corrosion leakage',
        risk_level: 'MEDIUM',
        responsible_person: 'ST002',
        department: 'MAINTENANCE',
        mitigation_status: 'PLANNED'
      }
      // Note: Missing fouling scenario - will be detected by AI
    ],
    'HX-203': [
      {
        scenario_id: 'RS-HX203-001',
        failure_mode: 'Seal failure',
        risk_level: 'LOW',
        responsible_person: 'ST003',
        department: 'MAINTENANCE',
        mitigation_status: 'IMPLEMENTED'
      }
      // Note: Missing fouling scenario - will be detected by AI
    ]
  }

  // Mock mitigation measures - updated to match actual equipment IDs
  private mockMitigationMeasures = {
    'HX-101': [
      {
        measure: 'Daily temperature monitoring',
        responsible_department: 'REFINERY',
        responsible_person: 'ST001',
        frequency: 'DAILY',
        status: 'IMPLEMENTED',
        start_date: '2025-01-01',
        last_execution: '2025-07-09'
      },
      {
        measure: 'Weekly pressure drop check',
        responsible_department: 'REFINERY', 
        responsible_person: 'ST001',
        frequency: 'WEEKLY',
        status: 'IMPLEMENTED',
        start_date: '2025-01-15',
        last_execution: '2025-07-08'
      },
      {
        measure: 'Monthly tube cleaning',
        responsible_department: 'MAINTENANCE',
        responsible_person: 'ST002',
        frequency: 'MONTHLY', 
        status: 'PLANNED',
        planned_start: '2025-08-01',
        last_execution: null
      }
    ]
  }

  /**
   * Main query processing function
   */
  async processQuery(query: string): Promise<AIQueryResponse> {
    const startTime = Date.now()
    
    // Simple keyword-based intent detection
    const intent = this.detectIntent(query)
    const entities = this.extractEntities(query)
    
    let response: AIQueryResponse
    
    switch (intent) {
      case 'COVERAGE_ANALYSIS':
        response = this.handleCoverageAnalysis(query, entities)
        break
      case 'MITIGATION_STATUS':
        response = this.handleMitigationStatus(query, entities)
        break
      case 'IMPACT_ANALYSIS':
        response = this.handleImpactAnalysis(query, entities)
        break
      default:
        response = this.handleGenericQuery(query)
    }
    
    response.execution_time = Date.now() - startTime
    return response
  }

  /**
   * Use Case 1: Risk Coverage Analysis
   */
  private handleCoverageAnalysis(query: string, entities: any): AIQueryResponse {
    // Don't default to any system - require explicit system detection
    const system = entities.system
    const riskType = entities.risk_type || 'fouling'
    
    // Check if this is asking for equipment WITH or WITHOUT risk coverage
    const isAskingForMissing = query.toLowerCase().includes('not') || query.toLowerCase().includes('missing') || query.toLowerCase().includes('ない')
    const isAskingForCovered = query.toLowerCase().includes(' are ') && !isAskingForMissing
    
    if (!system) {
      return {
        query,
        intent: 'COVERAGE_ANALYSIS',
        confidence: 0.5,
        results: [],
        summary: 'Please specify which system (A or B) you want to analyze.',
        recommendations: ['Specify System A or System B in your query']
      }
    }
    
    // Find heat exchangers in the specified system
    const heatExchangers = Object.entries(this.mockEquipmentData)
      .filter(([id, data]) => data.type === 'HEAT_EXCHANGER' && data.system === system)
      .map(([id]) => id)
    
    const missingCoverage = heatExchangers.filter(eq => {
      const scenarios = this.mockRiskScenarios[eq] || []
      return !scenarios.some(s => s.failure_mode.toLowerCase().includes(riskType.toLowerCase()))
    })
    
    const hasCoverage = heatExchangers.filter(eq => {
      const scenarios = this.mockRiskScenarios[eq] || []
      return scenarios.some(s => s.failure_mode.toLowerCase().includes(riskType.toLowerCase()))
    })
    
    const systemName = system === 'SYS-001' ? 'System A' : 'System B'
    
    if (isAskingForCovered) {
      // Return equipment that HAS coverage
      return {
        query,
        intent: 'COVERAGE_ANALYSIS',
        confidence: 0.92,
        results: hasCoverage.map(eq => ({
          equipment_id: eq,
          equipment_type: this.mockEquipmentData[eq].type,
          equipment_subtype: this.mockEquipmentData[eq].subtype,
          system: this.mockEquipmentData[eq].system,
          risk_coverage: `${riskType} blockage risk covered`,
          current_scenarios: (this.mockRiskScenarios[eq] || []).length,
          coverage_status: 'COVERED'
        })),
        summary: `Found ${hasCoverage.length} heat exchangers in ${systemName} that ARE covered for ${riskType} blockage risk in Equipment Strategy.`,
        recommendations: [
          `Equipment with ${riskType} risk coverage: ${hasCoverage.join(', ')}`,
          'Review effectiveness of existing mitigation measures',
          'Consider if additional monitoring is needed'
        ]
      }
    } else {
      // Return equipment that LACKS coverage (default behavior)
      return {
        query,
        intent: 'COVERAGE_ANALYSIS',
        confidence: 0.92,
        results: missingCoverage.map(eq => ({
          equipment_id: eq,
          equipment_type: this.mockEquipmentData[eq].type,
          equipment_subtype: this.mockEquipmentData[eq].subtype,
          system: this.mockEquipmentData[eq].system,
          missing_risk: `${riskType} blockage risk`,
          current_scenarios: (this.mockRiskScenarios[eq] || []).length,
          risk_gap: 'HIGH'
        })),
        summary: `Found ${missingCoverage.length} heat exchangers in ${systemName} that are NOT reflected in ES for ${riskType} blockage risk.`,
        recommendations: [
          `Add ${riskType} blockage failure mode to equipment: ${missingCoverage.join(', ')}`,
          'Conduct FMEA review for identified equipment',
          'Update risk assessment to include fouling scenarios',
          'Consider increased monitoring for affected equipment'
        ]
      }
    }
  }

  /**
   * Use Case 2: Mitigation Status Analysis  
   */
  private handleMitigationStatus(query: string, entities: any): AIQueryResponse {
    const equipment = entities.equipment || 'HX-101'
    const department = entities.department || 'REFINERY'
    
    // Check if query is in Japanese to provide appropriate response
    const isJapanese = /[ひらがなカタカナ漢字]/.test(query)
    
    const measures = this.mockMitigationMeasures[equipment] || []
    const departmentMeasures = measures.filter(m => 
      m.responsible_department.toLowerCase() === department.toLowerCase()
    )
    
    const implemented = departmentMeasures.filter(m => m.status === 'IMPLEMENTED')
    const planned = departmentMeasures.filter(m => m.status === 'PLANNED')
    const overdue = departmentMeasures.filter(m => m.status === 'OVERDUE')

    // Provide Japanese responses for Japanese queries
    const summary = isJapanese 
      ? `${equipment}について${department === 'REFINERY' ? '製油部門' : 'メンテナンス部門'}が担当するリスク緩和策は${departmentMeasures.length}件中${implemented.length}件が実施済みです。`
      : `${department} department has ${implemented.length}/${departmentMeasures.length} risk mitigation measures implemented for ${equipment}. ${planned.length} measures are planned to start soon.`

    return {
      query,
      intent: 'MITIGATION_STATUS', 
      confidence: 0.89,
      results: {
        equipment_id: equipment,
        department: department,
        total_measures: departmentMeasures.length,
        implemented: implemented.map(m => ({
          measure: isJapanese ? this.translateToJapanese(m.measure) : m.measure,
          responsible_person: m.responsible_person,
          frequency: m.frequency,
          last_execution: m.last_execution,
          status: 'ACTIVE'
        })),
        planned: planned.map(m => ({
          measure: isJapanese ? this.translateToJapanese(m.measure) : m.measure,
          responsible_person: m.responsible_person,
          planned_start: m.planned_start,
          status: 'PENDING_START'
        })),
        overdue: overdue.map(m => ({
          measure: isJapanese ? this.translateToJapanese(m.measure) : m.measure,
          responsible_person: m.responsible_person,
          days_overdue: 15, // Mock calculation
          status: 'REQUIRES_ATTENTION'
        }))
      },
      summary
    }
  }

  /**
   * Use Case 3: Instrument Impact Analysis
   */
  private handleImpactAnalysis(query: string, entities: any): AIQueryResponse {
    const instrument = entities.instrument || 'TI-201'
    const mapping = this.mockInstrumentMappings[instrument]
    
    if (!mapping) {
      return this.handleGenericQuery(query)
    }

    const affectedEquipment = mapping.equipment.map(eq => {
      const scenarios = this.mockRiskScenarios[eq] || []
      return {
        equipment_id: eq,
        equipment_type: this.mockEquipmentData[eq]?.type || 'UNKNOWN',
        system: this.mockEquipmentData[eq]?.system || 'UNKNOWN',
        risk_scenarios: scenarios,
        responsible_persons: [...new Set(scenarios.map(s => s.responsible_person))],
        immediate_actions: this.generateImmediateActions(eq, mapping.parameter)
      }
    })

    return {
      query,
      intent: 'IMPACT_ANALYSIS',
      confidence: 0.95,
      results: affectedEquipment,
      summary: `${instrument} parameter increase affects ${mapping.equipment.length} pieces of equipment across ${new Set(affectedEquipment.map(e => e.system)).size} systems. Total of ${affectedEquipment.reduce((sum, eq) => sum + eq.risk_scenarios.length, 0)} risk scenarios triggered.`,
      recommendations: [
        `Immediate inspection of equipment: ${mapping.equipment.join(', ')}`,
        'Check related process parameters for correlation',
        'Review recent maintenance activities on affected equipment', 
        'Consider temporary monitoring increase until root cause identified'
      ]
    }
  }

  /**
   * Enhanced intent detection supporting Japanese and English
   */
  private detectIntent(query: string): string {
    const q = query.toLowerCase()
    
    // Coverage Analysis - English and Japanese
    if (q.includes('coverage') || q.includes('reflected') || q.includes('es') || q.includes('fouling') ||
        q.includes('カバレッジ') || q.includes('反映') || q.includes('ファウリング')) {
      return 'COVERAGE_ANALYSIS'
    }
    
    // Mitigation Status - English and Japanese  
    if (q.includes('implementation') || q.includes('status') || q.includes('mitigation') || q.includes('responsible') ||
        q.includes('実施状況') || q.includes('実施') || q.includes('緩和策') || q.includes('担当') || 
        q.includes('タスク') || q.includes('点検') || q.includes('状況') || q.includes('部門')) {
      return 'MITIGATION_STATUS'  
    }
    
    // Impact Analysis - English and Japanese
    if (q.includes('ti-') || q.includes('pi-') || q.includes('fi-') || q.includes('increased') || q.includes('affected') ||
        q.includes('影響') || q.includes('温度') || q.includes('圧力') || q.includes('上昇') || q.includes('変化')) {
      return 'IMPACT_ANALYSIS'
    }
    
    return 'GENERIC'
  }

  /**
   * Extract entities from query (Enhanced for Japanese)
   */
  private extractEntities(query: string): any {
    const entities: any = {}
    
    // Extract instrument IDs
    const instrumentMatch = query.match(/(TI|PI|FI|LI)-\d+/i)
    if (instrumentMatch) {
      entities.instrument = instrumentMatch[0].toUpperCase()
    }
    
    // Extract equipment IDs (Enhanced)
    const equipmentMatch = query.match(/[EPT]-\d+/i)
    if (equipmentMatch) {
      entities.equipment = equipmentMatch[0].toUpperCase()
    }
    
    // Extract specific equipment mentioned in Japanese query
    if (query.includes('HX-101') || query.includes('熱交換器HX-101')) {
      entities.equipment = 'HX-101'
    }
    if (query.includes('HX-102') || query.includes('熱交換器HX-102')) {
      entities.equipment = 'HX-102'
    }
    if (query.includes('HX-103') || query.includes('熱交換器HX-103')) {
      entities.equipment = 'HX-103'
    }
    
    // Extract system references (Japanese and English)
    if (query.toLowerCase().includes('system a') || query.includes('システムA')) {
      entities.system = 'SYS-001'
    }
    if (query.toLowerCase().includes('system b') || query.includes('システムB')) {
      entities.system = 'SYS-002'
    }
    
    // Extract departments (Japanese and English)
    if (query.toLowerCase().includes('refinery') || query.includes('製油部門') || query.includes('製油')) {
      entities.department = 'REFINERY'
    }
    if (query.toLowerCase().includes('maintenance') || query.includes('メンテナンス部門') || query.includes('保全')) {
      entities.department = 'MAINTENANCE'
    }
    
    // Extract risk types (Japanese and English)
    if (query.toLowerCase().includes('fouling') || query.includes('ファウリング') || query.includes('汚れ')) {
      entities.risk_type = 'fouling'
    }
    
    return entities
  }

  private generateImmediateActions(equipment: string, parameter: string): string[] {
    return [
      `Check ${equipment} ${parameter.toLowerCase()} readings manually`,
      `Inspect ${equipment} for visible signs of distress`, 
      `Review ${equipment} maintenance history`,
      `Verify ${equipment} operating parameters within limits`
    ]
  }

  private translateToJapanese(measure: string): string {
    const translations: { [key: string]: string } = {
      'Daily temperature monitoring': '日常温度監視',
      'Weekly pressure drop check': '週次圧力低下確認',
      'Monthly tube cleaning': '月次チューブ清掃',
      'Visual inspection': '目視点検',
      'Parameter recording': 'パラメータ記録',
      'Equipment inspection': '設備点検'
    }
    
    return translations[measure] || measure
  }

  private handleGenericQuery(query: string): AIQueryResponse {
    return {
      query,
      intent: 'GENERIC',
      confidence: 0.1,
      results: [],
      summary: 'Query not recognized. Please try asking about equipment risk coverage, mitigation status, or instrument impact analysis.',
      execution_time: 0
    }
  }
}