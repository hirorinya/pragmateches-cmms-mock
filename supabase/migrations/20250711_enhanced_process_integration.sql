-- ============================================
-- Enhanced Process Integration and Real-time Data
-- Created: 2025-07-11
-- Purpose: Comprehensive process parameter mapping and real-time integration
-- ============================================

-- 1. Add comprehensive process parameters for all new equipment
INSERT INTO process_parameters (
  parameter_id, parameter_name, parameter_type, unit, equipment_id, tag_name,
  normal_min, normal_max, critical_min, critical_max, is_active, description
) VALUES

-- Heat Exchanger Parameters
('PARAM-HX-100-TI', 'HX-100 出口温度', 'TEMPERATURE', '°C', 'HX-100', 'TI-100-01', 65.0, 85.0, 55.0, 95.0, true, '主熱交換器出口温度'),
('PARAM-HX-100-PI', 'HX-100 圧力差', 'PRESSURE', 'kPa', 'HX-100', 'PDI-100-01', 10.0, 50.0, 5.0, 80.0, true, '主熱交換器圧力差'),
('PARAM-HX-100-FI', 'HX-100 流量', 'FLOW', 'm3/h', 'HX-100', 'FI-100-01', 80.0, 120.0, 60.0, 150.0, true, '主熱交換器流量'),

('PARAM-HX-101-TI', 'HX-101 出口温度', 'TEMPERATURE', '°C', 'HX-101', 'TI-101-01', 65.0, 85.0, 55.0, 95.0, true, '予備熱交換器出口温度'),
('PARAM-HX-101-PI', 'HX-101 圧力差', 'PRESSURE', 'kPa', 'HX-101', 'PDI-101-01', 10.0, 50.0, 5.0, 80.0, true, '予備熱交換器圧力差'),

('PARAM-HX-102-TI', 'HX-102 出口温度', 'TEMPERATURE', '°C', 'HX-102', 'TI-102-01', 60.0, 80.0, 50.0, 90.0, true, '補助熱交換器出口温度'),
('PARAM-HX-103-TI', 'HX-103 冷却水温度', 'TEMPERATURE', '°C', 'HX-103', 'TI-103-01', 25.0, 35.0, 20.0, 45.0, true, '冷却水熱交換器温度'),
('PARAM-HX-103-FI', 'HX-103 冷却水流量', 'FLOW', 'm3/h', 'HX-103', 'FI-103-01', 90.0, 130.0, 70.0, 160.0, true, '冷却水流量'),

-- Heat Exchanger Series 200
('PARAM-HX-200-TI', 'HX-200 加熱温度', 'TEMPERATURE', '°C', 'HX-200', 'TI-200-01', 120.0, 160.0, 100.0, 180.0, true, '原料加熱器温度'),
('PARAM-HX-201-TI', 'HX-201 加熱温度', 'TEMPERATURE', '°C', 'HX-201', 'TI-201-01', 120.0, 160.0, 100.0, 180.0, true, '原料加熱器予備機温度'),

-- Tank Level Parameters
('PARAM-TK-100-LI', 'TK-100 液位', 'LEVEL', 'm', 'TK-100', 'LI-100-01', 2.0, 4.5, 1.0, 5.0, true, '冷却水タンクレベル'),
('PARAM-TK-101-LI', 'TK-101 液位', 'LEVEL', 'm', 'TK-101', 'LI-101-01', 2.0, 4.5, 1.0, 5.0, true, '冷却水予備タンクレベル'),
('PARAM-TK-102-LI', 'TK-102 液位', 'LEVEL', 'm', 'TK-102', 'LI-102-01', 1.5, 3.5, 1.0, 4.0, true, 'プロセス水タンクレベル'),

('PARAM-TK-200-LI', 'TK-200 液位', 'LEVEL', 'm', 'TK-200', 'LI-200-01', 3.0, 7.5, 2.0, 8.0, true, '原料タンクレベル'),
('PARAM-TK-201-LI', 'TK-201 液位', 'LEVEL', 'm', 'TK-201', 'LI-201-01', 3.0, 7.5, 2.0, 8.0, true, '原料予備タンクレベル'),
('PARAM-TK-202-LI', 'TK-202 液位', 'LEVEL', 'm', 'TK-202', 'LI-202-01', 0.5, 1.2, 0.3, 1.5, true, '添加剤タンクレベル'),

