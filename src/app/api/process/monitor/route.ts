import { NextRequest, NextResponse } from 'next/server'
import { ProcessMonitoringService } from '@/services/process-monitoring'
import { SIMULATION_CONFIG } from '@/config/constants'

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
        // Get actual process parameters from database to simulate with real IDs
        const monitoringService = new ProcessMonitoringService()
        const { data: processParams } = await monitoringService['supabase']
          .from('process_parameters')
          .select('parameter_id, parameter_type')
          .limit(3)
        
        // Use actual parameter IDs if available, otherwise use defaults
        const parameterIds = processParams?.length ? processParams : [
          { parameter_id: 'TI-101-01', parameter_type: 'TEMPERATURE' },
          { parameter_id: 'VI-100-01', parameter_type: 'VIBRATION' },
          { parameter_id: 'FI-100-01', parameter_type: 'FLOW' }
        ]
        
        // Simulate incoming process data for testing
        const simulatedData = parameterIds.map(param => {
          let value: number
          switch (param.parameter_type) {
            case 'TEMPERATURE':
              value = SIMULATION_CONFIG.TEMPERATURE_HIGH
              break
            case 'VIBRATION':
              value = SIMULATION_CONFIG.VIBRATION_HIGH
              break
            case 'FLOW':
              value = SIMULATION_CONFIG.FLOW_LOW
              break
            default:
              value = 100.0
          }
          
          return {
            parameter_id: param.parameter_id,
            timestamp: new Date().toISOString(),
            value,
            quality: 'GOOD',
            source: 'DCS'
          }
        })

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