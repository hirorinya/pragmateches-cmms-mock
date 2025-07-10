'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GitBranch, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface CorrelationData {
  x_value: number
  y_value: number
  timestamp: string
  status: string
}

interface ParameterCorrelation {
  parameter_x_id: string
  parameter_y_id: string
  parameter_x_name: string
  parameter_y_name: string
  equipment_x_name: string
  equipment_y_name: string
  tag_x: string
  tag_y: string
  unit_x: string
  unit_y: string
  correlation_coefficient: number
  correlation_strength: string
  data_points: CorrelationData[]
  analysis_period: string
}

interface ParameterOption {
  parameter_id: string
  parameter_name: string
  equipment_name: string
  tag_name: string
  unit: string
}

interface ParameterCorrelationProps {
  systemId?: string
  equipmentId?: string
}

export function ParameterCorrelation({ systemId, equipmentId }: ParameterCorrelationProps) {
  const [correlations, setCorrelations] = useState<ParameterCorrelation[]>([])
  const [parameters, setParameters] = useState<ParameterOption[]>([])
  const [parameterX, setParameterX] = useState<string>('')
  const [parameterY, setParameterY] = useState<string>('')
  const [timeRange, setTimeRange] = useState<string>('24h')
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    fetchParameters()
  }, [systemId, equipmentId])

  useEffect(() => {
    if (parameterX && parameterY && parameterX !== parameterY) {
      analyzeCorrelation()
    }
  }, [parameterX, parameterY, timeRange])

  const fetchParameters = async () => {
    try {
      const params = new URLSearchParams({
        ...(systemId && { system_id: systemId }),
        ...(equipmentId && { equipment_id: equipmentId })
      })
      
      const response = await fetch(`/api/process/parameters?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setParameters(result.data)
      }
    } catch (error) {
      console.error('Error fetching parameters:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeCorrelation = async () => {
    if (!parameterX || !parameterY) return
    
    setAnalyzing(true)
    try {
      const params = new URLSearchParams({
        parameter_x: parameterX,
        parameter_y: parameterY,
        time_range: timeRange
      })
      
      const response = await fetch(`/api/process/correlation?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setCorrelations([result.data])
      }
    } catch (error) {
      console.error('Error analyzing correlation:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const getCorrelationStrength = (coefficient: number) => {
    const abs = Math.abs(coefficient)
    if (abs >= 0.8) return 'Very Strong'
    if (abs >= 0.6) return 'Strong'
    if (abs >= 0.4) return 'Moderate'
    if (abs >= 0.2) return 'Weak'
    return 'Very Weak'
  }

  const getCorrelationBadge = (coefficient: number) => {
    const strength = getCorrelationStrength(coefficient)
    const variant = Math.abs(coefficient) >= 0.6 ? 'default' : 
                   Math.abs(coefficient) >= 0.4 ? 'secondary' : 'outline'
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {coefficient > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {strength} ({coefficient.toFixed(3)})
      </Badge>
    )
  }

  const getPointColor = (point: CorrelationData) => {
    switch (point.status) {
      case 'CRITICAL': return '#dc2626'
      case 'WARNING': return '#ea580c'
      case 'NORMAL': return '#16a34a'
      default: return '#2563eb'
    }
  }

  const currentCorrelation = correlations[0]

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Parameter Correlation Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Discover relationships between process parameters
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
          <Button onClick={analyzeCorrelation} variant="outline" size="sm" disabled={!parameterX || !parameterY}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Analyze
          </Button>
        </div>
      </div>

      {/* Parameter Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Parameters to Compare</CardTitle>
          <CardDescription>
            Choose two parameters to analyze their correlation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">X-Axis Parameter</label>
              <Select value={parameterX} onValueChange={setParameterX}>
                <SelectTrigger>
                  <SelectValue placeholder="Select X parameter" />
                </SelectTrigger>
                <SelectContent>
                  {parameters.map((param) => (
                    <SelectItem key={param.parameter_id} value={param.parameter_id}>
                      {param.equipment_name} - {param.parameter_name} ({param.tag_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Y-Axis Parameter</label>
              <Select value={parameterY} onValueChange={setParameterY}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Y parameter" />
                </SelectTrigger>
                <SelectContent>
                  {parameters.filter(p => p.parameter_id !== parameterX).map((param) => (
                    <SelectItem key={param.parameter_id} value={param.parameter_id}>
                      {param.equipment_name} - {param.parameter_name} ({param.tag_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Correlation Results */}
      {currentCorrelation && (
        <>
          {/* Correlation Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Correlation Analysis Results
              </CardTitle>
              <CardDescription>
                Analysis period: {currentCorrelation.analysis_period} | 
                Data points: {currentCorrelation.data_points.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">X Parameter</p>
                  <p className="font-medium">{currentCorrelation.parameter_x_name}</p>
                  <p className="text-sm text-gray-500">
                    {currentCorrelation.equipment_x_name} ({currentCorrelation.tag_x})
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Correlation</p>
                  <div className="flex justify-center">
                    {getCorrelationBadge(currentCorrelation.correlation_coefficient)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {currentCorrelation.correlation_coefficient > 0 ? 'Positive' : 'Negative'} relationship
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Y Parameter</p>
                  <p className="font-medium">{currentCorrelation.parameter_y_name}</p>
                  <p className="text-sm text-gray-500">
                    {currentCorrelation.equipment_y_name} ({currentCorrelation.tag_y})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scatter Plot */}
          <Card>
            <CardHeader>
              <CardTitle>Correlation Scatter Plot</CardTitle>
              <CardDescription>
                Each point represents a measurement pair colored by operational status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyzing ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">Analyzing correlation...</div>
                </div>
              ) : currentCorrelation.data_points.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    No data available for correlation analysis
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="x_value" 
                      name={currentCorrelation.parameter_x_name}
                      unit={currentCorrelation.unit_x}
                      tickFormatter={(value) => `${value.toFixed(1)}`}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y_value" 
                      name={currentCorrelation.parameter_y_name}
                      unit={currentCorrelation.unit_y}
                      tickFormatter={(value) => `${value.toFixed(1)}`}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value.toFixed(2)} ${name === 'x_value' ? currentCorrelation.unit_x : currentCorrelation.unit_y}`,
                        name === 'x_value' ? currentCorrelation.parameter_x_name : currentCorrelation.parameter_y_name
                      ]}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return new Date(payload[0].payload.timestamp).toLocaleString('ja-JP')
                        }
                        return ''
                      }}
                    />
                    <Scatter 
                      data={currentCorrelation.data_points} 
                      fill="#2563eb"
                      shape={(props) => {
                        const { cx, cy, payload } = props
                        const color = getPointColor(payload)
                        return <circle cx={cx} cy={cy} r={4} fill={color} stroke={color} strokeWidth={2} />
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Correlation Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Insights</CardTitle>
              <CardDescription>
                Interpretation of the correlation results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Statistical Summary</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Correlation coefficient: {currentCorrelation.correlation_coefficient.toFixed(3)}</li>
                    <li>• Relationship strength: {getCorrelationStrength(currentCorrelation.correlation_coefficient)}</li>
                    <li>• Data points analyzed: {currentCorrelation.data_points.length}</li>
                    <li>• Analysis period: {currentCorrelation.analysis_period}</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium mb-2">Operational Implications</h4>
                  <div className="text-sm space-y-1">
                    {Math.abs(currentCorrelation.correlation_coefficient) >= 0.6 ? (
                      <p>• <strong>Strong correlation detected:</strong> Changes in {currentCorrelation.parameter_x_name} are likely to affect {currentCorrelation.parameter_y_name}</p>
                    ) : Math.abs(currentCorrelation.correlation_coefficient) >= 0.4 ? (
                      <p>• <strong>Moderate correlation:</strong> Some relationship exists between the parameters</p>
                    ) : (
                      <p>• <strong>Weak correlation:</strong> Parameters appear to be largely independent</p>
                    )}
                    
                    {currentCorrelation.correlation_coefficient > 0 ? (
                      <p>• <strong>Positive relationship:</strong> When one parameter increases, the other tends to increase</p>
                    ) : (
                      <p>• <strong>Negative relationship:</strong> When one parameter increases, the other tends to decrease</p>
                    )}
                    
                    {Math.abs(currentCorrelation.correlation_coefficient) >= 0.6 && (
                      <p>• <strong>Recommendation:</strong> Monitor both parameters together for process optimization</p>
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Status Legend</h4>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-600"></div>
                      <span>Normal Operation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                      <span>Warning Conditions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-600"></div>
                      <span>Critical Conditions</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}