'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createClient } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

interface WorkOrder {
  作業指示ID: string
  設備ID: string
  作業内容: string
  優先度: string
  計画開始日時: string
  計画終了日時: string
  作業者ID: string
  状態: string
  備考: string
  equipment: {
    設備名: string
    設備タグ: string
  }
  staff: {
    氏名: string
    部署: string
  }
}

interface GenerationResult {
  success: boolean
  generated: number
  failed: number
  details: string[]
}

export default function TasksPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchWorkOrders()
  }, [])

  const fetchWorkOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('work_order')
        .select(`
          *,
          equipment:equipment_id(equipment_name, equipment_tag),
          staff:assigned_to(name, department)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setWorkOrders(data || [])
    } catch (error) {
      console.error('Error fetching work orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateTasks = async () => {
    setGenerating(true)
    setGenerationResult(null)
    try {
      const response = await fetch('/api/es-tasks', {
        method: 'GET',
      })
      const result = await response.json()
      setGenerationResult(result)
      if (result.success) {
        // Refresh the work orders list
        await fetchWorkOrders()
      }
    } catch (error) {
      console.error('Error generating tasks:', error)
      setGenerationResult({
        success: false,
        generated: 0,
        failed: 0,
        details: ['Failed to generate tasks']
      })
    } finally {
      setGenerating(false)
    }
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'HIGH': 'destructive',
      'MEDIUM': 'default',
      'LOW': 'secondary',
      'CRITICAL': 'destructive'
    }
    return <Badge variant={variants[priority] || 'outline'}>{priority}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'SCHEDULED':
        return <Clock className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Task Management</h1>
            <p className="text-muted-foreground">
              Equipment Strategy Generated Tasks
            </p>
          </div>
        <div className="space-x-2">
          <Button 
            onClick={fetchWorkOrders}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={generateTasks}
            disabled={generating}
          >
            {generating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Tasks'
            )}
          </Button>
        </div>
      </div>

      {generationResult && (
        <Card className={generationResult.success ? 'border-green-500' : 'border-red-500'}>
          <CardHeader>
            <CardTitle className="text-lg">
              {generationResult.success ? 'Tasks Generated Successfully' : 'Task Generation Failed'}
            </CardTitle>
            <CardDescription>
              Generated: {generationResult.generated} | Failed: {generationResult.failed}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {generationResult.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Work Orders</CardTitle>
          <CardDescription>
            Auto-generated tasks from Equipment Strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Order ID</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Task Description</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.map((order) => (
                  <TableRow key={order.作業指示ID}>
                    <TableCell className="font-mono">{order.作業指示ID}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.equipment?.設備名}</div>
                        <div className="text-sm text-muted-foreground">{order.equipment?.設備タグ}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="truncate">{order.作業内容}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(order.優先度)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(order.計画開始日時)}</div>
                        <div className="text-muted-foreground">
                          ~ {formatDate(order.計画終了日時)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.staff ? (
                        <div>
                          <div className="font-medium">{order.staff.氏名}</div>
                          <div className="text-sm text-muted-foreground">{order.staff.部署}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.状態)}
                        <span>{order.状態}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  )
}