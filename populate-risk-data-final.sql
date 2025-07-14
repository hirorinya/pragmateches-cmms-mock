-- SQL to populate equipment risk assessment data for demo purposes
-- Using actual current table structure from Supabase

-- Clear existing risk assessment data for our target equipment only
DELETE FROM equipment_risk_assessment WHERE equipment_id IN (
    'HX-101', 'HX-102', 'PU-101', 'PU-200', 'PU-201', 'TK-201', 
    'EQ005', 'EQ006', 'EQ007', 'EQ008', 'EQ009', 'EQ010'
);

-- Insert comprehensive risk assessment data for SYS-001 equipment (Process Cooling System)
-- High risk of tube blockage due to fouling
INSERT INTO equipment_risk_assessment (
    equipment_id, 
    assessment_year, 
    risk_scenario, 
    assessment_timing,
    mitigation_measures,
    reliability_rank, 
    impact_rank, 
    risk_score, 
    risk_level,
    risk_acceptability,
    risk_factor,
    likelihood_score,
    consequence_score
) VALUES 
-- Heat Exchanger HX-101 - Very high fouling risk
('HX-101', '2024-01-15', 'Tube blockage due to fouling and scaling', 'Regular Assessment',
 'Regular cleaning schedule, Water treatment, Online monitoring', 
 'LOW', 'VERY_HIGH', 20, 'VERY_HIGH', 'Unacceptable', 
 'Cooling water quality, High operating temperature, Lack of filtration', 5, 4),

-- Heat Exchanger HX-102 - High fouling risk  
('HX-102', '2024-01-15', 'Reduced heat transfer efficiency due to fouling', 'Regular Assessment',
 'Implement fouling monitoring, Increase cleaning frequency',
 'MEDIUM', 'HIGH', 16, 'HIGH', 'Requires Action',
 'Process fluid contamination, Inadequate cleaning frequency', 4, 4),

-- Circulation Pump PU-101 - Medium risk
('PU-101', '2024-01-15', 'Cavitation and impeller wear', 'Regular Assessment',
 'Monitor suction pressure, Regular vibration analysis',
 'HIGH', 'HIGH', 12, 'MEDIUM', 'Monitor Closely',
 'Suction line restrictions, Operating at low NPSH', 3, 4),

-- Fan EQ005 - Medium risk
('EQ005', '2024-01-15', 'Fan blade imbalance and bearing failure', 'Regular Assessment',
 'Vibration monitoring, Regular lubrication, Dust protection',
 'MEDIUM', 'VERY_HIGH', 10, 'MEDIUM', 'Monitor Closely',
 'Vibration, Inadequate lubrication, Dust accumulation', 2, 5),

-- Pump EQ006 - High risk
('EQ006', '2024-01-15', 'Pump impeller erosion and seal failure', 'Regular Assessment',
 'Regular seal inspection, Impeller replacement, Pressure monitoring',
 'LOW', 'VERY_HIGH', 15, 'HIGH', 'Requires Action',
 'Abrasive fluids, High pressure operation, Seal wear', 3, 5);

-- Insert risk assessment data for SYS-002 equipment (Raw Material Supply System)  
-- Also high risk of tube blockage
INSERT INTO equipment_risk_assessment (
    equipment_id, 
    assessment_year, 
    risk_scenario, 
    assessment_timing,
    mitigation_measures,
    reliability_rank, 
    impact_rank, 
    risk_score, 
    risk_level,
    risk_acceptability,
    risk_factor,
    likelihood_score,
    consequence_score
) VALUES
-- Centrifugal Pump PU-200 - High risk
('PU-200', '2024-01-15', 'Line blockage due to material buildup', 'Regular Assessment',
 'Regular line flushing, Temperature monitoring, Preventive cleaning',
 'MEDIUM', 'HIGH', 16, 'HIGH', 'Requires Action',
 'Viscous materials, Inadequate flushing, Temperature variations', 4, 4),

-- Centrifugal Pump PU-201 - High risk
('PU-201', '2024-01-15', 'Pump clogging and reduced flow', 'Regular Assessment',
 'Install better strainers, Regular maintenance, Flow monitoring',
 'LOW', 'MEDIUM', 15, 'HIGH', 'Requires Action',
 'Particulate contamination, Inadequate straining', 5, 3),

-- Storage Tank TK-201 - Medium risk
('TK-201', '2024-01-15', 'Bottom sludge accumulation', 'Regular Assessment',
 'Regular tank cleaning, Improve mixing system',
 'HIGH', 'MEDIUM', 9, 'MEDIUM', 'Monitor Closely',
 'Settlement of solids, Inadequate mixing', 3, 3);

-- Insert additional risk assessment data for better demo coverage
INSERT INTO equipment_risk_assessment (
    equipment_id, 
    assessment_year, 
    risk_scenario, 
    assessment_timing,
    mitigation_measures,
    reliability_rank, 
    impact_rank, 
    risk_score, 
    risk_level,
    risk_acceptability,
    risk_factor,
    likelihood_score,
    consequence_score
) VALUES
-- Additional equipment for comprehensive demo
('EQ007', '2024-01-15', 'Motor overheating and insulation breakdown', 'Regular Assessment',
 'Temperature monitoring, Load management, Improve ventilation',
 'MEDIUM', 'MEDIUM', 12, 'MEDIUM', 'Monitor Closely',
 'High ambient temperature, Overloading, Poor ventilation', 4, 3),

('EQ008', '2024-01-15', 'Valve stem leakage and actuator failure', 'Regular Assessment',
 'Regular packing replacement, Corrosion protection, Actuator service',
 'HIGH', 'MEDIUM', 6, 'LOW', 'Acceptable',
 'Packing wear, Corrosion, Actuator maintenance', 2, 3),

('EQ009', '2024-01-15', 'Instrument drift and calibration errors', 'Regular Assessment',
 'Regular calibration, Environmental protection, Component replacement',
 'MEDIUM', 'MEDIUM', 9, 'MEDIUM', 'Monitor Closely',
 'Environmental conditions, Aging components, Calibration frequency', 3, 3),

('EQ010', '2024-01-15', 'Filter clogging and differential pressure increase', 'Regular Assessment',
 'Regular filter changes, Contamination control, Proper sizing',
 'MEDIUM', 'MEDIUM', 12, 'MEDIUM', 'Monitor Closely',
 'Particle contamination, Inadequate maintenance, Filter sizing', 4, 3);

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
WHERE era.equipment_id IN ('HX-101', 'HX-102', 'PU-101', 'PU-200', 'PU-201', 'TK-201', 'EQ005', 'EQ006', 'EQ007', 'EQ008', 'EQ009', 'EQ010')
ORDER BY era.risk_score DESC, era.equipment_id;