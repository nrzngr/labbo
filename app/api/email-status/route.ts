import { NextRequest, NextResponse } from 'next/server'
import { serverEmailService } from '@/lib/email-service-server'

export async function GET(request: NextRequest) {
  try {
    const provider = process.env.EMAIL_PROVIDER || 'mock'
    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD
    const gmailConfigured = !!(gmailUser && gmailPass)

    // Test email sending if requested
    const { searchParams } = new URL(request.url)
    const testEmail = searchParams.get('test')

    let testResult = null
    if (testEmail) {
      testResult = await serverEmailService.sendWelcomeEmail(testEmail, 'Test User')
    }

    return NextResponse.json({
      config: {
        provider,
        gmailUser: gmailUser ? `${gmailUser.slice(0, 3)}***@***.***` : 'not configured',
        gmailConfigured,
        readyToSend: provider === 'gmail' && gmailConfigured
      },
      testResult,
      instructions: {
        setup: 'See SETUP_GMAIL_SMTP.md for Gmail configuration',
        test: 'Add ?test=email@example.com to test email sending',
        providers: ['gmail', 'resend', 'sendgrid', 'mock'],
        note: 'Gmail SMTP configured with credentials from .env.local'
      }
    })
  } catch (error) {
    console.error('Email status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check email status' },
      { status: 500 }
    )
  }
}