-- COMPREHENSIVE TEST DATA FOR ADVANCED CMMS ANALYTICS
-- Fixed version without ON CONFLICT clauses

-- =============================================================================
-- 1. EXTENDED EQUIPMENT DATA ACROSS MULTIPLE SYSTEMS
-- =============================================================================

-- First check what equipment already exists to avoid duplicates
-- DELETE FROM equipment WHERE equipment_id IN ('PU-200', 'PU-201', 'MO-200', 'MO-201', 'TK-200', 'TK-201', 'VL-200', 'VL-201', 'HX-200', 'HX-201', 'CP-100', 'CO-100');

-- Add more equipment to different systems for better testing
INSERT INTO equipment (equipment_id, equipment_name, equipment_type_id, equipment_tag, location, operational_status, importance_level) VALUES
-- SYS-002 Equipment (Pump System)
('PU-200', 'Centrifugal Pump 200', 2, 'PU-200', 'Pump House A', 'OPERATIONAL', 'HIGH'),
('PU-201', 'Centrifugal Pump 201', 2, 'PU-201', 'Pump House A', 'OPERATIONAL', 'MEDIUM'),
('MO-200', 'Motor for PU-200', 3, 'MO-200', 'Pump House A', 'OPERATIONAL', 'HIGH'),
('MO-201', 'Motor for PU-201', 3, 'MO-201', 'Pump House A', 'MAINTENANCE', 'MEDIUM'),

-- SYS-003 Equipment (Storage System)  
('TK-200', 'Storage Tank 200', 4, 'TK-200', 'Tank Farm B', 'OPERATIONAL', 'CRITICAL'),
('TK-201', 'Storage Tank 201', 4, 'TK-201', 'Tank Farm B', 'OPERATIONAL', 'HIGH'),
('VL-200', 'Control Valve 200', 5, 'VL-200', 'Tank Farm B', 'OPERATIONAL', 'MEDIUM'),
('VL-201', 'Control Valve 201', 5, 'VL-201', 'Tank Farm B', 'STOPPED', 'MEDIUM'),

-- SYS-004 Equipment (Heat Exchange System)
('HX-200', 'Shell & Tube HX 200', 1, 'HX-200', 'Process Area C', 'OPERATIONAL', 'HIGH'),
('HX-201', 'Plate Heat Exchanger 201', 1, 'HX-201', 'Process Area C', 'OPERATIONAL', 'MEDIUM'),

-- SYS-005 Equipment (Utility System)
('CP-100', 'Air Compressor 100', 6, 'CP-100', 'Utility Building', 'OPERATIONAL', 'HIGH'),
('CO-100', 'Cooling Tower 100', 7, 'CO-100', 'Outside Area', 'OPERATIONAL', 'MEDIUM');

-- =============================================================================
-- 2. EXTENDED SYSTEM MAPPINGS
-- =============================================================================

-- Clear existing mappings for these systems first to avoid duplicates
DELETE FROM equipment_system_mapping WHERE system_id IN ('SYS-002', 'SYS-003', 'SYS-004', 'SYS-005');

INSERT INTO equipment_system_mapping (equipment_id, system_id, role_in_system) VALUES
-- SYS-002 mappings
('PU-200', 'SYS-002', 'PRIMARY'),
('PU-201', 'SYS-002', 'BACKUP'),
('MO-200', 'SYS-002', 'SUPPORT'),
('MO-201', 'SYS-002', 'SUPPORT'),

-- SYS-003 mappings
('TK-200', 'SYS-003', 'PRIMARY'),
('TK-201', 'SYS-003', 'PRIMARY'),
('VL-200', 'SYS-003', 'SUPPORT'),
('VL-201', 'SYS-003', 'SUPPORT'),

-- SYS-004 mappings
('HX-200', 'SYS-004', 'PRIMARY'),
('HX-201', 'SYS-004', 'BACKUP'),

-- SYS-005 mappings
('CP-100', 'SYS-005', 'PRIMARY'),
('CO-100', 'SYS-005', 'PRIMARY');

