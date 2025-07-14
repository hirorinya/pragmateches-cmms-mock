-- SQL to populate equipment risk assessment data for demo purposes
-- This will make the Equipment Strategy analysis more meaningful

-- Clear existing risk assessment data (if any)
DELETE FROM equipment_risk_assessment;

-- Insert comprehensive risk assessment data for SYS-001 equipment (Process Cooling System)
-- High risk of tube blockage due to fouling
INSERT INTO equipment_risk_assessment (
    equipment_id, risk_scenario, risk_level, risk_score, 
    likelihood_score, consequence_score, risk_factors, 
    mitigation_measures, impact_rank, reliability_rank, 
    assessment_date, assessor
) VALUES 
-- Heat Exchanger HX-101 - Very high fouling risk
('HX-101', 'Tube blockage due to fouling and scaling', 'VERY_HIGH', 20, 
 5, 4, 'Cooling water quality, High operating temperature, Lack of filtration', 
 'Regular cleaning schedule, Water treatment, Online monitoring', 4, 2, 
 '2024-01-15', 'Risk Assessment Team'),

-- Heat Exchanger HX-102 - High fouling risk  
('HX-102', 'Reduced heat transfer efficiency due to fouling', 'HIGH', 16,
 4, 4, 'Process fluid contamination, Inadequate cleaning frequency',
 'Implement fouling monitoring, Increase cleaning frequency', 4, 3,
 '2024-01-15', 'Risk Assessment Team'),

-- Cooling Tower CT-101 - Medium-High risk
('CT-101', 'Scale formation and biological growth', 'HIGH', 15,
 5, 3, 'Water quality issues, Inadequate biocide treatment',
 'Water treatment program, Regular inspection and cleaning', 3, 2,
 '2024-01-15', 'Risk Assessment Team'),

-- Circulation Pump PU-101 - Medium risk
('PU-101', 'Cavitation and impeller wear', 'MEDIUM', 12,
 3, 4, 'Suction line restrictions, Operating at low NPSH',
 'Monitor suction pressure, Regular vibration analysis', 4, 4,
 '2024-01-15', 'Risk Assessment Team');

-- Insert risk assessment data for SYS-002 equipment (Raw Material Supply System)  
-- Also high risk of tube blockage
INSERT INTO equipment_risk_assessment (
    equipment_id, risk_scenario, risk_level, risk_score,
    likelihood_score, consequence_score, risk_factors,
    mitigation_measures, impact_rank, reliability_rank,
    assessment_date, assessor
) VALUES
-- Centrifugal Pump PU-200 - High risk
('PU-200', 'Line blockage due to material buildup', 'HIGH', 16,
 4, 4, 'Viscous materials, Inadequate flushing, Temperature variations',
 'Regular line flushing, Temperature monitoring, Preventive cleaning', 4, 3,
 '2024-01-15', 'Risk Assessment Team'),

-- Centrifugal Pump PU-201 - High risk
('PU-201', 'Pump clogging and reduced flow', 'HIGH', 15,
 5, 3, 'Particulate contamination, Inadequate straining',
 'Install better strainers, Regular maintenance, Flow monitoring', 3, 2,
 '2024-01-15', 'Risk Assessment Team'),

-- Storage Tank TK-201 - Medium risk
('TK-201', 'Bottom sludge accumulation', 'MEDIUM', 9,
 3, 3, 'Settlement of solids, Inadequate mixing',
 'Regular tank cleaning, Improve mixing system', 3, 4,
 '2024-01-15', 'Risk Assessment Team'),

-- Feed Conveyor CV-201 - Low-Medium risk
('CV-201', 'Belt wear and material spillage', 'MEDIUM', 8,
 2, 4, 'Abrasive materials, Misalignment, Overloading',
 'Regular belt inspection, Proper alignment, Load monitoring', 4, 5,
 '2024-01-15', 'Risk Assessment Team');

