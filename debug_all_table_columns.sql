-- Comprehensive check for column mismatches across all critical tables

-- 1. Check equipment table structure
SELECT 'EQUIPMENT TABLE COLUMNS:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'equipment' 
ORDER BY ordinal_position;

-- 2. Check work_order table structure  
SELECT 'WORK_ORDER TABLE COLUMNS:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'work_order' 
ORDER BY ordinal_position;

-- 3. Check maintenance_history table structure
SELECT 'MAINTENANCE_HISTORY TABLE COLUMNS:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'maintenance_history' 
ORDER BY ordinal_position;

-- 4. Check inspection_plan table structure
SELECT 'INSPECTION_PLAN TABLE COLUMNS:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'inspection_plan' 
ORDER BY ordinal_position;

-- 5. Check if equipment_type_master exists
SELECT 'EQUIPMENT_TYPE_MASTER EXISTS:' as info;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'equipment_type_master'
) as table_exists;

-- 6. Check equipment_type_master columns if it exists
SELECT 'EQUIPMENT_TYPE_MASTER COLUMNS:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'equipment_type_master' 
ORDER BY ordinal_position;

-- 7. Check for any tables with Japanese column names
SELECT 'TABLES WITH JAPANESE COLUMNS:' as info;
SELECT DISTINCT table_name, column_name
FROM information_schema.columns 
WHERE column_name ~ '[ぁ-ゟ]|[ァ-ヿ]|[一-龯]'
ORDER BY table_name, column_name;