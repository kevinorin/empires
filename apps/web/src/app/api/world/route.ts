import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get world bounds from query params
    const { searchParams } = new URL(request.url)
    const minX = parseInt(searchParams.get('minX') || '-400')
    const maxX = parseInt(searchParams.get('maxX') || '400')
    const minY = parseInt(searchParams.get('minY') || '-400')
    const maxY = parseInt(searchParams.get('maxY') || '400')

    // Fetch villages within bounds
    const { data: villages, error } = await supabase
      .from('villages')
      .select(`
        id,
        name,
        x,
        y,
        population,
        is_capital,
        owner_id
      `)
      .gte('x', minX)
      .lte('x', maxX)
      .gte('y', minY)
      .lte('y', maxY)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user profiles for village owners
    const ownerIds = villages?.map(v => v.owner_id).filter(Boolean) || []
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, username')
      .in('id', ownerIds)

    // Transform data for frontend
    const transformedVillages = villages?.map(village => {
      const profile = profiles?.find(p => p.id === village.owner_id)
      return {
        id: village.id,
        name: village.name,
        x: village.x,
        y: village.y,
        population: village.population || 100,
        isCapital: village.is_capital || false,
        playerId: village.owner_id,
        playerName: profile?.username || 'Unknown Player'
      }
    }) || []

    return NextResponse.json({ villages: transformedVillages })
  } catch (error) {
    console.error('Error fetching world map:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { x, y, name } = await request.json()

    // Validate coordinates
    if (x < -400 || x > 400 || y < -400 || y > 400) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    // Check if location is already occupied
    const { data: existingVillage } = await supabase
      .from('villages')
      .select('id')
      .eq('x', x)
      .eq('y', y)
      .single()

    if (existingVillage) {
      return NextResponse.json({ error: 'Location already occupied' }, { status: 400 })
    }

    // Check if user already has a village (for initial placement)
    const { data: userVillages } = await supabase
      .from('villages')
      .select('id')
      .eq('owner_id', user.id)

    const isFirstVillage = !userVillages || userVillages.length === 0

    // Create new village
    const { data: newVillage, error } = await supabase
      .from('villages')
      .insert({
        name: name || (isFirstVillage ? 'Capital City' : `Village ${(userVillages?.length || 0) + 1}`),
        x,
        y,
        owner_id: user.id,
        population: 87,
        is_capital: isFirstVillage
      })
      .select()
      .single()

    if (error) {
      console.error('Village creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ village: newVillage })
  } catch (error) {
    console.error('Error creating village:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}