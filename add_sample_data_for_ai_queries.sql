-- Sample Data for AI Database Query Testing
-- This file adds sample data to test COVERAGE_ANALYSIS and MITIGATION_STATUS queries

-- 1. Equipment Systems
INSERT INTO equipment_systems (system_id, system_name, system_type, criticality_level, description) VALUES
('SYS-001', 'プロセス冷却系統', 'UNIT', 'HIGH', 'Process cooling system with heat exchangers'),
('SYS-002', '原料供給系統', 'UNIT', 'CRITICAL', 'Raw material supply system'),
('SYS-003', '排水処理系統', 'UNIT', 'MEDIUM', 'Wastewater treatment system'),
('SYS-004', '電力供給系統', 'UTILITY', 'CRITICAL', 'Power supply system')
ON CONFLICT (system_id) DO UPDATE SET
  system_name = EXCLUDED.system_name,
  system_type = EXCLUDED.system_type,
  criticality_level = EXCLUDED.criticality_level,
  description = EXCLUDED.description;

-- 2. Equipment System Mapping
INSERT INTO equipment_system_mapping (equipment_id, system_id, role_in_system) VALUES
('EQ001', 'SYS-001', 'PRIMARY'),
('EQ002', 'SYS-001', 'BACKUP'),
('EQ003', 'SYS-001', 'SUPPORT'),
('EQ004', 'SYS-002', 'PRIMARY'),
('EQ005', 'SYS-002', 'PRIMARY'),
('EQ006', 'SYS-003', 'PRIMARY'),
('EQ007', 'SYS-004', 'PRIMARY'),
('HX-100', 'SYS-001', 'PRIMARY'),
('HX-101', 'SYS-001', 'BACKUP'),
('HX-102', 'SYS-001', 'SUPPORT')
ON CONFLICT (equipment_id, system_id) DO UPDATE SET
  role_in_system = EXCLUDED.role_in_system;

-- 3. Failure Modes for Risk Coverage Analysis
INSERT INTO failure_modes (
  system_id, equipment_id, failure_mode, failure_mechanism, 
  failure_effect_local, failure_effect_system, failure_effect_plant,
  detection_method, current_controls, recommended_actions,
  severity_score, occurrence_score, detection_score,
  safety_impact, environmental_impact, production_impact,
  is_active, created_by, updated_by
) VALUES
-- SYS-001 Equipment with fouling risks
('SYS-001', 'HX-100', 'Fouling blockage', 'Deposit buildup in heat exchanger tubes', 
 'Reduced heat transfer efficiency', 'System cooling capacity reduced', 'Production rate impact',
 'Pressure drop monitoring', 'Regular cleaning schedule', 'Implement online cleaning system',
 7, 5, 4, false, true, true, true, 'SYSTEM', 'SYSTEM'),

('SYS-001', 'HX-101', 'Fouling blockage', 'Scale formation on heat transfer surfaces',
 'Heat transfer degradation', 'Backup cooling compromised', 'Increased energy consumption',
 'Temperature monitoring', 'Chemical cleaning', 'Upgrade to anti-fouling coating',
 6, 4, 5, false, false, true, true, 'SYSTEM', 'SYSTEM'),

-- SYS-001 Equipment without fouling risks (for testing missing coverage)
('SYS-001', 'EQ001', 'Mechanical wear', 'Bearing degradation',
 'Vibration increase', 'Equipment reliability issues', 'Maintenance disruption',
 'Vibration monitoring', 'Lubrication schedule', 'Bearing replacement program',
 5, 3, 6, false, false, true, true, 'SYSTEM', 'SYSTEM'),

-- SYS-002 Equipment with various risks
('SYS-002', 'EQ004', 'Corrosion', 'Internal corrosion',
 'Wall thickness reduction', 'Potential leak', 'Safety hazard',
 'Thickness monitoring', 'Corrosion inhibitor', 'Material upgrade',
 8, 4, 3, true, true, true, true, 'SYSTEM', 'SYSTEM'),

