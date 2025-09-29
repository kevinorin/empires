-- Check existing tables and their structure
-- Run these queries in your Supabase SQL editor to see what you already have

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('villages', 'buildings', 'resource_fields');

-- Check villages table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'villages' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check buildings table structure  
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buildings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check resource_fields table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'resource_fields' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check existing constraints
SELECT constraint_name, constraint_type, table_name
FROM information_schema.table_constraints 
WHERE table_name IN ('villages', 'buildings', 'resource_fields')
AND table_schema = 'public';

-- Check existing RLS policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('villages', 'buildings', 'resource_fields');