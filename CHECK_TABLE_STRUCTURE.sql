-- Check the actual structure of daily_needs table
SELECT 'Checking daily_needs table structure...' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'daily_needs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if needs table exists and its structure
SELECT 'Checking needs table structure...' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'needs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data from daily_needs to understand the structure
SELECT 'Sample data from daily_needs:' as status;
SELECT * FROM daily_needs LIMIT 3;