-- =============================================================================
-- 3. EXTENDED PERSONNEL AND DEPARTMENTS
-- =============================================================================

-- Clear existing test departments
DELETE FROM departments WHERE department_id IN ('PUMP-OPS', 'TANK-OPS', 'UTILS', 'PLANNING');

-- Add more departments with different types
INSERT INTO departments (department_id, department_name, department_type, manager_id, is_active) VALUES
('PUMP-OPS', 'Pump Operations', 'OPERATIONS', 'STAFF005', true),
('TANK-OPS', 'Tank Operations', 'OPERATIONS', 'STAFF006', true),
('UTILS', 'Utilities', 'OPERATIONS', 'STAFF007', true),
('PLANNING', 'Maintenance Planning', 'MAINTENANCE', 'STAFF008', true);

-- Clear existing test personnel assignments
DELETE FROM personnel_assignments WHERE staff_id IN ('STAFF005', 'STAFF006', 'STAFF007', 'STAFF008') 
   OR equipment_id IN ('PU-200', 'PU-201', 'TK-200', 'TK-201', 'HX-200', 'CP-100');

-- Add more personnel assignments for comprehensive coverage
INSERT INTO personnel_assignments (staff_id, assignment_type, equipment_id, system_id, responsibility_level, assignment_start, is_active) VALUES
-- SYS-002 assignments (Pump System)
('STAFF005', 'EQUIPMENT_OWNER', 'PU-200', 'SYS-002', 'PRIMARY', '2024-01-01', true),
('STAFF006', 'BACKUP_OPERATOR', 'PU-200', 'SYS-002', 'SECONDARY', '2024-01-01', true),
('STAFF002', 'MAINTENANCE_LEAD', 'PU-200', 'SYS-002', 'PRIMARY', '2024-01-01', true),
('STAFF005', 'EQUIPMENT_OWNER', 'PU-201', 'SYS-002', 'PRIMARY', '2024-01-01', true),

-- SYS-003 assignments (Storage System)
('STAFF007', 'EQUIPMENT_OWNER', 'TK-200', 'SYS-003', 'PRIMARY', '2024-01-01', true),
('STAFF008', 'BACKUP_OPERATOR', 'TK-200', 'SYS-003', 'SECONDARY', '2024-01-01', true),
('STAFF002', 'MAINTENANCE_LEAD', 'TK-200', 'SYS-003', 'PRIMARY', '2024-01-01', true),
('STAFF007', 'EQUIPMENT_OWNER', 'TK-201', 'SYS-003', 'PRIMARY', '2024-01-01', true),

-- SYS-004 assignments (Heat Exchange System)
('STAFF001', 'EQUIPMENT_OWNER', 'HX-200', 'SYS-004', 'PRIMARY', '2024-01-01', true),
('STAFF005', 'BACKUP_OPERATOR', 'HX-200', 'SYS-004', 'SECONDARY', '2024-01-01', true),
('STAFF002', 'MAINTENANCE_LEAD', 'HX-200', 'SYS-004', 'PRIMARY', '2024-01-01', true),

-- SYS-005 assignments (Utility System)
('STAFF008', 'EQUIPMENT_OWNER', 'CP-100', 'SYS-005', 'PRIMARY', '2024-01-01', true),
('STAFF003', 'MAINTENANCE_LEAD', 'CP-100', 'SYS-005', 'PRIMARY', '2024-01-01', true);

-- =============================================================================
-- 4. COMPREHENSIVE INSTRUMENTATION MAPPING
-- =============================================================================

-- Clear existing test instrumentation
DELETE FROM instrumentation_equipment_mapping WHERE instrument_tag IN ('PI-200', 'PI-201', 'VI-200', 'TI-200', 'FI-200', 'LI-200', 'PI-300', 'TI-300', 'LI-201', 'TI-400', 'TI-401', 'PI-400', 'FI-400', 'PI-500', 'TI-500');

