import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { serverEmailService } from '@/lib/email-service'
import { generateEmailVerificationToken, createTokenExpiration } from '@/lib/token-utils'

// Initialize Supabase Admin client with Service Role Key
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        // 1. Find user by email (using admin client to bypass RLS)
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, email, full_name, email_verified')
            .eq('email', email)
            .single()

        if (userError || !user) {
            // Return success to prevent email enumeration
            console.log(`[Resend Verification] User not found for email: ${email}`)
            return NextResponse.json({ success: true, message: 'If the email exists, a verification link has been sent.' })
        }

        if (user.email_verified) {
            return NextResponse.json(
                { error: 'Email is already verified' },
                { status: 400 }
            )
        }

        // 2. Invalidate existing tokens
        await supabaseAdmin
            .from('email_verification_tokens')
            .update({ used_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .is('used_at', null)

        // 3. Create new token
        const token = generateEmailVerificationToken()
        const expiresAt = createTokenExpiration(24) // 24 hours

        const { error: insertError } = await supabaseAdmin
            .from('email_verification_tokens')
            .insert({
                user_id: user.id,
                token,
                expires_at: expiresAt
            })

        if (insertError) {
            console.error('Error creating verification token:', insertError)
            return NextResponse.json(
                { error: 'Failed to generate verification token' },
                { status: 500 }
            )
        }

        // 4. Send email
        // Construct verification link. 
        // Note: Request url origin might be internal in some deployments, better to use NEXT_PUBLIC_APP_URL if available
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
        const verificationLink = `${appUrl}/verify-email?token=${token}`

        const emailResult = await serverEmailService.sendEmailVerificationEmail(
            user.email,
            verificationLink,
            user.full_name
        )

        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error)
            return NextResponse.json(
                { error: 'Failed to send verification email' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Verification email sent successfully'
        })

    } catch (error) {
        console.error('Resend verification error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
