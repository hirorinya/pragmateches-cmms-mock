import { NextRequest, NextResponse } from 'next/server'
import { TaskGenerationService } from '@/services/task-generation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { strategyId } = body
    
    const taskService = new TaskGenerationService()
    
    if (strategyId) {
      const result = await taskService.generateTaskForStrategy(strategyId)
      return NextResponse.json(result)
    } else {
      const result = await taskService.generateDailyTasks()
      return NextResponse.json(result)
    }
  } catch (error: any) {
    console.error('[API] Task generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate task', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const strategyId = searchParams.get('strategy_id')
    
    const taskService = new TaskGenerationService()
    
    if (strategyId) {
      const result = await taskService.generateTaskForStrategy(strategyId)
      return NextResponse.json(result)
    } else {
      const result = await taskService.generateDailyTasks()
      return NextResponse.json(result)
    }
  } catch (error: any) {
    console.error('[API] Task generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate task', details: error.message },
      { status: 500 }
    )
  }
}