-- Add comprehensive instrumentation for better cascade analysis
INSERT INTO instrumentation_equipment_mapping (instrument_tag, equipment_id, measurement_type, measurement_location, critical_for_operation, alarm_configured, normal_min, normal_max, critical_min, critical_max) VALUES
-- SYS-002 instrumentation (Pump System)
('PI-200', 'PU-200', 'PRESSURE', 'DISCHARGE', true, true, 10.0, 15.0, 8.0, 18.0),
('PI-201', 'PU-200', 'PRESSURE', 'SUCTION', true, true, 2.0, 5.0, 1.0, 7.0),
('VI-200', 'PU-200', 'VIBRATION', 'BEARING', true, true, 0.5, 2.0, 0.0, 3.0),
('TI-200', 'MO-200', 'TEMPERATURE', 'BEARING', true, true, 40.0, 80.0, 20.0, 100.0),
('FI-200', 'PU-200', 'FLOW', 'DISCHARGE', true, true, 500.0, 1200.0, 300.0, 1500.0),

-- SYS-003 instrumentation (Storage System)
('LI-200', 'TK-200', 'LEVEL', 'TANK', true, true, 20.0, 80.0, 10.0, 90.0),
('PI-300', 'TK-200', 'PRESSURE', 'TOP', false, true, 0.0, 2.0, -0.5, 3.0),
('TI-300', 'TK-200', 'TEMPERATURE', 'SIDE', false, true, 20.0, 60.0, 10.0, 80.0),
('LI-201', 'TK-201', 'LEVEL', 'TANK', true, true, 20.0, 80.0, 10.0, 90.0),

-- SYS-004 instrumentation (Heat Exchange System)
('TI-400', 'HX-200', 'TEMPERATURE', 'INLET', true, true, 60.0, 90.0, 40.0, 110.0),
('TI-401', 'HX-200', 'TEMPERATURE', 'OUTLET', true, true, 80.0, 120.0, 60.0, 140.0),
('PI-400', 'HX-200', 'PRESSURE', 'SHELL_SIDE', false, true, 5.0, 8.0, 3.0, 10.0),
('FI-400', 'HX-200', 'FLOW', 'INLET', true, true, 200.0, 800.0, 100.0, 1000.0),

-- SYS-005 instrumentation (Utility System)
('PI-500', 'CP-100', 'PRESSURE', 'DISCHARGE', true, true, 6.0, 8.0, 5.0, 10.0),
('TI-500', 'CO-100', 'TEMPERATURE', 'WATER_OUT', false, true, 25.0, 35.0, 20.0, 40.0);

-- =============================================================================
-- 5. INSTRUMENT RISK TRIGGERS FOR CASCADE ANALYSIS
-- =============================================================================

-- Clear existing test triggers
DELETE FROM instrument_risk_triggers WHERE instrument_tag IN ('PI-200', 'PI-201', 'VI-200', 'TI-200', 'FI-200', 'LI-200', 'PI-300', 'TI-300', 'TI-400', 'TI-401', 'PI-400', 'FI-400', 'PI-500', 'TI-500');

-- Add comprehensive risk triggers for instrumentation
INSERT INTO instrument_risk_triggers (instrument_tag, deviation_type, triggered_risk_scenario, threshold_value, severity_level, response_time_minutes) VALUES
-- Pump system triggers
('PI-200', 'HIGH_PRESSURE', 'ポンプ過負荷', 16.0, 'HIGH', 10),
('PI-200', 'LOW_PRESSURE', 'ポンプ故障', 9.0, 'CRITICAL', 5),
('PI-201', 'LOW_PRESSURE', 'キャビテーション', 1.5, 'HIGH', 15),
('VI-200', 'HIGH_VIBRATION', 'ベアリング損傷', 2.5, 'HIGH', 20),
('TI-200', 'HIGH_TEMPERATURE', 'モーター過熱', 90.0, 'CRITICAL', 5),
('FI-200', 'LOW_FLOW', '流路閉塞', 400.0, 'MEDIUM', 30),

