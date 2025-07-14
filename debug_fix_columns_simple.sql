-- ============================================
-- Debug and Fix Column Names - Direct Approach
-- Created: 2025-07-13
-- Purpose: Diagnose current state and fix column naming issues
-- ============================================

-- 1. First, let's see what columns actually exist in each table
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '=== CURRENT TABLE STRUCTURES ===';
    
    -- Check equipment table
    RAISE NOTICE 'Equipment table columns:';
    FOR rec IN 
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'equipment' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: %', rec.column_name, rec.data_type;
    END LOOP;
    
    -- Check equipment_risk_assessment table
    RAISE NOTICE 'Equipment_risk_assessment table columns:';
    FOR rec IN 
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'equipment_risk_assessment' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: %', rec.column_name, rec.data_type;
    END LOOP;
    
    -- Check thickness_measurement table
    RAISE NOTICE 'Thickness_measurement table columns:';
    FOR rec IN 
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'thickness_measurement' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: %', rec.column_name, rec.data_type;
    END LOOP;
END $$;

-- 2. Drop all existing foreign key constraints first
DO $$
BEGIN
    RAISE NOTICE '=== DROPPING EXISTING CONSTRAINTS ===';
    
    -- Drop constraints that might exist
    ALTER TABLE equipment_risk_assessment DROP CONSTRAINT IF EXISTS fk_equipment_risk_assessment_equipment;
    ALTER TABLE thickness_measurement DROP CONSTRAINT IF EXISTS fk_thickness_measurement_equipment;
    
    RAISE NOTICE 'Dropped existing foreign key constraints';
END $$;

-- 3. Fix equipment table columns if needed
DO $$
BEGIN
    RAISE NOTICE '=== FIXING EQUIPMENT TABLE ===';
    
    -- Check if equipment table has Japanese columns and rename them
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = '設備ID') THEN
        ALTER TABLE equipment RENAME COLUMN "設備ID" TO equipment_id;
        RAISE NOTICE 'Renamed equipment.設備ID to equipment_id';
    ELSE
        RAISE NOTICE 'Equipment table already has equipment_id or column does not exist';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = '設備名') THEN
        ALTER TABLE equipment RENAME COLUMN "設備名" TO equipment_name;
        RAISE NOTICE 'Renamed equipment.設備名 to equipment_name';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = '設備種別ID') THEN
        ALTER TABLE equipment RENAME COLUMN "設備種別ID" TO equipment_type_id;
        RAISE NOTICE 'Renamed equipment.設備種別ID to equipment_type_id';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = '設置場所') THEN
        ALTER TABLE equipment RENAME COLUMN "設置場所" TO location;
        RAISE NOTICE 'Renamed equipment.設置場所 to location';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = '稼働状態') THEN
        ALTER TABLE equipment RENAME COLUMN "稼働状態" TO operational_status;
        RAISE NOTICE 'Renamed equipment.稼働状態 to operational_status';
    END IF;
END $$;

-- 4. Fix equipment_risk_assessment table columns
DO $$
BEGIN
    RAISE NOTICE '=== FIXING EQUIPMENT_RISK_ASSESSMENT TABLE ===';
    
    -- First check if equipment_id column exists, if not check for Japanese equivalent
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'equipment_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = '機器ID') THEN
            ALTER TABLE equipment_risk_assessment RENAME COLUMN "機器ID" TO equipment_id;
            RAISE NOTICE 'Renamed equipment_risk_assessment.機器ID to equipment_id';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = '設備ID') THEN
            ALTER TABLE equipment_risk_assessment RENAME COLUMN "設備ID" TO equipment_id;
            RAISE NOTICE 'Renamed equipment_risk_assessment.設備ID to equipment_id';
        ELSE
            RAISE NOTICE 'No equipment ID column found in equipment_risk_assessment table';
        END IF;
    ELSE
        RAISE NOTICE 'Equipment_risk_assessment already has equipment_id column';
    END IF;
    
    -- Fix other columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'リスクレベル（5段階）') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "リスクレベル（5段階）" TO risk_level;
        RAISE NOTICE 'Renamed risk_level column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'リスクスコア（再計算）') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "リスクスコア（再計算）" TO risk_score;
        RAISE NOTICE 'Renamed risk_score column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'リスクシナリオ') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "リスクシナリオ" TO risk_scenario;
        RAISE NOTICE 'Renamed risk_scenario column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = '緩和策') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "緩和策" TO mitigation_measures;
        RAISE NOTICE 'Renamed mitigation_measures column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = '信頼性ランク（5段階）') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "信頼性ランク（5段階）" TO reliability_rank;
        RAISE NOTICE 'Renamed reliability_rank column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = '影響度ランク（5段階）') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "影響度ランク（5段階）" TO impact_rank;
        RAISE NOTICE 'Renamed impact_rank column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'リスク要因') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "リスク要因" TO risk_factor;
        RAISE NOTICE 'Renamed risk_factor column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = '対策内容') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "対策内容" TO countermeasure_details;
        RAISE NOTICE 'Renamed countermeasure_details column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = '評価日') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "評価日" TO evaluation_date;
        RAISE NOTICE 'Renamed evaluation_date column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = '評価者ID') THEN
        ALTER TABLE equipment_risk_assessment RENAME COLUMN "評価者ID" TO evaluator_id;
        RAISE NOTICE 'Renamed evaluator_id column';
    END IF;
END $$;

