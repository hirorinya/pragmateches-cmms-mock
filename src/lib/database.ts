import { supabase } from './supabase'
import type { 
  Equipment, 
  MaintenanceHistory, 
  AnomalyReport, 
  InspectionPlan,
  WorkOrder 
} from './supabase'

// Equipment operations
export async function getEquipment() {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .order('equipment_id')
  
  if (error) throw error
  return data
}

export async function getEquipmentById(equipmentId: string) {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('equipment_id', equipmentId)
    .single()
  
  if (error) throw error
  return data
}

// Maintenance History operations
export async function getMaintenanceHistory(equipmentId?: string) {
  let query = supabase
    .from('maintenance_history')
    .select(`
      *,
      equipment(equipment_name, equipment_tag)
    `)
    .order('implementation_date', { ascending: false })
  
  if (equipmentId) {
    query = query.eq('equipment_id', equipmentId)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

// Anomaly Reports operations
export async function getAnomalyReports(status?: string) {
  let query = supabase
    .from('anomaly_report')
    .select(`
      *,
      equipment(equipment_name, equipment_tag)
    `)
    .order('occurrence_datetime', { ascending: false })
  
  if (status) {
    query = query.eq('status', status)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

// Work Orders operations
export async function getWorkOrders(status?: string) {
  let query = supabase
    .from('work_order')
    .select(`
      *,
      equipment(equipment_name, equipment_tag)
    `)
    .order('created_date', { ascending: false })
  
  if (status) {
    query = query.eq('status', status)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

// Inspection Plans operations
export async function getInspectionPlans() {
  const { data, error } = await supabase
    .from('inspection_plan')
    .select(`
      *,
      equipment(equipment_name, equipment_tag)
    `)
    .order('next_inspection_date')
  
  if (error) throw error
  return data
}

// Dashboard statistics
export async function getDashboardStats() {
  const [
    equipmentCount,
    activeWorkOrders,
    pendingAnomalies,
    upcomingInspections
  ] = await Promise.all([
    supabase.from('equipment').select('equipment_id', { count: 'exact', head: true }),
    supabase.from('work_order').select('id', { count: 'exact', head: true }).eq('status', 'IN_PROGRESS'),
    supabase.from('anomaly_report').select('report_id', { count: 'exact', head: true }).eq('status', 'INVESTIGATING'),
    supabase.from('inspection_plan').select('plan_id', { count: 'exact', head: true }).lte('next_inspection_date', new Date().toISOString().split('T')[0])
  ])

  return {
    totalEquipment: equipmentCount.count || 0,
    activeWorkOrders: activeWorkOrders.count || 0,
    pendingAnomalies: pendingAnomalies.count || 0,
    upcomingInspections: upcomingInspections.count || 0
  }
}

// AI data for ChatGPT features
export async function getEquipmentDataForAI(categoryFilter?: string) {
  let query = supabase
    .from('equipment')
    .select(`
      *,
      maintenance_history(*),
      anomaly_report(*),
      inspection_plan(*)
    `)
  
  if (categoryFilter) {
    query = query.eq('equipment_type_id', categoryFilter)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

// Get equipment with recent maintenance work
// Simple cache for recent maintenance data
const maintenanceCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

export async function getEquipmentWithRecentMaintenance(daysBack: number = 365) {
  // Check cache first
  const cacheKey = `maintenance_${daysBack}`
  const now = Date.now()
  
  if (maintenanceCache.has(cacheKey)) {
    const cached = maintenanceCache.get(cacheKey)!
    if (now - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
  }
  
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysBack)
  const cutoffDateString = cutoffDate.toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('maintenance_history')
    .select(`
      equipment_id,
      implementation_date,
      work_content,
      work_result,
      equipment!inner(
        equipment_name,
        equipment_tag,
        installation_location,
        operational_status
      )
    `)
    .gte('implementation_date', cutoffDateString)
    .order('implementation_date', { ascending: false })

  if (error) throw error

  // Group by equipment and aggregate data
  const equipmentMap = new Map()
  
  data.forEach(record => {
    const equipmentId = record.equipment_id
    
    if (!equipmentMap.has(equipmentId)) {
      equipmentMap.set(equipmentId, {
        equipment_id: equipmentId,
        equipment_name: record.equipment.equipment_name,
        equipment_tag: record.equipment.equipment_tag,
        installation_location: record.equipment.installation_location,
        operational_status: record.equipment.operational_status,
        latest_maintenance_date: record.implementation_date,
        maintenance_count: 0,
        maintenance_history: []
      })
    }
    
    const equipment = equipmentMap.get(equipmentId)
    
    // Update latest maintenance date if this record is more recent
    if (new Date(record.implementation_date) > new Date(equipment.latest_maintenance_date)) {
      equipment.latest_maintenance_date = record.implementation_date
    }
    
    // Increment maintenance count
    equipment.maintenance_count++
    
    // Add to maintenance history
    equipment.maintenance_history.push({
      implementation_date: record.implementation_date,
      work_content: record.work_content,
      work_result: record.work_result
    })
  })

  // Convert map to array and sort by most recent maintenance first
  const result = Array.from(equipmentMap.values()).sort((a, b) => 
    new Date(b.latest_maintenance_date).getTime() - new Date(a.latest_maintenance_date).getTime()
  )

  const finalResult = {
    equipment: result,
    summary: {
      totalEquipmentWithMaintenance: result.length,
      totalMaintenanceRecords: data.length,
      periodDays: daysBack,
      cutoffDate: cutoffDateString
    }
  }
  
  // Cache the result
  maintenanceCache.set(cacheKey, {
    data: finalResult,
    timestamp: now
  })
  
  return finalResult
}