-- Tank system triggers
('LI-200', 'HIGH_LEVEL', 'オーバーフロー', 85.0, 'CRITICAL', 5),
('LI-200', 'LOW_LEVEL', 'ポンプ空運転', 15.0, 'HIGH', 10),
('PI-300', 'HIGH_PRESSURE', 'タンク破損', 2.5, 'CRITICAL', 2),
('TI-300', 'HIGH_TEMPERATURE', '蒸発過多', 70.0, 'MEDIUM', 60),

-- Heat exchanger triggers
('TI-400', 'LOW_TEMPERATURE', '流量不足', 50.0, 'MEDIUM', 30),
('TI-401', 'HIGH_TEMPERATURE', 'ファウリング', 130.0, 'HIGH', 15),
('PI-400', 'HIGH_PRESSURE', '詰まり', 9.0, 'HIGH', 20),
('FI-400', 'LOW_FLOW', '配管詰まり', 150.0, 'MEDIUM', 25),

-- Utility system triggers
('PI-500', 'LOW_PRESSURE', 'コンプレッサー故障', 5.5, 'HIGH', 10),
('TI-500', 'HIGH_TEMPERATURE', '冷却効率低下', 38.0, 'MEDIUM', 45);

-- =============================================================================
-- 6. EQUIPMENT DEPENDENCIES FOR CASCADE ANALYSIS
-- =============================================================================

-- Clear existing test dependencies
DELETE FROM equipment_dependencies WHERE 
   upstream_equipment_id IN ('PU-200', 'PU-201', 'MO-200', 'TK-200', 'VL-200', 'TK-201', 'HX-200', 'CP-100', 'CO-100', 'PI-200', 'LI-200', 'TI-200')
   OR downstream_equipment_id IN ('HX-200', 'TK-200', 'PU-200', 'TK-201', 'VL-200', 'MO-200');

-- Add comprehensive equipment dependencies
INSERT INTO equipment_dependencies (upstream_equipment_id, downstream_equipment_id, dependency_type, impact_severity, time_to_impact_minutes, description) VALUES
-- Pump system dependencies
('PU-200', 'HX-200', 'PROCESS_FLOW', 'HIGH', 5, 'PU-200 provides cooling water to HX-200'),
('PU-200', 'TK-200', 'PROCESS_FLOW', 'MEDIUM', 15, 'PU-200 feeds process fluid to TK-200'),
('MO-200', 'PU-200', 'UTILITY_SUPPLY', 'CRITICAL', 1, 'MO-200 drives PU-200 directly'),
('PU-201', 'PU-200', 'PROCESS_FLOW', 'MEDIUM', 10, 'PU-201 backup for PU-200'),

-- Tank system dependencies
('TK-200', 'HX-200', 'PROCESS_FLOW', 'MEDIUM', 20, 'TK-200 supplies feed to HX-200'),
('VL-200', 'TK-200', 'CONTROL_SIGNAL', 'HIGH', 2, 'VL-200 controls TK-200 level'),
('TK-201', 'TK-200', 'PROCESS_FLOW', 'LOW', 60, 'TK-201 overflow backup for TK-200'),

-- Heat exchanger dependencies
('HX-200', 'TK-201', 'PROCESS_FLOW', 'MEDIUM', 15, 'HX-200 outlet feeds TK-201'),
('CP-100', 'HX-200', 'UTILITY_SUPPLY', 'MEDIUM', 30, 'CP-100 provides instrument air to HX-200'),

-- Cross-system dependencies
('CO-100', 'PU-200', 'UTILITY_SUPPLY', 'MEDIUM', 45, 'CO-100 provides cooling for PU-200'),
('CP-100', 'VL-200', 'UTILITY_SUPPLY', 'HIGH', 5, 'CP-100 provides control air to VL-200'),

-- Safety interlocks
('PI-200', 'PU-200', 'SAFETY_INTERLOCK', 'CRITICAL', 1, 'High pressure on PI-200 triggers PU-200 shutdown'),
('LI-200', 'PU-200', 'SAFETY_INTERLOCK', 'CRITICAL', 1, 'Low level on LI-200 triggers PU-200 shutdown'),
('TI-200', 'MO-200', 'SAFETY_INTERLOCK', 'CRITICAL', 1, 'High temperature on TI-200 triggers MO-200 shutdown');

