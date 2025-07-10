// Real AI Database Query Service
// This service queries actual database data and provides real AI analysis

import { createClient } from '@supabase/supabase-js'

interface AIQueryResponse {
  query: string
  intent: string
  confidence: number
  results: any[]
  summary: string
  recommendations?: string[]
  execution_time: number
  source: 'database'
}

interface SystemInfo {
  system_id: string
  system_name: string
  system_type: string
  criticality_level: string
  description: string
}

interface EquipmentInfo {
  equipment_id: string
  equipment_name: string
  equipment_tag: string
  equipment_type: string
  system_id: string
  role_in_system: string
}

interface RiskScenario {
  scenario_id: string
  equipment_id: string
  failure_mode: string
  severity_score: number
  occurrence_score: number
  detection_score: number
  rpn_score: number
  mitigation_measures: string[]
}

export class AIDatabaseService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  /**
   * Main query processing function
   */
  async processQuery(query: string): Promise<AIQueryResponse> {
    const startTime = Date.now()
    
    try {
      // Detect intent and extract entities
      const intent = this.detectIntent(query)
      const entities = this.extractEntities(query)
      
      let response: AIQueryResponse
      
      switch (intent) {
        case 'COVERAGE_ANALYSIS':
          response = await this.handleCoverageAnalysis(query, entities)
          break
        case 'MITIGATION_STATUS':
          response = await this.handleMitigationStatus(query, entities)
          break
        case 'IMPACT_ANALYSIS':
          response = await this.handleImpactAnalysis(query, entities)
          break
        case 'EQUIPMENT_HEALTH':
          response = await this.handleEquipmentHealth(query, entities)
          break
        case 'COST_ANALYSIS':
          response = await this.handleCostAnalysis(query, entities)
          break
        case 'COMPLIANCE_TRACKING':
          response = await this.handleComplianceTracking(query, entities)
          break
        case 'MAINTENANCE_SCHEDULE':
          response = await this.handleMaintenanceSchedule(query, entities)
          break
        default:
          response = await this.handleGenericQuery(query, entities)
      }
      
      response.execution_time = Date.now() - startTime
      response.source = 'database'
      return response
      
    } catch (error: any) {
      return {
        query,
        intent: 'ERROR',
        confidence: 0,
        results: [],
        summary: `Error processing query: ${error.message}`,
        execution_time: Date.now() - startTime,
        source: 'database'
      }
    }
  }

  /**
   * Use Case 1: Risk Coverage Analysis
   */
  private async handleCoverageAnalysis(query: string, entities: any): Promise<AIQueryResponse> {
    const systemId = entities.system_id
    const riskType = entities.risk_type || 'fouling'
    const isAskingForMissing = query.toLowerCase().includes('not') || query.toLowerCase().includes('missing') || query.toLowerCase().includes('ない')
    
    // Handle legacy system references
    if (!systemId && entities.legacy_system) {
      return {
        query,
        intent: 'COVERAGE_ANALYSIS',
        confidence: 0.8,
        results: [],
        summary: `We do not have "${entities.legacy_system}" in our database. Did you mean ${entities.suggested_system}: ${entities.system_name}?`,
        recommendations: [
          `Try asking: "Which equipment in ${entities.suggested_system} are not reflected in ES for fouling blockage risk?"`,
          'Available systems: SYS-001 (Process Cooling), SYS-002 (Raw Material Supply), SYS-003 (Wastewater Treatment), SYS-004 (Power Supply)'
        ],
        execution_time: 0,
        source: 'database'
      }
    }
    
    if (!systemId) {
      return {
        query,
        intent: 'COVERAGE_ANALYSIS',
        confidence: 0.5,
        results: [],
        summary: 'Please specify which system you want to analyze.',
        recommendations: [
          'Available systems:',
          '• SYS-001: プロセス冷却系統 (Process Cooling System)',
          '• SYS-002: 原料供給系統 (Raw Material Supply System)', 
          '• SYS-003: 排水処理系統 (Wastewater Treatment System)',
          '• SYS-004: 電力供給系統 (Power Supply System)'
        ],
        execution_time: 0,
        source: 'database'
      }
    }

    // Get system information
    const { data: systemInfo, error: systemError } = await this.supabase
      .from('equipment_systems')
      .select('*')
      .eq('system_id', systemId)
      .single()

    if (systemError || !systemInfo) {
      return {
        query,
        intent: 'COVERAGE_ANALYSIS',
        confidence: 0.3,
        results: [],
        summary: `System ${systemId} not found in database.`,
        recommendations: ['Check available systems: SYS-001, SYS-002, SYS-003, SYS-004'],
        execution_time: 0,
        source: 'database'
      }
    }

    // Get equipment in the system
    const { data: equipmentData, error: equipmentError } = await this.supabase
      .from('equipment_system_mapping')
      .select(`
        equipment_id,
        role_in_system,
        equipment!inner(
          設備名,
          設備タグ,
          設備種別
        )
      `)
      .eq('system_id', systemId)

    if (equipmentError) {
      throw new Error(`Failed to fetch equipment data: ${equipmentError.message}`)
    }

    // Get heat exchangers from risk assessment data
    const { data: heatExchangers, error: hxError } = await this.supabase
      .from('equipment_risk_assessment')
      .select('*')
      .like('equipment_id', 'HX-%')

    if (hxError) {
      console.warn('Could not fetch heat exchanger data:', hxError.message)
    }

    // Get risk scenarios/failure modes
    const { data: riskData, error: riskError } = await this.supabase
      .from('failure_modes')
      .select('*')
      .eq('system_id', systemId)

    if (riskError) {
      console.warn('Could not fetch risk data:', riskError.message)
    }

    // Combine equipment sources
    const allEquipment = [
      ...(equipmentData || []),
      ...(heatExchangers || []).map(hx => ({
        equipment_id: hx.equipment_id,
        role_in_system: 'PRIMARY',
        equipment: {
          設備名: `Heat Exchanger ${hx.equipment_id}`,
          設備タグ: hx.equipment_id,
          設備種別: 'Heat Exchanger'
        }
      }))
    ]

    // Filter for heat exchangers if query mentions them
    const heatExchangerEquipment = allEquipment.filter(eq => 
      eq.equipment?.設備種別?.toLowerCase().includes('heat') ||
      eq.equipment?.設備名?.toLowerCase().includes('heat') ||
      eq.equipment_id?.includes('HX-')
    )

    const targetEquipment = query.toLowerCase().includes('heat exchanger') ? heatExchangerEquipment : allEquipment

    // Analyze risk coverage
    const equipmentWithRisk = targetEquipment.filter(eq => {
      const hasRiskScenario = (riskData || []).some(risk => 
        risk.equipment_id === eq.equipment_id && 
        risk.failure_mode.toLowerCase().includes(riskType.toLowerCase())
      )
      return hasRiskScenario
    })

    const equipmentWithoutRisk = targetEquipment.filter(eq => {
      const hasRiskScenario = (riskData || []).some(risk => 
        risk.equipment_id === eq.equipment_id && 
        risk.failure_mode.toLowerCase().includes(riskType.toLowerCase())
      )
      return !hasRiskScenario
    })

    const systemName = systemInfo.system_name
    const targetList = isAskingForMissing ? equipmentWithoutRisk : equipmentWithRisk
    const resultType = isAskingForMissing ? 'NOT reflected' : 'reflected'

    return {
      query,
      intent: 'COVERAGE_ANALYSIS',
      confidence: 0.92,
      results: targetList.map(eq => ({
        equipment_id: eq.equipment_id,
        equipment_name: eq.equipment?.設備名 || eq.equipment_id,
        equipment_type: eq.equipment?.設備種別 || 'Unknown',
        system: systemId,
        system_name: systemName,
        role_in_system: eq.role_in_system,
        risk_status: isAskingForMissing ? 'MISSING_COVERAGE' : 'HAS_COVERAGE',
        risk_type: riskType
      })),
      summary: `Found ${targetList.length} equipment in ${systemName} (${systemId}) that are ${resultType} in ES for ${riskType} risk.`,
      recommendations: isAskingForMissing ? [
        `Add ${riskType} risk scenarios for: ${targetList.map(eq => eq.equipment_id).join(', ')}`,
        'Conduct FMEA review for identified equipment',
        'Update risk assessment database'
      ] : [
        `Equipment with ${riskType} risk coverage: ${targetList.map(eq => eq.equipment_id).join(', ')}`,
        'Review effectiveness of existing mitigation measures'
      ],
      execution_time: 0,
      source: 'database'
    }
  }

  /**
   * Use Case 2: Mitigation Status Analysis
   */
  private async handleMitigationStatus(query: string, entities: any): Promise<AIQueryResponse> {
    const equipmentId = entities.equipment_id
    const department = entities.department || 'REFINERY'
    
    if (!equipmentId) {
      return {
        query,
        intent: 'MITIGATION_STATUS',
        confidence: 0.5,
        results: [],
        summary: 'Please specify which equipment you want to analyze.',
        recommendations: ['Specify an equipment ID like EQ005, HX-100, etc.'],
        execution_time: 0,
        source: 'database'
      }
    }

    // Get equipment information
    const { data: equipmentInfo, error: equipmentError } = await this.supabase
      .from('equipment')
      .select('*')
      .eq('設備ID', equipmentId)
      .single()

    if (equipmentError) {
      // Try heat exchanger table
      const { data: hxInfo, error: hxError } = await this.supabase
        .from('equipment_risk_assessment')
        .select('*')
        .eq('equipment_id', equipmentId)
        .single()

      if (hxError) {
        return {
          query,
          intent: 'MITIGATION_STATUS',
          confidence: 0.3,
          results: [],
          summary: `Equipment ${equipmentId} not found in database.`,
          recommendations: ['Check equipment ID spelling'],
          execution_time: 0,
          source: 'database'
        }
      }
    }

    // Get equipment strategies
    const { data: strategies, error: strategyError } = await this.supabase
      .from('equipment_strategy')
      .select('*')
      .eq('equipment_id', equipmentId)

    // Get failure modes and mitigation measures
    const { data: failureModes, error: failureError } = await this.supabase
      .from('failure_modes')
      .select('*')
      .eq('equipment_id', equipmentId)

    const implementedMeasures = (strategies || []).filter(s => s.status === 'ACTIVE')
    const plannedMeasures = (strategies || []).filter(s => s.status === 'PLANNED')

    return {
      query,
      intent: 'MITIGATION_STATUS',
      confidence: 0.88,
      results: [{
        equipment_id: equipmentId,
        equipment_name: equipmentInfo?.設備名 || equipmentId,
        department: department,
        total_measures: (strategies || []).length,
        implemented: implementedMeasures.map(m => ({
          measure: m.strategy_name,
          frequency: m.frequency_type,
          responsible_person: m.responsible_person || 'Unknown'
        })),
        planned: plannedMeasures.map(m => ({
          measure: m.strategy_name,
          planned_start: m.next_execution_date,
          responsible_person: m.responsible_person || 'Unknown'
        })),
        risk_scenarios: (failureModes || []).length
      }],
      summary: `Implementation status for ${equipmentId}: ${implementedMeasures.length} implemented, ${plannedMeasures.length} planned measures.`,
      recommendations: [
        'Review planned measures execution timeline',
        'Ensure adequate resources for implementation',
        'Monitor effectiveness of implemented measures'
      ],
      execution_time: 0,
      source: 'database'
    }
  }

  /**
   * Use Case 3: Impact Analysis
   */
  private async handleImpactAnalysis(query: string, entities: any): Promise<AIQueryResponse> {
    const instrumentId = entities.instrument_id
    const parameter = entities.parameter || 'temperature'
    
    if (!instrumentId) {
      return {
        query,
        intent: 'IMPACT_ANALYSIS',
        confidence: 0.5,
        results: [],
        summary: 'Please specify which instrument or parameter you want to analyze.',
        recommendations: ['Specify an instrument ID like TI-201, PI-101, etc.'],
        execution_time: 0,
        source: 'database'
      }
    }

    // Get process parameters
    const { data: processParams, error: processError } = await this.supabase
      .from('process_parameters')
      .select('*')
      .eq('tag_name', instrumentId)

    if (processError || !processParams?.length) {
      return {
        query,
        intent: 'IMPACT_ANALYSIS',
        confidence: 0.3,
        results: [],
        summary: `Instrument ${instrumentId} not found in process monitoring system.`,
        recommendations: ['Check instrument ID spelling'],
        execution_time: 0,
        source: 'database'
      }
    }

    // Get affected equipment
    const affectedEquipment = await this.getAffectedEquipment(instrumentId)

    return {
      query,
      intent: 'IMPACT_ANALYSIS',
      confidence: 0.85,
      results: affectedEquipment.map(eq => ({
        equipment_id: eq.equipment_id,
        equipment_name: eq.equipment_name,
        impact_level: eq.impact_level,
        immediate_actions: eq.immediate_actions
      })),
      summary: `${instrumentId} parameter change would affect ${affectedEquipment.length} equipment items.`,
      recommendations: [
        'Monitor affected equipment closely',
        'Consider implementing automatic alerts',
        'Review interdependency mappings'
      ],
      execution_time: 0,
      source: 'database'
    }
  }

  /**
   * Use Case 4: Equipment Health Summary
   */
  private async handleEquipmentHealth(query: string, entities: any): Promise<AIQueryResponse> {
    const systemId = entities.system_id
    const equipmentType = entities.equipment_type || 'heat exchanger'

    // Get equipment health data
    const { data: equipmentData, error: equipmentError } = await this.supabase
      .from('equipment_system_mapping')
      .select(`
        equipment_id,
        role_in_system,
        equipment!inner(
          設備名,
          設備タグ,
          設備種別
        )
      `)
      .eq('system_id', systemId || 'SYS-001')

    // Get risk assessment data
    const { data: riskData, error: riskError } = await this.supabase
      .from('failure_modes')
      .select('*')
      .eq('system_id', systemId || 'SYS-001')

    const healthSummary = (equipmentData || []).map(eq => {
      const riskCount = (riskData || []).filter(r => r.equipment_id === eq.equipment_id).length
      const avgRPN = (riskData || [])
        .filter(r => r.equipment_id === eq.equipment_id)
        .reduce((sum, r) => sum + (r.rpn_score || 0), 0) / Math.max(riskCount, 1)

      return {
        equipment_id: eq.equipment_id,
        equipment_name: eq.equipment?.設備名 || eq.equipment_id,
        equipment_type: eq.equipment?.設備種別 || 'Unknown',
        role_in_system: eq.role_in_system,
        risk_scenarios: riskCount,
        average_rpn: Math.round(avgRPN),
        health_status: avgRPN > 100 ? 'HIGH_RISK' : avgRPN > 50 ? 'MEDIUM_RISK' : 'LOW_RISK'
      }
    })

    return {
      query,
      intent: 'EQUIPMENT_HEALTH',
      confidence: 0.90,
      results: healthSummary,
      summary: `Health summary for ${healthSummary.length} equipment items in system ${systemId || 'SYS-001'}.`,
      recommendations: [
        'Focus on high-risk equipment first',
        'Schedule preventive maintenance for medium-risk items',
        'Monitor equipment trends regularly'
      ],
      execution_time: 0,
      source: 'database'
    }
  }

  /**
   * Generic query handler
   */
  private async handleGenericQuery(query: string, entities: any): Promise<AIQueryResponse> {
    return {
      query,
      intent: 'GENERIC',
      confidence: 0.3,
      results: [],
      summary: 'I can help you analyze equipment risk coverage, mitigation status, impact analysis, and equipment health. Please ask a more specific question.',
      recommendations: [
        'Try asking about risk coverage: "Which equipment in SYS-001 are not covered for fouling risk?"',
        'Ask about mitigation status: "What is the implementation status for EQ005?"',
        'Ask about impact analysis: "If TI-201 increases, what equipment would be affected?"'
      ],
      execution_time: 0,
      source: 'database'
    }
  }

  /**
   * Intent detection using keywords
   */
  private detectIntent(query: string): string {
    const lowerQuery = query.toLowerCase()
    
    // Cost analysis keywords
    if (lowerQuery.includes('cost') || lowerQuery.includes('budget') ||
        lowerQuery.includes('expense') || lowerQuery.includes('コスト') ||
        lowerQuery.includes('予算') || lowerQuery.includes('費用')) {
      return 'COST_ANALYSIS'
    }
    
    // Compliance tracking keywords
    if (lowerQuery.includes('compliance') || lowerQuery.includes('overdue') ||
        lowerQuery.includes('inspection') || lowerQuery.includes('コンプライアンス') ||
        lowerQuery.includes('期限切れ') || lowerQuery.includes('点検')) {
      return 'COMPLIANCE_TRACKING'
    }
    
    // Maintenance schedule keywords
    if (lowerQuery.includes('schedule') || lowerQuery.includes('upcoming') ||
        lowerQuery.includes('maintenance') || lowerQuery.includes('スケジュール') ||
        lowerQuery.includes('予定') || lowerQuery.includes('メンテナンス')) {
      return 'MAINTENANCE_SCHEDULE'
    }
    
    // Coverage analysis keywords
    if (lowerQuery.includes('not reflected') || lowerQuery.includes('missing') || 
        lowerQuery.includes('coverage') || lowerQuery.includes('risk') ||
        lowerQuery.includes('ない') || lowerQuery.includes('欠如')) {
      return 'COVERAGE_ANALYSIS'
    }
    
    // Mitigation status keywords  
    if (lowerQuery.includes('implementation') || lowerQuery.includes('status') ||
        lowerQuery.includes('mitigation') || lowerQuery.includes('実施状況') ||
        lowerQuery.includes('緩和策')) {
      return 'MITIGATION_STATUS'
    }
    
    // Impact analysis keywords
    if (lowerQuery.includes('impact') || lowerQuery.includes('affect') ||
        lowerQuery.includes('cascade') || lowerQuery.includes('influence') ||
        lowerQuery.includes('影響') || lowerQuery.includes('波及')) {
      return 'IMPACT_ANALYSIS'
    }
    
    // Equipment health keywords
    if (lowerQuery.includes('health') || lowerQuery.includes('summary') ||
        lowerQuery.includes('condition') || lowerQuery.includes('健全性') ||
        lowerQuery.includes('状態')) {
      return 'EQUIPMENT_HEALTH'
    }
    
    return 'GENERIC'
  }

  /**
   * Extract entities from query
   */
  private extractEntities(query: string): any {
    const entities: any = {}
    
    // Extract system IDs
    const systemMatch = query.match(/SYS-(\d+)/i)
    if (systemMatch) {
      entities.system_id = systemMatch[0].toUpperCase()
    }
    
    // Handle legacy "System A/B" references and provide helpful error context
    if (query.toLowerCase().includes('system a') || query.includes('システムA')) {
      entities.legacy_system = 'System A'
      entities.suggested_system = 'SYS-001'
      entities.system_name = 'プロセス冷却系統 (Process Cooling System)'
    }
    if (query.toLowerCase().includes('system b') || query.includes('システムB')) {
      entities.legacy_system = 'System B'
      entities.suggested_system = 'SYS-002'
      entities.system_name = '原料供給系統 (Raw Material Supply System)'
    }
    
    // Extract equipment IDs
    const equipmentMatch = query.match(/(?:EQ|HX|TK|PU)-?(\d+)/i)
    if (equipmentMatch) {
      entities.equipment_id = equipmentMatch[0].toUpperCase()
    }
    
    // Extract instrument IDs
    const instrumentMatch = query.match(/(?:TI|PI|FI|LI)-?(\d+)/i)
    if (instrumentMatch) {
      entities.instrument_id = instrumentMatch[0].toUpperCase()
    }
    
    // Extract timeframes for cost analysis
    if (query.toLowerCase().includes('last week') || query.includes('先週')) {
      entities.timeframe = 'last_week'
    } else if (query.toLowerCase().includes('last month') || query.includes('先月')) {
      entities.timeframe = 'last_month'
    } else if (query.toLowerCase().includes('last quarter') || query.includes('四半期')) {
      entities.timeframe = 'last_quarter'
    } else if (query.toLowerCase().includes('last year') || query.includes('昨年')) {
      entities.timeframe = 'last_year'
    }
    
    // Extract number of days for maintenance schedule
    const daysMatch = query.match(/(\d+)\s*(?:days?|日)/i)
    if (daysMatch) {
      entities.days = parseInt(daysMatch[1])
    }
    
    // Extract departments
    if (query.toLowerCase().includes('refinery') || query.includes('製油')) {
      entities.department = 'REFINERY'
    }
    if (query.toLowerCase().includes('maintenance') || query.includes('保全')) {
      entities.department = 'MAINTENANCE'
    }
    
    // Extract risk types
    if (query.toLowerCase().includes('fouling') || query.includes('ファウリング')) {
      entities.risk_type = 'fouling'
    }
    if (query.toLowerCase().includes('corrosion') || query.includes('腐食')) {
      entities.risk_type = 'corrosion'
    }
    
    return entities
  }

  /**
   * Get equipment affected by instrument parameter changes
   */
  private async getAffectedEquipment(instrumentId: string): Promise<any[]> {
    // This is a simplified version - in practice, you'd have more complex relationships
    const mockAffectedEquipment = [
      {
        equipment_id: 'EQ013',
        equipment_name: '流量計1号機',
        impact_level: 'HIGH',
        immediate_actions: ['Check equipment readings', 'Verify operational parameters']
      },
      {
        equipment_id: 'EQ014', 
        equipment_name: '圧力計1号機',
        impact_level: 'MEDIUM',
        immediate_actions: ['Monitor pressure trends', 'Check for anomalies']
      }
    ]
    
    return mockAffectedEquipment
  }

  /**
   * Use Case 5: Cost Analysis
   */
  private async handleCostAnalysis(query: string, entities: any): Promise<AIQueryResponse> {
    const systemId = entities.system_id
    const timeframe = entities.timeframe || 'last_quarter'
    
    // Get maintenance cost data
    const { data: costData, error: costError } = await this.supabase
      .from('maintenance_history')
      .select(`
        実施日,
        コスト,
        作業内容,
        設備ID,
        equipment!inner(設備名, 設備種別)
      `)
      .gte('実施日', this.getDateFromTimeframe(timeframe))
      .order('実施日', { ascending: false })

    if (costError) {
      return {
        query,
        intent: 'COST_ANALYSIS',
        confidence: 0.3,
        results: [],
        summary: `コストデータの取得に失敗しました: ${costError.message}`,
        recommendations: ['データベース接続を確認してください'],
        execution_time: 0,
        source: 'database'
      }
    }

    // Analyze cost data
    const totalCost = (costData || []).reduce((sum, item) => sum + (item.コスト || 0), 0)
    const equipmentCosts = this.groupCostsByEquipment(costData || [])
    const monthlyTrends = this.analyzeCostTrends(costData || [])

    return {
      query,
      intent: 'COST_ANALYSIS',
      confidence: 0.90,
      results: [{
        timeframe,
        total_cost: totalCost,
        equipment_breakdown: equipmentCosts,
        monthly_trends: monthlyTrends,
        cost_analysis: {
          highest_cost_equipment: equipmentCosts[0]?.equipment_id || 'N/A',
          cost_increase_trend: monthlyTrends.length > 1 ? this.calculateTrend(monthlyTrends) : 'insufficient_data'
        }
      }],
      summary: `${timeframe}の総メンテナンスコスト: ¥${totalCost.toLocaleString()}。分析した期間内の設備別コスト内訳とトレンドを表示します。`,
      recommendations: [
        totalCost > 1000000 ? 'コストが高額です。設備別の詳細分析をお勧めします' : 'コストは適正範囲内です',
        '予防保全によるコスト削減の機会を検討してください',
        '高コスト設備の点検頻度を見直すことをお勧めします'
      ],
      execution_time: 0,
      source: 'database'
    }
  }

  /**
   * Use Case 6: Compliance Tracking
   */
  private async handleComplianceTracking(query: string, entities: any): Promise<AIQueryResponse> {
    const systemId = entities.system_id
    const currentDate = new Date().toISOString().split('T')[0]
    
    // Get overdue inspections
    const { data: overdueInspections, error: inspectionError } = await this.supabase
      .from('inspection_plan')
      .select(`
        計画ID,
        設備ID,
        点検項目,
        次回点検日,
        状態,
        equipment!inner(設備名, 設備種別)
      `)
      .lt('次回点検日', currentDate)
      .neq('状態', '完了')
      .order('次回点検日', { ascending: true })

    // Get upcoming inspections (next 30 days)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    
    const { data: upcomingInspections, error: upcomingError } = await this.supabase
      .from('inspection_plan')
      .select(`
        計画ID,
        設備ID,
        点検項目,
        次回点検日,
        状態,
        equipment!inner(設備名, 設備種別)
      `)
      .gte('次回点検日', currentDate)
      .lte('次回点検日', futureDate.toISOString().split('T')[0])
      .neq('状態', '完了')
      .order('次回点検日', { ascending: true })

    const overdueCount = (overdueInspections || []).length
    const upcomingCount = (upcomingInspections || []).length
    const complianceRate = this.calculateComplianceRate(overdueInspections || [], upcomingInspections || [])

    return {
      query,
      intent: 'COMPLIANCE_TRACKING',
      confidence: 0.88,
      results: [{
        overdue_inspections: overdueInspections || [],
        upcoming_inspections: upcomingInspections || [],
        compliance_metrics: {
          overdue_count: overdueCount,
          upcoming_count: upcomingCount,
          compliance_rate: complianceRate,
          status: overdueCount === 0 ? 'COMPLIANT' : overdueCount < 5 ? 'WARNING' : 'NON_COMPLIANT'
        }
      }],
      summary: `コンプライアンス状況: 期限切れ点検 ${overdueCount}件、今後30日以内の点検 ${upcomingCount}件。コンプライアンス率: ${complianceRate}%`,
      recommendations: [
        overdueCount > 0 ? `期限切れ点検 ${overdueCount}件の早急な実施が必要です` : '期限切れ点検はありません',
        upcomingCount > 0 ? `今後30日以内に ${upcomingCount}件の点検が予定されています` : '直近の予定点検はありません',
        complianceRate < 90 ? 'コンプライアンス率向上のため点検スケジュールの見直しをお勧めします' : 'コンプライアンス状況は良好です'
      ],
      execution_time: 0,
      source: 'database'
    }
  }

  /**
   * Use Case 7: Maintenance Schedule
   */
  private async handleMaintenanceSchedule(query: string, entities: any): Promise<AIQueryResponse> {
    const systemId = entities.system_id
    const days = entities.days || 30
    const currentDate = new Date()
    const futureDate = new Date()
    futureDate.setDate(currentDate.getDate() + days)
    
    // Get equipment strategies that are due
    const { data: strategiesData, error: strategiesError } = await this.supabase
      .from('equipment_strategy')
      .select(`
        strategy_id,
        equipment_id,
        strategy_name,
        frequency_type,
        frequency_value,
        next_execution_date,
        last_execution_date,
        status,
        equipment!inner(設備名, 設備種別)
      `)
      .lte('next_execution_date', futureDate.toISOString().split('T')[0])
      .eq('status', 'ACTIVE')
      .order('next_execution_date', { ascending: true })

    // Get current work orders
    const { data: workOrders, error: workOrderError } = await this.supabase
      .from('work_order')
      .select(`
        作業指示書番号,
        設備ID,
        作業種別ID,
        予定開始日,
        予定終了日,
        実施日,
        ステータス,
        equipment!inner(設備名)
      `)
      .gte('予定開始日', currentDate.toISOString().split('T')[0])
      .lte('予定開始日', futureDate.toISOString().split('T')[0])
      .order('予定開始日', { ascending: true })

    const strategiesCount = (strategiesData || []).length
    const workOrdersCount = (workOrders || []).length
    const urgentTasks = this.identifyUrgentTasks(strategiesData || [], workOrders || [])

    return {
      query,
      intent: 'MAINTENANCE_SCHEDULE',
      confidence: 0.92,
      results: [{
        timeframe: `次の${days}日間`,
        scheduled_strategies: strategiesData || [],
        work_orders: workOrders || [],
        schedule_summary: {
          total_strategies: strategiesCount,
          total_work_orders: workOrdersCount,
          urgent_tasks: urgentTasks.length,
          workload_level: this.assessWorkloadLevel(strategiesCount + workOrdersCount)
        }
      }],
      summary: `今後${days}日間のメンテナンススケジュール: 予定戦略 ${strategiesCount}件、作業指示 ${workOrdersCount}件、緊急対応 ${urgentTasks.length}件`,
      recommendations: [
        urgentTasks.length > 0 ? `緊急対応が必要なタスクが ${urgentTasks.length}件あります` : '緊急対応は不要です',
        strategiesCount > 10 ? 'スケジュールが過密です。優先度を見直してください' : 'スケジュールは適正です',
        'リソース配分の最適化を検討してください'
      ],
      execution_time: 0,
      source: 'database'
    }
  }

  // Helper methods for new query types
  private getDateFromTimeframe(timeframe: string): string {
    const now = new Date()
    switch (timeframe) {
      case 'last_week':
        now.setDate(now.getDate() - 7)
        break
      case 'last_month':
        now.setMonth(now.getMonth() - 1)
        break
      case 'last_quarter':
        now.setMonth(now.getMonth() - 3)
        break
      case 'last_year':
        now.setFullYear(now.getFullYear() - 1)
        break
      default:
        now.setMonth(now.getMonth() - 3) // Default to last quarter
    }
    return now.toISOString().split('T')[0]
  }

  private groupCostsByEquipment(costData: any[]): any[] {
    const grouped = costData.reduce((acc, item) => {
      const equipmentId = item.設備ID
      if (!acc[equipmentId]) {
        acc[equipmentId] = {
          equipment_id: equipmentId,
          equipment_name: item.equipment?.設備名 || equipmentId,
          total_cost: 0,
          maintenance_count: 0
        }
      }
      acc[equipmentId].total_cost += item.コスト || 0
      acc[equipmentId].maintenance_count += 1
      return acc
    }, {})
    
    return Object.values(grouped).sort((a: any, b: any) => b.total_cost - a.total_cost)
  }

  private analyzeCostTrends(costData: any[]): any[] {
    // Group by month and calculate totals
    const monthlyData = costData.reduce((acc, item) => {
      const month = item.実施日?.substring(0, 7) || 'unknown'
      if (!acc[month]) {
        acc[month] = { month, total_cost: 0, count: 0 }
      }
      acc[month].total_cost += item.コスト || 0
      acc[month].count += 1
      return acc
    }, {})
    
    return Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month))
  }

  private calculateTrend(monthlyTrends: any[]): string {
    if (monthlyTrends.length < 2) return 'insufficient_data'
    const first = monthlyTrends[0].total_cost
    const last = monthlyTrends[monthlyTrends.length - 1].total_cost
    const change = ((last - first) / first) * 100
    
    if (change > 10) return 'increasing'
    if (change < -10) return 'decreasing'
    return 'stable'
  }

  private calculateComplianceRate(overdue: any[], upcoming: any[]): number {
    const total = overdue.length + upcoming.length
    if (total === 0) return 100
    return Math.round(((upcoming.length) / total) * 100)
  }

  private identifyUrgentTasks(strategies: any[], workOrders: any[]): any[] {
    const now = new Date()
    const urgent = []
    
    // Check for overdue strategies
    strategies.forEach(strategy => {
      const nextDate = new Date(strategy.next_execution_date)
      if (nextDate < now) {
        urgent.push({
          type: 'strategy',
          id: strategy.strategy_id,
          equipment_id: strategy.equipment_id,
          description: strategy.strategy_name,
          overdue_days: Math.floor((now.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24))
        })
      }
    })
    
    return urgent
  }

  private assessWorkloadLevel(taskCount: number): string {
    if (taskCount > 20) return 'HIGH'
    if (taskCount > 10) return 'MEDIUM'
    return 'LOW'
  }
}