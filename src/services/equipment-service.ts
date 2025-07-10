import { supabase } from '@/lib/supabase'
import { cacheService, CacheKeys, CacheTTL } from '@/lib/cache-service'
import { withPerformanceTracking, recordError } from '@/lib/monitoring-service'

interface EquipmentInfo {
  equipment_id: string
  name: string
  manufacturer?: string
  model?: string
  location?: string
  status?: string
  installed_date?: string
  system?: string
  type?: string
  specifications?: {
    capacity?: string
    power?: string
    service?: string
  }
  last_maintenance?: string
  next_inspection?: string
  risk_level?: string
}

export class EquipmentService {
  /**
   * Get equipment information by ID (with caching)
   */
  async getEquipmentInfo(equipmentId: string): Promise<EquipmentInfo | null> {
    return cacheService.get(
      CacheKeys.equipmentInfo(equipmentId),
      () => this._fetchEquipmentInfo(equipmentId),
      CacheTTL.equipmentInfo
    )
  }

  /**
   * Internal method to fetch equipment info from database
   */
  private async _fetchEquipmentInfo(equipmentId: string): Promise<EquipmentInfo | null> {
    return withPerformanceTracking(
      'equipment_service.getEquipmentInfo',
      async () => {
        try {
      // Query main equipment table
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select(`
          設備ID,
          設備名,
          メーカー,
          型式,
          設置場所,
          稼働状態,
          設置日,
          設備種別ID,
          equipment_type_master(設備種別名)
        `)
        .eq('設備ID', equipmentId)
        .single()

      if (equipmentError || !equipment) {
        console.warn(`Equipment ${equipmentId} not found in main table:`, equipmentError)
        return null
      }

      // Get system information if available
      const { data: systemMapping } = await supabase
        .from('equipment_system_mapping')
        .select(`
          system_id,
          equipment_systems(system_name, criticality)
        `)
        .eq('equipment_id', equipmentId)
        .single()

      // Get latest maintenance history
      const { data: lastMaintenance } = await supabase
        .from('maintenance_history')
        .select('実施日, 作業内容')
        .eq('設備ID', equipmentId)
        .order('実施日', { ascending: false })
        .limit(1)
        .single()

      // Get next inspection
      const { data: nextInspection } = await supabase
        .from('inspection_plan')
        .select('次回検査日')
        .eq('設備ID', equipmentId)
        .order('次回検査日', { ascending: true })
        .limit(1)
        .single()

      // Get risk assessment
      const { data: riskAssessment } = await supabase
        .from('equipment_risk_assessment')
        .select('リスクレベル, リスクスコア')
        .eq('設備ID', equipmentId)
        .order('リスクスコア', { ascending: false })
        .limit(1)
        .single()

      // Format response
      const result: EquipmentInfo = {
        equipment_id: equipment.設備ID,
        name: equipment.設備名,
        manufacturer: equipment.メーカー,
        model: equipment.型式,
        location: equipment.設置場所,
        status: equipment.稼働状態,
        installed_date: equipment.設置日,
        type: equipment.equipment_type_master?.設備種別名,
        system: systemMapping?.system_id,
        specifications: {
          service: systemMapping?.equipment_systems?.system_name
        },
        last_maintenance: lastMaintenance?.実施日,
        next_inspection: nextInspection?.次回検査日,
        risk_level: riskAssessment?.リスクレベル
      }

      return result

        } catch (error) {
          recordError(
            error instanceof Error ? error : new Error(String(error)),
            'equipment_service.getEquipmentInfo',
            'high',
            { equipmentId }
          )
          return null
        }
      },
      { equipmentId }
    )
  }

  /**
   * Get all systems in the facility (with caching)
   */
  async getAllSystems(): Promise<Array<{
    system_id: string
    name: string
    criticality: string
    equipment_count: number
  }>> {
    return cacheService.get(
      CacheKeys.allSystems(),
      () => this._fetchAllSystems(),
      CacheTTL.systemsList
    )
  }

  /**
   * Internal method to fetch all systems from database
   */
  private async _fetchAllSystems(): Promise<Array<{
    system_id: string
    name: string
    criticality: string
    equipment_count: number
  }>> {
    try {
      // Get all systems
      const { data: systems, error: systemsError } = await supabase
        .from('equipment_systems')
        .select('system_id, system_name, criticality')
        .order('system_id')

      if (systemsError) {
        console.error('Error fetching systems:', systemsError)
        return []
      }

      // Get equipment count for each system
      const systemsWithCounts = await Promise.all(
        systems.map(async (system) => {
          const { count } = await supabase
            .from('equipment_system_mapping')
            .select('*', { count: 'exact', head: true })
            .eq('system_id', system.system_id)

          return {
            system_id: system.system_id,
            name: system.system_name,
            criticality: system.criticality,
            equipment_count: count || 0
          }
        })
      )

      return systemsWithCounts

    } catch (error) {
      console.error('Error fetching systems:', error)
      return []
    }
  }

