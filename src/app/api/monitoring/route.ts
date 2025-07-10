import { NextRequest, NextResponse } from 'next/server'
import { monitoringService } from '@/lib/monitoring-service'
import { cacheService } from '@/lib/cache-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'stats'
    const timeWindow = parseInt(searchParams.get('timeWindow') || '60')

    switch (action) {
      case 'stats':
        return NextResponse.json({
          performance: monitoringService.getPerformanceStats(timeWindow),
          errors: monitoringService.getErrorStats(timeWindow),
          cache: cacheService.getStats(),
          timestamp: new Date().toISOString()
        })

      case 'health':
        const health = await monitoringService.checkSystemHealth()
        return NextResponse.json(health)

      case 'alerts':
        const alerts = monitoringService.getAlerts()
        return NextResponse.json({ 
          alerts,
          count: alerts.length,
          timestamp: new Date().toISOString()
        })

      case 'dashboard':
        // Comprehensive dashboard data
        const [perfStats, errorStats, healthCheck, alertsList] = await Promise.all([
          monitoringService.getPerformanceStats(timeWindow),
          monitoringService.getErrorStats(timeWindow),
          monitoringService.checkSystemHealth(),
          monitoringService.getAlerts()
        ])

        return NextResponse.json({
          performance: perfStats,
          errors: errorStats,
          health: healthCheck,
          alerts: alertsList,
          cache: cacheService.getStats(),
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: stats, health, alerts, or dashboard' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Monitoring API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint for manually recording errors or metrics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...data } = body

    switch (type) {
      case 'error':
        const { message, context, severity = 'medium', metadata } = data
        monitoringService.recordError(
          new Error(message),
          context,
          severity,
          metadata
        )
        return NextResponse.json({ success: true })

      case 'clear_cache':
        const { pattern } = data
        if (pattern) {
          cacheService.invalidatePattern(pattern)
        } else {
          cacheService.clear()
        }
        return NextResponse.json({ success: true, message: 'Cache cleared' })

      case 'cleanup':
        monitoringService.cleanup()
        cacheService.cleanup()
        return NextResponse.json({ success: true, message: 'Cleanup completed' })

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: error, clear_cache, or cleanup' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Monitoring POST API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}