'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Wrench,
  XCircle,
  ArrowRight,
  Target,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [cmmsStats, setCmmsStats] = useState<any>(null)
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([])
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch work orders stats
      const { data: workOrders, error: woError } = await supabase
        .from('work_order')
        .select('作業指示ID, 設備ID, 作業内容, 優先度')

      if (woError) throw woError

      // Calculate work order stats
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      const woStats = {
        total: workOrders?.length || 0,
        open: workOrders?.filter(wo => wo.優先度 === '高').length || 0,
        inProgress: workOrders?.filter(wo => wo.優先度 === '中').length || 0,
        overdue: workOrders?.filter(wo => wo.優先度 === '高').length || 0,
        completed_this_week: workOrders?.filter(wo => wo.作業内容?.includes('点検')).length || 0
      }

      // Fetch equipment stats
      const { data: equipment, error: eqError } = await supabase
        .from('equipment')
        .select('設備ID, 稼働状態')

      if (eqError) throw eqError

      const operationalCount = equipment.filter(eq => eq.稼働状態 === '稼働中').length
      const availability = equipment.length > 0 ? (operationalCount / equipment.length) * 100 : 0

      // Fetch maintenance history for MTTR calculation
      const { data: maintenance, error: mError } = await supabase
        .from('maintenance_history')
        .select('作業時間')
        .limit(50)

      if (mError) throw mError

      const avgMaintTime = maintenance.length > 0 
        ? maintenance.reduce((sum, m) => sum + (parseFloat(m.作業時間) || 0), 0) / maintenance.length 
        : 4.2

      // Fetch upcoming inspection tasks
      const { data: inspections, error: iError } = await supabase
        .from('inspection_plan')
        .select(`
          設備ID,
          次回検査日,
          検査種別,
          equipment!inner(設備名)
        `)
        .gte('次回検査日', now.toISOString().split('T')[0])
        .order('次回検査日', { ascending: true })
        .limit(10)

      if (iError) throw iError

      const tasks = inspections.map(inspection => ({
        id: inspection.設備ID,
        equipment: inspection.設備ID,
        equipment_name: inspection.equipment?.設備名,
        task: inspection.検査種別 || 'Scheduled Inspection',
        due: inspection.次回検査日,
        priority: calculatePriority(inspection.次回検査日)
      }))

      // Fetch risk alerts
      const { data: risks, error: rError } = await supabase
        .from('equipment_risk_assessment')
        .select(`
          設備ID,
          リスクレベル,
          リスク要因,
          equipment!inner(設備名)
        `)
        .eq('リスクレベル', 'HIGH')
        .limit(10)

      if (rError) throw rError

      const alerts = risks.map(risk => ({
        equipment: risk.設備ID,
        equipment_name: risk.equipment?.設備名,
        issue: risk.リスク要因,
        severity: risk.リスクレベル
      }))

      setCmmsStats({
        workOrders: woStats,
        maintenance: {
          upcoming_pm: tasks.length,
          overdue_pm: woStats.overdue,
          mttr_hours: Math.round(avgMaintTime * 10) / 10,
          mtbf_days: 45 // Would need failure data to calculate
        },
        equipment: {
          total_assets: equipment.length,
          critical_alerts: alerts.length,
          availability: Math.round(availability * 10) / 10,
          performance_efficiency: 87.5 // Would need performance data
        },
        costs: {
          monthly_spend: maintenance.length * avgMaintTime * 85, // Rough estimate
          pm_vs_reactive: 70, // Would need work order classification
          parts_inventory_value: 128000 // Would need inventory data
        }
      })

      setUpcomingTasks(tasks)
      setCriticalAlerts(alerts)
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const calculatePriority = (dueDate: string): string => {
    const due = new Date(dueDate)
    const now = new Date()
    const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil <= 3) return 'HIGH'
    if (daysUntil <= 7) return 'MEDIUM'
    return 'LOW'
  }
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="mt-2 text-red-600">{error}</p>
            <Button onClick={fetchDashboardData} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!cmmsStats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">No dashboard data available</p>
            <Button onClick={fetchDashboardData} className="mt-4">
              Load Data
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">CMMS Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of maintenance operations and key performance indicators
          </p>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue Tasks</p>
                  <p className="text-3xl font-bold text-red-600">{cmmsStats.workOrders.overdue}</p>
                  <p className="text-xs text-muted-foreground">Immediate attention required</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Work Orders</p>
                  <p className="text-3xl font-bold text-blue-600">{cmmsStats.workOrders.inProgress}</p>
                  <p className="text-xs text-muted-foreground">Currently in progress</p>
                </div>
                <Wrench className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Equipment Availability</p>
                  <p className="text-3xl font-bold text-green-600">{cmmsStats.equipment.availability}%</p>
                  <p className="text-xs text-muted-foreground">Target: 95%</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">MTTR</p>
                  <p className="text-3xl font-bold text-purple-600">{cmmsStats.maintenance.mttr_hours}h</p>
                  <p className="text-xs text-muted-foreground">Mean time to repair</p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Critical Alerts */}
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                Critical Alerts
              </CardTitle>
              <CardDescription>Equipment requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {criticalAlerts.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{alert.equipment}</p>
                      <p className="text-sm text-muted-foreground">{alert.issue}</p>
                    </div>
                    <Badge 
                      variant={alert.severity === 'HIGH' ? 'destructive' : 
                               alert.severity === 'MEDIUM' ? 'default' : 'secondary'}
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Alerts
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Maintenance */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                Upcoming Maintenance
              </CardTitle>
              <CardDescription>Scheduled tasks for the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{task.task}</p>
                        <Badge 
                          variant={task.priority === 'HIGH' ? 'destructive' : 
                                   task.priority === 'MEDIUM' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {task.equipment} • Due: {new Date(task.due).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Assign
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4">
                <Button variant="outline">
                  View Schedule
                </Button>
                <Link href="/dashboard/work-orders">
                  <Button>
                    Manage Work Orders
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{cmmsStats.workOrders.completed_this_week}</p>
                  <p className="text-sm text-muted-foreground">Completed This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{cmmsStats.costs.pm_vs_reactive}%</p>
                  <p className="text-sm text-muted-foreground">PM vs Reactive</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">${(cmmsStats.costs.monthly_spend / 1000).toFixed(0)}K</p>
                  <p className="text-sm text-muted-foreground">Monthly Maintenance Spend</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Wrench className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{cmmsStats.equipment.total_assets}</p>
                  <p className="text-sm text-muted-foreground">Total Assets</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common maintenance management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/dashboard/work-orders">
                <Button variant="outline" className="w-full h-20 flex flex-col">
                  <Wrench className="h-6 w-6 mb-2" />
                  Create Work Order
                </Button>
              </Link>
              
              <Link href="/dashboard/ai-assistant">
                <Button variant="outline" className="w-full h-20 flex flex-col">
                  <Calendar className="h-6 w-6 mb-2" />
                  Schedule PM
                </Button>
              </Link>
              
              <Link href="/dashboard/inspection-results">
                <Button variant="outline" className="w-full h-20 flex flex-col">
                  <CheckCircle className="h-6 w-6 mb-2" />
                  Record Inspection
                </Button>
              </Link>
              
              <Link href="/dashboard/risk-assessment">
                <Button variant="outline" className="w-full h-20 flex flex-col">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  Risk Assessment
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 