import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    const id = params.id
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )

    try {
        const { data: equipment, error } = await supabase
            .from('equipment')
            .select(`
        *,
        category:categories (
          id,
          name
        )
      `)
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching equipment:', error)
            return NextResponse.json(
                { error: 'Failed to fetch equipment details' },
                { status: 500 }
            )
        }

        if (!equipment) {
            return NextResponse.json(
                { error: 'Equipment not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ equipment })
    } catch (error) {
        console.error('Error in equipment detail route:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    const id = params.id
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Ignored
                    }
                },
            },
        }
    )

    try {
        const json = await request.json()
        const { data, error } = await supabase
            .from('equipment')
            .update(json)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating equipment:', error)
            return NextResponse.json(
                { error: 'Failed to update equipment' },
                { status: 500 }
            )
        }

        return NextResponse.json({ equipment: data })
    } catch (error) {
        console.error('Error in equipment update route:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    const id = params.id
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Ignored
                    }
                },
            },
        }
    )

    try {
        const { error } = await supabase
            .from('equipment')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting equipment:', error)
            return NextResponse.json(
                { error: 'Failed to delete equipment' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in equipment delete route:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
