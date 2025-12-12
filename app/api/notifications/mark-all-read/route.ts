import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

// POST /api/notifications/mark-all-read - Mark all notifications as read
export async function POST(request: NextRequest) {
    try {
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
            .update({
                is_read: true,
                read_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('Error marking all notifications as read:', error);
            return NextResponse.json({ error: 'Gagal menandai semua notifikasi' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Semua notifikasi telah ditandai dibaca' });
    } catch (error) {
        console.error('Error in mark-all-read API:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
