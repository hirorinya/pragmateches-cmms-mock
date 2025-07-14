-- ============================================
-- Fix Remaining Japanese Columns in equipment_risk_assessment and thickness_measurement
-- Created: 2025-07-13
-- Purpose: Rename remaining Japanese column names to English
-- Note: equipment_id was already renamed in previous migration
-- ============================================

-- 1. equipment_risk_assessment table (equipment_id already exists)
-- Check and rename remaining Japanese columns
DO $$
BEGIN
    -- リスクレベル（5段階）
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'リスクレベル（5段階）') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "リスクレベル（5段階）" TO risk_level;
    END IF;

    -- リスクスコア（再計算）
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'リスクスコア（再計算）') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "リスクスコア（再計算）" TO risk_score;
    END IF;

    -- 評価年
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = '評価年') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "評価年" TO assessment_year;
    END IF;

    -- リスクシナリオ  
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'リスクシナリオ') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "リスクシナリオ" TO risk_scenario;
    END IF;

    -- 評価タイミング
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = '評価タイミング') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "評価タイミング" TO assessment_timing;
    END IF;

    -- 緩和策
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = '緩和策') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "緩和策" TO mitigation_measures;
    END IF;

    -- 信頼性ランク（5段階）
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = '信頼性ランク（5段階）') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "信頼性ランク（5段階）" TO reliability_rank;
    END IF;

    -- 影響度ランク（5段階）
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = '影響度ランク（5段階）') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "影響度ランク（5段階）" TO impact_rank;
    END IF;

    -- リスク許容性
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'リスク許容性') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "リスク許容性" TO risk_acceptability;
    END IF;

    -- リスク要因
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'リスク要因') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "リスク要因" TO risk_factor;
    END IF;

    -- 対策内容
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = '対策内容') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "対策内容" TO countermeasure_details;
    END IF;

    -- 評価日
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = '評価日') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "評価日" TO evaluation_date;
    END IF;

    -- 評価者ID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = '評価者ID') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "評価者ID" TO evaluator_id;
    END IF;
END $$;

-- 2. thickness_measurement table (equipment_id already exists)
-- Check and rename remaining Japanese columns
DO $$
BEGIN
    -- 測定点ID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thickness_measurement' AND column_name = '測定点ID') THEN
        ALTER TABLE thickness_measurement RENAME COLUMN "測定点ID" TO measurement_point_id;
    END IF;

    -- 検査日
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thickness_measurement' AND column_name = '検査日') THEN
        ALTER TABLE thickness_measurement RENAME COLUMN "検査日" TO inspection_date;
    END IF;

    -- 設計肉厚(mm)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thickness_measurement' AND column_name = '設計肉厚(mm)') THEN
        ALTER TABLE thickness_measurement RENAME COLUMN "設計肉厚(mm)" TO design_thickness_mm;
    END IF;

    -- 最小許容肉厚(mm)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thickness_measurement' AND column_name = '最小許容肉厚(mm)') THEN
        ALTER TABLE thickness_measurement RENAME COLUMN "最小許容肉厚(mm)" TO minimum_allowable_thickness_mm;
    END IF;

    -- 測定値(mm)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thickness_measurement' AND column_name = '測定値(mm)') THEN
        ALTER TABLE thickness_measurement RENAME COLUMN "測定値(mm)" TO measured_value_mm;
    END IF;

    -- 判定結果
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thickness_measurement' AND column_name = '判定結果') THEN
        ALTER TABLE thickness_measurement RENAME COLUMN "判定結果" TO judgment_result;
    END IF;
END $$;

-- 3. First ensure equipment table has the correct column name
DO $$
BEGIN
    -- Check if equipment table still uses Japanese column name and rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = '設備ID') THEN
        ALTER TABLE equipment RENAME COLUMN "設備ID" TO equipment_id;
        RAISE NOTICE 'Renamed equipment.設備ID to equipment.equipment_id';
    END IF;
    
    -- Also rename other common equipment columns if they still exist in Japanese
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = '設備名') THEN
        ALTER TABLE equipment RENAME COLUMN "設備名" TO equipment_name;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = '設備種別ID') THEN
        ALTER TABLE equipment RENAME COLUMN "設備種別ID" TO equipment_type_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = '設置場所') THEN
        ALTER TABLE equipment RENAME COLUMN "設置場所" TO location;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = '稼働状態') THEN
        ALTER TABLE equipment RENAME COLUMN "稼働状態" TO operational_status;
    END IF;
END $$;

-- 4. Update foreign key constraints to use correct references
DO $$
DECLARE
    equipment_id_exists BOOLEAN;
BEGIN
    -- Check if equipment table has equipment_id column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'equipment' AND column_name = 'equipment_id'
    ) INTO equipment_id_exists;

    -- Drop existing foreign key constraints
    ALTER TABLE equipment_risk_assessment DROP CONSTRAINT IF EXISTS fk_equipment_risk_assessment_equipment;
    ALTER TABLE thickness_measurement DROP CONSTRAINT IF EXISTS fk_thickness_measurement_equipment;

    -- Create foreign key constraints based on equipment table structure
    IF equipment_id_exists THEN
        -- equipment table uses equipment_id
        ALTER TABLE equipment_risk_assessment 
        ADD CONSTRAINT fk_equipment_risk_assessment_equipment 
        FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id);

        ALTER TABLE thickness_measurement 
        ADD CONSTRAINT fk_thickness_measurement_equipment 
        FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id);
        
        RAISE NOTICE 'Created foreign key constraints referencing equipment.equipment_id';
    ELSE
        -- equipment table still uses 設備ID (fallback)
        ALTER TABLE equipment_risk_assessment 
        ADD CONSTRAINT fk_equipment_risk_assessment_equipment 
        FOREIGN KEY (equipment_id) REFERENCES equipment("設備ID");

        ALTER TABLE thickness_measurement 
        ADD CONSTRAINT fk_thickness_measurement_equipment 
        FOREIGN KEY (equipment_id) REFERENCES equipment("設備ID");
        
        RAISE NOTICE 'Created foreign key constraints referencing equipment.設備ID';
    END IF;
END $$;

-- 5. Update indexes for performance
DROP INDEX IF EXISTS idx_equipment_risk_assessment_date;
DROP INDEX IF EXISTS idx_thickness_measurement_date;

-- Create new indexes with English column names
CREATE INDEX IF NOT EXISTS idx_equipment_risk_assessment_evaluation_date ON equipment_risk_assessment(evaluation_date);
CREATE INDEX IF NOT EXISTS idx_thickness_measurement_inspection_date ON thickness_measurement(inspection_date);
CREATE INDEX IF NOT EXISTS idx_equipment_risk_assessment_risk_score ON equipment_risk_assessment(risk_score);

-- Log migration
INSERT INTO migration_log (migration_name, applied_at, description) 
VALUES (
  '20250713_fix_remaining_japanese_columns',
  NOW(),
  'Fixed remaining Japanese column names in equipment_risk_assessment and thickness_measurement tables'
) ON CONFLICT DO NOTHING;