-- 5. Fix thickness_measurement table columns  
DO $$
BEGIN
    RAISE NOTICE '=== FIXING THICKNESS_MEASUREMENT TABLE ===';
    
    -- First check if equipment_id column exists, if not check for Japanese equivalent
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thickness_measurement' AND column_name = 'equipment_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thickness_measurement' AND column_name = '機器ID') THEN
            ALTER TABLE thickness_measurement RENAME COLUMN "機器ID" TO equipment_id;
            RAISE NOTICE 'Renamed thickness_measurement.機器ID to equipment_id';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thickness_measurement' AND column_name = '設備ID') THEN
            ALTER TABLE thickness_measurement RENAME COLUMN "設備ID" TO equipment_id;
            RAISE NOTICE 'Renamed thickness_measurement.設備ID to equipment_id';
        ELSE
            RAISE NOTICE 'No equipment ID column found in thickness_measurement table';
        END IF;
    ELSE
        RAISE NOTICE 'Thickness_measurement already has equipment_id column';
    END IF;
    
    -- Fix other columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thickness_measurement' AND column_name = '測定点ID') THEN
        ALTER TABLE thickness_measurement RENAME COLUMN "測定点ID" TO measurement_point_id;
        RAISE NOTICE 'Renamed measurement_point_id column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thickness_measurement' AND column_name = '検査日') THEN
        ALTER TABLE thickness_measurement RENAME COLUMN "検査日" TO inspection_date;
        RAISE NOTICE 'Renamed inspection_date column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thickness_measurement' AND column_name = '設計肉厚(mm)') THEN
        ALTER TABLE thickness_measurement RENAME COLUMN "設計肉厚(mm)" TO design_thickness_mm;
        RAISE NOTICE 'Renamed design_thickness_mm column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thickness_measurement' AND column_name = '最小許容肉厚(mm)') THEN
        ALTER TABLE thickness_measurement RENAME COLUMN "最小許容肉厚(mm)" TO minimum_allowable_thickness_mm;
        RAISE NOTICE 'Renamed minimum_allowable_thickness_mm column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thickness_measurement' AND column_name = '測定値(mm)') THEN
        ALTER TABLE thickness_measurement RENAME COLUMN "測定値(mm)" TO measured_value_mm;
        RAISE NOTICE 'Renamed measured_value_mm column';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'thickness_measurement' AND column_name = '判定結果') THEN
        ALTER TABLE thickness_measurement RENAME COLUMN "判定結果" TO judgment_result;
        RAISE NOTICE 'Renamed judgment_result column';
    END IF;
END $$;

-- 6. Show final table structures
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '=== FINAL TABLE STRUCTURES ===';
    
    -- Check equipment table
    RAISE NOTICE 'Equipment table columns after migration:';
    FOR rec IN 
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'equipment' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: %', rec.column_name, rec.data_type;
    END LOOP;
    
    -- Check equipment_risk_assessment table
    RAISE NOTICE 'Equipment_risk_assessment table columns after migration:';
    FOR rec IN 
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'equipment_risk_assessment' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: %', rec.column_name, rec.data_type;
    END LOOP;
    
    -- Check thickness_measurement table
    RAISE NOTICE 'Thickness_measurement table columns after migration:';
    FOR rec IN 
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'thickness_measurement' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: %', rec.column_name, rec.data_type;
    END LOOP;
END $$;

-- 7. Now create foreign key constraints based on what actually exists
DO $$
DECLARE
    equipment_has_equipment_id BOOLEAN;
    era_has_equipment_id BOOLEAN;
    tm_has_equipment_id BOOLEAN;
BEGIN
    RAISE NOTICE '=== CREATING FOREIGN KEY CONSTRAINTS ===';
    
    -- Check what columns actually exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'equipment' AND column_name = 'equipment_id'
    ) INTO equipment_has_equipment_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'equipment_risk_assessment' AND column_name = 'equipment_id'
    ) INTO era_has_equipment_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'thickness_measurement' AND column_name = 'equipment_id'
    ) INTO tm_has_equipment_id;
    
    -- Create constraints if both sides exist
    IF equipment_has_equipment_id AND era_has_equipment_id THEN
        ALTER TABLE equipment_risk_assessment 
        ADD CONSTRAINT fk_equipment_risk_assessment_equipment 
        FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id);
        RAISE NOTICE 'Created foreign key: equipment_risk_assessment.equipment_id -> equipment.equipment_id';
    ELSE
        RAISE NOTICE 'Cannot create equipment_risk_assessment foreign key - missing columns (equipment.equipment_id: %, equipment_risk_assessment.equipment_id: %)', equipment_has_equipment_id, era_has_equipment_id;
    END IF;
    
    IF equipment_has_equipment_id AND tm_has_equipment_id THEN
        ALTER TABLE thickness_measurement 
        ADD CONSTRAINT fk_thickness_measurement_equipment 
        FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id);
        RAISE NOTICE 'Created foreign key: thickness_measurement.equipment_id -> equipment.equipment_id';
    ELSE
        RAISE NOTICE 'Cannot create thickness_measurement foreign key - missing columns (equipment.equipment_id: %, thickness_measurement.equipment_id: %)', equipment_has_equipment_id, tm_has_equipment_id;
    END IF;
END $$;

-- 8. Create indexes
CREATE INDEX IF NOT EXISTS idx_equipment_risk_assessment_equipment_id ON equipment_risk_assessment(equipment_id);
CREATE INDEX IF NOT EXISTS idx_thickness_measurement_equipment_id ON thickness_measurement(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_risk_assessment_risk_score ON equipment_risk_assessment(risk_score);