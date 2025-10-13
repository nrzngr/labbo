import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST() {
  try {
    const demoUsers = [
      {
        email: 'admin@example.com',
        password_hash: 'demo_hash',
        full_name: 'Administrator',
        department: 'IT Department',
        role: 'admin',
        phone: '+62812345678',
        nip: 'ADMIN001',
        is_active: true
      },
      {
        email: 'labstaff@example.com',
        password_hash: 'demo_hash',
        full_name: 'Laboratory Staff',
        department: 'Science Department',
        role: 'lab_staff',
        phone: '+62823456789',
        nip: 'LAB001',
        is_active: true
      },
      {
        email: 'lecturer@example.com',
        password_hash: 'demo_hash',
        full_name: 'Dr. John Smith',
        department: 'Computer Science',
        role: 'lecturer',
        phone: '+62834567890',
        nip: 'LEC001',
        lecturer_rank: 'associate',
        is_active: true
      },
      {
        email: 'student@example.com',
        password_hash: 'demo_hash',
        full_name: 'Alice Johnson',
        department: 'Computer Science',
        role: 'student',
        phone: '+62845678901',
        nim: '2023001',
        student_level: 'junior',
        is_active: true
      }
    ]

    const results = []

    for (const user of demoUsers) {
      const { data, error } = await supabase
        .from('users')
        .insert(user)
        .select()
        .single()

      if (error) {
        results.push({
          email: user.email,
          success: false,
          error: error.message,
          code: error.code
        })
      } else {
        results.push({
          email: user.email,
          success: true,
          user: data
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Demo users creation completed'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error
    }, { status: 500 })
  }
}