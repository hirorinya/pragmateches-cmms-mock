/**
 * Orphaned Records Cleanup Service
 * Safely removes orphaned records from maintenance_history and process_parameters
 */

import { supabase } from '@/lib/supabase'

export interface CleanupResult {
  success: boolean
  deletedMaintenanceRecords: number
  deletedProcessParameters: number
  addedSystemMappings: number
  errors: string[]
  details: {
    orphanedMaintenanceIds: string[]
    orphanedParameterIds: string[]
    unmappedEquipmentIds: string[]
  }
}

export class OrphanedRecordsCleanupService {
  
  /**
   * Analyze orphaned records before cleanup
   */
  async analyzeOrphanedRecords(): Promise<{
    orphanedMaintenance: any[]
    orphanedParameters: any[]
    unmappedEquipment: any[]
  }> {
    console.log('🔍 Analyzing orphaned records...')
    
    // Get valid equipment IDs
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('設備ID')
    
    if (equipmentError) throw equipmentError
    
    const validEquipmentIds = equipment.map(e => e.設備ID)
    
    // Find orphaned maintenance records
    const { data: allMaintenance, error: maintenanceError } = await supabase
      .from('maintenance_history')
      .select('履歴ID, 設備ID, 実施日, 作業内容')
    
    if (maintenanceError) throw maintenanceError
    
    const orphanedMaintenance = allMaintenance.filter(
      record => !validEquipmentIds.includes(record.設備ID)
    )
    
    // Find orphaned process parameters
    const { data: allParameters, error: parametersError } = await supabase
      .from('process_parameters')
      .select('parameter_id, parameter_name, equipment_id, tag_name')
    
    if (parametersError) throw parametersError
    
    const orphanedParameters = allParameters.filter(
      param => !validEquipmentIds.includes(param.equipment_id)
    )
    
    // Find equipment without system mappings
    const { data: allMappings, error: mappingsError } = await supabase
      .from('equipment_system_mapping')
      .select('equipment_id')
    
    if (mappingsError) throw mappingsError
    
    const mappedEquipmentIds = allMappings.map(m => m.equipment_id)
    const unmappedEquipment = equipment.filter(
      e => !mappedEquipmentIds.includes(e.設備ID)
    )
    
    console.log(`📊 Analysis Results:`)
    console.log(`   - Orphaned maintenance records: ${orphanedMaintenance.length}`)
    console.log(`   - Orphaned process parameters: ${orphanedParameters.length}`)
    console.log(`   - Equipment without system mappings: ${unmappedEquipment.length}`)
    
    return {
      orphanedMaintenance,
      orphanedParameters,
      unmappedEquipment
    }
  }
  
