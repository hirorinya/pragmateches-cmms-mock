# 🚀 **Database Schema Migration Plan: Japanese → English Column Names**

## **Executive Summary**
This document outlines the comprehensive migration plan to convert all Japanese column names to English, eliminating the complex field name mapping issues and preventing future bugs like the 1/10 equipment display issue.

## **Migration Benefits**
- ✅ **Eliminates mapping complexity** - no more `equipment_id || 設備ID` everywhere
- ✅ **Prevents field name mismatch bugs** - resolves the root cause of data display issues
- ✅ **Industry standard compliance** - English column names are universally accepted
- ✅ **Developer productivity** - easier for international developers to work with
- ✅ **Future-proof architecture** - consistent with modern database practices

## **Phase 1: Column Name Mapping Analysis**

### **Master Tables (5 tables)**

#### **1. equipment_type_master**
| Japanese Column | English Column | Description |
|---|---|---|
| `"設備種別ID"` | `equipment_type_id` | Equipment type ID |
| `"設備種別名"` | `equipment_type_name` | Equipment type name |
| `"説明"` | `description` | Description |

#### **2. work_type_master**
| Japanese Column | English Column | Description |
|---|---|---|
| `"作業種別ID"` | `work_type_id` | Work type ID |
| `"作業種別名"` | `work_type_name` | Work type name |
| `"説明"` | `description` | Description |
| `"標準作業時間"` | `standard_work_hours` | Standard work hours |

#### **3. staff_master**
| Japanese Column | English Column | Description |
|---|---|---|
| `"担当者ID"` | `staff_id` | Staff ID |
| `"氏名"` | `name` | Name |
| `"部署"` | `department` | Department |
| `"役職"` | `position` | Position |
| `"専門分野"` | `specialty` | Specialty |
| `"連絡先"` | `contact` | Contact |

#### **4. contractor_master**
| Japanese Column | English Column | Description |
|---|---|---|
| `"業者ID"` | `contractor_id` | Contractor ID |
| `"業者名"` | `contractor_name` | Contractor name |
| `"業者種別"` | `contractor_type` | Contractor type |
| `"専門分野"` | `specialty` | Specialty |
| `"連絡先"` | `contact` | Contact |
| `"担当者名"` | `contact_person` | Contact person |
| `"契約開始日"` | `contract_start_date` | Contract start date |
| `"契約終了日"` | `contract_end_date` | Contract end date |

#### **5. inspection_cycle_master**
| Japanese Column | English Column | Description |
|---|---|---|
| `"周期ID"` | `cycle_id` | Cycle ID |
| `"周期名"` | `cycle_name` | Cycle name |
| `"周期日数"` | `cycle_days` | Cycle days |
| `"説明"` | `description` | Description |

### **Main Tables (5 tables)**

#### **6. equipment**
| Japanese Column | English Column | Description |
|---|---|---|
| `"設備ID"` | `equipment_id` | Equipment ID |
| `"設備名"` | `equipment_name` | Equipment name |
| `"設備種別ID"` | `equipment_type_id` | Equipment type ID |
| `"設備タグ"` | `equipment_tag` | Equipment tag |
| `"設置場所"` | `location` | Location |
| `"製造者"` | `manufacturer` | Manufacturer |
| `"型式"` | `model` | Model |
| `"設置年月日"` | `installation_date` | Installation date |
| `"稼働状態"` | `operating_status` | Operating status |
| `"重要度"` | `importance` | Importance |

#### **7. work_order**
| Japanese Column | English Column | Description |
|---|---|---|
| `"作業指示ID"` | `work_order_id` | Work order ID |
| `"設備ID"` | `equipment_id` | Equipment ID |
| `"作業種別ID"` | `work_type_id` | Work type ID |
| `"作業内容"` | `work_description` | Work description |
| `"優先度"` | `priority` | Priority |
| `"計画開始日時"` | `planned_start_datetime` | Planned start datetime |
| `"計画終了日時"` | `planned_end_datetime` | Planned end datetime |
| `"実際開始日時"` | `actual_start_datetime` | Actual start datetime |
| `"実際終了日時"` | `actual_end_datetime` | Actual end datetime |
| `"作業者ID"` | `staff_id` | Staff ID |
| `"状態"` | `status` | Status |
| `"備考"` | `notes` | Notes |

