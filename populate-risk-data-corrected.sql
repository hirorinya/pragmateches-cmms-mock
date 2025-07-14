-- SQL to populate equipment risk assessment data for demo purposes
-- Using the correct Japanese column names that exist in the table

-- Clear existing risk assessment data (if any)
DELETE FROM equipment_risk_assessment;

-- Insert comprehensive risk assessment data for SYS-001 equipment (Process Cooling System)
-- High risk of tube blockage due to fouling
INSERT INTO equipment_risk_assessment (
    "機器ID", "評価年", "リスクシナリオ", "評価タイミング", "緩和策", 
    "信頼性ランク（5段階）", "影響度ランク（5段階）", "リスクスコア（再計算）", 
    "リスクレベル（5段階）", "リスク許容性"
) VALUES 
-- Heat Exchanger HX-101 - Very high fouling risk
('HX-101', '2024-01-15', 'チューブ閉塞による冷却能力低下', '定期評価', 'チューブ清掃頻度向上、水質管理強化、オンライン監視導入', 
 '2', '5', 20, '非常に高い', '許容不可'),

-- Heat Exchanger HX-102 - High fouling risk  
('HX-102', '2024-01-15', 'ファウリングによる熱交換効率低下', '定期評価', '清掃スケジュール見直し、ファウリング監視システム導入',
 '3', '4', 16, '高い', '要対策'),

-- Cooling Tower CT-101 - Medium-High risk
('CT-101', '2024-01-15', 'スケール形成と微生物繁殖', '定期評価', '水処理プログラム強化、定期清掃実施',
 '2', '3', 15, '高い', '要対策'),

-- Circulation Pump PU-101 - Medium risk
('PU-101', '2024-01-15', 'キャビテーションとインペラ摩耗', '定期評価', '吸引圧力監視、振動解析実施',
 '4', '4', 12, '中程度', '監視継続'),

-- Fan EQ005 - Medium risk
('EQ005', '2024-01-15', 'ファンブレード不均衡と軸受故障', '定期評価', '振動監視、定期潤滑、防塵対策',
 '3', '5', 10, '中程度', '監視継続'),

-- Pump EQ006 - High risk
('EQ006', '2024-01-15', 'インペラ侵食とシール故障', '定期評価', '定期シール点検、インペラ交換、圧力監視',
 '2', '5', 15, '高い', '要対策');

-- Insert risk assessment data for SYS-002 equipment (Raw Material Supply System)  
-- Also high risk of tube blockage
INSERT INTO equipment_risk_assessment (
    "機器ID", "評価年", "リスクシナリオ", "評価タイミング", "緩和策",
    "信頼性ランク（5段階）", "影響度ランク（5段階）", "リスクスコア（再計算）",
    "リスクレベル（5段階）", "リスク許容性"
) VALUES
-- Centrifugal Pump PU-200 - High risk
('PU-200', '2024-01-15', '配管閉塞による材料蓄積', '定期評価', '定期配管洗浄、温度監視、予防清掃実施',
 '3', '4', 16, '高い', '要対策'),

-- Centrifugal Pump PU-201 - High risk
('PU-201', '2024-01-15', 'ポンプ詰まりと流量低下', '定期評価', 'ストレーナー改善、定期メンテナンス、流量監視',
 '2', '3', 15, '高い', '要対策'),

-- Storage Tank TK-201 - Medium risk
('TK-201', '2024-01-15', 'タンク底部スラッジ蓄積', '定期評価', '定期タンク清掃、撹拌システム改善',
 '4', '3', 9, '中程度', '監視継続'),

-- Feed Conveyor CV-201 - Low-Medium risk
('CV-201', '2024-01-15', 'ベルト摩耗と材料こぼれ', '定期評価', '定期ベルト点検、適切な調整、負荷監視',
 '5', '4', 8, '低い', '許容可能');

-- Insert additional risk assessment data for better demo coverage
INSERT INTO equipment_risk_assessment (
    "機器ID", "評価年", "リスクシナリオ", "評価タイミング", "緩和策",
    "信頼性ランク（5段階）", "影響度ランク（5段階）", "リスクスコア（再計算）",
    "リスクレベル（5段階）", "リスク許容性"
) VALUES
-- Additional equipment for comprehensive demo
('EQ007', '2024-01-15', 'モータ過熱と絶縁劣化', '定期評価', '温度監視、負荷管理、換気改善',
 '3', '3', 12, '中程度', '監視継続'),

('EQ008', '2024-01-15', 'バルブステム漏れとアクチュエータ故障', '定期評価', '定期パッキン交換、腐食防止、アクチュエータ整備',
 '4', '3', 6, '低い', '許容可能'),

('EQ009', '2024-01-15', '計器ドリフトと校正誤差', '定期評価', '定期校正、環境保護、部品交換',
 '3', '3', 9, '中程度', '監視継続'),

('EQ010', '2024-01-15', 'フィルタ詰まりと差圧上昇', '定期評価', '定期フィルタ交換、汚染制御、適正サイジング',
 '2', '3', 12, '中程度', '監視継続');

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
    era."機器ID" as equipment_id,
    e.equipment_name,
    era."リスクレベル（5段階）" as risk_level,
    era."リスクスコア（再計算）" as risk_score,
    era."リスクシナリオ" as risk_scenario,
    esm.system_id
FROM equipment_risk_assessment era
JOIN equipment e ON era."機器ID" = e.equipment_id
LEFT JOIN equipment_system_mapping esm ON e.equipment_id = esm.equipment_id
ORDER BY era."リスクスコア（再計算）" DESC, era."機器ID";