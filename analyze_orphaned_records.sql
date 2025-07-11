-- ============================================
-- Orphaned Records Analysis Script
-- Created: 2025-07-11
-- Purpose: Identify and analyze orphaned records in CMMS database
-- ============================================

-- 1. Check Equipment Table Structure and Data
SELECT '=== EQUIPMENT TABLE ANALYSIS ===' as section;
SELECT 
    COUNT(*) as total_equipment,
    MIN("設備ID") as min_equipment_id,
    MAX("設備ID") as max_equipment_id
FROM equipment;

-- Sample equipment records
SELECT "設備ID", "設備名", "設備種別ID", "システムID"
FROM equipment 
ORDER BY "設備ID"
LIMIT 10;

-- 2. Check Maintenance History Table for Orphaned Records
SELECT '=== MAINTENANCE HISTORY ORPHANED RECORDS ===' as section;

-- Get all equipment IDs from equipment table
WITH valid_equipment AS (
    SELECT "設備ID" as equipment_id FROM equipment
),
-- Get maintenance records that reference non-existent equipment
orphaned_maintenance AS (
    SELECT 
        "履歴ID" as maintenance_id,
        "設備ID" as equipment_id,
        "実施日" as implementation_date,
        "作業内容" as work_content
    FROM maintenance_history 
    WHERE "設備ID" NOT IN (SELECT equipment_id FROM valid_equipment)
)
SELECT 
    'Orphaned maintenance records:' as analysis,
    COUNT(*) as count,
    STRING_AGG(DISTINCT equipment_id, ', ') as orphaned_equipment_ids
FROM orphaned_maintenance;

-- Show detailed orphaned maintenance records
SELECT 
    maintenance_id,
    equipment_id,
    implementation_date,
    work_content
FROM (
    SELECT 
        "履歴ID" as maintenance_id,
        "設備ID" as equipment_id,
        "実施日" as implementation_date,
        "作業内容" as work_content
    FROM maintenance_history 
    WHERE "設備ID" NOT IN (SELECT "設備ID" FROM equipment)
) orphaned_maintenance
ORDER BY equipment_id
LIMIT 10;

-- 3. Check Process Parameters Table for Orphaned Records
SELECT '=== PROCESS PARAMETERS ORPHANED RECORDS ===' as section;

-- Get process parameters that reference non-existent equipment
WITH valid_equipment AS (
    SELECT "設備ID" as equipment_id FROM equipment
),
orphaned_parameters AS (
    SELECT 
        parameter_id,
        parameter_name,
        equipment_id,
        tag_name,
        parameter_type
    FROM process_parameters 
    WHERE equipment_id NOT IN (SELECT equipment_id FROM valid_equipment)
)
SELECT 
    'Orphaned process parameters:' as analysis,
    COUNT(*) as count,
    STRING_AGG(DISTINCT equipment_id, ', ') as orphaned_equipment_ids
FROM orphaned_parameters;

-- Show detailed orphaned process parameters
SELECT 
    parameter_id,
    parameter_name,
    equipment_id,
    tag_name,
    parameter_type
FROM process_parameters 
WHERE equipment_id NOT IN (SELECT "設備ID" FROM equipment)
ORDER BY equipment_id
LIMIT 10;

-- 4. Check Equipment System Mappings
SELECT '=== EQUIPMENT SYSTEM MAPPINGS ANALYSIS ===' as section;

-- Check if equipment_system_mapping table exists and has data
SELECT 
    'Equipment with system mappings:' as analysis,
    COUNT(*) as count
FROM equipment_system_mapping;

-- Check equipment without system mappings
SELECT 
    'Equipment without system mappings:' as analysis,
    COUNT(*) as count
FROM equipment e
LEFT JOIN equipment_system_mapping esm ON e."設備ID" = esm.equipment_id
WHERE esm.equipment_id IS NULL;

-- 5. Summary of Data Integrity Issues
SELECT '=== DATA INTEGRITY SUMMARY ===' as section;

-- Count all types of issues
SELECT 
    'Total equipment records' as metric,
    COUNT(*) as value
FROM equipment
UNION ALL
SELECT 
    'Orphaned maintenance records' as metric,
    COUNT(*) as value
FROM maintenance_history 
WHERE "設備ID" NOT IN (SELECT "設備ID" FROM equipment)
UNION ALL
SELECT 
    'Orphaned process parameters' as metric,
    COUNT(*) as value
FROM process_parameters 
WHERE equipment_id NOT IN (SELECT "設備ID" FROM equipment)
UNION ALL
SELECT 
    'Equipment without system mappings' as metric,
    COUNT(*) as value
FROM equipment e
LEFT JOIN equipment_system_mapping esm ON e."設備ID" = esm.equipment_id
WHERE esm.equipment_id IS NULL;

-- 6. Recommendations for Cleanup
SELECT '=== CLEANUP RECOMMENDATIONS ===' as section;

SELECT 
    'ORPHANED MAINTENANCE RECORDS' as issue_type,
    'DELETE FROM maintenance_history WHERE "設備ID" NOT IN (SELECT "設備ID" FROM equipment)' as cleanup_sql,
    'Remove maintenance records that reference non-existent equipment' as description
UNION ALL
SELECT 
    'ORPHANED PROCESS PARAMETERS' as issue_type,
    'DELETE FROM process_parameters WHERE equipment_id NOT IN (SELECT "設備ID" FROM equipment)' as cleanup_sql,
    'Remove process parameters that reference non-existent equipment' as description
UNION ALL
SELECT 
    'MISSING SYSTEM MAPPINGS' as issue_type,
    'INSERT INTO equipment_system_mapping (equipment_id, system_id, role_in_system) SELECT "設備ID", ''SYS-001'', ''STANDARD'' FROM equipment WHERE "設備ID" NOT IN (SELECT equipment_id FROM equipment_system_mapping)' as cleanup_sql,
    'Add default system mappings for unmapped equipment' as description;