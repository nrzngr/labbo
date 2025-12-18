import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET maintenance history for specific equipment
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // Fetch maintenance records for this equipment
        const { data: maintenance, error } = await supabase
            .from('maintenance_schedules')
            .select(`
                id,
                equipment_id,
                scheduled_date,
                maintenance_type,
                description,
                status,
                cost,
                notes,
                created_at
            `)
            .eq('equipment_id', id)
            .order('scheduled_date', { ascending: false })

        if (error) {
            console.error('Error fetching maintenance history:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Map database fields to frontend expected format
        const mappedMaintenance = (maintenance || []).map((record: any) => ({
            id: record.id,
            date: record.scheduled_date,
            type: mapMaintenanceType(record.maintenance_type),
            description: record.description || record.notes || 'Tidak ada deskripsi',
            cost: record.cost,
            performed_by: 'Staff Lab', // Default value since column doesn't exist
            status: record.status || 'pending'
        }))

        return NextResponse.json({ maintenance: mappedMaintenance })
    } catch (error) {
        console.error('Error in maintenance API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Map database maintenance types to frontend display types
function mapMaintenanceType(dbType: string): 'preventive' | 'corrective' | 'calibration' {
    switch (dbType) {
        case 'routine':
        case 'preventive':
            return 'preventive'
        case 'repair':
        case 'corrective':
            return 'corrective'
        case 'calibration':
            return 'calibration'
        default:
            return 'preventive'
    }
}
