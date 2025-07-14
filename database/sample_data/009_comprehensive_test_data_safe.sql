-- COMPREHENSIVE TEST DATA FOR ADVANCED CMMS ANALYTICS
-- Safe version that checks for existing data first

-- =============================================================================
-- CHECK WHAT EQUIPMENT ALREADY EXISTS
-- =============================================================================
SELECT 'Existing equipment check:' as info, equipment_id 
FROM equipment 
WHERE equipment_id IN ('PU-200', 'PU-201', 'MO-200', 'MO-201', 'TK-200', 'TK-201', 'VL-200', 'VL-201', 'HX-200', 'HX-201', 'CP-100', 'CO-100');

-- =============================================================================
-- 1. ONLY ADD EQUIPMENT THAT DOESN'T EXIST
-- =============================================================================

-- Add only missing equipment
INSERT INTO equipment (equipment_id, equipment_name, equipment_type_id, equipment_tag, location, operational_status, importance_level) 
SELECT * FROM (VALUES
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
    ('CO-100', 'Cooling Tower 100', 7, 'CO-100', 'Outside Area', 'OPERATIONAL', 'MEDIUM')
) AS new_equipment(equipment_id, equipment_name, equipment_type_id, equipment_tag, location, operational_status, importance_level)
WHERE NOT EXISTS (
    SELECT 1 FROM equipment e WHERE e.equipment_id = new_equipment.equipment_id
);

-- =============================================================================
-- 2. EXTENDED SYSTEM MAPPINGS (REPLACE EXISTING)
-- =============================================================================

-- Clear existing mappings for these systems first
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
-- 3. DEPARTMENTS (ONLY ADD IF NOT EXISTS)
-- =============================================================================

INSERT INTO departments (department_id, department_name, department_type, manager_id, is_active)
SELECT * FROM (VALUES
    ('PUMP-OPS', 'Pump Operations', 'OPERATIONS', 'STAFF005', true),
    ('TANK-OPS', 'Tank Operations', 'OPERATIONS', 'STAFF006', true),
    ('UTILS', 'Utilities', 'OPERATIONS', 'STAFF007', true),
    ('PLANNING', 'Maintenance Planning', 'MAINTENANCE', 'STAFF008', true)
) AS new_dept(department_id, department_name, department_type, manager_id, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM departments d WHERE d.department_id = new_dept.department_id
);

-- =============================================================================
-- 4. INSTRUMENTATION MAPPING (REPLACE EXISTING)
-- =============================================================================

-- Clear existing test instrumentation
DELETE FROM instrumentation_equipment_mapping 
WHERE instrument_tag IN ('PI-200', 'PI-201', 'TI-202', 'TI-200', 'FI-200', 'LI-200', 'PI-300', 'TI-300', 'LI-201', 'TI-400', 'TI-401', 'PI-400', 'FI-400', 'PI-500', 'TI-500');

-- Add comprehensive instrumentation
INSERT INTO instrumentation_equipment_mapping (instrument_tag, equipment_id, measurement_type, measurement_location, critical_for_operation, alarm_configured, normal_min, normal_max, critical_min, critical_max) VALUES
-- SYS-002 instrumentation (Pump System)
('PI-200', 'PU-200', 'PRESSURE', 'DISCHARGE', true, true, 10.0, 15.0, 8.0, 18.0),
('PI-201', 'PU-200', 'PRESSURE', 'SUCTION', true, true, 2.0, 5.0, 1.0, 7.0),
('TI-200', 'MO-200', 'TEMPERATURE', 'BEARING', true, true, 40.0, 80.0, 20.0, 100.0),
('TI-202', 'PU-200', 'TEMPERATURE', 'BEARING', true, true, 40.0, 70.0, 30.0, 85.0),
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
-- 5. INSTRUMENT RISK TRIGGERS (REPLACE EXISTING)
-- =============================================================================

