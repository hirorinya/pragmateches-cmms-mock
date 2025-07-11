import { NextRequest, NextResponse } from 'next/server'
import { DataIntegrityService } from '@/lib/data-integrity'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'check'
    
    const integrityService = new DataIntegrityService()
    
    switch (action) {
      case 'check':
        const report = await integrityService.runIntegrityChecks()
        return NextResponse.json({
          success: true,
          data: report,
          timestamp: new Date().toISOString()
        })
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified',
          available_actions: ['check']
        }, { status: 400 })
    }
    
  } catch (error: any) {
    console.error('[API] Data integrity check error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'データ整合性チェックの実行に失敗しました',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}