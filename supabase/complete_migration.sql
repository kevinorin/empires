-- Complete Database Migration for Village System
-- Run this in Supabase SQL Editor to create all missing tables

-- 1. Create user_profiles table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    tribe INTEGER DEFAULT 1 CHECK (tribe IN (1, 2, 3, 4, 5)),
    gold INTEGER DEFAULT 0 CHECK (gold >= 0),
    premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create villages table
CREATE TABLE IF NOT EXISTS villages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL DEFAULT 'Village',
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    wood INTEGER DEFAULT 750,
    clay INTEGER DEFAULT 750,
    iron INTEGER DEFAULT 750,
    crop INTEGER DEFAULT 750,
    wood_production INTEGER DEFAULT 6,
    clay_production INTEGER DEFAULT 6,
    iron_production INTEGER DEFAULT 6,
    crop_production INTEGER DEFAULT 6,
    population INTEGER DEFAULT 100,
    is_capital BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(x, y),
    CONSTRAINT villages_x_bounds CHECK (x >= -400 AND x <= 400),
    CONSTRAINT villages_y_bounds CHECK (y >= -400 AND y <= 400)
);

-- 3. Create buildings table
CREATE TABLE IF NOT EXISTS buildings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    village_id UUID REFERENCES villages(id) ON DELETE CASCADE NOT NULL,
    building_type INTEGER NOT NULL,
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    slot_position INTEGER NOT NULL CHECK (slot_position >= 1 AND slot_position <= 20),
    is_under_construction BOOLEAN DEFAULT FALSE,
    construction_complete_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Each village slot can only have one building
    UNIQUE(village_id, slot_position)
);

-- 4. Create resource_fields table
CREATE TABLE IF NOT EXISTS resource_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    village_id UUID REFERENCES villages(id) ON DELETE CASCADE NOT NULL,
    field_type TEXT NOT NULL, -- 'wood', 'clay', 'iron', 'crop'
    level INTEGER DEFAULT 0,
    position INTEGER NOT NULL, -- Position around village (1-18)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Each village field position can only have one resource field
    UNIQUE(village_id, position),
    
    -- Valid field positions and types
    CONSTRAINT resource_fields_position_check CHECK (position >= 1 AND position <= 18),
    CONSTRAINT resource_fields_level_check CHECK (level >= 0),
    CONSTRAINT resource_fields_type_check CHECK (field_type IN ('wood', 'clay', 'iron', 'crop'))
);

-- 5. Function to handle new user creation and auto-create user profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger for auto-creating user profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_fields ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR ALL USING (auth.uid() = id);

-- 9. RLS Policies for villages
DROP POLICY IF EXISTS "Users can view all villages" ON villages;
CREATE POLICY "Users can view all villages" ON villages 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own villages" ON villages;
CREATE POLICY "Users can manage their own villages" ON villages
    FOR ALL USING (auth.uid() = owner_id);

-- 10. RLS Policies for buildings
DROP POLICY IF EXISTS "Users can manage buildings in own villages" ON buildings;
CREATE POLICY "Users can manage buildings in own villages" ON buildings
    FOR ALL USING (
        village_id IN (
            SELECT id FROM villages WHERE owner_id = auth.uid()
        )
    );

-- 11. RLS Policies for resource_fields
DROP POLICY IF EXISTS "Users can manage resource fields in own villages" ON resource_fields;
CREATE POLICY "Users can manage resource fields in own villages" ON resource_fields
    FOR ALL USING (
        village_id IN (
            SELECT id FROM villages WHERE owner_id = auth.uid()
        )
    );

-- 12. Create performance indexes
CREATE INDEX IF NOT EXISTS user_profiles_username_idx ON user_profiles(username);
CREATE INDEX IF NOT EXISTS villages_owner_id_idx ON villages(owner_id);
CREATE INDEX IF NOT EXISTS villages_coordinates_idx ON villages(x, y);
CREATE INDEX IF NOT EXISTS buildings_village_id_idx ON buildings(village_id);
CREATE INDEX IF NOT EXISTS resource_fields_village_id_idx ON resource_fields(village_id);

-- 13. Create timestamp update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 14. Add timestamp triggers to all tables
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_villages_updated_at ON villages;
CREATE TRIGGER update_villages_updated_at 
    BEFORE UPDATE ON villages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_buildings_updated_at ON buildings;
