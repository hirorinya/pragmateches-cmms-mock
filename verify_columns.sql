-- Verify Current Column Names
-- This will show us what columns exist now

-- Check equipment table columns
SELECT 'equipment' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'equipment' 
ORDER BY ordinal_position;

-- Check equipment_risk_assessment table columns  
SELECT 'equipment_risk_assessment' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'equipment_risk_assessment' 
ORDER BY ordinal_position;

-- Check thickness_measurement table columns
SELECT 'thickness_measurement' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'thickness_measurement' 
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('equipment_risk_assessment', 'thickness_measurement')
ORDER BY tc.table_name;