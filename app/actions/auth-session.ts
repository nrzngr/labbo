'use server'

import { cookies } from 'next/headers'

export async function loginSession(user: any) {
    console.log('Server Action: loginSession called', { userId: user.id, email: user.email })

    // Store MINIMAL user data in a secure, HTTP-only cookie
    // Storing the whole user object might be too large for a cookie
    const sessionPayload = {
        user: {
            id: user.id,
            role: user.role,
            email: user.email,
            full_name: user.full_name
        }
    }

    try {
        const cookieStore = await cookies()
        cookieStore.set('session', JSON.stringify(sessionPayload), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        })
        console.log('Server Action: Session cookie set successfully with payload keys:', Object.keys(sessionPayload.user))
        return { success: true }
    } catch (error) {
        console.error('Server Action: Failed to set session cookie', error)
        throw error
    }
}

export async function logoutSession() {
    console.log('Server Action: logoutSession called')
    const cookieStore = await cookies()
    cookieStore.delete('session')
    return { success: true }
}
