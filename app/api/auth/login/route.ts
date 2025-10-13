import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi' },
        { status: 400 }
      )
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        {
          error: 'Email tidak ditemukan',
          details: userError?.message
        },
        { status: 401 }
      )
    }

    // Untuk demo purposes, kita akan menggunakan password yang di-hash dengan cara sederhana
    // Dalam production, gunakan password hashing yang proper seperti bcrypt
    const hashPassword = (password: string) => {
      // Simple hash function untuk demo
      return btoa(password + 'salt_laboratory_2024')
    }

    // Simpan password hash di database (dalam real app, seharusnya sudah ada field password_hash)
    // Untuk sekarang, kita gunakan beberapa default password untuk demo
    const defaultPasswords: Record<string, string> = {
      'admin@example.com': 'admin123',
      'student@example.com': 'student123',
      'lecturer@example.com': 'lecturer123',
      'labstaff@example.com': 'labstaff123'
    }

    const isValidPassword = defaultPasswords[email] === password ||
                          hashPassword(password) === 'c3R1ZGVudDEyM3NhbHRfbGFib3JhdG9yeV8yMDI0' // student123

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Password salah' },
        { status: 401 }
      )
    }

    const sessionToken = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      timestamp: Date.now()
    })).toString('base64')

    await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 jam
        created_at: new Date().toISOString()
      })

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
      },
      sessionToken
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}