('PARAM-TK-300-LI', 'TK-300 液位', 'LEVEL', 'm', 'TK-300', 'LI-300-01', 1.0, 3.5, 0.5, 4.0, true, '排水貯留タンクレベル'),
('PARAM-TK-301-LI', 'TK-301 液位', 'LEVEL', 'm', 'TK-301', 'LI-301-01', 1.0, 2.5, 0.5, 3.0, true, '処理水タンクレベル'),

-- Pump Parameters
('PARAM-PU-100-PI', 'PU-100 吐出圧力', 'PRESSURE', 'MPa', 'PU-100', 'PI-100-01', 0.3, 0.6, 0.2, 0.8, true, '冷却水循環ポンプ圧力'),
('PARAM-PU-100-VI', 'PU-100 振動', 'VIBRATION', 'mm/s', 'PU-100', 'VI-100-01', 0.5, 2.5, 0.0, 4.0, true, '冷却水循環ポンプ振動'),
('PARAM-PU-100-FI', 'PU-100 流量', 'FLOW', 'm3/h', 'PU-100', 'FI-100-01', 100.0, 150.0, 80.0, 180.0, true, '冷却水循環ポンプ流量'),

('PARAM-PU-101-PI', 'PU-101 吐出圧力', 'PRESSURE', 'MPa', 'PU-101', 'PI-101-01', 0.3, 0.6, 0.2, 0.8, true, '冷却水予備ポンプ圧力'),
('PARAM-PU-101-VI', 'PU-101 振動', 'VIBRATION', 'mm/s', 'PU-101', 'VI-101-01', 0.5, 2.5, 0.0, 4.0, true, '冷却水予備ポンプ振動'),

('PARAM-PU-200-PI', 'PU-200 吐出圧力', 'PRESSURE', 'MPa', 'PU-200', 'PI-200-01', 0.4, 0.8, 0.3, 1.0, true, '原料供給ポンプ圧力'),
('PARAM-PU-200-FI', 'PU-200 流量', 'FLOW', 'm3/h', 'PU-200', 'FI-200-01', 50.0, 80.0, 40.0, 100.0, true, '原料供給ポンプ流量'),
('PARAM-PU-200-VI', 'PU-200 振動', 'VIBRATION', 'mm/s', 'PU-200', 'VI-200-01', 0.5, 3.0, 0.0, 5.0, true, '原料供給ポンプ振動'),

('PARAM-PU-201-PI', 'PU-201 吐出圧力', 'PRESSURE', 'MPa', 'PU-201', 'PI-201-01', 0.4, 0.8, 0.3, 1.0, true, '原料予備ポンプ圧力'),
('PARAM-PU-202-PI', 'PU-202 注入圧力', 'PRESSURE', 'MPa', 'PU-202', 'PI-202-01', 0.2, 0.4, 0.1, 0.6, true, '添加剤注入ポンプ圧力'),

('PARAM-PU-300-PI', 'PU-300 吐出圧力', 'PRESSURE', 'MPa', 'PU-300', 'PI-300-01', 0.2, 0.5, 0.1, 0.7, true, '排水移送ポンプ圧力'),
('PARAM-PU-301-PI', 'PU-301 吐出圧力', 'PRESSURE', 'MPa', 'PU-301', 'PI-301-01', 0.2, 0.5, 0.1, 0.7, true, '排水予備ポンプ圧力')

ON CONFLICT (parameter_id) DO UPDATE SET
  parameter_name = EXCLUDED.parameter_name,
  normal_min = EXCLUDED.normal_min,
  normal_max = EXCLUDED.normal_max,
  critical_min = EXCLUDED.critical_min,
  critical_max = EXCLUDED.critical_max,
  description = EXCLUDED.description;

-- 2. Add comprehensive process trigger rules for equipment strategy automation
INSERT INTO process_trigger_rules (
  rule_id, rule_name, parameter_id, trigger_type, condition_type,
  threshold_value, evaluation_window_minutes, min_duration_minutes, severity, description
) VALUES

-- Heat Exchanger Temperature Alarms
('RULE-HX-100-TEMP-HIGH', 'HX-100 高温アラーム', 'PARAM-HX-100-TI', 'LIMIT_EXCEEDED', 'GREATER_THAN', 90.0, 60, 10, 'HIGH', 'Heat exchanger outlet temperature high'),
('RULE-HX-100-TEMP-TREND', 'HX-100 温度上昇傾向', 'PARAM-HX-100-TI', 'TREND', 'CHANGE_PERCENT', 15.0, 120, 30, 'MEDIUM', 'Heat exchanger temperature trending up'),
('RULE-HX-101-TEMP-HIGH', 'HX-101 高温アラーム', 'PARAM-HX-101-TI', 'LIMIT_EXCEEDED', 'GREATER_THAN', 90.0, 60, 10, 'HIGH', 'Backup heat exchanger temperature high'),

