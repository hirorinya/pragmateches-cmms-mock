-- Check current structure of equipment_risk_assessment table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'equipment_risk_assessment' 
ORDER BY ordinal_position;

-- Check if the table exists at all
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'equipment_risk_assessment'
);

-- Sample existing data if table exists
SELECT * FROM equipment_risk_assessment LIMIT 5;