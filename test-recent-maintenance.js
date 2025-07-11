#!/usr/bin/env node

/**
 * Test script to verify the recent maintenance equipment API endpoint
 * This script can be run to test the database query functionality
 */

const { getEquipmentWithRecentMaintenance } = require('./src/lib/database.ts')

async function testRecentMaintenance() {
  console.log('Testing recent maintenance equipment query...')
  console.log('='.repeat(50))
  
  try {
    // Test with different time periods
    const testPeriods = [365, 180, 90, 30]
    
    for (const days of testPeriods) {
      console.log(`\nTesting with ${days} days back:`)
      console.log('-'.repeat(30))
      
      const result = await getEquipmentWithRecentMaintenance(days)
      
      console.log(`Found ${result.equipment.length} equipment with maintenance`)
      console.log(`Total maintenance records: ${result.summary.totalMaintenanceRecords}`)
      console.log(`Cutoff date: ${result.summary.cutoffDate}`)
      
      // Show first 5 results
      console.log('\nTop 5 equipment by most recent maintenance:')
      result.equipment.slice(0, 5).forEach((eq, index) => {
        console.log(`${index + 1}. ${eq.設備名} (${eq.設備ID})`)
        console.log(`   最新メンテナンス: ${eq.最新メンテナンス日}`)
        console.log(`   メンテナンス回数: ${eq.メンテナンス回数}`)
        console.log(`   設置場所: ${eq.設置場所}`)
        console.log(`   稼働状態: ${eq.稼働状態}`)
        console.log('')
      })
    }
    
    console.log('\nTest completed successfully!')
    
  } catch (error) {
    console.error('Test failed:', error)
    process.exit(1)
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRecentMaintenance()
}

module.exports = { testRecentMaintenance }