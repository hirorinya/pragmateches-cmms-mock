-- Fix Missing Equipment Strategies for SYS-002 through SYS-005
-- These strategies were referenced in the comprehensive test data but not actually inserted

-- =============================================================================
-- ADD MISSING EQUIPMENT STRATEGIES
-- =============================================================================

-- First check what strategies exist
SELECT 'Current strategies:' as info, equipment_id, strategy_type 
FROM equipment_strategy 
WHERE equipment_id IN ('PU-200', 'PU-201', 'MO-200', 'TK-200', 'TK-201', 'HX-200', 'CP-100');

-- Add comprehensive maintenance strategies for new equipment
INSERT INTO equipment_strategy (equipment_id, strategy_type, strategy_name, frequency_days, last_performed, next_scheduled, estimated_hours, required_skills, strategy_details) VALUES

-- SYS-002 Pump System Strategies
('PU-200', 'PREVENTIVE', 'Pump PM Level 1', 30, '2024-01-15', '2024-02-15', 4.0, 'MECHANICAL', 'Vibration check, lubrication, seal inspection, performance test'),
('PU-200', 'PREDICTIVE', 'Vibration Analysis', 90, '2023-12-01', '2024-03-01', 2.0, 'INSTRUMENTATION', 'Detailed vibration spectrum analysis and bearing condition assessment'),
('PU-201', 'PREVENTIVE', 'Backup Pump Testing', 30, '2024-01-10', '2024-02-10', 3.0, 'MECHANICAL', 'Backup pump functional testing, seal and bearing inspection'),
('MO-200', 'PREVENTIVE', 'Motor Maintenance', 180, '2023-10-01', '2024-04-01', 6.0, 'ELECTRICAL', 'Motor winding test, bearing lubrication, temperature monitoring calibration'),

-- SYS-003 Storage System Strategies  
('TK-200', 'INSPECTION', 'Tank Thickness Testing', 365, '2023-06-01', '2024-06-01', 8.0, 'INSTRUMENTATION', 'Ultrasonic thickness measurement at critical points, corrosion assessment'),
('TK-200', 'PREVENTIVE', 'Tank PM Level 2', 180, '2023-10-01', '2024-04-01', 6.0, 'MECHANICAL', 'Valve testing, gasket inspection, pressure relief system test'),
('TK-201', 'INSPECTION', 'Tank Visual Inspection', 90, '2024-01-01', '2024-04-01', 2.0, 'PROCESS', 'External visual inspection, safety system check, level instrument calibration'),

-- SYS-004 Heat Exchange System Strategies
('HX-200', 'PREVENTIVE', 'HX Cleaning & Service', 180, '2023-09-01', '2024-03-01', 12.0, 'MECHANICAL', 'Tube bundle cleaning, fouling removal, thermal efficiency test, gasket replacement'),
('HX-200', 'PREDICTIVE', 'Performance Monitoring', 30, '2024-01-20', '2024-02-20', 1.0, 'PROCESS', 'Heat transfer efficiency calculation, temperature differential analysis'),

-- SYS-005 Utility System Strategies
('CP-100', 'PREVENTIVE', 'Compressor Major Service', 90, '2023-12-15', '2024-03-15', 8.0, 'MECHANICAL', 'Valve inspection, oil change, filter replacement, pressure vessel inspection');

-- =============================================================================
-- ADD RISK ASSESSMENTS FOR EQUIPMENT WITH FOULING RISKS
-- =============================================================================

-- Add fouling-specific risk assessments to enable fouling strategy testing
INSERT INTO equipment_risk_assessment (equipment_id, risk_scenario, risk_level, risk_score, impact_rank, reliability_rank, likelihood_score, consequence_score, risk_factors, mitigation_measures) VALUES

-- Heat exchanger fouling risks
('HX-200', 'ファウリング', 'HIGH', 78, 4, 3, 4, 3, 'Process fluid characteristics, high temperature operation, fouling deposits', 'Regular cleaning schedule, chemical treatment, performance monitoring'),
('HX-200', 'Tube blockage fouling', 'HIGH', 75, 3, 4, 3, 4, 'Fouling buildup, reduced flow, heat transfer degradation', 'Tube cleaning, flow monitoring, pressure differential tracking'),

-- Pump fouling/clogging risks  
('PU-200', 'Impeller fouling', 'MEDIUM', 65, 3, 3, 3, 3, 'Process fluid contaminants, fouling deposits on impeller', 'Regular impeller inspection, strainer maintenance'),

-- Tank fouling risks
('TK-200', 'Internal fouling', 'MEDIUM', 60, 2, 3, 2, 3, 'Product degradation, wall fouling, sediment buildup', 'Tank cleaning schedule, product rotation, inspection program');

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify strategies were added
SELECT 'New strategies added:' as status, COUNT(*) as count 
FROM equipment_strategy 
WHERE equipment_id IN ('PU-200', 'PU-201', 'MO-200', 'TK-200', 'TK-201', 'HX-200', 'CP-100');

-- Check fouling-related equipment for strategy coverage
SELECT 'Fouling equipment with strategies:' as status;
SELECT 
    era.equipment_id,
    era.risk_scenario,
    COUNT(es.strategy_type) as strategy_count,
    STRING_AGG(es.strategy_type, ', ') as strategies
FROM equipment_risk_assessment era
LEFT JOIN equipment_strategy es ON era.equipment_id = es.equipment_id
WHERE era.risk_scenario ILIKE '%fouling%' 
   OR era.risk_factors ILIKE '%fouling%'
   OR era.risk_scenario ILIKE '%ファウリング%'
GROUP BY era.equipment_id, era.risk_scenario
ORDER BY strategy_count DESC;

-- Test SYS-002 coverage again
SELECT 'SYS-002 Strategy Coverage Check:' as test;
SELECT 
    esm.equipment_id,
    esm.system_id,
    COUNT(es.strategy_type) as strategy_count,
    STRING_AGG(es.strategy_type, ', ') as strategies
FROM equipment_system_mapping esm
LEFT JOIN equipment_strategy es ON esm.equipment_id = es.equipment_id
WHERE esm.system_id = 'SYS-002'
GROUP BY esm.equipment_id, esm.system_id
ORDER BY strategy_count DESC;