import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    
    // supabase is already imported

    const { data, error } = await supabase
      .from('es_change_notifications')
      .select(`
        *,
        equipment_strategy!inner(
          strategy_name, 
          equipment_id,
          equipment!inner(equipment_name, equipment_tag)
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    })

  } catch (error: any) {
    console.error('[API] Notifications GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notification_id, action, reviewed_by, review_notes } = body

    if (!notification_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: notification_id, action' },
        { status: 400 }
      )
    }

    // supabase is already imported
    const updateData: any = {
      reviewed_by,
      reviewed_at: new Date().toISOString(),
      review_notes
    }

    switch (action) {
      case 'approve':
        updateData.status = 'APPLIED'
        updateData.applied_at = new Date().toISOString()

        // Get the notification details to apply the change
        const { data: notification, error: fetchError } = await supabase
          .from('es_change_notifications')
          .select('*')
          .eq('notification_id', notification_id)
          .single()

        if (fetchError || !notification) {
          throw new Error('Notification not found')
        }

        // Apply the ES change if it's a frequency change
        if (notification.notification_type === 'FREQUENCY_CHANGE') {
          const { error: updateError } = await supabase
            .from('equipment_strategy')
            .update({
              frequency_type: notification.recommended_frequency_type,
              frequency_value: notification.recommended_frequency_value,
              updated_at: new Date().toISOString()
            })
            .eq('strategy_id', notification.strategy_id)

          if (updateError) {
            throw new Error(`Failed to update equipment strategy: ${updateError.message}`)
          }
        }
        break

      case 'reject':
        updateData.status = 'REJECTED'
        break

      case 'acknowledge':
        updateData.status = 'REVIEWED'
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: approve, reject, or acknowledge' },
          { status: 400 }
        )
    }

    const { error: updateError } = await supabase
      .from('es_change_notifications')
      .update(updateData)
      .eq('notification_id', notification_id)

    if (updateError) {
      throw new Error(`Failed to update notification: ${updateError.message}`)
    }

    return NextResponse.json({
      success: true,
      message: `Notification ${action}d successfully`
    })

  } catch (error: any) {
    console.error('[API] Notifications PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update notification', details: error.message },
      { status: 500 }
    )
  }
}