import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()

        const { data: equipment, error } = await supabase
            .from('equipment')
            .select('id, name, serial_number, category_id, location, status')
            .order('name')

        if (error) {
            console.error('Error fetching equipment:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ equipment })
    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
