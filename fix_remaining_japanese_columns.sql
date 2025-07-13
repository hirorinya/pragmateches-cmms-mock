-- Fix remaining Japanese columns in database tables
-- This script renames Japanese columns to English to prevent OpenAI from generating incorrect SQL

-- Fix anomaly_report table
ALTER TABLE anomaly_report 
  RENAME COLUMN "報告ID" TO report_id;

ALTER TABLE anomaly_report 
  RENAME COLUMN "設備ID" TO equipment_id;

ALTER TABLE anomaly_report 
  RENAME COLUMN "発生日時" TO occurrence_datetime;

ALTER TABLE anomaly_report 
  RENAME COLUMN "発見者ID" TO reporter_id;

ALTER TABLE anomaly_report 
  RENAME COLUMN "異常種別" TO anomaly_type;

ALTER TABLE anomaly_report 
  RENAME COLUMN "重大度" TO severity;

ALTER TABLE anomaly_report 
  RENAME COLUMN "症状" TO symptoms;

ALTER TABLE anomaly_report 
  RENAME COLUMN "状態" TO status;

-- Fix contractor_master table
ALTER TABLE contractor_master 
  RENAME COLUMN "業者ID" TO contractor_id;

ALTER TABLE contractor_master 
  RENAME COLUMN "業者名" TO contractor_name;

ALTER TABLE contractor_master 
  RENAME COLUMN "業者種別" TO contractor_type;

ALTER TABLE contractor_master 
  RENAME COLUMN "専門分野" TO specialty;

ALTER TABLE contractor_master 
  RENAME COLUMN "連絡先" TO contact_info;

ALTER TABLE contractor_master 
  RENAME COLUMN "担当者名" TO contact_person;

ALTER TABLE contractor_master 
  RENAME COLUMN "契約開始日" TO contract_start_date;

ALTER TABLE contractor_master 
  RENAME COLUMN "契約終了日" TO contract_end_date;

-- Fix work_type_master table
ALTER TABLE work_type_master 
  RENAME COLUMN "作業種別ID" TO work_type_id;

ALTER TABLE work_type_master 
  RENAME COLUMN "作業種別名" TO work_type_name;

ALTER TABLE work_type_master 
  RENAME COLUMN "説明" TO description;

ALTER TABLE work_type_master 
  RENAME COLUMN "標準作業時間" TO standard_work_hours;

-- Fix staff_master table
ALTER TABLE staff_master 
  RENAME COLUMN "担当者ID" TO staff_id;

ALTER TABLE staff_master 
  RENAME COLUMN "氏名" TO staff_name;

ALTER TABLE staff_master 
  RENAME COLUMN "部署" TO department;

ALTER TABLE staff_master 
  RENAME COLUMN "役職" TO position;

ALTER TABLE staff_master 
  RENAME COLUMN "専門分野" TO specialty;

ALTER TABLE staff_master 
  RENAME COLUMN "連絡先" TO contact_info;

-- Verify the changes
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('anomaly_report', 'contractor_master', 'work_type_master', 'staff_master')
ORDER BY table_name, ordinal_position;