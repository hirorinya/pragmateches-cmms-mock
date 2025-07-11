'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface MaintenanceEquipment {
  設備ID: string
  設備名: string
  設備タグ: string
  設置場所: string
  稼働状態: string
  設備種別名: string
  最新メンテナンス日: string
  メンテナンス回数: number
  メンテナンス履歴: Array<{
    実施日: string
    作業内容: string
    作業結果: string
  }>
}

interface MaintenanceSummary {
  totalEquipmentWithMaintenance: number
  totalMaintenanceRecords: number
  periodDays: number
  cutoffDate: string
}

export function RecentMaintenanceEquipment() {
  const [data, setData] = useState<MaintenanceEquipment[]>([])
  const [summary, setSummary] = useState<MaintenanceSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('365')

  const fetchData = async (days: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/maintenance/recent-equipment?days=${days}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data')
      }
      
      setData(result.data)
      setSummary(result.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(selectedPeriod)
  }, [selectedPeriod])

  const getStatusBadge = (status: string) => {
    const statusMap = {
      '稼働中': 'default',
      '停止中': 'destructive',
      'メンテナンス中': 'secondary',
      '点検中': 'outline'
    }
    return <Badge variant={statusMap[status] || 'default'}>{status}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  const periodOptions = [
    { value: '30', label: '30日間' },
    { value: '90', label: '90日間' },
    { value: '180', label: '180日間' },
    { value: '365', label: '1年間' },
    { value: '730', label: '2年間' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">メンテナンス実績設備</h2>
          <p className="text-muted-foreground">
            指定期間内にメンテナンスが実施された設備の一覧
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={() => fetchData(selectedPeriod)} 
            disabled={loading}
          >
            {loading ? '読み込み中...' : '更新'}
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">対象設備数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalEquipmentWithMaintenance}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総メンテナンス件数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalMaintenanceRecords}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">対象期間</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.periodDays}日</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">基準日</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">{formatDate(summary.cutoffDate)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">エラー: {error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">データを読み込み中...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>メンテナンス実績設備一覧</CardTitle>
            <CardDescription>
              最新のメンテナンス日順に表示
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>設備ID</TableHead>
                  <TableHead>設備名</TableHead>
                  <TableHead>設備種別</TableHead>
                  <TableHead>設置場所</TableHead>
                  <TableHead>稼働状態</TableHead>
                  <TableHead>最新メンテナンス日</TableHead>
                  <TableHead>メンテナンス回数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((equipment) => (
                  <TableRow key={equipment.設備ID}>
                    <TableCell className="font-medium">{equipment.設備ID}</TableCell>
                    <TableCell>{equipment.設備名}</TableCell>
                    <TableCell>{equipment.設備種別名}</TableCell>
                    <TableCell>{equipment.設置場所}</TableCell>
                    <TableCell>{getStatusBadge(equipment.稼働状態)}</TableCell>
                    <TableCell>{formatDate(equipment.最新メンテナンス日)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{equipment.メンテナンス回数}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {data.length === 0 && !loading && (
              <p className="text-center text-muted-foreground py-8">
                指定期間内にメンテナンスが実施された設備はありません。
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}