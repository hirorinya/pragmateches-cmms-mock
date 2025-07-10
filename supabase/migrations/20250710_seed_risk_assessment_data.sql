-- Seed data for Risk Assessment System
-- This file creates sample systems, failure modes, and risk scenarios

-- Insert Equipment Systems
INSERT INTO equipment_systems (system_id, system_name, system_type, parent_system_id, description, criticality_level) VALUES
('SYS-001', 'プロセス冷却系統', 'UNIT', NULL, 'プロセス流体の冷却を行う系統', 'HIGH'),
('SYS-002', '原料供給系統', 'UNIT', NULL, '原料タンクから反応器への供給系統', 'CRITICAL'),
('SYS-003', '排水処理系統', 'UNIT', NULL, '工場排水の処理を行う系統', 'MEDIUM'),
('SYS-004', '電力供給系統', 'AREA', NULL, '工場全体の電力供給', 'CRITICAL'),
('SYS-005', '安全監視系統', 'PLANT', NULL, '工場全体の安全監視', 'CRITICAL');

-- Link existing equipment to systems
INSERT INTO equipment_system_mapping (equipment_id, system_id, role_in_system) VALUES
('EQ005', 'SYS-001', 'PRIMARY'),  -- 送風機1号機 (cooling system)
('EQ006', 'SYS-001', 'PRIMARY'),  -- ポンプ1号機 (cooling system) 
('EQ019', 'SYS-001', 'SUPPORT'),  -- エアコン1号機 (cooling system)
('EQ020', 'SYS-001', 'SUPPORT'),  -- 換気扇1号機 (cooling system)
('EQ013', 'SYS-002', 'PRIMARY'),  -- 流量計1号機 (raw material supply)
('EQ014', 'SYS-002', 'PRIMARY'),  -- 圧力計1号機 (raw material supply)
('EQ016', 'SYS-002', 'SUPPORT'),  -- 制御盤1号機 (raw material supply)
('EQ017', 'SYS-003', 'PRIMARY'),  -- 配管1号機 (wastewater treatment)
('EQ018', 'SYS-003', 'PRIMARY'),  -- 弁1号機 (wastewater treatment)
('EQ009', 'SYS-004', 'PRIMARY'),  -- 変圧器1号機 (power supply)
('EQ010', 'SYS-004', 'PRIMARY'),  -- 配電盤1号機 (power supply)
('EQ012', 'SYS-004', 'SUPPORT');  -- 非常用発電機 (power supply)

-- Insert Failure Modes (FMEA structure)
INSERT INTO failure_modes (
    system_id, equipment_id, failure_mode, failure_mechanism, 
    failure_effect_local, failure_effect_system, failure_effect_plant,
    detection_method, current_controls, recommended_actions,
    severity_score, occurrence_score, detection_score,
    safety_impact, environmental_impact, production_impact,
    created_by
) VALUES
-- Cooling System Failure Modes
(
    'SYS-001', 'EQ006', 'ポンプ軸受故障', 'ベアリング摩耗による振動増加',
    'ポンプ効率低下、異音発生', '冷却能力低下、温度上昇', 'プロセス停止、製品品質悪化',
    '振動監視、温度監視', '定期点検、予防保全', '軸受交換、振動基準見直し',
    7, 4, 6, false, false, true, 'SYSTEM'
),
(
    'SYS-001', 'EQ005', '送風機インペラ損傷', '異物混入による羽根の損傷・変形',
    '風量低下、振動増加', '冷却能力低下、温度上昇', 'プロセス停止、製品品質悪化',
    '定期点検、振動監視', '吸込口フィルタ、定期清掃', 'インペラ交換、保護対策強化',
    8, 3, 4, true, false, true, 'SYSTEM'
),
(
    'SYS-001', 'EQ019', 'エアコン冷媒漏れ', '配管接続部の劣化による冷媒漏洩',
    '冷房効果低下、環境影響', '室温管理不良', '作業環境悪化、効率低下',
    '定期点検、ガス検知', '接続部点検、予防保全', '配管交換、定期ガス補充',
    6, 5, 5, false, true, true, 'SYSTEM'
),

