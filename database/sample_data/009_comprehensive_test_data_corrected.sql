-- COMPREHENSIVE TEST DATA FOR ADVANCED CMMS ANALYTICS (CORRECTED)
-- This creates realistic, interconnected data for thorough testing

-- =============================================================================
-- 1. REMAINING EQUIPMENT DATA (we already added some above)
-- =============================================================================

-- Add remaining equipment with correct column structure
INSERT INTO equipment (equipment_id, equipment_name, equipment_type_id, equipment_tag, location, operational_status, importance_level) VALUES
('MO-200', 'Motor for PU-200', 3, 'MO-200', 'Pump House A', 'OPERATIONAL', 'HIGH'),
('MO-201', 'Motor for PU-201', 3, 'MO-201', 'Pump House A', 'MAINTENANCE', 'MEDIUM'),
('VL-200', 'Control Valve 200', 5, 'VL-200', 'Tank Farm B', 'OPERATIONAL', 'MEDIUM'),
('VL-201', 'Control Valve 201', 5, 'VL-201', 'Tank Farm B', 'STOPPED', 'MEDIUM'),
('HX-201', 'Plate Heat Exchanger 201', 1, 'HX-201', 'Process Area C', 'OPERATIONAL', 'MEDIUM'),
('CO-100', 'Cooling Tower 100', 7, 'CO-100', 'Outside Area', 'OPERATIONAL', 'MEDIUM')
ON CONFLICT (equipment_id) DO NOTHING;

-- =============================================================================
-- 2. EXTENDED SYSTEM MAPPINGS
-- =============================================================================

INSERT INTO equipment_system_mapping (equipment_id, system_id, role_in_system) VALUES
-- SYS-002 mappings (Pump System)
('PU-200', 'SYS-002', 'PRIMARY'),
('PU-201', 'SYS-002', 'BACKUP'),
('MO-200', 'SYS-002', 'SUPPORT'),
('MO-201', 'SYS-002', 'SUPPORT'),

-- SYS-003 mappings (Storage System)
('TK-200', 'SYS-003', 'PRIMARY'),
('TK-201', 'SYS-003', 'PRIMARY'),
('VL-200', 'SYS-003', 'SUPPORT'),
('VL-201', 'SYS-003', 'SUPPORT'),

-- SYS-004 mappings (Heat Exchange System)
('HX-200', 'SYS-004', 'PRIMARY'),
('HX-201', 'SYS-004', 'BACKUP'),

-- SYS-005 mappings (Utility System)
('CP-100', 'SYS-005', 'PRIMARY'),
('CO-100', 'SYS-005', 'PRIMARY')
ON CONFLICT (equipment_id, system_id) DO NOTHING;

-- =============================================================================
-- 3. EXTENDED PERSONNEL AND DEPARTMENTS
-- =============================================================================

-- Add more departments with different types
INSERT INTO departments (department_id, department_name, department_type, manager_id, is_active) VALUES
('PUMP-OPS', 'Pump Operations', 'OPERATIONS', 'STAFF005', true),
('TANK-OPS', 'Tank Operations', 'OPERATIONS', 'STAFF006', true),
('UTILS', 'Utilities', 'OPERATIONS', 'STAFF007', true),
('PLANNING', 'Maintenance Planning', 'MAINTENANCE', 'STAFF008', true)
ON CONFLICT (department_id) DO NOTHING;

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
('STAFF003', 'MAINTENANCE_LEAD', 'CP-100', 'SYS-005', 'PRIMARY', '2024-01-01', true)
ON CONFLICT (staff_id, equipment_id, assignment_type) DO NOTHING;

-- =============================================================================
-- 4. COMPREHENSIVE INSTRUMENTATION MAPPING
-- =============================================================================

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
('TI-500', 'CO-100', 'TEMPERATURE', 'WATER_OUT', false, true, 25.0, 35.0, 20.0, 40.0)
ON CONFLICT (instrument_tag) DO NOTHING;

-- =============================================================================
-- 5. INSTRUMENT RISK TRIGGERS FOR CASCADE ANALYSIS
-- =============================================================================

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
('TI-500', 'HIGH_TEMPERATURE', '冷却効率低下', 38.0, 'MEDIUM', 45)
ON CONFLICT (instrument_tag, deviation_type) DO NOTHING;

