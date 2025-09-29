-- Drop existing tables and recreate them
-- WARNING: This will delete all existing data!
-- Only run this if you want to start fresh

-- Drop tables (cascades will remove dependent data)
DROP TABLE IF EXISTS resource_fields CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS villages CASCADE;

-- Drop the update function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Now run the world_map_migration.sql content after this...