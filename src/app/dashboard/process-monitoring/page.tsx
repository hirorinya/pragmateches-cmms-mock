'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertTriangle, CheckCircle2, Clock, Thermometer, Gauge, Droplets, Activity } from 'lucide-react'

interface ProcessParameter {
  parameter_id: string
  parameter_name: string
  tag_name: string
  equipment_name: string
  equipment_tag: string
  parameter_type: string
  unit: string
  normal_min: number
  normal_max: number
  critical_min: number
  critical_max: number
  current_value: number
  last_update: string
  quality: string
  status: string
  active_triggers: number
}

interface ESNotification {
  notification_id: number
  strategy_id: string
  notification_type: string
  current_frequency_type: string
  current_frequency_value: number
  recommended_frequency_type: string
  recommended_frequency_value: number
  impact_description: string
  priority: string
  status: string
  created_at: string
  equipment_strategy: {
    strategy_name: string
    equipment_id: string
    equipment: {
      設備名: string
      設備タグ: string
    }
  }
}

interface MonitoringResults {
  success: boolean
  processed: number
  triggers_detected: number
  es_notifications: number
  details: string[]
}

export default function ProcessMonitoringPage() {
  const [parameters, setParameters] = useState<ProcessParameter[]>([])
  const [notifications, setNotifications] = useState<ESNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [simulationResult, setSimulationResult] = useState<MonitoringResults | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchProcessStatus(),
        fetchNotifications()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProcessStatus = async () => {
    try {
      const response = await fetch('/api/process/monitor?action=status')
      const result = await response.json()
      if (result.success) {
        setParameters(result.data)
      }
    } catch (error) {
      console.error('Error fetching process status:', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/process/notifications?status=PENDING')
      const result = await response.json()
      if (result.success) {
        setNotifications(result.data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const simulateProcessData = async () => {
    setSimulating(true)
    setSimulationResult(null)
    try {
      const response = await fetch('/api/process/monitor?action=simulate')
      const result = await response.json()
      setSimulationResult(result.results)
      // Refresh data after simulation
      await fetchData()
    } catch (error) {
      console.error('Error simulating process data:', error)
    } finally {
      setSimulating(false)
    }
  }

  const handleNotificationAction = async (notificationId: number, action: string) => {
    try {
      const response = await fetch('/api/process/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_id: notificationId,
          action,
          reviewed_by: 'SYSTEM', // In real app, use actual user ID
          review_notes: `${action} via dashboard`
        })
      })

      if (response.ok) {
        await fetchNotifications()
      }
    } catch (error) {
      console.error('Error updating notification:', error)
    }
  }

  const getParameterIcon = (type: string) => {
    switch (type) {
      case 'TEMPERATURE': return <Thermometer className="h-4 w-4" />
      case 'PRESSURE': return <Gauge className="h-4 w-4" />
      case 'FLOW': return <Droplets className="h-4 w-4" />
      case 'VIBRATION': return <Activity className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'NORMAL': 'secondary',
      'WARNING': 'default',
      'CRITICAL': 'destructive'
    }
    const icons: Record<string, React.ReactNode> = {
      'NORMAL': <CheckCircle2 className="h-3 w-3" />,
      'WARNING': <AlertTriangle className="h-3 w-3" />,
      'CRITICAL': <AlertTriangle className="h-3 w-3" />
    }
    return (
      <Badge variant={variants[status] || 'outline'} className="flex items-center gap-1">
        {icons[status]}
        {status}
      </Badge>
    )
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

  const formatValue = (value: number, unit: string) => {
    return `${value.toFixed(2)} ${unit}`
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Process Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time process parameter monitoring and ES change detection
          </p>
        </div>
        <div className="space-x-2">
          <Button 
            onClick={fetchData}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={simulateProcessData}
            disabled={simulating}
          >
            {simulating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Simulating...
              </>
            ) : (
              'Simulate Data'
            )}
          </Button>
        </div>
      </div>

      {simulationResult && (
        <Card className={simulationResult.success ? 'border-green-500' : 'border-red-500'}>
          <CardHeader>
            <CardTitle className="text-lg">Simulation Results</CardTitle>
            <CardDescription>
              Processed: {simulationResult.processed} | Triggers: {simulationResult.triggers_detected} | Notifications: {simulationResult.es_notifications}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {simulationResult.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Process Parameters Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Process Parameters</CardTitle>
          <CardDescription>
            Current status of monitored process parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parameter</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Normal Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active Triggers</TableHead>
                  <TableHead>Last Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parameters.map((param) => (
                  <TableRow key={param.parameter_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getParameterIcon(param.parameter_type)}
                        <div>
                          <div className="font-medium">{param.parameter_name}</div>
                          <div className="text-sm text-muted-foreground">{param.tag_name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{param.equipment_name}</div>
                        <div className="text-sm text-muted-foreground">{param.equipment_tag}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono">
                        {param.current_value ? formatValue(param.current_value, param.unit) : 'No data'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatValue(param.normal_min, param.unit)} ~ {formatValue(param.normal_max, param.unit)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(param.status)}
                    </TableCell>
                    <TableCell>
                      {param.active_triggers > 0 ? (
                        <Badge variant="destructive">{param.active_triggers}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {param.last_update ? formatDateTime(param.last_update) : 'Never'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ES Change Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Equipment Strategy Change Notifications
          </CardTitle>
          <CardDescription>
            Pending reviews for Equipment Strategy modifications based on process changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending notifications
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment Strategy</TableHead>
                  <TableHead>Change Type</TableHead>
                  <TableHead>Current → Recommended</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.notification_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{notification.equipment_strategy.strategy_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {notification.equipment_strategy.equipment.設備名} ({notification.equipment_strategy.equipment.設備タグ})
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{notification.notification_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{notification.current_frequency_type} ({notification.current_frequency_value})</div>
                        <div className="text-green-600">
                          → {notification.recommended_frequency_type} ({notification.recommended_frequency_value})
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md text-sm">
                        {notification.impact_description}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(notification.priority)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDateTime(notification.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-x-1">
                        <Button
                          size="sm"
                          onClick={() => handleNotificationAction(notification.notification_id, 'approve')}
                        >
                          Apply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleNotificationAction(notification.notification_id, 'acknowledge')}
                        >
                          Review
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleNotificationAction(notification.notification_id, 'reject')}
                        >
                          Reject
                        </Button>
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
  )
}