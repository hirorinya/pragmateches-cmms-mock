-- Fix equipment_risk_assessment table by adding missing columns
-- Based on the text-to-sql-service.ts expectations

DO $$
BEGIN
    -- Check if table exists, if not create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment_risk_assessment') THEN
        CREATE TABLE equipment_risk_assessment (
            id SERIAL PRIMARY KEY,
            equipment_id TEXT NOT NULL,
            risk_level TEXT,
            risk_score DECIMAL,
            risk_scenario TEXT,
            risk_factor TEXT,
            impact_rank TEXT,
            reliability_rank TEXT,
            detection_rank TEXT,
            mitigation_measures TEXT,
            countermeasure_details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Add foreign key constraint
        ALTER TABLE equipment_risk_assessment 
        ADD CONSTRAINT fk_equipment_risk_equipment_id 
        FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id);
        
        RAISE NOTICE 'Created equipment_risk_assessment table';
    ELSE
        -- Table exists, add missing columns if they don't exist
        
        -- Add risk_factor column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'risk_factor') THEN
            ALTER TABLE equipment_risk_assessment ADD COLUMN risk_factor TEXT;
            RAISE NOTICE 'Added risk_factor column';
        END IF;
        
        -- Add impact_rank column if missing  
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'impact_rank') THEN
            ALTER TABLE equipment_risk_assessment ADD COLUMN impact_rank TEXT;
            RAISE NOTICE 'Added impact_rank column';
        END IF;
        
        -- Add reliability_rank column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'reliability_rank') THEN
            ALTER TABLE equipment_risk_assessment ADD COLUMN reliability_rank TEXT;
            RAISE NOTICE 'Added reliability_rank column';
        END IF;
        
        -- Add detection_rank column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'detection_rank') THEN
            ALTER TABLE equipment_risk_assessment ADD COLUMN detection_rank TEXT;
            RAISE NOTICE 'Added detection_rank column';
        END IF;
        
        -- Add mitigation_measures column if missing (different from mitigation_strategy)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'mitigation_measures') THEN
            ALTER TABLE equipment_risk_assessment ADD COLUMN mitigation_measures TEXT;
            RAISE NOTICE 'Added mitigation_measures column';
        END IF;
        
        -- Add countermeasure_details column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'countermeasure_details') THEN
            ALTER TABLE equipment_risk_assessment ADD COLUMN countermeasure_details TEXT;
            RAISE NOTICE 'Added countermeasure_details column';
        END IF;
        
        -- Add risk_level column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'risk_level') THEN
            ALTER TABLE equipment_risk_assessment ADD COLUMN risk_level TEXT;
            RAISE NOTICE 'Added risk_level column';
        END IF;
        
        -- Add risk_scenario column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_risk_assessment' AND column_name = 'risk_scenario') THEN
            ALTER TABLE equipment_risk_assessment ADD COLUMN risk_scenario TEXT;
            RAISE NOTICE 'Added risk_scenario column';
        END IF;
        
        RAISE NOTICE 'Checked and added missing columns to equipment_risk_assessment table';
    END IF;
    
    -- Insert sample data if table is empty
    IF NOT EXISTS (SELECT 1 FROM equipment_risk_assessment LIMIT 1) THEN
        -- Insert sample risk assessment data for existing equipment
        INSERT INTO equipment_risk_assessment (
            equipment_id, risk_level, risk_score, risk_scenario, risk_factor,
            impact_rank, reliability_rank, detection_rank, mitigation_measures
        ) VALUES 
        ('HX-101', 'High', 120, 'Corrosion failure', 'Environmental exposure', 'High', 'Medium', 'Low', 'Regular thickness monitoring'),
        ('PU-200', 'Medium', 80, 'Bearing wear', 'Mechanical stress', 'Medium', 'Medium', 'Medium', 'Vibration monitoring'),
        ('TK-101', 'Low', 45, 'Coating degradation', 'Chemical exposure', 'Low', 'High', 'High', 'Inspection schedule'),
        ('HX-102', 'High', 150, 'Fouling buildup', 'Process contamination', 'High', 'Low', 'Medium', 'Regular cleaning'),
        ('PU-201', 'Medium', 90, 'Seal failure', 'Thermal cycling', 'Medium', 'Medium', 'Low', 'Preventive replacement')
        ON CONFLICT (equipment_id) DO NOTHING;
        
        RAISE NOTICE 'Added sample risk assessment data';
    END IF;
END $$;