('SYS-002', 'EQ005', 'Fouling blockage', 'Product contamination buildup',
 'Flow restriction', 'Supply disruption', 'Production stoppage',
 'Flow monitoring', 'Regular inspection', 'Implement filtration system',
 6, 5, 4, false, false, true, true, 'SYSTEM', 'SYSTEM')
ON CONFLICT (failure_mode_id) DO NOTHING;

-- 4. Risk Scenarios
INSERT INTO risk_scenarios (
  system_id, scenario_name, scenario_description, trigger_conditions,
  likelihood_category, likelihood_score, consequence_category, consequence_score,
  current_barriers, mitigation_status, is_active
) VALUES
('SYS-001', 'Heat Exchanger Fouling Event', 'Multiple heat exchangers affected by fouling simultaneously',
 'High process temperature and contamination levels', 'POSSIBLE', 3, 'MAJOR', 4,
 ARRAY['Regular cleaning', 'Monitoring systems', 'Backup equipment'], 'ACTIVE', true),

('SYS-002', 'Raw Material Supply Disruption', 'Fouling causes supply line blockage',
 'Contaminated feed material', 'LIKELY', 4, 'MODERATE', 3,
 ARRAY['Filtration system', 'Alternative supply routes'], 'ACTIVE', true)
ON CONFLICT (scenario_id) DO NOTHING;

-- 5. Equipment Strategies for Mitigation Status Analysis
INSERT INTO equipment_strategy (
  strategy_id, equipment_id, strategy_name, strategy_type, frequency_type, frequency_value,
  estimated_duration_hours, required_skill_level, required_area, task_description,
  safety_requirements, tools_required, parts_required, priority, is_active
) VALUES
('ES001', 'EQ005', 'Monthly Inspection', 'PREVENTIVE', 'MONTHLY', 1, 2.5, 'BASIC', 'FIELD',
 'Visual inspection of equipment condition and performance parameters',
 'PPE required', 'Inspection tools, measuring devices', 'None', 'MEDIUM', true),

('ES002', 'EQ005', 'Quarterly Cleaning', 'PREVENTIVE', 'QUARTERLY', 1, 8.0, 'INTERMEDIATE', 'FIELD',
 'Deep cleaning of internal components to prevent fouling',
 'Confined space permit, respiratory protection', 'Cleaning chemicals, brushes', 'Cleaning supplies', 'HIGH', true),

('ES003', 'EQ005', 'Annual Overhaul', 'PREVENTIVE', 'ANNUAL', 1, 24.0, 'EXPERT', 'WORKSHOP',
 'Complete disassembly, inspection, and refurbishment',
 'Lockout/tagout, crane operations', 'Specialized tools, lifting equipment', 'Replacement parts as needed', 'CRITICAL', true),

('ES004', 'HX-100', 'Online Cleaning', 'CONDITION_BASED', 'WEEKLY', 1, 1.0, 'BASIC', 'FIELD',
 'Online cleaning system activation based on pressure drop',
 'Standard PPE', 'Control panel access', 'Cleaning chemicals', 'MEDIUM', true),

('ES005', 'HX-100', 'Tube Inspection', 'PREDICTIVE', 'MONTHLY', 6, 4.0, 'INTERMEDIATE', 'FIELD',
 'Non-destructive testing of heat exchanger tubes',
 'Radiation safety (if applicable)', 'NDT equipment', 'None', 'HIGH', true)
ON CONFLICT (strategy_id) DO UPDATE SET
  strategy_name = EXCLUDED.strategy_name,
  strategy_type = EXCLUDED.strategy_type,
  frequency_type = EXCLUDED.frequency_type,
  frequency_value = EXCLUDED.frequency_value,
  estimated_duration_hours = EXCLUDED.estimated_duration_hours,
  task_description = EXCLUDED.task_description,
  priority = EXCLUDED.priority,
  is_active = EXCLUDED.is_active;

