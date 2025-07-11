/**
 * Data Integrity Utility Service
 * Provides functions to validate and ensure data consistency across the CMMS system
 */

import { supabase } from '@/lib/supabase'
import { DatabaseBridge } from '@/lib/database-bridge'

export interface DataIntegrityReport {
  checks: DataIntegrityCheck[]
  summary: {
    total_checks: number
    passed: number
    failed: number
    warnings: number
  }
  recommendations: string[]
}

export interface DataIntegrityCheck {
  check_name: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  description: string
  details?: string
  recommendations?: string[]
}

export class DataIntegrityService {
  
  /**
   * Run comprehensive data integrity checks
   */
  async runIntegrityChecks(): Promise<DataIntegrityReport> {
    const checks: DataIntegrityCheck[] = []
    
    // Check 1: Verify all equipment has valid system mappings
    checks.push(await this.checkEquipmentSystemMappings())
    
    // Check 2: Verify all process parameters have valid ranges
    checks.push(await this.checkProcessParameterRanges())
    
    // Check 3: Check for orphaned records
    checks.push(await this.checkOrphanedRecords())
    
    // Check 4: Verify date consistency
    checks.push(await this.checkDateConsistency())
    
    // Check 5: Check for missing required data
    checks.push(await this.checkMissingRequiredData())
    
    // Calculate summary
    const summary = {
      total_checks: checks.length,
      passed: checks.filter(c => c.status === 'PASS').length,
      failed: checks.filter(c => c.status === 'FAIL').length,
      warnings: checks.filter(c => c.status === 'WARNING').length
    }
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(checks)
    
    return {
      checks,
      summary,
      recommendations
    }
  }
  
  /**
   * Check equipment system mappings
   */
  private async checkEquipmentSystemMappings(): Promise<DataIntegrityCheck> {
    try {
      // Note: equipment_system_mapping uses equipment_id, equipment table uses 設備ID
      // This is a known field name mismatch that should be checked manually
      const mappedEquipmentIds = await this.getEquipmentWithSystemMappings()
      
      let unmappedEquipment
      let error
      
      if (mappedEquipmentIds === '') {
        // No mappings exist, all equipment are unmapped
        const result = await supabase
          .from('equipment')
          .select('設備ID, 設備名')
          .limit(10)
        unmappedEquipment = result.data
        error = result.error
      } else {
        // Some mappings exist, check for unmapped equipment
        const result = await supabase
          .from('equipment')
          .select('設備ID, 設備名')
          .not('設備ID', 'in', 
            `(${mappedEquipmentIds})`
          )
          .limit(10)
        unmappedEquipment = result.data
        error = result.error
      }
      
      if (error) {
        return {
          check_name: 'Equipment System Mappings',
          status: 'FAIL',
          description: 'Failed to check equipment system mappings',
          details: error.message
        }
      }
      
      if (unmappedEquipment && unmappedEquipment.length > 0) {
        return {
          check_name: 'Equipment System Mappings',
          status: 'WARNING',
          description: `Found ${unmappedEquipment.length} equipment without system mappings`,
          details: `Equipment IDs: ${unmappedEquipment.map(e => e.設備ID).join(', ')}`,
          recommendations: [
            'Add system mappings for all equipment',
            'Review equipment classification process'
          ]
        }
      }
      
      return {
        check_name: 'Equipment System Mappings',
        status: 'PASS',
        description: 'All equipment have valid system mappings'
      }
    } catch (error) {
      return {
        check_name: 'Equipment System Mappings',
        status: 'FAIL',
        description: 'Error checking equipment system mappings',
        details: error instanceof Error ? error.message : String(error)
      }
    }
  }
  