-- Raw Material Supply System Failure Modes  
(
    'SYS-002', 'EQ013', '流量計ドリフト', '計器の経年劣化による測定誤差',
    '流量測定値の誤差増大', '原料供給量異常', '製品品質異常、仕様外れ',
    '定期校正、トレンド監視', '校正管理、基準器による確認', '計器交換、校正頻度見直し',
    6, 4, 7, false, false, true, 'SYSTEM'
),
(
    'SYS-002', 'EQ014', '圧力計指示異常', '内部機構の故障、ダイアフラム損傷',
    '圧力指示値異常', '原料圧力管理不良', '供給不安定、品質影響',
    '定期校正、比較確認', '校正管理、バックアップ計器', '計器交換、冗長化検討',
    5, 6, 6, false, false, true, 'SYSTEM'
),

-- Wastewater Treatment System Failure Modes
(
    'SYS-003', 'EQ017', '配管腐食・漏洩', '排水成分による配管内面腐食',
    '配管壁厚減少、漏洩発生', '排水漏洩、環境汚染', '環境基準違反、操業停止',
    '定期肉厚測定、漏洩検査', '材質選定、防食対策', '配管更新、材質変更',
    8, 4, 5, true, true, true, 'SYSTEM'
),

-- Power Supply System Failure Modes
(
    'SYS-004', 'EQ009', '変圧器絶縁劣化', '絶縁油の劣化、水分侵入',
    '絶縁性能低下、異常音', '電力供給不安定', '全系統停止、生産停止',
    '絶縁抵抗測定、油分析', '絶縁油管理、密閉保管', '変圧器交換、油交換',
    9, 2, 4, true, false, true, 'SYSTEM'
);

-- Insert Risk Scenarios
INSERT INTO risk_scenarios (
    system_id, scenario_name, scenario_description, trigger_conditions,
    likelihood_category, likelihood_score, consequence_category, consequence_score,
    current_barriers, mitigation_status
) VALUES
(
    'SYS-001', '冷却系統全停止', 'メインポンプ故障により冷却系統が完全停止し、プロセス温度が危険レベルまで上昇',
    'ポンプ故障 + バックアップ故障 + 手動操作遅れ',
    'UNLIKELY', 2, 'MAJOR', 4,
    ARRAY['バックアップポンプ', '温度警報', '緊急停止システム'], 'ACTIVE'
),
(
    'SYS-002', '原料供給異常による品質問題', '供給ポンプ故障と制御系異常の重複により、原料組成が大幅に変化',
    'ポンプ故障 + 制御系異常 + 検出遅れ',
    'POSSIBLE', 3, 'MODERATE', 3,
    ARRAY['流量監視', '組成分析', '品質管理システム'], 'ACTIVE'
),
(
    'SYS-003', '環境基準違反', '排水処理設備の複数故障により、排水が環境基準を大幅に超過',
    '処理設備故障 + 監視系故障 + 異常放流',
    'RARE', 1, 'CATASTROPHIC', 5,
    ARRAY['多重監視システム', '緊急遮断弁', '貯留タンク'], 'ACTIVE'
),
(
    'SYS-001', '熱交換器性能劣化', '熱交換器の段階的性能劣化により、長期間にわたり製品品質が悪化',
    '伝熱管汚れ + 清掃不良 + 性能監視不備',
    'LIKELY', 4, 'MINOR', 2,
    ARRAY['定期清掃', '性能監視', '品質検査'], 'MONITORING'
),
(
    'SYS-002', '原料タンク重大事故', 'タンク構造損傷により大量の原料が漏洩し、火災・爆発の危険',
    'タンク損傷 + 着火源 + 緊急対応遅れ',
    'RARE', 1, 'CATASTROPHIC', 5,
    ARRAY['ガス検知器', '消火設備', '緊急対応計画'], 'ACTIVE'
);

-- Link failure modes to risk scenarios
INSERT INTO failure_mode_scenarios (failure_mode_id, scenario_id, contribution_factor)
SELECT 
    fm.failure_mode_id,
    rs.scenario_id,
    CASE 
        WHEN fm.failure_mode LIKE '%ポンプ%' AND rs.scenario_name LIKE '%冷却系統%' THEN 0.8
        WHEN fm.failure_mode LIKE '%ポンプ%' AND rs.scenario_name LIKE '%原料供給%' THEN 0.7
        WHEN fm.failure_mode LIKE '%タンク%' AND rs.scenario_name LIKE '%環境基準%' THEN 0.6
        WHEN fm.failure_mode LIKE '%熱交換器%' AND rs.scenario_name LIKE '%熱交換器%' THEN 0.9
        WHEN fm.failure_mode LIKE '%タンク%' AND rs.scenario_name LIKE '%重大事故%' THEN 0.85
        ELSE 0.3
    END
