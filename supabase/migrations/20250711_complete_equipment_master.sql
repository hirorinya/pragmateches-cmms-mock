-- ============================================
-- Complete Equipment Master Data Migration
-- Created: 2025-07-11
-- Purpose: Add missing critical process equipment (HX, TK, PU series)
-- ============================================

-- 1. Add Heat Exchangers (HX Series) - Process Cooling Equipment
INSERT INTO equipment (
  設備ID, 設備名, 設備種別ID, システムID, 場所, 
  メーカー, 型式, 設置年月, 状態, 備考
) VALUES
-- SYS-001 Heat Exchangers
('HX-100', '主熱交換器1号機', 3, 'SYS-001', 'プロセスエリアA', 'ABC Heat Tech', 'HE-2500S', '2018-03-01', '稼働中', 'プロセス冷却系統主力機'),
('HX-101', '主熱交換器2号機', 3, 'SYS-001', 'プロセスエリアA', 'ABC Heat Tech', 'HE-2500S', '2018-06-01', '稼働中', 'プロセス冷却系統予備機'),
('HX-102', '補助熱交換器1号機', 3, 'SYS-001', 'プロセスエリアB', 'DEF Thermal', 'HE-1500M', '2019-01-15', '稼働中', 'プロセス冷却系統補助機'),
('HX-103', '冷却水熱交換器', 3, 'SYS-001', 'プロセスエリアB', 'ABC Heat Tech', 'HE-3000L', '2019-08-01', '稼働中', '冷却水系統'),

-- SYS-002 Heat Exchangers
('HX-200', '原料加熱器1号機', 3, 'SYS-002', '原料エリア', 'GHI Industrial', 'HE-1800R', '2020-02-01', '稼働中', '原料供給系統'),
('HX-201', '原料加熱器2号機', 3, 'SYS-002', '原料エリア', 'GHI Industrial', 'HE-1800R', '2020-05-01', '稼働中', '原料供給系統予備機'),

-- SYS-003 Heat Exchangers  
('HX-300', '排水冷却器', 3, 'SYS-003', '排水処理エリア', 'JKL Environmental', 'HE-1200W', '2019-11-01', '稼働中', '排水処理系統'),

-- Additional Heat Exchangers
('HX-104', 'プロセス予熱器', 3, 'SYS-001', 'プロセスエリアC', 'ABC Heat Tech', 'HE-2000P', '2021-03-01', '稼働中', '前段加熱器'),
('HX-105', '最終冷却器', 3, 'SYS-001', 'プロセスエリアC', 'DEF Thermal', 'HE-2200F', '2021-06-01', '稼働中', '最終工程冷却'),
('HX-106', '緊急冷却器', 3, 'SYS-001', 'プロセスエリアD', 'ABC Heat Tech', 'HE-1500E', '2017-12-01', '待機中', '緊急時使用')
ON CONFLICT (設備ID) DO UPDATE SET
  設備名 = EXCLUDED.設備名,
  設備種別ID = EXCLUDED.設備種別ID,
  システムID = EXCLUDED.システムID,
  メーカー = EXCLUDED.メーカー,
  型式 = EXCLUDED.型式;

-- 2. Add Storage Tanks (TK Series) - Static Equipment
INSERT INTO equipment (
  設備ID, 設備名, 設備種別ID, システムID, 場所,
  メーカー, 型式, 設置年月, 状態, 備考
) VALUES
-- SYS-001 Tanks
('TK-100', '冷却水タンク1号機', 1, 'SYS-001', 'タンクヤードA', 'MNO Tank Works', 'ST-5000', '2017-08-01', '稼働中', '冷却水貯槽'),
('TK-101', '冷却水タンク2号機', 1, 'SYS-001', 'タンクヤードA', 'MNO Tank Works', 'ST-5000', '2017-10-01', '稼働中', '冷却水貯槽予備'),
('TK-102', 'プロセス水タンク', 1, 'SYS-001', 'タンクヤードB', 'PQR Vessels', 'ST-3000P', '2018-12-01', '稼働中', 'プロセス水貯槽'),

-- SYS-002 Tanks
('TK-200', '原料タンク1号機', 1, 'SYS-002', '原料タンクヤード', 'STU Storage', 'RT-8000A', '2019-03-01', '稼働中', '主原料貯槽'),
('TK-201', '原料タンク2号機', 1, 'SYS-002', '原料タンクヤード', 'STU Storage', 'RT-8000A', '2019-06-01', '稼働中', '主原料貯槽予備'),
('TK-202', '添加剤タンク', 1, 'SYS-002', '原料タンクヤード', 'VWX Chemical', 'CT-1500', '2020-01-01', '稼働中', '添加剤貯槽'),

-- SYS-003 Tanks
('TK-300', '排水貯留タンク', 1, 'SYS-003', '排水処理エリア', 'YZ Environmental', 'WT-4000', '2018-09-01', '稼働中', '排水一時貯留'),
('TK-301', '処理水タンク', 1, 'SYS-003', '排水処理エリア', 'YZ Environmental', 'WT-3000C', '2019-02-01', '稼働中', '処理済み水貯槽'),

-- Additional Tanks
('TK-103', 'バッファタンク', 1, 'SYS-001', 'タンクヤードC', 'MNO Tank Works', 'ST-2000B', '2020-08-01', '稼働中', 'プロセスバッファ'),
('TK-104', '非常用水タンク', 1, 'SYS-001', 'ユーティリティエリア', 'ABC Emergency', 'ET-1000', '2017-05-01', '待機中', '緊急時用水')
ON CONFLICT (設備ID) DO UPDATE SET
  設備名 = EXCLUDED.設備名,
  設備種別ID = EXCLUDED.設備種別ID,
  システムID = EXCLUDED.システムID,
  メーカー = EXCLUDED.メーカー,
  型式 = EXCLUDED.型式;

