import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types (we'll expand this as we build)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          tribe: number
          gold: number
          premium: boolean
          created_at: string
          last_active: string
        }
        Insert: {
          id: string
          username: string
          email: string
          tribe: number
          gold?: number
          premium?: boolean
          created_at?: string
          last_active?: string
        }
      }
      villages: {
        Row: {
          id: string
          user_id: string
          name: string
          x: number
          y: number
          population: number
          wood: number
          clay: number
          iron: number
          crop: number
          wood_production: number
          clay_production: number
          iron_production: number
          crop_production: number
          created_at: string
          updated_at: string
        }
      }
    }
  }
}