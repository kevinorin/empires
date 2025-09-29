import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/smtp2go'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Welcome email API called')
    const { userId } = await request.json()
    console.log('📧 User ID:', userId)

    if (!userId) {
      console.log('❌ No user ID provided')
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user profile from database
    console.log('🔍 Fetching user profile from database...')
    const { data: user, error } = await supabase
      .from('users')
      .select('username, email, tribe')
      .eq('id', userId)
      .single()

    console.log('🔍 Database query result:', { user, error })

    if (error || !user) {
      console.log('❌ User not found in database:', error)
      return NextResponse.json(
        { error: 'User not found in database. Make sure the schema.sql has been run.' },
        { status: 404 }
      )
    }

    // Send welcome email
    console.log('📧 Sending welcome email to:', user.email)
    const tribeNames = ['Unknown', 'Romans', 'Teutons', 'Gauls', 'Egyptians', 'Nubians']
    const tribeName = tribeNames[user.tribe] || 'Unknown'
    console.log('📧 User details:', { username: user.username, tribe: tribeName })

    const result = await emailService.sendWelcomeEmail(
      user.email,
      user.username,
      tribeName
    )

    console.log('✅ Welcome email sent successfully!')
    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('❌ Welcome email error:', error)
    return NextResponse.json(
      { error: 'Failed to send welcome email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}