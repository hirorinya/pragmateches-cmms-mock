-- Check if the foreign key relationship exists
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='equipment_risk_assessment'
AND kcu.column_name = 'scenario_id';

-- Check if risk_scenario_master table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'risk_scenario_master'
);

-- Check current equipment_risk_assessment structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'equipment_risk_assessment'
ORDER BY ordinal_position;