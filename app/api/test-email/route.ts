import { NextRequest, NextResponse } from 'next/server'
import { serverEmailService } from '@/lib/email-service-server'

export async function POST(request: NextRequest) {
  try {
    const { email, type = 'welcome' } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    let result
    const testLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/test-link?token=test123`
    const userName = 'Test User'

    switch (type) {
      case 'password-reset':
        result = await serverEmailService.sendPasswordResetEmail(email, testLink, userName)
        break
      case 'email-verification':
        result = await serverEmailService.sendEmailVerificationEmail(email, testLink, userName)
        break
      case 'account-locked':
        result = await serverEmailService.sendAccountLockedEmail(email, '15 minutes', userName)
        break
      case 'welcome':
      default:
        result = await serverEmailService.sendWelcomeEmail(email, userName)
        break
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${type} email sent successfully to ${email}`,
        provider: process.env.EMAIL_PROVIDER || 'mock'
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email test endpoint',
    provider: process.env.EMAIL_PROVIDER || 'mock',
    configured: !!(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY),
    usage: 'POST to this endpoint with { email: "user@example.com", type: "welcome" }'
  })
}