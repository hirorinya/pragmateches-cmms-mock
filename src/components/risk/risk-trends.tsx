'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Calendar } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import { useState, useEffect } from 'react'

interface TrendData {
  date: string
  extreme_count: number
  high_count: number
  medium_count: number
  low_count: number
  total_scenarios: number
  avg_rpn: number
  new_scenarios: number
  closed_scenarios: number
}

interface RiskTrendsProps {
  systemId?: string
  timeframe?: string
}

export function RiskTrends({ systemId, timeframe = '3M' }: RiskTrendsProps) {
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrendData()
  }, [systemId, selectedTimeframe])

  const fetchTrendData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        timeframe: selectedTimeframe,
        ...(systemId && { system_id: systemId })
      })
      
      const response = await fetch(`/api/risk/trends?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setTrendData(result.data)
      }
    } catch (error) {
      console.error('Error fetching risk trends:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTrend = (data: TrendData[], field: keyof TrendData) => {
    if (data.length < 2) return { direction: 'stable', percentage: 0 }
    
    const latest = data[data.length - 1][field] as number
    const previous = data[data.length - 2][field] as number
    
    if (previous === 0) return { direction: 'stable', percentage: 0 }
    
    const percentage = ((latest - previous) / previous) * 100
    
    if (percentage > 5) return { direction: 'up', percentage }
    if (percentage < -5) return { direction: 'down', percentage }
    return { direction: 'stable', percentage }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const highRiskTrend = calculateTrend(trendData, 'extreme_count')
  const avgRpnTrend = calculateTrend(trendData, 'avg_rpn')
  const totalScenariosTrend = calculateTrend(trendData, 'total_scenarios')

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Risk Trends Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Track risk levels and scenario counts over time
          </p>
        </div>
        <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1M">1 Month</SelectItem>
            <SelectItem value="3M">3 Months</SelectItem>
            <SelectItem value="6M">6 Months</SelectItem>
            <SelectItem value="1Y">1 Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Extreme Risk Scenarios</p>
                <p className="text-2xl font-bold">
                  {trendData[trendData.length - 1]?.extreme_count || 0}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(highRiskTrend.direction)}
                <span className="text-sm">
                  {highRiskTrend.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average RPN</p>
                <p className="text-2xl font-bold">
                  {trendData[trendData.length - 1]?.avg_rpn?.toFixed(0) || 0}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(avgRpnTrend.direction)}
                <span className="text-sm">
                  {avgRpnTrend.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Scenarios</p>
                <p className="text-2xl font-bold">
                  {trendData[trendData.length - 1]?.total_scenarios || 0}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(totalScenariosTrend.direction)}
                <span className="text-sm">
                  {totalScenariosTrend.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Level Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Risk Level Distribution Over Time
          </CardTitle>
          <CardDescription>
            Track how risk scenarios are distributed across severity levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">Loading trend data...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('ja-JP')}
                  formatter={(value, name) => [value, name.replace('_count', '').toUpperCase()]}
                />
                <Area type="monotone" dataKey="extreme_count" stackId="1" stroke="#dc2626" fill="#dc2626" fillOpacity={0.8} />
                <Area type="monotone" dataKey="high_count" stackId="1" stroke="#ea580c" fill="#ea580c" fillOpacity={0.8} />
                <Area type="monotone" dataKey="medium_count" stackId="1" stroke="#ca8a04" fill="#ca8a04" fillOpacity={0.8} />
                <Area type="monotone" dataKey="low_count" stackId="1" stroke="#16a34a" fill="#16a34a" fillOpacity={0.8} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Average RPN Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Average RPN Trend</CardTitle>
          <CardDescription>
            Track the overall risk severity through RPN scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">Loading RPN data...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('ja-JP')}
                  formatter={(value) => [value?.toFixed(1), 'Average RPN']}
                />
                <Line 
                  type="monotone" 
                  dataKey="avg_rpn" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Scenario Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scenario Activity
          </CardTitle>
          <CardDescription>
            New scenarios added vs. scenarios closed over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">Loading activity data...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('ja-JP')}
                  formatter={(value, name) => [
                    value, 
                    name === 'new_scenarios' ? 'New Scenarios' : 'Closed Scenarios'
                  ]}
                />
                <Bar dataKey="new_scenarios" fill="#10b981" name="New Scenarios" />
                <Bar dataKey="closed_scenarios" fill="#f59e0b" name="Closed Scenarios" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}