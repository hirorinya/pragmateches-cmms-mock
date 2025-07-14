import { NextRequest, NextResponse } from 'next/server'
import { APIConfigService } from '@/services/api-config-service'
import { ErrorHandlingService } from '@/services/error-handling-service'

export async function GET(request: NextRequest) {
  try {
    // Get comprehensive system status
    const configStatus = await APIConfigService.validateConfiguration()
    const healthStatus = APIConfigService.getHealthStatus()
    const errorStats = ErrorHandlingService.getErrorStatistics()
    
    const systemStatus = {
      timestamp: new Date().toISOString(),
      overall_status: determineOverallStatus(configStatus, healthStatus),
      configuration: configStatus,
      health_checks: healthStatus,
      error_statistics: errorStats,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    }
    
    return NextResponse.json(systemStatus)
  } catch (error: any) {
    console.error('System status check failed:', error)
    return NextResponse.json({
      error: 'Failed to retrieve system status',
      message: error.message,
      timestamp: new Date().toISOString(),
      overall_status: 'error'
    }, { status: 500 })
  }
}

function determineOverallStatus(configStatus: any, healthStatus: any): string {
  if (configStatus.operational_mode === 'offline') {
    return 'critical'
  }
  
  if (healthStatus.overall === 'unavailable') {
    return 'degraded'
  }
  
  if (configStatus.operational_mode === 'limited' || healthStatus.overall === 'degraded') {
    return 'warning'
  }
  
  return 'healthy'
}

// Also add a simple health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    const configStatus = await APIConfigService.validateConfiguration()
    
    if (configStatus.operational_mode === 'offline') {
      return new NextResponse(null, { status: 503 })
    }
    
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}