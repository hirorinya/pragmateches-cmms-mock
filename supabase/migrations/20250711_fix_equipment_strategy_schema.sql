-- ============================================
-- Fix Equipment Strategy Table Schema
-- Created: 2025-07-11
-- Purpose: Add missing columns that AI system expects
-- ============================================

-- Add missing columns to equipment_strategy table
ALTER TABLE equipment_strategy 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS responsible_department VARCHAR(50),
ADD COLUMN IF NOT EXISTS next_execution_date DATE,
ADD COLUMN IF NOT EXISTS strategy_description TEXT;

-- Update existing records to have proper status
UPDATE equipment_strategy 
SET status = CASE 
  WHEN is_active = true THEN 'ACTIVE'
  WHEN is_active = false THEN 'INACTIVE'
  ELSE 'ACTIVE'
END
WHERE status IS NULL;

-- Copy task_description to strategy_description for consistency
UPDATE equipment_strategy 
SET strategy_description = task_description
WHERE strategy_description IS NULL;

-- Add default responsible departments based on equipment type
UPDATE equipment_strategy 
SET responsible_department = CASE 
  WHEN equipment_id LIKE 'TK-%' THEN 'MAINTENANCE'
  WHEN equipment_id LIKE 'HX-%' THEN 'MAINTENANCE' 
  WHEN equipment_id LIKE 'PU-%' THEN 'REFINERY'
  WHEN equipment_id LIKE 'EQ0%' THEN 'PRODUCTION'
  ELSE 'MAINTENANCE'
END
WHERE responsible_department IS NULL;

-- Set next execution dates based on frequency
UPDATE equipment_strategy 
SET next_execution_date = CASE 
  WHEN frequency_type = 'DAILY' THEN CURRENT_DATE + INTERVAL '1 day'
  WHEN frequency_type = 'WEEKLY' THEN CURRENT_DATE + INTERVAL '1 week'
  WHEN frequency_type = 'MONTHLY' THEN CURRENT_DATE + INTERVAL '1 month'
  WHEN frequency_type = 'QUARTERLY' THEN CURRENT_DATE + INTERVAL '3 months'
  WHEN frequency_type = 'ANNUAL' THEN CURRENT_DATE + INTERVAL '1 year'
  ELSE CURRENT_DATE + INTERVAL '1 month'
END
WHERE next_execution_date IS NULL;

-- Now insert the comprehensive equipment strategies for new equipment
INSERT INTO equipment_strategy (
  strategy_id, equipment_id, strategy_name, strategy_type, frequency_type, frequency_value,
  estimated_duration_hours, required_skill_level, required_area, task_description,
  strategy_description, responsible_department, status, next_execution_date,
  safety_requirements, tools_required, parts_required, priority, is_active
) VALUES

-- Heat Exchanger Strategies
('ES-HX-100-001', 'HX-100', '主熱交換器定期点検', 'PREVENTIVE', 'MONTHLY', 1, 
 4.0, 'INTERMEDIATE', 'FIELD', '熱交換器性能点検・清掃作業',
 '熱交換器定期点検・清掃', 'MAINTENANCE', 'ACTIVE', '2025-08-01',
 'プロセス停止、高温注意', '温度計、圧力計、清掃用具', '清掃薬品', 'HIGH', true),

('ES-HX-100-002', 'HX-100', '熱交換器チューブ清掃', 'CONDITION_BASED', 'WEEKLY', 1,
 2.0, 'BASIC', 'FIELD', '圧力差監視による清掃判定',
 '条件ベース清掃作業', 'REFINERY', 'ACTIVE', '2025-07-18',
 '標準PPE着用', '圧力計、清掃システム', '清掃溶液', 'MEDIUM', true),

('ES-HX-101-001', 'HX-101', '予備熱交換器点検', 'PREVENTIVE', 'MONTHLY', 1,
 3.5, 'INTERMEDIATE', 'FIELD', '予備機の性能確認・待機状態点検',
 '予備熱交換器定期点検', 'MAINTENANCE', 'ACTIVE', '2025-08-01',
 'プロセス停止、安全確認', '点検用具一式', 'なし', 'MEDIUM', true),

('ES-HX-102-001', 'HX-102', '補助熱交換器点検', 'PREVENTIVE', 'MONTHLY', 1,
 3.0, 'BASIC', 'FIELD', '補助熱交換器の日常点検',
 '補助熱交換器定期点検', 'MAINTENANCE', 'ACTIVE', '2025-08-01',
 '標準作業手順遵守', '点検チェックリスト', 'なし', 'MEDIUM', true),

('ES-HX-103-001', 'HX-103', '冷却水熱交換器点検', 'PREVENTIVE', 'WEEKLY', 1,
 2.5, 'BASIC', 'FIELD', '冷却水系統熱交換器点検',
 '冷却水熱交換器週次点検', 'REFINERY', 'ACTIVE', '2025-07-18',
 '水質確認、漏れ点検', '流量計、温度計', 'なし', 'HIGH', true),