-- Clear existing test triggers
DELETE FROM instrument_risk_triggers 
WHERE instrument_tag IN ('PI-200', 'PI-201', 'TI-202', 'TI-200', 'FI-200', 'LI-200', 'PI-300', 'TI-300', 'TI-400', 'TI-401', 'PI-400', 'FI-400', 'PI-500', 'TI-500');

-- Add risk triggers
INSERT INTO instrument_risk_triggers (instrument_tag, deviation_type, triggered_risk_scenario, threshold_value, severity_level, response_time_minutes) VALUES
-- Pump system triggers
('PI-200', 'HIGH_PRESSURE', 'Pump overload', 16.0, 'HIGH', 10),
('PI-200', 'LOW_PRESSURE', 'Pump failure', 9.0, 'CRITICAL', 5),
('PI-201', 'LOW_PRESSURE', 'Cavitation risk', 1.5, 'HIGH', 15),
('TI-202', 'HIGH_TEMPERATURE', 'Pump bearing overheat', 75.0, 'HIGH', 20),
('TI-200', 'HIGH_TEMPERATURE', 'Motor overheat', 90.0, 'CRITICAL', 5),
('FI-200', 'LOW_FLOW', 'Flow blockage', 400.0, 'MEDIUM', 30),
-- Tank system triggers (level triggers removed due to constraint)
('PI-300', 'HIGH_PRESSURE', 'Tank rupture risk', 2.5, 'CRITICAL', 2),
('TI-300', 'HIGH_TEMPERATURE', 'Excessive evaporation', 70.0, 'MEDIUM', 60),
-- Heat exchanger triggers
('TI-400', 'LOW_TEMPERATURE', 'Insufficient flow', 50.0, 'MEDIUM', 30),
('TI-401', 'HIGH_TEMPERATURE', 'Fouling detected', 130.0, 'HIGH', 15),
('PI-400', 'HIGH_PRESSURE', 'Tube blockage', 9.0, 'HIGH', 20),
('FI-400', 'LOW_FLOW', 'Pipe blockage', 150.0, 'MEDIUM', 25),
-- Utility system triggers
('PI-500', 'LOW_PRESSURE', 'Compressor failure', 5.5, 'HIGH', 10),
('TI-500', 'HIGH_TEMPERATURE', 'Cooling inefficiency', 38.0, 'MEDIUM', 45);

-- =============================================================================
-- 6. EQUIPMENT DEPENDENCIES (REPLACE EXISTING)
-- =============================================================================

-- Clear existing dependencies for our equipment
DELETE FROM equipment_dependencies 
WHERE upstream_equipment_id IN ('PU-200', 'PU-201', 'MO-200', 'TK-200', 'VL-200', 'TK-201', 'HX-200', 'CP-100', 'CO-100')
   OR downstream_equipment_id IN ('PU-200', 'HX-200', 'TK-200', 'TK-201', 'VL-200', 'MO-200');

-- Add equipment dependencies
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
('CP-100', 'VL-200', 'UTILITY_SUPPLY', 'HIGH', 5, 'CP-100 provides control air to VL-200');

-- =============================================================================
-- 7. DEPARTMENT TASK STATUS (REPLACE EXISTING)
-- =============================================================================

-- Clear existing department task status
DELETE FROM department_task_status WHERE department_id IN ('PUMP-OPS', 'TANK-OPS', 'UTILS', 'PLANNING');

