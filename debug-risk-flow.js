// Debug script to trace risk assessment data flow
// This simulates the exact data flow from Enhanced AI Service to Dashboard

// Simulated response from handleRiskAssessment method (lines 1196-1353 in enhanced-ai-service.ts)
const mockRiskAssessmentResponse = {
  query: "What are the risk factors for equipment HX-101?",
  intent: 'RISK_ASSESSMENT',
  confidence: 0.9,
  results: [
    {
      equipment_id: 'HX-101',
      equipment_name: 'Heat Exchanger Unit 101',
      equipment_type: '静機器',
      risk_level: 'HIGH',
      risk_score: 85,
      risk_scenario: 'Tube fouling leading to reduced heat transfer',
      risk_scenario_standardized: 'ファウリング',
      risk_scenario_english: 'Fouling',
      scenario_description: 'Fouling of heat exchanger tubes',
      risk_factor: 'High temperature differential, poor water quality',
      risk_factors: 'High temperature differential, poor water quality',
      impact_rank: 4,
      reliability_rank: 3,
      likelihood_score: 4,
      consequence_score: 4,
      mitigation_measures: 'Regular cleaning, water treatment improvement',
      impact: 4,
      mitigation: 'Regular cleaning, water treatment improvement'
    }
  ],
  summary: "Risk Assessment Analysis (Real Database Data):\n\nFound 1 risk assessment:\n\n1. Heat Exchanger Unit 101 (HX-101)\n   Equipment Type: 静機器\n   Risk Level: HIGH (Score: 85)\n   ...",
  recommendations: ["1 equipment items have HIGH risk levels - immediate attention required"],
  execution_time: 150,
  source: 'ai',
  context: {}
}

// Simulate the formatAIResponse function (lines 167-442 in page.tsx)
function simulateFormatAIResponse(response) {
  console.log('=== STEP 1: Parse Response ===')
  let parsedResponse = response
  console.log('Parsed response intent:', parsedResponse.intent)
  console.log('Parsed response results length:', parsedResponse.results?.length)
  
  // Check if summary is string (line 180-183)
  if (typeof parsedResponse.summary !== 'string') {
    console.error('ERROR: Malformed AI response - summary not string')
    return `## Response Processing Error\n\nReceived incomplete response from AI service.`
  }
  
  let formatted = `## ${parsedResponse.summary}\n\n`
  
  console.log('\n=== STEP 2: Check Results Processing ===')
  
  // Key condition check (line 218)
  const hasResults = parsedResponse.results && 
    (Array.isArray(parsedResponse.results) ? parsedResponse.results.length > 0 : Object.keys(parsedResponse.results).length > 0)
  
  console.log('Has results:', hasResults)
  console.log('Results is array:', Array.isArray(parsedResponse.results))
  console.log('Results length:', parsedResponse.results?.length)
  
  if (hasResults) {
    formatted += `### 📊 Analysis Results\n\n`
    
    // Convert to array (lines 221-222)
    let uniqueResults = Array.isArray(parsedResponse.results) ? parsedResponse.results : [parsedResponse.results]
    
    console.log('\n=== STEP 3: Debug Results Structure ===')
    console.log('First result keys:', Object.keys(uniqueResults[0] || {}))
    console.log('First result sample:', uniqueResults[0])
    console.log('Has risk_level?', !!uniqueResults[0]?.risk_level)
    console.log('Has risk_score?', !!uniqueResults[0]?.risk_score)
    
    console.log('\n=== STEP 4: Duplicate Removal Check ===')
    // Duplicate removal condition (line 231)
    const shouldRemoveDuplicates = uniqueResults.length > 0 && 
      !uniqueResults[0]?.risk_level && 
      !uniqueResults[0]?.risk_score && 
      !uniqueResults[0]?.strategy_id
    
    console.log('Should remove duplicates:', shouldRemoveDuplicates)
    console.log('  - Has risk_level:', !!uniqueResults[0]?.risk_level)
    console.log('  - Has risk_score:', !!uniqueResults[0]?.risk_score)
    console.log('  - Has strategy_id:', !!uniqueResults[0]?.strategy_id)
    
    if (shouldRemoveDuplicates) {
      console.log('⚠️  REMOVING DUPLICATES - This might affect risk data!')
      // Simulated DatabaseBridge.removeDuplicateEquipment would run here
    } else {
      console.log('✅ Not removing duplicates - risk data preserved')
    }
    
    console.log('\n=== STEP 5: Format Detection ===')
    
    // Check for coverage analysis format (line 235)
    const isCoverageFormat = Array.isArray(uniqueResults) && 
      uniqueResults[0]?.equipment_id && 
      (uniqueResults[0]?.missing_risk || uniqueResults[0]?.risk_coverage)
    console.log('Is coverage format:', isCoverageFormat)
    
    // Check for mitigation status format (line 252)
    const isMitigationFormat = uniqueResults[0]?.equipment_id && 
      (uniqueResults[0]?.total_measures !== undefined || uniqueResults[0]?.implemented || uniqueResults[0]?.planned)
    console.log('Is mitigation format:', isMitigationFormat)
    
    // Check for impact analysis format (line 274)
    const isImpactFormat = Array.isArray(uniqueResults) && uniqueResults[0]?.impact_level
    console.log('Is impact format:', isImpactFormat)
    
    // Check for equipment info format (line 289)
    const isEquipmentFormat = uniqueResults.length > 0 && uniqueResults[0]?.equipment_id
    console.log('Is equipment format:', isEquipmentFormat)
    
    // Check for RISK ASSESSMENT format (lines 301-303) - THIS IS THE KEY!
    const isRiskFormat = uniqueResults.length > 0 && 
      (uniqueResults[0]?.risk_level || uniqueResults[0]?.risk_score || uniqueResults[0]?.risk_scenario || 
       uniqueResults[0]?.risk_factors || uniqueResults[0]?.impact_rank || uniqueResults[0]?.mitigation_measures)
    
    console.log('Is risk format:', isRiskFormat)
    console.log('  - Has risk_level:', !!uniqueResults[0]?.risk_level)
    console.log('  - Has risk_score:', !!uniqueResults[0]?.risk_score)
    console.log('  - Has risk_scenario:', !!uniqueResults[0]?.risk_scenario)
    console.log('  - Has risk_factors:', !!uniqueResults[0]?.risk_factors)
    console.log('  - Has impact_rank:', !!uniqueResults[0]?.impact_rank)
    console.log('  - Has mitigation_measures:', !!uniqueResults[0]?.mitigation_measures)
    
    if (isRiskFormat) {
      console.log('\n✅ RISK FORMAT DETECTED - Will show comprehensive risk details')
      formatted += '**Risk assessment formatting would happen here**\n'
      // The actual risk formatting code from lines 305-346 would run
    } else if (isEquipmentFormat) {
      console.log('\n⚠️  EQUIPMENT FORMAT DETECTED - Will show basic equipment info only')
      formatted += '**Basic equipment formatting would happen here**\n'
    } else {
      console.log('\n❌ GENERIC FORMAT - Fallback formatting')
      formatted += '**Generic formatting would happen here**\n'
    }
  }
  
  return formatted
}

console.log('🔍 DEBUGGING RISK ASSESSMENT DATA FLOW')
console.log('=====================================\n')

const result = simulateFormatAIResponse(mockRiskAssessmentResponse)
console.log('\n=== FINAL OUTPUT ===')
console.log(result)