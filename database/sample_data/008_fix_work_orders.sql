-- Fix Work Orders with Proper Assignments, Due Dates, and Estimated Hours
-- This addresses the missing data in all work orders

-- First, let's see the current work order structure
-- SELECT * FROM work_order LIMIT 5;

-- Update work orders with realistic assignments, due dates, and estimated hours
-- Based on task types and priorities

-- Monthly inspections (月次定期点検) - Due monthly, 2-4 hours
UPDATE work_order 
SET 
    staff_id = 'STAFF001',
    planned_start_datetime = '2024-02-15 09:00:00',
    planned_end_datetime = '2024-02-15 13:00:00',
    actual_start_datetime = NULL,
    actual_end_datetime = NULL
WHERE work_description LIKE '%月次定期点検%' AND equipment_id = 'EQ001';

-- Daily inspections (日常点検) - Due daily, 1-2 hours
UPDATE work_order 
SET 
    staff_id = 'STAFF002',
    planned_start_datetime = '2024-01-25 08:00:00',
    planned_end_datetime = '2024-01-25 10:00:00',
    actual_start_datetime = NULL,
    actual_end_datetime = NULL
WHERE work_description LIKE '%日常点検%' AND equipment_id IN ('EQ002', 'EQ008', 'EQ014');

-- Noise response (異音対応) - Urgent, 3-6 hours
UPDATE work_order 
SET 
    staff_id = 'STAFF003',
    planned_start_datetime = '2024-01-20 10:00:00',
    planned_end_datetime = '2024-01-20 16:00:00',
    actual_start_datetime = '2024-01-20 10:30:00',
    actual_end_datetime = NULL
WHERE work_description LIKE '%異音対応%' AND equipment_id = 'EQ003';

-- Cleaning work (清掃作業) - Weekly, 2-3 hours
UPDATE work_order 
SET 
    staff_id = 'STAFF004',
    planned_start_datetime = '2024-02-05 14:00:00',
    planned_end_datetime = '2024-02-05 17:00:00',
    actual_start_datetime = NULL,
    actual_end_datetime = NULL
WHERE work_description LIKE '%清掃作業%' AND equipment_id IN ('EQ004', 'EQ011');

-- Preventive maintenance (予防保全) - Monthly, 4-6 hours
UPDATE work_order 
SET 
    staff_id = 'STAFF002',
    planned_start_datetime = '2024-02-10 08:00:00',
    planned_end_datetime = '2024-02-10 14:00:00',
    actual_start_datetime = NULL,
    actual_end_datetime = NULL
WHERE work_description LIKE '%予防保全%' AND equipment_id IN ('EQ005', 'EQ015');

-- Regular inspection (定期点検) - Bi-weekly, 3-4 hours
UPDATE work_order 
SET 
    staff_id = 'STAFF001',
    planned_start_datetime = '2024-02-08 09:00:00',
    planned_end_datetime = '2024-02-08 13:00:00',
    actual_start_datetime = NULL,
    actual_end_datetime = NULL
WHERE work_description LIKE '%定期点検%' AND equipment_id IN ('EQ006', 'EQ010');

-- Parts replacement (部品交換) - As needed, 4-8 hours
UPDATE work_order 
SET 
    staff_id = 'STAFF003',
    planned_start_datetime = '2024-02-12 08:00:00',
    planned_end_datetime = '2024-02-12 16:00:00',
    actual_start_datetime = NULL,
    actual_end_datetime = NULL
WHERE work_description LIKE '%部品交換%' AND equipment_id = 'EQ007';

-- Calibration work (校正作業) - Quarterly, 2-4 hours
UPDATE work_order 
SET 
    staff_id = 'STAFF004',
    planned_start_datetime = '2024-03-01 10:00:00',
    planned_end_datetime = '2024-03-01 14:00:00',
    actual_start_datetime = NULL,
    actual_end_datetime = NULL
WHERE work_description LIKE '%校正作業%' AND equipment_id IN ('EQ009', 'EQ013');

-- Annual inspection (年次検査) - Yearly, 8-12 hours
UPDATE work_order 
SET 
    staff_id = 'STAFF001',
    planned_start_datetime = '2024-03-15 08:00:00',
    planned_end_datetime = '2024-03-16 12:00:00',
    actual_start_datetime = NULL,
    actual_end_datetime = NULL
