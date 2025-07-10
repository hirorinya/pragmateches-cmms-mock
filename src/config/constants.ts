// CMMS Configuration Constants
// Central location for all configurable values

// Risk Assessment Thresholds
export const RISK_THRESHOLDS = {
  EXTREME: process.env.NEXT_PUBLIC_RISK_EXTREME_THRESHOLD ? parseInt(process.env.NEXT_PUBLIC_RISK_EXTREME_THRESHOLD) : 20,
  HIGH: process.env.NEXT_PUBLIC_RISK_HIGH_THRESHOLD ? parseInt(process.env.NEXT_PUBLIC_RISK_HIGH_THRESHOLD) : 12,
  MEDIUM: process.env.NEXT_PUBLIC_RISK_MEDIUM_THRESHOLD ? parseInt(process.env.NEXT_PUBLIC_RISK_MEDIUM_THRESHOLD) : 6,
  LOW: 0
} as const

// RPN (Risk Priority Number) Threshold
export const RPN_THRESHOLD = process.env.NEXT_PUBLIC_RPN_THRESHOLD ? parseInt(process.env.NEXT_PUBLIC_RPN_THRESHOLD) : 100

// Department Names (should eventually come from database)
export const DEPARTMENTS = {
  REFINERY: '製油部門',
  MAINTENANCE: 'メンテナンス部門',
  OPERATIONS: '運転部門',
  QUALITY: '品質管理部門'
} as const

// Frequency Types
export const FREQUENCY_TYPES = {
  DAILY: { value: 'DAILY', label: '日次' },
  WEEKLY: { value: 'WEEKLY', label: '週次' },
  MONTHLY: { value: 'MONTHLY', label: '月次' },
  QUARTERLY: { value: 'QUARTERLY', label: '四半期' },
  YEARLY: { value: 'YEARLY', label: '年次' }
} as const

// Status Values
export const STATUS = {
  // General Status
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  
  // Task Status
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
  
  // Risk Status
  IMPLEMENTED: 'IMPLEMENTED',
  PLANNED: 'PLANNED',
  NOT_STARTED: 'NOT_STARTED'
} as const

// Risk Levels
export const RISK_LEVELS = {
  CRITICAL: { value: 'CRITICAL', label: '重大', color: '#dc2626' },
  HIGH: { value: 'HIGH', label: '高', color: '#f59e0b' },
  MEDIUM: { value: 'MEDIUM', label: '中', color: '#3b82f6' },
  LOW: { value: 'LOW', label: '低', color: '#10b981' }
} as const

// Process Parameter Types
export const PARAMETER_TYPES = {
  TEMPERATURE: { value: 'TEMPERATURE', label: '温度', unit: '°C' },
  PRESSURE: { value: 'PRESSURE', label: '圧力', unit: 'MPa' },
  FLOW: { value: 'FLOW', label: '流量', unit: 'm³/h' },
  VIBRATION: { value: 'VIBRATION', label: '振動', unit: 'mm/s' },
  LEVEL: { value: 'LEVEL', label: 'レベル', unit: '%' }
} as const

// Work Order Configuration
export const WORK_ORDER = {
  PREFIX: process.env.NEXT_PUBLIC_WORK_ORDER_PREFIX || 'WO',
  ID_LENGTH: 8
} as const

// Date Ranges (relative days from today)
export const DATE_RANGES = {
  DEFAULT_PAST_DAYS: 365,  // 1 year back
  DEFAULT_FUTURE_DAYS: 90, // 3 months forward
  MAINTENANCE_HISTORY_DAYS: 180, // 6 months
  INSPECTION_FORECAST_DAYS: 30   // 1 month
} as const

// Simulation Data Configuration
export const SIMULATION_CONFIG = {
  TEMPERATURE_HIGH: 85.5,
  TEMPERATURE_NORMAL: 65.0,
  VIBRATION_HIGH: 3.2,
  VIBRATION_NORMAL: 1.5,
  FLOW_LOW: 95.0,
  FLOW_NORMAL: 150.0
} as const

// API Timeouts (milliseconds)
export const API_TIMEOUTS = {
  OPENAI: 8000,
  DATABASE: 5000,
  PROCESS_MONITOR: 10000
} as const

// Utility Functions
export function getRelativeDate(daysFromNow: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString()
}

export function generateWorkOrderId(): string {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${WORK_ORDER.PREFIX}-${timestamp.slice(-6)}-${random}`
}

export function getRiskLevelColor(level: keyof typeof RISK_LEVELS): string {
  return RISK_LEVELS[level]?.color || '#6b7280'
}

export function getRiskLevelLabel(level: keyof typeof RISK_LEVELS): string {
  return RISK_LEVELS[level]?.label || level
}