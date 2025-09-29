import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = 'https://oqwgvjazqcffiypqiuui.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xd2d2amF6cWNmZml5cHFpdXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg0MTYwNSwiZXhwIjoyMDc0NDE3NjA1fQ.-m5zrxvi-RbjQ_yWtqEw-aBGxTVYoBzYeezn5n_HVjk'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('Running migration to fix auth integration...')

    const migrationSQL = readFileSync(join(process.cwd(), 'supabase', 'fix_auth_migration.sql'), 'utf8')

    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error('Migration failed:', error)
      process.exit(1)
    }

    console.log('✅ Migration completed successfully!')
    console.log('🎯 Database is now ready for the village system')

  } catch (err) {
    console.error('Error running migration:', err)
    process.exit(1)
  }
}

runMigration()