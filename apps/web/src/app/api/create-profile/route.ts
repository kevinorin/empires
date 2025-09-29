import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use the service role key for server-side operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('👤 Create profile API called')
    const { userId, email, username, tribe } = await request.json()
    console.log('👤 Creating profile for:', { userId, email, username, tribe })

    if (!userId || !email || !username || !tribe) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: userId, email, username, tribe' },
        { status: 400 }
      )
    }

    // Create user profile using admin client (bypasses RLS)
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email,
        username,
        tribe,
      })
      .select()
      .single()

    if (userError) {
      console.error('❌ User creation error:', userError)
      return NextResponse.json(
        { error: 'Failed to create user profile', details: userError },
        { status: 500 }
      )
    }

    console.log('✅ User profile created:', user)

    // Create initial village
    const { data: village, error: villageError } = await supabaseAdmin
      .from('villages')
      .insert({
        name: 'Capital City',
        x: Math.floor(Math.random() * 200 - 100),
        y: Math.floor(Math.random() * 200 - 100),
        owner_id: userId,
      })
      .select()
      .single()

    if (villageError) {
      console.error('❌ Village creation error:', villageError)
      // Don't fail if village creation fails, user profile is more important
    } else {
      console.log('✅ Initial village created:', village)
    }

    return NextResponse.json({
      success: true,
      user,
      village: village || null
    })

  } catch (error) {
    console.error('❌ Create profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}