-- Tank Strategies  
('ES-TK-100-001', 'TK-100', '冷却水タンク点検', 'PREVENTIVE', 'WEEKLY', 1,
 1.5, 'BASIC', 'FIELD', '冷却水タンクレベル・状態確認',
 '冷却水タンク週次点検', 'REFINERY', 'ACTIVE', '2025-07-18',
 '転落防止対策', 'レベル計、目視点検', 'なし', 'MEDIUM', true),

('ES-TK-101-001', 'TK-101', '冷却水予備タンク点検', 'PREVENTIVE', 'MONTHLY', 1,
 2.0, 'BASIC', 'FIELD', '予備タンクの状態確認・清掃',
 '冷却水予備タンク月次点検', 'MAINTENANCE', 'ACTIVE', '2025-08-01',
 '密閉空間作業許可', '清掃用具、安全ロープ', '清掃薬品', 'MEDIUM', true),

('ES-TK-200-001', 'TK-200', '原料タンク点検', 'PREVENTIVE', 'WEEKLY', 1,
 2.5, 'INTERMEDIATE', 'FIELD', '原料タンクレベル・品質管理',
 '原料タンク週次点検', 'PRODUCTION', 'ACTIVE', '2025-07-18',
 '防爆対策、静電気除去', 'サンプリング器具', 'なし', 'HIGH', true),

('ES-TK-201-001', 'TK-201', '原料予備タンク点検', 'PREVENTIVE', 'MONTHLY', 1,
 2.0, 'INTERMEDIATE', 'FIELD', '予備原料タンク状態確認',
 '原料予備タンク月次点検', 'PRODUCTION', 'ACTIVE', '2025-08-01',
 '防爆対策必須', 'ガス検知器、サンプリング器具', 'なし', 'MEDIUM', true),

-- Pump Strategies
('ES-PU-100-001', 'PU-100', '冷却水循環ポンプ点検', 'PREVENTIVE', 'WEEKLY', 1,
 1.5, 'INTERMEDIATE', 'FIELD', '冷却水ポンプ性能・振動点検',
 '冷却水循環ポンプ週次点検', 'REFINERY', 'ACTIVE', '2025-07-18',
 'ロックアウト・タグアウト', '振動計、温度計', 'なし', 'HIGH', true),

('ES-PU-101-001', 'PU-101', '冷却水予備ポンプ点検', 'PREVENTIVE', 'MONTHLY', 1,
 2.0, 'INTERMEDIATE', 'FIELD', '予備ポンプ待機状態確認',
 '冷却水予備ポンプ月次点検', 'MAINTENANCE', 'ACTIVE', '2025-08-01',
 '自動切替確認', '性能確認用具', 'なし', 'MEDIUM', true),

('ES-PU-200-001', 'PU-200', '原料供給ポンプ点検', 'PREVENTIVE', 'WEEKLY', 1,
 2.0, 'INTERMEDIATE', 'FIELD', '原料供給ポンプ性能確認',
 '原料供給ポンプ週次点検', 'PRODUCTION', 'ACTIVE', '2025-07-18',
 '防爆対策、密閉作業', '流量計、圧力計', 'シール材', 'HIGH', true),

('ES-PU-201-001', 'PU-201', '原料予備ポンプ点検', 'PREVENTIVE', 'MONTHLY', 1,
 1.5, 'INTERMEDIATE', 'FIELD', '原料供給予備ポンプ確認',
 '原料予備ポンプ月次点検', 'PRODUCTION', 'ACTIVE', '2025-08-01',
 '防爆対策必須', '性能測定器具', 'なし', 'MEDIUM', true)

ON CONFLICT (strategy_id) DO UPDATE SET
  strategy_name = EXCLUDED.strategy_name,
  strategy_description = EXCLUDED.strategy_description,
  responsible_department = EXCLUDED.responsible_department,
  status = EXCLUDED.status,
  next_execution_date = EXCLUDED.next_execution_date;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_equipment_strategy_equipment_id ON equipment_strategy(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_strategy_status ON equipment_strategy(status);
CREATE INDEX IF NOT EXISTS idx_equipment_strategy_department ON equipment_strategy(responsible_department);
CREATE INDEX IF NOT EXISTS idx_equipment_strategy_next_date ON equipment_strategy(next_execution_date);

-- Log this migration
INSERT INTO migration_log (migration_name, applied_at, description) 
VALUES (
  '20250711_fix_equipment_strategy_schema',
  NOW(),
  'Fixed equipment_strategy table schema by adding missing columns (status, responsible_department, next_execution_date, strategy_description) and created comprehensive strategies for new equipment'
) ON CONFLICT DO NOTHING;