-- Heat Exchanger Pressure Drop Alarms
('RULE-HX-100-DP-HIGH', 'HX-100 圧損上昇', 'PARAM-HX-100-PI', 'LIMIT_EXCEEDED', 'GREATER_THAN', 70.0, 30, 15, 'CRITICAL', 'Heat exchanger fouling indication'),
('RULE-HX-101-DP-HIGH', 'HX-101 圧損上昇', 'PARAM-HX-101-PI', 'LIMIT_EXCEEDED', 'GREATER_THAN', 70.0, 30, 15, 'CRITICAL', 'Backup heat exchanger fouling'),

-- Pump Performance Alarms
('RULE-PU-100-PRESS-LOW', 'PU-100 低圧力アラーム', 'PARAM-PU-100-PI', 'LIMIT_EXCEEDED', 'LESS_THAN', 0.25, 30, 5, 'HIGH', 'Main cooling pump low pressure'),
('RULE-PU-100-VIB-HIGH', 'PU-100 高振動アラーム', 'PARAM-PU-100-VI', 'LIMIT_EXCEEDED', 'GREATER_THAN', 3.5, 15, 5, 'CRITICAL', 'Main pump vibration high'),
('RULE-PU-200-PRESS-LOW', 'PU-200 低圧力アラーム', 'PARAM-PU-200-PI', 'LIMIT_EXCEEDED', 'LESS_THAN', 0.35, 30, 5, 'HIGH', 'Feed pump low pressure'),

-- Tank Level Alarms
('RULE-TK-100-LEVEL-LOW', 'TK-100 低液位アラーム', 'PARAM-TK-100-LI', 'LIMIT_EXCEEDED', 'LESS_THAN', 1.5, 10, 5, 'HIGH', 'Cooling water tank low level'),
('RULE-TK-200-LEVEL-LOW', 'TK-200 低液位アラーム', 'PARAM-TK-200-LI', 'LIMIT_EXCEEDED', 'LESS_THAN', 2.5, 10, 5, 'CRITICAL', 'Feed tank low level'),
('RULE-TK-300-LEVEL-HIGH', 'TK-300 高液位アラーム', 'PARAM-TK-300-LI', 'LIMIT_EXCEEDED', 'GREATER_THAN', 3.8, 10, 5, 'HIGH', 'Waste tank high level'),

-- Flow Rate Alarms
('RULE-HX-103-FLOW-LOW', 'HX-103 低流量アラーム', 'PARAM-HX-103-FI', 'LIMIT_EXCEEDED', 'LESS_THAN', 75.0, 30, 10, 'CRITICAL', 'Cooling water low flow'),
('RULE-PU-200-FLOW-LOW', 'PU-200 低流量アラーム', 'PARAM-PU-200-FI', 'LIMIT_EXCEEDED', 'LESS_THAN', 45.0, 30, 10, 'HIGH', 'Feed pump low flow')

ON CONFLICT (rule_id) DO UPDATE SET
  trigger_type = EXCLUDED.trigger_type,
  threshold_value = EXCLUDED.threshold_value,
  severity = EXCLUDED.severity,
  description = EXCLUDED.description;

-- 3. Add ES-Process Mapping for automatic strategy updates
INSERT INTO es_process_mapping (strategy_id, rule_id, impact_type, impact_description, recommended_action, auto_apply) VALUES

-- Heat Exchanger Fouling Detection -> Cleaning Strategy Changes
('ES-HX-100-001', 'RULE-HX-100-DP-HIGH', 'FREQUENCY_CHANGE', 'High pressure drop indicates fouling - increase cleaning frequency', 'INCREASE_FREQUENCY', false),
('ES-HX-100-002', 'RULE-HX-100-DP-HIGH', 'IMMEDIATE_ACTION', 'Execute immediate cleaning cycle', 'EXECUTE_IMMEDIATE', true),
('ES-HX-101-001', 'RULE-HX-101-DP-HIGH', 'FREQUENCY_CHANGE', 'Backup heat exchanger fouling detected', 'INCREASE_FREQUENCY', false),

