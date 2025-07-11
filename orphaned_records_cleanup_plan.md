# Orphaned Records Cleanup Plan

## Executive Summary

The CMMS database has been identified with **2 WARNING issues** related to orphaned records:
1. **5 maintenance records** reference non-existent equipment
2. **5 process parameters** reference non-existent equipment

This document provides a comprehensive analysis and safe cleanup strategy.

## Current State Analysis

### Data Integrity Issues Found

Based on the API response from `/api/data-integrity`:

```json
{
  "checks": [
    {
      "check_name": "Orphaned Records",
      "status": "WARNING",
      "description": "Found orphaned records in 2 table(s)",
      "details": "5 maintenance records reference non-existent equipment; 5 process parameters reference non-existent equipment"
    }
  ]
}
```

### Root Cause Analysis

1. **Table Relationship Mismatches**: The database uses both Japanese (`設備ID`) and English (`equipment_id`) field names
2. **Missing Foreign Key Constraints**: Tables allow insertion of records referencing non-existent equipment
3. **Historical Data Migration**: Previous migrations may have created orphaned records
4. **Inconsistent Data Entry**: Manual data entry without proper validation

### Affected Tables

1. **maintenance_history** table
   - Field: `設備ID` (Japanese field name)
   - Issue: 5 records reference non-existent equipment IDs
   - Impact: Historical maintenance data appears corrupted

2. **process_parameters** table
   - Field: `equipment_id` (English field name)
   - Issue: 5 records reference non-existent equipment IDs
   - Impact: Process monitoring may fail for these parameters

## Impact Assessment

### Functional Impact
- **Medium Risk**: Orphaned records don't break core functionality but cause data integrity warnings
- **Reporting Impact**: Analytics and reports may include invalid data
- **Maintenance Planning**: Orphaned maintenance records could skew maintenance statistics

### Data Quality Impact
- **Data Integrity**: Compromised referential integrity
- **Audit Trail**: Incomplete equipment history
- **Compliance**: May affect regulatory reporting accuracy

## Cleanup Strategy

### Phase 1: Analysis and Backup

1. **Run Analysis Script** (`analyze_orphaned_records.sql`)
   - Identify exact orphaned records
   - Quantify the scope of the problem
   - Document affected equipment IDs

2. **Create Backups**
   - Backup entire database before cleanup
   - Create specific backup tables for affected records
   - Document backup locations and timestamps

### Phase 2: Safe Cleanup

1. **Execute Cleanup Script** (`cleanup_orphaned_records.sql`)
   - Backup orphaned records to safety tables
   - Delete orphaned maintenance_history records
   - Delete orphaned process_parameters records
   - Add missing equipment system mappings

2. **Add Database Constraints**
   - Implement foreign key constraints
   - Add performance indexes
   - Log all changes

### Phase 3: Verification

1. **Run Verification Script** (`verify_cleanup.sql`)
   - Confirm zero orphaned records remain
   - Verify foreign key constraints are active
   - Check data integrity status

2. **Test Data Integrity API**
   - Verify `/api/data-integrity` returns clean results
   - Confirm WARNING issues are resolved
   - Document new clean state

## Implementation Steps

### Prerequisites
- Database backup completed
- Maintenance window scheduled
- Database connection with appropriate privileges

### Step-by-Step Execution

1. **Pre-Cleanup Analysis**
   ```sql
   -- Run analysis script
   psql -d cmms_db -f analyze_orphaned_records.sql
   ```

2. **Execute Cleanup**
   ```sql
   -- Run cleanup script (includes backups)
   psql -d cmms_db -f cleanup_orphaned_records.sql
   ```

3. **Verify Results**
   ```sql
   -- Run verification script
   psql -d cmms_db -f verify_cleanup.sql
   ```

4. **API Testing**
   ```bash
   # Test data integrity API
   curl -s http://localhost:3001/api/data-integrity | jq .
   ```

## Risk Mitigation

### Backup Strategy
- **Full Database Backup**: Before any changes
- **Targeted Backups**: Specific tables for orphaned records
- **Rollback Plan**: Documented recovery procedures

### Rollback Procedures
If issues occur during cleanup:

1. **Stop Cleanup Process**
   ```sql
   ROLLBACK;
   ```

2. **Restore from Backup**
   ```sql
   -- Restore from backup tables
   INSERT INTO maintenance_history SELECT * FROM maintenance_history_backup;
   INSERT INTO process_parameters SELECT * FROM process_parameters_backup;
   ```

3. **Remove Constraints**
   ```sql
   -- Remove foreign key constraints if needed
   ALTER TABLE maintenance_history DROP CONSTRAINT IF EXISTS fk_maintenance_equipment;
   ALTER TABLE process_parameters DROP CONSTRAINT IF EXISTS fk_process_parameters_equipment;
   ```

## Post-Cleanup Monitoring

### Immediate Verification
- [ ] Run data integrity checks
- [ ] Verify zero orphaned records
- [ ] Confirm foreign key constraints active
- [ ] Test application functionality

### Ongoing Monitoring
- [ ] Schedule regular data integrity checks
- [ ] Monitor foreign key constraint violations
- [ ] Review data entry procedures
- [ ] Update documentation

## Long-term Improvements

### Database Design
1. **Standardize Field Names**: Use consistent naming convention
2. **Add Comprehensive Constraints**: Implement all necessary foreign keys
3. **Data Validation**: Add check constraints for data quality

### Application Changes
1. **Input Validation**: Strengthen form validation
2. **Error Handling**: Improve error messages for constraint violations
3. **Audit Logging**: Enhanced tracking of data changes

### Process Improvements
1. **Data Entry Training**: Staff training on proper procedures
2. **Regular Audits**: Schedule monthly data integrity checks
3. **Documentation**: Maintain up-to-date database documentation

## Files Created

1. **analyze_orphaned_records.sql** - Analysis script to identify orphaned records
2. **cleanup_orphaned_records.sql** - Safe cleanup script with backups
3. **verify_cleanup.sql** - Verification script to confirm cleanup success
4. **orphaned_records_cleanup_plan.md** - This comprehensive plan document

## Success Criteria

- [ ] Zero orphaned records in maintenance_history table
- [ ] Zero orphaned records in process_parameters table
- [ ] Foreign key constraints implemented and active
- [ ] Data integrity API returns clean status
- [ ] No functional impact on application
- [ ] All changes logged and documented
- [ ] Backup and recovery procedures tested

## Timeline

- **Analysis Phase**: 30 minutes
- **Backup Phase**: 15 minutes
- **Cleanup Phase**: 45 minutes
- **Verification Phase**: 30 minutes
- **Total Estimated Time**: 2 hours

## Contact Information

For questions or issues during cleanup:
- Database Administrator: [Contact Info]
- Application Developer: [Contact Info]
- System Administrator: [Contact Info]

---

*This plan was generated based on the current state of the CMMS database as of 2025-07-11. Always verify current state before executing cleanup procedures.*