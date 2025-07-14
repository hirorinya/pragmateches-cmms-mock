import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parameterX = searchParams.get('parameter_x')
    const parameterY = searchParams.get('parameter_y')
    const timeRange = searchParams.get('time_range') || '24h'

    if (!parameterX || !parameterY) {
      return NextResponse.json(
        { error: 'Both parameter_x and parameter_y are required' },
        { status: 400 }
      )
    }

    // Calculate date range
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

    // Get parameter information
    const { data: paramX, error: paramXError } = await supabase
      .from('process_parameters')
      .select(`
        parameter_name,
        tag_name,
        unit,
        equipment!inner(equipment_name)
      `)
      .eq('parameter_id', parameterX)
      .single()

    const { data: paramY, error: paramYError } = await supabase
      .from('process_parameters')
      .select(`
        parameter_name,
        tag_name,
        unit,
        equipment!inner(equipment_name)
      `)
      .eq('parameter_id', parameterY)
      .single()

    if (paramXError || paramYError) {
      throw new Error('One or both parameters not found')
    }

    // Get historical data for both parameters
    const { data: historyX, error: histXError } = await supabase
      .from('parameter_history')
      .select('timestamp, value, status')
      .eq('parameter_id', parameterX)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true })

    const { data: historyY, error: histYError } = await supabase
      .from('parameter_history')
      .select('timestamp, value, status')
      .eq('parameter_id', parameterY)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true })

    if (histXError || histYError) {
      console.warn('Error fetching historical data, generating sample data')
    }

    // Only use real data - no sample data generation
    let correlationData = []
    if (!historyX?.length || !historyY?.length) {
      return NextResponse.json({
        error: 'No historical data available for the specified parameters and time range',
        parameter_x_id: parameterX,
        parameter_y_id: parameterY,
        message: 'Please check if data exists for these parameters in the specified time period'
      }, { status: 404 })
    } else {
      // Match timestamps and create correlation pairs
      correlationData = matchParameterData(historyX, historyY)
    }

    // Calculate correlation coefficient
    const correlation = calculateCorrelation(correlationData)

    const result = {
      parameter_x_id: parameterX,
      parameter_y_id: parameterY,
      parameter_x_name: paramX.parameter_name,
      parameter_y_name: paramY.parameter_name,
      equipment_x_name: paramX.equipment?.equipment_name || 'Unknown',
      equipment_y_name: paramY.equipment?.equipment_name || 'Unknown',
      tag_x: paramX.tag_name,
      tag_y: paramY.tag_name,
      unit_x: paramX.unit,
      unit_y: paramY.unit,
      correlation_coefficient: correlation,
      correlation_strength: getCorrelationStrength(correlation),
      data_points: correlationData,
      analysis_period: `${startDate.toLocaleDateString('ja-JP')} - ${endDate.toLocaleDateString('ja-JP')}`
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    console.error('[API] Process correlation GET error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze correlation', details: error.message },
      { status: 500 }
    )
  }
}

function matchParameterData(historyX: any[], historyY: any[]) {
  const correlationData = []
  const tolerance = 5 * 60 * 1000 // 5 minutes tolerance
  
  for (const pointX of historyX) {
    const matchingY = historyY.find(pointY => {
      const timeDiff = Math.abs(new Date(pointX.timestamp).getTime() - new Date(pointY.timestamp).getTime())
      return timeDiff <= tolerance
    })
    
    if (matchingY) {
      correlationData.push({
        x_value: pointX.value,
        y_value: matchingY.value,
        timestamp: pointX.timestamp,
        status: pointX.status === 'CRITICAL' || matchingY.status === 'CRITICAL' ? 'CRITICAL' :
                pointX.status === 'WARNING' || matchingY.status === 'WARNING' ? 'WARNING' : 'NORMAL'
      })
    }
  }
  
  return correlationData
}

// Function removed - production system only uses real database data

function calculateCorrelation(data: any[]) {
  if (data.length < 2) return 0
  
  const n = data.length
  const sumX = data.reduce((sum, point) => sum + point.x_value, 0)
  const sumY = data.reduce((sum, point) => sum + point.y_value, 0)
  const sumXY = data.reduce((sum, point) => sum + point.x_value * point.y_value, 0)
  const sumX2 = data.reduce((sum, point) => sum + point.x_value * point.x_value, 0)
  const sumY2 = data.reduce((sum, point) => sum + point.y_value * point.y_value, 0)
  
  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  
  if (denominator === 0) return 0
  
  return numerator / denominator
}

function getCorrelationStrength(coefficient: number) {
  const abs = Math.abs(coefficient)
  if (abs >= 0.8) return 'Very Strong'
  if (abs >= 0.6) return 'Strong'
  if (abs >= 0.4) return 'Moderate'
  if (abs >= 0.2) return 'Weak'
  return 'Very Weak'
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