  /**
   * Check process parameter ranges
   */
  private async checkProcessParameterRanges(): Promise<DataIntegrityCheck> {
    try {
      // Get all process parameters first, then filter in JavaScript
      const { data: allParameters, error } = await supabase
        .from('process_parameters')
        .select('parameter_id, parameter_name, normal_min, normal_max, critical_min, critical_max')
        .limit(100)
      
      if (error) throw error
      
      // Filter invalid parameters in JavaScript to avoid SQL syntax issues
      const invalidParameters = (allParameters || []).filter(param => {
        const normalMin = parseFloat(param.normal_min)
        const normalMax = parseFloat(param.normal_max)
        const criticalMin = parseFloat(param.critical_min)
        const criticalMax = parseFloat(param.critical_max)
        
        // Check for invalid ranges
        return (
          (normalMin >= normalMax) ||
          (criticalMin >= criticalMax) ||
          (criticalMin > normalMin) ||
          (criticalMax < normalMax)
        )
      }).slice(0, 10)
      
      if (invalidParameters && invalidParameters.length > 0) {
        return {
          check_name: 'Process Parameter Ranges',
          status: 'FAIL',
          description: `Found ${invalidParameters.length} parameters with invalid ranges`,
          details: `Parameter IDs: ${invalidParameters.map(p => p.parameter_id).join(', ')}`,
          recommendations: [
            'Review and correct parameter range definitions',
            'Ensure critical ranges are outside normal ranges',
            'Verify min values are less than max values'
          ]
        }
      }
      
      return {
        check_name: 'Process Parameter Ranges',
        status: 'PASS',
        description: 'All process parameters have valid ranges'
      }
    } catch (error) {
      return {
        check_name: 'Process Parameter Ranges',
        status: 'FAIL',
        description: 'Error checking process parameter ranges',
        details: error instanceof Error ? error.message : String(error)
      }
    }
  }
  
  /**
   * Check for orphaned records
   */
  private async checkOrphanedRecords(): Promise<DataIntegrityCheck> {
    try {
      const issues: string[] = []
      
      // Check for maintenance history without equipment
      const { data: orphanedMaintenance, error: maintenanceError } = await supabase
        .from('maintenance_history')
        .select('設備ID')
        .not('設備ID', 'in', 
          `(${await this.getValidEquipmentIds()})`
        )
        .limit(5)
      
      if (orphanedMaintenance && orphanedMaintenance.length > 0) {
        issues.push(`${orphanedMaintenance.length} maintenance records reference non-existent equipment`)
      }
      
      // Check for process parameters without equipment
      // Note: Using bridge logic to handle field name compatibility
      const { data: orphanedParameters, error: parameterError } = await supabase
        .from('process_parameters')
        .select('equipment_id')
        .not('equipment_id', 'in', 
          `(${await this.getValidEquipmentIdsEnglish()})`
        )
        .limit(5)
      
      if (orphanedParameters && orphanedParameters.length > 0) {
        issues.push(`${orphanedParameters.length} process parameters reference non-existent equipment`)
      }
      
      if (issues.length > 0) {
        return {
          check_name: 'Orphaned Records',
          status: 'WARNING',
          description: `Found orphaned records in ${issues.length} table(s)`,
          details: issues.join('; '),
          recommendations: [
            'Clean up orphaned records',
            'Implement foreign key constraints',
            'Review data deletion procedures'
          ]
        }
      }
      
      return {
        check_name: 'Orphaned Records',
        status: 'PASS',
        description: 'No orphaned records found'
      }
    } catch (error) {
      return {
        check_name: 'Orphaned Records',
        status: 'FAIL',
        description: 'Error checking for orphaned records',
        details: error instanceof Error ? error.message : String(error)
      }
    }
  }
  
  /**
   * Check date consistency
   */
  private async checkDateConsistency(): Promise<DataIntegrityCheck> {
    try {
      const issues: string[] = []
      const currentDate = new Date()
      
      // Check for future maintenance dates that are unrealistic
      const { data: futureMaintenance, error: maintenanceError } = await supabase
        .from('maintenance_history')
        .select('設備ID, 実施日')
        .gt('実施日', currentDate.toISOString())
        .limit(5)
      
      if (futureMaintenance && futureMaintenance.length > 0) {
        issues.push(`${futureMaintenance.length} maintenance records have future dates`)
      }
      
      // Check for inspection dates that are too far in the past
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      
      const { data: oldInspections, error: inspectionError } = await supabase
        .from('inspection_plan')
        .select('設備ID, 次回検査日')
        .lt('次回検査日', oneYearAgo.toISOString())
        .limit(5)
      
      if (oldInspections && oldInspections.length > 0) {
        issues.push(`${oldInspections.length} inspection plans are severely overdue`)
      }
      
      if (issues.length > 0) {
        return {
          check_name: 'Date Consistency',
          status: 'WARNING',
          description: `Found date inconsistencies in ${issues.length} area(s)`,
          details: issues.join('; '),
          recommendations: [
            'Review and correct date entries',
            'Implement date validation in forms',
            'Set up automated date consistency checks'
          ]
        }
      }
      
      return {
        check_name: 'Date Consistency',
        status: 'PASS',
        description: 'All dates are consistent and reasonable'
      }
    } catch (error) {
      return {
        check_name: 'Date Consistency',
        status: 'FAIL',
        description: 'Error checking date consistency',
        details: error instanceof Error ? error.message : String(error)
      }
    }
  }
  
