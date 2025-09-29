-- Empires Game Database Schema

-- Users table (handled by Supabase Auth)
-- auth.users already exists

-- Villages table - represents player settlements in the world
CREATE TABLE IF NOT EXISTS villages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL DEFAULT 'New Village',
  x integer NOT NULL,
  y integer NOT NULL,
  population integer DEFAULT 100,
  is_capital boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Ensure each coordinate can only have one village
  UNIQUE(x, y),
  
  -- World bounds constraint (-400 to +400)
  CONSTRAINT villages_x_bounds CHECK (x >= -400 AND x <= 400),
  CONSTRAINT villages_y_bounds CHECK (y >= -400 AND y <= 400),
  
  -- Each user can only have one capital
  CONSTRAINT one_capital_per_user EXCLUDE (user_id WITH =) WHERE (is_capital = true)
);

-- Buildings table - structures within villages
CREATE TABLE IF NOT EXISTS buildings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  village_id uuid REFERENCES villages(id) ON DELETE CASCADE NOT NULL,
  building_type text NOT NULL,
  level integer DEFAULT 1,
  position integer NOT NULL, -- Position in village (1-18 for building spots)
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Each village position can only have one building
  UNIQUE(village_id, position),
  
  -- Valid building positions (1-18)
  CONSTRAINT buildings_position_check CHECK (position >= 1 AND position <= 18),
  CONSTRAINT buildings_level_check CHECK (level >= 0)
);

-- Resource fields table - cropland and resource production outside village
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

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_fields ENABLE ROW LEVEL SECURITY;

-- Villages policies
CREATE POLICY "Users can view all villages" ON villages
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own villages" ON villages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own villages" ON villages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own villages" ON villages
  FOR DELETE USING (auth.uid() = user_id);

-- Buildings policies
CREATE POLICY "Users can view buildings in any village" ON buildings
  FOR SELECT USING (true);

CREATE POLICY "Users can manage buildings in their own villages" ON buildings
  FOR ALL USING (
    village_id IN (
      SELECT id FROM villages WHERE user_id = auth.uid()
    )
  );

-- Resource fields policies
CREATE POLICY "Users can view resource fields in any village" ON resource_fields
  FOR SELECT USING (true);

CREATE POLICY "Users can manage resource fields in their own villages" ON resource_fields
  FOR ALL USING (
    village_id IN (
      SELECT id FROM villages WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS villages_user_id_idx ON villages(user_id);
CREATE INDEX IF NOT EXISTS villages_coordinates_idx ON villages(x, y);
CREATE INDEX IF NOT EXISTS buildings_village_id_idx ON buildings(village_id);
CREATE INDEX IF NOT EXISTS resource_fields_village_id_idx ON resource_fields(village_id);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_villages_updated_at BEFORE UPDATE ON villages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_fields_updated_at BEFORE UPDATE ON resource_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();