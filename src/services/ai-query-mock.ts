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
  
  // Mock equipment data with classifications
  private mockEquipmentData = {
    'E-101': { type: 'HEAT_EXCHANGER', subtype: 'Shell-and-tube', system: 'SYS-001' },
    'E-102': { type: 'HEAT_EXCHANGER', subtype: 'Plate', system: 'SYS-001' },
    'E-103': { type: 'HEAT_EXCHANGER', subtype: 'Air-cooled', system: 'SYS-001' },
    'E-201': { type: 'HEAT_EXCHANGER', subtype: 'Shell-and-tube', system: 'SYS-002' },
    'P-101': { type: 'PUMP', subtype: 'Centrifugal', system: 'SYS-001' },
    'T-201': { type: 'TANK', subtype: 'Storage', system: 'SYS-002' }
  }

  // Mock instrument mappings
  private mockInstrumentMappings = {
    'TI-201': {
      equipment: ['E-201', 'E-202', 'P-201'],
      parameter: 'TEMPERATURE',
      criticality: 'HIGH'
    },
    'PI-101': {
      equipment: ['P-101', 'E-101'],
      parameter: 'PRESSURE', 
      criticality: 'MEDIUM'
    },
    'FI-301': {
      equipment: ['P-301', 'E-301'],
      parameter: 'FLOW',
      criticality: 'HIGH'
    }
  }

  // Mock risk scenarios
  private mockRiskScenarios = {
    'E-101': [
      {
        scenario_id: 'RS-E101-001',
        failure_mode: 'Tube fouling blockage',
        risk_level: 'HIGH',
        responsible_person: 'ST001',
        department: 'REFINERY',
        mitigation_status: 'IMPLEMENTED'
      },
      {
        scenario_id: 'RS-E101-002', 
        failure_mode: 'Corrosion leakage',
        risk_level: 'MEDIUM',
        responsible_person: 'ST002',
        department: 'MAINTENANCE',
        mitigation_status: 'PLANNED'
      }
    ],
    'E-102': [
      {
        scenario_id: 'RS-E102-001',
        failure_mode: 'Corrosion leakage', 
        risk_level: 'MEDIUM',
        responsible_person: 'ST001',
        department: 'REFINERY',
        mitigation_status: 'IMPLEMENTED'
      }
      // Note: Missing fouling scenario - will be detected by AI
    ],
    'E-103': [
      {
        scenario_id: 'RS-E103-001',
        failure_mode: 'Fan blade damage',
        risk_level: 'LOW',
        responsible_person: 'ST003', 
        department: 'MAINTENANCE',
        mitigation_status: 'IMPLEMENTED'
      }
      // Note: Missing fouling scenario - will be detected by AI
    ]
  }

  // Mock mitigation measures
  private mockMitigationMeasures = {
    'E-101': [
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
    const system = entities.system || 'SYS-001' // Default to System A
    const riskType = entities.risk_type || 'fouling'
    
    // Find heat exchangers in system that lack fouling risk scenarios
    const heatExchangers = Object.entries(this.mockEquipmentData)
      .filter(([id, data]) => data.type === 'HEAT_EXCHANGER' && data.system === system)
      .map(([id]) => id)
    
    const missingCoverage = heatExchangers.filter(eq => {
      const scenarios = this.mockRiskScenarios[eq] || []
      return !scenarios.some(s => s.failure_mode.toLowerCase().includes(riskType.toLowerCase()))
    })

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
      summary: `Found ${missingCoverage.length} heat exchangers in ${system} without ${riskType} blockage risk scenarios. This represents a significant coverage gap that should be addressed.`,
      recommendations: [
        `Add ${riskType} blockage failure mode to equipment: ${missingCoverage.join(', ')}`,
        'Conduct FMEA review for identified equipment',
        'Update risk assessment to include fouling scenarios',
        'Consider increased monitoring for affected equipment'
      ]
    }
  }

  /**
   * Use Case 2: Mitigation Status Analysis  
   */
  private handleMitigationStatus(query: string, entities: any): AIQueryResponse {
    const equipment = entities.equipment || 'E-101'
    const department = entities.department || 'REFINERY'
    
    const measures = this.mockMitigationMeasures[equipment] || []
    const departmentMeasures = measures.filter(m => 
      m.responsible_department.toLowerCase() === department.toLowerCase()
    )
    
    const implemented = departmentMeasures.filter(m => m.status === 'IMPLEMENTED')
    const planned = departmentMeasures.filter(m => m.status === 'PLANNED')
    const overdue = departmentMeasures.filter(m => m.status === 'OVERDUE')

    return {
      query,
      intent: 'MITIGATION_STATUS', 
      confidence: 0.89,
      results: {
        equipment_id: equipment,
        department: department,
        total_measures: departmentMeasures.length,
        implemented: implemented.map(m => ({
          measure: m.measure,
          responsible_person: m.responsible_person,
          frequency: m.frequency,
          last_execution: m.last_execution,
          status: 'ACTIVE'
        })),
        planned: planned.map(m => ({
          measure: m.measure,
          responsible_person: m.responsible_person,
          planned_start: m.planned_start,
          status: 'PENDING_START'
        })),
        overdue: overdue.map(m => ({
          measure: m.measure,
          responsible_person: m.responsible_person,
          days_overdue: 15, // Mock calculation
          status: 'REQUIRES_ATTENTION'
        }))
      },
      summary: `${department} department has ${implemented.length}/${departmentMeasures.length} risk mitigation measures implemented for ${equipment}. ${planned.length} measures are planned to start soon.`
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
   * Simple intent detection based on keywords
   */
  private detectIntent(query: string): string {
    const q = query.toLowerCase()
    
    if (q.includes('coverage') || q.includes('reflected') || q.includes('es') || q.includes('fouling')) {
      return 'COVERAGE_ANALYSIS'
    }
    if (q.includes('implementation') || q.includes('status') || q.includes('mitigation') || q.includes('responsible')) {
      return 'MITIGATION_STATUS'  
    }
    if (q.includes('ti-') || q.includes('pi-') || q.includes('fi-') || q.includes('increased') || q.includes('affected')) {
      return 'IMPACT_ANALYSIS'
    }
    return 'GENERIC'
  }

  /**
   * Extract entities from query
   */
  private extractEntities(query: string): any {
    const entities: any = {}
    
    // Extract instrument IDs
    const instrumentMatch = query.match(/(TI|PI|FI|LI)-\d+/i)
    if (instrumentMatch) {
      entities.instrument = instrumentMatch[0].toUpperCase()
    }
    
    // Extract equipment IDs  
    const equipmentMatch = query.match(/[EPT]-\d+/i)
    if (equipmentMatch) {
      entities.equipment = equipmentMatch[0].toUpperCase()
    }
    
    // Extract system references
    if (query.toLowerCase().includes('system a')) {
      entities.system = 'SYS-001'
    }
    
    // Extract departments
    if (query.toLowerCase().includes('refinery')) {
      entities.department = 'REFINERY'
    }
    if (query.toLowerCase().includes('maintenance')) {
      entities.department = 'MAINTENANCE'
    }
    
    // Extract risk types
    if (query.toLowerCase().includes('fouling')) {
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