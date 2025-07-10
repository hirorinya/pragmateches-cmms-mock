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

        // If no real historical data, generate sample data for demo
        let dataPoints = historicalData || []
        if (dataPoints.length === 0) {
          dataPoints = generateSampleTrendData(param, startDate, endDate, timeRange)
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
    return NextResponse.json(
      { error: 'Failed to fetch process trends', details: error.message },
      { status: 500 }
    )
  }
}

function generateSampleTrendData(parameter: any, startDate: Date, endDate: Date, timeRange: string) {
  const dataPoints = []
  const intervalMs = getIntervalMs(timeRange)
  const current = new Date(startDate)
  
  // Base value around the middle of normal range
  const baseValue = (parameter.normal_min + parameter.normal_max) / 2
  const range = parameter.normal_max - parameter.normal_min
  
  while (current <= endDate) {
    // Add some realistic variation
    const variation = (Math.random() - 0.5) * range * 0.3
    let value = baseValue + variation
    
    // Occasionally go outside normal range for demo
    if (Math.random() < 0.05) {
      value = Math.random() < 0.5 ? 
        parameter.normal_min - range * 0.2 : 
        parameter.normal_max + range * 0.2
    }
    
    let status = 'NORMAL'
    if (value < parameter.critical_min || value > parameter.critical_max) {
      status = 'CRITICAL'
    } else if (value < parameter.normal_min || value > parameter.normal_max) {
      status = 'WARNING'
    }
    
    dataPoints.push({
      timestamp: current.toISOString(),
      value: parseFloat(value.toFixed(2)),
      status
    })
    
    current.setTime(current.getTime() + intervalMs)
  }
  
  return dataPoints
}

function getIntervalMs(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 2 * 60 * 1000  // 2 minutes
    case '24h': return 30 * 60 * 1000  // 30 minutes
    case '7d': return 4 * 60 * 60 * 1000  // 4 hours
    case '30d': return 24 * 60 * 60 * 1000  // 1 day
    default: return 30 * 60 * 1000
  }
}