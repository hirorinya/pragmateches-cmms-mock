-- ============================================
-- Process Trigger and ES Change Detection System
-- ============================================

-- 1. Process Parameters Master Table (define all monitored parameters)
CREATE TABLE process_parameters (
    parameter_id VARCHAR(20) PRIMARY KEY,
    parameter_name VARCHAR(100) NOT NULL,
    parameter_type VARCHAR(30) NOT NULL, -- 'TEMPERATURE', 'PRESSURE', 'FLOW', 'LEVEL', 'VIBRATION'
    unit VARCHAR(20) NOT NULL, -- '°C', 'MPa', 'm3/h', 'm', 'mm/s'
    equipment_id VARCHAR(10) NOT NULL REFERENCES equipment("設備ID"),
    tag_name VARCHAR(50) NOT NULL, -- DCS tag name (e.g., TI-101, PI-102)
    normal_min DECIMAL(10,2), -- Normal operating range
    normal_max DECIMAL(10,2),
    critical_min DECIMAL(10,2), -- Critical limits
    critical_max DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Real-time Process Data Table
CREATE TABLE process_data (
    data_id SERIAL PRIMARY KEY,
    parameter_id VARCHAR(20) NOT NULL REFERENCES process_parameters(parameter_id),
    timestamp TIMESTAMP NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    quality VARCHAR(10) DEFAULT 'GOOD', -- 'GOOD', 'BAD', 'UNCERTAIN'
    source VARCHAR(30) DEFAULT 'DCS', -- 'DCS', 'MANUAL', 'ESTIMATED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Process Trigger Rules Table
CREATE TABLE process_trigger_rules (
    rule_id VARCHAR(20) PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    parameter_id VARCHAR(20) NOT NULL REFERENCES process_parameters(parameter_id),
    trigger_type VARCHAR(30) NOT NULL, -- 'DEVIATION', 'TREND', 'LIMIT_EXCEEDED', 'SETPOINT_CHANGE'
    condition_type VARCHAR(20) NOT NULL, -- 'GREATER_THAN', 'LESS_THAN', 'CHANGE_PERCENT', 'OUTSIDE_RANGE'
    threshold_value DECIMAL(10,2),
    threshold_percent DECIMAL(5,2), -- For percentage-based triggers
    evaluation_window_minutes INTEGER DEFAULT 60, -- Time window for evaluation
    min_duration_minutes INTEGER DEFAULT 10, -- Minimum duration before triggering
    severity VARCHAR(10) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Equipment Strategy Process Mapping Table
CREATE TABLE es_process_mapping (
    mapping_id SERIAL PRIMARY KEY,
    strategy_id VARCHAR(10) NOT NULL REFERENCES equipment_strategy(strategy_id),
    rule_id VARCHAR(20) NOT NULL REFERENCES process_trigger_rules(rule_id),
    impact_type VARCHAR(30) NOT NULL, -- 'FREQUENCY_CHANGE', 'SCOPE_CHANGE', 'PRIORITY_CHANGE', 'NEW_REQUIREMENT'
    impact_description TEXT,
    recommended_action VARCHAR(50), -- 'INCREASE_FREQUENCY', 'DECREASE_FREQUENCY', 'ADD_INSPECTION', 'CHANGE_PRIORITY'
    auto_apply BOOLEAN DEFAULT false, -- Whether to automatically apply changes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Process Trigger Events Table (audit trail)
CREATE TABLE process_trigger_events (
    event_id SERIAL PRIMARY KEY,
    rule_id VARCHAR(20) NOT NULL REFERENCES process_trigger_rules(rule_id),
    triggered_at TIMESTAMP NOT NULL,
    trigger_value DECIMAL(10,2) NOT NULL,
    baseline_value DECIMAL(10,2),
    deviation_percent DECIMAL(5,2),
    duration_minutes INTEGER,
    severity VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_ALARM'
    acknowledged_by VARCHAR(10) REFERENCES staff_master("担当者ID"),
    acknowledged_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. ES Change Notifications Table
CREATE TABLE es_change_notifications (
    notification_id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES process_trigger_events(event_id),
    strategy_id VARCHAR(10) NOT NULL REFERENCES equipment_strategy(strategy_id),
    notification_type VARCHAR(30) NOT NULL, -- 'ES_REVIEW_REQUIRED', 'AUTO_UPDATE_APPLIED', 'FREQUENCY_CHANGE'
    current_frequency_type VARCHAR(20),
    current_frequency_value INTEGER,
    recommended_frequency_type VARCHAR(20),
    recommended_frequency_value INTEGER,
    impact_description TEXT,
    priority VARCHAR(10) DEFAULT 'MEDIUM',
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'REVIEWED', 'APPLIED', 'REJECTED'
    assigned_to VARCHAR(10) REFERENCES staff_master("担当者ID"),
    reviewed_by VARCHAR(10) REFERENCES staff_master("担当者ID"),
    reviewed_at TIMESTAMP,
    applied_at TIMESTAMP,
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Process Baseline Values Table (for trend analysis)
CREATE TABLE process_baselines (
    baseline_id SERIAL PRIMARY KEY,
    parameter_id VARCHAR(20) NOT NULL REFERENCES process_parameters(parameter_id),
    baseline_type VARCHAR(20) NOT NULL, -- 'DAILY', 'WEEKLY', 'MONTHLY', 'DESIGN'
    baseline_value DECIMAL(10,2) NOT NULL,
    confidence_interval DECIMAL(5,2), -- ±% confidence
    valid_from DATE NOT NULL,
    valid_to DATE,
    calculated_from INTEGER, -- Number of data points used
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Indexes for performance
CREATE INDEX idx_process_data_parameter_timestamp ON process_data(parameter_id, timestamp DESC);
CREATE INDEX idx_process_data_timestamp ON process_data(timestamp DESC);
CREATE INDEX idx_process_trigger_events_rule ON process_trigger_events(rule_id);
CREATE INDEX idx_process_trigger_events_status ON process_trigger_events(status);
CREATE INDEX idx_process_trigger_events_triggered_at ON process_trigger_events(triggered_at DESC);
CREATE INDEX idx_es_notifications_strategy ON es_change_notifications(strategy_id);
CREATE INDEX idx_es_notifications_status ON es_change_notifications(status);
CREATE INDEX idx_process_parameters_equipment ON process_parameters(equipment_id);
CREATE INDEX idx_process_baselines_parameter ON process_baselines(parameter_id, valid_from);

-- 9. RLS and Policies
ALTER TABLE process_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_trigger_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE es_process_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_trigger_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE es_change_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON process_parameters FOR ALL USING (true);
CREATE POLICY "Allow all access" ON process_data FOR ALL USING (true);
CREATE POLICY "Allow all access" ON process_trigger_rules FOR ALL USING (true);
CREATE POLICY "Allow all access" ON es_process_mapping FOR ALL USING (true);
CREATE POLICY "Allow all access" ON process_trigger_events FOR ALL USING (true);
CREATE POLICY "Allow all access" ON es_change_notifications FOR ALL USING (true);
CREATE POLICY "Allow all access" ON process_baselines FOR ALL USING (true);

-- 10. View for active process monitoring
CREATE VIEW process_monitoring_dashboard AS
SELECT 
    pp.parameter_id,
    pp.parameter_name,
    pp.tag_name,
    e."設備名" as equipment_name,
    e."設備タグ" as equipment_tag,
    pp.parameter_type,
    pp.unit,
    pp.normal_min,
    pp.normal_max,
    pp.critical_min,
    pp.critical_max,
    pd.value as current_value,
    pd.timestamp as last_update,
    pd.quality,
    CASE 
        WHEN pd.value < pp.critical_min OR pd.value > pp.critical_max THEN 'CRITICAL'
        WHEN pd.value < pp.normal_min OR pd.value > pp.normal_max THEN 'WARNING'
        ELSE 'NORMAL'
    END as status,
    COUNT(pte.event_id) as active_triggers
FROM process_parameters pp
LEFT JOIN equipment e ON pp.equipment_id = e."設備ID"
LEFT JOIN LATERAL (
    SELECT * FROM process_data 
    WHERE parameter_id = pp.parameter_id 
    ORDER BY timestamp DESC 
    LIMIT 1
) pd ON true
LEFT JOIN process_trigger_rules ptr ON pp.parameter_id = ptr.parameter_id AND ptr.is_active = true
LEFT JOIN process_trigger_events pte ON ptr.rule_id = pte.rule_id AND pte.status = 'ACTIVE'
WHERE pp.is_active = true
GROUP BY pp.parameter_id, pp.parameter_name, pp.tag_name, e."設備名", e."設備タグ",
         pp.parameter_type, pp.unit, pp.normal_min, pp.normal_max, 
         pp.critical_min, pp.critical_max, pd.value, pd.timestamp, pd.quality;

-- 11. Functions for trigger evaluation
CREATE OR REPLACE FUNCTION evaluate_process_triggers()
RETURNS TABLE(
    rule_id VARCHAR(20),
    triggered BOOLEAN,
    current_value DECIMAL(10,2),
    baseline_value DECIMAL(10,2),
    deviation_percent DECIMAL(5,2)
) AS $$
BEGIN
    -- This function will be implemented in the service layer
    -- Return empty result for now
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- 12. Function to calculate process baselines
CREATE OR REPLACE FUNCTION calculate_process_baseline(
    param_id VARCHAR(20),
    baseline_type VARCHAR(20),
    from_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days'
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    baseline_val DECIMAL(10,2);
BEGIN
    SELECT AVG(value) INTO baseline_val
    FROM process_data pd
    WHERE pd.parameter_id = param_id
    AND pd.timestamp >= from_date
    AND pd.quality = 'GOOD';
    
    RETURN COALESCE(baseline_val, 0);
END;
$$ LANGUAGE plpgsql;