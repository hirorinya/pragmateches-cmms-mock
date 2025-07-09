-- ============================================
-- Sample Process Trigger System Data
-- ============================================

-- 1. Insert process parameters for key equipment
INSERT INTO process_parameters (
    parameter_id, parameter_name, parameter_type, unit, equipment_id, tag_name,
    normal_min, normal_max, critical_min, critical_max
) VALUES 
-- Tank TK-101 parameters
('TI-101-01', 'Tank TK-101 Temperature', 'TEMPERATURE', '°C', 'TK-101', 'TI-101-01', 20.0, 80.0, 10.0, 100.0),
('PI-101-01', 'Tank TK-101 Pressure', 'PRESSURE', 'MPa', 'TK-101', 'PI-101-01', 0.1, 1.5, 0.0, 2.0),
('LI-101-01', 'Tank TK-101 Level', 'LEVEL', 'm', 'TK-101', 'LI-101-01', 1.0, 8.0, 0.5, 10.0),

-- Tank TK-102 parameters  
('TI-102-01', 'Tank TK-102 Temperature', 'TEMPERATURE', '°C', 'TK-102', 'TI-102-01', 25.0, 85.0, 15.0, 105.0),
('PI-102-01', 'Tank TK-102 Pressure', 'PRESSURE', 'MPa', 'TK-102', 'PI-102-01', 0.2, 1.8, 0.0, 2.5),

-- Pump PU-100 parameters
('VI-100-01', 'Pump PU-100 Vibration', 'VIBRATION', 'mm/s', 'PU-100', 'VI-100-01', 0.5, 3.0, 0.0, 5.0),
('TI-100-01', 'Pump PU-100 Bearing Temperature', 'TEMPERATURE', '°C', 'PU-100', 'TI-100-01', 30.0, 70.0, 20.0, 90.0),
('FI-100-01', 'Pump PU-100 Flow Rate', 'FLOW', 'm3/h', 'PU-100', 'FI-100-01', 50.0, 200.0, 10.0, 250.0),

-- Pump PU-101 parameters
('VI-101-01', 'Pump PU-101 Vibration', 'VIBRATION', 'mm/s', 'PU-101', 'VI-101-01', 0.5, 2.8, 0.0, 4.5),
('TI-101-02', 'Pump PU-101 Motor Temperature', 'TEMPERATURE', '°C', 'PU-101', 'TI-101-02', 25.0, 75.0, 15.0, 95.0),

-- Heat Exchanger HX-101 parameters
('TI-HX101-IN', 'HX-101 Inlet Temperature', 'TEMPERATURE', '°C', 'HX-101', 'TI-HX101-IN', 40.0, 120.0, 30.0, 150.0),
('TI-HX101-OUT', 'HX-101 Outlet Temperature', 'TEMPERATURE', '°C', 'HX-101', 'TI-HX101-OUT', 35.0, 100.0, 25.0, 130.0),
('PI-HX101-01', 'HX-101 Shell Side Pressure', 'PRESSURE', 'MPa', 'HX-101', 'PI-HX101-01', 0.3, 2.2, 0.1, 3.0);

-- 2. Insert process trigger rules
INSERT INTO process_trigger_rules (
    rule_id, rule_name, parameter_id, trigger_type, condition_type,
    threshold_value, threshold_percent, evaluation_window_minutes, min_duration_minutes, severity
) VALUES 
-- Temperature deviation rules
('TR-001', 'TK-101 Temperature High Deviation', 'TI-101-01', 'DEVIATION', 'CHANGE_PERCENT', NULL, 15.0, 60, 30, 'MEDIUM'),
('TR-002', 'TK-101 Critical Temperature', 'TI-101-01', 'LIMIT_EXCEEDED', 'GREATER_THAN', 90.0, NULL, 5, 1, 'CRITICAL'),
('TR-003', 'Pump PU-100 Bearing Overheating', 'TI-100-01', 'LIMIT_EXCEEDED', 'GREATER_THAN', 75.0, NULL, 10, 5, 'HIGH'),

-- Vibration trend rules
('TR-004', 'PU-100 Vibration Trend Increase', 'VI-100-01', 'TREND', 'CHANGE_PERCENT', NULL, 25.0, 120, 60, 'MEDIUM'),
('TR-005', 'PU-100 Critical Vibration', 'VI-100-01', 'LIMIT_EXCEEDED', 'GREATER_THAN', 4.0, NULL, 5, 1, 'CRITICAL'),
('TR-006', 'PU-101 Vibration Baseline Shift', 'VI-101-01', 'DEVIATION', 'CHANGE_PERCENT', NULL, 20.0, 180, 90, 'MEDIUM'),

-- Pressure rules
('TR-007', 'TK-101 Pressure Fluctuation', 'PI-101-01', 'DEVIATION', 'OUTSIDE_RANGE', NULL, 10.0, 30, 15, 'LOW'),
('TR-008', 'HX-101 Pressure Drop Increase', 'PI-HX101-01', 'TREND', 'CHANGE_PERCENT', NULL, 30.0, 240, 120, 'MEDIUM'),

-- Flow rate rules
('TR-009', 'PU-100 Flow Rate Decrease', 'FI-100-01', 'DEVIATION', 'CHANGE_PERCENT', NULL, -20.0, 60, 30, 'MEDIUM'),
('TR-010', 'PU-100 Low Flow Critical', 'FI-100-01', 'LIMIT_EXCEEDED', 'LESS_THAN', 20.0, NULL, 10, 5, 'HIGH');

