-- ============================================
-- Complete Database Relationships and Data
-- Created: 2025-07-11
-- Purpose: Fill gaps identified by AI system testing
-- ============================================

-- 1. Add Equipment Strategies for all equipment
INSERT INTO equipment_strategy (strategy_id, equipment_id, strategy_type, frequency_type, frequency_value, strategy_description, responsible_department, status, next_execution_date) VALUES
-- System SYS-001 Equipment
('ES-EQ005-001', 'EQ005', 'PREVENTIVE', 'MONTHLY', 1, '送風機定期点検・清掃', 'MAINTENANCE', 'ACTIVE', '2025-08-01'),
('ES-EQ005-002', 'EQ005', 'CONDITION_BASED', 'CONTINUOUS', 0, '振動モニタリング', 'REFINERY', 'ACTIVE', NULL),
('ES-EQ006-001', 'EQ006', 'PREVENTIVE', 'WEEKLY', 1, 'ポンプ週次点検', 'REFINERY', 'ACTIVE', '2025-07-18'),
('ES-EQ006-002', 'EQ006', 'PREVENTIVE', 'QUARTERLY', 3, 'ポンプオーバーホール', 'MAINTENANCE', 'ACTIVE', '2025-10-01'),
('ES-EQ019-001', 'EQ019', 'PREVENTIVE', 'MONTHLY', 1, 'エアコンフィルター清掃', 'MAINTENANCE', 'ACTIVE', '2025-08-01'),
('ES-EQ020-001', 'EQ020', 'PREVENTIVE', 'QUARTERLY', 3, '換気扇清掃・点検', 'MAINTENANCE', 'ACTIVE', '2025-10-01'),

-- System SYS-002 Equipment
('ES-EQ013-001', 'EQ013', 'CALIBRATION', 'SEMI_ANNUALLY', 6, '流量計校正', 'INSTRUMENTATION', 'ACTIVE', '2026-01-01'),
('ES-EQ014-001', 'EQ014', 'CALIBRATION', 'ANNUALLY', 12, '圧力計校正', 'INSTRUMENTATION', 'ACTIVE', '2026-01-01'),
('ES-EQ016-001', 'EQ016', 'PREVENTIVE', 'MONTHLY', 1, '制御盤清掃・点検', 'ELECTRICAL', 'ACTIVE', '2025-08-01'),

-- Other critical equipment
('ES-EQ001-001', 'EQ001', 'PREVENTIVE', 'DAILY', 0, 'CNC旋盤日常点検', 'PRODUCTION', 'ACTIVE', '2025-07-12'),
('ES-EQ002-001', 'EQ002', 'PREVENTIVE', 'WEEKLY', 1, 'マシニングセンタ週次点検', 'PRODUCTION', 'ACTIVE', '2025-07-18'),
('ES-EQ009-001', 'EQ009', 'PREVENTIVE', 'ANNUALLY', 12, '変圧器年次点検', 'ELECTRICAL', 'ACTIVE', '2026-04-01'),
('ES-EQ010-001', 'EQ010', 'PREVENTIVE', 'MONTHLY', 1, '配電盤月次点検', 'ELECTRICAL', 'ACTIVE', '2025-08-01')
ON CONFLICT (strategy_id) DO UPDATE SET
  strategy_description = EXCLUDED.strategy_description,
  frequency_type = EXCLUDED.frequency_type,
  frequency_value = EXCLUDED.frequency_value,
  status = EXCLUDED.status;

-- 2. Add Process Parameters and Monitoring Instruments
INSERT INTO process_parameters (
  parameter_id, parameter_name, parameter_type, unit, equipment_id, tag_name, 
  normal_min, normal_max, critical_min, critical_max, is_active
) VALUES
-- Temperature Instruments
('PARAM-TI-201', 'HX-201 出口温度', 'TEMPERATURE', '°C', 'HX-201', 'TI-201', 60.0, 80.0, 50.0, 90.0, true),
('PARAM-TI-101', 'HX-101 出口温度', 'TEMPERATURE', '°C', 'HX-101', 'TI-101', 60.0, 80.0, 50.0, 90.0, true),
('PARAM-TI-301', 'TK-101 温度', 'TEMPERATURE', '°C', 'TK-101', 'TI-301', 25.0, 45.0, 20.0, 50.0, true),

