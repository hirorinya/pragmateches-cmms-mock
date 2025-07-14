/**
 * Database Bridge Layer - Handles Japanese/English Column Name Compatibility
 * 
 * This layer provides a clean abstraction between Japanese database column names
 * and English application interfaces, eliminating field name mapping complexity.
 */

// =============================================================================
// STANDARDIZED ENGLISH INTERFACES
// =============================================================================

export interface Equipment {
  equipment_id: string
  equipment_name: string
  equipment_type_id?: number
  equipment_tag: string
  location?: string
  manufacturer?: string
  model?: string
  installation_date?: string
  operational_status?: string
  importance?: string
  created_at?: string
  updated_at?: string
}

export interface MaintenanceHistory {
  history_id: string
  equipment_id: string
  work_order_id?: string
  execution_date: string
  staff_id?: string
  contractor_id?: string
  work_description?: string
  work_result?: string
  parts_used?: string
  work_hours?: number
  cost?: number
  next_recommended_date?: string
  created_at?: string
  updated_at?: string
}

export interface EquipmentTypeMaster {
  equipment_type_id: number
  equipment_type_name: string
  description?: string
}

export interface WorkTypeMaster {
  work_type_id: number
  work_type_name: string
  description?: string
  standard_work_hours?: number
}

export interface StaffMaster {
  staff_id: string
  name: string
  department?: string
  position?: string
  specialty?: string
  contact?: string
}

export interface ContractorMaster {
  contractor_id: string
  contractor_name: string
  contractor_type?: string
  specialty?: string
  contact?: string
  contact_person?: string
  contract_start_date?: string
  contract_end_date?: string
}

