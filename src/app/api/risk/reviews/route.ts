import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { RiskAssessmentService } from '@/services/risk-assessment'

const riskService = new RiskAssessmentService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const systemId = searchParams.get('system_id')
    const status = searchParams.get('status') || 'IN_PROGRESS'
    const reviewType = searchParams.get('review_type')

    let query = supabase
      .from('risk_reviews')
      .select(`
        *,
        equipment_systems!inner(system_name, system_type),
        review_leader_staff:review_leader(氏名, 部署),
        review_failure_mode_assessments(
          *,
          failure_modes!inner(
            failure_mode,
            failure_mechanism,
            severity_score,
            occurrence_score,
            detection_score,
            rpn_score
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (systemId) {
      query = query.eq('system_id', systemId)
    }

    if (status !== 'ALL') {
      query = query.eq('review_status', status)
    }

    if (reviewType) {
      query = query.eq('review_type', reviewType)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch risk reviews: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    })

  } catch (error: any) {
    console.error('[API] Risk reviews GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch risk reviews', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create_review':
        return await createRiskReview(body)
      
      case 'submit_review':
        return await submitRiskReview(body)
      
      case 'approve_review':
        return await approveRiskReview(body)
      
      case 'create_from_process_trigger':
        return await createFromProcessTrigger(body)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('[API] Risk reviews POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process risk review action', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { review_id, action, assessment_data, approval_data } = body

    if (!review_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: review_id, action' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'update_assessments':
        return await updateFailureModeAssessments(review_id, assessment_data)
      
      case 'submit_for_approval':
        return await submitForApproval(review_id, body)
      
      case 'approve':
        return await approveReview(review_id, approval_data)
      
      case 'reject':
        return await rejectReview(review_id, approval_data)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('[API] Risk reviews PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update risk review', details: error.message },
      { status: 500 }
    )
  }
}

async function createRiskReview(data: any) {
  const result = await riskService.createRiskReview({
    system_id: data.system_id,
    review_type: data.review_type || 'SCHEDULED',
    review_date: data.review_date || new Date().toISOString().split('T')[0],
    review_leader: data.review_leader,
    review_team: data.review_team || [],
    triggered_by: data.triggered_by,
    trigger_reference: data.trigger_reference
  })

  if (!result.success) {
    throw new Error(result.error)
  }

  return NextResponse.json({
    success: true,
    data: result.data,
    message: 'Risk review created successfully'
  })
}

async function submitRiskReview(data: any) {
  // Update review status and populate assessments
  const { error: updateError } = await supabase
    .from('risk_reviews')
    .update({
      review_status: 'IN_PROGRESS',
      findings: data.findings,
      recommendations: data.recommendations,
      updated_at: new Date().toISOString()
    })
    .eq('review_id', data.review_id)

  if (updateError) {
    throw new Error(`Failed to update review: ${updateError.message}`)
  }

  // Create initial failure mode assessments
  if (data.failure_mode_assessments && data.failure_mode_assessments.length > 0) {
    const { error: assessmentError } = await supabase
      .from('review_failure_mode_assessments')
      .insert(
        data.failure_mode_assessments.map((assessment: any) => ({
          review_id: data.review_id,
          failure_mode_id: assessment.failure_mode_id,
          severity_score_new: assessment.severity_score_new,
          occurrence_score_new: assessment.occurrence_score_new,
          detection_score_new: assessment.detection_score_new,
          score_changed: assessment.score_changed,
          change_justification: assessment.change_justification,
          recommended_controls: assessment.recommended_controls,
          recommended_es_changes: assessment.recommended_es_changes
        }))
      )

    if (assessmentError) {
      throw new Error(`Failed to create assessments: ${assessmentError.message}`)
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Risk review submitted successfully'
  })
}

async function approveRiskReview(data: any) {
  // Process the review and generate ES recommendations
  const { data: assessments } = await supabase
    .from('review_failure_mode_assessments')
    .select('*')
    .eq('review_id', data.review_id)

  const result = await riskService.processRiskReview(data.review_id, assessments || [])

  if (!result.success) {
    throw new Error(result.error)
  }

  // Update review status
  const { error } = await supabase
    .from('risk_reviews')
    .update({
      review_status: 'COMPLETED',
      approved_at: new Date().toISOString(),
      approved_by: data.approved_by,
      approval_status: 'APPROVED',
      approval_notes: data.approval_notes
    })
    .eq('review_id', data.review_id)

  if (error) {
    throw new Error(`Failed to approve review: ${error.message}`)
  }

  return NextResponse.json({
    success: true,
    recommendations_generated: result.recommendations,
    message: 'Risk review approved and processed successfully'
  })
}

async function createFromProcessTrigger(data: any) {
  // Check if we should trigger a review based on process events
  const triggerResult = await riskService.checkProcessRiskTriggers(
    data.process_event_id,
    data.system_id,
    data.severity
  )

  if (!triggerResult.shouldTriggerReview) {
    return NextResponse.json({
      success: true,
      triggered: false,
      message: 'Process event does not meet criteria for risk review'
    })
  }

  // Create the triggered review
  const result = await riskService.createRiskReview({
    system_id: data.system_id,
    review_type: 'TRIGGERED',
    review_date: new Date().toISOString().split('T')[0],
    review_leader: data.review_leader || 'SYSTEM',
    triggered_by: 'PROCESS_CHANGE',
    trigger_reference: data.process_event_id
  })

  if (!result.success) {
    throw new Error(result.error)
  }

  return NextResponse.json({
    success: true,
    triggered: true,
    data: result.data,
    message: 'Risk review triggered by process event'
  })
}

async function updateFailureModeAssessments(reviewId: string, assessments: any[]) {
  // Delete existing assessments
  await supabase
    .from('review_failure_mode_assessments')
    .delete()
    .eq('review_id', reviewId)

  // Insert updated assessments
  const { error } = await supabase
    .from('review_failure_mode_assessments')
    .insert(
      assessments.map(assessment => ({
        review_id: reviewId,
        ...assessment
      }))
    )

  if (error) {
    throw new Error(`Failed to update assessments: ${error.message}`)
  }

  return NextResponse.json({
    success: true,
    message: 'Failure mode assessments updated successfully'
  })
}

async function submitForApproval(reviewId: string, data: any) {
  const { error } = await supabase
    .from('risk_reviews')
    .update({
      review_status: 'UNDER_REVIEW',
      submitted_at: new Date().toISOString(),
      submitted_by: data.submitted_by,
      findings: data.findings,
      recommendations: data.recommendations,
      action_items: data.action_items
    })
    .eq('review_id', reviewId)

  if (error) {
    throw new Error(`Failed to submit for approval: ${error.message}`)
  }

  return NextResponse.json({
    success: true,
    message: 'Risk review submitted for approval'
  })
}

async function approveReview(reviewId: string, data: any) {
  // Process assessments and generate recommendations
  const { data: assessments } = await supabase
    .from('review_failure_mode_assessments')
    .select('*')
    .eq('review_id', reviewId)

  const result = await riskService.processRiskReview(reviewId, assessments || [])

  // Update review status
  const { error } = await supabase
    .from('risk_reviews')
    .update({
      review_status: 'COMPLETED',
      approval_status: 'APPROVED',
      approved_at: new Date().toISOString(),
      approved_by: data.approved_by,
      approval_notes: data.approval_notes
    })
    .eq('review_id', reviewId)

  if (error) {
    throw new Error(`Failed to approve review: ${error.message}`)
  }

  return NextResponse.json({
    success: true,
    recommendations_generated: result.recommendations,
    message: 'Risk review approved successfully'
  })
}

async function rejectReview(reviewId: string, data: any) {
  const { error } = await supabase
    .from('risk_reviews')
    .update({
      review_status: 'DRAFT',
      approval_status: 'REJECTED',
      reviewed_at: new Date().toISOString(),
      reviewed_by: data.reviewed_by,
      approval_notes: data.approval_notes
    })
    .eq('review_id', reviewId)

  if (error) {
    throw new Error(`Failed to reject review: ${error.message}`)
  }

  return NextResponse.json({
    success: true,
    message: 'Risk review rejected and returned to draft'
  })
}