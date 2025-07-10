import { NextRequest, NextResponse } from 'next/server'
import { RiskAssessmentService } from '@/services/risk-assessment'

const riskService = new RiskAssessmentService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const systemId = searchParams.get('system_id')

    const result = await riskService.getRiskDashboard(systemId || undefined)

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
      count: result.data?.length || 0
    })

  } catch (error: any) {
    console.error('[API] Risk dashboard GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch risk dashboard data', details: error.message },
      { status: 500 }
    )
  }
}