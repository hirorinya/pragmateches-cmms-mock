import { NextRequest, NextResponse } from 'next/server'
import { ProcessMonitoringService } from '@/services/process-monitoring'

/**
 * Cron job endpoint for automated baseline calculation
 * Should be called periodically (e.g., daily or weekly) to update process baselines
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    // Simple auth check for cron jobs (in production, use proper auth)
    if (!authHeader || !authHeader.includes('cron-key')) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid cron key' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const periodDays = body.period_days || 30

    console.log(`[Cron] Starting baseline calculation for ${periodDays} day period`)

    const monitoringService = new ProcessMonitoringService()
    
    // Calculate baselines
    const baselineResult = await monitoringService.calculateBaselines(periodDays)
    
    // Update dashboard
    const dashboardResult = await monitoringService.updateMonitoringDashboard()

    const result = {
      success: baselineResult.success && dashboardResult.success,
      baselines: {
        updated: baselineResult.updated,
        errors: baselineResult.errors
      },
      dashboard: {
        updated: dashboardResult.success,
        message: dashboardResult.message
      },
      timestamp: new Date().toISOString()
    }

    console.log(`[Cron] Baseline calculation completed:`, result)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('[Cron] Process baseline calculation error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'プロセスベースライン計算のCronジョブが失敗しました',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Health check endpoint for cron monitoring
 */
export async function GET() {
  return NextResponse.json({
    service: 'process-baselines-cron',
    status: 'healthy',
    description: 'Automated process baseline calculation service',
    last_check: new Date().toISOString()
  })
}