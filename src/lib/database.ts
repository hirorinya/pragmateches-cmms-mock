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
    .select(`
      *,
      equipment_type_master(設備種別名)
    `)
    .order('設備ID')
  
  if (error) throw error
  return data
}

export async function getEquipmentById(equipmentId: string) {
  const { data, error } = await supabase
    .from('equipment')
    .select(`
      *,
      equipment_type_master(設備種別名)
    `)
    .eq('設備ID', equipmentId)
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
      equipment(設備名, 設備タグ),
      staff_master(氏名),
      work_order(作業内容)
    `)
    .order('実施日', { ascending: false })
  
  if (equipmentId) {
    query = query.eq('設備ID', equipmentId)
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
      equipment(設備名, 設備タグ),
      staff_master(氏名)
    `)
    .order('発生日時', { ascending: false })
  
  if (status) {
    query = query.eq('状態', status)
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
      equipment(設備名, 設備タグ),
      work_type_master(作業種別名),
      staff_master(氏名)
    `)
    .order('計画開始日時', { ascending: false })
  
  if (status) {
    query = query.eq('状態', status)
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
      equipment(設備名, 設備タグ),
      inspection_cycle_master(周期名),
      staff_master(氏名)
    `)
    .order('次回点検日')
  
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
    supabase.from('equipment').select('設備ID', { count: 'exact', head: true }),
    supabase.from('work_order').select('作業指示ID', { count: 'exact', head: true }).eq('状態', '計画中'),
    supabase.from('anomaly_report').select('報告ID', { count: 'exact', head: true }).eq('状態', '対応中'),
    supabase.from('inspection_plan').select('計画ID', { count: 'exact', head: true }).lte('次回点検日', new Date().toISOString().split('T')[0])
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
      equipment_type_master(設備種別名),
      maintenance_history(*),
      anomaly_report(*),
      inspection_plan(*)
    `)
  
  if (categoryFilter) {
    query = query.eq('equipment_type_master.設備種別名', categoryFilter)
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
      設備ID,
      実施日,
      作業内容,
      作業結果,
      equipment!inner(
        設備名,
        設備タグ,
        設置場所,
        稼働状態,
        equipment_type_master(設備種別名)
      )
    `)
    .gte('実施日', cutoffDateString)
    .order('実施日', { ascending: false })

  if (error) throw error

  // Group by equipment and aggregate data
  const equipmentMap = new Map()
  
  data.forEach(record => {
    const equipmentId = record.設備ID
    
    if (!equipmentMap.has(equipmentId)) {
      equipmentMap.set(equipmentId, {
        設備ID: equipmentId,
        設備名: record.equipment.設備名,
        設備タグ: record.equipment.設備タグ,
        設置場所: record.equipment.設置場所,
        稼働状態: record.equipment.稼働状態,
        設備種別名: record.equipment.equipment_type_master?.設備種別名 || 'Unknown',
        最新メンテナンス日: record.実施日,
        メンテナンス回数: 0,
        メンテナンス履歴: []
      })
    }
    
    const equipment = equipmentMap.get(equipmentId)
    
    // Update latest maintenance date if this record is more recent
    if (new Date(record.実施日) > new Date(equipment.最新メンテナンス日)) {
      equipment.最新メンテナンス日 = record.実施日
    }
    
    // Increment maintenance count
    equipment.メンテナンス回数++
    
    // Add to maintenance history
    equipment.メンテナンス履歴.push({
      実施日: record.実施日,
      作業内容: record.作業内容,
      作業結果: record.作業結果
    })
  })

  // Convert map to array and sort by most recent maintenance first
  const result = Array.from(equipmentMap.values()).sort((a, b) => 
    new Date(b.最新メンテナンス日).getTime() - new Date(a.最新メンテナンス日).getTime()
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