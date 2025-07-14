-- Check what's in the risk assessment table
SELECT 
  equipment_id,
  risk_level,
  risk_score,
  risk_scenario,
  risk_factor,
  impact_rank,
  reliability_rank,
  mitigation_measures
FROM equipment_risk_assessment
ORDER BY risk_score DESC
LIMIT 10;