-- Sample Data for Enhanced Analytics Schema
-- Provides realistic test data for complex question answering

-- =============================================================================
-- 1. DEPARTMENTS DATA
-- =============================================================================

INSERT INTO departments (department_id, department_name, department_type, manager_id, is_active) VALUES
('REFINING', 'Refining Department', 'OPERATIONS', 'STAFF001', true),
('MAINT', 'Maintenance Department', 'MAINTENANCE', 'STAFF002', true),
('SAFETY', 'Safety Department', 'SAFETY', 'STAFF003', true),
('ENG', 'Engineering Department', 'ENGINEERING', 'STAFF004', true),
('REFINING-1', 'Refining Unit 1', 'OPERATIONS', 'STAFF005', true),
('REFINING-2', 'Refining Unit 2', 'OPERATIONS', 'STAFF006', true);

-- Update parent relationships
UPDATE departments SET parent_department_id = 'REFINING' WHERE department_id IN ('REFINING-1', 'REFINING-2');

-- =============================================================================
-- 2. DEPARTMENT TASK STATUS DATA
-- =============================================================================

-- Refining Department task status for various equipment
INSERT INTO department_task_status (department_id, task_category, equipment_id, planned_tasks, completed_tasks, overdue_tasks, period_start, period_end) VALUES
-- HX-101 (Heat Exchanger) tasks
('REFINING', 'DAILY_INSPECTIONS', 'HX-101', 30, 28, 2, '2024-01-01', '2024-01-31'),
('REFINING', 'PREVENTIVE_MAINTENANCE', 'HX-101', 4, 3, 1, '2024-01-01', '2024-01-31'),
-- E-101 (Heat Exchanger) tasks
('REFINING', 'DAILY_INSPECTIONS', 'E-101', 30, 25, 5, '2024-01-01', '2024-01-31'),
('REFINING', 'PREVENTIVE_MAINTENANCE', 'E-101', 2, 2, 0, '2024-01-01', '2024-01-31'),
('REFINING', 'SAFETY_CHECKS', 'E-101', 12, 10, 2, '2024-01-01', '2024-01-31'),
-- System-wide maintenance tasks
('MAINT', 'PREVENTIVE_MAINTENANCE', 'P-101', 8, 6, 2, '2024-01-01', '2024-01-31'),
('MAINT', 'CORRECTIVE_ACTIONS', 'T-201', 3, 3, 0, '2024-01-01', '2024-01-31');

-- =============================================================================
-- 3. INSTRUMENTATION EQUIPMENT MAPPING
-- =============================================================================

-- Map instruments to equipment with operational parameters
INSERT INTO instrumentation_equipment_mapping (instrument_tag, equipment_id, measurement_type, measurement_location, critical_for_operation, alarm_configured, normal_min, normal_max, critical_min, critical_max) VALUES
-- Temperature indicators
('TI-201', 'HX-101', 'TEMPERATURE', 'OUTLET', true, true, 80.0, 120.0, 60.0, 140.0),
('TI-202', 'HX-101', 'TEMPERATURE', 'INLET', true, true, 60.0, 90.0, 40.0, 110.0),
('TI-101', 'E-101', 'TEMPERATURE', 'SHELL_SIDE', true, true, 85.0, 125.0, 65.0, 145.0),
('TI-102', 'E-101', 'TEMPERATURE', 'TUBE_SIDE', true, true, 40.0, 80.0, 20.0, 100.0),
-- Pressure indicators
('PI-101', 'P-101', 'PRESSURE', 'DISCHARGE', true, true, 8.0, 12.0, 6.0, 15.0),
('PI-102', 'P-101', 'PRESSURE', 'SUCTION', true, true, 2.0, 4.0, 1.0, 6.0),
('PI-201', 'HX-101', 'PRESSURE', 'SHELL_SIDE', false, true, 5.0, 8.0, 3.0, 10.0),
-- Flow indicators
('FI-301', 'T-201', 'FLOW', 'OUTLET', true, true, 100.0, 500.0, 50.0, 600.0),
('FI-302', 'HX-101', 'FLOW', 'INLET', true, true, 200.0, 800.0, 100.0, 1000.0);

-- =============================================================================
-- 4. INSTRUMENT RISK TRIGGERS
-- =============================================================================

