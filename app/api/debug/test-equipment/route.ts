import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: Request
) {
  try {
    console.log('Testing equipment data retrieval...')

    // Test 1: Check if we have any categories at all
    const { data: categoriesCount, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(10)

    console.log('Categories query result:', { categoriesCount, categoriesError })

    // Test 2: Check if we have any equipment at all
    const { data: equipmentCount, error: equipmentError } = await supabase
      .from('equipment')
      .select('id, name, serial_number')
      .limit(10)

    console.log('Equipment query result:', { equipmentCount, equipmentError })

    // Test 3: Try the exact join query that the UI uses
    const { data: joinedData, error: joinError } = await supabase
      .from('equipment')
      .select('*, categories(name)')
      .limit(5)

    console.log('Join query result:', { joinedData, joinError })

    // Test 4: Check specific equipment that should exist based on mock data
    const { data: specificEquipment, error: specificError } = await supabase
      .from('equipment')
      .select('*')
      .eq('serial_number', 'DL7420-001')
      .single()

    console.log('Specific equipment query result:', { specificEquipment, specificError })

    // Test 5: Check RLS status by trying to insert a test record
    const testCategory = { name: 'Test Category', description: 'Test', category: 'test' }
    const { data: insertTest, error: insertError } = await supabase
      .from('categories')
      .insert(testCategory)
      .select()
      .single()

    console.log('Insert test result:', { insertTest, insertError })

    return NextResponse.json({
      success: true,
      tests: {
        categories: {
          count: categoriesCount?.length || 0,
          data: categoriesCount,
          error: categoriesError?.message
        },
        equipment: {
          count: equipmentCount?.length || 0,
          data: equipmentCount,
          error: equipmentError?.message
        },
        joinQuery: {
          count: joinedData?.length || 0,
          data: joinedData,
          error: joinError?.message
        },
        specificEquipment: {
          found: !!specificEquipment,
          data: specificEquipment,
          error: specificError?.message
        },
        insertTest: {
          allowed: !!insertTest,
          data: insertTest,
          error: insertError?.message
        }
      }
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: 'Debug endpoint failed',
      details: error
    }, { status: 500 })
  }
}