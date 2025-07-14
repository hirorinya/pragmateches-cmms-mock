-- Update existing risk assessments with meaningful risk scenarios
UPDATE equipment_risk_assessment SET
  risk_scenario = CASE 
    WHEN equipment_id LIKE 'HX-%' THEN 
      CASE (RANDOM() * 4)::INT
        WHEN 0 THEN 'Fouling buildup in tubes'
        WHEN 1 THEN 'Corrosion in shell side'
        WHEN 2 THEN 'Tube bundle failure'
        WHEN 3 THEN 'Gasket deterioration'
        ELSE 'Thermal stress cracking'
      END
    WHEN equipment_id LIKE 'PU-%' THEN
      CASE (RANDOM() * 4)::INT
        WHEN 0 THEN 'Bearing wear and failure'
        WHEN 1 THEN 'Seal leakage'
        WHEN 2 THEN 'Vibration issues'
        WHEN 3 THEN 'Impeller damage'
        ELSE 'Motor overheating'
      END
    WHEN equipment_id LIKE 'TK-%' THEN
      CASE (RANDOM() * 4)::INT
        WHEN 0 THEN 'Corrosion and wall thinning'
        WHEN 1 THEN 'Foundation settlement'
        WHEN 2 THEN 'Coating degradation'
        WHEN 3 THEN 'Nozzle cracking'
        ELSE 'Internal contamination'
      END
    ELSE 'General equipment degradation'
  END,
  risk_factor = CASE 
    WHEN equipment_id LIKE 'HX-%' THEN 'Process contamination, temperature cycling, chemical exposure'
    WHEN equipment_id LIKE 'PU-%' THEN 'Mechanical stress, continuous operation, fluid dynamics'
    WHEN equipment_id LIKE 'TK-%' THEN 'Environmental exposure, chemical storage, pressure cycles'
    ELSE 'Normal wear and aging'
  END,
  impact_rank = CASE 
    WHEN risk_score > 20 THEN 'HIGH'
    WHEN risk_score > 15 THEN 'MEDIUM'
    ELSE 'LOW'
  END,
  reliability_rank = CASE 
    WHEN risk_score > 18 THEN 'LOW'
    WHEN risk_score > 12 THEN 'MEDIUM'
    ELSE 'HIGH'
  END,
  mitigation_measures = CASE 
    WHEN equipment_id LIKE 'HX-%' THEN 'Regular cleaning schedule, thickness monitoring, water chemistry control'
    WHEN equipment_id LIKE 'PU-%' THEN 'Vibration monitoring, oil analysis, alignment checks'
    WHEN equipment_id LIKE 'TK-%' THEN 'Periodic inspection, thickness measurement, coating maintenance'
    ELSE 'Preventive maintenance program'
  END
WHERE risk_scenario IS NULL;

-- Show updated data
SELECT 
  equipment_id,
  risk_level,
  risk_score,
  risk_scenario,
  risk_factor,
  mitigation_measures
FROM equipment_risk_assessment
ORDER BY risk_score DESC
LIMIT 10;