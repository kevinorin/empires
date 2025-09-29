import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Client-side Supabase client
export const createClient = () => {
  return createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  })
}

// Server-side Supabase client
export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}

// Legacy client for immediate use (we'll phase this out)
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://oqwgvjazqcffiypqiuui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xd2d2amF6cWNmZml5cHFpdXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDE2MDUsImV4cCI6MjA3NDQxNzYwNX0.XOq8DReYqW8yzsOBDuA-cUSaSJIe1BUzZsZx5nRqrlY'
export const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

// Database types (we'll expand this as we build)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          tribe: 'romans' | 'teutons' | 'gauls'
          gold: number
          silver: number
          created_at: string
          last_active: string
        }
        Insert: {
          id: string
          username: string
          email: string
          tribe: 'romans' | 'teutons' | 'gauls'
          gold?: number
          silver?: number
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