-- Temperature Trending -> Preventive Action
('ES-HX-100-001', 'RULE-HX-100-TEMP-TREND', 'NEW_REQUIREMENT', 'Temperature trending requires additional monitoring', 'ADD_INSPECTION', false),
('ES-HX-100-002', 'RULE-HX-100-TEMP-HIGH', 'IMMEDIATE_ACTION', 'High temperature requires immediate cleaning', 'EXECUTE_IMMEDIATE', true),

-- Pump Issues -> Maintenance Strategy Changes  
('ES-PU-100-001', 'RULE-PU-100-PRESS-LOW', 'FREQUENCY_CHANGE', 'Low pressure indicates pump degradation', 'INCREASE_FREQUENCY', false),
('ES-PU-100-001', 'RULE-PU-100-VIB-HIGH', 'IMMEDIATE_ACTION', 'High vibration requires immediate inspection', 'EXECUTE_IMMEDIATE', true),
('ES-PU-200-001', 'RULE-PU-200-PRESS-LOW', 'FREQUENCY_CHANGE', 'Feed pump performance degrading', 'INCREASE_FREQUENCY', false),

-- Tank Level Issues -> Operational Strategy
('ES-TK-100-001', 'RULE-TK-100-LEVEL-LOW', 'IMMEDIATE_ACTION', 'Low cooling water requires immediate attention', 'EXECUTE_IMMEDIATE', true),
('ES-TK-200-001', 'RULE-TK-200-LEVEL-LOW', 'IMMEDIATE_ACTION', 'Critical feed tank level', 'EXECUTE_IMMEDIATE', true),

-- Flow Issues -> System Strategy
('ES-HX-103-001', 'RULE-HX-103-FLOW-LOW', 'IMMEDIATE_ACTION', 'Cooling water flow critical', 'EXECUTE_IMMEDIATE', true),
('ES-PU-200-001', 'RULE-PU-200-FLOW-LOW', 'IMMEDIATE_ACTION', 'Feed flow below minimum', 'EXECUTE_IMMEDIATE', true)

ON CONFLICT DO NOTHING;

-- 4. Add sample real-time process data for testing
INSERT INTO process_data (parameter_id, timestamp, value, quality, source) VALUES

-- Recent data for HX-100 (main heat exchanger)
('PARAM-HX-100-TI', NOW() - INTERVAL '2 hours', 78.5, 'GOOD', 'DCS'),
('PARAM-HX-100-TI', NOW() - INTERVAL '1 hour', 79.2, 'GOOD', 'DCS'),
('PARAM-HX-100-TI', NOW() - INTERVAL '30 minutes', 80.1, 'GOOD', 'DCS'),
('PARAM-HX-100-TI', NOW(), 81.5, 'GOOD', 'DCS'),

('PARAM-HX-100-PI', NOW() - INTERVAL '2 hours', 35.2, 'GOOD', 'DCS'),
('PARAM-HX-100-PI', NOW() - INTERVAL '1 hour', 38.7, 'GOOD', 'DCS'),
('PARAM-HX-100-PI', NOW() - INTERVAL '30 minutes', 42.1, 'GOOD', 'DCS'),
('PARAM-HX-100-PI', NOW(), 45.8, 'GOOD', 'DCS'),

-- Recent data for PU-100 (main cooling pump)
('PARAM-PU-100-PI', NOW() - INTERVAL '2 hours', 0.45, 'GOOD', 'DCS'),
('PARAM-PU-100-PI', NOW() - INTERVAL '1 hour', 0.43, 'GOOD', 'DCS'),
('PARAM-PU-100-PI', NOW() - INTERVAL '30 minutes', 0.41, 'GOOD', 'DCS'),
('PARAM-PU-100-PI', NOW(), 0.38, 'GOOD', 'DCS'),

('PARAM-PU-100-VI', NOW() - INTERVAL '2 hours', 1.8, 'GOOD', 'DCS'),
('PARAM-PU-100-VI', NOW() - INTERVAL '1 hour', 2.1, 'GOOD', 'DCS'),
('PARAM-PU-100-VI', NOW() - INTERVAL '30 minutes', 2.4, 'GOOD', 'DCS'),
('PARAM-PU-100-VI', NOW(), 2.8, 'GOOD', 'DCS'),

-- Tank levels
('PARAM-TK-100-LI', NOW() - INTERVAL '1 hour', 3.8, 'GOOD', 'DCS'),
('PARAM-TK-100-LI', NOW() - INTERVAL '30 minutes', 3.6, 'GOOD', 'DCS'),
('PARAM-TK-100-LI', NOW(), 3.4, 'GOOD', 'DCS'),

