import { NextRequest, NextResponse } from 'next/server'
import { serverEmailService } from '@/lib/email-service-server'

export async function POST(request: NextRequest) {
  try {
    const { email, resetLink, userName } = await request.json()

    if (!email || !resetLink || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, resetLink, userName' },
        { status: 400 }
      )
    }

    const result = await serverEmailService.sendPasswordResetEmail(email, resetLink, userName)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Password reset email sent successfully'
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send password reset email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Send password reset email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}