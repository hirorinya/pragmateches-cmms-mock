// Simple test script for AI Assistant functionality
const { AIQueryMockService } = require('./src/services/ai-query-mock.ts');

async function testAIAssistant() {
  const aiService = new AIQueryMockService();
  
  console.log('🤖 Testing AI Assistant Mock Service\n');
  
  // Test Case 1: Risk Coverage Analysis
  console.log('Test 1: Risk Coverage Analysis');
  console.log('Query: "Which heat exchangers in System A are not reflected in ES for fouling blockage risk?"');
  try {
    const response1 = await aiService.processQuery('Which heat exchangers in System A are not reflected in ES for fouling blockage risk?');
    console.log('✅ Intent:', response1.intent);
    console.log('✅ Confidence:', response1.confidence);
    console.log('✅ Results count:', response1.results.length);
    console.log('✅ Summary:', response1.summary);
    console.log('✅ Execution time:', response1.execution_time + 'ms\n');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test Case 2: Mitigation Status
  console.log('Test 2: Mitigation Status Analysis');
  console.log('Query: "What is the implementation status of risk mitigation measures for E-101 by the refinery department?"');
  try {
    const response2 = await aiService.processQuery('What is the implementation status of risk mitigation measures for E-101 by the refinery department?');
    console.log('✅ Intent:', response2.intent);
    console.log('✅ Confidence:', response2.confidence);
    console.log('✅ Equipment:', response2.results.equipment_id);
    console.log('✅ Department:', response2.results.department);
    console.log('✅ Total measures:', response2.results.total_measures);
    console.log('✅ Execution time:', response2.execution_time + 'ms\n');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test Case 3: Impact Analysis
  console.log('Test 3: Instrument Impact Analysis');
  console.log('Query: "If TI-201 temperature increased, which equipment would be affected and what actions are needed?"');
  try {
    const response3 = await aiService.processQuery('If TI-201 temperature increased, which equipment would be affected and what actions are needed?');
    console.log('✅ Intent:', response3.intent);
    console.log('✅ Confidence:', response3.confidence);
    console.log('✅ Affected equipment count:', response3.results.length);
    console.log('✅ Summary:', response3.summary);
    console.log('✅ Execution time:', response3.execution_time + 'ms\n');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test Case 4: Generic Query
  console.log('Test 4: Generic Query');
  console.log('Query: "What is the weather today?"');
  try {
    const response4 = await aiService.processQuery('What is the weather today?');
    console.log('✅ Intent:', response4.intent);
    console.log('✅ Confidence:', response4.confidence);
    console.log('✅ Summary:', response4.summary);
    console.log('✅ Execution time:', response4.execution_time + 'ms\n');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('🎉 AI Assistant testing complete!');
}

testAIAssistant();