-- 3. Add Process Pumps (PU Series) - Rotating Equipment
INSERT INTO equipment (
  設備ID, 設備名, 設備種別ID, システムID, 場所,
  メーカー, 型式, 設置年月, 状態, 備考
) VALUES
-- SYS-001 Pumps
('PU-100', '冷却水循環ポンプ1号機', 2, 'SYS-001', 'ポンプ室A', 'DEF Pumps', 'CP-500H', '2018-04-01', '稼働中', '冷却水循環主力'),
('PU-101', '冷却水循環ポンプ2号機', 2, 'SYS-001', 'ポンプ室A', 'DEF Pumps', 'CP-500H', '2018-07-01', '稼働中', '冷却水循環予備'),
('PU-102', 'プロセス水供給ポンプ', 2, 'SYS-001', 'ポンプ室B', 'GHI Flow', 'PP-300S', '2019-01-01', '稼働中', 'プロセス水供給'),

-- SYS-002 Pumps
('PU-200', '原料供給ポンプ1号機', 2, 'SYS-002', '原料ポンプ室', 'JKL Process', 'RP-800M', '2019-04-01', '稼働中', '原料供給主力'),
('PU-201', '原料供給ポンプ2号機', 2, 'SYS-002', '原料ポンプ室', 'JKL Process', 'RP-800M', '2019-07-01', '稼働中', '原料供給予備'),
('PU-202', '添加剤注入ポンプ', 2, 'SYS-002', '原料ポンプ室', 'MNO Precision', 'MP-50', '2020-02-01', '稼働中', '添加剤定量供給'),

-- SYS-003 Pumps
('PU-300', '排水移送ポンプ1号機', 2, 'SYS-003', '排水ポンプ室', 'PQR Environmental', 'WP-600', '2018-10-01', '稼働中', '排水移送主力'),
('PU-301', '排水移送ポンプ2号機', 2, 'SYS-003', '排水ポンプ室', 'PQR Environmental', 'WP-600', '2019-01-01', '稼働中', '排水移送予備'),

-- Additional Pumps
('PU-103', '緊急循環ポンプ', 2, 'SYS-001', 'ポンプ室C', 'STU Emergency', 'EP-400', '2017-11-01', '待機中', '緊急時循環'),
('PU-104', 'バックアップポンプ', 2, 'SYS-001', 'ポンプ室C', 'DEF Pumps', 'BP-250', '2020-09-01', '待機中', '全系統バックアップ')
ON CONFLICT (設備ID) DO UPDATE SET
  設備名 = EXCLUDED.設備名,
  設備種別ID = EXCLUDED.設備種別ID,
  システムID = EXCLUDED.システムID,
  メーカー = EXCLUDED.メーカー,
  型式 = EXCLUDED.型式;

-- 4. Add Equipment System Mappings
INSERT INTO equipment_system_mapping (equipment_id, system_id, role_in_system) VALUES
-- SYS-001 Mappings
('HX-100', 'SYS-001', 'PRIMARY'),
('HX-101', 'SYS-001', 'BACKUP'),
('HX-102', 'SYS-001', 'SUPPORT'),
('HX-103', 'SYS-001', 'SUPPORT'),
('HX-104', 'SYS-001', 'SUPPORT'),
('HX-105', 'SYS-001', 'SUPPORT'),
('HX-106', 'SYS-001', 'EMERGENCY'),
('TK-100', 'SYS-001', 'PRIMARY'),
('TK-101', 'SYS-001', 'BACKUP'),
('TK-102', 'SYS-001', 'SUPPORT'),
('TK-103', 'SYS-001', 'SUPPORT'),
('TK-104', 'SYS-001', 'EMERGENCY'),
('PU-100', 'SYS-001', 'PRIMARY'),
('PU-101', 'SYS-001', 'BACKUP'),
('PU-102', 'SYS-001', 'SUPPORT'),
('PU-103', 'SYS-001', 'EMERGENCY'),
('PU-104', 'SYS-001', 'EMERGENCY'),

-- SYS-002 Mappings
('HX-200', 'SYS-002', 'PRIMARY'),
('HX-201', 'SYS-002', 'BACKUP'),
('TK-200', 'SYS-002', 'PRIMARY'),
('TK-201', 'SYS-002', 'BACKUP'),
('TK-202', 'SYS-002', 'SUPPORT'),
('PU-200', 'SYS-002', 'PRIMARY'),
('PU-201', 'SYS-002', 'BACKUP'),
('PU-202', 'SYS-002', 'SUPPORT'),

-- SYS-003 Mappings
('HX-300', 'SYS-003', 'PRIMARY'),
('TK-300', 'SYS-003', 'PRIMARY'),
('TK-301', 'SYS-003', 'SUPPORT'),
('PU-300', 'SYS-003', 'PRIMARY'),
('PU-301', 'SYS-003', 'BACKUP')
ON CONFLICT (equipment_id, system_id) DO UPDATE SET
  role_in_system = EXCLUDED.role_in_system;

-- 5. Update Equipment Types Master (if needed)
INSERT INTO equipment_type_master (設備種別ID, 種別名, 説明) VALUES
(3, '熱交換器', 'Heat exchangers and thermal equipment')
ON CONFLICT (設備種別ID) DO UPDATE SET
  種別名 = EXCLUDED.種別名,
  説明 = EXCLUDED.説明;

-- Log this migration
INSERT INTO migration_log (migration_name, applied_at, description) 
VALUES (
  '20250711_complete_equipment_master',
  NOW(),
  'Added comprehensive equipment master data: 10 heat exchangers, 10 tanks, 10 pumps with proper system mappings'
) ON CONFLICT DO NOTHING;