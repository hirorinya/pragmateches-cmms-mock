/**
 * AI Service for CMMS queries - Database-first approach
 * This service replaces the mock-based approach with real database queries
 */

import { EquipmentService } from './equipment-service'
import { withPerformanceTracking, recordError } from '@/lib/monitoring-service'

interface AIQueryResponse {
  query: string
  intent: string
  confidence: number
  results: any[]
  summary: string
  recommendations?: string[]
  execution_time: number
  source: 'database' | 'ai' | 'hybrid'
}

export class AIService {
  private equipmentService: EquipmentService

  constructor() {
    this.equipmentService = new EquipmentService()
  }

  /**
   * Main query processing function - Database first approach
   */
  async processQuery(query: string): Promise<AIQueryResponse> {
    return withPerformanceTracking(
      'ai_service.processQuery',
      async () => {
        const startTime = Date.now()
        
        try {
          // Detect intent from query
          const intent = this.detectIntent(query)
          const entities = this.extractEntities(query)
          
          let response: AIQueryResponse
          
          switch (intent) {
            case 'MAINTENANCE_HISTORY':
              response = await this.handleMaintenanceHistory(query, entities)
              break
            case 'EQUIPMENT_INFO':
              response = await this.handleEquipmentInfo(query, entities)
              break
            case 'SYSTEM_LIST':
              response = await this.handleSystemList(query, entities)
              break
            case 'THICKNESS_MEASUREMENT':
              response = await this.handleThicknessMeasurement(query, entities)
              break
            case 'COVERAGE_ANALYSIS':
              response = await this.handleCoverageAnalysis(query, entities)
              break
            case 'MITIGATION_STATUS':
              response = await this.handleMitigationStatus(query, entities)
              break
            default:
              response = this.handleUnknownQuery(query)
          }
          
          response.execution_time = Date.now() - startTime
          return response
          
        } catch (error) {
          recordError(
            error instanceof Error ? error : new Error(String(error)),
            'ai_service.processQuery',
            'high',
            { query }
          )
          
          return {
            query,
            intent: 'ERROR',
            confidence: 0,
            results: [],
            summary: 'An error occurred while processing your query. Please try again.',
            execution_time: Date.now() - startTime,
            source: 'database'
          }
        }
      },
      { query }
    )
  }

  /**
   * Handle equipment information queries
   */
  private async handleEquipmentInfo(query: string, entities: any): Promise<AIQueryResponse> {
    const equipmentId = entities.equipment
    
    if (!equipmentId) {
      return {
        query,
        intent: 'EQUIPMENT_INFO',
        confidence: 0.3,
        results: [],
        summary: 'Please specify an equipment ID (e.g., HX-101, PU-100, TK-101)',
        source: 'database'
      }
    }

    const equipmentInfo = await this.equipmentService.getEquipmentInfo(equipmentId)
    
    if (!equipmentInfo) {
      return {
        query,
        intent: 'EQUIPMENT_INFO',
        confidence: 0.5,
        results: [],
        summary: `Equipment ${equipmentId} not found in database`,
        recommendations: ['Check the equipment ID format', 'Verify the equipment exists'],
        source: 'database'
      }
    }

    return {
      query,
      intent: 'EQUIPMENT_INFO',
      confidence: 0.95,
      results: [equipmentInfo],
      summary: `Equipment ${equipmentId} information retrieved from database`,
      recommendations: [
        `Equipment is currently ${equipmentInfo.status}`,
        equipmentInfo.next_inspection ? `Next inspection: ${equipmentInfo.next_inspection}` : 'Schedule next inspection',
        equipmentInfo.risk_level ? `Risk level: ${equipmentInfo.risk_level}` : 'Review risk assessment'
      ],
      source: 'database'
    }
  }

