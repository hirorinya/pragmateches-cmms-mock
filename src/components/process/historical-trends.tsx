'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { TrendingUp, Calendar, RefreshCw } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface TrendDataPoint {
  timestamp: string
  value: number
  status: string
  parameter_name: string
  unit: string
}

interface ParameterTrend {
  parameter_id: string
  parameter_name: string
  tag_name: string
  equipment_name: string
  unit: string
  normal_min: number
  normal_max: number
  critical_min: number
  critical_max: number
  data_points: TrendDataPoint[]
}

interface HistoricalTrendsProps {
  systemId?: string
  equipmentId?: string
}

export function HistoricalTrends({ systemId, equipmentId }: HistoricalTrendsProps) {
  const [trends, setTrends] = useState<ParameterTrend[]>([])
  const [selectedParameter, setSelectedParameter] = useState<string>('')
  const [timeRange, setTimeRange] = useState<string>('24h')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrends()
  }, [systemId, equipmentId, timeRange])

  const fetchTrends = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        time_range: timeRange,
        ...(systemId && { system_id: systemId }),
        ...(equipmentId && { equipment_id: equipmentId })
      })
      
      const response = await fetch(`/api/process/trends?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setTrends(result.data)
        if (result.data.length > 0 && !selectedParameter) {
          setSelectedParameter(result.data[0].parameter_id)
        }
      }
    } catch (error) {
      console.error('Error fetching trends:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedTrend = trends.find(t => t.parameter_id === selectedParameter)

  const formatTooltipValue = (value: number, name: string, props: any) => {
    const unit = props.payload?.unit || ''
    return [`${value.toFixed(2)} ${unit}`, name]
  }

  const formatXAxisTick = (tickItem: string) => {
    const date = new Date(tickItem)
    if (timeRange === '24h') {
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    } else if (timeRange === '7d') {
      return date.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })
    } else {
      return date.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })
    }
  }

  const getStatusColor = (value: number, trend: ParameterTrend) => {
    if (value < trend.critical_min || value > trend.critical_max) return '#dc2626' // red
    if (value < trend.normal_min || value > trend.normal_max) return '#ea580c' // orange
    return '#16a34a' // green
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Historical Parameter Trends</h3>
          <p className="text-sm text-muted-foreground">
            Analyze parameter behavior and identify patterns over time
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchTrends} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Parameter Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Parameter</CardTitle>
          <CardDescription>
            Choose a parameter to view its historical trend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedParameter} onValueChange={setSelectedParameter}>
            <SelectTrigger>
              <SelectValue placeholder="Select a parameter to analyze" />
            </SelectTrigger>
            <SelectContent>
              {trends.map((trend) => (
                <SelectItem key={trend.parameter_id} value={trend.parameter_id}>
                  {trend.equipment_name} - {trend.parameter_name} ({trend.tag_name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      {selectedTrend && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {selectedTrend.equipment_name} - {selectedTrend.parameter_name}
            </CardTitle>
            <CardDescription>
              Tag: {selectedTrend.tag_name} | 
              Normal Range: {selectedTrend.normal_min.toFixed(1)} - {selectedTrend.normal_max.toFixed(1)} {selectedTrend.unit}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">Loading trend data...</div>
              </div>
            ) : selectedTrend.data_points.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  No data available for the selected time range
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={selectedTrend.data_points}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatXAxisTick}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={['dataMin - 5', 'dataMax + 5']}
                    tickFormatter={(value) => `${value.toFixed(1)} ${selectedTrend.unit}`}
                  />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleString('ja-JP')}
                    formatter={formatTooltipValue}
                  />
                  
                  {/* Reference lines for thresholds */}
                  <ReferenceLine 
                    y={selectedTrend.normal_max} 
                    stroke="#ea580c" 
                    strokeDasharray="5 5"
                    label={{ value: "Normal Max", position: "right" }}
                  />
                  <ReferenceLine 
                    y={selectedTrend.normal_min} 
                    stroke="#ea580c" 
                    strokeDasharray="5 5"
                    label={{ value: "Normal Min", position: "right" }}
                  />
                  <ReferenceLine 
                    y={selectedTrend.critical_max} 
                    stroke="#dc2626" 
                    strokeDasharray="2 2"
                    label={{ value: "Critical Max", position: "right" }}
                  />
                  <ReferenceLine 
                    y={selectedTrend.critical_min} 
                    stroke="#dc2626" 
                    strokeDasharray="2 2"
                    label={{ value: "Critical Min", position: "right" }}
                  />
                  
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props
                      const color = getStatusColor(payload.value, selectedTrend)
                      return <circle cx={cx} cy={cy} r={3} fill={color} stroke={color} strokeWidth={2} />
                    }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trend Statistics */}
      {selectedTrend && selectedTrend.data_points.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Current Value</p>
                <p className="text-2xl font-bold">
                  {selectedTrend.data_points[selectedTrend.data_points.length - 1]?.value.toFixed(2)} {selectedTrend.unit}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Average</p>
                <p className="text-2xl font-bold">
                  {(selectedTrend.data_points.reduce((sum, dp) => sum + dp.value, 0) / selectedTrend.data_points.length).toFixed(2)} {selectedTrend.unit}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Maximum</p>
                <p className="text-2xl font-bold">
                  {Math.max(...selectedTrend.data_points.map(dp => dp.value)).toFixed(2)} {selectedTrend.unit}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Minimum</p>
                <p className="text-2xl font-bold">
                  {Math.min(...selectedTrend.data_points.map(dp => dp.value)).toFixed(2)} {selectedTrend.unit}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}