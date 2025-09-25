-- Empires Game Database Schema
-- Execute this in Supabase SQL Editor or any PostgreSQL client
-- Version: 1.0.0

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User/Player Management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    tribe INTEGER DEFAULT 1 CHECK (tribe IN (1, 2, 3)), -- 1=Romans, 2=Teutons, 3=Gauls
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

-- Basic RLS policies (can be expanded later)
CREATE POLICY "Users can view own data" ON users FOR ALL USING (auth.uid()::text = id::text);
CREATE POLICY "Users can view own villages" ON villages FOR ALL USING (auth.uid()::text = owner_id::text);
CREATE POLICY "Users can view buildings in own villages" ON buildings FOR ALL USING (
    village_id IN (SELECT id FROM villages WHERE owner_id::text = auth.uid()::text)
);
CREATE POLICY "Users can view units in own villages" ON units FOR ALL USING (
    village_id IN (SELECT id FROM villages WHERE owner_id::text = auth.uid()::text)
);
CREATE POLICY "Users can view own messages" ON messages FOR ALL USING (
    auth.uid()::text = sender_id::text OR auth.uid()::text = recipient_id::text
);
CREATE POLICY "Users can view own reports" ON reports FOR ALL USING (auth.uid()::text = user_id::text);