"use client"

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
    Package,
    Clock,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    User,
    Calendar,
    FileText,
    AlertTriangle,
    Loader2,
    ChevronRight,
    Eye
} from 'lucide-react'
import { BORROWING_CONFIG } from '@/lib/borrowing-config'


interface BorrowingRequest {
    id: string
    user_id: string
    equipment_id: string
    quantity: number
    borrow_date: string
    expected_return_date: string
    notes: string | null
    status: string
    created_at: string
    user: {
        full_name: string
        email: string
        nim: string | null
        department: string
    }
    equipment: {
        id: string
        name: string
        serial_number: string
        condition: string
        location: string
        status: string
    }
}

export default function BorrowingRequestsPage() {
    const { user } = useCustomAuth()
    const queryClient = useQueryClient()
    const [filter, setFilter] = useState<string>('pending')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedRequest, setSelectedRequest] = useState<BorrowingRequest | null>(null)
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const [adminNotes, setAdminNotes] = useState('')

    // Check if user is admin or lab_staff
    const canManage = user?.role === 'admin' || user?.role === 'lab_staff'

    // Fetch borrowing requests
    const { data: requests, isLoading, refetch } = useQuery({
        queryKey: ['borrowing-requests', filter, searchTerm],
        queryFn: async () => {
            let query = supabase
                .from('borrowing_transactions')
                .select(`
          *,
          user:user_profiles!borrowing_transactions_user_id_fkey(full_name, email, nim, department),
          equipment:equipment!borrowing_transactions_equipment_id_fkey(id, name, serial_number, condition, location, status),
          quantity
        `)
                .order('created_at', { ascending: false })

            if (filter !== 'all') {
                query = query.eq('status', filter as any)
            }

            const { data, error } = await query
            if (error) throw error

            // Filter by search term
            let filtered = (data as unknown as BorrowingRequest[]) || []
            if (searchTerm) {
                const search = searchTerm.toLowerCase()
                filtered = filtered.filter(r =>
                    r.user?.full_name?.toLowerCase().includes(search) ||
                    r.user?.nim?.toLowerCase().includes(search) ||
                    r.equipment?.name?.toLowerCase().includes(search) ||
                    r.equipment?.serial_number?.toLowerCase().includes(search)
                )
            }

            return filtered
        },
        enabled: canManage
    })

    // Approve mutation
    const approveMutation = useMutation({
        mutationFn: async ({ requestId, notes }: { requestId: string, notes: string }) => {
            // Get transaction details including quantity
            const { data: transaction, error: fetchError } = await supabase
                .from('borrowing_transactions')
                .select('equipment_id, user_id, quantity')
                .eq('id', requestId)
                .single()

            if (fetchError || !transaction) throw new Error('Transaksi tidak ditemukan')
            if (!transaction.equipment_id) throw new Error('ID Peralatan tidak valid')

            // Check current stock
            const { data: equipment, error: stockError } = await supabase
                .from('equipment')
                .select('stock, name')
                .eq('id', transaction.equipment_id)
                .single()

            if (stockError || !equipment) throw new Error('Peralatan tidak ditemukan')

            const requestedQty = (transaction as any).quantity || 1
            if ((equipment as any).stock < requestedQty) {
                throw new Error(`Stok tidak cukup! Tersedia: ${(equipment as any).stock} unit, diminta: ${requestedQty} unit`)
            }

            // Update transaction status
            const { error: transactionError } = await supabase
                .from('borrowing_transactions')
                .update({
                    status: 'active',
                    admin_notes: notes || null,
                    approved_by: user?.id,
                    approved_at: new Date().toISOString()
                })
                .eq('id', requestId)

            if (transactionError) throw transactionError

            // Decrement stock
            const newStock = (equipment as any).stock - requestedQty
            const { error: updateError } = await supabase
                .from('equipment')
                .update({
                    stock: newStock,
                    status: newStock === 0 ? 'borrowed' : 'available'
                })
                .eq('id', transaction.equipment_id!)

            if (updateError) throw updateError

            // Create notification for user
            await supabase
                .from('notifications')
                .insert({
                    user_id: transaction.user_id,
                    title: 'Peminjaman Disetujui',
                    message: `Permintaan peminjaman ${requestedQty} unit ${(equipment as any).name} telah disetujui. Silakan ambil peralatan di laboratorium.`,
                    type: 'approval',
                    is_read: false
                })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['borrowing-requests'] })
            queryClient.invalidateQueries({ queryKey: ['equipment'] })
            setIsApproveDialogOpen(false)
            setSelectedRequest(null)
            setAdminNotes('')
        }
    })

    // Reject mutation
    const rejectMutation = useMutation({
        mutationFn: async ({ requestId, reason }: { requestId: string, reason: string }) => {
            const { error } = await supabase
                .from('borrowing_transactions')
                .update({
                    status: 'rejected' as any,
                    rejected_reason: reason,
                    approved_by: user?.id,
                    approved_at: new Date().toISOString()
                } as any)
                .eq('id', requestId)

            if (error) throw error

            // Get user ID for notification
            const { data: transaction } = await supabase
                .from('borrowing_transactions')
                .select('user_id')
                .eq('id', requestId)
                .single()

            if (transaction) {
                // Create notification for user
                await supabase
                    .from('notifications')
                    .insert({
                        user_id: transaction.user_id,
                        title: 'Peminjaman Ditolak',
                        message: `Permintaan peminjaman Anda ditolak. Alasan: ${reason}`,
                        type: 'approval',
                        is_read: false
                    })
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['borrowing-requests'] })
            setIsRejectDialogOpen(false)
            setSelectedRequest(null)
            setRejectReason('')
        }
    })

    const handleApprove = (request: BorrowingRequest) => {
        setSelectedRequest(request)
        setIsApproveDialogOpen(true)
    }

    const handleReject = (request: BorrowingRequest) => {
        setSelectedRequest(request)
        setIsRejectDialogOpen(true)
    }

    const confirmApprove = () => {
        if (selectedRequest) {
            approveMutation.mutate({ requestId: selectedRequest.id, notes: adminNotes })
        }
    }

    const confirmReject = () => {
        if (selectedRequest && rejectReason.trim()) {
            rejectMutation.mutate({ requestId: selectedRequest.id, reason: rejectReason })
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const getStatusConfig = (status: string) => {
        const config: Record<string, { label: string; color: string; bg: string; icon: any }> = {
            pending: { label: 'Menunggu', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
            active: { label: 'Aktif', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle },
            rejected: { label: 'Ditolak', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
            returned: { label: 'Dikembalikan', color: 'text-gray-600', bg: 'bg-gray-100', icon: Package }
        }
        return config[status] || config.pending
    }

    const pendingCount = requests?.filter(r => r.status === 'pending').length || 0

    if (!canManage) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
                    <p className="text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen bg-gradient-to-br from-[#f8f7fc] via-white to-[#fff5f9]">

            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                            Permintaan Peminjaman
                        </h1>
                        <p className="text-gray-600">
                            Kelola permintaan peminjaman peralatan laboratorium
                        </p>
                    </div>
                    {pendingCount > 0 && (
                        <div className="px-4 py-2 bg-amber-100 rounded-xl">
                            <span className="text-amber-800 font-semibold">
                                {pendingCount} permintaan menunggu persetujuan
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, NIM, atau peralatan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:bg-white outline-none transition-all"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2">
                        {[
                            { value: 'pending', label: 'Menunggu', count: pendingCount },
                            { value: 'active', label: 'Disetujui' },
                            { value: 'rejected', label: 'Ditolak' },
                            { value: 'all', label: 'Semua' }
                        ].map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setFilter(tab.value as any)}
                                className={`px-4 py-2 rounded-xl font-medium transition-all ${filter === tab.value
                                    ? 'bg-[#ff007a] text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {tab.label}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Requests List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#ff007a]" />
                </div>
            ) : requests && requests.length > 0 ? (
                <div className="space-y-4">
                    {requests.map((request) => {
                        const statusConfig = getStatusConfig(request.status)
                        const StatusIcon = statusConfig.icon

                        return (
                            <div
                                key={request.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden"
                            >
                                {/* Main Content */}
                                <div className="p-6">
                                    {/* Top Row: User + Equipment */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        {/* User Info */}
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-[#ff007a] to-[#ff4d9e] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#ff007a]/20">
                                                <User className="w-7 h-7 text-white" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-lg text-gray-900 mb-1">{request.user?.full_name}</h3>
                                                <p className="text-sm text-gray-500">{request.user?.nim}</p>
                                                <p className="text-sm text-[#ff007a] font-medium">{request.user?.department}</p>
                                            </div>
                                        </div>

                                        {/* Equipment Info */}
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                                <Package className="w-7 h-7 text-gray-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <h4 className="font-bold text-lg text-gray-900">{request.equipment?.name}</h4>
                                                    {(request.quantity || 1) > 1 && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold bg-[#ff007a] text-white">
                                                            {request.quantity} unit
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 font-mono bg-gray-50 inline-block px-2 py-0.5 rounded">{request.equipment?.serial_number}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle Row: Dates */}
                                    <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Tanggal Pinjam</p>
                                            <p className="text-lg font-bold text-gray-900">{formatDate(request.borrow_date)}</p>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <ChevronRight className="w-6 h-6 text-gray-300" />
                                        </div>
                                        <div className="flex-1 text-right">
                                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Tanggal Kembali</p>
                                            <p className="text-lg font-bold text-gray-900">{formatDate(request.expected_return_date)}</p>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {request.notes && (
                                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-6">
                                            <div className="flex items-start gap-3">
                                                <FileText className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-amber-600 uppercase tracking-wide font-semibold mb-1">Catatan Mahasiswa</p>
                                                    <p className="text-sm text-amber-900">{request.notes}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bottom Row: Status & Actions */}
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <span className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${statusConfig.bg} ${statusConfig.color}`}>
                                            <StatusIcon className="w-5 h-5" />
                                            {statusConfig.label}
                                        </span>

                                        {request.status === 'pending' && (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleApprove(request)}
                                                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                    Setujui
                                                </button>
                                                <button
                                                    onClick={() => handleReject(request)}
                                                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-red-500/20"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                    Tolak
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-700 mb-1">Tidak ada permintaan</h3>
                    <p className="text-sm text-gray-500">
                        {filter === 'pending'
                            ? 'Tidak ada permintaan yang menunggu persetujuan'
                            : 'Tidak ada permintaan peminjaman ditemukan'}
                    </p>
                </div>
            )}

            {/* Approve Dialog */}
            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Setujui Peminjaman</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {selectedRequest && (
                            <>
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                        <span className="font-semibold text-emerald-800">Konfirmasi Persetujuan</span>
                                    </div>
                                    <p className="text-sm text-emerald-700">
                                        Peralatan <strong>{selectedRequest.equipment?.name}</strong>
                                        {(selectedRequest.quantity || 1) > 1 && <span> ({selectedRequest.quantity} unit)</span>}
                                        {' '}akan dipinjamkan kepada <strong>{selectedRequest.user?.full_name}</strong>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Catatan Admin (Opsional)
                                    </label>
                                    <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Tambahkan catatan jika diperlukan..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:bg-white outline-none transition-all resize-none"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setIsApproveDialogOpen(false)}
                                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={confirmApprove}
                                        disabled={approveMutation.isPending}
                                        className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {approveMutation.isPending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-5 h-5" />
                                        )}
                                        Setujui Peminjaman
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Tolak Peminjaman</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {selectedRequest && (
                            <>
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <XCircle className="w-5 h-5 text-red-600" />
                                        <span className="font-semibold text-red-800">Konfirmasi Penolakan</span>
                                    </div>
                                    <p className="text-sm text-red-700">
                                        Permintaan peminjaman <strong>{selectedRequest.equipment?.name}</strong> oleh <strong>{selectedRequest.user?.full_name}</strong> akan ditolak.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Alasan Penolakan <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Berikan alasan mengapa peminjaman ditolak..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:bg-white outline-none transition-all resize-none"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setIsRejectDialogOpen(false)}
                                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={confirmReject}
                                        disabled={rejectMutation.isPending || !rejectReason.trim()}
                                        className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {rejectMutation.isPending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <XCircle className="w-5 h-5" />
                                        )}
                                        Tolak Peminjaman
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