-- =============================================================================
-- 6. EQUIPMENT DEPENDENCIES FOR CASCADE ANALYSIS
-- =============================================================================

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
('TI-200', 'MO-200', 'SAFETY_INTERLOCK', 'CRITICAL', 1, 'High temperature on TI-200 triggers MO-200 shutdown')
ON CONFLICT (upstream_equipment_id, downstream_equipment_id, dependency_type) DO NOTHING;

-- =============================================================================
-- 7. COMPREHENSIVE RISK ASSESSMENTS
-- =============================================================================

-- Add risk assessments for all new equipment
INSERT INTO equipment_risk_assessment (equipment_id, risk_scenario, risk_level, risk_score, impact_rank, reliability_rank, likelihood_score, consequence_score, risk_factor, mitigation_measures) VALUES
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
('CO-100', '冷却効率低下', 'MEDIUM', 50, 2, 2, 2, 2, 'Scale buildup, fan wear', 'Water treatment, fan maintenance')
ON CONFLICT (equipment_id, risk_scenario) DO NOTHING;

-- =============================================================================
-- 8. DEPARTMENT TASK STATUS FOR ALL SYSTEMS
-- =============================================================================

-- Add department task status for comprehensive testing
INSERT INTO department_task_status (department_id, task_category, equipment_id, planned_tasks, completed_tasks, overdue_tasks, period_start, period_end) VALUES
-- Pump Operations Department
('PUMP-OPS', 'DAILY_INSPECTIONS', 'PU-200', 30, 28, 2, '2024-01-01', '2024-01-31'),
('PUMP-OPS', 'PREVENTIVE_MAINTENANCE', 'PU-200', 4, 4, 0, '2024-01-01', '2024-01-31'),
('PUMP-OPS', 'DAILY_INSPECTIONS', 'PU-201', 30, 25, 5, '2024-01-01', '2024-01-31'),
('PUMP-OPS', 'SAFETY_CHECKS', 'MO-200', 12, 11, 1, '2024-01-01', '2024-01-31'),

-- Tank Operations Department
('TANK-OPS', 'DAILY_INSPECTIONS', 'TK-200', 30, 30, 0, '2024-01-01', '2024-01-31'),
('TANK-OPS', 'PREVENTIVE_MAINTENANCE', 'TK-200', 2, 2, 0, '2024-01-01', '2024-01-31'),
('TANK-OPS', 'SAFETY_CHECKS', 'TK-200', 12, 10, 2, '2024-01-01', '2024-01-31'),
('TANK-OPS', 'DAILY_INSPECTIONS', 'TK-201', 30, 27, 3, '2024-01-01', '2024-01-31'),

-- Utilities Department
('UTILS', 'PREVENTIVE_MAINTENANCE', 'CP-100', 8, 6, 2, '2024-01-01', '2024-01-31'),
('UTILS', 'DAILY_INSPECTIONS', 'CO-100', 30, 29, 1, '2024-01-01', '2024-01-31'),

-- Maintenance Planning Department
('PLANNING', 'CORRECTIVE_ACTIONS', 'HX-200', 3, 2, 1, '2024-01-01', '2024-01-31'),
('PLANNING', 'PREVENTIVE_MAINTENANCE', 'HX-201', 4, 3, 1, '2024-01-01', '2024-01-31')
ON CONFLICT (department_id, task_category, equipment_id, period_start, period_end) DO NOTHING;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify comprehensive data coverage
SELECT 'Equipment count by system' as metric, system_id, count(*) as count
FROM equipment_system_mapping 
GROUP BY system_id
UNION ALL
SELECT 'Total instrumentation', 'ALL', count(*) 
FROM instrumentation_equipment_mapping
UNION ALL
SELECT 'Total personnel assignments', 'ALL', count(*) 
FROM personnel_assignments
UNION ALL  
SELECT 'Total risk assessments', 'ALL', count(*) 
FROM equipment_risk_assessment
UNION ALL
SELECT 'Total department tasks', 'ALL', count(*) 
FROM department_task_status
ORDER BY metric, system_id;