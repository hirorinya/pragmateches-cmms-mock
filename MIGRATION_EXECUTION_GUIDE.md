# 🚀 **Migration Execution Guide: Japanese → English Column Names**

## **Prerequisites**
- ✅ Complete database backup
- ✅ Development environment setup
- ✅ Supabase CLI installed
- ✅ Migration script reviewed and approved

## **Step-by-Step Execution**

### **Phase 1: Preparation (30 minutes)**

#### **1.1 Backup Database**
```bash
# Create complete backup
supabase db dump --file backup_before_migration.sql

# Verify backup
ls -la backup_before_migration.sql
```

#### **1.2 Test Migration in Development**
```bash
# Run migration on development database
supabase migration up --file supabase/migrations/20250711_migrate_column_names_to_english.sql

# Verify migration success
supabase db reset --debug
```

### **Phase 2: Database Migration (15 minutes)**

#### **2.1 Execute Migration Script**
```bash
# Apply migration to production database
supabase migration up

# Verify migration status
supabase migration list
```

#### **2.2 Validate Database Schema**
```sql
-- Check critical tables have English column names
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'equipment' 
ORDER BY ordinal_position;

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'maintenance_history' 
ORDER BY ordinal_position;

-- Verify data integrity
SELECT COUNT(*) FROM equipment;
SELECT COUNT(*) FROM maintenance_history;
```

### **Phase 3: Application Code Updates (2-3 hours)**

#### **3.1 Update TypeScript Interfaces**
```bash
# Update main interfaces file
cp typescript_interfaces_update.ts src/lib/database-types.ts

# Update Supabase generated types
supabase gen types typescript --local > src/lib/supabase-types.ts
```

#### **3.2 Update Service Layer Files**
Files to update:
- `src/services/ai-database-service.ts`
- `src/lib/data-integrity.ts`
- `src/app/api/maintenance/recent-equipment/route.ts`
- `src/app/api/process/trends/route.ts`
- `src/app/api/process/parameters/route.ts`

#### **3.3 Update Frontend Components**
Files to update:
- `src/app/dashboard/ai-assistant/page.tsx`
- `src/app/dashboard/maintenance/recent-equipment/page.tsx`
- `src/app/dashboard/process-monitoring/page.tsx`
- `src/app/dashboard/risk-assessment/page.tsx`

### **Phase 4: Code Updates Details**

#### **4.1 Replace All Japanese Column References**

**Before:**
```typescript
.select(`
  設備ID,
  設備名,
  設置場所,
  稼働状態
`)
.eq('設備ID', equipmentId)
```

**After:**
```typescript
.select(`
  equipment_id,
  equipment_name,
  location,
  operating_status
`)
.eq('equipment_id', equipmentId)
```

#### **4.2 Remove Field Name Mapping Logic**

**Before:**
```typescript
const currentId = result.equipment_id || result.設備ID
const compareId = r.equipment_id || r.設備ID
```

**After:**
```typescript
const currentId = result.equipment_id
const compareId = r.equipment_id
```

#### **4.3 Update Interface Definitions**

**Before:**
```typescript
interface Equipment {
  設備ID: string
  設備名: string
  設置場所?: string
}
```

**After:**
```typescript
interface Equipment {
  equipment_id: string
  equipment_name: string
  location?: string
}
```

### **Phase 5: Testing (1-2 hours)**

#### **5.1 Unit Tests**
```bash
# Run all unit tests
npm test

# Run specific service tests
npm test -- --testPathPattern=services
```

#### **5.2 Integration Tests**
```bash
# Test all API endpoints
npm run test:api

# Test database connectivity
npm run test:db
```

#### **5.3 Manual Testing**
- ✅ Equipment listing displays correctly
- ✅ Maintenance history shows all 10 equipment
- ✅ Process monitoring data loads
- ✅ Risk assessment functions properly
- ✅ AI assistant queries work correctly

### **Phase 6: Build and Deploy (30 minutes)**

