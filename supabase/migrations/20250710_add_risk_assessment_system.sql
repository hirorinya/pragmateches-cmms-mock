-- Create system grouping for equipment
CREATE TABLE equipment_systems (
    system_id VARCHAR(20) PRIMARY KEY,
    system_name VARCHAR(100) NOT NULL,
    system_type VARCHAR(50) NOT NULL, -- UNIT, AREA, PLANT
    parent_system_id VARCHAR(20) REFERENCES equipment_systems(system_id),
    description TEXT,
    criticality_level VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Link equipment to systems
CREATE TABLE equipment_system_mapping (
    equipment_id VARCHAR(10) REFERENCES equipment("設備ID"),
    system_id VARCHAR(20) REFERENCES equipment_systems(system_id),
    PRIMARY KEY (equipment_id, system_id),
    role_in_system VARCHAR(50), -- PRIMARY, BACKUP, SUPPORT
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Failure modes catalog (FMEA structure)
CREATE TABLE failure_modes (
    failure_mode_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_id VARCHAR(20) REFERENCES equipment_systems(system_id),
    equipment_id VARCHAR(10) REFERENCES equipment("設備ID"), -- Optional, can be system-level
    failure_mode VARCHAR(200) NOT NULL,
    failure_mechanism TEXT,
    failure_effect_local TEXT,
    failure_effect_system TEXT,
    failure_effect_plant TEXT,
    detection_method VARCHAR(200),
    current_controls TEXT,
    recommended_actions TEXT,
    
    -- RPN (Risk Priority Number) components
    severity_score INTEGER CHECK (severity_score BETWEEN 1 AND 10),
    occurrence_score INTEGER CHECK (occurrence_score BETWEEN 1 AND 10),
    detection_score INTEGER CHECK (detection_score BETWEEN 1 AND 10),
    rpn_score INTEGER GENERATED ALWAYS AS (severity_score * occurrence_score * detection_score) STORED,
    
    -- Additional risk factors
    safety_impact BOOLEAN DEFAULT false,
    environmental_impact BOOLEAN DEFAULT false,
    production_impact BOOLEAN DEFAULT false,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(10),
    updated_by VARCHAR(10)
);

-- Risk scenarios (higher-level than failure modes)
CREATE TABLE risk_scenarios (
    scenario_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_id VARCHAR(20) REFERENCES equipment_systems(system_id),
    scenario_name VARCHAR(200) NOT NULL,
    scenario_description TEXT,
    trigger_conditions TEXT,
    
    -- Risk matrix components
    likelihood_category VARCHAR(20) NOT NULL, -- RARE, UNLIKELY, POSSIBLE, LIKELY, ALMOST_CERTAIN
    likelihood_score INTEGER CHECK (likelihood_score BETWEEN 1 AND 5),
    consequence_category VARCHAR(20) NOT NULL, -- NEGLIGIBLE, MINOR, MODERATE, MAJOR, CATASTROPHIC
    consequence_score INTEGER CHECK (consequence_score BETWEEN 1 AND 5),
    risk_level VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN likelihood_score * consequence_score >= 20 THEN 'EXTREME'
            WHEN likelihood_score * consequence_score >= 12 THEN 'HIGH'
            WHEN likelihood_score * consequence_score >= 6 THEN 'MEDIUM'
            ELSE 'LOW'
        END
    ) STORED,
    
    -- Mitigation
    current_barriers TEXT[],
    mitigation_status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, PLANNED, IMPLEMENTED, MONITORING
    residual_risk_score INTEGER,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Link failure modes to risk scenarios
CREATE TABLE failure_mode_scenarios (
    failure_mode_id UUID REFERENCES failure_modes(failure_mode_id),
    scenario_id UUID REFERENCES risk_scenarios(scenario_id),
    contribution_factor DECIMAL(3,2) CHECK (contribution_factor BETWEEN 0 AND 1),
    PRIMARY KEY (failure_mode_id, scenario_id)
);

-- Risk reviews and assessments
CREATE TABLE risk_reviews (
    review_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_id VARCHAR(20) REFERENCES equipment_systems(system_id),
    review_type VARCHAR(50) NOT NULL, -- SCHEDULED, TRIGGERED, AD_HOC
    review_status VARCHAR(50) DEFAULT 'PLANNED', -- PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
    
    -- Review details
    review_date DATE NOT NULL,
    review_leader VARCHAR(10) REFERENCES staff_master("担当者ID"),
    review_team VARCHAR(10)[], -- Array of staff IDs
    
    -- Triggers (if applicable)
    triggered_by VARCHAR(50), -- PROCESS_CHANGE, INCIDENT, SCHEDULE, MANUAL
    trigger_reference VARCHAR(50), -- Reference to process event, incident, etc.
    
    -- Results
    findings TEXT,
    recommendations TEXT,
    action_items JSONB, -- Array of action items with assignees and due dates
    
    -- Approval workflow
    submitted_at TIMESTAMPTZ,
    submitted_by VARCHAR(10) REFERENCES staff_master("担当者ID"),
    reviewed_at TIMESTAMPTZ,
    reviewed_by VARCHAR(10) REFERENCES staff_master("担当者ID"),
    approved_at TIMESTAMPTZ,
    approved_by VARCHAR(10) REFERENCES staff_master("担当者ID"),
    approval_status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED
    approval_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Risk review failure mode assessments
CREATE TABLE review_failure_mode_assessments (
    assessment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID REFERENCES risk_reviews(review_id),
    failure_mode_id UUID REFERENCES failure_modes(failure_mode_id),
    
    -- Updated scores during review
    severity_score_new INTEGER CHECK (severity_score_new BETWEEN 1 AND 10),
    occurrence_score_new INTEGER CHECK (occurrence_score_new BETWEEN 1 AND 10),
    detection_score_new INTEGER CHECK (detection_score_new BETWEEN 1 AND 10),
    rpn_score_new INTEGER GENERATED ALWAYS AS (severity_score_new * occurrence_score_new * detection_score_new) STORED,
    
    -- Changes and justification
    score_changed BOOLEAN DEFAULT false,
    change_justification TEXT,
    
    -- Recommendations
    recommended_controls TEXT,
    recommended_es_changes JSONB, -- Links to equipment strategies
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Risk-based ES modifications
CREATE TABLE risk_es_recommendations (
    recommendation_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_type VARCHAR(50) NOT NULL, -- RISK_REVIEW, FAILURE_MODE, RISK_SCENARIO
    source_id UUID NOT NULL, -- ID of the source record
    strategy_id VARCHAR(10) REFERENCES equipment_strategy(strategy_id),
    
    -- Recommended changes
    recommendation_type VARCHAR(50), -- FREQUENCY_INCREASE, FREQUENCY_DECREASE, SCOPE_CHANGE, NEW_TASK
    current_frequency_type VARCHAR(20),
    current_frequency_value INTEGER,
    recommended_frequency_type VARCHAR(20),
    recommended_frequency_value INTEGER,
    
    -- Risk justification
    risk_level VARCHAR(20),
    rpn_score INTEGER,
    justification TEXT,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, IMPLEMENTED
    reviewed_at TIMESTAMPTZ,
    reviewed_by VARCHAR(10) REFERENCES staff_master("担当者ID"),
    implemented_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Process trigger to risk review mapping
CREATE TABLE process_risk_triggers (
    trigger_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    process_event_id BIGINT REFERENCES process_trigger_events(event_id),
    system_id VARCHAR(20) REFERENCES equipment_systems(system_id),
    
    -- Trigger configuration
    trigger_type VARCHAR(50), -- THRESHOLD_EXCEEDED, TREND_DETECTED, MULTIPLE_ALARMS
    severity_threshold VARCHAR(20), -- LOW, MEDIUM, HIGH, CRITICAL
    
    -- Action
    action_type VARCHAR(50), -- CREATE_REVIEW, UPDATE_RISK_SCORE, NOTIFY
    review_created_id UUID REFERENCES risk_reviews(review_id),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Risk history tracking
CREATE TABLE risk_score_history (
    history_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_type VARCHAR(50) NOT NULL, -- FAILURE_MODE, RISK_SCENARIO
    record_id UUID NOT NULL,
    
    -- Historical scores
    severity_score_old INTEGER,
    occurrence_score_old INTEGER,
    detection_score_old INTEGER,
    severity_score_new INTEGER,
    occurrence_score_new INTEGER,
    detection_score_new INTEGER,
    
    -- Change context
    change_reason VARCHAR(100),
    change_reference VARCHAR(50), -- Review ID, Process Event ID, etc.
    changed_by VARCHAR(10) REFERENCES staff_master("担当者ID"),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_failure_modes_system ON failure_modes(system_id);
CREATE INDEX idx_failure_modes_rpn ON failure_modes(rpn_score DESC);
CREATE INDEX idx_risk_scenarios_system ON risk_scenarios(system_id);
CREATE INDEX idx_risk_scenarios_level ON risk_scenarios(risk_level);
CREATE INDEX idx_risk_reviews_system ON risk_reviews(system_id);
CREATE INDEX idx_risk_reviews_status ON risk_reviews(review_status);
CREATE INDEX idx_risk_es_recommendations_strategy ON risk_es_recommendations(strategy_id);
CREATE INDEX idx_risk_es_recommendations_status ON risk_es_recommendations(status);

-- Create view for risk dashboard
CREATE VIEW risk_dashboard_view AS
SELECT 
    es.system_id,
    es.system_name,
    es.system_type,
    es.criticality_level,
    -- Failure mode statistics
    COUNT(DISTINCT fm.failure_mode_id) as failure_mode_count,
    AVG(fm.rpn_score) as avg_rpn_score,
    MAX(fm.rpn_score) as max_rpn_score,
    COUNT(DISTINCT fm.failure_mode_id) FILTER (WHERE fm.rpn_score > 100) as high_rpn_count,
    -- Risk scenario statistics
    COUNT(DISTINCT rs.scenario_id) as scenario_count,
    COUNT(DISTINCT rs.scenario_id) FILTER (WHERE rs.risk_level IN ('HIGH', 'EXTREME')) as high_risk_scenarios,
    -- Equipment count
    COUNT(DISTINCT esm.equipment_id) as equipment_count,
    -- Latest review
    MAX(rr.review_date) as last_review_date,
    COUNT(DISTINCT rr.review_id) FILTER (WHERE rr.review_status = 'PLANNED') as pending_reviews
FROM equipment_systems es
LEFT JOIN equipment_system_mapping esm ON es.system_id = esm.system_id
LEFT JOIN failure_modes fm ON es.system_id = fm.system_id AND fm.is_active = true
LEFT JOIN risk_scenarios rs ON es.system_id = rs.system_id AND rs.is_active = true
LEFT JOIN risk_reviews rr ON es.system_id = rr.system_id
WHERE es.is_active = true
GROUP BY es.system_id, es.system_name, es.system_type, es.criticality_level;

-- Create view for risk matrix data
CREATE VIEW risk_matrix_view AS
SELECT 
    rs.scenario_id,
    rs.scenario_name,
    rs.system_id,
    es.system_name,
    rs.likelihood_score,
    rs.consequence_score,
    rs.risk_level,
    rs.likelihood_category,
    rs.consequence_category,
    COUNT(DISTINCT fms.failure_mode_id) as related_failure_modes
FROM risk_scenarios rs
JOIN equipment_systems es ON rs.system_id = es.system_id
LEFT JOIN failure_mode_scenarios fms ON rs.scenario_id = fms.scenario_id
WHERE rs.is_active = true
GROUP BY rs.scenario_id, rs.scenario_name, rs.system_id, es.system_name, 
         rs.likelihood_score, rs.consequence_score, rs.risk_level,
         rs.likelihood_category, rs.consequence_category;

-- Enable Row Level Security
ALTER TABLE equipment_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE failure_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all authenticated users for now)
CREATE POLICY "Allow all operations on equipment_systems" ON equipment_systems
    FOR ALL USING (true) WITH CHECK (true);
    
CREATE POLICY "Allow all operations on failure_modes" ON failure_modes
    FOR ALL USING (true) WITH CHECK (true);
    
CREATE POLICY "Allow all operations on risk_scenarios" ON risk_scenarios
    FOR ALL USING (true) WITH CHECK (true);
    
CREATE POLICY "Allow all operations on risk_reviews" ON risk_reviews
    FOR ALL USING (true) WITH CHECK (true);