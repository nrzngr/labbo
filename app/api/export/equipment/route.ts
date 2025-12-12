import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import * as XLSX from 'xlsx';

// POST /api/export/equipment - Export equipment data
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

        // Only admin and lab_staff can export
        if (!['admin', 'lab_staff'].includes(userRole)) {
            return NextResponse.json({ error: 'Tidak memiliki izin' }, { status: 403 });
        }

        const body = await request.json();
        const { format = 'xlsx', filters = {} } = body;

        // Build query
        let query = supabase
            .from('equipment')
            .select(`
        id,
        name,
        serial_number,
        description,
        condition,
        status,
        location,
        purchase_date,
        purchase_price,
        categories (name),
        created_at,
        updated_at
      `)
            .order('name');

        // Apply filters
        if (filters.category_id) {
            query = query.eq('category_id', filters.category_id);
        }
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.condition) {
            query = query.eq('condition', filters.condition);
        }

        const { data: equipment, error } = await query;

        if (error) {
            console.error('Error fetching equipment:', error);
            return NextResponse.json({ error: 'Gagal mengambil data peralatan' }, { status: 500 });
        }

        // Prepare data for export
        const exportData = equipment?.map((item, index) => ({
            'No': index + 1,
            'Nama Peralatan': item.name,
            'Nomor Seri': item.serial_number,
            'Deskripsi': item.description || '-',
            'Kategori': (item.categories as { name: string } | null)?.name || '-',
            'Kondisi': translateCondition(item.condition),
            'Status': translateStatus(item.status),
            'Lokasi': item.location || '-',
            'Tanggal Pembelian': item.purchase_date ? formatDate(item.purchase_date) : '-',
            'Harga Pembelian': item.purchase_price ? formatCurrency(item.purchase_price) : '-',
            'Dibuat Pada': item.created_at ? formatDate(item.created_at) : '-',
        })) || [];

        if (format === 'csv') {
            // Generate CSV
            const ws = XLSX.utils.json_to_sheet(exportData);
            const csv = XLSX.utils.sheet_to_csv(ws);

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="daftar-peralatan-${formatDateForFilename()}.csv"`,
                },
            });
        } else {
            // Generate Excel
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Set column widths
            ws['!cols'] = [
                { wch: 5 },  // No
                { wch: 30 }, // Nama
                { wch: 20 }, // Serial
                { wch: 40 }, // Deskripsi
                { wch: 15 }, // Kategori
                { wch: 12 }, // Kondisi
                { wch: 12 }, // Status
                { wch: 20 }, // Lokasi
                { wch: 15 }, // Tanggal
                { wch: 15 }, // Harga
                { wch: 15 }, // Dibuat
            ];

            XLSX.utils.book_append_sheet(wb, ws, 'Peralatan');

            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            // Log export
            await supabase.from('report_exports').insert({
                user_id: userId,
                report_type: 'equipment',
                format: format,
                filters: filters,
                status: 'completed',
                completed_at: new Date().toISOString(),
            });

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="daftar-peralatan-${formatDateForFilename()}.xlsx"`,
                },
            });
        }
    } catch (error) {
        console.error('Error in export API:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

function translateCondition(condition: string): string {
    const map: Record<string, string> = {
        excellent: 'Sangat Baik',
        good: 'Baik',
        fair: 'Cukup',
        poor: 'Buruk',
    };
    return map[condition] || condition;
}

function translateStatus(status: string): string {
    const map: Record<string, string> = {
        available: 'Tersedia',
        borrowed: 'Dipinjam',
        maintenance: 'Dalam Pemeliharaan',
        lost: 'Hilang',
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

function formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(num);
}

function formatDateForFilename(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}
