import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import * as XLSX from 'xlsx';

// POST /api/export/transactions - Export borrowing transactions
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
        const userRole = session.user?.role;

        if (!userId) {
            return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
        }

        if (!['admin', 'lab_staff'].includes(userRole)) {
            return NextResponse.json({ error: 'Tidak memiliki izin' }, { status: 403 });
        }

        const body = await request.json();
        const { format = 'xlsx', filters = {} } = body;

        // Build query - use foreign key hints for multiple user relationships
        let query = supabase
            .from('borrowing_transactions')
            .select(`
        id,
        borrow_date,
        expected_return_date,
        actual_return_date,
        status,
        notes,
        equipment:equipment_id (name, serial_number),
        borrower:users!borrowing_transactions_user_id_fkey (full_name, email, department),
        approved_by_user:users!borrowing_transactions_approved_by_fkey (full_name),
        created_at
      `)
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.start_date) {
            query = query.gte('borrow_date', filters.start_date);
        }
        if (filters.end_date) {
            query = query.lte('borrow_date', filters.end_date);
        }
        if (filters.user_id) {
            query = query.eq('user_id', filters.user_id);
        }

        const { data: transactions, error } = await query;

        if (error) {
            console.error('Error fetching transactions:', error);
            return NextResponse.json({ error: 'Gagal mengambil data transaksi' }, { status: 500 });
        }

        // Prepare data for export
        const exportData = transactions?.map((item, index) => ({
            'No': index + 1,
            'Peralatan': (item.equipment as { name: string } | null)?.name || '-',
            'Nomor Seri': (item.equipment as { serial_number: string } | null)?.serial_number || '-',
            'Peminjam': (item.borrower as { full_name: string } | null)?.full_name || '-',
            'Email Peminjam': (item.borrower as { email: string } | null)?.email || '-',
            'Departemen': (item.borrower as { department: string } | null)?.department || '-',
            'Tanggal Pinjam': formatDate(item.borrow_date),
            'Tanggal Jatuh Tempo': formatDate(item.expected_return_date),
            'Tanggal Kembali': item.actual_return_date ? formatDate(item.actual_return_date) : '-',
            'Status': translateStatus(item.status || ''),
            'Disetujui Oleh': (item.approved_by_user as { full_name: string } | null)?.full_name || '-',
            'Catatan': item.notes || '-',
        })) || [];

        if (format === 'csv') {
            const ws = XLSX.utils.json_to_sheet(exportData);
            const csv = XLSX.utils.sheet_to_csv(ws);

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="transaksi-peminjaman-${formatDateForFilename()}.csv"`,
                },
            });
        } else {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);

            ws['!cols'] = [
                { wch: 5 },  // No
                { wch: 25 }, // Peralatan
                { wch: 15 }, // Serial
                { wch: 25 }, // Peminjam
                { wch: 25 }, // Email
                { wch: 20 }, // Departemen
                { wch: 12 }, // Tanggal Pinjam
                { wch: 15 }, // Jatuh Tempo
                { wch: 15 }, // Tanggal Kembali
                { wch: 12 }, // Status
                { wch: 20 }, // Disetujui
                { wch: 30 }, // Catatan
            ];

            XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');

            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            // Log export (commented out - table doesn't exist)
            // await supabase.from('report_exports').insert({
            //     user_id: userId,
            //     report_type: 'transactions',
            //     format: format,
            //     filters: filters,
            //     status: 'completed',
            //     completed_at: new Date().toISOString(),
            // });

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="transaksi-peminjaman-${formatDateForFilename()}.xlsx"`,
                },
            });
        }
    } catch (error) {
        console.error('Error in export API:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

function translateStatus(status: string): string {
    const map: Record<string, string> = {
        pending: 'Menunggu',
        approved: 'Disetujui',
        active: 'Aktif',
        returned: 'Dikembalikan',
        overdue: 'Terlambat',
        cancelled: 'Dibatalkan',
    };
    return map[status] || status;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function formatDateForFilename(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}
