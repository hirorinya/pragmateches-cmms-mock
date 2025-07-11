import { NextRequest, NextResponse } from 'next/server'
import { EquipmentService } from '@/services/equipment-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const equipmentId = searchParams.get('equipment_id')
    const action = searchParams.get('action')
    
    const equipmentService = new EquipmentService()

    switch (action) {
      case 'effectiveness':
        const effectiveness = await equipmentService.getStrategyEffectiveness(equipmentId || undefined)
        return NextResponse.json(effectiveness)

      case 'overdue':
        const overdueStrategies = await equipmentService.getOverdueStrategies()
        return NextResponse.json({
          success: true,
          data: overdueStrategies,
          count: overdueStrategies.length
        })

      default:
        // Get strategies for specific equipment or all strategies
        if (equipmentId) {
          const strategies = await equipmentService.getEquipmentStrategiesByEquipment(equipmentId)
          return NextResponse.json({
            success: true,
            data: strategies,
            count: strategies.length
          })
        } else {
          const allStrategies = await equipmentService.getEquipmentStrategies()
          return NextResponse.json({
            success: true,
            data: allStrategies,
            count: allStrategies.length
          })
        }
    }

  } catch (error: any) {
    console.error('[API] Equipment strategies GET error:', error)
    
    let errorMessage = '設備戦略データの取得に失敗しました'
    let suggestions = ['システム管理者にお問い合わせください']
    
    if (error?.message?.includes('permission')) {
      errorMessage = '設備戦略データへの読み取り権限がありません'
      suggestions = ['管理者にアクセス権限の確認を依頼してください']
    } else if (error?.message?.includes('no rows') || error?.message?.includes('PGRST116')) {
      errorMessage = '指定された設備の戦略が見つかりません'
      suggestions = ['設備IDを確認してください', '戦略が定義されていない可能性があります']
    } else if (error?.message?.includes('timeout')) {
      errorMessage = '設備戦略データの取得がタイムアウトしました'
      suggestions = ['少し時間をおいて再度お試しください']
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage, 
        details: error.message,
        suggestions,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const requiredFields = ['equipment_id', 'strategy_name', 'frequency_type', 'frequency_value']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: '必須フィールドが不足しています',
          missing_fields: missingFields,
          required_fields: requiredFields
        },
        { status: 400 }
      )
    }

    const equipmentService = new EquipmentService()
    const result = await equipmentService.createEquipmentStrategy(body)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        strategy_id: result.strategy_id,
        message: '設備戦略が正常に作成されました'
      }, { status: 201 })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('[API] Equipment strategy POST error:', error)
    
    let errorMessage = '設備戦略の作成に失敗しました'
    let suggestions = ['システム管理者にお問い合わせください']
    
    if (error?.message?.includes('permission')) {
      errorMessage = '設備戦略の作成権限がありません'
      suggestions = ['管理者にアクセス権限の確認を依頼してください']
    } else if (error?.message?.includes('duplicate') || error?.message?.includes('unique')) {
      errorMessage = '同じ名前の戦略が既に存在します'
      suggestions = ['異なる戦略名を使用してください']
    } else if (error?.message?.includes('foreign key')) {
      errorMessage = '指定された設備が見つかりません'
      suggestions = ['有効な設備IDを指定してください']
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage, 
        details: error.message,
        suggestions,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const strategyId = searchParams.get('strategy_id')
    
    if (!strategyId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'strategy_idパラメータが必要です'
        },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const equipmentService = new EquipmentService()
    const result = await equipmentService.updateEquipmentStrategy(strategyId, body)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '設備戦略が正常に更新されました'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('[API] Equipment strategy PUT error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: '設備戦略の更新に失敗しました',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const strategyId = searchParams.get('strategy_id')
    
    if (!strategyId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'strategy_idパラメータが必要です'
        },
        { status: 400 }
      )
    }
    
    const equipmentService = new EquipmentService()
    const result = await equipmentService.deleteEquipmentStrategy(strategyId)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '設備戦略が正常に削除されました'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('[API] Equipment strategy DELETE error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: '設備戦略の削除に失敗しました',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}