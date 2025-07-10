import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'ACTIVE'
    const systemId = searchParams.get('system_id')
    const severity = searchParams.get('severity')

    let query = supabase
      .from('process_alerts')
      .select(`
        alert_id,
        parameter_id,
        alert_type,
        severity,
        message,
        trigger_value,
        threshold_value,
        created_at,
        acknowledged_at,
        resolved_at,
        status,
        process_parameters!inner(
          parameter_name,
          tag_name,
          equipment!inner(
            equipment_name,
            equipment_tag
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (status !== 'ALL') {
      query = query.eq('status', status)
    }

    if (severity) {
      query = query.eq('severity', severity)
    }

    if (systemId) {
      // Filter by system through equipment relationship
      query = query.eq('process_parameters.equipment.system_id', systemId)
    }

    const { data, error } = await query

    if (error) throw error

    // Transform data to match frontend interface
    const alerts = (data || []).map(alert => ({
      alert_id: alert.alert_id,
      parameter_id: alert.parameter_id,
      alert_type: alert.alert_type,
      severity: alert.severity,
      message: alert.message,
      trigger_value: alert.trigger_value,
      threshold_value: alert.threshold_value,
      equipment_name: alert.process_parameters?.equipment?.equipment_name || 'Unknown',
      parameter_name: alert.process_parameters?.parameter_name || 'Unknown',
      tag_name: alert.process_parameters?.tag_name || 'Unknown',
      created_at: alert.created_at,
      acknowledged_at: alert.acknowledged_at,
      resolved_at: alert.resolved_at,
      status: alert.status
    }))

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length
    })

  } catch (error: any) {
    console.error('[API] Process alerts GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch process alerts', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { alert_id, action, acknowledged_by, resolved_by } = body

    let updateData: any = {}

    switch (action) {
      case 'acknowledge':
        updateData = {
          status: 'ACKNOWLEDGED',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: acknowledged_by || 'SYSTEM'
        }
        break
      case 'resolve':
        updateData = {
          status: 'RESOLVED',
          resolved_at: new Date().toISOString(),
          resolved_by: resolved_by || 'SYSTEM'
        }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "acknowledge" or "resolve"' },
          { status: 400 }
        )
    }

    const { data, error } = await supabase
      .from('process_alerts')
      .update(updateData)
      .eq('alert_id', alert_id)
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      message: `Alert ${action}d successfully`
    })

  } catch (error: any) {
    console.error('[API] Process alerts PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update alert', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      parameter_id, 
      alert_type, 
      severity, 
      message, 
      trigger_value, 
      threshold_value 
    } = body

    const { data, error } = await supabase
      .from('process_alerts')
      .insert({
        parameter_id,
        alert_type,
        severity,
        message,
        trigger_value,
        threshold_value,
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      })
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      message: 'Alert created successfully'
    })

  } catch (error: any) {
    console.error('[API] Process alerts POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create alert', details: error.message },
      { status: 500 }
    )
  }
}