# Empires Game Database

## Setup Instructions

### 1. Execute Schema in Supabase
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to SQL Editor  
3. Copy and paste the contents of `schema.sql`
4. Click "Run" to execute the schema
5. **Important**: Do NOT run `seed.sql` until you have created test users

### 2. Verify Tables Created
Check that these tables were created:
- users
- villages  
- buildings
- units
- alliances
- alliance_members
- messages
- reports
- game_events

### 3. Generate Prisma Client (Optional)
If you want to use Prisma for type-safe queries:
```bash
cd packages/database
npm run generate
```

## Database Structure

### Core Tables
- **users**: Player accounts and game stats
- **villages**: Player settlements with resources
- **buildings**: Structures within villages
- **units**: Military forces
- **alliances**: Player groups
- **messages**: In-game communication
- **reports**: Battle reports and notifications
- **game_events**: Scheduled game actions

### Key Features
- UUID primary keys for better performance
- Row Level Security (RLS) enabled
- Automatic timestamp updates
- Proper indexes for queries
- JSONB for flexible data storage

## Development Notes

- Schema is designed to handle 50K+ concurrent players
- Uses PostgreSQL-specific features (UUIDs, JSONB, RLS)
- Optimized for real-time game mechanics
- Compatible with Supabase's auth system