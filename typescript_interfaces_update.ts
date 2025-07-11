// TypeScript Interfaces Update - Before/After Migration
// This file shows the interface changes needed after column name migration

// =============================================================================
// BEFORE MIGRATION - Japanese Column Names
// =============================================================================

export interface Equipment_OLD {
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

export interface MaintenanceHistory_OLD {
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

export interface WorkOrder_OLD {
  作業指示ID: string
  設備ID: string
  作業種別ID?: number
  作業内容: string
  優先度?: string
  計画開始日時?: string
  計画終了日時?: string
  実際開始日時?: string
  実際終了日時?: string
  作業者ID?: string
  状態?: string
  備考?: string
  created_at?: string
  updated_at?: string
}

// =============================================================================
// AFTER MIGRATION - English Column Names
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
  operating_status?: string
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

export interface InspectionCycleMaster {
  cycle_id: number
  cycle_name: string
  cycle_days: number
  description?: string
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
// MIGRATION HELPER FUNCTIONS
// =============================================================================

// Helper function to migrate old interface data to new interface
export function migrateEquipmentData(oldData: Equipment_OLD): Equipment {
  return {
    equipment_id: oldData.設備ID,
    equipment_name: oldData.設備名,
    equipment_type_id: oldData.設備種別ID,
    equipment_tag: oldData.設備タグ,
    location: oldData.設置場所,
    manufacturer: oldData.製造者,
    model: oldData.型式,
    installation_date: oldData.設置年月日,
    operating_status: oldData.稼働状態,
    importance: oldData.重要度,
    created_at: oldData.created_at,
    updated_at: oldData.updated_at
  }
}

export function migrateMaintenanceHistoryData(oldData: MaintenanceHistory_OLD): MaintenanceHistory {
  return {
    history_id: oldData.履歴ID,
    equipment_id: oldData.設備ID,
    work_order_id: oldData.作業指示ID,
    execution_date: oldData.実施日,
    staff_id: oldData.作業者ID,
    contractor_id: oldData.業者ID,
    work_description: oldData.作業内容,
    work_result: oldData.作業結果,
    parts_used: oldData.使用部品,
    work_hours: oldData.作業時間,
    cost: oldData.コスト,
    next_recommended_date: oldData.次回推奨日,
    created_at: oldData.created_at,
    updated_at: oldData.updated_at
  }
}

// =============================================================================
// QUERY EXAMPLES - BEFORE/AFTER
// =============================================================================

// BEFORE: Japanese column names with complex mapping
/*
const { data, error } = await supabase
  .from('equipment')
  .select(`
    設備ID,
    設備名,
    設置場所,
    稼働状態,
    equipment_type_master(設備種別名)
  `)
  .eq('設備ID', equipmentId)

// Complex mapping logic needed everywhere
const uniqueResults = parsedResponse.results.filter((result: any, index: number, arr: any[]) => {
  const currentId = result.equipment_id || result.設備ID
  return arr.findIndex(r => {
    const compareId = r.equipment_id || r.設備ID
    return compareId === currentId
  }) === index
})
*/

// AFTER: English column names with clean, simple logic
/*
const { data, error } = await supabase
  .from('equipment')
  .select(`
    equipment_id,
    equipment_name,
    location,
    operating_status,
    equipment_type_master(equipment_type_name)
  `)
  .eq('equipment_id', equipmentId)

// Clean, simple logic - no more field name mapping needed
const uniqueResults = parsedResponse.results.filter((result: any, index: number, arr: any[]) => 
  arr.findIndex(r => r.equipment_id === result.equipment_id) === index
)
*/

// =============================================================================
// BENEFITS SUMMARY
// =============================================================================

/*
✅ ELIMINATED COMPLEXITIES:
- No more field name mapping logic anywhere in the codebase
- No more `equipment_id || 設備ID` checks
- No more field name mismatch bugs
- Consistent column naming throughout the database

✅ MAINTAINED JAPANESE EXPERIENCE:
- All data values remain in Japanese (equipment names, locations, etc.)
- All UI text remains in Japanese
- No impact on user experience
- Full Japanese business terminology preserved

✅ IMPROVED DEVELOPER EXPERIENCE:
- Cleaner, more readable code
- Better IDE autocomplete and type checking
- Easier debugging and maintenance
- Standard industry practices
- Reduced cognitive load for developers

✅ FUTURE BENEFITS:
- Easier onboarding for new developers
- Better compatibility with database tools
- Simplified maintenance and feature development
- Reduced risk of field name related bugs
*/