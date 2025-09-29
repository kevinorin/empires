import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, type } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case 'welcome':
        result = await EmailService.sendWelcomeEmail('TestPlayer', email, 1)
        break
      case 'alliance':
        result = await EmailService.sendAllianceInvitation(email, 'TestPlayer', 'Elite Warriors', 'AdminPlayer')
        break
      case 'reset':
        result = await EmailService.sendPasswordResetEmail(email, 'http://localhost:3000/reset-password?token=test123')
        break
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send test email' },
      { status: 500 }
    )
  }
}