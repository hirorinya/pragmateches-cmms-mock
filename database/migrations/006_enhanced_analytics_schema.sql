-- Enhanced Analytics Schema for Complex Question Answering
-- Migration 006: Department Tasks, Instrumentation, Personnel, Dependencies

-- =============================================================================
-- 1. DEPARTMENT MANAGEMENT ENHANCEMENT
-- =============================================================================

-- Departments hierarchy table
CREATE TABLE IF NOT EXISTS departments (
    department_id VARCHAR(10) PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    parent_department_id VARCHAR(10) REFERENCES departments(department_id),
    department_type VARCHAR(30) CHECK (department_type IN ('OPERATIONS', 'MAINTENANCE', 'ENGINEERING', 'SAFETY')),
    manager_id VARCHAR(10), -- References staff_master but using VARCHAR for Japanese compatibility
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Department task implementation tracking
CREATE TABLE IF NOT EXISTS department_task_status (
    status_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id VARCHAR(10) REFERENCES departments(department_id),
    task_category VARCHAR(50) CHECK (task_category IN ('PREVENTIVE_MAINTENANCE', 'DAILY_INSPECTIONS', 'CORRECTIVE_ACTIONS', 'SAFETY_CHECKS')),
    equipment_id VARCHAR(10), -- Links to specific equipment
    planned_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    overdue_tasks INTEGER DEFAULT 0,
    implementation_rate DECIMAL(5,2) GENERATED ALWAYS AS 
        (CASE WHEN planned_tasks > 0 THEN (completed_tasks::DECIMAL / planned_tasks) * 100 ELSE 0 END) STORED,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 2. ENHANCED INSTRUMENTATION MAPPING
-- =============================================================================

-- Instrumentation to equipment mapping
CREATE TABLE IF NOT EXISTS instrumentation_equipment_mapping (
    mapping_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instrument_tag VARCHAR(50) NOT NULL, -- TI-201, PI-102, FI-301, etc.
    equipment_id VARCHAR(10), -- References equipment table
    measurement_type VARCHAR(30) CHECK (measurement_type IN ('TEMPERATURE', 'PRESSURE', 'FLOW', 'LEVEL', 'VIBRATION')),
    measurement_location VARCHAR(100), -- 'INLET', 'OUTLET', 'SHELL_SIDE', 'TUBE_SIDE'
    critical_for_operation BOOLEAN DEFAULT false,
    alarm_configured BOOLEAN DEFAULT false,
    normal_min DECIMAL(10,2),
    normal_max DECIMAL(10,2),
    critical_min DECIMAL(10,2),
    critical_max DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Link instrument deviations to risk scenarios
CREATE TABLE IF NOT EXISTS instrument_risk_triggers (
    trigger_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instrument_tag VARCHAR(50) NOT NULL,
    deviation_type VARCHAR(30) CHECK (deviation_type IN ('HIGH_TEMPERATURE', 'LOW_TEMPERATURE', 'HIGH_PRESSURE', 'LOW_PRESSURE', 'HIGH_FLOW', 'LOW_FLOW')),
    triggered_risk_scenario VARCHAR(100), -- Risk scenario name or description
    threshold_value DECIMAL(10,2),
    severity_level VARCHAR(20) CHECK (severity_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    response_time_minutes INTEGER, -- How quickly response is needed
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 3. PERSONNEL ASSIGNMENT AND RESPONSIBILITY TRACKING
-- =============================================================================

-- Role-based personnel assignments
CREATE TABLE IF NOT EXISTS personnel_assignments (
    assignment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id VARCHAR(10), -- References staff_master table
    assignment_type VARCHAR(30) CHECK (assignment_type IN ('EQUIPMENT_OWNER', 'BACKUP_OPERATOR', 'MAINTENANCE_LEAD', 'SAFETY_OFFICER')),
    equipment_id VARCHAR(10), -- References equipment table
    system_id VARCHAR(20), -- References system
    responsibility_level VARCHAR(20) CHECK (responsibility_level IN ('PRIMARY', 'SECONDARY', 'BACKUP')),
    assignment_start DATE NOT NULL,
    assignment_end DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Personnel skills and competencies
CREATE TABLE IF NOT EXISTS personnel_skills (
    skill_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id VARCHAR(10), -- References staff_master
    skill_category VARCHAR(50) CHECK (skill_category IN ('MECHANICAL', 'ELECTRICAL', 'INSTRUMENTATION', 'PROCESS', 'SAFETY')),
    skill_level VARCHAR(20) CHECK (skill_level IN ('BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
    certification_required BOOLEAN DEFAULT false,
    certification_expiry DATE,
    verified_by VARCHAR(10), -- References staff_master
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 4. EQUIPMENT DEPENDENCIES FOR CASCADE ANALYSIS
-- =============================================================================

-- Equipment dependencies and relationships
CREATE TABLE IF NOT EXISTS equipment_dependencies (
    dependency_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    upstream_equipment_id VARCHAR(10), -- References equipment table
    downstream_equipment_id VARCHAR(10), -- References equipment table
    dependency_type VARCHAR(30) CHECK (dependency_type IN ('PROCESS_FLOW', 'UTILITY_SUPPLY', 'CONTROL_SIGNAL', 'SAFETY_INTERLOCK')),
    impact_severity VARCHAR(20) CHECK (impact_severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    time_to_impact_minutes INTEGER, -- How long before downstream impact occurs
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- System-level impact analysis
CREATE TABLE IF NOT EXISTS system_impact_analysis (
    analysis_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_system_id VARCHAR(20),
    affected_system_id VARCHAR(20),
    impact_type VARCHAR(30) CHECK (impact_type IN ('PRODUCTION_LOSS', 'SAFETY_RISK', 'ENVIRONMENTAL_IMPACT', 'QUALITY_IMPACT')),
    estimated_impact_duration_hours DECIMAL(6,2),
    estimated_financial_impact DECIMAL(12,2),
    probability_score INTEGER CHECK (probability_score BETWEEN 1 AND 5),
    mitigation_measures TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 5. ENHANCED VIEWS FOR COMPLEX QUERIES
-- =============================================================================

-- Department performance dashboard view
CREATE OR REPLACE VIEW department_performance_view AS
SELECT 
    d.department_id,
    d.department_name,
    d.department_type,
    dts.task_category,
    dts.equipment_id,
    dts.planned_tasks,
    dts.completed_tasks,
    dts.overdue_tasks,
    dts.implementation_rate,
    dts.period_start,
    dts.period_end,
    COUNT(DISTINCT pa.staff_id) as assigned_personnel,
    COUNT(DISTINCT pa.equipment_id) as managed_equipment
FROM departments d
LEFT JOIN department_task_status dts ON d.department_id = dts.department_id
LEFT JOIN personnel_assignments pa ON d.department_id = pa.system_id
WHERE d.is_active = true AND (pa.is_active = true OR pa.is_active IS NULL)
GROUP BY d.department_id, d.department_name, d.department_type,
         dts.task_category, dts.equipment_id, dts.planned_tasks, 
         dts.completed_tasks, dts.overdue_tasks, dts.implementation_rate,
         dts.period_start, dts.period_end;

-- Instrumentation monitoring view
CREATE OR REPLACE VIEW instrumentation_status_view AS
SELECT 
    iem.instrument_tag,
    iem.equipment_id,
    iem.measurement_type,
    iem.measurement_location,
    iem.critical_for_operation,
    iem.alarm_configured,
    iem.normal_min,
    iem.normal_max,
    iem.critical_min,
    iem.critical_max,
    irt.deviation_type,
    irt.triggered_risk_scenario,
    irt.severity_level,
    irt.response_time_minutes
FROM instrumentation_equipment_mapping iem
LEFT JOIN instrument_risk_triggers irt ON iem.instrument_tag = irt.instrument_tag;

-- Personnel responsibility view
CREATE OR REPLACE VIEW personnel_responsibility_view AS
SELECT 
    pa.equipment_id,
    pa.staff_id,
    pa.assignment_type,
    pa.responsibility_level,
    ps.skill_category,
    ps.skill_level,
    pa.is_active as assignment_active,
    CASE 
        WHEN ps.certification_expiry IS NULL THEN 'NO_CERT_REQUIRED'
        WHEN ps.certification_expiry > CURRENT_DATE THEN 'CERTIFIED'
        ELSE 'EXPIRED'
    END as certification_status
FROM personnel_assignments pa
LEFT JOIN personnel_skills ps ON pa.staff_id = ps.staff_id
WHERE pa.is_active = true;

-- Equipment cascade impact view
CREATE OR REPLACE VIEW equipment_cascade_view AS
SELECT 
    ed.upstream_equipment_id,
    ed.downstream_equipment_id,
    ed.dependency_type,
    ed.impact_severity,
    ed.time_to_impact_minutes,
    ed.description,
    sia.impact_type,
    sia.estimated_impact_duration_hours,
    sia.estimated_financial_impact
FROM equipment_dependencies ed
LEFT JOIN system_impact_analysis sia ON ed.upstream_equipment_id = sia.source_system_id
WHERE ed.is_active = true;

-- =============================================================================
-- 6. INDEXES FOR PERFORMANCE
-- =============================================================================

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dept_task_status_dept_id ON department_task_status(department_id);
CREATE INDEX IF NOT EXISTS idx_dept_task_status_equipment ON department_task_status(equipment_id);
CREATE INDEX IF NOT EXISTS idx_instrument_mapping_tag ON instrumentation_equipment_mapping(instrument_tag);
CREATE INDEX IF NOT EXISTS idx_instrument_mapping_equipment ON instrumentation_equipment_mapping(equipment_id);
CREATE INDEX IF NOT EXISTS idx_personnel_assign_staff ON personnel_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_personnel_assign_equipment ON personnel_assignments(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_deps_upstream ON equipment_dependencies(upstream_equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_deps_downstream ON equipment_dependencies(downstream_equipment_id);

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================