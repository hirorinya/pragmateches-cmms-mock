// Test the AI Query Mock Service
console.log('🤖 Testing AI Assistant Mock Service\n');

// Mock the AIQueryMockService class inline for testing
class AIQueryMockService {
  constructor() {
    this.mockEquipmentData = {
      'HX-101': { type: 'HEAT_EXCHANGER', subtype: 'Shell-and-tube', system: 'SYS-001' },
      'HX-102': { type: 'HEAT_EXCHANGER', subtype: 'Plate', system: 'SYS-001' },
      'HX-103': { type: 'HEAT_EXCHANGER', subtype: 'Air-cooled', system: 'SYS-001' },
      'HX-201': { type: 'HEAT_EXCHANGER', subtype: 'Shell-and-tube', system: 'SYS-002' },
    };

    this.mockInstrumentMappings = {
      'TI-201': {
        equipment: ['E-201', 'E-202', 'P-201'],
        parameter: 'TEMPERATURE',
        criticality: 'HIGH'
      }
    };

    this.mockRiskScenarios = {
      'HX-101': [
        {
          scenario_id: 'RS-HX101-001',
          failure_mode: 'Tube fouling blockage',
          risk_level: 'HIGH'
        }
      ],
      'HX-102': [
        {
          scenario_id: 'RS-HX102-001',
          failure_mode: 'Corrosion leakage', 
          risk_level: 'MEDIUM'
        }
      ]
    };
  }

  async processQuery(query) {
    const startTime = Date.now();
    const intent = this.detectIntent(query);
    const entities = this.extractEntities(query);
    
    let response;
    
    switch (intent) {
      case 'COVERAGE_ANALYSIS':
        response = this.handleCoverageAnalysis(query, entities);
        break;
      case 'MITIGATION_STATUS':
        response = this.handleMitigationStatus(query, entities);
        break;
      case 'IMPACT_ANALYSIS':
        response = this.handleImpactAnalysis(query, entities);
        break;
      default:
        response = this.handleGenericQuery(query);
    }
    
    response.execution_time = Date.now() - startTime;
    return response;
  }

  detectIntent(query) {
    const q = query.toLowerCase();
    
    // Mitigation Status - Check first to avoid conflicts
    if (q.includes('implementation') || q.includes('mitigation') || q.includes('responsible') ||
        (q.includes('status') && (q.includes('mitigation') || q.includes('implementation') || q.includes('measure')))) {
      return 'MITIGATION_STATUS';  
    }
    // Coverage Analysis - More specific ES matching
    if (q.includes('coverage') || q.includes('reflected') || q.includes(' es ') || q.includes('es for') || q.includes('fouling')) {
      return 'COVERAGE_ANALYSIS';
    }
    if (q.includes('ti-') || q.includes('pi-') || q.includes('fi-') || q.includes('increased') || q.includes('affected')) {
      return 'IMPACT_ANALYSIS';
    }
    return 'GENERIC';
  }

  // Map equipment IDs between different formats
  mapEquipmentId(equipmentId) {
    const mapping = {
      'E-101': 'HX-101',
      'E-102': 'HX-102', 
      'E-103': 'HX-103',
      'P-100': 'PU-100',
      'T-101': 'TK-101'
    };
    return mapping[equipmentId] || equipmentId;
  }

  extractEntities(query) {
    const entities = {};
    
    const instrumentMatch = query.match(/(TI|PI|FI|LI)-\d+/i);
    if (instrumentMatch) {
      entities.instrument = instrumentMatch[0].toUpperCase();
    }
    
    const equipmentMatch = query.match(/[EPT]-\d+/i);
    if (equipmentMatch) {
      const rawEquipmentId = equipmentMatch[0].toUpperCase();
      entities.equipment = this.mapEquipmentId(rawEquipmentId);
    }
    
    if (query.toLowerCase().includes('system a')) {
      entities.system = 'SYS-001';
    }
    
    if (query.toLowerCase().includes('refinery')) {
      entities.department = 'REFINERY';
    }
    
    if (query.toLowerCase().includes('fouling')) {
      entities.risk_type = 'fouling';
    }
    
    return entities;
  }

