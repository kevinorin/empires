-- Empires Game Database Schema
-- Execute this in Supabase SQL Editor or any PostgreSQL client
-- Version: 1.0.0
-- WARNING: This will DELETE ALL existing data and start fresh!

-- Drop existing tables (if they exist) to start fresh
DROP TABLE IF EXISTS unit_types CASCADE;
DROP TABLE IF EXISTS building_types CASCADE;
DROP TABLE IF EXISTS game_events CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS alliance_members CASCADE;
DROP TABLE IF EXISTS alliances CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS villages CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User/Player Management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    tribe INTEGER DEFAULT 1 CHECK (tribe IN (1, 2, 3, 4, 5)), -- 1=Romans, 2=Teutons, 3=Gauls, 4=Egyptians, 5=Nubians
    gold INTEGER DEFAULT 0 CHECK (gold >= 0),
    premium BOOLEAN DEFAULT FALSE,
    premium_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Game stats
    total_villages INTEGER DEFAULT 1 CHECK (total_villages >= 1),
    population INTEGER DEFAULT 0 CHECK (population >= 0)
);

-- Villages - core game entity
CREATE TABLE villages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    capital BOOLEAN DEFAULT FALSE,
    
    -- Resources
    wood INTEGER DEFAULT 750 CHECK (wood >= 0),
    clay INTEGER DEFAULT 750 CHECK (clay >= 0),
    iron INTEGER DEFAULT 750 CHECK (iron >= 0),
    crop INTEGER DEFAULT 750 CHECK (crop >= 0),
    
    -- Storage capacity
    warehouse INTEGER DEFAULT 800 CHECK (warehouse > 0),
    granary INTEGER DEFAULT 800 CHECK (granary > 0),
    
    -- Production rates (per hour)
    wood_production INTEGER DEFAULT 6 CHECK (wood_production >= 0),
    clay_production INTEGER DEFAULT 6 CHECK (clay_production >= 0),
    iron_production INTEGER DEFAULT 6 CHECK (iron_production >= 0),
    crop_production INTEGER DEFAULT 6 CHECK (crop_production >= 0),
    
    -- Population
    population INTEGER DEFAULT 2 CHECK (population >= 0),
    
    -- Relations
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(x, y)
);

-- Buildings in villages
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type INTEGER NOT NULL CHECK (type BETWEEN 1 AND 40), -- Building type ID
    level INTEGER DEFAULT 0 CHECK (level >= 0 AND level <= 20),
    field INTEGER NOT NULL CHECK (field BETWEEN 1 AND 40), -- Position on village
    
    -- Construction status
    is_building BOOLEAN DEFAULT FALSE,
    completes_at TIMESTAMP WITH TIME ZONE,
    
    -- Relations
    village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(village_id, field)
);

-- Military units
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type INTEGER NOT NULL CHECK (type BETWEEN 1 AND 50), -- Unit type ID
    quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
    
    -- Training status
    is_training BOOLEAN DEFAULT FALSE,
    completes_at TIMESTAMP WITH TIME ZONE,
    
    -- Relations
    village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alliance system
CREATE TABLE alliances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    tag VARCHAR(8) UNIQUE NOT NULL,
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE alliance_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'leader', 'diplomat')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Relations
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alliance_id UUID NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
    
    UNIQUE(user_id, alliance_id)
);

-- Messages/Communication
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    type VARCHAR(20) DEFAULT 'personal' CHECK (type IN ('personal', 'alliance', 'system')),
    
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Battle reports and notifications
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL, -- attack, defense, trade, etc.
    title VARCHAR(200) NOT NULL,
    content JSONB NOT NULL, -- Store battle details as JSON
    read BOOLEAN DEFAULT FALSE,
    
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game events for real-time updates
CREATE TABLE game_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL, -- building_complete, attack_arrived, etc.
    data JSONB NOT NULL, -- Event-specific data
    processed BOOLEAN DEFAULT FALSE,
    execute_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helper function to add resources to a village (for refunds, etc.)
