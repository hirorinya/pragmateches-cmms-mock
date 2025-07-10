"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DashboardLayout } from '@/components/layout/dashboard-layout'

const dataCategories = [
  { value: "precision", label: "静機器", typeId: 1 },
  { value: "rotating", label: "回転機", typeId: 2 },
  { value: "electrical", label: "電気", typeId: 3 },
  { value: "instrumentation", label: "計装", typeId: 4 },
]

export default function InsightsAnalysisPage() {
  const [selectedCategory, setSelectedCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState("")
  const [error, setError] = useState("")

  const handleAnalyzeData = async () => {
    if (!selectedCategory) {
      setError("カテゴリーを選択してください")
      return
    }

    setLoading(true)
    setError("")
    setInsights("")

    const selectedCategory_info = dataCategories.find(c => c.value === selectedCategory)
    const categoryLabel = selectedCategory_info?.label

    try {
      // Fetch real data from Supabase
      const { data: equipmentData, error } = await supabase
        .from('equipment')
        .select(`
          *,
          equipment_type_master("設備種別名"),
          maintenance_history(*),
          anomaly_report(*),
          inspection_plan(*)
        `)
        .eq('設備種別ID', selectedCategory_info?.typeId)
      
      if (error) throw error
      const filteredData = equipmentData || []

      const response = await fetch("/api/chatgpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "insights",
          prompt: `${categoryLabel}の検査データを分析し、必ず番号付きセクションで日本語でインサイトを提供してください。設備データが少ない場合でも、各セクションに何かしらの内容を記載してください。`,
          data: filteredData,
        }),
      })

      const result = await response.json()

      if (result.error) {
        setError(result.error)
      } else {
        console.log('=== FRONTEND DEBUG ===')
        console.log('AI Response length:', result.result?.length || 0)
        console.log('AI Response preview:', result.result?.substring(0, 500) + '...')
        console.log('Full AI Response:', result.result) // Debug log
        console.log('=====================')
        setInsights(result.result)
      }
    } catch (err) {
      setError("エラーが発生しました。もう一度お試しください。")
    } finally {
      setLoading(false)
    }
  }

  const renderInsightSection = (content: string) => {
    // Display the content as-is without any parsing that could break it
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-600">
            <Brain className="h-5 w-5" />
            AI分析結果
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AIインサイト分析</h1>
          <p className="text-gray-600 mt-2">検査データをAIが分析し、重要なインサイトを提供します</p>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>分析設定</CardTitle>
          <CardDescription>
            分析したいデータカテゴリーを選択してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">データカテゴリー</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="カテゴリーを選択" />
              </SelectTrigger>
              <SelectContent>
                {dataCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          <Button
            onClick={handleAnalyzeData}
            disabled={loading || !selectedCategory}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                インサイトを分析
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {insights && (
        <div>
          <h2 className="text-xl font-semibold mb-4">分析結果</h2>
          {renderInsightSection(insights)}
        </div>
      )}
      </div>
    </DashboardLayout>
  )
}