  /**
   * Handle maintenance history queries
   */
  private async handleMaintenanceHistory(query: string, entities: any): Promise<AIQueryResponse> {
    const q = query.toLowerCase()
    
    // Extract time period from query
    let days = 365 // Default to 1 year
    if (q.includes('1年') || q.includes('1 year')) {
      days = 365
    } else if (q.includes('6ヶ月') || q.includes('6 month')) {
      days = 180
    } else if (q.includes('3ヶ月') || q.includes('3 month')) {
      days = 90
    } else if (q.includes('1ヶ月') || q.includes('1 month')) {
      days = 30
    }

    try {
      // Use the existing maintenance API
      const response = await fetch(`http://localhost:3000/api/maintenance/recent-equipment?days=${days}`)
      const maintenanceData = await response.json()

      if (!maintenanceData.success) {
        return {
          query,
          intent: 'MAINTENANCE_HISTORY',
          confidence: 0.5,
          results: [],
          summary: 'メンテナンス履歴の取得に失敗しました',
          source: 'database'
        }
      }

      const equipmentCount = maintenanceData.summary.totalEquipmentWithMaintenance
      const maintenanceCount = maintenanceData.summary.totalMaintenanceRecords
      const cutoffDate = maintenanceData.summary.cutoffDate

      // Create Japanese summary
      const isJapanese = /[ひらがなカタカナ漢字]/.test(query)
      const summary = isJapanese 
        ? `${cutoffDate}以降（直近${Math.floor(days/30)}ヶ月間）で保全行為を実施した機器は${equipmentCount}台です。合計${maintenanceCount}件のメンテナンス記録があります。`
        : `Found ${equipmentCount} equipment with maintenance in the last ${days} days (since ${cutoffDate}). Total ${maintenanceCount} maintenance records.`

      const recommendations = []
      if (equipmentCount === 0) {
        recommendations.push(isJapanese 
          ? '指定期間内にメンテナンス記録がありません。保全スケジュールの確認をお勧めします。'
          : 'No maintenance records found in the specified period. Consider reviewing maintenance schedules.')
      } else {
        recommendations.push(isJapanese
          ? `最新のメンテナンス: ${maintenanceData.data[0]?.最新メンテナンス日 || 'N/A'}`
          : `Latest maintenance: ${maintenanceData.data[0]?.最新メンテナンス日 || 'N/A'}`)
        recommendations.push(isJapanese
          ? '定期的なメンテナンススケジュールの継続を推奨します'
          : 'Continue regular maintenance schedule as planned')
      }

      return {
        query,
        intent: 'MAINTENANCE_HISTORY',
        confidence: 0.95,
        results: maintenanceData.data,
        summary,
        recommendations,
        source: 'database'
      }

    } catch (error) {
      return {
        query,
        intent: 'MAINTENANCE_HISTORY',
        confidence: 0.3,
        results: [],
        summary: 'メンテナンス履歴の取得中にエラーが発生しました',
        recommendations: ['データベース接続を確認してください'],
        source: 'database'
      }
    }
  }

  /**
   * Handle system list queries
   */
  private async handleSystemList(query: string, entities: any): Promise<AIQueryResponse> {
    const systems = await this.equipmentService.getAllSystems()
    
    return {
      query,
      intent: 'SYSTEM_LIST',
      confidence: 0.98,
      results: systems,
      summary: `Found ${systems.length} systems in the facility`,
      recommendations: [
        'All facility systems listed with current equipment counts',
        'Critical systems should be monitored closely'
      ],
      source: 'database'
    }
  }

  /**
   * Handle thickness measurement queries
   */
  private async handleThicknessMeasurement(query: string, entities: any): Promise<AIQueryResponse> {
    const equipmentId = entities.equipment
    
    if (!equipmentId) {
      return {
        query,
        intent: 'THICKNESS_MEASUREMENT',
        confidence: 0.3,
        results: [],
        summary: 'Please specify an equipment ID for thickness measurement data',
        source: 'database'
      }
    }

    const thicknessData = await this.equipmentService.getThicknessMeasurements(equipmentId)
    
    if (!thicknessData) {
      return {
        query,
        intent: 'THICKNESS_MEASUREMENT',
        confidence: 0.5,
        results: [],
        summary: `No thickness measurement data found for ${equipmentId}`,
        recommendations: ['Verify equipment ID', 'Check if thickness measurements exist'],
        source: 'database'
      }
    }

    return {
      query,
      intent: 'THICKNESS_MEASUREMENT',
      confidence: 0.92,
      results: [thicknessData],
      summary: `Thickness measurement data for ${equipmentId}: ${thicknessData.measurement_points.length} points measured`,
      recommendations: [
        thicknessData.recommendation,
        'Continue monitoring thickness trends',
        'Schedule maintenance if approaching minimum thickness'
      ],
      source: 'database'
    }
  }

  /**
   * Handle coverage analysis queries (placeholder - would need risk assessment data)
   */
  private async handleCoverageAnalysis(query: string, entities: any): Promise<AIQueryResponse> {
    // This would require integration with risk assessment and failure mode tables
    // For now, return a placeholder that indicates database integration needed
    
    return {
      query,
      intent: 'COVERAGE_ANALYSIS',
      confidence: 0.1,
      results: [],
      summary: 'Coverage analysis requires risk assessment database integration',
      recommendations: [
        'Implement risk assessment table queries',
        'Connect to failure mode database',
        'Add Equipment Strategy integration'
      ],
      source: 'database'
    }
  }