FROM failure_modes fm
CROSS JOIN risk_scenarios rs
WHERE (
    (fm.failure_mode LIKE '%ポンプ%' AND rs.scenario_name LIKE '%冷却系統%') OR
    (fm.failure_mode LIKE '%ポンプ%' AND rs.scenario_name LIKE '%原料供給%') OR
    (fm.failure_mode LIKE '%ポンプ%' AND rs.scenario_name LIKE '%環境基準%') OR
    (fm.failure_mode LIKE '%熱交換器%' AND rs.scenario_name LIKE '%熱交換器%') OR
    (fm.failure_mode LIKE '%タンク%' AND rs.scenario_name LIKE '%重大事故%')
);

-- Create sample risk review
INSERT INTO risk_reviews (
    system_id, review_type, review_status, review_date, review_leader,
    review_team, triggered_by, findings, recommendations
) VALUES
(
    'SYS-001', 'SCHEDULED', 'COMPLETED', '2025-07-01', 'ST001',
    ARRAY['ST001', 'ST002', 'ST003'], 'SCHEDULE',
    '冷却系統の振動レベルが基準値を超過する傾向が確認された。特にEQ006の軸受部分で異常振動が検出されている。',
    '1. EQ006の軸受交換を3ヶ月以内に実施\n2. 振動監視の基準値を見直し\n3. 予防保全の頻度を月次から隔週に変更'
),
(
    'SYS-002', 'TRIGGERED', 'IN_PROGRESS', '2025-07-05', 'ST002',
    ARRAY['ST002', 'ST004'], 'PROCESS_CHANGE',
    'プロセス監視システムより高温警報が複数回発生。原料供給系統の異常が疑われる。',
    '調査継続中。計測器の校正確認と制御系の診断を実施予定。'
);

-- Create sample risk-based ES recommendations
INSERT INTO risk_es_recommendations (
    source_type, source_id, strategy_id, recommendation_type,
    current_frequency_type, current_frequency_value,
    recommended_frequency_type, recommended_frequency_value,
    risk_level, justification, status
)
SELECT 
    'FAILURE_MODE', 
    fm.failure_mode_id,
    es.strategy_id,
    CASE 
        WHEN fm.rpn_score > 150 THEN 'FREQUENCY_INCREASE'
        WHEN fm.safety_impact OR fm.environmental_impact THEN 'SCOPE_CHANGE'
        ELSE 'REVIEW_REQUIRED'
    END,
    es.frequency_type,
    es.frequency_value,
    CASE 
        WHEN es.frequency_type = 'MONTHLY' AND fm.rpn_score > 150 THEN 'WEEKLY'
        WHEN es.frequency_type = 'WEEKLY' AND fm.rpn_score > 200 THEN 'DAILY'
        ELSE es.frequency_type
    END,
    CASE 
        WHEN es.frequency_type = 'MONTHLY' AND fm.rpn_score > 150 THEN 7
        WHEN es.frequency_type = 'WEEKLY' AND fm.rpn_score > 200 THEN 1
        ELSE es.frequency_value
    END,
    CASE 
        WHEN fm.rpn_score > 200 THEN 'HIGH'
        WHEN fm.rpn_score > 100 THEN 'MEDIUM'
        ELSE 'LOW'
    END,
    CONCAT('RPN スコア: ', fm.rpn_score, ' - ', fm.failure_mode, 'による影響を考慮し、保全頻度の見直しを推奨'),
    'PENDING'
FROM failure_modes fm
JOIN equipment_strategy es ON fm.equipment_id = es.equipment_id
WHERE fm.rpn_score > 100
LIMIT 5;

-- Update existing process trigger rules to link with risk system
-- This creates the connection between process monitoring and risk assessment
INSERT INTO process_risk_triggers (
    trigger_type, severity_threshold, action_type, system_id
)
SELECT 
    'THRESHOLD_EXCEEDED',
    'HIGH',
    'CREATE_REVIEW',
    esm.system_id
FROM equipment_system_mapping esm
JOIN process_parameters pp ON esm.equipment_id = pp.equipment_id
GROUP BY esm.system_id;