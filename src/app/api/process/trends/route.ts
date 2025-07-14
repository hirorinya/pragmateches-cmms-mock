import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('time_range') || '24h'
    const systemId = searchParams.get('system_id')
    const equipmentId = searchParams.get('equipment_id')

    // Calculate date range based on timeframe
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '1h':
        startDate.setHours(endDate.getHours() - 1)
        break
      case '24h':
        startDate.setDate(endDate.getDate() - 1)
        break
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      default:
        startDate.setDate(endDate.getDate() - 1)
    }

    // Get parameters and their historical data
    let parameterQuery = supabase
      .from('process_parameters')
      .select(`
        parameter_id,
        parameter_name,
        tag_name,
        unit,
        normal_min,
        normal_max,
        critical_min,
        critical_max,
        equipment!inner(
          設備名,
          設備タグ
        )
      `)

    if (systemId) {
      parameterQuery = parameterQuery.eq('equipment.system_id', systemId)
    }

    if (equipmentId) {
      parameterQuery = parameterQuery.eq('equipment_id', equipmentId)
    }

    const { data: parameters, error: paramError } = await parameterQuery

    if (paramError) throw paramError

    // Get historical data for each parameter
    const trends = await Promise.all(
      (parameters || []).map(async (param) => {
        const { data: historicalData, error: histError } = await supabase
          .from('parameter_history')
          .select('timestamp, value, status')
          .eq('parameter_id', param.parameter_id)
          .gte('timestamp', startDate.toISOString())
          .lte('timestamp', endDate.toISOString())
          .order('timestamp', { ascending: true })

        if (histError) {
          console.warn(`Error fetching history for parameter ${param.parameter_id}:`, histError)
        }

        // Use historical data if available, otherwise return empty data
        const dataPoints = historicalData || []
        
        // Log when no data is available instead of generating fake data
        if (dataPoints.length === 0) {
          console.warn(`No historical data available for parameter ${param.parameter_id} in time range ${timeRange}`)
        }

        return {
          parameter_id: param.parameter_id,
          parameter_name: param.parameter_name,
          tag_name: param.tag_name,
          equipment_name: param.equipment?.設備名 || 'Unknown',
          unit: param.unit,
          normal_min: param.normal_min,
          normal_max: param.normal_max,
          critical_min: param.critical_min,
          critical_max: param.critical_max,
          data_points: dataPoints.map(dp => ({
            timestamp: dp.timestamp,
            value: dp.value,
            status: dp.status || 'NORMAL',
            parameter_name: param.parameter_name,
            unit: param.unit
          }))
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: trends,
      timeframe: timeRange,
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    })

  } catch (error: any) {
    console.error('[API] Process trends GET error:', error)
    
    // Provide specific error messages based on error type
    let errorMessage = 'プロセストレンドデータの取得に失敗しました'
    let suggestions = ['システム管理者にお問い合わせください']
    
    if (error?.message?.includes('no rows') || error?.message?.includes('PGRST116')) {
      errorMessage = '指定されたパラメータまたは期間のデータが見つかりません'
      suggestions = ['時間範囲を変更してお試しください', 'システムIDや設備IDを確認してください']
    } else if (error?.message?.includes('permission')) {
      errorMessage = 'プロセスデータへの読み取り権限がありません'
      suggestions = ['管理者にアクセス権限の確認を依頼してください']
    } else if (error?.message?.includes('timeout')) {
      errorMessage = 'プロセスデータの取得がタイムアウトしました'
      suggestions = ['時間範囲を短縮してください', '少し時間をおいて再度お試しください']
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

// Sample data generation removed - system now relies on actual database data
// To add historical data, populate the parameter_history table with actual measurements