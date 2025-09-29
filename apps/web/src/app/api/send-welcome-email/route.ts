import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/email'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user profile from database
    const { data: user, error } = await supabase
      .from('users')
      .select('username, email, tribe')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Send welcome email
    await EmailService.sendWelcomeEmail(
      user.username,
      user.email,
      user.tribe
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Welcome email error:', error)
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    )
  }
}