WHERE work_description LIKE '%年次検査%' AND equipment_id = 'EQ012';

-- Tank pressure checks - Daily, 1 hour
UPDATE work_order 
SET 
    staff_id = 'STAFF002',
    planned_start_datetime = '2024-01-30 08:00:00',
    planned_end_datetime = '2024-01-30 09:00:00',
    actual_start_datetime = NULL,
    actual_end_datetime = NULL
WHERE work_description LIKE '%Check tank pressure levels%' AND equipment_id = 'TK-101';

-- Pump lubrication - Weekly, 1.5 hours
UPDATE work_order 
SET 
    staff_id = 'STAFF003',
    planned_start_datetime = '2024-02-02 14:00:00',
    planned_end_datetime = '2024-02-02 15:30:00',
    actual_start_datetime = NULL,
    actual_end_datetime = NULL
WHERE work_description LIKE '%Lubricate all grease points%' AND equipment_id = 'PU-101';

-- Visual inspections - Weekly, 2 hours
UPDATE work_order 
SET 
    staff_id = 'STAFF004',
    planned_start_datetime = '2024-02-07 10:00:00',
    planned_end_datetime = '2024-02-07 12:00:00',
    actual_start_datetime = NULL,
    actual_end_datetime = NULL
WHERE work_description LIKE '%Visual inspection of tank exterior%' AND equipment_id = 'TK-101';

-- Pump vibration checks - Daily, 0.5 hours
UPDATE work_order 
SET 
    staff_id = 'STAFF002',
    planned_start_datetime = '2024-01-28 09:00:00',
    planned_end_datetime = '2024-01-28 09:30:00',
    actual_start_datetime = '2024-01-28 09:15:00',
    actual_end_datetime = '2024-01-28 09:45:00'
WHERE work_description LIKE '%Check pump vibration levels%' AND equipment_id = 'PU-100';

-- Thickness measurements - Monthly, 3 hours
UPDATE work_order 
SET 
    staff_id = 'STAFF001',
    planned_start_datetime = '2024-02-20 08:00:00',
    planned_end_datetime = '2024-02-20 11:00:00',
    actual_start_datetime = NULL,
    actual_end_datetime = NULL
WHERE work_description LIKE '%Ultrasonic thickness measurement%' AND equipment_id = 'TK-101';

-- Heat exchanger monitoring - Weekly, 1.5 hours
UPDATE work_order 
SET 
    staff_id = 'STAFF003',
    planned_start_datetime = '2024-02-06 13:00:00',
    planned_end_datetime = '2024-02-06 14:30:00',
    actual_start_datetime = NULL,
    actual_end_datetime = NULL
WHERE work_description LIKE '%Monitor heat transfer efficiency%' AND equipment_id = 'HX-102';

-- Heat exchanger cleaning - Monthly, 6 hours
UPDATE work_order 
SET 
    staff_id = 'STAFF002',
    planned_start_datetime = '2024-02-25 08:00:00',
    planned_end_datetime = '2024-02-25 14:00:00',
    actual_start_datetime = NULL,
    actual_end_datetime = NULL
WHERE work_description LIKE '%Clean heat exchanger tubes%' AND equipment_id = 'HX-101';

-- Add some completed work orders for historical data
UPDATE work_order 
SET 
    status = 'COMPLETED',
    actual_start_datetime = planned_start_datetime,
    actual_end_datetime = planned_start_datetime + INTERVAL '1 hour'
WHERE equipment_id IN ('PU-100') 
AND work_description LIKE '%Check pump vibration levels%'
AND actual_start_datetime IS NOT NULL;

-- Update some as IN_PROGRESS
UPDATE work_order 
SET 
    status = 'IN_PROGRESS',
    actual_start_datetime = planned_start_datetime
WHERE equipment_id IN ('EQ003') 
AND work_description LIKE '%異音対応%';

-- Ensure all work orders have proper status
UPDATE work_order 
SET status = 'OPEN' 
WHERE status IS NULL OR status = '';

-- Verify the updates
SELECT 
    work_order_id,
    equipment_id,
    LEFT(work_description, 30) as work_desc,
    staff_id,
    priority,
    status,
    planned_start_datetime::date as due_date,
    EXTRACT(EPOCH FROM (planned_end_datetime - planned_start_datetime))/3600 as estimated_hours
FROM work_order 
ORDER BY planned_start_datetime
LIMIT 20;