#### **6.1 Build Application**
```bash
# Clean build
npm run build

# Check for any compilation errors
npm run type-check
```

#### **6.2 Deploy to Production**
```bash
# Deploy to Vercel
vercel --prod

# Verify deployment
curl -s https://pragmateches-cmms-mock.vercel.app/api/maintenance/recent-equipment
```

### **Phase 7: Post-Migration Validation (30 minutes)**

#### **7.1 Verify Data Display**
```bash
# Test critical endpoints
curl -s "https://pragmateches-cmms-mock.vercel.app/api/maintenance/recent-equipment?days=999" | jq '.summary.totalEquipmentWithMaintenance'

# Should return: 10 (not 1)
```

#### **7.2 Check Database Performance**
```sql
-- Verify indexes are working
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM equipment 
WHERE equipment_id = 'EQ001';

-- Check query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM maintenance_history 
WHERE equipment_id = 'EQ001';
```

#### **7.3 Monitor Application**
- ✅ Check application logs for errors
- ✅ Monitor response times
- ✅ Verify all features functional
- ✅ Confirm Japanese data displays correctly

## **Rollback Plan (If Needed)**

### **Emergency Rollback**
```bash
# Restore from backup
supabase db reset --file backup_before_migration.sql

# Revert application code
git revert <migration-commit-hash>

# Redeploy previous version
vercel --prod
```

## **Success Criteria**

### **✅ Database Migration Success**
- All column names converted to English
- All data intact and accessible
- All indexes recreated successfully
- No performance degradation

### **✅ Application Functionality**
- All pages load without errors
- All API endpoints return correct data
- Equipment listings show complete data (10/10 items)
- Japanese data displays correctly in UI

### **✅ Code Quality**
- No more field name mapping logic
- Clean, readable code throughout
- TypeScript compilation successful
- All tests passing

## **Expected Results**

### **Before Migration Issues:**
- ❌ Complex field name mapping everywhere
- ❌ Bug: Only 1/10 equipment displayed
- ❌ Mixed Japanese/English column names
- ❌ Error-prone development

### **After Migration Benefits:**
- ✅ Clean, simple code without mapping
- ✅ All 10 equipment displayed correctly
- ✅ Consistent English column names
- ✅ Maintainable, bug-free codebase
- ✅ Japanese data values preserved
- ✅ Japanese user experience unchanged

## **Timeline Summary**

| Phase | Duration | Status |
|-------|----------|---------|
| Preparation | 30 min | ⏳ |
| Database Migration | 15 min | ⏳ |
| Code Updates | 2-3 hours | ⏳ |
| Testing | 1-2 hours | ⏳ |
| Build & Deploy | 30 min | ⏳ |
| Validation | 30 min | ⏳ |
| **Total** | **5-7 hours** | **⏳** |

## **Final Verification Checklist**

- [ ] Database backup completed
- [ ] Migration script executed successfully
- [ ] All TypeScript interfaces updated
- [ ] All service layer files updated
- [ ] All frontend components updated
- [ ] All tests passing
- [ ] Application builds successfully
- [ ] Production deployment successful
- [ ] All 10 equipment display correctly
- [ ] Japanese data shows properly in UI
- [ ] No field name mapping logic remains
- [ ] Performance maintained or improved

## **Post-Migration Monitoring**

### **Week 1: Intensive Monitoring**
- Daily application log review
- Performance metrics monitoring
- User feedback collection
- Bug report tracking

### **Week 2-4: Standard Monitoring**
- Regular performance checks
- Periodic functionality testing
- Continued user feedback
- Document lessons learned

## **Contact Information**

For any issues during migration:
- **Technical Lead:** [Your Name]
- **Database Admin:** [DBA Name]
- **DevOps:** [DevOps Team]
- **Emergency Contact:** [Emergency Number]

---

**Remember:** This migration eliminates the root cause of field name mapping complexity and creates a maintainable, bug-free database schema while preserving all Japanese business data and user experience.