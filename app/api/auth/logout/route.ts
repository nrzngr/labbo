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

    // Hapus session dari database
    await supabase
      .from('user_sessions')
      .delete()
      .eq('session_token', sessionToken)

    return NextResponse.json({
      success: true,
      message: 'Logout berhasil'
    })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}