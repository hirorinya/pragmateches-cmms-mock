-- Fix Work Orders with Proper Assignments, Due Dates, and Estimated Hours
-- Using correct column names: title, description, assigned_to, due_date, estimated_hours

-- Update work orders with realistic assignments, due dates, and estimated hours
-- Based on task types and priorities

-- Monthly inspections (月次定期点検) - Due monthly, 2-4 hours
UPDATE work_order 
SET 
    assigned_to = 'STAFF001',
    due_date = '2024-02-15 09:00:00',
    planned_start_datetime = '2024-02-15 09:00:00',
    planned_end_datetime = '2024-02-15 13:00:00',
    estimated_hours = 4,
    status = 'OPEN'
WHERE title LIKE '%月次定期点検%' OR description LIKE '%月次定期点検%';

-- Daily inspections (日常点検) - Due daily, 1-2 hours
UPDATE work_order 
SET 
    assigned_to = 'STAFF002',
    due_date = '2024-01-25 08:00:00',
    planned_start_datetime = '2024-01-25 08:00:00',
    planned_end_datetime = '2024-01-25 10:00:00',
    estimated_hours = 2,
    status = 'OVERDUE'
WHERE title LIKE '%日常点検%' OR description LIKE '%日常点検%';

-- Noise response (異音対応) - Urgent, 3-6 hours
UPDATE work_order 
SET 
    assigned_to = 'STAFF003',
    due_date = '2024-01-20 10:00:00',
    planned_start_datetime = '2024-01-20 10:00:00',
    planned_end_datetime = '2024-01-20 16:00:00',
    estimated_hours = 6,
    status = 'IN_PROGRESS',
    actual_start_datetime = '2024-01-20 10:30:00'
WHERE title LIKE '%異音対応%' OR description LIKE '%異音対応%';

-- Cleaning work (清掃作業) - Weekly, 2-3 hours
UPDATE work_order 
SET 
    assigned_to = 'STAFF004',
    due_date = '2024-02-05 14:00:00',
    planned_start_datetime = '2024-02-05 14:00:00',
    planned_end_datetime = '2024-02-05 17:00:00',
    estimated_hours = 3,
    status = 'OPEN'
WHERE title LIKE '%清掃作業%' OR description LIKE '%清掃作業%';

-- Preventive maintenance (予防保全) - Monthly, 4-6 hours
UPDATE work_order 
SET 
    assigned_to = 'STAFF002',
    due_date = '2024-02-10 08:00:00',
    planned_start_datetime = '2024-02-10 08:00:00',
    planned_end_datetime = '2024-02-10 14:00:00',
    estimated_hours = 6,
    status = 'OPEN'
WHERE title LIKE '%予防保全%' OR description LIKE '%予防保全%';

-- Regular inspection (定期点検) - Bi-weekly, 3-4 hours
UPDATE work_order 
SET 
    assigned_to = 'STAFF001',
    due_date = '2024-02-08 09:00:00',
    planned_start_datetime = '2024-02-08 09:00:00',
    planned_end_datetime = '2024-02-08 13:00:00',
    estimated_hours = 4,
    status = 'OPEN'
WHERE title LIKE '%定期点検%' OR description LIKE '%定期点検%';

-- Parts replacement (部品交換) - As needed, 4-8 hours
UPDATE work_order 
SET 
    assigned_to = 'STAFF003',
    due_date = '2024-02-12 08:00:00',
    planned_start_datetime = '2024-02-12 08:00:00',
    planned_end_datetime = '2024-02-12 16:00:00',
    estimated_hours = 8,
    status = 'OPEN'
WHERE title LIKE '%部品交換%' OR description LIKE '%部品交換%';

-- Calibration work (校正作業) - Quarterly, 2-4 hours
UPDATE work_order 
SET 
    assigned_to = 'STAFF004',
    due_date = '2024-03-01 10:00:00',
    planned_start_datetime = '2024-03-01 10:00:00',
    planned_end_datetime = '2024-03-01 14:00:00',
    estimated_hours = 4,
    status = 'OPEN'
WHERE title LIKE '%校正作業%' OR description LIKE '%校正作業%';

-- Annual inspection (年次検査) - Yearly, 8-12 hours
UPDATE work_order 
SET 
    assigned_to = 'STAFF001',
    due_date = '2024-03-15 08:00:00',
    planned_start_datetime = '2024-03-15 08:00:00',
    planned_end_datetime = '2024-03-16 12:00:00',
    estimated_hours = 12,
    status = 'OPEN'
WHERE title LIKE '%年次検査%' OR description LIKE '%年次検査%';

-- Tank pressure checks - Daily, 1 hour
UPDATE work_order 
SET 
    assigned_to = 'STAFF002',
    due_date = '2024-01-30 08:00:00',
    planned_start_datetime = '2024-01-30 08:00:00',
    planned_end_datetime = '2024-01-30 09:00:00',
    estimated_hours = 1,
    status = 'OVERDUE'
