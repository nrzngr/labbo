import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient();

    // Get current user from session
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    let userId: string | undefined;

    try {
      // Try to parse as JSON first
      const session = JSON.parse(sessionCookie.value);
      userId = session.user?.id;
    } catch {
      // If not JSON, might be a JWT token - try to decode it
      const tokenParts = sessionCookie.value.split('.');
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          userId = payload.sub || payload.user_id || payload.id;
        } catch {
          return NextResponse.json({ error: 'Format sesi tidak valid' }, { status: 401 });
        }
      } else {
        return NextResponse.json({ error: 'Format sesi tidak valid' }, { status: 401 });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, count, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Gagal mengambil notifikasi' }, { status: 500 });
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return NextResponse.json({
      notifications,
      total: count,
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/notifications - Create notification (internal use)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient();

    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const currentUserRole = session.user?.role;

    // Only admin and lab_staff can create notifications
    if (!['admin', 'lab_staff'].includes(currentUserRole)) {
      return NextResponse.json({ error: 'Tidak memiliki izin' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, type, title, message, priority, data } = body;

    if (!user_id || !type || !title || !message) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        message,
        priority: priority || 'medium',
        data: data || null,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Gagal membuat notifikasi' }, { status: 500 });
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