  /**
   * Perform safe cleanup of orphaned records
   */
  async cleanupOrphanedRecords(): Promise<CleanupResult> {
    const result: CleanupResult = {
      success: false,
      deletedMaintenanceRecords: 0,
      deletedProcessParameters: 0,
      addedSystemMappings: 0,
      errors: [],
      details: {
        orphanedMaintenanceIds: [],
        orphanedParameterIds: [],
        unmappedEquipmentIds: []
      }
    }
    
    try {
      console.log('🧹 Starting orphaned records cleanup...')
      
      // First analyze what we'll be cleaning
      const analysis = await this.analyzeOrphanedRecords()
      
      // Store details for result
      result.details.orphanedMaintenanceIds = analysis.orphanedMaintenance.map(m => m.履歴ID)
      result.details.orphanedParameterIds = analysis.orphanedParameters.map(p => p.parameter_id)
      result.details.unmappedEquipmentIds = analysis.unmappedEquipment.map(e => e.設備ID)
      
      // Cleanup orphaned maintenance records
      if (analysis.orphanedMaintenance.length > 0) {
        console.log(`🗑️  Deleting ${analysis.orphanedMaintenance.length} orphaned maintenance records...`)
        
        const maintenanceIds = analysis.orphanedMaintenance.map(m => m.履歴ID)
        const { error: maintenanceDeleteError } = await supabase
          .from('maintenance_history')
          .delete()
          .in('履歴ID', maintenanceIds)
        
        if (maintenanceDeleteError) {
          result.errors.push(`Failed to delete maintenance records: ${maintenanceDeleteError.message}`)
        } else {
          result.deletedMaintenanceRecords = analysis.orphanedMaintenance.length
          console.log(`✅ Deleted ${result.deletedMaintenanceRecords} orphaned maintenance records`)
        }
      }
      
      // Cleanup orphaned process parameters
      if (analysis.orphanedParameters.length > 0) {
        console.log(`🗑️  Deleting ${analysis.orphanedParameters.length} orphaned process parameters...`)
        
        const parameterIds = analysis.orphanedParameters.map(p => p.parameter_id)
        const { error: parametersDeleteError } = await supabase
          .from('process_parameters')
          .delete()
          .in('parameter_id', parameterIds)
        
        if (parametersDeleteError) {
          result.errors.push(`Failed to delete process parameters: ${parametersDeleteError.message}`)
        } else {
          result.deletedProcessParameters = analysis.orphanedParameters.length
          console.log(`✅ Deleted ${result.deletedProcessParameters} orphaned process parameters`)
        }
      }
      
      // Add missing system mappings
      if (analysis.unmappedEquipment.length > 0) {
        console.log(`🔗 Adding system mappings for ${analysis.unmappedEquipment.length} equipment...`)
        
        const mappingsToAdd = analysis.unmappedEquipment.map(equipment => ({
          equipment_id: equipment.設備ID,
          system_id: 'SYS-001', // Default system
          role_in_system: 'STANDARD'
        }))
        
        const { error: mappingError } = await supabase
          .from('equipment_system_mapping')
          .insert(mappingsToAdd)
        
        if (mappingError) {
          result.errors.push(`Failed to add system mappings: ${mappingError.message}`)
        } else {
          result.addedSystemMappings = analysis.unmappedEquipment.length
          console.log(`✅ Added ${result.addedSystemMappings} system mappings`)
        }
      }
      
      result.success = result.errors.length === 0
      
      if (result.success) {
        console.log('🎉 Orphaned records cleanup completed successfully!')
        console.log(`📈 Summary:`)
        console.log(`   - Deleted maintenance records: ${result.deletedMaintenanceRecords}`)
        console.log(`   - Deleted process parameters: ${result.deletedProcessParameters}`)
        console.log(`   - Added system mappings: ${result.addedSystemMappings}`)
      } else {
        console.log('❌ Cleanup completed with errors:', result.errors)
      }
      
    } catch (error) {
      result.errors.push(`Unexpected error during cleanup: ${error instanceof Error ? error.message : String(error)}`)
      result.success = false
      console.error('💥 Cleanup failed:', error)
    }
    
    return result
  }
  
  /**
   * Verify cleanup results
   */
  async verifyCleanup(): Promise<{
    remainingOrphanedMaintenance: number
    remainingOrphanedParameters: number
    remainingUnmappedEquipment: number
    isClean: boolean
  }> {
    console.log('🔍 Verifying cleanup results...')
    
    const analysis = await this.analyzeOrphanedRecords()
    
    const result = {
      remainingOrphanedMaintenance: analysis.orphanedMaintenance.length,
      remainingOrphanedParameters: analysis.orphanedParameters.length,
      remainingUnmappedEquipment: analysis.unmappedEquipment.length,
      isClean: analysis.orphanedMaintenance.length === 0 && 
               analysis.orphanedParameters.length === 0 && 
               analysis.unmappedEquipment.length === 0
    }
    
    if (result.isClean) {
      console.log('✅ Verification passed: No orphaned records found!')
    } else {
      console.log('⚠️  Verification found remaining issues:')
      console.log(`   - Orphaned maintenance: ${result.remainingOrphanedMaintenance}`)
      console.log(`   - Orphaned parameters: ${result.remainingOrphanedParameters}`)
      console.log(`   - Unmapped equipment: ${result.remainingUnmappedEquipment}`)
    }
    
    return result
  }
}