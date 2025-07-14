-- ============================================
-- Fix Remaining Japanese Columns - Safe Version
-- Created: 2025-07-13
-- Purpose: Complete the migration to English column names with conflict handling
-- ============================================

-- 1. Fix anomaly_report table
DO $$
BEGIN
    RAISE NOTICE '=== FIXING ANOMALY_REPORT TABLE ===';
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anomaly_report' AND column_name = '原因') THEN
        ALTER TABLE anomaly_report RENAME COLUMN "原因" TO cause;
        RAISE NOTICE 'Renamed anomaly_report.原因 to cause';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anomaly_report' AND column_name = '対処方法') THEN
        ALTER TABLE anomaly_report RENAME COLUMN "対処方法" TO countermeasure;
        RAISE NOTICE 'Renamed anomaly_report.対処方法 to countermeasure';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anomaly_report' AND column_name = '報告日時') THEN
        ALTER TABLE anomaly_report RENAME COLUMN "報告日時" TO report_datetime;
        RAISE NOTICE 'Renamed anomaly_report.報告日時 to report_datetime';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anomaly_report' AND column_name = '解決日時') THEN
        ALTER TABLE anomaly_report RENAME COLUMN "解決日時" TO resolution_datetime;
        RAISE NOTICE 'Renamed anomaly_report.解決日時 to resolution_datetime';
    END IF;
END $$;

-- 2. Fix work_order table with conflict handling
DO $$
BEGIN
    RAISE NOTICE '=== FIXING WORK_ORDER TABLE ===';
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_order' AND column_name = '作業種別ID') THEN
        ALTER TABLE work_order RENAME COLUMN "作業種別ID" TO work_type_id;
        RAISE NOTICE 'Renamed work_order.作業種別ID to work_type_id';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_order' AND column_name = '計画開始日時') THEN
        ALTER TABLE work_order RENAME COLUMN "計画開始日時" TO planned_start_datetime;
        RAISE NOTICE 'Renamed work_order.計画開始日時 to planned_start_datetime';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_order' AND column_name = '計画終了日時') THEN
        ALTER TABLE work_order RENAME COLUMN "計画終了日時" TO planned_end_datetime;
        RAISE NOTICE 'Renamed work_order.計画終了日時 to planned_end_datetime';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_order' AND column_name = '実際開始日時') THEN
        ALTER TABLE work_order RENAME COLUMN "実際開始日時" TO actual_start_datetime;
        RAISE NOTICE 'Renamed work_order.実際開始日時 to actual_start_datetime';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_order' AND column_name = '実際終了日時') THEN
        ALTER TABLE work_order RENAME COLUMN "実際終了日時" TO actual_end_datetime;
        RAISE NOTICE 'Renamed work_order.実際終了日時 to actual_end_datetime';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_order' AND column_name = '作業者ID') THEN
        ALTER TABLE work_order RENAME COLUMN "作業者ID" TO worker_id;
        RAISE NOTICE 'Renamed work_order.作業者ID to worker_id';
    END IF;
    
    -- Handle status column conflict
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_order' AND column_name = '状態') THEN
        -- Check if 'status' column already exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_order' AND column_name = 'status') THEN
            -- If both exist, drop the Japanese one and use the English one
            RAISE NOTICE 'Both 状態 and status columns exist in work_order. Dropping Japanese column 状態';
            -- First copy data if needed
            EXECUTE 'UPDATE work_order SET status = COALESCE(status, "状態") WHERE status IS NULL OR status = ''''';
            -- Then drop the Japanese column
            ALTER TABLE work_order DROP COLUMN "状態";
        ELSE
            -- If only Japanese exists, rename it
            ALTER TABLE work_order RENAME COLUMN "状態" TO status;
            RAISE NOTICE 'Renamed work_order.状態 to status';
        END IF;
    ELSE
        RAISE NOTICE 'work_order.状態 column does not exist (already renamed or never existed)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_order' AND column_name = '備考') THEN
        ALTER TABLE work_order RENAME COLUMN "備考" TO notes;
        RAISE NOTICE 'Renamed work_order.備考 to notes';
    END IF;
END $$;

-- 3. Fix inspection_cycle_master table
DO $$
BEGIN
    RAISE NOTICE '=== FIXING INSPECTION_CYCLE_MASTER TABLE ===';
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspection_cycle_master' AND column_name = '周期ID') THEN
        ALTER TABLE inspection_cycle_master RENAME COLUMN "周期ID" TO cycle_id;
        RAISE NOTICE 'Renamed inspection_cycle_master.周期ID to cycle_id';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspection_cycle_master' AND column_name = '周期名') THEN
        ALTER TABLE inspection_cycle_master RENAME COLUMN "周期名" TO cycle_name;
        RAISE NOTICE 'Renamed inspection_cycle_master.周期名 to cycle_name';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspection_cycle_master' AND column_name = '周期日数') THEN
        ALTER TABLE inspection_cycle_master RENAME COLUMN "周期日数" TO cycle_days;
        RAISE NOTICE 'Renamed inspection_cycle_master.周期日数 to cycle_days';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspection_cycle_master' AND column_name = '説明') THEN
        ALTER TABLE inspection_cycle_master RENAME COLUMN "説明" TO description;
        RAISE NOTICE 'Renamed inspection_cycle_master.説明 to description';
    END IF;
END $$;

-- 4. Fix remaining equipment_risk_assessment columns
DO $$
BEGIN
    RAISE NOTICE '=== FIXING REMAINING EQUIPMENT_RISK_ASSESSMENT COLUMNS ===';
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = '評価年') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "評価年" TO assessment_year;
        RAISE NOTICE 'Renamed equipment_risk_assessment.評価年 to assessment_year';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = '評価タイミング') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "評価タイミング" TO assessment_timing;
        RAISE NOTICE 'Renamed equipment_risk_assessment.評価タイミング to assessment_timing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'リスク許容性') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "リスク許容性" TO risk_acceptability;
        RAISE NOTICE 'Renamed equipment_risk_assessment.リスク許容性 to risk_acceptability';
    END IF;
END $$;

-- 5. Show what we've accomplished
DO $$
DECLARE
    rec RECORD;
    japanese_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== SCANNING FOR REMAINING JAPANESE COLUMNS ===';
    
    FOR rec IN 
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND (
            column_name ~ '[一-龯ひらがなカタカナ]' OR
            column_name LIKE '%年%' OR
            column_name LIKE '%月%' OR
            column_name LIKE '%日%' OR
            column_name LIKE '%時%' OR
            column_name LIKE '%者%' OR
            column_name LIKE '%別%' OR
            column_name LIKE '%名%' OR
            column_name LIKE '%説%' OR
            column_name LIKE '%期%'
        )
        ORDER BY table_name, column_name
    LOOP
        RAISE NOTICE 'Found potential Japanese column: %.%', rec.table_name, rec.column_name;
        japanese_count := japanese_count + 1;
    END LOOP;
    
    IF japanese_count = 0 THEN
        RAISE NOTICE 'SUCCESS: No Japanese columns found! All columns are now in English.';
    ELSE
        RAISE NOTICE 'Found % potential Japanese columns remaining', japanese_count;
    END IF;
END $$;