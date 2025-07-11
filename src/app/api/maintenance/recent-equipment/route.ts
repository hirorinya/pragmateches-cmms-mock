import { NextRequest, NextResponse } from 'next/server'
import { getEquipmentWithRecentMaintenance } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const daysBack = parseInt(searchParams.get('days') || '365') // Default to 1 year
    
    // Use the database function to get equipment with recent maintenance
    const result = await getEquipmentWithRecentMaintenance(daysBack)

    return NextResponse.json({
      success: true,
      data: result.equipment,
      summary: result.summary
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance data', details: error.message },
      { status: 500 }
    )
  }
}