-- =============================================================================
-- 7. COMPREHENSIVE RISK ASSESSMENTS
-- =============================================================================

-- Clear existing test risk assessments for new equipment
DELETE FROM equipment_risk_assessment WHERE equipment_id IN ('PU-200', 'MO-200', 'PU-201', 'TK-200', 'TK-201', 'VL-200', 'HX-200', 'HX-201', 'CP-100', 'CO-100');

-- Add risk assessments for all new equipment
INSERT INTO equipment_risk_assessment (equipment_id, risk_scenario, risk_level, risk_score, impact_rank, reliability_rank, likelihood_score, consequence_score, risk_factors, mitigation_measures) VALUES
-- SYS-002 risk assessments
('PU-200', 'ポンプ故障', 'HIGH', 85, 4, 3, 4, 4, 'High duty cycle, critical process role', 'Vibration monitoring, preventive maintenance'),
('PU-200', 'キャビテーション', 'MEDIUM', 65, 3, 3, 3, 3, 'Suction pressure variations', 'NPSH monitoring, flow control'),
('MO-200', 'モーター過熱', 'HIGH', 80, 4, 4, 4, 4, 'Continuous operation, bearing wear', 'Temperature monitoring, lubrication'),
('PU-201', 'ポンプ故障', 'MEDIUM', 60, 3, 2, 3, 2, 'Backup pump, lower utilization', 'Regular testing, standby maintenance'),

-- SYS-003 risk assessments
('TK-200', 'タンク破損', 'CRITICAL', 95, 5, 4, 4, 5, 'High pressure rating, corrosive contents', 'Thickness monitoring, pressure testing'),
('TK-200', '漏洩', 'HIGH', 85, 4, 4, 4, 4, 'Gasket aging, thermal cycling', 'Leak detection, gasket replacement'),
('TK-201', 'オーバーフロー', 'MEDIUM', 70, 3, 3, 3, 3, 'Level control failure', 'Redundant level switches, operator training'),
('VL-200', 'バルブ故障', 'MEDIUM', 55, 2, 3, 2, 3, 'Actuator failure, control signal loss', 'Actuator maintenance, signal monitoring'),

-- SYS-004 risk assessments
('HX-200', 'ファウリング', 'HIGH', 80, 3, 4, 4, 3, 'Process fluid characteristics, temperature', 'Regular cleaning, chemical treatment'),
('HX-200', 'チューブ漏れ', 'MEDIUM', 65, 3, 3, 3, 3, 'Thermal stress, corrosion', 'Hydrostatic testing, tube inspection'),
('HX-201', 'プレート損傷', 'MEDIUM', 60, 2, 3, 2, 3, 'Gasket failure, over-pressure', 'Gasket inspection, pressure monitoring'),

-- SYS-005 risk assessments
('CP-100', 'コンプレッサー故障', 'HIGH', 75, 4, 3, 3, 4, 'High cycle frequency, wear parts', 'Oil analysis, valve inspection'),
('CO-100', '冷却効率低下', 'MEDIUM', 50, 2, 2, 2, 2, 'Scale buildup, fan wear', 'Water treatment, fan maintenance');

-- =============================================================================
-- 8. DEPARTMENT TASK STATUS FOR ALL SYSTEMS
-- =============================================================================

-- Clear existing test department task status
DELETE FROM department_task_status WHERE department_id IN ('PUMP-OPS', 'TANK-OPS', 'UTILS', 'PLANNING');