-- Define what happens when instruments exceed thresholds
INSERT INTO instrument_risk_triggers (instrument_tag, deviation_type, triggered_risk_scenario, threshold_value, severity_level, response_time_minutes) VALUES
-- TI-201 (HX-101 outlet temperature) triggers
('TI-201', 'HIGH_TEMPERATURE', 'ファウリング', 130.0, 'HIGH', 15),
('TI-201', 'HIGH_TEMPERATURE', 'チューブ詰まり', 135.0, 'CRITICAL', 5),
('TI-201', 'LOW_TEMPERATURE', '流量不足', 70.0, 'MEDIUM', 30),
-- TI-101 (E-101 shell side temperature) triggers  
('TI-101', 'HIGH_TEMPERATURE', '過熱', 135.0, 'CRITICAL', 10),
('TI-101', 'HIGH_TEMPERATURE', 'ファウリング', 130.0, 'HIGH', 20),
-- PI-101 (P-101 discharge pressure) triggers
('PI-101', 'HIGH_PRESSURE', 'ポンプ過負荷', 14.0, 'HIGH', 10),
('PI-101', 'LOW_PRESSURE', 'ポンプ故障', 7.0, 'HIGH', 5),
-- FI-301 (T-201 outlet flow) triggers
('FI-301', 'LOW_FLOW', '配管詰まり', 80.0, 'MEDIUM', 20),
('FI-301', 'HIGH_FLOW', 'バルブ故障', 550.0, 'HIGH', 15);

-- =============================================================================
-- 5. PERSONNEL ASSIGNMENTS
-- =============================================================================

-- Assign personnel to equipment with specific roles
INSERT INTO personnel_assignments (staff_id, assignment_type, equipment_id, system_id, responsibility_level, assignment_start, is_active) VALUES
-- Heat Exchanger HX-101 assignments
('STAFF001', 'EQUIPMENT_OWNER', 'HX-101', 'SYS-001', 'PRIMARY', '2024-01-01', true),
('STAFF005', 'BACKUP_OPERATOR', 'HX-101', 'SYS-001', 'SECONDARY', '2024-01-01', true),
('STAFF002', 'MAINTENANCE_LEAD', 'HX-101', 'SYS-001', 'PRIMARY', '2024-01-01', true),
-- Heat Exchanger E-101 assignments  
('STAFF006', 'EQUIPMENT_OWNER', 'E-101', 'SYS-001', 'PRIMARY', '2024-01-01', true),
('STAFF001', 'BACKUP_OPERATOR', 'E-101', 'SYS-001', 'SECONDARY', '2024-01-01', true),
('STAFF002', 'MAINTENANCE_LEAD', 'E-101', 'SYS-001', 'PRIMARY', '2024-01-01', true),
-- Pump P-101 assignments
('STAFF003', 'EQUIPMENT_OWNER', 'P-101', 'SYS-002', 'PRIMARY', '2024-01-01', true),
('STAFF002', 'MAINTENANCE_LEAD', 'P-101', 'SYS-002', 'PRIMARY', '2024-01-01', true),
-- Tank T-201 assignments
('STAFF004', 'EQUIPMENT_OWNER', 'T-201', 'SYS-003', 'PRIMARY', '2024-01-01', true),
('STAFF003', 'SAFETY_OFFICER', 'T-201', 'SYS-003', 'PRIMARY', '2024-01-01', true);

-- =============================================================================
-- 6. PERSONNEL SKILLS
-- =============================================================================

