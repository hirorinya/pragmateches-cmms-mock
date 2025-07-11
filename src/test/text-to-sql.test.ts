/**
 * Test file for text-to-SQL functionality
 * Validates all high-priority functions are working correctly
 */

import { textToSQLService } from '@/services/text-to-sql-service'
import { schemaContextService } from '@/services/schema-context-service'
import { fewShotLearningService } from '@/services/few-shot-learning-service'
import { queryValidationService } from '@/services/query-validation-service'
import { entityResolutionService } from '@/services/entity-resolution-service'

// Test cases for comprehensive validation
export const textToSQLTestCases = {
  // 1. Complex Aggregation Queries
  aggregationQueries: [
    {
      query: "What's the average maintenance cost for heat exchangers in the last 6 months?",
      expectedIntent: "cost_analysis",
      expectedTables: ["maintenance_history", "equipment", "equipment_type_master"],
      expectedFeatures: ["AVG function", "date filtering", "equipment type filtering"]
    },
    {
      query: "Show me total maintenance costs by equipment type",
      expectedIntent: "cost_analysis",
      expectedTables: ["maintenance_history", "equipment", "equipment_type_master"],
      expectedFeatures: ["SUM function", "GROUP BY", "JOIN operations"]
    },
    {
      query: "Count maintenance activities per month for all pumps",
      expectedIntent: "maintenance_frequency",
      expectedTables: ["maintenance_history", "equipment", "equipment_type_master"],
      expectedFeatures: ["COUNT function", "DATE_TRUNC", "GROUP BY month"]
    }
  ],

  // 2. Time-based Queries
  timeBasedQueries: [
    {
      query: "Show me maintenance history for the last 30 days",
      expectedIntent: "maintenance_history",
      expectedTables: ["maintenance_history", "equipment"],
      expectedFeatures: ["date arithmetic", "ORDER BY date"]
    },
    {
      query: "What equipment was serviced yesterday?",
      expectedIntent: "maintenance_history",
      expectedTables: ["maintenance_history", "equipment"],
      expectedFeatures: ["specific date filtering", "yesterday calculation"]
    },
    {
      query: "List all maintenance activities between January and March 2024",
      expectedIntent: "maintenance_history",
      expectedTables: ["maintenance_history", "equipment"],
      expectedFeatures: ["date range filtering", "BETWEEN operator"]
    }
  ],

  // 3. Equipment-specific Queries
  equipmentQueries: [
    {
      query: "Tell me about equipment HX-101",
      expectedIntent: "equipment_info",
      expectedTables: ["equipment", "equipment_type_master"],
      expectedFeatures: ["specific equipment ID", "JOIN for type info"]
    },
    {
      query: "What are the risk factors for equipment HX-101?",
      expectedIntent: "risk_analysis",
      expectedTables: ["equipment_risk_assessment"],
      expectedFeatures: ["risk data retrieval", "equipment filtering"]
    },
    {
      query: "Show me thickness measurements for TK-101",
      expectedIntent: "thickness_analysis",
      expectedTables: ["thickness_measurement"],
      expectedFeatures: ["thickness data", "equipment filtering", "ORDER BY date"]
    }
  ],

  // 4. Multi-table Join Queries
  joinQueries: [
    {
      query: "Show me equipment with both high risk and recent maintenance",
      expectedIntent: "risk_maintenance_correlation",
      expectedTables: ["equipment", "equipment_risk_assessment", "maintenance_history"],
      expectedFeatures: ["multiple JOINs", "complex WHERE clause", "subquery"]
    },
    {
      query: "List all heat exchangers with their maintenance costs and risk scores",
      expectedIntent: "comprehensive_analysis",
      expectedTables: ["equipment", "equipment_type_master", "maintenance_history", "equipment_risk_assessment"],
      expectedFeatures: ["multiple LEFT JOINs", "aggregation", "equipment type filtering"]
    },
    {
      query: "Which equipment in the process area has high risk scores?",
      expectedIntent: "location_risk_analysis",
      expectedTables: ["equipment", "equipment_risk_assessment"],
      expectedFeatures: ["location filtering", "risk threshold", "JOIN operation"]
    }
  ],

  // 5. Error Handling Test Cases
  errorCases: [
    {
      query: "DROP TABLE equipment",
      expectedError: "security",
      expectedMessage: "Only SELECT queries are allowed"
    },
    {
      query: "Show me data from non_existent_table",
      expectedError: "schema",
      expectedMessage: "Table 'non_existent_table' does not exist"
    },
    {
      query: "'; DELETE FROM equipment; --",
      expectedError: "security",
      expectedMessage: "SQL injection pattern detected"
    }
  ]
}

