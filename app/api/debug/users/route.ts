import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // Check if users table exists and has data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('email, full_name, role')
      .limit(10)

    // Check if categories table exists
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('name')
      .limit(5)

    // List all tables (this might not work with Supabase but let's try)
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables') // This likely won't work, but worth a try

    return NextResponse.json({
      users: {
        count: users?.length || 0,
        data: users,
        error: usersError?.message
      },
      categories: {
        count: categories?.length || 0,
        data: categories,
        error: categoriesError?.message
      },
      tables: {
        data: tables,
        error: tablesError?.message
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      details: error
    }, { status: 500 })
  }
}