  /**
   * Get equipment by system (with caching)
   */
  async getEquipmentBySystem(systemId: string): Promise<Array<{
    equipment_id: string
    name: string
    type: string
    status: string
  }>> {
    return cacheService.get(
      CacheKeys.equipmentsBySystem(systemId),
      () => this._fetchEquipmentBySystem(systemId),
      CacheTTL.systemsList
    )
  }

  /**
   * Internal method to fetch equipment by system from database
   */
  private async _fetchEquipmentBySystem(systemId: string): Promise<Array<{
    equipment_id: string
    name: string
    type: string
    status: string
  }>> {
    try {
      const { data: equipmentMappings, error } = await supabase
        .from('equipment_system_mapping')
        .select(`
          equipment_id,
          equipment(
            設備名,
            稼働状態,
            equipment_type_master(設備種別名)
          )
        `)
        .eq('system_id', systemId)

      if (error) {
        console.error('Error fetching equipment by system:', error)
        return []
      }

      return equipmentMappings.map(mapping => ({
        equipment_id: mapping.equipment_id,
        name: mapping.equipment.設備名,
        type: mapping.equipment.equipment_type_master?.設備種別名 || 'Unknown',
        status: mapping.equipment.稼働状態
      }))

    } catch (error) {
      console.error('Error fetching equipment by system:', error)
      return []
    }
  }

  /**
   * Get thickness measurement data for equipment (with caching)
   */
  async getThicknessMeasurements(equipmentId: string): Promise<{
    equipment_id: string
    measurement_points: Array<{
      point: string
      current: string
      design: string
      minimum: string
      status: string
      date: string
    }>
    trend: string
    recommendation: string
  } | null> {
    return cacheService.get(
      CacheKeys.thicknessMeasurements(equipmentId),
      () => this._fetchThicknessMeasurements(equipmentId),
      CacheTTL.thicknessMeasurements
    )
  }

  /**
   * Internal method to fetch thickness measurements from database
   */
  private async _fetchThicknessMeasurements(equipmentId: string): Promise<{
    equipment_id: string
    measurement_points: Array<{
      point: string
      current: string
      design: string
      minimum: string
      status: string
      date: string
    }>
    trend: string
    recommendation: string
  } | null> {
    try {
      const { data: measurements, error } = await supabase
        .from('thickness_measurement')
        .select('*')
        .eq('設備ID', equipmentId)
        .order('検査日', { ascending: false })

      if (error || !measurements || measurements.length === 0) {
        console.warn(`No thickness measurements found for ${equipmentId}`)
        return null
      }

      // Group by measurement point and get latest for each
      const pointsMap = new Map()
      measurements.forEach(m => {
        const point = m.測定ポイント
        if (!pointsMap.has(point) || new Date(m.検査日) > new Date(pointsMap.get(point).検査日)) {
          pointsMap.set(point, m)
        }
      })

      const measurementPoints = Array.from(pointsMap.values()).map(m => ({
        point: m.測定ポイント,
        current: `${m['肉厚測定値(mm)']}mm`,
        design: `${m['設計肉厚(mm)']}mm`,
        minimum: `${m['最小許容肉厚(mm)']}mm`,
        status: m.判定,
        date: m.検査日
      }))

      // Analyze trend
      const hasMultipleMeasurements = measurements.length > 1
      const trend = hasMultipleMeasurements 
        ? "Multiple measurements available - trend analysis possible"
        : "Single measurement available"

      // Generate recommendation
      const failingPoints = measurementPoints.filter(p => p.status !== '合格')
      const recommendation = failingPoints.length > 0
        ? `${failingPoints.length} measurement points require attention`
        : "All measurement points within acceptable limits"

      return {
        equipment_id: equipmentId,
        measurement_points: measurementPoints,
        trend,
        recommendation
      }

    } catch (error) {
      console.error('Error fetching thickness measurements:', error)
      return null
    }
  }

  /**
   * Invalidate cache for specific equipment (useful when data is updated)
   */
  invalidateEquipmentCache(equipmentId: string): void {
    cacheService.invalidate(CacheKeys.equipmentInfo(equipmentId))
    cacheService.invalidate(CacheKeys.thicknessMeasurements(equipmentId))
    cacheService.invalidatePattern(`equipment:system:.*`) // Invalidate all system caches
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return cacheService.getStats()
  }
}