-- SQL to populate equipment risk assessment data for demo purposes
-- Using correct English column names

-- Clear existing risk assessment data (if any)
DELETE FROM equipment_risk_assessment;

-- Insert comprehensive risk assessment data for SYS-001 equipment (Process Cooling System)
-- High risk of tube blockage due to fouling
INSERT INTO equipment_risk_assessment (
    equipment_id, assessment_year, risk_level, risk_score, risk_scenario, risk_factor,
    impact_rank, reliability_rank, mitigation_measures, 
    likelihood_score, consequence_score
) VALUES 
-- Heat Exchanger HX-101 - Very high fouling risk
('HX-101', '2024-01-15', 'VERY_HIGH', 20, 'Tube blockage due to fouling and scaling', 'Cooling water quality, High operating temperature, Lack of filtration',
 5, 2, 'Regular cleaning schedule, Water treatment, Online monitoring', 5, 4),

-- Heat Exchanger HX-102 - High fouling risk  
('HX-102', '2024-01-15', 'HIGH', 16, 'Reduced heat transfer efficiency due to fouling', 'Process fluid contamination, Inadequate cleaning frequency',
 4, 3, 'Implement fouling monitoring, Increase cleaning frequency', 4, 4),

-- Cooling Tower CT-101 - Medium-High risk
('CT-101', '2024-01-15', 'HIGH', 15, 'Scale formation and biological growth', 'Water quality issues, Inadequate biocide treatment',
 3, 2, 'Water treatment program, Regular inspection and cleaning', 5, 3),

-- Circulation Pump PU-101 - Medium risk
('PU-101', '2024-01-15', 'MEDIUM', 12, 'Cavitation and impeller wear', 'Suction line restrictions, Operating at low NPSH',
 4, 4, 'Monitor suction pressure, Regular vibration analysis', 3, 4),

-- Fan EQ005 - Medium risk
('EQ005', '2024-01-15', 'MEDIUM', 10, 'Fan blade imbalance and bearing failure', 'Vibration, Inadequate lubrication, Dust accumulation',
 5, 3, 'Vibration monitoring, Regular lubrication, Dust protection', 2, 5),

-- Pump EQ006 - High risk
('EQ006', '2024-01-15', 'HIGH', 15, 'Pump impeller erosion and seal failure', 'Abrasive fluids, High pressure operation, Seal wear',
 5, 2, 'Regular seal inspection, Impeller replacement, Pressure monitoring', 3, 5);

-- Insert risk assessment data for SYS-002 equipment (Raw Material Supply System)  
-- Also high risk of tube blockage
INSERT INTO equipment_risk_assessment (
    equipment_id, assessment_year, risk_level, risk_score, risk_scenario, risk_factor,
    impact_rank, reliability_rank, mitigation_measures,
    likelihood_score, consequence_score
) VALUES
-- Centrifugal Pump PU-200 - High risk
('PU-200', '2024-01-15', 'HIGH', 16, 'Line blockage due to material buildup', 'Viscous materials, Inadequate flushing, Temperature variations',
 4, 3, 'Regular line flushing, Temperature monitoring, Preventive cleaning', 4, 4),

-- Centrifugal Pump PU-201 - High risk
('PU-201', '2024-01-15', 'HIGH', 15, 'Pump clogging and reduced flow', 'Particulate contamination, Inadequate straining',
 3, 2, 'Install better strainers, Regular maintenance, Flow monitoring', 5, 3),

-- Storage Tank TK-201 - Medium risk
('TK-201', '2024-01-15', 'MEDIUM', 9, 'Bottom sludge accumulation', 'Settlement of solids, Inadequate mixing',
 3, 4, 'Regular tank cleaning, Improve mixing system', 3, 3),

-- Feed Conveyor CV-201 - Low-Medium risk
('CV-201', '2024-01-15', 'LOW', 8, 'Belt wear and material spillage', 'Abrasive materials, Misalignment, Overloading',
 4, 5, 'Regular belt inspection, Proper alignment, Load monitoring', 2, 4);

-- Insert additional risk assessment data for better demo coverage
INSERT INTO equipment_risk_assessment (
    equipment_id, assessment_year, risk_level, risk_score, risk_scenario, risk_factor,
    impact_rank, reliability_rank, mitigation_measures,
    likelihood_score, consequence_score
) VALUES
-- Additional equipment for comprehensive demo
('EQ007', '2024-01-15', 'MEDIUM', 12, 'Motor overheating and insulation breakdown', 'High ambient temperature, Overloading, Poor ventilation',
 3, 3, 'Temperature monitoring, Load management, Improve ventilation', 4, 3),

('EQ008', '2024-01-15', 'LOW', 6, 'Valve stem leakage and actuator failure', 'Packing wear, Corrosion, Actuator maintenance',
 3, 4, 'Regular packing replacement, Corrosion protection, Actuator service', 2, 3),

('EQ009', '2024-01-15', 'MEDIUM', 9, 'Instrument drift and calibration errors', 'Environmental conditions, Aging components, Calibration frequency',
 3, 3, 'Regular calibration, Environmental protection, Component replacement', 3, 3),

('EQ010', '2024-01-15', 'MEDIUM', 12, 'Filter clogging and differential pressure increase', 'Particle contamination, Inadequate maintenance, Filter sizing',
 3, 2, 'Regular filter changes, Contamination control, Proper sizing', 4, 3);

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