-- 6. Task Generation Log for Implementation Status
INSERT INTO task_generation_log (
  strategy_id, generated_date, next_generation_date, status, assigned_staff_id, generation_notes
) VALUES
('ES001', '2024-01-15', '2024-02-15', 'GENERATED', 'ST001', 'Monthly inspection scheduled'),
('ES001', '2024-02-15', '2024-03-15', 'GENERATED', 'ST001', 'Monthly inspection completed'),
('ES001', '2024-03-15', '2024-04-15', 'PENDING', NULL, 'Next inspection due'),

('ES002', '2024-01-01', '2024-04-01', 'GENERATED', 'ST002', 'Quarterly cleaning completed'),
('ES002', '2024-04-01', '2024-07-01', 'PENDING', NULL, 'Next cleaning due'),

('ES003', '2024-01-01', '2025-01-01', 'PENDING', NULL, 'Annual overhaul scheduled'),

('ES004', '2024-01-08', '2024-01-15', 'GENERATED', 'ST003', 'Online cleaning activated'),
('ES004', '2024-01-15', '2024-01-22', 'GENERATED', 'ST003', 'Online cleaning completed'),
('ES004', '2024-01-22', '2024-01-29', 'PENDING', NULL, 'Next cleaning cycle'),

('ES005', '2024-01-01', '2024-07-01', 'PENDING', NULL, 'Tube inspection scheduled')
ON CONFLICT (log_id) DO NOTHING;

-- 7. Additional Equipment Risk Assessment Data (Legacy)
INSERT INTO equipment_risk_assessment (
  "機器ID", "評価年", "リスクシナリオ", "評価タイミング", "緩和策", 
  "信頼性ランク（5段階）", "影響度ランク（5段階）", "リスクスコア（再計算）", 
  "リスクレベル（5段階）", "リスク許容性"
) VALUES
('EQ005', '2024-01-01', 'Fouling blockage risk', 'Scheduled', 'Regular cleaning and inspection', 
 '3', '4', 12, '3', 'Acceptable with mitigation'),
('HX-100', '2024-01-01', 'Fouling and corrosion', 'Triggered', 'Online cleaning system and monitoring', 
 '2', '4', 8, '2', 'Acceptable'),
('HX-101', '2024-01-01', 'Fouling potential', 'Scheduled', 'Preventive maintenance', 
 '3', '3', 9, '3', 'Acceptable with mitigation'),
('EQ001', '2024-01-01', 'Mechanical wear', 'Scheduled', 'Lubrication and bearing monitoring', 
 '2', '3', 6, '2', 'Acceptable'),
('EQ002', '2024-01-01', 'No significant risks identified', 'Scheduled', 'Standard maintenance', 
 '1', '2', 2, '1', 'Acceptable')
ON CONFLICT (id) DO NOTHING;

-- 8. Sample Staff for Assignment
INSERT INTO staff_master ("担当者ID", "氏名", "部署", "役職", "専門分野", "連絡先") VALUES
('ST001', '田中太郎', '保全部', '技術者', '機械', 'tanaka@company.com'),
('ST002', '佐藤花子', '保全部', '上級技術者', '化学', 'sato@company.com'),
('ST003', '鈴木次郎', '運転部', '技術者', '制御', 'suzuki@company.com')
ON CONFLICT ("担当者ID") DO UPDATE SET
  "氏名" = EXCLUDED."氏名",
  "部署" = EXCLUDED."部署",
  "役職" = EXCLUDED."役職",
  "専門分野" = EXCLUDED."専門分野",
  "連絡先" = EXCLUDED."連絡先";

-- 9. Staff Skills
INSERT INTO staff_skills (staff_id, skill_type, skill_level, area, is_available) VALUES
('ST001', 'MECHANICAL', 'INTERMEDIATE', 'FIELD', true),
('ST001', 'INSPECTION', 'BASIC', 'FIELD', true),
('ST002', 'CHEMICAL', 'EXPERT', 'FIELD', true),
('ST002', 'CLEANING', 'EXPERT', 'FIELD', true),
('ST003', 'INSTRUMENTATION', 'INTERMEDIATE', 'FIELD', true),
('ST003', 'CONTROL_SYSTEMS', 'BASIC', 'FIELD', true)
ON CONFLICT (skill_id) DO NOTHING;