-- Insert risk assessment data for other systems
INSERT INTO equipment_risk_assessment (
    equipment_id, risk_scenario, risk_level, risk_score,
    likelihood_score, consequence_score, risk_factors,
    mitigation_measures, impact_rank, reliability_rank,
    assessment_date, assessor
) VALUES
-- SYS-001 additional equipment
('EQ005', 'Fan blade imbalance and bearing failure', 'MEDIUM', 10,
 2, 5, 'Vibration, Inadequate lubrication, Dust accumulation',
 'Vibration monitoring, Regular lubrication, Dust protection', 5, 3,
 '2024-01-15', 'Risk Assessment Team'),

('EQ006', 'Pump impeller erosion and seal failure', 'HIGH', 15,
 3, 5, 'Abrasive fluids, High pressure operation, Seal wear',
 'Regular seal inspection, Impeller replacement, Pressure monitoring', 5, 2,
 '2024-01-15', 'Risk Assessment Team'),

-- Additional equipment for better demo coverage
('EQ007', 'Motor overheating and insulation breakdown', 'MEDIUM', 12,
 4, 3, 'High ambient temperature, Overloading, Poor ventilation',
 'Temperature monitoring, Load management, Improve ventilation', 3, 3,
 '2024-01-15', 'Risk Assessment Team'),

('EQ008', 'Valve stem leakage and actuator failure', 'LOW', 6,
 2, 3, 'Packing wear, Corrosion, Actuator maintenance',
 'Regular packing replacement, Corrosion protection, Actuator service', 3, 4,
 '2024-01-15', 'Risk Assessment Team'),

('EQ009', 'Instrument drift and calibration errors', 'MEDIUM', 9,
 3, 3, 'Environmental conditions, Aging components, Calibration frequency',
 'Regular calibration, Environmental protection, Component replacement', 3, 3,
 '2024-01-15', 'Risk Assessment Team'),

('EQ010', 'Filter clogging and differential pressure increase', 'HIGH', 12,
 4, 3, 'Particle contamination, Inadequate maintenance, Filter sizing',
 'Regular filter changes, Contamination control, Proper sizing', 3, 2,
 '2024-01-15', 'Risk Assessment Team');

-- Update equipment table to ensure we have proper equipment entries
INSERT INTO equipment (equipment_id, equipment_name, equipment_type_id, location, operational_status, importance_level)
VALUES 
('HX-101', 'Heat Exchanger 101', 1, 'Process Area A', 'OPERATIONAL', 'HIGH'),
('HX-102', 'Heat Exchanger 102', 1, 'Process Area A', 'OPERATIONAL', 'HIGH'),
('CT-101', 'Cooling Tower 101', 1, 'Cooling Water Area', 'OPERATIONAL', 'MEDIUM'),
('PU-101', 'Circulation Pump 101', 2, 'Pump House A', 'OPERATIONAL', 'HIGH'),
('TK-201', 'Storage Tank 201', 1, 'Tank Farm', 'OPERATIONAL', 'MEDIUM'),
('CV-201', 'Feed Conveyor 201', 1, 'Material Handling', 'OPERATIONAL', 'MEDIUM')
ON CONFLICT (equipment_id) DO NOTHING;

-- Add equipment to system mappings for better demo
INSERT INTO equipment_system_mapping (equipment_id, system_id) 
VALUES 
('HX-101', 'SYS-001'),
('HX-102', 'SYS-001'), 
('CT-101', 'SYS-001'),
('PU-101', 'SYS-001'),
('TK-201', 'SYS-002'),
('CV-201', 'SYS-002')
ON CONFLICT (equipment_id, system_id) DO NOTHING;

-- Verify the data
SELECT 
    era.equipment_id,
    e.equipment_name,
    era.risk_level,
    era.risk_score,
    era.risk_scenario,
    esm.system_id
FROM equipment_risk_assessment era
JOIN equipment e ON era.equipment_id = e.equipment_id
LEFT JOIN equipment_system_mapping esm ON e.equipment_id = esm.equipment_id
ORDER BY era.risk_score DESC, era.equipment_id;