WHERE title LIKE '%Check tank pressure levels%' OR description LIKE '%Check tank pressure levels%';

-- Pump lubrication - Weekly, 1.5 hours
UPDATE work_order 
SET 
    assigned_to = 'STAFF003',
    due_date = '2024-02-02 14:00:00',
    planned_start_datetime = '2024-02-02 14:00:00',
    planned_end_datetime = '2024-02-02 15:30:00',
    estimated_hours = 1.5,
    status = 'OPEN'
WHERE title LIKE '%Lubricate all grease points%' OR description LIKE '%Lubricate all grease points%';

-- Visual inspections - Weekly, 2 hours
UPDATE work_order 
SET 
    assigned_to = 'STAFF004',
    due_date = '2024-02-07 10:00:00',
    planned_start_datetime = '2024-02-07 10:00:00',
    planned_end_datetime = '2024-02-07 12:00:00',
    estimated_hours = 2,
    status = 'OPEN'
WHERE title LIKE '%Visual inspection of tank exterior%' OR description LIKE '%Visual inspection of tank exterior%';

-- Pump vibration checks - Daily, 0.5 hours
UPDATE work_order 
SET 
    assigned_to = 'STAFF002',
    due_date = '2024-01-28 09:00:00',
    planned_start_datetime = '2024-01-28 09:00:00',
    planned_end_datetime = '2024-01-28 09:30:00',
    estimated_hours = 0.5,
    status = 'COMPLETED',
    actual_start_datetime = '2024-01-28 09:15:00',
    actual_end_datetime = '2024-01-28 09:45:00',
    actual_hours = 0.5
WHERE title LIKE '%Check pump vibration levels%' OR description LIKE '%Check pump vibration levels%';

-- Thickness measurements - Monthly, 3 hours
UPDATE work_order 
SET 
    assigned_to = 'STAFF001',
    due_date = '2024-02-20 08:00:00',
    planned_start_datetime = '2024-02-20 08:00:00',
    planned_end_datetime = '2024-02-20 11:00:00',
    estimated_hours = 3,
    status = 'OPEN'
WHERE title LIKE '%Ultrasonic thickness measurement%' OR description LIKE '%Ultrasonic thickness measurement%';

-- Heat exchanger monitoring - Weekly, 1.5 hours
UPDATE work_order 
SET 
    assigned_to = 'STAFF003',
    due_date = '2024-02-06 13:00:00',
    planned_start_datetime = '2024-02-06 13:00:00',
    planned_end_datetime = '2024-02-06 14:30:00',
    estimated_hours = 1.5,
    status = 'OPEN'
WHERE title LIKE '%Monitor heat transfer efficiency%' OR description LIKE '%Monitor heat transfer efficiency%';

-- Heat exchanger cleaning - Monthly, 6 hours
UPDATE work_order 
SET 
    assigned_to = 'STAFF002',
    due_date = '2024-02-25 08:00:00',
    planned_start_datetime = '2024-02-25 08:00:00',
    planned_end_datetime = '2024-02-25 14:00:00',
    estimated_hours = 6,
    status = 'OPEN'
WHERE title LIKE '%Clean heat exchanger tubes%' OR description LIKE '%Clean heat exchanger tubes%';

-- Fix any remaining work orders that don't match specific patterns
UPDATE work_order 
SET 
    assigned_to = CASE 
        WHEN priority = 'HIGH' THEN 'STAFF003'
        WHEN priority = 'MEDIUM' THEN 'STAFF002'
        ELSE 'STAFF004'
    END,
    due_date = CASE 
        WHEN priority = 'HIGH' THEN '2024-01-30 08:00:00'
        WHEN priority = 'MEDIUM' THEN '2024-02-05 10:00:00'
        ELSE '2024-02-15 14:00:00'
    END,
    estimated_hours = CASE 
        WHEN priority = 'HIGH' THEN 4
        WHEN priority = 'MEDIUM' THEN 2
        ELSE 1
    END,
    status = CASE 
        WHEN due_date < '2024-01-31' THEN 'OVERDUE'
        ELSE 'OPEN'
    END
WHERE assigned_to IS NULL OR assigned_to = '' OR assigned_to = 'Unassigned';

-- Update planned dates to match due dates where they're missing
UPDATE work_order 
SET 
    planned_start_datetime = due_date,
    planned_end_datetime = due_date + (estimated_hours || ' hours')::interval
WHERE planned_start_datetime IS NULL;

-- Verify the updates
SELECT 
    id,
    equipment_id,
    LEFT(COALESCE(title, description, 'No title'), 30) as work_title,
    assigned_to,
    priority,
    status,
    due_date::date as due_date,
    estimated_hours
FROM work_order 
ORDER BY due_date
LIMIT 20;