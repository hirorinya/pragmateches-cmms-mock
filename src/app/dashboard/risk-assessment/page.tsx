'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, AlertTriangle, TrendingUp, Shield, Users, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { RiskMatrix } from '@/components/risk/risk-matrix'
import { RiskTrends } from '@/components/risk/risk-trends'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

interface SystemSummary {
  system_id: string
  system_name: string
  system_type: string
  criticality_level: string
  failure_mode_count: number
  avg_rpn_score: number
  max_rpn_score: number
  high_rpn_count: number
  scenario_count: number
  high_risk_scenarios: number
  equipment_count: number
  last_review_date: string
  pending_reviews: number
}

interface RiskReview {
  review_id: string
  system_id: string
  review_type: string
  review_status: string
  review_date: string
  review_leader: string
  equipment_systems: {
    system_name: string
    system_type: string
  }
  review_leader_staff: {
    氏名: string
    部署: string
  }
}

interface RiskMatrixData {
  cells: Record<string, any>
  scenarios: any[]
}

export default function RiskAssessmentPage() {
  const [systemSummaries, setSystemSummaries] = useState<SystemSummary[]>([])
  const [riskReviews, setRiskReviews] = useState<RiskReview[]>([])
  const [riskMatrix, setRiskMatrix] = useState<RiskMatrixData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSystem, setSelectedSystem] = useState<string>('ALL')
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    fetchData()
  }, [selectedSystem])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchSystemSummaries(),
        fetchRiskReviews(),
        fetchRiskMatrix()
      ])
    } catch (error) {
      console.error('Error fetching risk assessment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemSummaries = async () => {
    try {
      const url = selectedSystem === 'ALL' 
        ? '/api/risk/dashboard'
        : `/api/risk/dashboard?system_id=${selectedSystem}`
      
      const response = await fetch(url)
      const result = await response.json()
      if (result.success) {
        setSystemSummaries(result.data)
      }
    } catch (error) {
      console.error('Error fetching system summaries:', error)
    }
  }

  const fetchRiskReviews = async () => {
    try {
      const url = selectedSystem === 'ALL'
        ? '/api/risk/reviews?status=ALL'
        : `/api/risk/reviews?system_id=${selectedSystem}&status=ALL`
      
      const response = await fetch(url)
      const result = await response.json()
      if (result.success) {
        setRiskReviews(result.data)
      }
    } catch (error) {
      console.error('Error fetching risk reviews:', error)
    }
  }

  const fetchRiskMatrix = async () => {
    try {
      const url = selectedSystem === 'ALL'
        ? '/api/risk/matrix'
        : `/api/risk/matrix?system_id=${selectedSystem}`
      
      const response = await fetch(url)
      const result = await response.json()
      if (result.success) {
        setRiskMatrix(result.data)
      }
    } catch (error) {
      console.error('Error fetching risk matrix:', error)
    }
  }

  const getCriticalityBadge = (level: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'CRITICAL': 'destructive',
      'HIGH': 'default',
      'MEDIUM': 'secondary',
      'LOW': 'outline'
    }
    return <Badge variant={variants[level] || 'outline'}>{level}</Badge>
  }

  const getReviewStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'IN_PROGRESS':
      case 'UNDER_REVIEW':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const calculateOverallRiskLevel = () => {
    if (!systemSummaries.length) return 'UNKNOWN'
    
    const avgMaxRPN = systemSummaries.reduce((sum, s) => sum + (s.max_rpn_score || 0), 0) / systemSummaries.length
    const totalHighRisk = systemSummaries.reduce((sum, s) => sum + (s.high_risk_scenarios || 0), 0)
    
    if (avgMaxRPN > 200 || totalHighRisk > 5) return 'HIGH'
    if (avgMaxRPN > 100 || totalHighRisk > 2) return 'MEDIUM'
    return 'LOW'
  }

  const handleCreateReview = async (systemId: string) => {
    try {
      const response = await fetch('/api/risk/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_review',
          system_id: systemId,
          review_type: 'SCHEDULED',
          review_leader: 'USER001', // In production, use actual user ID
          review_date: new Date().toISOString().split('T')[0]
        })
      })

      if (response.ok) {
        await fetchRiskReviews()
      }
    } catch (error) {
      console.error('Error creating risk review:', error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Risk Assessment & FMEA</h1>
            <p className="text-muted-foreground">
              System-level risk management with failure mode analysis
            </p>
          </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedSystem} onValueChange={setSelectedSystem}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Systems</SelectItem>
              {systemSummaries.map(system => (
                <SelectItem key={system.system_id} value={system.system_id}>
                  {system.system_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={fetchData}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Risk Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overall Risk Level</p>
                <p className="text-2xl font-bold">{calculateOverallRiskLevel()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High RPN Count</p>
                <p className="text-2xl font-bold">
                  {systemSummaries.reduce((sum, s) => sum + (s.high_rpn_count || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Systems Monitored</p>
                <p className="text-2xl font-bold">{systemSummaries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold">
                  {systemSummaries.reduce((sum, s) => sum + (s.pending_reviews || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="matrix">Risk Matrix</TabsTrigger>
          <TabsTrigger value="trends">Risk Trends</TabsTrigger>
          <TabsTrigger value="reviews">Risk Reviews</TabsTrigger>
          <TabsTrigger value="integration">Integration Status</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Risk Summary</CardTitle>
              <CardDescription>
                FMEA-based risk assessment across all monitored systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>System</TableHead>
                      <TableHead>Criticality</TableHead>
                      <TableHead>Failure Modes</TableHead>
                      <TableHead>Max RPN</TableHead>
                      <TableHead>High Risk Scenarios</TableHead>
                      <TableHead>Equipment Count</TableHead>
                      <TableHead>Last Review</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {systemSummaries.map((system) => (
                      <TableRow key={system.system_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{system.system_name}</div>
                            <div className="text-sm text-muted-foreground">{system.system_type}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getCriticalityBadge(system.criticality_level)}
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="font-medium">{system.failure_mode_count}</div>
                            {system.high_rpn_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {system.high_rpn_count} High RPN
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono">
                            {system.max_rpn_score?.toFixed(0) || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="font-medium">{system.scenario_count}</div>
                            {system.high_risk_scenarios > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {system.high_risk_scenarios} High Risk
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{system.equipment_count}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(system.last_review_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-x-1">
                            <Button
                              size="sm"
                              onClick={() => handleCreateReview(system.system_id)}
                            >
                              Review
                            </Button>
                            {system.pending_reviews > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {system.pending_reviews} Pending
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-4">
          {riskMatrix ? (
            <RiskMatrix 
              data={riskMatrix}
              onCellClick={(cell) => console.log('Cell clicked:', cell)}
              onScenarioClick={(scenario) => console.log('Scenario clicked:', scenario)}
            />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  {loading ? 'Loading risk matrix...' : 'No risk scenarios found'}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <RiskTrends 
            systemId={selectedSystem === 'ALL' ? undefined : selectedSystem}
            timeframe="3M"
          />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Risk Review Workflow
              </CardTitle>
              <CardDescription>
                FMEA reviews and approval status across systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>System</TableHead>
                      <TableHead>Review Type</TableHead>
                      <TableHead>Review Date</TableHead>
                      <TableHead>Leader</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riskReviews.map((review) => (
                      <TableRow key={review.review_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{review.equipment_systems.system_name}</div>
                            <div className="text-sm text-muted-foreground">{review.equipment_systems.system_type}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{review.review_type}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(review.review_date)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{review.review_leader_staff?.氏名 || 'System'}</div>
                            <div className="text-sm text-muted-foreground">{review.review_leader_staff?.部署}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getReviewStatusIcon(review.review_status)}
                            <span>{review.review_status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Process Monitoring Integration</CardTitle>
                <CardDescription>
                  Risk reviews triggered by process changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Automatic Trigger Rules</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Risk Review Creation</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>ES Modification Links</span>
                    <Badge variant="secondary">Connected</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Generation Impact</CardTitle>
                <CardDescription>
                  Risk-based task priority and frequency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>High RPN → Increased Frequency</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Risk Level → Task Priority</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Safety Impact → Critical Tasks</span>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  )
}