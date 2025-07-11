-- ============================================
-- Cleanup Verification Script
-- Created: 2025-07-11
-- Purpose: Verify that orphaned records cleanup was successful
-- ============================================

-- 1. Check for remaining orphaned records
SELECT '=== ORPHANED RECORDS VERIFICATION ===' as section;

-- Check maintenance history orphaned records
SELECT 
    'Maintenance History Orphaned Records:' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS' 
        ELSE 'FAIL' 
    END as status
FROM maintenance_history mh
LEFT JOIN equipment e ON mh."設備ID" = e."設備ID"
WHERE e."設備ID" IS NULL;

-- Check process parameters orphaned records
SELECT 
    'Process Parameters Orphaned Records:' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS' 
        ELSE 'FAIL' 
    END as status
FROM process_parameters pp
LEFT JOIN equipment e ON pp.equipment_id = e."設備ID"
WHERE e."設備ID" IS NULL;

-- 2. Check equipment system mappings
SELECT 
    'Equipment System Mappings:' as check_type,
    COUNT(*) as unmapped_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS' 
        ELSE 'WARNING' 
    END as status
FROM equipment e
LEFT JOIN equipment_system_mapping esm ON e."設備ID" = esm.equipment_id
WHERE esm.equipment_id IS NULL;

-- 3. Check foreign key constraints
SELECT '=== FOREIGN KEY CONSTRAINTS VERIFICATION ===' as section;

-- Check if foreign key constraints exist
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('maintenance_history', 'process_parameters')
ORDER BY tc.table_name, tc.constraint_name;

-- 4. Data integrity summary
SELECT '=== DATA INTEGRITY SUMMARY ===' as section;

-- Count all records
SELECT 
    'Equipment Records' as table_name,
    COUNT(*) as record_count
FROM equipment
UNION ALL
SELECT 
    'Maintenance History Records' as table_name,
    COUNT(*) as record_count
FROM maintenance_history
UNION ALL
SELECT 
    'Process Parameters Records' as table_name,
    COUNT(*) as record_count
FROM process_parameters
UNION ALL
SELECT 
    'Equipment System Mappings' as table_name,
    COUNT(*) as record_count
FROM equipment_system_mapping;

-- 5. Sample data verification
SELECT '=== SAMPLE DATA VERIFICATION ===' as section;

-- Sample equipment with maintenance history
SELECT 
    'Equipment with Maintenance History:' as check_type,
    e."設備ID",
    e."設備名",
    COUNT(mh."履歴ID") as maintenance_count
FROM equipment e
LEFT JOIN maintenance_history mh ON e."設備ID" = mh."設備ID"
GROUP BY e."設備ID", e."設備名"
HAVING COUNT(mh."履歴ID") > 0
ORDER BY maintenance_count DESC
LIMIT 5;

-- Sample equipment with process parameters
SELECT 
    'Equipment with Process Parameters:' as check_type,
    e."設備ID",
    e."設備名",
    COUNT(pp.parameter_id) as parameter_count
FROM equipment e
LEFT JOIN process_parameters pp ON e."設備ID" = pp.equipment_id
GROUP BY e."設備ID", e."設備名"
HAVING COUNT(pp.parameter_id) > 0
ORDER BY parameter_count DESC
LIMIT 5;

-- 6. Check backup tables
SELECT '=== BACKUP VERIFICATION ===' as section;

-- Check if backup tables exist and contain data
SELECT 
    'Maintenance History Backup' as backup_table,
    COUNT(*) as backed_up_records
FROM maintenance_history_backup
UNION ALL
SELECT 
    'Process Parameters Backup' as backup_table,
    COUNT(*) as backed_up_records
FROM process_parameters_backup;

-- 7. Migration log verification
SELECT '=== MIGRATION LOG ===' as section;

-- Check migration log entries
SELECT 
    migration_name,
    applied_at,
    description
FROM migration_log
WHERE migration_name LIKE '%cleanup_orphaned_records%'
ORDER BY applied_at DESC;

-- 8. Final status report
SELECT '=== FINAL STATUS REPORT ===' as section;

-- Overall data integrity status
WITH integrity_checks AS (
    SELECT 
        'Orphaned Maintenance Records' as check_name,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status,
        COUNT(*) as issue_count
    FROM maintenance_history mh
    LEFT JOIN equipment e ON mh."設備ID" = e."設備ID"
    WHERE e."設備ID" IS NULL
    
    UNION ALL
    
    SELECT 
        'Orphaned Process Parameters' as check_name,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status,
        COUNT(*) as issue_count
    FROM process_parameters pp
    LEFT JOIN equipment e ON pp.equipment_id = e."設備ID"
    WHERE e."設備ID" IS NULL
    
    UNION ALL
    
    SELECT 
        'Equipment System Mappings' as check_name,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARNING' END as status,
        COUNT(*) as issue_count
    FROM equipment e
    LEFT JOIN equipment_system_mapping esm ON e."設備ID" = esm.equipment_id
    WHERE esm.equipment_id IS NULL
)
SELECT 
    check_name,
    status,
    issue_count,
    CASE 
        WHEN status = 'PASS' THEN 'No issues found'
        WHEN status = 'WARNING' THEN 'Minor issues that may need attention'
        ELSE 'Critical issues that require immediate attention'
    END as recommendation
FROM integrity_checks;

-- 9. Performance verification
SELECT '=== PERFORMANCE VERIFICATION ===' as section;

-- Check if indexes exist
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('maintenance_history', 'process_parameters', 'equipment')
    AND indexname LIKE '%equipment%'
ORDER BY tablename, indexname;