#### **8. maintenance_history**
| Japanese Column | English Column | Description |
|---|---|---|
| `"履歴ID"` | `history_id` | History ID |
| `"設備ID"` | `equipment_id` | Equipment ID |
| `"作業指示ID"` | `work_order_id` | Work order ID |
| `"実施日"` | `execution_date` | Execution date |
| `"作業者ID"` | `staff_id` | Staff ID |
| `"業者ID"` | `contractor_id` | Contractor ID |
| `"作業内容"` | `work_description` | Work description |
| `"作業結果"` | `work_result` | Work result |
| `"使用部品"` | `parts_used` | Parts used |
| `"作業時間"` | `work_hours` | Work hours |
| `"コスト"` | `cost` | Cost |
| `"次回推奨日"` | `next_recommended_date` | Next recommended date |

#### **9. inspection_plan**
| Japanese Column | English Column | Description |
|---|---|---|
| `"計画ID"` | `plan_id` | Plan ID |
| `"設備ID"` | `equipment_id` | Equipment ID |
| `"周期ID"` | `cycle_id` | Cycle ID |
| `"点検項目"` | `inspection_items` | Inspection items |
| `"最終点検日"` | `last_inspection_date` | Last inspection date |
| `"次回点検日"` | `next_inspection_date` | Next inspection date |
| `"担当者ID"` | `staff_id` | Staff ID |
| `"状態"` | `status` | Status |
| `"備考"` | `notes` | Notes |

#### **10. anomaly_report**
| Japanese Column | English Column | Description |
|---|---|---|
| `"報告ID"` | `report_id` | Report ID |
| `"設備ID"` | `equipment_id` | Equipment ID |
| `"発生日時"` | `occurrence_datetime` | Occurrence datetime |
| `"発見者ID"` | `discoverer_id` | Discoverer ID |
| `"異常種別"` | `anomaly_type` | Anomaly type |
| `"重大度"` | `severity` | Severity |
| `"症状"` | `symptoms` | Symptoms |
| `"原因"` | `cause` | Cause |
| `"対処方法"` | `countermeasure` | Countermeasure |
| `"状態"` | `status` | Status |
| `"報告日時"` | `report_datetime` | Report datetime |
| `"解決日時"` | `resolution_datetime` | Resolution datetime |

## **Phase 2: Migration Execution Plan**

