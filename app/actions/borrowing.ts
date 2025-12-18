'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { emailService } from '@/lib/email-service'
import { revalidatePath } from 'next/cache'
import { getLimitsForRole, calculatePenalty, formatPenalty } from '@/lib/borrowing-config'

// Helper to get user from session cookie
// Helper to get user from session cookie
async function getSessionUser() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
        console.log('getSessionUser [borrowing.ts]: No session cookie found')
        return null
    }

    try {
        const session = JSON.parse(sessionCookie.value)
        console.log('getSessionUser [borrowing.ts]: Session found', {
            id: session.user?.id,
            role: session.user?.role
        })
        return session.user
    } catch (e) {
        console.error('getSessionUser [borrowing.ts]: Failed to parse session cookie', e)
        return null
    }
}

export async function submitBorrowRequest(formData: {
    equipmentId: string
    expectedReturnDate: string
    notes: string
    purpose: string
    quantity: number
}) {
    const user = await getSessionUser()
    if (!user || !user.id) {
        throw new Error('Tidak terautentikasi')
    }

    // Use Admin Client for DB operations to bypass RLS if needed, 
    // or standard client if RLS allows public writes (but usually safe to use Admin here if we verified user)
    // However, for consistency with the rest of the app which uses Anon key, 
    // let's try to stick to Anon key if possible, BUT confirmReturn definitely needs Admin.
    // For submit, usually users can insert their own rows.
    // Let's use Admin client to be safe against RLS issues, since we trust our manual auth check.
    const supabase = createAdminClient()

    // 2. Refresh User Data (Check Ban Status & Role)
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*, role')
        .eq('id', user.id)
        .single()

    if (userError || !userData) {
        throw new Error('Gagal memuat data user')
    }

    const bannedUntil = (userData as any).banned_until
    const isBanned = bannedUntil && new Date(bannedUntil) > new Date()
    if (isBanned) {
        const bannedUntilFormatted = new Date(bannedUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        throw new Error(`Akun Anda telah diblokir hingga ${bannedUntilFormatted}`)
    }

    // 3. Check Limits
    const userLimits = getLimitsForRole(userData.role || 'mahasiswa')
    const { count: activeBorrowingsCount, error: countError } = await supabase
        .from('borrowing_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pending', 'active'] as any)

    if (activeBorrowingsCount !== null && activeBorrowingsCount >= userLimits.maxItems) {
        throw new Error(`Anda telah mencapai batas maksimal peminjaman (${userLimits.maxItems} item)`)
    }

    // 4. Check Stock
    const { data: equipmentData, error: stockError } = await supabase
        .from('equipment')
        .select('stock, name')
        .eq('id', formData.equipmentId)
        .single()

    if (stockError || !equipmentData) throw new Error('Peralatan tidak ditemukan')

    if (equipmentData.stock < formData.quantity) {
        throw new Error(`Stok tidak cukup! Tersedia: ${equipmentData.stock} unit, diminta: ${formData.quantity} unit`)
    }

    // 5. Insert Transaction
    const borrowDate = new Date().toISOString().split('T')[0]
    const finalNotes = formData.purpose ? `[${formData.purpose.toUpperCase()}] ${formData.notes}` : formData.notes

    const { data: transaction, error: insertError } = await supabase
        .from('borrowing_transactions')
        .insert({
            user_id: user.id,
            equipment_id: formData.equipmentId,
            borrow_date: borrowDate,
            expected_return_date: formData.expectedReturnDate,
            notes: finalNotes,
            quantity: formData.quantity,
            status: 'pending'
        })
        .select()
        .single()

    if (insertError) {
        console.error('Insert Error:', insertError)
        throw new Error('Gagal mengajukan peminjaman')
    }

    // 6. Send Email Notifications to Admins
    const { data: admins } = await supabase
        .from('users')
        .select('email')
        .in('role', ['admin', 'lab_staff'])

    if (admins && admins.length > 0) {
        const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/borrowing-requests?id=${transaction.id}`

        const emailPromises = admins.map(admin => {
            if (admin.email) {
                return emailService.sendBorrowRequestEmail(
                    admin.email,
                    userData.full_name || userData.email,
                    equipmentData.name,
                    formData.quantity,
                    borrowDate,
                    dashboardLink
                )
            }
        })

        Promise.allSettled(emailPromises).catch(err => console.error('Failed to send admin emails', err))
    }

    // 7. Revalidate
    revalidatePath('/dashboard/student')
    revalidatePath('/dashboard/my-borrowings')

    return { success: true, data: transaction }
}

export async function approveBorrowRequest(requestId: string, notes: string) {
    const user = await getSessionUser()
    if (!user) throw new Error('Tidak terautentikasi')

    if (user.role !== 'admin' && user.role !== 'lab_staff') {
        throw new Error('Tidak memiliki izin')
    }

    const supabase = createAdminClient()

    // 2. Fetch Transaction
    const { data: rawTransaction, error: fetchError } = await supabase
        .from('borrowing_transactions')
        .select('*, user:users!borrowing_transactions_user_id_fkey(email, full_name), equipment:equipment!borrowing_transactions_equipment_id_fkey(name, stock, id)')
        .eq('id', requestId)
        .single()

    if (fetchError || !rawTransaction) throw new Error('Transaksi tidak ditemukan')

    // Explicitly cast to include relations
    const transaction = rawTransaction as any
    if (!transaction.equipment) throw new Error('Data peralatan rusak (tidak ditemukan di transaksi)')

    const equipment = transaction.equipment
    const quantity = transaction.quantity || 1

    // 3. Stock Check (Re-fetch for safety)
    const { data: currentEquipment, error: equipError } = await supabase
        .from('equipment')
        .select('stock, id, name')
        .eq('id', equipment.id)
        .single()

    if (equipError || !currentEquipment) throw new Error('Peralatan hilang dari database')

    if (currentEquipment.stock < quantity) {
        throw new Error(`Stok tidak cukup! Tersedia: ${currentEquipment.stock}, diminta: ${quantity}`)
    }

    // 4. Update Transaction
    const { error: updateTransError } = await supabase
        .from('borrowing_transactions')
        .update({
            status: 'active',
            admin_notes: notes || null,
            approved_by: user.id,
            approved_at: new Date().toISOString()
        })
        .eq('id', requestId)

    if (updateTransError) throw updateTransError

    // 5. Deduct Stock
    const newStock = currentEquipment.stock - quantity
    const { error: updateStockError } = await supabase
        .from('equipment')
        .update({
            stock: newStock,
            status: newStock === 0 ? 'borrowed' : 'available'
        })
        .eq('id', equipment.id)

    if (updateStockError) {
        console.error('Failed to update stock', updateStockError)
    }

    // 6. Create In-App Notification
    await supabase
        .from('notifications')
        .insert({
            user_id: transaction.user_id,
            title: 'Peminjaman Disetujui',
            message: `Permintaan peminjaman ${quantity} unit ${equipment.name} telah disetujui. Silakan ambil peralatan di laboratorium.`,
            type: 'approval',
            is_read: false
        })

    // 7. Send Email Notification
    if (transaction.user && transaction.user.email) {
        await emailService.sendBorrowApprovalEmail(
            transaction.user.email,
            transaction.user.full_name || 'Mahasiswa',
            equipment.name,
            quantity,
            transaction.expected_return_date
        )
    }

    revalidatePath('/dashboard/borrowing-requests')
    revalidatePath('/dashboard/equipment')
    revalidatePath('/dashboard/student')

    return { success: true }
}

export async function rejectBorrowRequest(requestId: string, reason: string) {
    const user = await getSessionUser()
    if (!user) throw new Error('Tidak terautentikasi')

    if (user.role !== 'admin' && user.role !== 'lab_staff') {
        throw new Error('Tidak memiliki izin')
    }

    const supabase = createAdminClient()

    // 2. Fetch Transaction for email detail
    const { data: rawTransaction, error: fetchError } = await supabase
        .from('borrowing_transactions')
        .select('*, user:users!borrowing_transactions_user_id_fkey(email, full_name), equipment:equipment!borrowing_transactions_equipment_id_fkey(name)')
        .eq('id', requestId)
        .single()

    if (fetchError || !rawTransaction) throw new Error('Transaksi tidak ditemukan')

    const transaction = rawTransaction as any

    // 3. Update Transaction
    const { error: updateError } = await supabase
        .from('borrowing_transactions')
        .update({
            status: 'rejected',
            rejected_reason: reason,
            approved_by: user.id,
            approved_at: new Date().toISOString()
        })
        .eq('id', requestId)

    if (updateError) throw updateError

    // 4. Create In-App Notification
    await supabase
        .from('notifications')
        .insert({
            user_id: transaction.user_id,
            title: 'Peminjaman Ditolak',
            message: `Permintaan peminjaman Anda ditolak. Alasan: ${reason}`,
            type: 'approval',
            is_read: false
        })

    // 5. Send Email Notification
    if (transaction.user && transaction.user.email) {
        await emailService.sendBorrowRejectionEmail(
            transaction.user.email,
            transaction.user.full_name || 'Mahasiswa',
            transaction.equipment?.name || 'Peralatan',
            transaction.quantity || 1,
            reason
        )
    }

    revalidatePath('/dashboard/borrowing-requests')
    revalidatePath('/dashboard/student')

    return { success: true }
}

export async function confirmReturn(data: {
    requestId: string
    condition: string
    notes: string
    hasDamage: boolean
}) {
    // 1. Auth Check - Manual Session
    const user = await getSessionUser()
    if (!user) {
        throw new Error('Tidak terautentikasi')
    }

    if (user.role !== 'admin' && user.role !== 'lab_staff') {
        throw new Error('Tidak memiliki izin')
    }

    // Use Admin Client to ensure we can update tables regardless of RLS
    const supabase = createAdminClient()

    // 2. Fetch Transaction
    const { data: rawTransaction, error: fetchError } = await supabase
        .from('borrowing_transactions')
        .select('*, user:users!borrowing_transactions_user_id_fkey(email, full_name), equipment:equipment!borrowing_transactions_equipment_id_fkey(name, stock, id)')
        .eq('id', data.requestId)
        .single()

    if (fetchError || !rawTransaction) throw new Error('Transaksi tidak ditemukan')

    const transaction = rawTransaction as any
    if (!transaction.equipment) throw new Error('Data peralatan rusak')

    const equipment = transaction.equipment

    // 3. Calculate Penalty
    const actualReturnDate = new Date()
    const penaltyAmount = calculatePenalty(new Date(transaction.expected_return_date), actualReturnDate)

    // 4. Update Transaction
    const { error: transactionError } = await supabase
        .from('borrowing_transactions')
        .update({
            status: 'returned',
            actual_return_date: actualReturnDate.toISOString().split('T')[0],
            return_condition: data.condition,
            return_notes: data.notes,
            penalty_amount: penaltyAmount,
            penalty_paid: penaltyAmount === 0
        })
        .eq('id', data.requestId)

    if (transactionError) throw transactionError

    // 5. Update Equipment (Stock & Condition)
    const returnedQty = transaction.quantity || 1

    // Re-fetch current stock to be safe
    const { data: currentEquipment } = await supabase
        .from('equipment')
        .select('stock')
        .eq('id', equipment.id)
        .single()

    const currentStock = (currentEquipment as any)?.stock || 0

    const equipmentUpdate: any = {
        status: 'available',
        stock: currentStock + returnedQty
    }

    if (data.hasDamage) {
        equipmentUpdate.condition = data.condition
    }

    await supabase
        .from('equipment')
        .update(equipmentUpdate)
        .eq('id', equipment.id)

    // 6. Create Notification
    let message = 'Peralatan telah dikembalikan dan dikonfirmasi oleh admin.'
    if (penaltyAmount > 0) {
        message += ` Denda keterlambatan: ${formatPenalty(penaltyAmount)}`
    }

    await supabase
        .from('notifications')
        .insert({
            user_id: transaction.user_id,
            title: 'Pengembalian Dikonfirmasi',
            message,
            type: 'equipment',
            is_read: false
        })

    // 7. Send Email
    if (transaction.user && transaction.user.email) {
        await emailService.sendReturnConfirmationEmail(
            transaction.user.email,
            transaction.user.full_name || 'Mahasiswa',
            equipment.name,
            returnedQty,
            actualReturnDate.toISOString().split('T')[0],
            data.condition
        )
    }

    revalidatePath('/dashboard/return-requests')
    revalidatePath('/dashboard/equipment')
    revalidatePath('/dashboard/student')

    return { success: true }
}
