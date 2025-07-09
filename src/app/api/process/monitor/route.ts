import { NextRequest, NextResponse } from 'next/server'
import { ProcessMonitoringService } from '@/services/process-monitoring'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data } = body

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected array of process data.' },
        { status: 400 }
      )
    }

    const monitoringService = new ProcessMonitoringService()
    const result = await monitoringService.processIncomingData(data)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('[API] Process monitoring error:', error)
    return NextResponse.json(
      { error: 'Failed to process data', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const monitoringService = new ProcessMonitoringService()

    switch (action) {
      case 'status':
        const status = await monitoringService.getMonitoringStatus()
        return NextResponse.json(status)

      case 'notifications':
        const notifications = await monitoringService.getPendingNotifications()
        return NextResponse.json(notifications)

      case 'simulate':
        // Simulate incoming process data for testing
        const simulatedData = [
          {
            parameter_id: 'TI-101-01',
            timestamp: new Date().toISOString(),
            value: 85.5, // High temperature to trigger alerts
            quality: 'GOOD',
            source: 'DCS'
          },
          {
            parameter_id: 'VI-100-01',
            timestamp: new Date().toISOString(),
            value: 3.2, // High vibration
            quality: 'GOOD',
            source: 'DCS'
          },
          {
            parameter_id: 'FI-100-01',
            timestamp: new Date().toISOString(),
            value: 95.0, // Low flow rate
            quality: 'GOOD',
            source: 'DCS'
          }
        ]

        const simulationResult = await monitoringService.processIncomingData(simulatedData)
        return NextResponse.json({
          message: 'Simulation completed',
          simulated_data: simulatedData,
          results: simulationResult
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: status, notifications, or simulate' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('[API] Process monitoring GET error:', error)
    return NextResponse.json(
      { error: 'Failed to get monitoring data', details: error.message },
      { status: 500 }
    )
  }
}