### **Step 1: Create Migration Script**
```sql
-- Migration: Convert Japanese column names to English
-- Date: 2025-01-11
-- Purpose: Eliminate field name mapping complexity

BEGIN;

-- 1. equipment_type_master
ALTER TABLE equipment_type_master RENAME COLUMN "設備種別ID" TO equipment_type_id;
ALTER TABLE equipment_type_master RENAME COLUMN "設備種別名" TO equipment_type_name;
ALTER TABLE equipment_type_master RENAME COLUMN "説明" TO description;

-- 2. work_type_master
ALTER TABLE work_type_master RENAME COLUMN "作業種別ID" TO work_type_id;
ALTER TABLE work_type_master RENAME COLUMN "作業種別名" TO work_type_name;
ALTER TABLE work_type_master RENAME COLUMN "説明" TO description;
ALTER TABLE work_type_master RENAME COLUMN "標準作業時間" TO standard_work_hours;

-- 3. staff_master
ALTER TABLE staff_master RENAME COLUMN "担当者ID" TO staff_id;
ALTER TABLE staff_master RENAME COLUMN "氏名" TO name;
ALTER TABLE staff_master RENAME COLUMN "部署" TO department;
ALTER TABLE staff_master RENAME COLUMN "役職" TO position;
ALTER TABLE staff_master RENAME COLUMN "専門分野" TO specialty;
ALTER TABLE staff_master RENAME COLUMN "連絡先" TO contact;

-- 4. contractor_master
ALTER TABLE contractor_master RENAME COLUMN "業者ID" TO contractor_id;
ALTER TABLE contractor_master RENAME COLUMN "業者名" TO contractor_name;
ALTER TABLE contractor_master RENAME COLUMN "業者種別" TO contractor_type;
ALTER TABLE contractor_master RENAME COLUMN "専門分野" TO specialty;
ALTER TABLE contractor_master RENAME COLUMN "連絡先" TO contact;
ALTER TABLE contractor_master RENAME COLUMN "担当者名" TO contact_person;
ALTER TABLE contractor_master RENAME COLUMN "契約開始日" TO contract_start_date;
ALTER TABLE contractor_master RENAME COLUMN "契約終了日" TO contract_end_date;

-- 5. inspection_cycle_master
ALTER TABLE inspection_cycle_master RENAME COLUMN "周期ID" TO cycle_id;
ALTER TABLE inspection_cycle_master RENAME COLUMN "周期名" TO cycle_name;
ALTER TABLE inspection_cycle_master RENAME COLUMN "周期日数" TO cycle_days;
ALTER TABLE inspection_cycle_master RENAME COLUMN "説明" TO description;

-- 6. equipment
ALTER TABLE equipment RENAME COLUMN "設備ID" TO equipment_id;
ALTER TABLE equipment RENAME COLUMN "設備名" TO equipment_name;
ALTER TABLE equipment RENAME COLUMN "設備種別ID" TO equipment_type_id;
ALTER TABLE equipment RENAME COLUMN "設備タグ" TO equipment_tag;
ALTER TABLE equipment RENAME COLUMN "設置場所" TO location;
ALTER TABLE equipment RENAME COLUMN "製造者" TO manufacturer;
ALTER TABLE equipment RENAME COLUMN "型式" TO model;
ALTER TABLE equipment RENAME COLUMN "設置年月日" TO installation_date;
ALTER TABLE equipment RENAME COLUMN "稼働状態" TO operating_status;
ALTER TABLE equipment RENAME COLUMN "重要度" TO importance;

-- 7. work_order
ALTER TABLE work_order RENAME COLUMN "作業指示ID" TO work_order_id;
ALTER TABLE work_order RENAME COLUMN "設備ID" TO equipment_id;
ALTER TABLE work_order RENAME COLUMN "作業種別ID" TO work_type_id;
ALTER TABLE work_order RENAME COLUMN "作業内容" TO work_description;
ALTER TABLE work_order RENAME COLUMN "優先度" TO priority;
ALTER TABLE work_order RENAME COLUMN "計画開始日時" TO planned_start_datetime;
ALTER TABLE work_order RENAME COLUMN "計画終了日時" TO planned_end_datetime;
ALTER TABLE work_order RENAME COLUMN "実際開始日時" TO actual_start_datetime;
ALTER TABLE work_order RENAME COLUMN "実際終了日時" TO actual_end_datetime;
ALTER TABLE work_order RENAME COLUMN "作業者ID" TO staff_id;
ALTER TABLE work_order RENAME COLUMN "状態" TO status;
ALTER TABLE work_order RENAME COLUMN "備考" TO notes;

-- 8. maintenance_history
ALTER TABLE maintenance_history RENAME COLUMN "履歴ID" TO history_id;
ALTER TABLE maintenance_history RENAME COLUMN "設備ID" TO equipment_id;
ALTER TABLE maintenance_history RENAME COLUMN "作業指示ID" TO work_order_id;
ALTER TABLE maintenance_history RENAME COLUMN "実施日" TO execution_date;
ALTER TABLE maintenance_history RENAME COLUMN "作業者ID" TO staff_id;
ALTER TABLE maintenance_history RENAME COLUMN "業者ID" TO contractor_id;
ALTER TABLE maintenance_history RENAME COLUMN "作業内容" TO work_description;
ALTER TABLE maintenance_history RENAME COLUMN "作業結果" TO work_result;
ALTER TABLE maintenance_history RENAME COLUMN "使用部品" TO parts_used;
ALTER TABLE maintenance_history RENAME COLUMN "作業時間" TO work_hours;
ALTER TABLE maintenance_history RENAME COLUMN "コスト" TO cost;
ALTER TABLE maintenance_history RENAME COLUMN "次回推奨日" TO next_recommended_date;

-- 9. inspection_plan
ALTER TABLE inspection_plan RENAME COLUMN "計画ID" TO plan_id;
ALTER TABLE inspection_plan RENAME COLUMN "設備ID" TO equipment_id;
ALTER TABLE inspection_plan RENAME COLUMN "周期ID" TO cycle_id;
ALTER TABLE inspection_plan RENAME COLUMN "点検項目" TO inspection_items;
ALTER TABLE inspection_plan RENAME COLUMN "最終点検日" TO last_inspection_date;
ALTER TABLE inspection_plan RENAME COLUMN "次回点検日" TO next_inspection_date;
ALTER TABLE inspection_plan RENAME COLUMN "担当者ID" TO staff_id;
ALTER TABLE inspection_plan RENAME COLUMN "状態" TO status;
ALTER TABLE inspection_plan RENAME COLUMN "備考" TO notes;

-- 10. anomaly_report
ALTER TABLE anomaly_report RENAME COLUMN "報告ID" TO report_id;
ALTER TABLE anomaly_report RENAME COLUMN "設備ID" TO equipment_id;
ALTER TABLE anomaly_report RENAME COLUMN "発生日時" TO occurrence_datetime;
ALTER TABLE anomaly_report RENAME COLUMN "発見者ID" TO discoverer_id;
ALTER TABLE anomaly_report RENAME COLUMN "異常種別" TO anomaly_type;
ALTER TABLE anomaly_report RENAME COLUMN "重大度" TO severity;
ALTER TABLE anomaly_report RENAME COLUMN "症状" TO symptoms;
ALTER TABLE anomaly_report RENAME COLUMN "原因" TO cause;
ALTER TABLE anomaly_report RENAME COLUMN "対処方法" TO countermeasure;
ALTER TABLE anomaly_report RENAME COLUMN "状態" TO status;
ALTER TABLE anomaly_report RENAME COLUMN "報告日時" TO report_datetime;
ALTER TABLE anomaly_report RENAME COLUMN "解決日時" TO resolution_datetime;

COMMIT;
```

