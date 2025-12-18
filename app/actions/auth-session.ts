'use server'

import { cookies } from 'next/headers'

export interface SessionUser {
    id: string
    role: string
    email: string
    full_name: string
}

export interface SessionData {
    user: SessionUser
}

export async function loginSession(user: any) {
    // Store MINIMAL user data in a secure, HTTP-only cookie
    const sessionPayload: SessionData = {
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
        return { success: true }
    } catch (error) {
        console.error('Failed to set session cookie', error)
        throw error
    }
}

export async function getSession(): Promise<SessionData | null> {
    try {
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get('session')

        if (!sessionCookie?.value) {
            return null
        }

        const session = JSON.parse(sessionCookie.value) as SessionData

        // Validate session structure
        if (!session.user?.id || !session.user?.role) {
            return null
        }

        return session
    } catch (error) {
        console.error('Failed to parse session cookie', error)
        return null
    }
}

export async function logoutSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
    return { success: true }
}

