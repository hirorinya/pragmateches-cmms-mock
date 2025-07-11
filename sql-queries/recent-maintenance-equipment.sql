-- Query to find equipment that had maintenance work performed in the last 1 year
-- This is the SQL equivalent of the API endpoint functionality

-- Version 1: Basic query with aggregation
SELECT DISTINCT 
  mh.設備ID,
  e.設備名,
  e.設備タグ,
  e.設置場所,
  e.稼働状態,
  etm.設備種別名,
  MAX(mh.実施日) as last_maintenance_date,
  COUNT(mh.*) as maintenance_count
FROM maintenance_history mh
JOIN equipment e ON mh.設備ID = e.設備ID
LEFT JOIN equipment_type_master etm ON e.設備種別ID = etm.設備種別ID
WHERE mh.実施日 >= '2024-07-11'  -- 1 year ago from today (2025-07-11)
GROUP BY mh.設備ID, e.設備名, e.設備タグ, e.設置場所, e.稼働状態, etm.設備種別名
ORDER BY last_maintenance_date DESC;

-- Version 2: More detailed query with maintenance details
SELECT 
  mh.設備ID,
  e.設備名,
  e.設備タグ,
  e.設置場所,
  e.稼働状態,
  etm.設備種別名,
  mh.実施日,
  mh.作業内容,
  mh.作業結果,
  mh.作業時間,
  mh.コスト,
  sm.氏名 as 作業者名,
  cm.業者名
FROM maintenance_history mh
JOIN equipment e ON mh.設備ID = e.設備ID
LEFT JOIN equipment_type_master etm ON e.設備種別ID = etm.設備種別ID
LEFT JOIN staff_master sm ON mh.作業者ID = sm.担当者ID
LEFT JOIN contractor_master cm ON mh.業者ID = cm.業者ID
WHERE mh.実施日 >= '2024-07-11'  -- 1 year ago from today (2025-07-11)
ORDER BY mh.実施日 DESC;

-- Version 3: Summary statistics
SELECT 
  COUNT(DISTINCT mh.設備ID) as total_equipment_with_maintenance,
  COUNT(mh.*) as total_maintenance_records,
  MIN(mh.実施日) as earliest_maintenance_date,
  MAX(mh.実施日) as latest_maintenance_date,
  AVG(mh.作業時間) as avg_work_hours,
  SUM(mh.コスト) as total_cost
FROM maintenance_history mh
WHERE mh.実施日 >= '2024-07-11';

-- Version 4: Equipment type breakdown
SELECT 
  etm.設備種別名,
  COUNT(DISTINCT mh.設備ID) as equipment_count,
  COUNT(mh.*) as maintenance_count,
  AVG(mh.作業時間) as avg_work_hours,
  SUM(mh.コスト) as total_cost
FROM maintenance_history mh
JOIN equipment e ON mh.設備ID = e.設備ID
JOIN equipment_type_master etm ON e.設備種別ID = etm.設備種別ID
WHERE mh.実施日 >= '2024-07-11'
GROUP BY etm.設備種別名
ORDER BY maintenance_count DESC;

-- Version 5: Monthly maintenance trends
SELECT 
  DATE_TRUNC('month', mh.実施日) as month,
  COUNT(DISTINCT mh.設備ID) as unique_equipment,
  COUNT(mh.*) as maintenance_count,
  AVG(mh.作業時間) as avg_work_hours,
  SUM(mh.コスト) as total_cost
FROM maintenance_history mh
WHERE mh.実施日 >= '2024-07-11'
GROUP BY DATE_TRUNC('month', mh.実施日)
ORDER BY month DESC;