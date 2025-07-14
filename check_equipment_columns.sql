-- Check equipment table column names
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'equipment' 
ORDER BY ordinal_position;
