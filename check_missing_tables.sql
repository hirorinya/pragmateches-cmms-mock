-- Check for tables that services expect but may not exist

-- 1. Check if equipment_type_master exists (heavily referenced in joins)
SELECT 'equipment_type_master exists:' as check_name, 
       EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'equipment_type_master') as exists;

-- 2. Check if work_type_master exists (referenced in work_order joins)
SELECT 'work_type_master exists:' as check_name,
       EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'work_type_master') as exists;

-- 3. Check if inspection_cycle_master exists (referenced in inspection queries)
SELECT 'inspection_cycle_master exists:' as check_name,
       EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inspection_cycle_master') as exists;

-- 4. Check if staff_master exists (referenced in assignments)
SELECT 'staff_master exists:' as check_name,
       EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'staff_master') as exists;

-- 5. List all existing tables to see what's actually available
SELECT 'Available tables:' as info, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;