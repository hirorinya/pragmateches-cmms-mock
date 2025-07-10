"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, Loader2, AlertCircle, TrendingUp, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
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
        console.log('AI Response:', result.result) // Debug log
        setInsights(result.result)
      }
    } catch (err) {
      setError("エラーが発生しました。もう一度お試しください。")
    } finally {
      setLoading(false)
    }
  }

  const renderInsightSection = (content: string) => {
    // Try different parsing methods to handle various AI response formats
    let sections: string[] = []
    
    // Method 1: Split by numbered list (1. 2. 3.)
    const numberedSections = content.split(/\d+\.\s*/).filter(Boolean)
    
    // Method 2: Split by section headers if numbered sections don't work
    const headerSections = content.split(/(?=全体的な傾向|注意が必要|異常パターン|推奨される保守|監視ポイント)/).filter(Boolean)
    
    // Use the method that produces more sections
    sections = numberedSections.length > headerSections.length ? numberedSections : headerSections
    
    // If still no good sections, split by double newlines
    if (sections.length <= 1) {
      sections = content.split(/\n\n+/).filter(section => section.trim().length > 0)
    }
    
    const titles = [
      { icon: TrendingUp, title: "全体的な傾向と状態", color: "text-blue-600" },
      { icon: AlertCircle, title: "注意が必要な機器", color: "text-yellow-600" },
      { icon: AlertCircle, title: "異常パターン", color: "text-red-600" },
      { icon: CheckCircle, title: "推奨保守アクション", color: "text-green-600" },
      { icon: TrendingUp, title: "監視ポイント", color: "text-purple-600" },
    ]

    return sections.map((section, index) => {
      if (index >= titles.length) return null
      const { icon: Icon, title, color } = titles[index]
      
      // Clean up the section content
      let cleanSection = section.trim()
      // Remove any leading section headers that might be included
      cleanSection = cleanSection.replace(/^(全体的な傾向と状態|注意が必要な機器|異常パターン|推奨される保守アクション|監視ポイント)[：:\s]*/, '')
      
      return (
        <Card key={index} className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", color)}>
              <Icon className="h-5 w-5" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{cleanSection}</p>
          </CardContent>
        </Card>
      )
    })
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
          {insights.includes("1.") || insights.includes("全体的な傾向") ? (
            renderInsightSection(insights)
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-blue-600">
                  <Brain className="h-5 w-5" />
                  AI分析結果
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{insights}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      </div>
    </DashboardLayout>
  )
}