### **Step 2: Update Indexes**
```sql
-- Drop old indexes (they'll be recreated with new column names)
DROP INDEX IF EXISTS idx_equipment_type;
DROP INDEX IF EXISTS idx_equipment_location;
DROP INDEX IF EXISTS idx_work_order_equipment;
DROP INDEX IF EXISTS idx_work_order_status;
DROP INDEX IF EXISTS idx_maintenance_equipment;
DROP INDEX IF EXISTS idx_maintenance_date;
DROP INDEX IF EXISTS idx_inspection_equipment;
DROP INDEX IF EXISTS idx_inspection_next_date;
DROP INDEX IF EXISTS idx_anomaly_equipment;
DROP INDEX IF EXISTS idx_anomaly_status;
DROP INDEX IF EXISTS idx_anomaly_severity;

-- Create new indexes with English column names
CREATE INDEX idx_equipment_type ON equipment(equipment_type_id);
CREATE INDEX idx_equipment_location ON equipment(location);
CREATE INDEX idx_work_order_equipment ON work_order(equipment_id);
CREATE INDEX idx_work_order_status ON work_order(status);
CREATE INDEX idx_maintenance_equipment ON maintenance_history(equipment_id);
CREATE INDEX idx_maintenance_date ON maintenance_history(execution_date);
CREATE INDEX idx_inspection_equipment ON inspection_plan(equipment_id);
CREATE INDEX idx_inspection_next_date ON inspection_plan(next_inspection_date);
CREATE INDEX idx_anomaly_equipment ON anomaly_report(equipment_id);
CREATE INDEX idx_anomaly_status ON anomaly_report(status);
CREATE INDEX idx_anomaly_severity ON anomaly_report(severity);
```

## **Phase 3: Application Code Updates**

### **Step 3: Update TypeScript Interfaces**
```typescript
// Before: Japanese field names
export interface Equipment {
  設備ID: string
  設備名: string
  設備種別ID?: number
  設備タグ: string
  設置場所?: string
  // ...
}

// After: English field names
export interface Equipment {
  equipment_id: string
  equipment_name: string
  equipment_type_id?: number
  equipment_tag: string
  location?: string
  // ...
}
```

