"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { InspectionResultsTable } from "@/components/inspection/inspection-results-table"
import { supabase } from "@/lib/supabase"

export default function InstrumentationPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data: inspectionData, error } = await supabase
        .from('inspection_plan')
        .select(`
          *,
          equipment!inner(equipment_name, equipment_tag, equipment_type_id)
        `)
        .eq('equipment.equipment_type_id', 4) // 4 = 計装設備
        .order('next_inspection_date', { ascending: true })

      if (error) {
        console.error('Error fetching data:', error)
      } else {
        // Transform data to match the expected format
        const transformedData = inspectionData?.map(item => ({
          equipmentNo: item.equipment?.equipment_tag || '',
          component: item.equipment?.equipment_name || '',
          measurementPoint: item.inspection_item || '',
          inspectionDate: item.next_inspection_date || '',
          status: item.status === '完了' ? '合格' : item.status === '計画済' ? '要確認' : '不合格'
        })) || []
        
        setData(transformedData)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <InspectionResultsTable data={data} title="計装" />
    </DashboardLayout>
  )
}