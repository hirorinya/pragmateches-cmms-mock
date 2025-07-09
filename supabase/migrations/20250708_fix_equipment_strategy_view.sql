-- ============================================
-- Fix Equipment Strategy Schedule View
-- ============================================

-- Drop the existing view
DROP VIEW IF EXISTS equipment_strategy_schedule;

-- Recreate with all required columns
CREATE VIEW equipment_strategy_schedule AS
SELECT 
    es.strategy_id,
    es.equipment_id,
    e."設備名" as equipment_name,
    es.strategy_name,
    es.strategy_type,
    es.frequency_type,
    es.frequency_value,
    es.estimated_duration_hours,
    es.required_skill_level,
    es.required_area,
    es.task_description,
    es.safety_requirements,
    es.tools_required,
    es.parts_required,
    es.priority,
    es.is_active,
    COALESCE(
        MAX(tgl.next_generation_date),
        CURRENT_DATE
    ) as next_due_date,
    CASE 
        WHEN COALESCE(MAX(tgl.next_generation_date), CURRENT_DATE) <= CURRENT_DATE 
        THEN 'DUE'
        WHEN COALESCE(MAX(tgl.next_generation_date), CURRENT_DATE) <= CURRENT_DATE + INTERVAL '7 days'
        THEN 'UPCOMING'
        ELSE 'SCHEDULED'
    END as status,
    COUNT(tgl.log_id) as generation_count
FROM equipment_strategy es
LEFT JOIN equipment e ON es.equipment_id = e."設備ID"
LEFT JOIN task_generation_log tgl ON es.strategy_id = tgl.strategy_id
WHERE es.is_active = true
GROUP BY es.strategy_id, es.equipment_id, e."設備名", es.strategy_name, 
         es.strategy_type, es.frequency_type, es.frequency_value,
         es.estimated_duration_hours, es.required_skill_level, es.required_area,
         es.task_description, es.safety_requirements, es.tools_required,
         es.parts_required, es.priority, es.is_active;