-- Fix for Supabase Auth integration
-- This creates the missing user_profiles table and fixes village creation

-- Create user_profiles table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    tribe INTEGER DEFAULT 1 CHECK (tribe IN (1, 2, 3, 4, 5)),
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

-- Update villages table to reference auth.users
DO $$ 
BEGIN
    -- Drop existing owner_id constraint if it exists
    ALTER TABLE villages DROP CONSTRAINT IF EXISTS villages_owner_id_fkey;
    
    -- Add proper owner_id reference to auth.users
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='villages' AND column_name='owner_id') THEN
        ALTER TABLE villages ALTER COLUMN owner_id SET NOT NULL;
        ALTER TABLE villages ADD CONSTRAINT villages_owner_id_fkey 
            FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    ELSE
        ALTER TABLE villages ADD COLUMN owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add missing columns for resource management
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='villages' AND column_name='wood_production') THEN
        ALTER TABLE villages ADD COLUMN wood_production INTEGER DEFAULT 6 CHECK (wood_production >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='villages' AND column_name='clay_production') THEN
        ALTER TABLE villages ADD COLUMN clay_production INTEGER DEFAULT 6 CHECK (clay_production >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='villages' AND column_name='iron_production') THEN
        ALTER TABLE villages ADD COLUMN iron_production INTEGER DEFAULT 6 CHECK (iron_production >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='villages' AND column_name='crop_production') THEN
        ALTER TABLE villages ADD COLUMN crop_production INTEGER DEFAULT 6 CHECK (crop_production >= 0);
    END IF;
    
    -- Fix capital column name
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='villages' AND column_name='is_capital') THEN
        ALTER TABLE villages RENAME COLUMN is_capital TO capital;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='villages' AND column_name='capital') THEN
        ALTER TABLE villages ADD COLUMN capital BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update buildings table to match schema
DO $$ 
BEGIN
    -- Add field column if missing (for building positions)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='buildings' AND column_name='field') THEN
        ALTER TABLE buildings ADD COLUMN field INTEGER NOT NULL DEFAULT 1 CHECK (field BETWEEN 1 AND 40);
    END IF;
    
    -- Add completes_at column if missing (for construction)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='buildings' AND column_name='completes_at') THEN
        ALTER TABLE buildings ADD COLUMN completes_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Ensure unique constraint on village_id, field
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='buildings_village_id_field_key') THEN
        ALTER TABLE buildings ADD CONSTRAINT buildings_village_id_field_key UNIQUE(village_id, field);
    END IF;
END $$;

-- Function to handle new user creation
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

-- Trigger for auto-creating user profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);
    
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for villages
CREATE POLICY "Users can view their own villages" ON villages
    FOR SELECT USING (auth.uid() = owner_id);
    
CREATE POLICY "Users can create villages" ON villages
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
    
CREATE POLICY "Users can update their own villages" ON villages
    FOR UPDATE USING (auth.uid() = owner_id);

-- RLS Policies for buildings
CREATE POLICY "Users can view buildings in their villages" ON buildings
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM villages WHERE id = buildings.village_id
        )
    );
    
CREATE POLICY "Users can create buildings in their villages" ON buildings
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT owner_id FROM villages WHERE id = buildings.village_id
        )
    );
    
CREATE POLICY "Users can update buildings in their villages" ON buildings
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT owner_id FROM villages WHERE id = buildings.village_id
        )
    );

-- Helper function for adding resources
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON villages TO authenticated;
GRANT ALL ON buildings TO authenticated;
GRANT EXECUTE ON FUNCTION add_village_resources TO authenticated;