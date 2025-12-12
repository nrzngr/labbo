import { NextRequest, NextResponse } from 'next/server'
import { serverEmailService } from '@/lib/email-service-server'

export async function POST(request: NextRequest) {
  try {
    const { email, verificationLink, userName } = await request.json()

    if (!email || !verificationLink || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, verificationLink, userName' },
        { status: 400 }
      )
    }

    const result = await serverEmailService.sendEmailVerificationEmail(email, verificationLink, userName)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email verification sent successfully'
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send verification email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Send verification email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}