-- Add department task status
INSERT INTO department_task_status (department_id, task_category, equipment_id, planned_tasks, completed_tasks, overdue_tasks, period_start, period_end) VALUES
-- PUMP-OPS department tasks
('PUMP-OPS', 'PREVENTIVE_MAINTENANCE', 'PU-200', 4, 4, 0, '2024-01-01', '2024-01-31'),
('PUMP-OPS', 'DAILY_INSPECTIONS', 'PU-200', 30, 28, 2, '2024-01-01', '2024-01-31'),
('PUMP-OPS', 'PREVENTIVE_MAINTENANCE', 'PU-201', 4, 3, 1, '2024-01-01', '2024-01-31'),
-- TANK-OPS department tasks
('TANK-OPS', 'PREVENTIVE_MAINTENANCE', 'TK-200', 2, 2, 0, '2024-01-01', '2024-01-31'),
('TANK-OPS', 'DAILY_INSPECTIONS', 'TK-200', 30, 30, 0, '2024-01-01', '2024-01-31'),
('TANK-OPS', 'SAFETY_CHECKS', 'TK-200', 4, 4, 0, '2024-01-01', '2024-01-31'),
-- UTILS department tasks
('UTILS', 'PREVENTIVE_MAINTENANCE', 'CP-100', 8, 7, 1, '2024-01-01', '2024-01-31'),
('UTILS', 'DAILY_INSPECTIONS', 'CP-100', 30, 30, 0, '2024-01-01', '2024-01-31'),
-- PLANNING department tasks
('PLANNING', 'CORRECTIVE_ACTIONS', NULL, 15, 12, 3, '2024-01-01', '2024-01-31');

-- =============================================================================
-- FINAL VERIFICATION
-- =============================================================================

SELECT 'Data loading complete!' as status;

-- Show what was loaded
SELECT 'Equipment count:' as metric, COUNT(*) as value 
FROM equipment 
WHERE equipment_id IN ('PU-200', 'PU-201', 'MO-200', 'MO-201', 'TK-200', 'TK-201', 'VL-200', 'VL-201', 'HX-200', 'HX-201', 'CP-100', 'CO-100')
UNION ALL
SELECT 'Instrumentation count:', COUNT(*) 
FROM instrumentation_equipment_mapping 
WHERE instrument_tag IN ('PI-200', 'LI-200', 'TI-400', 'TI-401', 'PI-500')
UNION ALL
SELECT 'Risk triggers count:', COUNT(*) 
FROM instrument_risk_triggers 
WHERE severity_level IN ('HIGH', 'CRITICAL', 'MEDIUM')
UNION ALL
SELECT 'Dependencies count:', COUNT(*) 
FROM equipment_dependencies 
WHERE impact_severity IN ('HIGH', 'CRITICAL', 'MEDIUM')
UNION ALL
SELECT 'Department tasks count:', COUNT(*) 
FROM department_task_status 
WHERE department_id IN ('PUMP-OPS', 'TANK-OPS', 'UTILS', 'PLANNING')
ORDER BY metric;

-- Note: Level-based triggers (HIGH_LEVEL, LOW_LEVEL) are not supported by the current 
-- deviation_type constraint. Only temperature, pressure, and flow deviations are allowed.
-- Level instruments (LI-200, LI-201) are still mapped but without automated risk triggers.

-- Test queries to verify cascade analysis works
SELECT 'Test: What happens if PI-200 shows high pressure?' as test_query;
SELECT 
    irt.instrument_tag,
    irt.deviation_type,
    irt.triggered_risk_scenario,
    irt.severity_level,
    iem.equipment_id,
    ed.downstream_equipment_id,
    ed.impact_severity
FROM instrument_risk_triggers irt
JOIN instrumentation_equipment_mapping iem ON irt.instrument_tag = iem.instrument_tag
LEFT JOIN equipment_dependencies ed ON iem.equipment_id = ed.upstream_equipment_id
WHERE irt.instrument_tag = 'PI-200' 
AND irt.deviation_type = 'HIGH_PRESSURE';

-- Additional test: TI-400 temperature deviation cascade
SELECT 'Test: What happens if TI-400 shows high temperature (fouling)?' as test_query;
SELECT 
    irt.instrument_tag,
    irt.deviation_type,
    irt.triggered_risk_scenario,
    irt.severity_level,
    iem.equipment_id,
    ed.downstream_equipment_id,
    ed.impact_severity
FROM instrument_risk_triggers irt
JOIN instrumentation_equipment_mapping iem ON irt.instrument_tag = iem.instrument_tag
LEFT JOIN equipment_dependencies ed ON iem.equipment_id = ed.upstream_equipment_id
WHERE irt.instrument_tag = 'TI-401' 
AND irt.deviation_type = 'HIGH_TEMPERATURE';