export interface WorkOrder {
  work_order_id: string
  equipment_id: string
  work_type_id?: number
  work_description: string
  priority?: string
  planned_start_datetime?: string
  planned_end_datetime?: string
  actual_start_datetime?: string
  actual_end_datetime?: string
  staff_id?: string
  status?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface InspectionPlan {
  plan_id: string
  equipment_id: string
  cycle_id?: number
  inspection_items: string
  last_inspection_date?: string
  next_inspection_date?: string
  staff_id?: string
  status?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface AnomalyReport {
  report_id: string
  equipment_id: string
  occurrence_datetime: string
  discoverer_id?: string
  anomaly_type: string
  severity: string
  symptoms?: string
  cause?: string
  countermeasure?: string
  status?: string
  report_datetime?: string
  resolution_datetime?: string
  created_at?: string
  updated_at?: string
}

// =============================================================================
// JAPANESE DATABASE INTERFACES (Raw from database)
// =============================================================================

interface EquipmentRaw {
  設備ID: string
  設備名: string
  設備種別ID?: number
  設備タグ: string
  設置場所?: string
  製造者?: string
  型式?: string
  設置年月日?: string
  稼働状態?: string
  重要度?: string
  created_at?: string
  updated_at?: string
}

interface MaintenanceHistoryRaw {
  履歴ID: string
  設備ID: string
  作業指示ID?: string
  実施日: string
  作業者ID?: string
  業者ID?: string
  作業内容?: string
  作業結果?: string
  使用部品?: string
  作業時間?: number
  コスト?: number
  次回推奨日?: string
  created_at?: string
  updated_at?: string
}

interface EquipmentTypeMasterRaw {
  設備種別ID: number
  設備種別名: string
  説明?: string
}

// =============================================================================
// BRIDGE FUNCTIONS - Convert Japanese DB to English Interfaces
// =============================================================================

export function bridgeEquipment(raw: EquipmentRaw): Equipment {
  return {
    equipment_id: raw.設備ID,
    equipment_name: raw.設備名,
    equipment_type_id: raw.設備種別ID,
    equipment_tag: raw.設備タグ,
    location: raw.設置場所,
    manufacturer: raw.製造者,
    model: raw.型式,
    installation_date: raw.設置年月日,
    operational_status: raw.稼働状態,
    importance: raw.重要度,
    created_at: raw.created_at,
    updated_at: raw.updated_at
  }
}

export function bridgeMaintenanceHistory(raw: MaintenanceHistoryRaw): MaintenanceHistory {
  return {
    history_id: raw.履歴ID,
    equipment_id: raw.設備ID,
    work_order_id: raw.作業指示ID,
    execution_date: raw.実施日,
    staff_id: raw.作業者ID,
    contractor_id: raw.業者ID,
    work_description: raw.作業内容,
    work_result: raw.作業結果,
    parts_used: raw.使用部品,
    work_hours: raw.作業時間,
    cost: raw.コスト,
    next_recommended_date: raw.次回推奨日,
    created_at: raw.created_at,
    updated_at: raw.updated_at
  }
}

export function bridgeEquipmentTypeMaster(raw: EquipmentTypeMasterRaw): EquipmentTypeMaster {
  return {
    equipment_type_id: raw.設備種別ID,
    equipment_type_name: raw.設備種別名,
    description: raw.説明
  }
}

// =============================================================================
// UTILITY FUNCTIONS - Eliminate Field Name Mapping
// =============================================================================

/**
 * Get equipment ID from any equipment data structure
 * Eliminates the need for complex field name mapping
 */
export function getEquipmentId(equipment: any): string {
  return equipment.equipment_id || equipment.設備ID || equipment.equipmentId || ''
}

/**
 * Get equipment name from any equipment data structure
 */
export function getEquipmentName(equipment: any): string {
  return equipment.equipment_name || equipment.設備名 || equipment.equipmentName || ''
}

/**
 * Get equipment location from any equipment data structure
 */
export function getEquipmentLocation(equipment: any): string {
  return equipment.location || equipment.設置場所 || equipment.installationLocation || ''
}

/**
 * Universal duplicate removal for equipment arrays
 * Works with any field name pattern
 */
export function removeDuplicateEquipment<T>(results: T[]): T[] {
  if (!Array.isArray(results)) {
    return [results as T]
  }
  
  return results.filter((result: T, index: number, arr: T[]) => {
    const currentId = getEquipmentId(result)
    if (!currentId) return true // Keep items without ID
    
    return arr.findIndex((item: T) => {
      const compareId = getEquipmentId(item)
      return compareId === currentId
    }) === index
  })
}

/**
 * Universal equipment grouping function
 * Works with any field name pattern
 */
export function groupEquipmentById<T>(results: T[]): Map<string, T[]> {
  const groupedMap = new Map<string, T[]>()
  
  results.forEach(result => {
    const equipmentId = getEquipmentId(result)
    if (!equipmentId) return
    
    if (!groupedMap.has(equipmentId)) {
      groupedMap.set(equipmentId, [])
    }
    groupedMap.get(equipmentId)!.push(result)
  })
  
  return groupedMap
}

/**
 * Create standardized equipment summary
 */
export function createEquipmentSummary(equipmentData: any): Equipment {
  return {
    equipment_id: getEquipmentId(equipmentData),
    equipment_name: getEquipmentName(equipmentData),
    equipment_type_id: equipmentData.equipment_type_id || equipmentData.設備種別ID,
    equipment_tag: equipmentData.equipment_tag || equipmentData.設備タグ,
    location: getEquipmentLocation(equipmentData),
    manufacturer: equipmentData.manufacturer || equipmentData.製造者,
    model: equipmentData.model || equipmentData.型式,
    installation_date: equipmentData.installation_date || equipmentData.設置年月日,
    operational_status: equipmentData.operational_status || equipmentData.稼働状態,
    importance: equipmentData.importance || equipmentData.重要度,
    created_at: equipmentData.created_at,
    updated_at: equipmentData.updated_at
  }
}

// =============================================================================
// QUERY BUILDER HELPERS
// =============================================================================

/**
 * Get the correct column name for equipment ID based on table type
 */
export function getEquipmentIdColumn(tableType: 'equipment' | 'process' | 'maintenance'): string {
  switch (tableType) {
    case 'equipment':
      return '設備ID'
    case 'process':
      return 'equipment_id'
    case 'maintenance':
      return '設備ID'
    default:
      return 'equipment_id'
  }
}

/**
 * Build proper select query for equipment with type safety
 */
export function buildEquipmentSelectQuery(): string {
  return `
    設備ID,
    設備名,
    設備種別ID,
    設備タグ,
    設置場所,
    製造者,
    型式,
    設置年月日,
    稼働状態,
    重要度,
    created_at,
    updated_at
  `
}

/**
 * Build proper select query for maintenance history
 */
export function buildMaintenanceHistorySelectQuery(): string {
  return `
    履歴ID,
    設備ID,
    作業指示ID,
    実施日,
    作業者ID,
    業者ID,
    作業内容,
    作業結果,
    使用部品,
    作業時間,
    コスト,
    次回推奨日,
    created_at,
    updated_at
  `
}

// =============================================================================
// EXPORT ALL UTILITIES
// =============================================================================

export const DatabaseBridge = {
  // Bridge functions
  bridgeEquipment,
  bridgeMaintenanceHistory,
  bridgeEquipmentTypeMaster,
  
  // Utility functions
  getEquipmentId,
  getEquipmentName,
  getEquipmentLocation,
  removeDuplicateEquipment,
  groupEquipmentById,
  createEquipmentSummary,
  
  // Query helpers
  getEquipmentIdColumn,
  buildEquipmentSelectQuery,
  buildMaintenanceHistorySelectQuery
}

export default DatabaseBridge