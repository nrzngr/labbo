import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // Check equipment table
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('id, name, serial_number, status, condition, location')
      .limit(5)

    // Check categories table
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(5)

    // Test the join query that the UI is using
    const { data: joinedData, error: joinError } = await supabase
      .from('equipment')
      .select('*, categories(name)')
      .limit(5)

    return NextResponse.json({
      equipment: {
        count: equipment?.length || 0,
        data: equipment,
        error: equipmentError?.message
      },
      categories: {
        count: categories?.length || 0,
        data: categories,
        error: categoriesError?.message
      },
      joinedData: {
        count: joinedData?.length || 0,
        data: joinedData,
        error: joinError?.message
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Debug endpoint error',
      details: error
    }, { status: 500 })
  }
}