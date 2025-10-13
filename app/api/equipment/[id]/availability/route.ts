import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const start_time = searchParams.get('start_time')
    const end_time = searchParams.get('end_time')
    const date = searchParams.get('date')

    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', id)
      .single()

    if (equipmentError || !equipment) {
      return NextResponse.json(
        { error: 'Equipment not found' },
        { status: 404 }
      )
    }

    if (start_time && end_time) {
      const startTime = new Date(start_time)
      const endTime = new Date(end_time)
      const { data, error } = await supabase
        .rpc('is_equipment_available', {
          p_equipment_id: id,
          p_start_time: startTime.toISOString(),
          p_end_time: endTime.toISOString()
        } as any)

      if (error) {
        console.error('Error checking availability:', error)
        return NextResponse.json(
          { error: 'Failed to check availability' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        equipment_id: id,
        start_time: start_time,
        end_time: end_time,
        is_available: data,
        equipment_status: (equipment as any).status
      })
    }

    if (date) {
      const targetDate = new Date(date)
      const slotDuration = parseInt(searchParams.get('slot_duration') || '60')
      const { data: timeSlots, error: slotsError } = await supabase
        .rpc('generate_time_slots', {
          p_equipment_id: id,
          p_date: targetDate.toISOString().split('T')[0],
          p_slot_duration_minutes: slotDuration
        } as any)

      if (slotsError) {
        console.error('Error generating time slots:', slotsError)
        return NextResponse.json(
          { error: 'Failed to generate time slots' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        equipment_id: id,
        date: date,
        slot_duration_minutes: slotDuration,
        time_slots: timeSlots || [],
        equipment_status: (equipment as any).status
      })
    }

    const { data: statusData } = await supabase
      .from('equipment_comprehensive_status')
      .select('current_status, return_due_date, calibration_status')
      .eq('id', id)
      .single()

    const { data: upcomingReservations } = await supabase
      .from('reservation_calendar')
      .select('*')
      .eq('equipment_id', id)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(5)

    const { data: upcomingMaintenance } = await supabase
      .from('maintenance_schedule_view')
      .select('*')
      .eq('equipment_id', id)
      .order('scheduled_date', { ascending: true })
      .limit(3)

    return NextResponse.json({
      success: true,
      equipment_id: id,
      current_status: (statusData as any)?.current_status || (equipment as any).status,
      return_due_date: (statusData as any)?.return_due_date,
      calibration_status: (statusData as any)?.calibration_status,
      upcoming_reservations: upcomingReservations || [],
      upcoming_maintenance: upcomingMaintenance || []
    })

  } catch (error) {
    console.error('Error checking equipment availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}