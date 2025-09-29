-- Add only missing columns, constraints, and policies
-- Run this if you want to update existing tables instead of recreating

-- Add missing columns to villages (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='villages' AND column_name='is_capital') THEN
        ALTER TABLE villages ADD COLUMN is_capital boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='villages' AND column_name='population') THEN
        ALTER TABLE villages ADD COLUMN population integer DEFAULT 100;
    END IF;
END $$;

-- Add missing constraints (only if they don't exist)
DO $$
BEGIN
    -- Add coordinate uniqueness constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='villages_x_y_key') THEN
        ALTER TABLE villages ADD CONSTRAINT villages_x_y_key UNIQUE(x, y);
    END IF;
    
    -- Add world bounds constraints
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name='villages_x_bounds') THEN
        ALTER TABLE villages ADD CONSTRAINT villages_x_bounds CHECK (x >= -400 AND x <= 400);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name='villages_y_bounds') THEN
        ALTER TABLE villages ADD CONSTRAINT villages_y_bounds CHECK (y >= -400 AND y <= 400);
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (will skip if they already exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='villages' AND policyname='Users can view all villages') THEN
        CREATE POLICY "Users can view all villages" ON villages FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='villages' AND policyname='Users can create their own villages') THEN
        CREATE POLICY "Users can create their own villages" ON villages FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='villages' AND policyname='Users can update their own villages') THEN
        CREATE POLICY "Users can update their own villages" ON villages FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='villages' AND policyname='Users can delete their own villages') THEN
        CREATE POLICY "Users can delete their own villages" ON villages FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS villages_user_id_idx ON villages(user_id);
CREATE INDEX IF NOT EXISTS villages_coordinates_idx ON villages(x, y);

-- Create update function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_villages_updated_at ON villages;
CREATE TRIGGER update_villages_updated_at BEFORE UPDATE ON villages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();