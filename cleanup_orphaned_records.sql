-- ============================================
-- Orphaned Records Cleanup Script
-- Created: 2025-07-11
-- Purpose: Safely clean up orphaned records in CMMS database
-- ============================================

-- Before running this script, ALWAYS backup your database
-- Run analyze_orphaned_records.sql first to understand the scope of issues

BEGIN;

-- 1. Create backup tables for safety
CREATE TABLE IF NOT EXISTS maintenance_history_backup AS
SELECT * FROM maintenance_history WHERE 1=0;

CREATE TABLE IF NOT EXISTS process_parameters_backup AS
SELECT * FROM process_parameters WHERE 1=0;

-- 2. Backup orphaned records before deletion
INSERT INTO maintenance_history_backup
SELECT * FROM maintenance_history 
WHERE "設備ID" NOT IN (SELECT "設備ID" FROM equipment);

INSERT INTO process_parameters_backup
SELECT * FROM process_parameters 
WHERE equipment_id NOT IN (SELECT "設備ID" FROM equipment);

-- 3. Log the cleanup operation
INSERT INTO migration_log (migration_name, applied_at, description) 
VALUES (
    'cleanup_orphaned_records',
    NOW(),
    'Backed up and cleaned orphaned maintenance_history and process_parameters records'
);

-- 4. Show what will be deleted (for verification)
SELECT 
    'ORPHANED MAINTENANCE RECORDS TO BE DELETED:' as info,
    COUNT(*) as count,
    STRING_AGG(DISTINCT "設備ID", ', ') as equipment_ids
FROM maintenance_history 
WHERE "設備ID" NOT IN (SELECT "設備ID" FROM equipment);

SELECT 
    'ORPHANED PROCESS PARAMETERS TO BE DELETED:' as info,
    COUNT(*) as count,
    STRING_AGG(DISTINCT equipment_id, ', ') as equipment_ids
FROM process_parameters 
WHERE equipment_id NOT IN (SELECT "設備ID" FROM equipment);

-- 5. Clean up orphaned maintenance history records
DELETE FROM maintenance_history 
WHERE "設備ID" NOT IN (SELECT "設備ID" FROM equipment);

-- 6. Clean up orphaned process parameters
DELETE FROM process_parameters 
WHERE equipment_id NOT IN (SELECT "設備ID" FROM equipment);

-- 7. Add missing equipment system mappings (assign to default system)
INSERT INTO equipment_system_mapping (equipment_id, system_id, role_in_system)
SELECT 
    "設備ID",
    'SYS-001',
    'STANDARD'
FROM equipment e
WHERE "設備ID" NOT IN (SELECT equipment_id FROM equipment_system_mapping)
ON CONFLICT (equipment_id, system_id) DO NOTHING;

-- 8. Verify cleanup results
SELECT 
    'POST-CLEANUP VERIFICATION:' as info,
    'Remaining orphaned maintenance records' as metric,
    COUNT(*) as count
FROM maintenance_history 
WHERE "設備ID" NOT IN (SELECT "設備ID" FROM equipment)
UNION ALL
SELECT 
    'POST-CLEANUP VERIFICATION:' as info,
    'Remaining orphaned process parameters' as metric,
    COUNT(*) as count
FROM process_parameters 
WHERE equipment_id NOT IN (SELECT "設備ID" FROM equipment)
UNION ALL
SELECT 
    'POST-CLEANUP VERIFICATION:' as info,
    'Equipment without system mappings' as metric,
    COUNT(*) as count
FROM equipment e
LEFT JOIN equipment_system_mapping esm ON e."設備ID" = esm.equipment_id
WHERE esm.equipment_id IS NULL;

-- 9. Add foreign key constraints to prevent future orphaned records
-- Note: This will prevent future orphaned records but may cause issues if not properly managed

-- Add constraint for maintenance_history
ALTER TABLE maintenance_history 
ADD CONSTRAINT fk_maintenance_equipment 
FOREIGN KEY ("設備ID") REFERENCES equipment("設備ID") 
ON DELETE CASCADE;

-- Add constraint for process_parameters
ALTER TABLE process_parameters 
ADD CONSTRAINT fk_process_parameters_equipment 
FOREIGN KEY (equipment_id) REFERENCES equipment("設備ID") 
ON DELETE CASCADE;

-- 10. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_history_equipment_id 
ON maintenance_history("設備ID");

CREATE INDEX IF NOT EXISTS idx_process_parameters_equipment_id 
ON process_parameters(equipment_id);

-- Log completion
INSERT INTO migration_log (migration_name, applied_at, description) 
VALUES (
    'cleanup_orphaned_records_complete',
    NOW(),
    'Completed orphaned records cleanup and added foreign key constraints'
);

COMMIT;

-- 11. Final verification queries
SELECT 
    'CLEANUP SUMMARY:' as summary,
    'Total equipment records' as metric,
    COUNT(*) as value
FROM equipment
UNION ALL
SELECT 
    'CLEANUP SUMMARY:' as summary,
    'Total maintenance records' as metric,
    COUNT(*) as value
FROM maintenance_history
UNION ALL
SELECT 
    'CLEANUP SUMMARY:' as summary,
    'Total process parameters' as metric,
    COUNT(*) as value
FROM process_parameters
UNION ALL
SELECT 
    'CLEANUP SUMMARY:' as summary,
    'Equipment with system mappings' as metric,
    COUNT(*) as value
FROM equipment_system_mapping;

-- Show backed up records for reference
SELECT 
    'BACKED UP RECORDS:' as info,
    'Maintenance history backup count' as metric,
    COUNT(*) as value
FROM maintenance_history_backup
UNION ALL
SELECT 
    'BACKED UP RECORDS:' as info,
    'Process parameters backup count' as metric,
    COUNT(*) as value
FROM process_parameters_backup;