### **Step 4: Update Database Service Layer**
```typescript
// Before: Complex mapping logic
const uniqueResults = Array.isArray(parsedResponse.results) 
  ? parsedResponse.results.filter((result: any, index: number, arr: any[]) => {
      const currentId = result.equipment_id || result.設備ID
      return arr.findIndex(r => {
        const compareId = r.equipment_id || r.設備ID
        return compareId === currentId
      }) === index
    })
  : [parsedResponse.results]

// After: Simple, clean logic
const uniqueResults = Array.isArray(parsedResponse.results) 
  ? parsedResponse.results.filter((result: any, index: number, arr: any[]) => 
      arr.findIndex(r => r.equipment_id === result.equipment_id) === index
    )
  : [parsedResponse.results]
```

### **Step 5: Update All SQL Queries**
```typescript
// Before: Japanese column names
const { data, error } = await supabase
  .from('equipment')
  .select('設備ID, 設備名, 設置場所')
  .eq('設備ID', equipmentId)

// After: English column names
const { data, error } = await supabase
  .from('equipment')
  .select('equipment_id, equipment_name, location')
  .eq('equipment_id', equipmentId)
```

## **Phase 4: Testing and Validation**

### **Step 6: Comprehensive Testing**
1. **Unit Tests**: Test all database operations
2. **Integration Tests**: Test all API endpoints
3. **UI Tests**: Verify all data displays correctly
4. **Performance Tests**: Ensure no performance degradation

### **Step 7: Data Validation**
```sql
-- Verify all data is intact after migration
SELECT COUNT(*) FROM equipment;
SELECT COUNT(*) FROM maintenance_history;
SELECT COUNT(*) FROM work_order;
-- etc.
```

## **Phase 5: Deployment**

### **Step 8: Production Deployment**
1. **Backup Database**: Complete backup before migration
2. **Migration Window**: Schedule downtime for migration
3. **Execute Migration**: Run all migration scripts
4. **Deploy Code**: Deploy updated application code
5. **Verify Production**: Comprehensive post-migration testing

## **Benefits After Migration**

### **✅ Eliminated Complexities**
- **No more field name mapping** across the entire codebase
- **No more `equipment_id || 設備ID` logic** anywhere
- **No more field name mismatch bugs** 
- **Consistent column naming** throughout the database

### **✅ Improved Developer Experience**
- **Cleaner, more readable code**
- **Easier debugging and maintenance**
- **Better IDE support and autocomplete**
- **Standard industry practices**

### **✅ Data Integrity**
- **Single source of truth** for column names
- **Reduced risk of bugs** from field name confusion
- **Consistent data access patterns**
- **Easier data validation**

## **Migration Timeline**

| Phase | Duration | Tasks |
|---|---|---|
| **Phase 1** | 2 days | Complete analysis and planning |
| **Phase 2** | 1 day | Create and test migration scripts |
| **Phase 3** | 3 days | Update all application code |
| **Phase 4** | 2 days | Comprehensive testing |
| **Phase 5** | 1 day | Production deployment |
| **Total** | **9 days** | **Complete migration** |

## **Risk Mitigation**

### **Backup Strategy**
- **Full database backup** before starting migration
- **Incremental backups** during development
- **Rollback plan** in case of issues

### **Testing Strategy**
- **Development environment** testing first
- **Staging environment** full testing
- **Production deployment** with monitoring

### **Monitoring**
- **Database performance** monitoring
- **Application error** monitoring
- **Data integrity** validation

## **Conclusion**

This migration will eliminate the root cause of field name mapping issues and provide a clean, maintainable database schema. The investment in this migration will pay dividends in reduced bugs, improved maintainability, and better developer productivity.

**Key Benefits:**
- 🚫 **Eliminates field name mapping complexity forever**
- 🔧 **Prevents future bugs like the 1/10 equipment issue**
- 📊 **Standardizes on industry best practices**
- 🚀 **Improves long-term maintainability**

**Data Safety:**
- 📋 **All Japanese data values remain unchanged**
- 🎌 **User experience remains fully Japanese**
- 🔒 **No data loss or corruption**
- ⚡ **Same performance characteristics**