-- Define personnel competencies and certifications
INSERT INTO personnel_skills (staff_id, skill_category, skill_level, certification_required, certification_expiry, verified_by, verified_at) VALUES
-- STAFF001 (Refining Dept Manager) skills
('STAFF001', 'PROCESS', 'EXPERT', true, '2024-12-31', 'STAFF004', '2024-01-15'),
('STAFF001', 'MECHANICAL', 'ADVANCED', false, NULL, 'STAFF002', '2024-01-15'),
('STAFF001', 'SAFETY', 'ADVANCED', true, '2024-12-31', 'STAFF003', '2024-01-15'),
-- STAFF002 (Maintenance Lead) skills
('STAFF002', 'MECHANICAL', 'EXPERT', true, '2024-12-31', 'STAFF004', '2024-01-15'),
('STAFF002', 'ELECTRICAL', 'ADVANCED', true, '2024-12-31', 'STAFF004', '2024-01-15'),
('STAFF002', 'INSTRUMENTATION', 'INTERMEDIATE', false, NULL, 'STAFF004', '2024-01-15'),
-- STAFF003 (Safety Officer) skills
('STAFF003', 'SAFETY', 'EXPERT', true, '2024-12-31', 'STAFF004', '2024-01-15'),
('STAFF003', 'PROCESS', 'INTERMEDIATE', false, NULL, 'STAFF001', '2024-01-15'),
-- STAFF005 (Unit 1 Operator) skills
('STAFF005', 'PROCESS', 'INTERMEDIATE', true, '2024-06-30', 'STAFF001', '2024-01-15'),
('STAFF005', 'MECHANICAL', 'BASIC', false, NULL, 'STAFF002', '2024-01-15'),
-- STAFF006 (Unit 2 Operator) skills
('STAFF006', 'PROCESS', 'INTERMEDIATE', true, '2024-06-30', 'STAFF001', '2024-01-15'),
('STAFF006', 'INSTRUMENTATION', 'BASIC', false, NULL, 'STAFF004', '2024-01-15');

-- =============================================================================
-- 7. EQUIPMENT DEPENDENCIES
-- =============================================================================

-- Define equipment relationships for cascade analysis
INSERT INTO equipment_dependencies (upstream_equipment_id, downstream_equipment_id, dependency_type, impact_severity, time_to_impact_minutes, description) VALUES
-- Pump P-101 feeds Heat Exchanger HX-101
('P-101', 'HX-101', 'PROCESS_FLOW', 'HIGH', 5, 'P-101 provides feed flow to HX-101. Pump failure causes immediate flow loss to heat exchanger.'),
-- Heat Exchanger HX-101 feeds Tank T-201
('HX-101', 'T-201', 'PROCESS_FLOW', 'MEDIUM', 15, 'HX-101 outlet feeds T-201. Heat exchanger failure affects tank level and temperature.'),
-- TI-201 controls HX-101 operation
('TI-201', 'HX-101', 'CONTROL_SIGNAL', 'HIGH', 2, 'TI-201 temperature reading controls HX-101 bypass valve. Instrument failure affects temperature control.'),
-- Heat Exchanger E-101 parallel to HX-101
('E-101', 'HX-101', 'PROCESS_FLOW', 'MEDIUM', 10, 'E-101 and HX-101 operate in parallel. E-101 failure increases load on HX-101.'),
-- Utility dependencies
('P-101', 'E-101', 'UTILITY_SUPPLY', 'MEDIUM', 20, 'P-101 provides cooling water to E-101. Pump failure affects cooling capacity.'),
-- Safety interlocks
('TI-201', 'P-101', 'SAFETY_INTERLOCK', 'CRITICAL', 1, 'High temperature on TI-201 triggers P-101 emergency shutdown for safety.');

-- =============================================================================
-- 8. SYSTEM IMPACT ANALYSIS
-- =============================================================================

-- Define system-level impact scenarios
INSERT INTO system_impact_analysis (source_system_id, affected_system_id, impact_type, estimated_impact_duration_hours, estimated_financial_impact, probability_score, mitigation_measures) VALUES
-- SYS-001 failures affecting other systems
('SYS-001', 'SYS-002', 'PRODUCTION_LOSS', 4.0, 50000.00, 3, ARRAY['Switch to backup heat exchanger', 'Reduce production rate', 'Activate emergency cooling']),
('SYS-001', 'SYS-003', 'QUALITY_IMPACT', 2.0, 15000.00, 2, ARRAY['Monitor product temperature closely', 'Adjust feed rate', 'Implement quality checks']),
-- SYS-002 failures (pump system)
('SYS-002', 'SYS-001', 'PRODUCTION_LOSS', 6.0, 75000.00, 4, ARRAY['Start backup pump', 'Reduce system pressure', 'Emergency shutdown if needed']),
('SYS-002', 'SYS-003', 'SAFETY_RISK', 1.0, 100000.00, 2, ARRAY['Activate safety systems', 'Isolate affected equipment', 'Emergency response team']);

-- =============================================================================
-- DATA INSERTION COMPLETE
-- =============================================================================