import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const equipment_id = searchParams.get('equipment_id')
    const user_id = searchParams.get('user_id')
    const status = searchParams.get('status')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    let query = (supabase as any)
      .from('reservation_calendar')
      .select('*')
      .order('start_time', { ascending: true })

    if (equipment_id) {
      query = query.eq('equipment_id', equipment_id)
    }
    if (user_id) {
      query = query.eq('user_id', user_id)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (start_date) {
      query = query.gte('start_time', start_date)
    }
    if (end_date) {
      query = query.lte('end_time', end_date)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: reservations, error, count } = await query

    if (error) {
      console.error('Error fetching reservations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reservations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reservations: reservations || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in reservations GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      equipment_id,
      user_id,
      title,
      description,
      start_time,
      end_time,
      approval_required
    } = body

    if (!equipment_id || !user_id || !title || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const startTime = new Date(start_time)
    const endTime = new Date(end_time)
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    const { data: equipment, error: equipmentError } = await (supabase as any)
      .from('equipment')
      .select('id, name, status, purchase_price')
      .eq('id', equipment_id)
      .single()

    if (equipmentError || !equipment) {
      return NextResponse.json(
        { error: 'Equipment not found' },
        { status: 404 }
      )
    }

    const { data: user, error: userError } = await (supabase as any)
      .from('users')
      .select('id, role, full_name')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create reservation (conflict checking is handled by database trigger)
    const { data: reservation, error: reservationError } = await (supabase as any)
      .from('equipment_reservations')
      .insert({
        equipment_id,
        user_id,
        title,
        description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        approval_required: approval_required || false
      })
      .select(`
        *,
        equipment:equipment(id, name, serial_number),
        user:users(id, full_name, email, role)
      `)
      .single()

    if (reservationError) {
      console.error('Error creating reservation:', reservationError)

      if (reservationError.message?.includes('already reserved')) {
        return NextResponse.json(
          { error: 'Equipment is already reserved for the selected time slot' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create reservation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reservation,
      message: reservation.status === 'approved'
        ? 'Reservation approved automatically'
        : 'Reservation created and pending approval'
    })

  } catch (error) {
    console.error('Error in reservations POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}