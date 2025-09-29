import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/smtp2go'

export async function POST(request: NextRequest) {
  try {
    const { email, type, username, tribe } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case 'welcome':
        result = await emailService.sendWelcomeEmail(
          email,
          username || 'TestPlayer',
          tribe || 'Romans'
        )
        break
      default:
        return NextResponse.json(
          { error: 'Invalid email type. Use "welcome".' },
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