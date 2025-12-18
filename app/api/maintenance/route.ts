import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const equipment_id = searchParams.get('equipment_id')

        let query = supabase
            .from('maintenance_schedules')
            .select(`
        *,
        equipment:display_equipment_id(name)
      `)
            .order('scheduled_date', { ascending: true })

        // Note: display_equipment_id above is a guess, usually it's equipment(name). 
        // But since I saw the schema has foreign key equipment_id -> equipment.id, 
        // the query should be equipment(name).
        // Let's refine the query.

        if (equipment_id) {
            query = query.eq('equipment_id', equipment_id)
        }

        // We need to fetch basic info first to be safe, then enrich if needed.
        // Or just use the standard join syntax.
        const { data: rawData, error } = await supabase
            .from('maintenance_schedules')
            .select(`
            *,
            equipment:equipment_id (
                name
            )
        `)
            .order('scheduled_date', { ascending: true })

        if (error) {
            throw error
        }

        // Map DB fields to Component fields
        // DB: routine, repair, calibration, replacement
        // Frontend: preventive, corrective, calibration
        const mapTypeToFrontend = (dbType: string) => {
            if (dbType === 'routine') return 'preventive';
            if (dbType === 'repair') return 'corrective';
            return dbType;
        }

        const schedules = rawData.map((item: any) => ({
            id: item.id,
            equipment_id: item.equipment_id,
            equipment_name: item.equipment?.name || 'Unknown Equipment',
            type: mapTypeToFrontend(item.maintenance_type),
            title: item.title,
            description: item.description,
            scheduled_date: item.scheduled_date,
            estimated_duration: item.estimated_duration_hours || 1,
            priority: item.priority || 'medium',
            assigned_to: item.assigned_to,
            status: item.status || 'scheduled',
            recurrence_pattern: item.is_recurring ? {
                type: item.frequency_unit,
                interval: item.frequency_interval
            } : undefined,
            created_at: item.created_at
        }))

        return NextResponse.json({ schedules })
    } catch (error: any) {
        console.error('Error fetching maintenance schedules:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        // Map Component fields to DB fields
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
            scheduled_date: body.scheduled_datetime || body.scheduled_date, // Component sends scheduled_datetime
            priority: body.priority,
            status: 'scheduled' as const,
            is_recurring: body.recurrence_pattern ? true : false,
            frequency_unit: body.recurrence_pattern?.type,
            frequency_interval: body.recurrence_pattern?.interval,
            estimated_duration_hours: body.estimated_duration || 1
        }

        const { data, error } = await supabase
            .from('maintenance_schedules')
            .insert(payload)
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({ schedule: data })
    } catch (error: any) {
        console.error('Error creating maintenance schedule:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}


