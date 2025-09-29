## 🔧 Database Migration Required

The village system needs some database tables to be created. Please run this SQL in your Supabase dashboard:

### 1. Go to Supabase Dashboard
- Open https://supabase.com/dashboard
- Select your project: `oqwgvjazqcffiypqiuui`
- Go to **SQL Editor**

### 2. Run this SQL:

```sql
-- Create user_profiles table (linked to Supabase auth.users)
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

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);
    
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);
```

### 3. Fix Villages Table

```sql
-- Update villages table structure
DO $$ 
BEGIN
    -- Add missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='villages' AND column_name='owner_id') THEN
        ALTER TABLE villages ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='villages' AND column_name='capital') THEN
        ALTER TABLE villages ADD COLUMN capital BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='villages' AND column_name='wood') THEN
        ALTER TABLE villages ADD COLUMN wood INTEGER DEFAULT 750;
        ALTER TABLE villages ADD COLUMN clay INTEGER DEFAULT 750;
        ALTER TABLE villages ADD COLUMN iron INTEGER DEFAULT 750;
        ALTER TABLE villages ADD COLUMN crop INTEGER DEFAULT 750;
        ALTER TABLE villages ADD COLUMN warehouse INTEGER DEFAULT 800;
        ALTER TABLE villages ADD COLUMN granary INTEGER DEFAULT 800;
        ALTER TABLE villages ADD COLUMN wood_production INTEGER DEFAULT 30;
        ALTER TABLE villages ADD COLUMN clay_production INTEGER DEFAULT 30;
        ALTER TABLE villages ADD COLUMN iron_production INTEGER DEFAULT 30;
        ALTER TABLE villages ADD COLUMN crop_production INTEGER DEFAULT 30;
        ALTER TABLE villages ADD COLUMN population INTEGER DEFAULT 2;
    END IF;
END $$;

-- Enable RLS for villages
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for villages
CREATE POLICY "Users can view their own villages" ON villages
    FOR SELECT USING (auth.uid() = owner_id);
    
CREATE POLICY "Users can create villages" ON villages
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
    
CREATE POLICY "Users can update their own villages" ON villages
    FOR UPDATE USING (auth.uid() = owner_id);
```

### 4. Fix Buildings Table

```sql
-- Update buildings table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='buildings' AND column_name='field') THEN
        ALTER TABLE buildings ADD COLUMN field INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='buildings' AND column_name='is_building') THEN
        ALTER TABLE buildings ADD COLUMN is_building BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='buildings' AND column_name='completes_at') THEN
        ALTER TABLE buildings ADD COLUMN completes_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Enable RLS for buildings
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for buildings
CREATE POLICY "Users can manage buildings in their villages" ON buildings
    FOR ALL USING (
        auth.uid() IN (
            SELECT owner_id FROM villages WHERE id = buildings.village_id
        )
    );
```

---

## Alternative: Quick Fix for Testing

If you want to test immediately, I can create a simplified version that works with your current database structure.