CREATE TRIGGER update_buildings_updated_at 
    BEFORE UPDATE ON buildings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resource_fields_updated_at ON resource_fields;
CREATE TRIGGER update_resource_fields_updated_at 
    BEFORE UPDATE ON resource_fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 15. Create a function to initialize a new village for a user
CREATE OR REPLACE FUNCTION create_initial_village(user_id UUID, village_name TEXT DEFAULT 'My Village')
RETURNS UUID AS $$
DECLARE
    village_id UUID;
    random_x INTEGER;
    random_y INTEGER;
    max_attempts INTEGER := 100;
    attempt_count INTEGER := 0;
BEGIN
    -- Find a random unoccupied position
    LOOP
        random_x := floor(random() * 800) - 400; -- Random between -400 and 399
        random_y := floor(random() * 800) - 400; -- Random between -400 and 399
        
        -- Check if position is free
        IF NOT EXISTS (SELECT 1 FROM villages WHERE x = random_x AND y = random_y) THEN
            EXIT; -- Position is free, exit loop
        END IF;
        
        attempt_count := attempt_count + 1;
        IF attempt_count >= max_attempts THEN
            RAISE EXCEPTION 'Could not find free position after % attempts', max_attempts;
        END IF;
    END LOOP;
    
    -- Create the village
    INSERT INTO villages (owner_id, name, x, y, is_capital)
    VALUES (user_id, village_name, random_x, random_y, true)
    RETURNING id INTO village_id;
    
    -- Create initial main building
    INSERT INTO buildings (village_id, building_type, level, slot_position)
    VALUES (village_id, 26, 1, 1); -- Main building (g26.gif) at slot 1
    
    -- Initialize resource fields with default layout
    -- Wood fields (positions 1-4)
    INSERT INTO resource_fields (village_id, field_type, level, position)
    VALUES 
        (village_id, 'wood', 0, 1),
        (village_id, 'wood', 0, 2),
        (village_id, 'wood', 0, 3),
        (village_id, 'wood', 0, 4);
    
    -- Clay fields (positions 5-8)
    INSERT INTO resource_fields (village_id, field_type, level, position)
    VALUES 
        (village_id, 'clay', 0, 5),
        (village_id, 'clay', 0, 6),
        (village_id, 'clay', 0, 7),
        (village_id, 'clay', 0, 8);
    
    -- Iron fields (positions 9-12)
    INSERT INTO resource_fields (village_id, field_type, level, position)
    VALUES 
        (village_id, 'iron', 0, 9),
        (village_id, 'iron', 0, 10),
        (village_id, 'iron', 0, 11),
        (village_id, 'iron', 0, 12);
    
    -- Crop fields (positions 13-18)
    INSERT INTO resource_fields (village_id, field_type, level, position)
    VALUES 
        (village_id, 'crop', 0, 13),
        (village_id, 'crop', 0, 14),
        (village_id, 'crop', 0, 15),
        (village_id, 'crop', 0, 16),
        (village_id, 'crop', 0, 17),
        (village_id, 'crop', 0, 18);
    
    RETURN village_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Create function to auto-create village for new users
CREATE OR REPLACE FUNCTION handle_new_user_village()
RETURNS TRIGGER AS $$
BEGIN
    -- Create initial village after user profile is created
    PERFORM create_initial_village(NEW.id, 'My Village');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Trigger to auto-create village for new users
DROP TRIGGER IF EXISTS on_user_profile_created ON user_profiles;
CREATE TRIGGER on_user_profile_created
    AFTER INSERT ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_village();

-- 18. Create profile and village for existing users (if any)
-- Run this to create profile for your current user
DO $$
DECLARE
    existing_user_id UUID;
    existing_email TEXT;
BEGIN
    -- Check if there are any users without profiles
    FOR existing_user_id, existing_email IN 
        SELECT au.id, au.email 
        FROM auth.users au 
        LEFT JOIN user_profiles up ON au.id = up.id 
        WHERE up.id IS NULL
    LOOP
        -- Create profile for existing user
        INSERT INTO user_profiles (id, email, username)
        VALUES (
            existing_user_id,
            existing_email,
            split_part(existing_email, '@', 1)
        );
        
        -- Create initial village for existing user
        PERFORM create_initial_village(existing_user_id, 'My Village');
        
        RAISE NOTICE 'Created profile and village for user: %', existing_email;
    END LOOP;
END $$;