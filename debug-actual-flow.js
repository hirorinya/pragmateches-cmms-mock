// Debug script to test the actual Enhanced AI Service response structure
// This will help identify exactly where the data gets lost

import { enhancedAIService } from './src/services/enhanced-ai-service.js'

async function debugActualFlow() {
  console.log('🔍 TESTING ACTUAL ENHANCED AI SERVICE FLOW')
  console.log('==========================================\n')
  
  try {
    // Test a risk assessment query
    const query = "What are the risk factors for equipment HX-101?"
    console.log('Query:', query)
    
    const response = await enhancedAIService.processQuery(query)
    
    console.log('\n=== ENHANCED AI SERVICE RESPONSE ===')
    console.log('Intent:', response.intent)
    console.log('Confidence:', response.confidence)
    console.log('Source:', response.source)
    console.log('Results type:', typeof response.results)
    console.log('Results is array:', Array.isArray(response.results))
    console.log('Results length:', response.results?.length)
    
    if (response.results && response.results.length > 0) {
      console.log('\n=== FIRST RESULT ANALYSIS ===')
      const firstResult = response.results[0]
      console.log('First result keys:', Object.keys(firstResult))
      console.log('Has equipment_id:', !!firstResult.equipment_id)
      console.log('Has risk_level:', !!firstResult.risk_level)
      console.log('Has risk_score:', !!firstResult.risk_score)
      console.log('Has risk_scenario:', !!firstResult.risk_scenario)
      console.log('Has risk_factors:', !!firstResult.risk_factors)
      console.log('Has mitigation_measures:', !!firstResult.mitigation_measures)
      
      console.log('\n=== FIRST RESULT SAMPLE ===')
      console.log(JSON.stringify(firstResult, null, 2))
    }
    
    console.log('\n=== SUMMARY ===')
    console.log('Summary length:', response.summary?.length)
    console.log('Summary preview:', response.summary?.substring(0, 200) + '...')
    
  } catch (error) {
    console.error('❌ Error testing enhanced AI service:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Run the debug
debugActualFlow()