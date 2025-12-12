import { NextRequest, NextResponse } from 'next/server'
import { serverEmailService } from '@/lib/email-service-server'

export async function POST(request: NextRequest) {
  try {
    const { email, userName } = await request.json()

    if (!email || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, userName' },
        { status: 400 }
      )
    }

    const result = await serverEmailService.sendWelcomeEmail(email, userName)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Welcome email sent successfully'
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send welcome email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Send welcome email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}