// Test runner function
export async function runTextToSQLTests() {
  console.log("=== Text-to-SQL Comprehensive Test Suite ===\n")
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  }

  // Test 1: Schema Context Service
  console.log("1. Testing Schema Context Service...")
  try {
    const schemaContext = await schemaContextService.getSchemaContext()
    if (schemaContext.tables.length > 0 && schemaContext.entity_mappings.length > 0) {
      console.log("✅ Schema context loaded successfully")
      console.log(`   - ${schemaContext.tables.length} tables`)
      console.log(`   - ${schemaContext.entity_mappings.length} entity mappings`)
      console.log(`   - ${schemaContext.business_glossary.length} business terms`)
      results.passed++
    } else {
      throw new Error("Schema context incomplete")
    }
  } catch (error) {
    console.log("❌ Schema context test failed:", error.message)
    results.failed++
    results.errors.push({ test: "Schema Context", error: error.message })
  }

  // Test 2: Few-Shot Learning Service
  console.log("\n2. Testing Few-Shot Learning Service...")
  try {
    const examples = fewShotLearningService.getFewShotExamples("Show me maintenance history", 3)
    if (examples.length > 0) {
      console.log("✅ Few-shot examples retrieved successfully")
      console.log(`   - ${examples.length} relevant examples found`)
      console.log(`   - Categories: ${examples.map(e => e.category).join(", ")}`)
      results.passed++
    } else {
      throw new Error("No few-shot examples found")
    }
  } catch (error) {
    console.log("❌ Few-shot learning test failed:", error.message)
    results.failed++
    results.errors.push({ test: "Few-Shot Learning", error: error.message })
  }

  // Test 3: Entity Resolution Service
  console.log("\n3. Testing Entity Resolution Service...")
  try {
    const testQuery = "Show me equipment HX-101 maintenance in the last 30 days"
    const entities = await entityResolutionService.extractAndResolveEntities(testQuery)
    
    if (entities.entities.length > 0) {
      console.log("✅ Entity resolution successful")
      entities.entities.forEach(entity => {
        console.log(`   - ${entity.type}: "${entity.original}" → "${entity.resolved}" (${entity.confidence})`)
      })
      results.passed++
    } else {
      throw new Error("No entities resolved")
    }
  } catch (error) {
    console.log("❌ Entity resolution test failed:", error.message)
    results.failed++
    results.errors.push({ test: "Entity Resolution", error: error.message })
  }

  // Test 4: Query Validation Service
  console.log("\n4. Testing Query Validation Service...")
  try {
    // Test valid query
    const validSQL = "SELECT * FROM equipment WHERE 設備ID = 'HX-101'"
    const validation = await queryValidationService.validateQuery(validSQL)
    
    if (validation.isValid) {
      console.log("✅ Query validation working correctly")
      console.log(`   - Valid query passed validation`)
    }
    
    // Test malicious query
    const maliciousSQL = "DROP TABLE equipment"
    const maliciousValidation = await queryValidationService.validateQuery(maliciousSQL)
    
    if (!maliciousValidation.isValid && maliciousValidation.errors.some(e => e.type === 'security')) {
      console.log(`   - Malicious query blocked successfully`)
      results.passed++
    } else {
      throw new Error("Security validation failed")
    }
  } catch (error) {
    console.log("❌ Query validation test failed:", error.message)
    results.failed++
    results.errors.push({ test: "Query Validation", error: error.message })
  }

  // Test 5: Text-to-SQL Integration
  console.log("\n5. Testing Text-to-SQL Integration...")
  try {
    const testQuery = "Show me all heat exchangers"
    const result = await textToSQLService.convertTextToSQL({
      natural_language: testQuery,
      max_results: 10
    })
    
    if (result.sql && result.confidence > 0) {
      console.log("✅ Text-to-SQL conversion successful")
      console.log(`   - Query: "${testQuery}"`)
      console.log(`   - Generated SQL: ${result.sql.substring(0, 100)}...`)
      console.log(`   - Confidence: ${result.confidence}`)
      console.log(`   - Processing time: ${result.processing_time}ms`)
      results.passed++
    } else {
      throw new Error("SQL generation failed")
    }
  } catch (error) {
    console.log("❌ Text-to-SQL integration test failed:", error.message)
    results.failed++
    results.errors.push({ test: "Text-to-SQL Integration", error: error.message })
  }

  // Summary
  console.log("\n=== Test Summary ===")
  console.log(`Total Tests: ${results.passed + results.failed}`)
  console.log(`Passed: ${results.passed}`)
  console.log(`Failed: ${results.failed}`)
  
  if (results.errors.length > 0) {
    console.log("\nErrors:")
    results.errors.forEach(err => {
      console.log(`  - ${err.test}: ${err.error}`)
    })
  }
  
  return results
}

// Manual test function for specific queries
export async function testSpecificQuery(query: string) {
  console.log(`\n=== Testing Query: "${query}" ===`)
  
  try {
    // 1. Entity Resolution
    const entities = await entityResolutionService.extractAndResolveEntities(query)
    console.log("\nEntities:")
    entities.entities.forEach(e => {
      console.log(`  - ${e.type}: ${e.original} → ${e.resolved}`)
    })
    
    // 2. Schema Context
    const relevantTables = await schemaContextService.getRelevantTables(query)
    console.log("\nRelevant Tables:")
    relevantTables.forEach(t => {
      console.log(`  - ${t.table_name}: ${t.description}`)
    })
    
    // 3. Few-Shot Examples
    const examples = fewShotLearningService.getFewShotExamples(query, 2)
    console.log("\nRelevant Examples:")
    examples.forEach(e => {
      console.log(`  - ${e.natural_language}`)
    })
    
    // 4. SQL Generation
    const result = await textToSQLService.convertTextToSQL({
      natural_language: query,
      max_results: 50
    })
    
    console.log("\nGenerated SQL:")
    console.log(result.sql)
    console.log(`\nConfidence: ${result.confidence}`)
    console.log(`Processing Time: ${result.processing_time}ms`)
    
    if (result.validation_result) {
      console.log("\nValidation:")
      console.log(`  - Valid: ${result.validation_result.isValid}`)
      if (result.validation_result.errors.length > 0) {
        console.log("  - Errors:", result.validation_result.errors)
      }
      if (result.validation_result.warnings.length > 0) {
        console.log("  - Warnings:", result.validation_result.warnings)
      }
    }
    
    return result
    
  } catch (error) {
    console.error("Test failed:", error)
    return null
  }
}

// Export test utilities
export const textToSQLTestUtils = {
  runAllTests: runTextToSQLTests,
  testQuery: testSpecificQuery,
  testCases: textToSQLTestCases
}