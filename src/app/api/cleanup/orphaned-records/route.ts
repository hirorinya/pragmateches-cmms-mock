import { NextRequest, NextResponse } from 'next/server'
import { OrphanedRecordsCleanupService } from '@/lib/orphaned-records-cleanup'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'analyze'
    
    const cleanupService = new OrphanedRecordsCleanupService()
    
    if (action === 'analyze') {
      // Just analyze, don't clean up
      const analysis = await cleanupService.analyzeOrphanedRecords()
      
      return NextResponse.json({
        success: true,
        action: 'analyze',
        data: {
          orphanedMaintenanceCount: analysis.orphanedMaintenance.length,
          orphanedParametersCount: analysis.orphanedParameters.length,
          unmappedEquipmentCount: analysis.unmappedEquipment.length,
          orphanedMaintenance: analysis.orphanedMaintenance.slice(0, 5), // Show first 5
          orphanedParameters: analysis.orphanedParameters.slice(0, 5), // Show first 5
          unmappedEquipment: analysis.unmappedEquipment.slice(0, 5) // Show first 5
        }
      })
    } else if (action === 'cleanup') {
      // Perform actual cleanup
      const result = await cleanupService.cleanupOrphanedRecords()
      
      return NextResponse.json({
        success: result.success,
        action: 'cleanup',
        data: result
      })
    } else if (action === 'verify') {
      // Verify cleanup results
      const verification = await cleanupService.verifyCleanup()
      
      return NextResponse.json({
        success: true,
        action: 'verify',
        data: verification
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use: analyze, cleanup, or verify' },
        { status: 400 }
      )
    }
    
  } catch (error: any) {
    console.error('Orphaned records cleanup API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Orphaned records cleanup failed',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // GET request just does analysis
  try {
    const cleanupService = new OrphanedRecordsCleanupService()
    const analysis = await cleanupService.analyzeOrphanedRecords()
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          orphanedMaintenanceCount: analysis.orphanedMaintenance.length,
          orphanedParametersCount: analysis.orphanedParameters.length,
          unmappedEquipmentCount: analysis.unmappedEquipment.length,
          totalIssues: analysis.orphanedMaintenance.length + 
                      analysis.orphanedParameters.length + 
                      analysis.unmappedEquipment.length
        },
        details: {
          orphanedMaintenance: analysis.orphanedMaintenance,
          orphanedParameters: analysis.orphanedParameters,
          unmappedEquipment: analysis.unmappedEquipment
        }
      }
    })
    
  } catch (error: any) {
    console.error('Orphaned records analysis API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Orphaned records analysis failed',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}