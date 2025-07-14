-- Final verification of all English column names
-- This will show us the current state of all tables

-- 1. Check work_order table (had the most Japanese columns)
SELECT 'work_order' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'work_order' 
ORDER BY ordinal_position;

-- 2. Check anomaly_report table  
SELECT 'anomaly_report' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'anomaly_report' 
ORDER BY ordinal_position;

-- 3. Check inspection_cycle_master table
SELECT 'inspection_cycle_master' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'inspection_cycle_master' 
ORDER BY ordinal_position;

-- 4. Check equipment_risk_assessment table
SELECT 'equipment_risk_assessment' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'equipment_risk_assessment' 
ORDER BY ordinal_position;

-- 5. Scan for any remaining Japanese columns across ALL tables
SELECT 
    table_name, 
    column_name,
    'POTENTIAL_JAPANESE' as status
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
    column_name LIKE '%期%' OR
    column_name LIKE '%因%' OR
    column_name LIKE '%法%' OR
    column_name LIKE '%報%' OR
    column_name LIKE '%解%' OR
    column_name LIKE '%決%' OR
    column_name LIKE '%状%' OR
    column_name LIKE '%態%' OR
    column_name LIKE '%備%' OR
    column_name LIKE '%考%'
)
ORDER BY table_name, column_name;