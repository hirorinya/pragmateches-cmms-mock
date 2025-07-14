-- Update only the null risk_factor fields while preserving existing Japanese data
UPDATE equipment_risk_assessment SET
  risk_factor = CASE 
    WHEN risk_scenario = '腐食' THEN '化学物質暴露、高温高湿環境、材料劣化'
    WHEN risk_scenario = '漏洩' THEN '経年劣化、振動、圧力変動、シール材の摩耗'
    WHEN risk_scenario = '破損' THEN '過大応力、材料疲労、外部衝撃、設計限界超過'
    WHEN equipment_id LIKE 'HX-%' THEN '熱サイクル、流体腐食性、スケール付着'
    WHEN equipment_id LIKE 'PU-%' THEN '軸受摩耗、キャビテーション、異常振動'
    WHEN equipment_id LIKE 'TK-%' THEN '内部腐食、基礎沈下、温度応力'
    ELSE '通常使用による経年劣化'
  END,
  impact_rank = CASE 
    WHEN risk_score >= 20 THEN 'HIGH'
    WHEN risk_score >= 15 THEN 'MEDIUM'
    ELSE 'LOW'
  END,
  reliability_rank = CASE 
    WHEN risk_score >= 18 THEN 'LOW'
    WHEN risk_score >= 12 THEN 'MEDIUM'
    ELSE 'HIGH'
  END
WHERE risk_factor IS NULL;

-- Verify the updates
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