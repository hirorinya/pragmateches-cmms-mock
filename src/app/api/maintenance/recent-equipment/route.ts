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

  } catch (error: any) {
    console.error('API error:', error)
    
    // Provide specific error messages based on error type
    let errorMessage = 'メンテナンス履歴データの取得に失敗しました'
    let suggestions = ['システム管理者にお問い合わせください']
    
    if (error?.message?.includes('no rows') || error?.message?.includes('PGRST116')) {
      errorMessage = '指定された期間内にメンテナンス履歴が見つかりません'
      suggestions = ['期間を延長してお試しください', '設備IDや条件を確認してください']
    } else if (error?.message?.includes('permission')) {
      errorMessage = 'メンテナンス履歴への読み取り権限がありません'
      suggestions = ['管理者にアクセス権限の確認を依頼してください']
    } else if (error?.message?.includes('timeout')) {
      errorMessage = 'データ取得がタイムアウトしました'
      suggestions = ['検索条件を絞り込んでください', '少し時間をおいて再度お試しください']
    } else if (error?.message?.includes('network') || error?.message?.includes('connection')) {
      errorMessage = 'ネットワーク接続に問題があります'
      suggestions = ['インターネット接続を確認してください', '少し時間をおいて再度お試しください']
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: error.message,
        suggestions,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}