CREATE OR REPLACE FUNCTION add_village_resources(
    village_id UUID,
    wood_amount INTEGER DEFAULT 0,
    clay_amount INTEGER DEFAULT 0,
    iron_amount INTEGER DEFAULT 0,
    crop_amount INTEGER DEFAULT 0
) RETURNS VOID AS $$
BEGIN
    UPDATE villages 
    SET 
        wood = LEAST(wood + wood_amount, warehouse),
        clay = LEAST(clay + clay_amount, warehouse),
        iron = LEAST(iron + iron_amount, warehouse),
        crop = LEAST(crop + crop_amount, granary),
        updated_at = NOW()
    WHERE id = village_id;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX idx_villages_owner ON villages(owner_id);
CREATE INDEX idx_villages_coordinates ON villages(x, y);
CREATE INDEX idx_buildings_village ON buildings(village_id);
CREATE INDEX idx_buildings_type_level ON buildings(type, level);
CREATE INDEX idx_units_village ON units(village_id);
CREATE INDEX idx_units_type ON units(type);
CREATE INDEX idx_alliance_members_user ON alliance_members(user_id);
CREATE INDEX idx_alliance_members_alliance ON alliance_members(alliance_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_game_events_execute_at ON game_events(execute_at);
CREATE INDEX idx_game_events_processed ON game_events(processed);
CREATE INDEX idx_users_last_active ON users(last_active);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_villages_updated_at BEFORE UPDATE ON villages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alliances_updated_at BEFORE UPDATE ON alliances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initial game data will be created when first users register
-- No seed data needed - villages are created per player

-- Comments for documentation
COMMENT ON TABLE users IS 'Player accounts and basic game statistics';
COMMENT ON TABLE villages IS 'Player villages with resources and coordinates';
COMMENT ON TABLE buildings IS 'Buildings within villages with levels and construction status';
COMMENT ON TABLE units IS 'Military units stationed in villages';
COMMENT ON TABLE alliances IS 'Player alliances for cooperation';
COMMENT ON TABLE alliance_members IS 'Membership relationships between users and alliances';
COMMENT ON TABLE messages IS 'In-game messaging system';
COMMENT ON TABLE reports IS 'Battle reports and game notifications';
COMMENT ON TABLE game_events IS 'Scheduled events for game mechanics';

-- Row Level Security (RLS) for multi-tenancy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Authentication Functions and Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert user profile into public.users table
  INSERT INTO public.users (id, email, username, tribe)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'tribe')::integer, 1)
  );

  -- Create initial village for the user
  INSERT INTO public.villages (name, x, y, owner_id)
  VALUES (
    'Capital City',
    floor(random() * 200 - 100)::integer,
    floor(random() * 200 - 100)::integer,
    NEW.id
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Trigger to automatically create user profile and village on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- RLS Policies for proper authentication
DROP POLICY IF EXISTS "Users can manage own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable read access for own profile" ON users;
DROP POLICY IF EXISTS "Enable update for own profile" ON users;
DROP POLICY IF EXISTS "Enable delete for own profile" ON users;

-- Create more permissive policies for signup flow
CREATE POLICY "Enable insert for authenticated users only" ON users 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable read access for own profile" ON users 
FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Enable update for own profile" ON users 
FOR UPDATE USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Enable delete for own profile" ON users 
FOR DELETE USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Users can manage own villages" ON villages;
DROP POLICY IF EXISTS "Enable village access for owner" ON villages;
DROP POLICY IF EXISTS "Enable village insert for authenticated" ON villages;

CREATE POLICY "Enable village access for owner" ON villages 
FOR ALL USING (auth.uid()::text = owner_id::text)
WITH CHECK (auth.uid()::text = owner_id::text);

CREATE POLICY "Users can manage buildings in own villages" ON buildings FOR ALL USING (
    village_id IN (SELECT id FROM villages WHERE owner_id::text = auth.uid()::text)
) WITH CHECK (
    village_id IN (SELECT id FROM villages WHERE owner_id::text = auth.uid()::text)
);

CREATE POLICY "Users can manage units in own villages" ON units FOR ALL USING (
    village_id IN (SELECT id FROM villages WHERE owner_id::text = auth.uid()::text)
) WITH CHECK (
    village_id IN (SELECT id FROM villages WHERE owner_id::text = auth.uid()::text)
);

CREATE POLICY "Users can manage own messages" ON messages FOR ALL USING (
    auth.uid()::text = sender_id::text OR auth.uid()::text = recipient_id::text
) WITH CHECK (
    auth.uid()::text = sender_id::text OR auth.uid()::text = recipient_id::text
);

CREATE POLICY "Users can manage own reports" ON reports FOR ALL 
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.villages TO authenticated;
GRANT ALL ON public.buildings TO authenticated;
GRANT ALL ON public.units TO authenticated;
GRANT ALL ON public.alliances TO authenticated;
GRANT ALL ON public.alliance_members TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.reports TO authenticated;
GRANT ALL ON public.game_events TO authenticated;
GRANT SELECT ON public.users TO anon;

-- Seed Data: Building Types Reference (optional reference table)
CREATE TABLE IF NOT EXISTS building_types (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    category VARCHAR(20) -- resource, military, infrastructure
);

INSERT INTO building_types (id, name, description, category) VALUES
(1, 'Woodcutter', 'Produces wood', 'resource'),
(2, 'Clay Pit', 'Produces clay', 'resource'),
(3, 'Iron Mine', 'Produces iron', 'resource'),
(4, 'Cropland', 'Produces crop', 'resource'),
(10, 'Warehouse', 'Stores wood, clay, and iron', 'infrastructure'),
(11, 'Granary', 'Stores crop', 'infrastructure'),
(15, 'Main Building', 'Village administration center', 'infrastructure'),
(16, 'Rally Point', 'Military coordination', 'military'),
(19, 'Barracks', 'Trains infantry', 'military'),
(20, 'Stable', 'Trains cavalry', 'military'),
(21, 'Workshop', 'Builds siege engines', 'military')
ON CONFLICT (id) DO NOTHING;

-- Unit Types Reference (optional reference table)
CREATE TABLE IF NOT EXISTS unit_types (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    tribe INTEGER, -- 1=Romans, 2=Teutons, 3=Gauls, 4=Egyptians, 5=Nubians, null=all
    category VARCHAR(20) -- infantry, cavalry, siege
);

INSERT INTO unit_types (id, name, tribe, category) VALUES
-- Roman units
(1, 'Legionnaire', 1, 'infantry'),
(2, 'Praetorian', 1, 'infantry'),
(3, 'Imperian', 1, 'infantry'),
(4, 'Equites Legati', 1, 'cavalry'),
(5, 'Equites Imperatoris', 1, 'cavalry'),
(6, 'Equites Caesaris', 1, 'cavalry'),
(7, 'Battering Ram', 1, 'siege'),
(8, 'Fire Catapult', 1, 'siege'),
-- Teuton units
(11, 'Clubswinger', 2, 'infantry'),
(12, 'Spearfighter', 2, 'infantry'),
(13, 'Axefighter', 2, 'infantry'),
(14, 'Scout', 2, 'cavalry'),
(15, 'Paladin', 2, 'cavalry'),
(16, 'Teutonic Knight', 2, 'cavalry'),
(17, 'Ram', 2, 'siege'),
(18, 'Catapult', 2, 'siege'),
-- Gaul units
(21, 'Phalanx', 3, 'infantry'),
(22, 'Swordsman', 3, 'infantry'),
(23, 'Pathfinder', 3, 'cavalry'),
(24, 'Theutates Thunder', 3, 'cavalry'),
(25, 'Druidrider', 3, 'cavalry'),
(26, 'Haeduan', 3, 'cavalry'),
(27, 'Ram', 3, 'siege'),
(28, 'Trebuchet', 3, 'siege'),
-- Egyptian units
(31, 'Spearman', 4, 'infantry'),
(32, 'Archer', 4, 'infantry'),
(33, 'Khopesh Warrior', 4, 'infantry'),
(34, 'Chariot Archer', 4, 'cavalry'),
(35, 'War Chariot', 4, 'cavalry'),
(36, 'Camel Rider', 4, 'cavalry'),
(37, 'Siege Tower', 4, 'siege'),
(38, 'Onager', 4, 'siege'),
-- Nubian units
(41, 'Kushite Spearman', 5, 'infantry'),
(42, 'Nubian Archer', 5, 'infantry'),
(43, 'Desert Warrior', 5, 'infantry'),
(44, 'Camel Scout', 5, 'cavalry'),
(45, 'Royal Guard', 5, 'cavalry'),
(46, 'War Elephant', 5, 'cavalry'),
(47, 'Battering Ram', 5, 'siege'),
(48, 'Scorpion', 5, 'siege')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE building_types IS 'Reference data for building types';
COMMENT ON TABLE unit_types IS 'Reference data for unit types by tribe';