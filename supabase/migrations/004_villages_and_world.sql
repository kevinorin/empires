-- Villages table
CREATE TABLE IF NOT EXISTS villages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  population INTEGER DEFAULT 87,
  is_capital BOOLEAN DEFAULT false,
  
  -- Resources
  wood INTEGER DEFAULT 750,
  clay INTEGER DEFAULT 680,
  iron INTEGER DEFAULT 720,
  crop INTEGER DEFAULT 650,
  
  -- Production rates
  wood_production INTEGER DEFAULT 30,
  clay_production INTEGER DEFAULT 25,
  iron_production INTEGER DEFAULT 20,
  crop_production INTEGER DEFAULT 35,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_coordinates UNIQUE (x, y),
  CONSTRAINT valid_coordinates CHECK (x >= -400 AND x <= 400 AND y >= -400 AND y <= 400)
);

-- Buildings table
CREATE TABLE IF NOT EXISTS buildings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  village_id UUID REFERENCES villages(id) ON DELETE CASCADE,
  slot_id INTEGER NOT NULL, -- Building slot position (19-38 for village buildings)
  building_type INTEGER NOT NULL, -- Building type ID
  level INTEGER DEFAULT 1,
  is_empty BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_village_slot UNIQUE (village_id, slot_id),
  CONSTRAINT valid_slot CHECK (slot_id >= 1 AND slot_id <= 38),
  CONSTRAINT valid_level CHECK (level >= 0 AND level <= 20)
);

-- Resource fields table
CREATE TABLE IF NOT EXISTS resource_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  village_id UUID REFERENCES villages(id) ON DELETE CASCADE,
  field_id INTEGER NOT NULL, -- Field position (1-18 for resource fields)
  resource_type VARCHAR(10) NOT NULL, -- 'wood', 'clay', 'iron', 'crop'
  level INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_village_field UNIQUE (village_id, field_id),
  CONSTRAINT valid_field CHECK (field_id >= 1 AND field_id <= 18),
  CONSTRAINT valid_resource_type CHECK (resource_type IN ('wood', 'clay', 'iron', 'crop')),
  CONSTRAINT valid_level CHECK (level >= 1 AND level <= 20)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_villages_user_id ON villages(user_id);
CREATE INDEX IF NOT EXISTS idx_villages_coordinates ON villages(x, y);
CREATE INDEX IF NOT EXISTS idx_buildings_village_id ON buildings(village_id);
CREATE INDEX IF NOT EXISTS idx_resource_fields_village_id ON resource_fields(village_id);

-- Enable Row Level Security
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies for villages
CREATE POLICY "Villages are viewable by everyone" ON villages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own villages" ON villages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own villages" ON villages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own villages" ON villages
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for buildings
CREATE POLICY "Buildings are viewable by village owner" ON buildings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM villages 
      WHERE villages.id = buildings.village_id 
      AND villages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage buildings in their villages" ON buildings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM villages 
      WHERE villages.id = buildings.village_id 
      AND villages.user_id = auth.uid()
    )
  );

-- RLS Policies for resource fields
CREATE POLICY "Resource fields are viewable by village owner" ON resource_fields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM villages 
      WHERE villages.id = resource_fields.village_id 
      AND villages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage resource fields in their villages" ON resource_fields
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM villages 
      WHERE villages.id = resource_fields.village_id 
      AND villages.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_villages_updated_at BEFORE UPDATE ON villages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_fields_updated_at BEFORE UPDATE ON resource_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();