-- 10. Recent Work Orders for Context
INSERT INTO work_order (
  "作業指示ID", "設備ID", "作業種別ID", "作業内容", "優先度", 
  "計画開始日時", "計画終了日時", "実際開始日時", "実際終了日時", 
  "作業者ID", "状態", "備考"
) VALUES
('WO001', 'EQ005', 1, 'Monthly inspection as per ES001', 'MEDIUM',
 '2024-01-15 09:00:00', '2024-01-15 11:30:00', '2024-01-15 09:15:00', '2024-01-15 11:20:00',
 'ST001', '完了', 'No issues found'),
('WO002', 'EQ005', 2, 'Quarterly cleaning as per ES002', 'HIGH',
 '2024-04-01 08:00:00', '2024-04-01 16:00:00', '2024-04-01 08:30:00', '2024-04-01 15:45:00',
 'ST002', '完了', 'Significant fouling removed'),
('WO003', 'HX-100', 3, 'Online cleaning activation', 'MEDIUM',
 '2024-01-22 10:00:00', '2024-01-22 11:00:00', '2024-01-22 10:05:00', '2024-01-22 10:55:00',
 'ST003', '完了', 'Pressure drop normalized'),
('WO004', 'EQ005', 1, 'Upcoming monthly inspection', 'MEDIUM',
 '2024-04-15 09:00:00', '2024-04-15 11:30:00', NULL, NULL,
 'ST001', '計画中', 'Scheduled inspection')
ON CONFLICT ("作業指示ID") DO UPDATE SET
  "作業内容" = EXCLUDED."作業内容",
  "優先度" = EXCLUDED."優先度",
  "計画開始日時" = EXCLUDED."計画開始日時",
  "計画終了日時" = EXCLUDED."計画終了日時",
  "状態" = EXCLUDED."状態",
  "備考" = EXCLUDED."備考";

-- 11. Recent Maintenance History
INSERT INTO maintenance_history (
  "履歴ID", "設備ID", "作業指示ID", "実施日", "作業者ID", "業者ID",
  "作業内容", "作業結果", "使用部品", "作業時間", "コスト", "次回推奨日"
) VALUES
('MH001', 'EQ005', 'WO001', '2024-01-15', 'ST001', NULL,
 'Monthly inspection', 'All parameters within normal range', 'None', 2.25, 4500, '2024-02-15'),
('MH002', 'EQ005', 'WO002', '2024-04-01', 'ST002', NULL,
 'Quarterly cleaning', 'Heavy fouling deposits removed successfully', 'Cleaning chemicals', 7.75, 15500, '2024-07-01'),
('MH003', 'HX-100', 'WO003', '2024-01-22', 'ST003', NULL,
 'Online cleaning', 'Pressure drop reduced from 2.5 to 1.2 bar', 'Cleaning solution', 0.83, 1200, '2024-01-29')
ON CONFLICT ("履歴ID") DO UPDATE SET
  "作業内容" = EXCLUDED."作業内容",
  "作業結果" = EXCLUDED."作業結果",
  "使用部品" = EXCLUDED."使用部品",
  "作業時間" = EXCLUDED."作業時間",
  "コスト" = EXCLUDED."コスト",
  "次回推奨日" = EXCLUDED."次回推奨日";

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_failure_modes_equipment_risk ON failure_modes(equipment_id, failure_mode);
CREATE INDEX IF NOT EXISTS idx_equipment_system_mapping_system ON equipment_system_mapping(system_id);
CREATE INDEX IF NOT EXISTS idx_equipment_strategy_equipment ON equipment_strategy(equipment_id);
CREATE INDEX IF NOT EXISTS idx_task_generation_log_strategy_date ON task_generation_log(strategy_id, next_generation_date);