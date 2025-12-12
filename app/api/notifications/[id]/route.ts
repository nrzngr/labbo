import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

// PATCH /api/notifications/[id] - Mark notification as read
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const supabase = createClient();

        const sessionCookie = cookieStore.get('session');
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
        }

        const session = JSON.parse(sessionCookie.value);
        const userId = session.user?.id;

        if (!userId) {
            return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
        }

        const body = await request.json();
        const { is_read } = body;

        const { data: notification, error } = await supabase
            .from('notifications')
            .update({
                is_read: is_read ?? true,
                read_at: is_read ? new Date().toISOString() : null,
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating notification:', error);
            return NextResponse.json({ error: 'Gagal memperbarui notifikasi' }, { status: 500 });
        }

        return NextResponse.json({ notification });
    } catch (error) {
        console.error('Error in notification API:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const supabase = createClient();

        const sessionCookie = cookieStore.get('session');
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
        }

        const session = JSON.parse(sessionCookie.value);
        const userId = session.user?.id;

        if (!userId) {
            return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
        }

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting notification:', error);
            return NextResponse.json({ error: 'Gagal menghapus notifikasi' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in notification API:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