-- Add department task status for comprehensive testing
INSERT INTO department_task_status (department_id, task_category, equipment_id, planned_tasks, completed_tasks, overdue_tasks, period_start, period_end) VALUES
-- PUMP-OPS department tasks
('PUMP-OPS', 'PREVENTIVE_MAINTENANCE', 'PU-200', 4, 4, 0, '2024-01-01', '2024-01-31'),
('PUMP-OPS', 'DAILY_INSPECTIONS', 'PU-200', 30, 28, 2, '2024-01-01', '2024-01-31'),
('PUMP-OPS', 'PREVENTIVE_MAINTENANCE', 'PU-201', 4, 3, 1, '2024-01-01', '2024-01-31'),
('PUMP-OPS', 'DAILY_INSPECTIONS', 'PU-201', 30, 30, 0, '2024-01-01', '2024-01-31'),

-- TANK-OPS department tasks
('TANK-OPS', 'PREVENTIVE_MAINTENANCE', 'TK-200', 2, 2, 0, '2024-01-01', '2024-01-31'),
('TANK-OPS', 'DAILY_INSPECTIONS', 'TK-200', 30, 30, 0, '2024-01-01', '2024-01-31'),
('TANK-OPS', 'SAFETY_CHECKS', 'TK-200', 4, 4, 0, '2024-01-01', '2024-01-31'),
('TANK-OPS', 'PREVENTIVE_MAINTENANCE', 'TK-201', 2, 1, 1, '2024-01-01', '2024-01-31'),

-- UTILS department tasks
('UTILS', 'PREVENTIVE_MAINTENANCE', 'CP-100', 8, 7, 1, '2024-01-01', '2024-01-31'),
('UTILS', 'DAILY_INSPECTIONS', 'CP-100', 30, 30, 0, '2024-01-01', '2024-01-31'),
('UTILS', 'PREVENTIVE_MAINTENANCE', 'CO-100', 4, 4, 0, '2024-01-01', '2024-01-31'),

-- PLANNING department tasks (cross-equipment)
('PLANNING', 'CORRECTIVE_ACTIONS', NULL, 15, 12, 3, '2024-01-01', '2024-01-31'),
('PLANNING', 'SAFETY_CHECKS', NULL, 20, 19, 1, '2024-01-01', '2024-01-31');

-- =============================================================================
-- 9. EQUIPMENT STRATEGIES FOR NEW EQUIPMENT
-- =============================================================================

-- Clear existing strategies for new equipment
DELETE FROM equipment_strategy WHERE equipment_id IN ('PU-200', 'PU-201', 'TK-200', 'TK-201', 'HX-200', 'HX-201', 'CP-100');

-- Add comprehensive maintenance strategies
INSERT INTO equipment_strategy (equipment_id, strategy_type, strategy_name, frequency_days, last_performed, next_scheduled, estimated_hours, required_skills, strategy_details) VALUES
-- Pump strategies
('PU-200', 'PREVENTIVE', 'Pump PM Level 1', 30, '2024-01-15', '2024-02-15', 4.0, 'MECHANICAL', 'Vibration check, lubrication, seal inspection'),
('PU-200', 'PREDICTIVE', 'Vibration Analysis', 90, '2023-12-01', '2024-03-01', 2.0, 'INSTRUMENTATION', 'Detailed vibration spectrum analysis'),
('PU-201', 'PREVENTIVE', 'Pump PM Level 1', 30, '2024-01-10', '2024-02-10', 4.0, 'MECHANICAL', 'Backup pump testing and inspection'),

-- Tank strategies
('TK-200', 'INSPECTION', 'Tank Thickness Testing', 365, '2023-06-01', '2024-06-01', 8.0, 'INSTRUMENTATION', 'Ultrasonic thickness measurement at critical points'),
('TK-200', 'PREVENTIVE', 'Tank PM Level 2', 180, '2023-10-01', '2024-04-01', 6.0, 'MECHANICAL', 'Valve testing, gasket inspection, pressure test'),
('TK-201', 'INSPECTION', 'Tank Visual Inspection', 90, '2024-01-01', '2024-04-01', 2.0, 'PROCESS', 'External visual inspection and safety check'),

