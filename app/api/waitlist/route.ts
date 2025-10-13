import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      equipment_id,
      user_id,
      requested_start_time,
      requested_end_time,
      priority = 'normal'
    } = body

    if (!equipment_id || !user_id || !requested_start_time || !requested_end_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const validPriorities = ['low', 'normal', 'high', 'urgent']
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority level' },
        { status: 400 }
      )
    }

    const { data: equipment, error: equipmentError } = await (supabase as any)
      .from('equipment')
      .select('id, name, status')
      .eq('id', equipment_id)
      .single()

    if (equipmentError || !equipment) {
      return NextResponse.json(
        { error: 'Equipment not found' },
        { status: 404 }
      )
    }

    // Check if user exists
    const { data: user, error: userError } = await (supabase as any)
      .from('users')
      .select('id, full_name, email')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is already in waitlist for this time slot
    const { data: existingWaitlist, error: waitlistError } = await (supabase as any)
      .from('reservation_waitlist')
      .select('*')
      .eq('equipment_id', equipment_id)
      .eq('user_id', user_id)
      .eq('requested_start_time', requested_start_time)
      .eq('requested_end_time', requested_end_time)
      .single()

    if (existingWaitlist) {
      return NextResponse.json(
        { error: 'You are already in the waitlist for this time slot' },
        { status: 409 }
      )
    }

    // Add to waitlist
    const { data: waitlistEntry, error: insertError } = await (supabase as any)
      .from('reservation_waitlist')
      .insert({
        equipment_id,
        user_id,
        requested_start_time,
        requested_end_time,
        priority
      })
      .select(`
        *,
        equipment:equipment(id, name, serial_number),
        user:users(id, full_name, email)
      `)
      .single()

    if (insertError) {
      console.error('Error adding to waitlist:', insertError)
      return NextResponse.json(
        { error: 'Failed to add to waitlist' },
        { status: 500 }
      )
    }

    // Get waitlist position
    const { data: waitlistPosition } = await (supabase as any)
      .from('reservation_waitlist')
      .select('id')
      .eq('equipment_id', equipment_id)
      .eq('requested_start_time', requested_start_time)
      .eq('requested_end_time', requested_end_time)
      .or(`priority.gt.${priority},priority.eq.${priority}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })

    const position = waitlistPosition ? waitlistPosition.length : 1

    return NextResponse.json({
      success: true,
      waitlist_entry: waitlistEntry,
      position,
      message: `You are #${position} in the waitlist for this time slot`
    })

  } catch (error) {
    console.error('Error in waitlist POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const equipment_id = searchParams.get('equipment_id')
    const user_id = searchParams.get('user_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    let query = (supabase as any)
      .from('reservation_waitlist')
      .select(`
        *,
        equipment:equipment(id, name, serial_number),
        user:users(id, full_name, email, role)
      `)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })

    if (equipment_id) {
      query = query.eq('equipment_id', equipment_id)
    }
    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: waitlist, error, count } = await query

    if (error) {
      console.error('Error fetching waitlist:', error)
      return NextResponse.json(
        { error: 'Failed to fetch waitlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      waitlist: waitlist || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in waitlist GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const waitlist_id = searchParams.get('id')
    const equipment_id = searchParams.get('equipment_id')
    const user_id = searchParams.get('user_id')

    if (!waitlist_id && (!equipment_id || !user_id)) {
      return NextResponse.json(
        { error: 'Either waitlist ID or both equipment_id and user_id are required' },
        { status: 400 }
      )
    }

    let query = (supabase as any).from('reservation_waitlist')

    if (waitlist_id) {
      query = query.delete().eq('id', waitlist_id)
    } else {
      query = query.delete().eq('equipment_id', equipment_id).eq('user_id', user_id)
    }

    const { error } = await query

    if (error) {
      console.error('Error removing from waitlist:', error)
      return NextResponse.json(
        { error: 'Failed to remove from waitlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Removed from waitlist successfully'
    })

  } catch (error) {
    console.error('Error in waitlist DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}