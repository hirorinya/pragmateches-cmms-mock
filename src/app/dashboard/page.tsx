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
  // Mock CMMS data - in real app, this would come from APIs
  const cmmsStats = {
    workOrders: {
      total: 28,
      open: 12,
      inProgress: 8,
      overdue: 3,
      completed_this_week: 15
    },
    maintenance: {
      upcoming_pm: 7,
      overdue_pm: 2,
      mttr_hours: 4.2,
      mtbf_days: 45
    },
    equipment: {
      total_assets: 156,
      critical_alerts: 4,
      availability: 96.2,
      performance_efficiency: 87.5
    },
    costs: {
      monthly_spend: 45600,
      pm_vs_reactive: 70, // 70% PM vs 30% reactive
      parts_inventory_value: 128000
    }
  }

  const upcomingTasks = [
    { id: '1', equipment: 'HX-101', task: 'Monthly PM Inspection', due: '2024-01-15', priority: 'MEDIUM' },
    { id: '2', equipment: 'PU-102', task: 'Bearing Replacement', due: '2024-01-14', priority: 'HIGH' },
    { id: '3', equipment: 'TK-201', task: 'Quarterly Inspection', due: '2024-01-16', priority: 'LOW' },
    { id: '4', equipment: 'CP-301', task: 'Oil Change Service', due: '2024-01-17', priority: 'MEDIUM' }
  ]

  const criticalAlerts = [
    { equipment: 'PU-105', issue: 'High Vibration Detected', severity: 'HIGH' },
    { equipment: 'HX-203', issue: 'Temperature Anomaly', severity: 'MEDIUM' },
    { equipment: 'CV-108', issue: 'Pressure Drop Alert', severity: 'HIGH' },
    { equipment: 'MT-401', issue: 'Oil Level Low', severity: 'LOW' }
  ]
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