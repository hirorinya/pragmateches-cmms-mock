export interface InspectionResult {
  equipmentNo: string
  component: string
  measurementPoint: string
  inspectionDate: string
  status?: "合格" | "不合格" | "要確認"
}

export interface InspectionPlan {
  設備ID: string
  次回検査日: string
  検査種別: string
  検査間隔: string
  equipment?: {
    設備名: string
    設備種別ID: string
    equipment_type_master: {
      設備種別名: string
    }
  }
}

export interface MaintenanceHistory {
  設備ID: string
  実施日: string
  作業内容: string
  作業者: string
  作業時間: string
  equipment?: {
    設備名: string
    設備種別ID: string
    equipment_type_master: {
      設備種別名: string
    }
  }
} 