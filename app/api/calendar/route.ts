import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const equipment_id = searchParams.get('equipment_id')
    const user_id = searchParams.get('user_id')
    const view = searchParams.get('view') || 'month' // month, week, day

    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('reservation_calendar')
      .select('*')
      .gte('start_time', start_date)
      .lte('end_time', end_date)
      .order('start_time', { ascending: true })

    if (equipment_id) {
      query = query.eq('equipment_id', equipment_id)
    }
    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    const { data: reservations, error: reservationError } = await query

    if (reservationError) {
      console.error('Error fetching calendar data:', reservationError)
      return NextResponse.json(
        { error: 'Failed to fetch calendar data' },
        { status: 500 }
      )
    }

    let maintenanceQuery = supabase
      .from('maintenance_schedule_view')
      .select('*')
      .gte('scheduled_date', start_date.split('T')[0])
      .lte('scheduled_date', end_date.split('T')[0])
      .order('scheduled_date', { ascending: true })

    if (equipment_id) {
      maintenanceQuery = maintenanceQuery.eq('equipment_id', equipment_id)
    }

    const { data: maintenance, error: maintenanceError } = await maintenanceQuery

    if (maintenanceError) {
      console.error('Error fetching maintenance data:', maintenanceError)
        }

    let availabilityData = []
    if (equipment_id) {
      const equipmentStartDate = new Date(start_date)
      const equipmentEndDate = new Date(end_date)
      for (let date = new Date(equipmentStartDate); date <= equipmentEndDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0]

        const { data: timeSlots } = await supabase
          .rpc('generate_time_slots', {
            p_equipment_id: equipment_id,
            p_date: dateStr,
            p_slot_duration_minutes: 60
          } as any)

        if (timeSlots) {
          availabilityData.push({
            date: dateStr,
            time_slots: timeSlots
          })
        }
      }
    }

    const events: any[] = []


    if (reservations) {
      (reservations as any[]).forEach(reservation => {
        events.push({
          id: reservation.id,
          title: `${reservation.equipment_name} - ${reservation.user_name}`,
          start: reservation.start_time,
          end: reservation.end_time,
          type: 'reservation',
          status: reservation.status,
          equipment_id: reservation.equipment_id,
          equipment_name: reservation.equipment_name,
          user_id: reservation.user_id,
          user_name: reservation.user_name,
          user_email: reservation.user_email,
          user_role: reservation.user_role,
          category_name: reservation.category_name,
          duration_hours: reservation.duration_hours,
          color: getEventColor('reservation', reservation.status)
        })
      })
    }

    if (maintenance) {
      (maintenance as any[]).forEach(maint => {
        const startDate = new Date(maint.scheduled_date)
        const endDate = new Date(maint.scheduled_date)
        endDate.setHours(endDate.getHours() + (maint.estimated_duration_hours || 2))

        events.push({
          id: `maint-${maint.id}`,
          title: `Maintenance: ${maint.equipment_name}`,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          type: 'maintenance',
          status: maint.status,
          priority: maint.priority,
          equipment_id: maint.equipment_id,
          equipment_name: maint.equipment_name,
          maintenance_type: maint.maintenance_type,
          assigned_to_name: maint.assigned_to_name,
          urgency_status: maint.urgency_status,
          color: getEventColor('maintenance', maint.status, maint.priority)
        })
      })
    }

    return NextResponse.json({
      success: true,
      calendar: {
        view,
        start_date,
        end_date,
        events,
        availability: availabilityData,
        summary: {
          total_reservations: reservations?.length || 0,
          total_maintenance: maintenance?.length || 0,
          equipment_id: equipment_id || null,
          user_id: user_id || null
        }
      }
    })

  } catch (error) {
    console.error('Error in calendar GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getEventColor(type: string, status: string, priority?: string): string {
  if (type === 'reservation') {
    switch (status) {
      case 'approved':
        return '#10b981' // green
      case 'pending':
        return '#f59e0b' // yellow
      case 'rejected':
        return '#ef4444' // red
      case 'cancelled':
        return '#6b7280' // gray
      case 'completed':
        return '#3b82f6' // blue
      default:
        return '#9ca3af' // light gray
    }
  }

  if (type === 'maintenance') {
    switch (priority) {
      case 'critical':
        return '#dc2626' // red
      case 'high':
        return '#ea580c' // orange
      case 'medium':
        return '#d97706' // amber
      case 'low':
        return '#65a30d' // lime
      default:
        return '#6b7280' // gray
    }
  }

  return '#9ca3af' // default gray
}