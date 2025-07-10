import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const systemId = searchParams.get('system_id')
    const timeframe = searchParams.get('timeframe') || '3M'

    // Calculate date range based on timeframe
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case '1M':
        startDate.setMonth(endDate.getMonth() - 1)
        break
      case '3M':
        startDate.setMonth(endDate.getMonth() - 3)
        break
      case '6M':
        startDate.setMonth(endDate.getMonth() - 6)
        break
      case '1Y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setMonth(endDate.getMonth() - 3)
    }

    // Get risk scenario trends over time
    let query = supabase
      .from('risk_score_history')
      .select(`
        date_created,
        record_type,
        severity_score_new,
        occurrence_score_new,
        detection_score_new,
        change_reason
      `)
      .gte('date_created', startDate.toISOString().split('T')[0])
      .lte('date_created', endDate.toISOString().split('T')[0])
      .order('date_created', { ascending: true })

    if (systemId) {
      // Need to join with failure_modes or risk_scenarios to filter by system
      query = supabase
        .from('failure_modes')
        .select(`
          rpn_score,
          severity_score,
          occurrence_score,
          detection_score,
          created_at,
          system_id
        `)
        .eq('system_id', systemId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true })
    }

    const { data: historyData, error: historyError } = await query

    if (historyError) {
      console.error('Error fetching history data:', historyError)
    }

    // Get current risk scenarios for trend calculation
    let scenarioQuery = supabase
      .from('failure_modes')
      .select(`
        failure_mode_id,
        system_id,
        severity_score,
        occurrence_score,
        detection_score,
        created_at,
        updated_at
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (systemId) {
      scenarioQuery = scenarioQuery.eq('system_id', systemId)
    }

    const { data: scenarios, error: scenarioError } = await scenarioQuery

    if (scenarioError) {
      throw scenarioError
    }

    // Process data into trend format
    const trendData = processRiskTrendData(scenarios || [], startDate, endDate, timeframe)

    return NextResponse.json({
      success: true,
      data: trendData,
      timeframe,
      date_range: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    })

  } catch (error: any) {
    console.error('[API] Risk trends GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch risk trends', details: error.message },
      { status: 500 }
    )
  }
}

function processRiskTrendData(scenarios: any[], startDate: Date, endDate: Date, timeframe: string) {
  const trendData = []
  const current = new Date(startDate)
  
  // Determine interval based on timeframe
  const intervalDays = timeframe === '1M' ? 7 : timeframe === '3M' ? 14 : timeframe === '6M' ? 30 : 30

  while (current <= endDate) {
    const intervalEnd = new Date(current)
    intervalEnd.setDate(intervalEnd.getDate() + intervalDays)
    
    // Filter scenarios created in this interval
    const intervalScenarios = scenarios.filter(s => {
      const createdDate = new Date(s.created_at)
      return createdDate >= current && createdDate < intervalEnd
    })

    // Calculate risk levels for interval scenarios
    const riskCounts = {
      extreme_count: 0,
      high_count: 0,
      medium_count: 0,
      low_count: 0
    }

    let totalRpn = 0
    let validRpnCount = 0

    intervalScenarios.forEach(scenario => {
      const rpn = scenario.severity_score * scenario.occurrence_score * scenario.detection_score
      if (rpn > 0) {
        totalRpn += rpn
        validRpnCount++

        // Categorize by RPN score
        if (rpn >= 200) riskCounts.extreme_count++
        else if (rpn >= 100) riskCounts.high_count++
        else if (rpn >= 50) riskCounts.medium_count++
        else riskCounts.low_count++
      }
    })

    trendData.push({
      date: current.toISOString().split('T')[0],
      ...riskCounts,
      total_scenarios: intervalScenarios.length,
      avg_rpn: validRpnCount > 0 ? totalRpn / validRpnCount : 0,
      new_scenarios: intervalScenarios.length,
      closed_scenarios: 0 // Would need additional tracking for this
    })

    current.setDate(current.getDate() + intervalDays)
  }

  return trendData
}