  handleCoverageAnalysis(query, entities) {
    const system = entities.system || 'SYS-001';
    const riskType = entities.risk_type || 'fouling';
    
    const heatExchangers = Object.entries(this.mockEquipmentData)
      .filter(([id, data]) => data.type === 'HEAT_EXCHANGER' && data.system === system)
      .map(([id]) => id);
    
    const missingCoverage = heatExchangers.filter(eq => {
      const scenarios = this.mockRiskScenarios[eq] || [];
      return !scenarios.some(s => s.failure_mode.toLowerCase().includes(riskType.toLowerCase()));
    });

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
      summary: `Found ${missingCoverage.length} heat exchangers in ${system} without ${riskType} blockage risk scenarios.`,
      recommendations: [
        `Add ${riskType} blockage failure mode to equipment: ${missingCoverage.join(', ')}`,
        'Conduct FMEA review for identified equipment'
      ]
    };
  }

  handleMitigationStatus(query, entities) {
    const equipment = entities.equipment || 'HX-101';
    const department = entities.department || 'REFINERY';
    
    // Mock mitigation measures for HX-101
    const mockMeasures = {
      'HX-101': [
        { measure: 'Daily temperature monitoring', responsible_person: 'ST001', department: 'REFINERY', status: 'IMPLEMENTED' },
        { measure: 'Weekly pressure drop check', responsible_person: 'ST001', department: 'REFINERY', status: 'IMPLEMENTED' },
        { measure: 'Monthly tube cleaning', responsible_person: 'ST002', department: 'MAINTENANCE', status: 'PLANNED', planned_start: '2025-08-01' }
      ]
    };
    
    const measures = mockMeasures[equipment] || [];
    const departmentMeasures = measures.filter(m => m.department === department);
    const implemented = departmentMeasures.filter(m => m.status === 'IMPLEMENTED');
    const planned = departmentMeasures.filter(m => m.status === 'PLANNED');
    
    return {
      query,
      intent: 'MITIGATION_STATUS',
      confidence: 0.89,
      results: {
        equipment_id: equipment,
        department: department,
        total_measures: departmentMeasures.length,
        implemented: implemented,
        planned: planned
      },
      summary: `${department} department has ${implemented.length}/${departmentMeasures.length} risk mitigation measures implemented for ${equipment}.`
    };
  }

  handleImpactAnalysis(query, entities) {
    const instrument = entities.instrument || 'TI-201';
    const mapping = this.mockInstrumentMappings[instrument];
    
    if (!mapping) {
      return this.handleGenericQuery(query);
    }

    const affectedEquipment = mapping.equipment.map(eq => ({
      equipment_id: eq,
      equipment_type: this.mockEquipmentData[eq]?.type || 'UNKNOWN',
      system: this.mockEquipmentData[eq]?.system || 'UNKNOWN',
      risk_scenarios: this.mockRiskScenarios[eq] || [],
      immediate_actions: [`Check ${eq} temperature readings manually`]
    }));

    return {
      query,
      intent: 'IMPACT_ANALYSIS',
      confidence: 0.95,
      results: affectedEquipment,
      summary: `${instrument} parameter increase affects ${mapping.equipment.length} pieces of equipment.`,
      recommendations: [
        `Immediate inspection of equipment: ${mapping.equipment.join(', ')}`,
        'Check related process parameters for correlation'
      ]
    };
  }

  handleGenericQuery(query) {
    return {
      query,
      intent: 'GENERIC',
      confidence: 0.1,
      results: [],
      summary: 'Query not recognized. Please try asking about equipment risk coverage, mitigation status, or instrument impact analysis.',
      execution_time: 0
    };
  }
}

// Run tests
async function runTests() {
  const aiService = new AIQueryMockService();
  
  const testCases = [
    {
      name: 'Risk Coverage Analysis',
      query: 'Which heat exchangers in System A are not reflected in ES for fouling blockage risk?'
    },
    {
      name: 'Mitigation Status',
      query: 'What is the implementation status of risk mitigation measures for E-101 by the refinery department?'
    },
    {
      name: 'Impact Analysis',
      query: 'If TI-201 temperature increased, which equipment would be affected and what actions are needed?'
    },
    {
      name: 'Generic Query',
      query: 'What is the weather today?'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`Query: "${testCase.query}"`);
    
    try {
      const response = await aiService.processQuery(testCase.query);
      console.log(`✅ Intent: ${response.intent}`);
      console.log(`✅ Confidence: ${response.confidence}`);
      console.log(`✅ Summary: ${response.summary}`);
      console.log(`✅ Results: ${Array.isArray(response.results) ? response.results.length + ' items' : 'Object'}`);
      console.log(`✅ Execution: ${response.execution_time}ms`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🎉 All tests completed!');
}

runTests();