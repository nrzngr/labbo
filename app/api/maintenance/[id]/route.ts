import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { id } = params

        // Frontend: preventive, corrective -> DB: routine, repair
        const mapTypeToDB = (frontendType: string) => {
            if (frontendType === 'preventive') return 'routine';
            if (frontendType === 'corrective') return 'repair';
            return frontendType;
        }

        const payload = {
            equipment_id: body.equipment_id,
            maintenance_type: mapTypeToDB(body.type) as any,
            title: body.title,
            description: body.description,
            scheduled_date: body.scheduled_datetime || body.scheduled_date,
            priority: body.priority,
            status: body.status, // Allow status updates
            is_recurring: body.recurrence_pattern ? true : false,
            frequency_unit: body.recurrence_pattern?.type,
            frequency_interval: body.recurrence_pattern?.interval,
            estimated_duration_hours: body.estimated_duration || 1,
            updated_at: new Date().toISOString()
        }

        const { data, error } = await supabase
            .from('maintenance_schedules')
            .update(payload)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({ schedule: data })
    } catch (error: any) {
        console.error('Error updating maintenance schedule:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const supabase = await createClient()
        const { id } = params

        const { error } = await supabase
            .from('maintenance_schedules')
            .delete()
            .eq('id', id)

        if (error) {
            throw error
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting maintenance schedule:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