-- 3. Map process triggers to equipment strategies
INSERT INTO es_process_mapping (
    strategy_id, rule_id, impact_type, impact_description, recommended_action, auto_apply
) VALUES 
-- TK-101 strategies affected by temperature changes
('ES001', 'TR-001', 'FREQUENCY_CHANGE', 'Temperature deviation may indicate internal issues requiring more frequent pressure checks', 'INCREASE_FREQUENCY', false),
('ES002', 'TR-001', 'SCOPE_CHANGE', 'Temperature deviation requires additional thermal inspection during visual checks', 'ADD_INSPECTION', false),
('ES003', 'TR-001', 'FREQUENCY_CHANGE', 'Temperature changes affect corrosion rates, increase thickness measurement frequency', 'INCREASE_FREQUENCY', false),

-- Critical temperature triggers immediate action
('ES001', 'TR-002', 'PRIORITY_CHANGE', 'Critical temperature requires immediate pressure system verification', 'CHANGE_PRIORITY', true),
('ES002', 'TR-002', 'FREQUENCY_CHANGE', 'Critical temperature condition requires daily visual inspection until resolved', 'INCREASE_FREQUENCY', true),

-- Pump vibration affects maintenance strategies
('ES008', 'TR-004', 'FREQUENCY_CHANGE', 'Vibration trend increase requires more frequent monitoring', 'INCREASE_FREQUENCY', false),
('ES008', 'TR-005', 'PRIORITY_CHANGE', 'Critical vibration requires immediate inspection', 'CHANGE_PRIORITY', true),
('ES009', 'TR-004', 'SCOPE_CHANGE', 'Vibration issues may require bearing lubrication frequency adjustment', 'ADD_INSPECTION', false),

-- Vibration baseline shifts for other pump
('ES008', 'TR-006', 'NEW_REQUIREMENT', 'Baseline shift indicates potential mechanical changes requiring analysis', 'ADD_INSPECTION', false),

-- Flow rate impacts pump strategies
('ES008', 'TR-009', 'SCOPE_CHANGE', 'Flow rate changes may indicate impeller wear or system blockage', 'ADD_INSPECTION', false),
('ES009', 'TR-009', 'FREQUENCY_CHANGE', 'Reduced flow increases bearing stress, increase lubrication frequency', 'INCREASE_FREQUENCY', false),
('ES010', 'TR-009', 'NEW_REQUIREMENT', 'Flow changes require pump alignment verification', 'ADD_INSPECTION', false);

-- 4. Insert some sample process baselines
INSERT INTO process_baselines (
    parameter_id, baseline_type, baseline_value, confidence_interval, valid_from, calculated_from
) VALUES 
-- Current month baselines
('TI-101-01', 'MONTHLY', 45.5, 5.0, '2025-07-01', 2160), -- 30 days * 24 hours * 3 readings
('PI-101-01', 'MONTHLY', 0.8, 8.0, '2025-07-01', 2160),
('VI-100-01', 'MONTHLY', 1.2, 15.0, '2025-07-01', 1440), -- Hourly readings
('TI-100-01', 'MONTHLY', 52.0, 10.0, '2025-07-01', 2160),
('FI-100-01', 'MONTHLY', 125.0, 12.0, '2025-07-01', 1440),

-- Weekly baselines (rolling)
('TI-101-01', 'WEEKLY', 46.2, 4.0, '2025-07-01', 504), -- 7 days * 24 hours * 3 readings
('VI-100-01', 'WEEKLY', 1.15, 12.0, '2025-07-01', 168),
('FI-100-01', 'WEEKLY', 128.5, 8.0, '2025-07-01', 168),

-- Design baselines (reference values)
('TI-101-01', 'DESIGN', 50.0, 0.0, '2020-01-01', 1),
('PI-101-01', 'DESIGN', 1.0, 0.0, '2020-01-01', 1),
('VI-100-01', 'DESIGN', 1.0, 0.0, '2020-01-01', 1),
('TI-100-01', 'DESIGN', 55.0, 0.0, '2020-01-01', 1),
('FI-100-01', 'DESIGN', 150.0, 0.0, '2020-01-01', 1);

-- 5. Insert some sample recent process data
INSERT INTO process_data (parameter_id, timestamp, value, quality, source) VALUES 
-- Recent data for TK-101 temperature (showing increasing trend)
('TI-101-01', '2025-07-08 09:00:00', 52.3, 'GOOD', 'DCS'),
('TI-101-01', '2025-07-08 08:00:00', 51.8, 'GOOD', 'DCS'),
('TI-101-01', '2025-07-08 07:00:00', 50.5, 'GOOD', 'DCS'),
('TI-101-01', '2025-07-08 06:00:00', 49.2, 'GOOD', 'DCS'),

-- Pressure data
('PI-101-01', '2025-07-08 09:00:00', 0.85, 'GOOD', 'DCS'),
('PI-101-01', '2025-07-08 08:00:00', 0.82, 'GOOD', 'DCS'),

-- Vibration data showing concerning trend
('VI-100-01', '2025-07-08 09:00:00', 1.8, 'GOOD', 'DCS'),
('VI-100-01', '2025-07-08 08:00:00', 1.7, 'GOOD', 'DCS'),
('VI-100-01', '2025-07-08 07:00:00', 1.5, 'GOOD', 'DCS'),
('VI-100-01', '2025-07-08 06:00:00', 1.3, 'GOOD', 'DCS'),

-- Flow rate data
('FI-100-01', '2025-07-08 09:00:00', 110.0, 'GOOD', 'DCS'),
('FI-100-01', '2025-07-08 08:00:00', 115.0, 'GOOD', 'DCS'),
('FI-100-01', '2025-07-08 07:00:00', 120.0, 'GOOD', 'DCS');