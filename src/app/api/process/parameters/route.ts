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
    const equipmentId = searchParams.get('equipment_id')

    let query = supabase
      .from('process_parameters')
      .select(`
        parameter_id,
        parameter_name,
        tag_name,
        unit,
        parameter_type,
        normal_min,
        normal_max,
        critical_min,
        critical_max,
        equipment!inner(
          設備名,
          設備タグ,
          system_id
        )
      `)
      .order('parameter_name', { ascending: true })

    if (systemId) {
      query = query.eq('equipment.system_id', systemId)
    }

    if (equipmentId) {
      query = query.eq('equipment_id', equipmentId)
    }

    const { data, error } = await query

    if (error) throw error

    // Transform data to match frontend interface
    const parameters = (data || []).map(param => ({
      parameter_id: param.parameter_id,
      parameter_name: param.parameter_name,
      equipment_name: param.equipment?.equipment_name || 'Unknown',
      tag_name: param.tag_name,
      unit: param.unit,
      parameter_type: param.parameter_type,
      normal_min: param.normal_min,
      normal_max: param.normal_max,
      critical_min: param.critical_min,
      critical_max: param.critical_max
    }))

    return NextResponse.json({
      success: true,
      data: parameters,
      count: parameters.length
    })

  } catch (error: any) {
    console.error('[API] Process parameters GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch process parameters', details: error.message },
      { status: 500 }
    )
  }
}