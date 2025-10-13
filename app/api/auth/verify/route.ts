import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { sessionToken } = await request.json()

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token tidak valid' },
        { status: 400 }
      )
    }

    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('user_id, expires_at')
      .eq('session_token', sessionToken)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session tidak valid' },
        { status: 401 }
      )
    }

    if (new Date() > new Date(session.expires_at)) {
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_token', sessionToken)

      return NextResponse.json(
        { error: 'Session sudah expired' },
        { status: 401 }
      )
    }

    await supabase
      .from('user_sessions')
      .update({ last_accessed: new Date().toISOString() })
      .eq('session_token', sessionToken)

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 401 }
      )
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Akun tidak aktif' },
        { status: 401 }
      )
    }

    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        department: user.department,
        nim: user.nim,
        nip: user.nip,
        student_level: user.student_level,
        lecturer_rank: user.lecturer_rank
      }
    })

  } catch (error) {
    console.error('Verify session error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}