  /**
   * Handle mitigation status queries (placeholder - would need strategy data)
   */
  private async handleMitigationStatus(query: string, entities: any): Promise<AIQueryResponse> {
    // This would require integration with equipment strategy and mitigation tables
    // For now, return a placeholder that indicates database integration needed
    
    return {
      query,
      intent: 'MITIGATION_STATUS',
      confidence: 0.1,
      results: [],
      summary: 'Mitigation status analysis requires Equipment Strategy database integration',
      recommendations: [
        'Implement equipment strategy table queries',
        'Connect to mitigation measures database',
        'Add responsible person lookups'
      ],
      source: 'database'
    }
  }

  /**
   * Handle unknown queries
   */
  private handleUnknownQuery(query: string): AIQueryResponse {
    return {
      query,
      intent: 'UNKNOWN',
      confidence: 0.1,
      results: [],
      summary: 'Query not recognized. Available queries: equipment info, system list, thickness measurements',
      recommendations: [
        'Try asking about specific equipment (e.g., "HX-101 information")',
        'Ask for system list ("list all systems")',
        'Request thickness data ("TK-101 thickness measurements")'
      ],
      source: 'database'
    }
  }

  /**
   * Intent detection based on keywords
   */
  private detectIntent(query: string): string {
    const q = query.toLowerCase()
    
    // Maintenance history queries (Japanese and English)
    if (q.includes('保全') || q.includes('メンテナンス') || q.includes('maintenance') ||
        q.includes('直近') || q.includes('recent') || q.includes('last') ||
        (q.includes('年') && (q.includes('保全') || q.includes('メンテナンス'))) ||
        q.includes('maintenance history')) {
      return 'MAINTENANCE_HISTORY'
    }
    
    // Equipment info queries
    if ((q.includes('manufacturer') || q.includes('メーカー') || 
         q.includes('info') || q.includes('status') || q.includes('状況') ||
         q.includes('details') || q.includes('詳細')) && 
        this.hasEquipmentId(query)) {
      return 'EQUIPMENT_INFO'
    }
    
    // System list queries
    if (q.includes('list') && (q.includes('system') || q.includes('システム')) ||
        q.includes('systems') || q.includes('システム一覧') ||
        q.includes('name of system') || q.includes('システムの名前')) {
      return 'SYSTEM_LIST'
    }
    
    // Thickness measurement queries
    if ((q.includes('thickness') || q.includes('肉厚') ||
         q.includes('measurement') || q.includes('測定')) && 
        this.hasEquipmentId(query)) {
      return 'THICKNESS_MEASUREMENT'
    }
    
    // Coverage analysis queries
    if (q.includes('coverage') || q.includes('reflected') || q.includes('es ') || 
        q.includes('fouling') || q.includes('risk')) {
      return 'COVERAGE_ANALYSIS'
    }
    
    // Mitigation status queries
    if (q.includes('mitigation') || q.includes('implementation') || 
        q.includes('responsible') || q.includes('緩和策') || q.includes('実施状況')) {
      return 'MITIGATION_STATUS'
    }
    
    return 'UNKNOWN'
  }

  /**
   * Extract entities from query
   */
  private extractEntities(query: string): {
    equipment?: string
    system?: string
    department?: string
  } {
    const entities: {
      equipment?: string
      system?: string
      department?: string
    } = {}
    
    // Extract equipment IDs
    const equipmentMatch = query.match(/(HX|PU|TK|EQ)-?\d+/i)
    if (equipmentMatch) {
      entities.equipment = equipmentMatch[0].toUpperCase().replace(/^([A-Z]+)(\d+)$/, '$1-$2')
    }
    
    // Extract system references
    if (query.toLowerCase().includes('sys-001') || query.toLowerCase().includes('system a')) {
      entities.system = 'SYS-001'
    }
    if (query.toLowerCase().includes('sys-002') || query.toLowerCase().includes('system b')) {
      entities.system = 'SYS-002'
    }
    
    // Extract departments
    if (query.toLowerCase().includes('refinery') || query.includes('製油')) {
      entities.department = 'REFINERY'
    }
    if (query.toLowerCase().includes('maintenance') || query.includes('メンテナンス')) {
      entities.department = 'MAINTENANCE'
    }
    
    return entities
  }

  /**
   * Check if query contains equipment ID
   */
  private hasEquipmentId(query: string): boolean {
    return /(?:HX|PU|TK|EQ)-?\d+/i.test(query)
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      equipmentCache: this.equipmentService.getCacheStats(),
      timestamp: new Date().toISOString()
    }
  }
}