-- Pressure Instruments
('PARAM-PI-101', 'PU-100 吐出圧力', 'PRESSURE', 'MPa', 'PU-100', 'PI-101', 0.3, 0.5, 0.2, 0.6, true),
('PARAM-PI-201', 'PU-200 吐出圧力', 'PRESSURE', 'MPa', 'PU-200', 'PI-201', 0.3, 0.5, 0.2, 0.6, true),

-- Flow Instruments
('PARAM-FI-301', 'HX-103 冷却水流量', 'FLOW', 'm3/h', 'HX-103', 'FI-301', 80.0, 120.0, 60.0, 140.0, true),
('PARAM-FI-101', 'システム供給流量', 'FLOW', 'm3/h', 'PU-100', 'FI-101', 100.0, 150.0, 80.0, 170.0, true),

-- Level Instruments
('PARAM-LI-101', 'TK-101 液位', 'LEVEL', 'm', 'TK-101', 'LI-101', 2.0, 4.0, 1.5, 4.5, true)
ON CONFLICT (parameter_id) DO UPDATE SET
  parameter_name = EXCLUDED.parameter_name,
  normal_min = EXCLUDED.normal_min,
  normal_max = EXCLUDED.normal_max;

-- 3. Add Process Trigger Rules for Equipment Strategy Changes
INSERT INTO process_trigger_rules (
  rule_id, rule_name, parameter_id, trigger_type, condition_type, 
  threshold_value, evaluation_window_minutes, min_duration_minutes, severity
) VALUES
('RULE-TI-201-HIGH', 'HX-201 高温アラーム', 'PARAM-TI-201', 'LIMIT_EXCEEDED', 'GREATER_THAN', 85.0, 60, 10, 'HIGH'),
('RULE-TI-201-TREND', 'HX-201 温度上昇傾向', 'PARAM-TI-201', 'TREND', 'CHANGE_PERCENT', 10.0, 120, 30, 'MEDIUM'),
('RULE-PI-101-LOW', 'PU-100 低圧力アラーム', 'PARAM-PI-101', 'LIMIT_EXCEEDED', 'LESS_THAN', 0.25, 30, 5, 'HIGH'),
('RULE-FI-301-LOW', 'HX-103 低流量アラーム', 'PARAM-FI-301', 'LIMIT_EXCEEDED', 'LESS_THAN', 70.0, 30, 10, 'CRITICAL')
ON CONFLICT (rule_id) DO UPDATE SET
  trigger_type = EXCLUDED.trigger_type,
  threshold_value = EXCLUDED.threshold_value;

-- 4. Add ES-Process Mapping for automatic strategy updates
INSERT INTO es_process_mapping (strategy_id, rule_id, impact_type, impact_description, recommended_action, auto_apply) VALUES
('ES-EQ006-001', 'RULE-PI-101-LOW', 'FREQUENCY_CHANGE', 'Low pressure indicates potential pump issues', 'INCREASE_FREQUENCY', false),
('ES-EQ005-002', 'RULE-TI-201-HIGH', 'NEW_REQUIREMENT', 'High temperature may affect blower performance', 'ADD_INSPECTION', false)
ON CONFLICT DO NOTHING;

-- 5. Add Missing Fouling Failure Modes
INSERT INTO failure_modes (
  system_id, equipment_id, failure_mode, failure_mechanism, 
  failure_effect_local, failure_effect_system, detection_method,
  severity_score, occurrence_score, detection_score,
  safety_impact, environmental_impact, production_impact
) VALUES
-- SYS-001 Equipment Fouling Risks
('SYS-001', 'EQ005', '送風機羽根への汚れ付着', 'Fouling accumulation on blower blades', 
 '風量低下、振動増加', 'Cooling capacity reduction', 'Vibration monitoring, Visual inspection',
 6, 7, 4, false, false, true),
 
('SYS-001', 'EQ006', 'ポンプインペラーへの汚れ付着', 'Fouling on pump impeller',
 '流量低下、効率低下', 'System flow reduction', 'Flow monitoring, Pressure differential',
 7, 6, 3, false, false, true),

('SYS-001', 'EQ019', 'エアコンフィルター目詰まり', 'Air filter fouling blockage',
 '冷却能力低下', 'Room temperature control issues', 'Temperature monitoring, Visual inspection',
 5, 8, 2, false, false, false),

('SYS-001', 'EQ020', '換気扇への埃付着', 'Dust fouling on ventilation fan',
 '換気能力低下', 'Reduced air circulation', 'Visual inspection',
 4, 8, 2, false, false, false),