-- Heat exchanger strategies
('HX-200', 'PREVENTIVE', 'HX Cleaning', 180, '2023-09-01', '2024-03-01', 12.0, 'MECHANICAL', 'Tube cleaning, fouling removal, efficiency test'),
('HX-200', 'PREDICTIVE', 'Performance Monitoring', 30, '2024-01-20', '2024-02-20', 1.0, 'PROCESS', 'Heat transfer efficiency calculation'),
('HX-201', 'PREVENTIVE', 'Plate HX Service', 365, '2023-03-01', '2024-03-01', 8.0, 'MECHANICAL', 'Plate inspection, gasket replacement'),

-- Compressor strategies
('CP-100', 'PREVENTIVE', 'Compressor PM', 90, '2023-12-15', '2024-03-15', 6.0, 'MECHANICAL', 'Valve inspection, oil change, filter replacement');

-- =============================================================================
-- 10. SYSTEM PERFORMANCE DATA FOR TESTING
-- =============================================================================

-- Clear and add system data
DELETE FROM system WHERE system_id IN ('SYS-002', 'SYS-003', 'SYS-004', 'SYS-005');

INSERT INTO system (system_id, system_name, system_type, location, criticality_level, description) VALUES
('SYS-002', 'Pump System B', 'PUMPING', 'Pump House A', 'HIGH', 'Secondary pumping system for process fluids'),
('SYS-003', 'Storage System B', 'STORAGE', 'Tank Farm B', 'CRITICAL', 'Bulk storage for process intermediates'),
('SYS-004', 'Heat Exchange System B', 'HEAT_TRANSFER', 'Process Area C', 'HIGH', 'Secondary cooling system'),
('SYS-005', 'Utility System', 'UTILITIES', 'Utility Building', 'MEDIUM', 'Compressed air and cooling water supply');

-- =============================================================================
-- TESTING COMPLETE
-- =============================================================================

-- Verify data insertion
SELECT 'Equipment added:' as status, COUNT(*) as count FROM equipment WHERE equipment_id IN ('PU-200', 'PU-201', 'MO-200', 'MO-201', 'TK-200', 'TK-201', 'VL-200', 'VL-201', 'HX-200', 'HX-201', 'CP-100', 'CO-100')
UNION ALL
SELECT 'System mappings added:', COUNT(*) FROM equipment_system_mapping WHERE system_id IN ('SYS-002', 'SYS-003', 'SYS-004', 'SYS-005')
UNION ALL
SELECT 'Instrumentation added:', COUNT(*) FROM instrumentation_equipment_mapping WHERE instrument_tag LIKE '%200' OR instrument_tag LIKE '%201' OR instrument_tag LIKE '%300' OR instrument_tag LIKE '%400' OR instrument_tag LIKE '%500'
UNION ALL
SELECT 'Risk triggers added:', COUNT(*) FROM instrument_risk_triggers WHERE instrument_tag LIKE '%200' OR instrument_tag LIKE '%201' OR instrument_tag LIKE '%300' OR instrument_tag LIKE '%400' OR instrument_tag LIKE '%500'
UNION ALL
SELECT 'Dependencies added:', COUNT(*) FROM equipment_dependencies WHERE upstream_equipment_id IN ('PU-200', 'PU-201', 'MO-200', 'TK-200', 'VL-200', 'TK-201', 'HX-200', 'CP-100', 'CO-100')
UNION ALL
SELECT 'Risk assessments added:', COUNT(*) FROM equipment_risk_assessment WHERE equipment_id IN ('PU-200', 'MO-200', 'PU-201', 'TK-200', 'TK-201', 'VL-200', 'HX-200', 'HX-201', 'CP-100', 'CO-100')
UNION ALL
SELECT 'Department tasks added:', COUNT(*) FROM department_task_status WHERE department_id IN ('PUMP-OPS', 'TANK-OPS', 'UTILS', 'PLANNING')
UNION ALL
SELECT 'Strategies added:', COUNT(*) FROM equipment_strategy WHERE equipment_id IN ('PU-200', 'PU-201', 'TK-200', 'TK-201', 'HX-200', 'HX-201', 'CP-100');