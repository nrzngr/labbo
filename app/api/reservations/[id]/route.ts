import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const { data: reservation, error } = await (supabase as any)
      .from('reservation_calendar')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Reservation not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching reservation:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reservation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reservation
    })

  } catch (error) {
    console.error('Error in reservation GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const {
      title,
      description,
      start_time,
      end_time,
      status,
      approval_required,
      approved_by
    } = body

    const { data: existingReservation, error: fetchError } = await (supabase as any)
      .from('equipment_reservations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingReservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (start_time !== undefined) updateData.start_time = start_time
    if (end_time !== undefined) updateData.end_time = end_time
    if (status !== undefined) {
      updateData.status = status
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString()
        if (approved_by) {
          updateData.approved_by = approved_by
        }
      }
    }
    if (approval_required !== undefined) updateData.approval_required = approval_required

    // Handle approval actions
    if (status === 'approved' && !approved_by) {
      return NextResponse.json(
        { error: 'Approver ID is required for approval' },
        { status: 400 }
      )
    }

    // Validate time range if provided
    if (start_time && end_time) {
      const startTime = new Date(start_time)
      const endTime = new Date(end_time)
      if (startTime >= endTime) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        )
      }
    }

    // Fix TypeScript errors by casting the entire operation
    const { data: reservation, error: updateError } = await (supabase as any)
      .from('equipment_reservations')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        equipment:equipment(id, name, serial_number),
        user:users(id, full_name, email, role)
      `)
      .single()

    if (updateError) {
      console.error('Error updating reservation:', updateError)

      // Handle specific errors
      if (updateError.message?.includes('already reserved')) {
        return NextResponse.json(
          { error: 'Equipment is already reserved for the selected time slot' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to update reservation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reservation,
      message: 'Reservation updated successfully'
    })

  } catch (error) {
    console.error('Error in reservation PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // Check if reservation exists
    const { data: reservation, error: fetchError } = await (supabase as any)
      .from('equipment_reservations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    // Check if reservation can be cancelled (not in the past)
    const startTime = new Date((reservation as any).start_time)
    const now = new Date()
    if (startTime <= now) {
      return NextResponse.json(
        { error: 'Cannot cancel reservation that has already started' },
        { status: 400 }
      )
    }

    // Soft delete by setting status to cancelled
    const { data: cancelledReservation, error: deleteError } = await (supabase as any)
      .from('equipment_reservations')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select('*')
      .single()

    if (deleteError) {
      console.error('Error cancelling reservation:', deleteError)
      return NextResponse.json(
        { error: 'Failed to cancel reservation' },
        { status: 500 }
      )
    }

    // If there are waitlisted users for this equipment, notify them
    // (This would typically be handled by a background job or trigger)
    await processWaitlist((reservation as any).equipment_id, (reservation as any).start_time, (reservation as any).end_time)

    return NextResponse.json({
      success: true,
      reservation: cancelledReservation,
      message: 'Reservation cancelled successfully'
    })

  } catch (error) {
    console.error('Error in reservation DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to process waitlist
async function processWaitlist(equipmentId: string, startTime: string, endTime: string) {
  try {
    // Find waitlisted users for the time slot
    const { data: waitlistEntries } = await (supabase as any)
      .from('reservation_waitlist')
      .select('*')
      .eq('equipment_id', equipmentId)
      .eq('notified_at', null)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)

    if (waitlistEntries && waitlistEntries.length > 0) {
      const firstWaitlisted = waitlistEntries[0]

      // Mark as notified
      await (supabase as any)
        .from('reservation_waitlist')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', firstWaitlisted.id)

      // In a real implementation, you would send a notification here
      console.log(`Notified user ${firstWaitlisted.user_id} about available time slot`)
    }
  } catch (error) {
    console.error('Error processing waitlist:', error)
  }
}