-- Check if risk_scenarios table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%risk%'
ORDER BY table_name;

-- Check structure of risk_scenarios table if it exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'risk_scenarios'
ORDER BY ordinal_position;

-- Check sample data from risk_scenarios
SELECT * FROM risk_scenarios LIMIT 10;