-- SYS-002 Equipment Fouling Risks  
('SYS-002', 'EQ013', '流量計オリフィスへの汚れ付着', 'Fouling on flow meter orifice',
 '測定精度低下', 'Incorrect flow readings', 'Calibration checks',
 6, 5, 4, false, false, true),

('SYS-002', 'EQ014', '圧力計導圧管の詰まり', 'Pressure tap fouling blockage',
 '圧力指示不良', 'Incorrect pressure readings', 'Calibration checks',
 6, 5, 3, false, false, true)
ON CONFLICT DO NOTHING;

-- 6. Add Task Generation Logs for Equipment Strategies
INSERT INTO task_generation_log (strategy_id, generated_date, scheduled_date, task_type, task_status, priority) VALUES
-- Recent completed tasks
('ES-EQ005-001', '2025-06-01', '2025-06-01', 'INSPECTION', 'COMPLETED', 'MEDIUM'),
('ES-EQ006-001', '2025-07-04', '2025-07-11', 'INSPECTION', 'COMPLETED', 'HIGH'),
('ES-EQ019-001', '2025-06-01', '2025-06-01', 'CLEANING', 'COMPLETED', 'LOW'),

-- Upcoming scheduled tasks
('ES-EQ005-001', '2025-07-01', '2025-08-01', 'INSPECTION', 'SCHEDULED', 'MEDIUM'),
('ES-EQ006-001', '2025-07-11', '2025-07-18', 'INSPECTION', 'SCHEDULED', 'HIGH'),
('ES-EQ006-002', '2025-07-01', '2025-10-01', 'OVERHAUL', 'SCHEDULED', 'HIGH'),
('ES-EQ013-001', '2025-07-01', '2026-01-01', 'CALIBRATION', 'SCHEDULED', 'MEDIUM'),
('ES-EQ014-001', '2025-07-01', '2026-01-01', 'CALIBRATION', 'SCHEDULED', 'MEDIUM')
ON CONFLICT DO NOTHING;

-- 7. Add Sample Process Data for Testing
INSERT INTO process_data (parameter_id, timestamp, value, quality, source) VALUES
-- Recent temperature readings for TI-201
('PARAM-TI-201', NOW() - INTERVAL '1 hour', 72.5, 'GOOD', 'DCS'),
('PARAM-TI-201', NOW() - INTERVAL '30 minutes', 74.0, 'GOOD', 'DCS'),
('PARAM-TI-201', NOW(), 75.5, 'GOOD', 'DCS'),

-- Recent pressure readings for PI-101
('PARAM-PI-101', NOW() - INTERVAL '1 hour', 0.42, 'GOOD', 'DCS'),
('PARAM-PI-101', NOW() - INTERVAL '30 minutes', 0.41, 'GOOD', 'DCS'),
('PARAM-PI-101', NOW(), 0.40, 'GOOD', 'DCS')
ON CONFLICT DO NOTHING;

-- 8. Update Equipment Risk Assessment with proper fouling risks
INSERT INTO equipment_risk_assessment (
  機器ID, リスクレベル, 影響度ランク, 信頼性ランク, リスクスコア,
  リスク要因, 対策内容, 評価日, 評価者ID
) VALUES
('EQ005', 'MEDIUM', 'B', 'B', 60, 'Fouling risk on blower blades', 'Monthly cleaning required', NOW(), 'ST001'),
('EQ006', 'HIGH', 'A', 'C', 80, 'Pump impeller fouling risk', 'Weekly inspection, quarterly overhaul', NOW(), 'ST001'),
('EQ013', 'MEDIUM', 'B', 'B', 65, 'Flow meter orifice fouling', 'Semi-annual calibration', NOW(), 'ST002'),
('EQ014', 'MEDIUM', 'B', 'B', 70, 'Pressure tap blockage risk', 'Annual calibration and cleaning', NOW(), 'ST002')
ON CONFLICT (機器ID) DO UPDATE SET
  リスクレベル = EXCLUDED.リスクレベル,
  リスク要因 = EXCLUDED.リスク要因,
  対策内容 = EXCLUDED.対策内容;

-- Log migration
INSERT INTO migration_log (migration_name, applied_at, description) 
VALUES (
  '20250711_complete_data_relationships',
  NOW(),
  'Added equipment strategies, process parameters, fouling failure modes, and proper data relationships to support AI queries'
) ON CONFLICT DO NOTHING;