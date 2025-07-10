'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Bell, CheckCircle2, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProcessAlert {
  alert_id: string
  parameter_id: string
  alert_type: string
  severity: string
  message: string
  trigger_value: number
  threshold_value: number
  equipment_name: string
  parameter_name: string
  tag_name: string
  created_at: string
  acknowledged_at?: string
  resolved_at?: string
  status: string
}

interface RealTimeAlertsProps {
  systemId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function RealTimeAlerts({ 
  systemId, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: RealTimeAlertsProps) {
  const [alerts, setAlerts] = useState<ProcessAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'critical'>('active')

  useEffect(() => {
    fetchAlerts()
    
    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [systemId, autoRefresh, refreshInterval])

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams({
        status: filter === 'all' ? 'ALL' : filter === 'active' ? 'ACTIVE' : 'CRITICAL',
        ...(systemId && { system_id: systemId })
      })
      
      const response = await fetch(`/api/process/alerts?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setAlerts(result.data)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcknowledge = async (alertId: string) => {
    try {
      const response = await fetch('/api/process/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_id: alertId,
          action: 'acknowledge',
          acknowledged_by: 'SYSTEM' // In production, use actual user ID
        })
      })

      if (response.ok) {
        await fetchAlerts()
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error)
    }
  }

  const handleResolve = async (alertId: string) => {
    try {
      const response = await fetch('/api/process/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_id: alertId,
          action: 'resolve',
          resolved_by: 'SYSTEM' // In production, use actual user ID
        })
      })

      if (response.ok) {
        await fetchAlerts()
      }
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'MEDIUM':
        return <Bell className="h-4 w-4 text-yellow-500" />
      default:
        return <Bell className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'CRITICAL': 'destructive',
      'HIGH': 'default',
      'MEDIUM': 'secondary',
      'LOW': 'outline'
    }
    return <Badge variant={variants[severity] || 'outline'}>{severity}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'ACKNOWLEDGED':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE')
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE')

  return (
    <div className="space-y-4">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold">{activeAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2">
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Active ({activeAlerts.length})
        </Button>
        <Button
          variant={filter === 'critical' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('critical')}
        >
          Critical ({criticalAlerts.length})
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({alerts.length})
        </Button>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Real-time Process Alerts
          </CardTitle>
          <CardDescription>
            Live monitoring of process parameter violations and anomalies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No alerts found
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  className={cn(
                    "flex items-start justify-between p-4 border rounded-lg",
                    alert.severity === 'CRITICAL' && "border-red-300 bg-red-50",
                    alert.severity === 'HIGH' && "border-orange-300 bg-orange-50",
                    alert.severity === 'MEDIUM' && "border-yellow-300 bg-yellow-50",
                    alert.status === 'RESOLVED' && "border-green-300 bg-green-50 opacity-75"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getSeverityIcon(alert.severity)}
                      {getSeverityBadge(alert.severity)}
                      {getStatusIcon(alert.status)}
                      <span className="text-sm text-gray-500">
                        {formatDateTime(alert.created_at)}
                      </span>
                    </div>
                    
                    <h4 className="font-medium mb-1">
                      {alert.equipment_name} - {alert.parameter_name}
                    </h4>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {alert.message}
                    </p>
                    
                    <div className="text-xs text-gray-500">
                      Tag: {alert.tag_name} | Value: {alert.trigger_value} | Threshold: {alert.threshold_value}
                    </div>
                    
                    {alert.acknowledged_at && (
                      <div className="text-xs text-blue-600 mt-1">
                        Acknowledged: {formatDateTime(alert.acknowledged_at)}
                      </div>
                    )}
                    
                    {alert.resolved_at && (
                      <div className="text-xs text-green-600 mt-1">
                        Resolved: {formatDateTime(alert.resolved_at)}
                      </div>
                    )}
                  </div>
                  
                  {alert.status === 'ACTIVE' && (
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(alert.alert_id)}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleResolve(alert.alert_id)}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  )}
                  
                  {alert.status === 'ACKNOWLEDGED' && (
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleResolve(alert.alert_id)}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}