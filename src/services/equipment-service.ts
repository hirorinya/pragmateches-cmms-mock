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
          equipment_name,
          manufacturer,
          model,
          location,
          operational_status,
          installation_date,
          equipment_type_id
        `)
        .eq('equipment_id', equipmentId)
        .single()

      if (equipmentError || !equipment) {
        console.warn(`Equipment ${equipmentId} not found in main table:`, equipmentError?.message || 'No data returned')
        return null
      }

      console.log(`✅ Equipment ${equipmentId} found:`, equipment)

      // Get system information if available
      const { data: systemMapping } = await supabase
        .from('equipment_system_mapping')
        .select(`
          system_id,
          equipment_systems(system_name, criticality_level)
        `)
        .eq('equipment_id', equipmentId)
        .maybeSingle()

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
        equipment_id: equipment.equipment_id,
        name: equipment.equipment_name,
        manufacturer: equipment.manufacturer,
        model: equipment.model,
        location: equipment.location,
        status: equipment.operational_status,
        installed_date: equipment.installation_date,
        type: this.getEquipmentTypeName(equipment.equipment_type_id),
        system: systemMapping?.system_id,
        specifications: {
          service: systemMapping?.equipment_systems?.system_name
        },
        last_maintenance: lastMaintenance?.implementation_date,
        next_inspection: nextInspection?.next_inspection_date,
        risk_level: riskAssessment?.risk_level
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
   * Get all equipment in the facility
   */
  async getAllEquipment(): Promise<EquipmentInfo[]> {
    try {
      const { data: equipmentList, error } = await supabase
        .from('equipment')
        .select(`
          equipment_id,
          equipment_name,
          manufacturer,
          model,
          location,
          operational_status,
          installation_date,
          equipment_type_id
        `)
        .order('equipment_id')

      if (error) {
        console.error('Error fetching all equipment:', error)
        return []
      }

      return equipmentList.map(equipment => ({
        equipment_id: equipment.equipment_id,
        name: equipment.equipment_name,
        manufacturer: equipment.manufacturer,
        model: equipment.model,
        location: equipment.location,
        status: equipment.operational_status,
        installed_date: equipment.installation_date,
        type: this.getEquipmentTypeName(equipment.equipment_type_id),
        system: null,
        system_name: null,
        criticality: 'MEDIUM',
        next_inspection: null,
        risk_level: null
      }))

    } catch (error) {
      console.error('Error in getAllEquipment:', error)
      return []
    }
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
        // Return hardcoded systems as fallback
        return [
          { system_id: 'SYS-001', name: 'プロセス冷却系統 (Process Cooling System)', criticality: 'HIGH', equipment_count: 4 },
          { system_id: 'SYS-002', name: '原料供給系統 (Raw Material Supply System)', criticality: 'HIGH', equipment_count: 4 },
          { system_id: 'SYS-003', name: 'ユーティリティ系統 (Utility System)', criticality: 'MEDIUM', equipment_count: 4 },
          { system_id: 'SYS-004', name: '製品移送系統 (Product Transfer System)', criticality: 'MEDIUM', equipment_count: 4 },
          { system_id: 'SYS-005', name: '廃棄物処理系統 (Waste Treatment System)', criticality: 'LOW', equipment_count: 4 }
        ]
      }

      // If no systems found, return hardcoded list
      if (!systems || systems.length === 0) {
        return [
          { system_id: 'SYS-001', name: 'プロセス冷却系統 (Process Cooling System)', criticality: 'HIGH', equipment_count: 4 },
          { system_id: 'SYS-002', name: '原料供給系統 (Raw Material Supply System)', criticality: 'HIGH', equipment_count: 4 },
          { system_id: 'SYS-003', name: 'ユーティリティ系統 (Utility System)', criticality: 'MEDIUM', equipment_count: 4 },
          { system_id: 'SYS-004', name: '製品移送系統 (Product Transfer System)', criticality: 'MEDIUM', equipment_count: 4 },
          { system_id: 'SYS-005', name: '廃棄物処理系統 (Waste Treatment System)', criticality: 'LOW', equipment_count: 4 }
        ]
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
      // Return hardcoded systems as fallback
      return [
        { system_id: 'SYS-001', name: 'プロセス冷却系統 (Process Cooling System)', criticality: 'HIGH', equipment_count: 4 },
        { system_id: 'SYS-002', name: '原料供給系統 (Raw Material Supply System)', criticality: 'HIGH', equipment_count: 4 },
        { system_id: 'SYS-003', name: 'ユーティリティ系統 (Utility System)', criticality: 'MEDIUM', equipment_count: 4 },
        { system_id: 'SYS-004', name: '製品移送系統 (Product Transfer System)', criticality: 'MEDIUM', equipment_count: 4 },
        { system_id: 'SYS-005', name: '廃棄物処理系統 (Waste Treatment System)', criticality: 'LOW', equipment_count: 4 }
      ]
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
            equipment_name,
            operational_status,
            equipment_type_id
          )
        `)
        .eq('system_id', systemId)

      if (error) {
        console.error('Error fetching equipment by system:', error)
        return []
      }

      return equipmentMappings.map(mapping => ({
        equipment_id: mapping.equipment_id,
        name: mapping.equipment.equipment_name,
        type: this.getEquipmentTypeName(mapping.equipment.equipment_type_id) || 'Unknown',
        status: mapping.equipment.operational_status
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
        .eq('機器ID', equipmentId)
        .order('検査日', { ascending: false })

      if (error || !measurements || measurements.length === 0) {
        console.warn(`No thickness measurements found for ${equipmentId}`)
        return null
      }

      // Group by measurement point and get latest for each
      const pointsMap = new Map()
      measurements.forEach(m => {
        const point = m.測定点ID
        if (!pointsMap.has(point) || new Date(m.検査日) > new Date(pointsMap.get(point).検査日)) {
          pointsMap.set(point, m)
        }
      })

      const measurementPoints = Array.from(pointsMap.values()).map(m => ({
        point: m.測定点ID,
        current: `${m['測定値(mm)']}mm`,
        design: `${m['設計肉厚(mm)']}mm`,
        minimum: `${m['最小許容肉厚(mm)']}mm`,
        status: m.判定結果,
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
   * Get all equipment strategies
   */
  async getEquipmentStrategies(): Promise<any[]> {
    return withPerformanceTracking(
      'equipment_service.getEquipmentStrategies',
      async () => {
        try {
          const { data: strategies, error } = await supabase
            .from('equipment_strategy')
            .select(`
              strategy_id,
              equipment_id,
              strategy_name,
              frequency_type,
              frequency_value,
              priority,
              is_active,
              equipment!inner(
                設備名,
                設備種別ID
              )
            `)
            .order('equipment_id')

          if (error) {
            recordError(error, 'equipment_service.getEquipmentStrategies', 'high')
            throw error
          }

          return strategies || []
        } catch (error) {
          recordError(
            error instanceof Error ? error : new Error(String(error)),
            'equipment_service.getEquipmentStrategies',
            'high'
          )
          throw error
        }
      }
    )
  }

  /**
   * Get equipment strategies by equipment ID
   */
  async getEquipmentStrategiesByEquipment(equipmentId: string): Promise<any[]> {
    return withPerformanceTracking(
      'equipment_service.getEquipmentStrategiesByEquipment',
      async () => {
        try {
          const { data: strategies, error } = await supabase
            .from('equipment_strategy')
            .select(`
              strategy_id,
              equipment_id,
              strategy_name,
              strategy_type,
              frequency_type,
              frequency_value,
              priority,
              is_active,
              created_at,
              updated_at,
              equipment!inner(equipment_name, equipment_tag, equipment_type_id)
            `)
            .eq('equipment_id', equipmentId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })

          if (error) {
            recordError(error, 'equipment_service.getEquipmentStrategiesByEquipment', 'high')
            throw error
          }

          return strategies || []
        } catch (error) {
          recordError(
            error instanceof Error ? error : new Error(String(error)),
            'equipment_service.getEquipmentStrategiesByEquipment',
            'high'
          )
          throw error
        }
      }
    )
  }

  /**
   * Create new equipment strategy
   */
  async createEquipmentStrategy(strategyData: {
    equipment_id: string
    strategy_name: string
    strategy_type?: string
    frequency_type: string
    frequency_value: number
    priority?: string
    description?: string
  }): Promise<{ success: boolean, strategy_id?: string, error?: string }> {
    return withPerformanceTracking(
      'equipment_service.createEquipmentStrategy',
      async () => {
        try {
          // Validate equipment exists
          const equipment = await this.getEquipmentInfo(strategyData.equipment_id)
          if (!equipment) {
            return { success: false, error: '指定された設備が見つかりません' }
          }

          // Generate strategy ID
          const strategyId = `ES-${strategyData.equipment_id}-${String(Date.now()).slice(-6)}`

          const { data, error } = await supabase
            .from('equipment_strategy')
            .insert({
              strategy_id: strategyId,
              equipment_id: strategyData.equipment_id,
              strategy_name: strategyData.strategy_name,
              strategy_type: strategyData.strategy_type || 'PREVENTIVE',
              frequency_type: strategyData.frequency_type,
              frequency_value: strategyData.frequency_value,
              priority: strategyData.priority || 'MEDIUM',
              description: strategyData.description,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('strategy_id')
            .single()

          if (error) {
            recordError(error, 'equipment_service.createEquipmentStrategy', 'high')
            return { success: false, error: `戦略の作成に失敗しました: ${error.message}` }
          }

          // Invalidate relevant caches
          this.invalidateEquipmentCache(strategyData.equipment_id)

          return { success: true, strategy_id: data?.strategy_id || strategyId }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          recordError(err, 'equipment_service.createEquipmentStrategy', 'high')
          return { success: false, error: `戦略の作成中にエラーが発生しました: ${err.message}` }
        }
      }
    )
  }

  /**
   * Update equipment strategy
   */
  async updateEquipmentStrategy(
    strategyId: string, 
    updates: Partial<{
      strategy_name: string
      frequency_type: string
      frequency_value: number
      priority: string
      description: string
      is_active: boolean
    }>
  ): Promise<{ success: boolean, error?: string }> {
    return withPerformanceTracking(
      'equipment_service.updateEquipmentStrategy',
      async () => {
        try {
          const { data, error } = await supabase
            .from('equipment_strategy')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('strategy_id', strategyId)
            .select('equipment_id')
            .single()

          if (error) {
            recordError(error, 'equipment_service.updateEquipmentStrategy', 'high')
            return { success: false, error: `戦略の更新に失敗しました: ${error.message}` }
          }

          if (!data) {
            return { success: false, error: '指定された戦略が見つかりません' }
          }

          // Invalidate relevant caches
          this.invalidateEquipmentCache(data.equipment_id)

          return { success: true }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          recordError(err, 'equipment_service.updateEquipmentStrategy', 'high')
          return { success: false, error: `戦略の更新中にエラーが発生しました: ${err.message}` }
        }
      }
    )
  }

  /**
   * Delete equipment strategy (soft delete by setting is_active = false)
   */
  async deleteEquipmentStrategy(strategyId: string): Promise<{ success: boolean, error?: string }> {
    return withPerformanceTracking(
      'equipment_service.deleteEquipmentStrategy',
      async () => {
        try {
          const { data, error } = await supabase
            .from('equipment_strategy')
            .update({
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .eq('strategy_id', strategyId)
            .select('equipment_id')
            .single()

          if (error) {
            recordError(error, 'equipment_service.deleteEquipmentStrategy', 'high')
            return { success: false, error: `戦略の削除に失敗しました: ${error.message}` }
          }

          if (!data) {
            return { success: false, error: '指定された戦略が見つかりません' }
          }

          // Invalidate relevant caches
          this.invalidateEquipmentCache(data.equipment_id)

          return { success: true }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          recordError(err, 'equipment_service.deleteEquipmentStrategy', 'high')
          return { success: false, error: `戦略の削除中にエラーが発生しました: ${err.message}` }
        }
      }
    )
  }

  /**
   * Get overdue strategies
   */
  async getOverdueStrategies(): Promise<any[]> {
    return withPerformanceTracking(
      'equipment_service.getOverdueStrategies',
      async () => {
        try {
          const currentDate = new Date().toISOString().split('T')[0]
          
          const { data: strategies, error } = await supabase
            .from('equipment_strategy')
            .select(`
              strategy_id,
              equipment_id,
              strategy_name,
              frequency_type,
              frequency_value,
              priority,
              equipment!inner(設備名, 設備タグ),
              task_generation_log!left(
                generated_date,
                next_generation_date,
                status
              )
            `)
            .eq('is_active', true)
            .order('equipment_id')

          if (error) {
            recordError(error, 'equipment_service.getOverdueStrategies', 'high')
            throw error
          }

          // Filter strategies that are overdue
          const overdueStrategies = (strategies || []).filter(strategy => {
            const lastGeneration = strategy.task_generation_log?.[0]
            if (!lastGeneration) return true // No tasks generated yet

            const nextDue = new Date(lastGeneration.next_generation_date)
            const today = new Date(currentDate)
            
            return nextDue < today
          })

          return overdueStrategies
        } catch (error) {
          recordError(
            error instanceof Error ? error : new Error(String(error)),
            'equipment_service.getOverdueStrategies',
            'high'
          )
          throw error
        }
      }
    )
  }

  /**
   * Get strategy effectiveness metrics
   */
  async getStrategyEffectiveness(equipmentId?: string): Promise<{
    success: boolean
    metrics?: {
      total_strategies: number
      active_strategies: number
      overdue_strategies: number
      completion_rate: number
      avg_frequency_days: number
      strategy_types: { [key: string]: number }
    }
    error?: string
  }> {
    return withPerformanceTracking(
      'equipment_service.getStrategyEffectiveness',
      async () => {
        try {
          let strategyQuery = supabase
            .from('equipment_strategy')
            .select(`
              strategy_id,
              strategy_type,
              frequency_type,
              frequency_value,
              is_active,
              task_generation_log!left(status)
            `)

          if (equipmentId) {
            strategyQuery = strategyQuery.eq('equipment_id', equipmentId)
          }

          const { data: strategies, error } = await strategyQuery

          if (error) {
            recordError(error, 'equipment_service.getStrategyEffectiveness', 'high')
            return { success: false, error: `効果性データの取得に失敗しました: ${error.message}` }
          }

          if (!strategies || strategies.length === 0) {
            return {
              success: true,
              metrics: {
                total_strategies: 0,
                active_strategies: 0,
                overdue_strategies: 0,
                completion_rate: 0,
                avg_frequency_days: 0,
                strategy_types: {}
              }
            }
          }

          // Calculate metrics
          const activeStrategies = strategies.filter(s => s.is_active)
          const overdueStrategies = await this.getOverdueStrategies()
          
          const completedTasks = strategies.reduce((count, strategy) => {
            const completedCount = strategy.task_generation_log?.filter(log => log.status === 'COMPLETED').length || 0
            return count + completedCount
          }, 0)

          const totalTasks = strategies.reduce((count, strategy) => {
            return count + (strategy.task_generation_log?.length || 0)
          }, 0)

          const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

          // Calculate average frequency in days
          const avgFrequencyDays = activeStrategies.reduce((sum, strategy) => {
            let days = strategy.frequency_value
            if (strategy.frequency_type === 'WEEKLY') days *= 7
            else if (strategy.frequency_type === 'MONTHLY') days *= 30
            else if (strategy.frequency_type === 'YEARLY') days *= 365
            return sum + days
          }, 0) / Math.max(activeStrategies.length, 1)

          // Count strategy types
          const strategyTypes: { [key: string]: number } = {}
          activeStrategies.forEach(strategy => {
            const type = strategy.strategy_type || 'UNKNOWN'
            strategyTypes[type] = (strategyTypes[type] || 0) + 1
          })

          return {
            success: true,
            metrics: {
              total_strategies: strategies.length,
              active_strategies: activeStrategies.length,
              overdue_strategies: equipmentId ? 
                overdueStrategies.filter(s => s.equipment_id === equipmentId).length :
                overdueStrategies.length,
              completion_rate: Math.round(completionRate * 100) / 100,
              avg_frequency_days: Math.round(avgFrequencyDays * 100) / 100,
              strategy_types: strategyTypes
            }
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          recordError(err, 'equipment_service.getStrategyEffectiveness', 'high')
          return { success: false, error: `効果性分析中にエラーが発生しました: ${err.message}` }
        }
      }
    )
  }

  /**
   * Get equipment type name by ID (since we no longer use master tables)
   */
  private getEquipmentTypeName(typeId: number): string {
    const equipmentTypes = {
      1: '静機器',
      2: '回転機',
      3: '電気設備',
      4: '計装設備'
    }
    return equipmentTypes[typeId] || 'Unknown'
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return cacheService.getStats()
  }
}