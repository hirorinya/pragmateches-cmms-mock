import { NextRequest, NextResponse } from 'next/server'
import { ProcessMonitoringService } from '@/services/process-monitoring'
import { SIMULATION_CONFIG } from '@/config/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data } = body

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected array of process data.' },
        { status: 400 }
      )
    }

    const monitoringService = new ProcessMonitoringService()
    const result = await monitoringService.processIncomingData(data)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('[API] Process monitoring error:', error)
    
    let errorMessage = 'プロセスデータの処理に失敗しました'
    let suggestions = ['システム管理者にお問い合わせください']
    
    if (error?.message?.includes('permission')) {
      errorMessage = 'プロセス監視システムへの書き込み権限がありません'
      suggestions = ['管理者にアクセス権限の確認を依頼してください']
    } else if (error?.message?.includes('invalid data')) {
      errorMessage = '無効なプロセスデータ形式です'
      suggestions = ['データ形式を確認してください', 'parameter_id, timestamp, value, quality, sourceフィールドが必要です']
    } else if (error?.message?.includes('timeout')) {
      errorMessage = 'プロセスデータの処理がタイムアウトしました'
      suggestions = ['データサイズを減らしてお試しください', '少し時間をおいて再度お試しください']
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: error.message,
        suggestions,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const monitoringService = new ProcessMonitoringService()

    switch (action) {
      case 'status':
        const status = await monitoringService.getMonitoringStatus()
        return NextResponse.json(status)

      case 'notifications':
        const notifications = await monitoringService.getPendingNotifications()
        return NextResponse.json(notifications)

      case 'correlation':
        const timeRange = parseInt(searchParams.get('hours') || '24')
        const correlationResult = await monitoringService.getParameterCorrelation(timeRange)
        return NextResponse.json(correlationResult)

      case 'calculate-baselines':
        const periodDays = parseInt(searchParams.get('days') || '30')
        const baselineResult = await monitoringService.calculateBaselines(periodDays)
        return NextResponse.json(baselineResult)

      case 'update-dashboard':
        const dashboardResult = await monitoringService.updateMonitoringDashboard()
        return NextResponse.json(dashboardResult)

      case 'simulate':
        // Get actual process parameters from database to simulate with real IDs
        const { data: processParams } = await monitoringService['supabase']
          .from('process_parameters')
          .select('parameter_id, parameter_type')
          .limit(3)
        
        // Use actual parameter IDs if available, otherwise use defaults
        const parameterIds = processParams?.length ? processParams : [
          { parameter_id: 'TI-101-01', parameter_type: 'TEMPERATURE' },
          { parameter_id: 'VI-100-01', parameter_type: 'VIBRATION' },
          { parameter_id: 'FI-100-01', parameter_type: 'FLOW' }
        ]
        
        // Simulate incoming process data for testing
        const simulatedData = parameterIds.map(param => {
          let value: number
          switch (param.parameter_type) {
            case 'TEMPERATURE':
              value = SIMULATION_CONFIG.TEMPERATURE_HIGH
              break
            case 'VIBRATION':
              value = SIMULATION_CONFIG.VIBRATION_HIGH
              break
            case 'FLOW':
              value = SIMULATION_CONFIG.FLOW_LOW
              break
            default:
              value = 100.0
          }
          
          return {
            parameter_id: param.parameter_id,
            timestamp: new Date().toISOString(),
            value,
            quality: 'GOOD',
            source: 'DCS'
          }
        })

        const simulationResult = await monitoringService.processIncomingData(simulatedData)
        return NextResponse.json({
          message: 'Simulation completed',
          simulated_data: simulatedData,
          results: simulationResult
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: status, notifications, correlation, calculate-baselines, update-dashboard, or simulate' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('[API] Process monitoring GET error:', error)
    
    let errorMessage = 'プロセス監視データの取得に失敗しました'
    let suggestions = ['システム管理者にお問い合わせください']
    
    if (error?.message?.includes('permission')) {
      errorMessage = 'プロセス監視データへの読み取り権限がありません'
      suggestions = ['管理者にアクセス権限の確認を依頼してください']
    } else if (error?.message?.includes('no rows') || error?.message?.includes('PGRST116')) {
      errorMessage = '監視データが見つかりません'
      suggestions = ['データが初期化されていない可能性があります', 'シミュレーションを実行してテストデータを生成してください']
    } else if (error?.message?.includes('timeout')) {
      errorMessage = '監視データの取得がタイムアウトしました'
      suggestions = ['データ量が多い可能性があります', '少し時間をおいて再度お試しください']
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: error.message,
        suggestions,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}