('PARAM-TK-200-LI', NOW() - INTERVAL '1 hour', 5.2, 'GOOD', 'DCS'),
('PARAM-TK-200-LI', NOW() - INTERVAL '30 minutes', 4.8, 'GOOD', 'DCS'),
('PARAM-TK-200-LI', NOW(), 4.5, 'GOOD', 'DCS')

ON CONFLICT DO NOTHING;

-- 5. Create equipment interdependency mapping
CREATE TABLE IF NOT EXISTS equipment_interdependencies (
  dependency_id SERIAL PRIMARY KEY,
  source_equipment_id VARCHAR(10) NOT NULL,
  dependent_equipment_id VARCHAR(10) NOT NULL,
  dependency_type VARCHAR(30) NOT NULL, -- 'UPSTREAM', 'DOWNSTREAM', 'PARALLEL', 'BACKUP'
  impact_level VARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_equipment_id) REFERENCES equipment(設備ID),
  FOREIGN KEY (dependent_equipment_id) REFERENCES equipment(設備ID),
  UNIQUE(source_equipment_id, dependent_equipment_id, dependency_type)
);

-- Insert equipment interdependencies for impact analysis
INSERT INTO equipment_interdependencies (source_equipment_id, dependent_equipment_id, dependency_type, impact_level, description) VALUES

-- Cooling System Dependencies (SYS-001)
('TK-100', 'PU-100', 'UPSTREAM', 'CRITICAL', 'Cooling water tank supplies main pump'),
('PU-100', 'HX-100', 'UPSTREAM', 'CRITICAL', 'Main pump supplies primary heat exchanger'),
('PU-100', 'HX-101', 'UPSTREAM', 'HIGH', 'Main pump can supply backup heat exchanger'),
('PU-100', 'HX-103', 'UPSTREAM', 'HIGH', 'Main pump supplies cooling water to HX-103'),
('HX-100', 'TK-102', 'DOWNSTREAM', 'MEDIUM', 'Heat exchanger output goes to process water tank'),

-- Backup Dependencies
('TK-101', 'PU-100', 'BACKUP', 'HIGH', 'Backup cooling water tank'),
('PU-101', 'HX-100', 'BACKUP', 'HIGH', 'Backup pump can supply main heat exchanger'),
('PU-101', 'HX-101', 'BACKUP', 'MEDIUM', 'Backup pump can supply backup heat exchanger'),
('HX-101', 'HX-100', 'BACKUP', 'CRITICAL', 'Backup heat exchanger for main unit'),

-- Raw Material System Dependencies (SYS-002)
('TK-200', 'PU-200', 'UPSTREAM', 'CRITICAL', 'Raw material tank supplies feed pump'),
('PU-200', 'HX-200', 'UPSTREAM', 'CRITICAL', 'Feed pump supplies raw material heater'),
('TK-202', 'PU-202', 'UPSTREAM', 'HIGH', 'Additive tank supplies injection pump'),
('PU-202', 'HX-200', 'PARALLEL', 'MEDIUM', 'Additive injection to heater'),

-- Parallel Operations
('HX-100', 'HX-102', 'PARALLEL', 'MEDIUM', 'Heat exchangers can operate in parallel'),
('PU-100', 'PU-102', 'PARALLEL', 'MEDIUM', 'Pumps can operate in parallel'),

-- Cross-System Dependencies
('HX-103', 'HX-100', 'DOWNSTREAM', 'HIGH', 'Cooling water from HX-103 affects HX-100 performance'),
('TK-300', 'TK-100', 'DOWNSTREAM', 'LOW', 'Waste water treatment affects cooling water quality')

ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_interdependencies_source ON equipment_interdependencies(source_equipment_id);
CREATE INDEX IF NOT EXISTS idx_interdependencies_dependent ON equipment_interdependencies(dependent_equipment_id);
CREATE INDEX IF NOT EXISTS idx_process_data_param_time ON process_data(parameter_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_process_trigger_rules_param ON process_trigger_rules(parameter_id);

-- Log this migration
INSERT INTO migration_log (migration_name, applied_at, description) 
VALUES (
  '20250711_enhanced_process_integration',
  NOW(),
  'Added comprehensive process parameters (30+), trigger rules (12), equipment interdependencies, and real-time data integration for all new equipment'
) ON CONFLICT DO NOTHING;