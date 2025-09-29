-- Migration to work with existing village structure
-- This adds missing columns and updates the world map to work with your existing tables

-- Add missing columns to villages table if they don't exist
DO $$ 
BEGIN
    -- Add population column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='villages' AND column_name='population') THEN
        ALTER TABLE villages ADD COLUMN population integer DEFAULT 100;
    END IF;
    
    -- Add is_capital column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='villages' AND column_name='is_capital') THEN
        ALTER TABLE villages ADD COLUMN is_capital boolean DEFAULT false;
    END IF;
    
    -- Add coordinate constraints if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='villages_x_y_key') THEN
        ALTER TABLE villages ADD CONSTRAINT villages_x_y_key UNIQUE(x, y);
    END IF;
    
    -- Add world bounds constraints if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name='villages_x_bounds') THEN
        ALTER TABLE villages ADD CONSTRAINT villages_x_bounds CHECK (x >= -400 AND x <= 400);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name='villages_y_bounds') THEN
        ALTER TABLE villages ADD CONSTRAINT villages_y_bounds CHECK (y >= -400 AND y <= 400);
    END IF;
END $$;

-- Create resource_fields table if it doesn't exist
CREATE TABLE IF NOT EXISTS resource_fields (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  village_id uuid REFERENCES villages(id) ON DELETE CASCADE NOT NULL,
  field_type text NOT NULL, -- 'wood', 'clay', 'iron', 'crop'
  level integer DEFAULT 0,
  position integer NOT NULL, -- Position around village (1-18)
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Each village field position can only have one resource field
  UNIQUE(village_id, position),
  
  -- Valid field positions and types
  CONSTRAINT resource_fields_position_check CHECK (position >= 1 AND position <= 18),
  CONSTRAINT resource_fields_level_check CHECK (level >= 0),
  CONSTRAINT resource_fields_type_check CHECK (field_type IN ('wood', 'clay', 'iron', 'crop'))
);

-- Enable RLS on resource_fields if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='resource_fields') THEN
        ALTER TABLE resource_fields ENABLE ROW LEVEL SECURITY;
        
        -- Add RLS policy for resource_fields
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='resource_fields' AND policyname='Users can manage resource fields in own villages') THEN
            CREATE POLICY "Users can manage resource fields in own villages" ON resource_fields
            FOR ALL USING (
              village_id IN (
                SELECT id FROM villages WHERE owner_id = auth.uid()
              )
            );
        END IF;
    END IF;
END $$;

-- Add missing RLS policies for villages (compatible with owner_id structure)
DO $$
BEGIN
    -- Policy for viewing all villages
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='villages' AND policyname='Users can view all villages') THEN
        CREATE POLICY "Users can view all villages" ON villages FOR SELECT USING (true);
    END IF;
    
    -- Policy for creating villages (compatible with owner_id)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='villages' AND policyname='Users can create their own villages') THEN
        CREATE POLICY "Users can create their own villages" ON villages FOR INSERT WITH CHECK (auth.uid() = owner_id);
    END IF;
END $$;

-- Create performance indexes if they don't exist
CREATE INDEX IF NOT EXISTS villages_owner_id_idx ON villages(owner_id);
CREATE INDEX IF NOT EXISTS villages_coordinates_idx ON villages(x, y);
CREATE INDEX IF NOT EXISTS buildings_village_id_idx ON buildings(village_id);

-- Add resource_fields indexes if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='resource_fields') THEN
        CREATE INDEX IF NOT EXISTS resource_fields_village_id_idx ON resource_fields(village_id);
    END IF;
END $$;

-- Create or update the timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add timestamp triggers if updated_at column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='villages' AND column_name='updated_at') THEN
        DROP TRIGGER IF EXISTS update_villages_updated_at ON villages;
        CREATE TRIGGER update_villages_updated_at BEFORE UPDATE ON villages
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='buildings' AND column_name='updated_at') THEN
        DROP TRIGGER IF EXISTS update_buildings_updated_at ON buildings;
        CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='resource_fields') THEN
        DROP TRIGGER IF EXISTS update_resource_fields_updated_at ON resource_fields;
        CREATE TRIGGER update_resource_fields_updated_at BEFORE UPDATE ON resource_fields
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;