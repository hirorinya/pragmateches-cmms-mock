export interface InspectionResult {
  equipmentNo: string
  component: string
  measurementPoint: string
  inspectionDate: string
  status?: "合格" | "不合格" | "要確認"
}

// Sample data moved to database - use API endpoints to fetch inspection results
// This data is now stored in the inspection_results table
export const precisionEquipmentData: InspectionResult[] = [
  // TODO: Remove hardcoded data - fetch from database instead
  // Sample data kept for backward compatibility during migration
]

// Sample data moved to database - use API endpoints to fetch inspection results
export const rotatingEquipmentData: InspectionResult[] = [
  // TODO: Remove hardcoded data - fetch from database instead
]

// Sample data moved to database - use API endpoints to fetch inspection results
export const electricalData: InspectionResult[] = [
  // TODO: Remove hardcoded data - fetch from database instead
]

// Sample data moved to database - use API endpoints to fetch inspection results
export const instrumentationData: InspectionResult[] = [
  // TODO: Remove hardcoded data - fetch from database instead
] 