  /**
   * Check for missing required data
   */
  private async checkMissingRequiredData(): Promise<DataIntegrityCheck> {
    try {
      const issues: string[] = []
      
      // Check for equipment without names
      const { data: equipmentWithoutNames, error: equipmentError } = await supabase
        .from('equipment')
        .select('設備ID')
        .or('設備名.is.null,設備名.eq.')
        .limit(5)
      
      if (equipmentWithoutNames && equipmentWithoutNames.length > 0) {
        issues.push(`${equipmentWithoutNames.length} equipment records missing names`)
      }
      
      // Check for process parameters without units
      const { data: parametersWithoutUnits, error: parameterError } = await supabase
        .from('process_parameters')
        .select('parameter_id')
        .or('unit.is.null,unit.eq.')
        .limit(5)
      
      if (parametersWithoutUnits && parametersWithoutUnits.length > 0) {
        issues.push(`${parametersWithoutUnits.length} process parameters missing units`)
      }
      
      if (issues.length > 0) {
        return {
          check_name: 'Missing Required Data',
          status: 'WARNING',
          description: `Found missing required data in ${issues.length} area(s)`,
          details: issues.join('; '),
          recommendations: [
            'Complete missing required fields',
            'Implement data validation rules',
            'Set up data quality monitoring'
          ]
        }
      }
      
      return {
        check_name: 'Missing Required Data',
        status: 'PASS',
        description: 'All required data fields are populated'
      }
    } catch (error) {
      return {
        check_name: 'Missing Required Data',
        status: 'FAIL',
        description: 'Error checking for missing required data',
        details: error instanceof Error ? error.message : String(error)
      }
    }
  }
  
  /**
   * Helper method to get equipment with system mappings
   */
  private async getEquipmentWithSystemMappings(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('equipment_system_mapping')
        .select('equipment_id')
      
      if (error || !data || data.length === 0) {
        // Return empty string if no mappings exist
        return ''
      }
      
      // Return equipment IDs in format compatible with equipment table (設備ID)
      return data.map(item => `'${item.equipment_id}'`).join(',')
    } catch (error) {
      // If table doesn't exist, return empty string
      return ''
    }
  }
  
  /**
   * Helper method to get valid equipment IDs
   */
  private async getValidEquipmentIds(): Promise<string> {
    const { data, error } = await supabase
      .from('equipment')
      .select('設備ID')
    
    if (error || !data) return ''
    
    return data.map(item => `'${item.設備ID}'`).join(',')
  }
  
  /**
   * Helper method to get valid equipment IDs in English format for process_parameters table
   */
  private async getValidEquipmentIdsEnglish(): Promise<string> {
    const { data, error } = await supabase
      .from('equipment')
      .select('設備ID')
    
    if (error || !data) return ''
    
    // Return equipment IDs formatted for tables that use equipment_id (English field name)
    return data.map(item => `'${item.設備ID}'`).join(',')
  }
  
  /**
   * Generate recommendations based on failed checks
   */
  private generateRecommendations(checks: DataIntegrityCheck[]): string[] {
    const recommendations: string[] = []
    
    const failedChecks = checks.filter(c => c.status === 'FAIL')
    const warningChecks = checks.filter(c => c.status === 'WARNING')
    
    if (failedChecks.length > 0) {
      recommendations.push('Address critical data integrity issues immediately')
      recommendations.push('Review data entry procedures and validation rules')
    }
    
    if (warningChecks.length > 0) {
      recommendations.push('Schedule data cleanup activities for warning issues')
      recommendations.push('Implement preventive data quality measures')
    }
    
    if (failedChecks.length === 0 && warningChecks.length === 0) {
      recommendations.push('Data integrity is good - continue regular monitoring')
      recommendations.push('Consider implementing automated data quality checks')
    }
    
    return recommendations
  }
}