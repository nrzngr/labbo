"use client"

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    Search,
    AlertTriangle,
    Loader2,
    ChevronRight,
    User,
    Package,
    FileText,
    CalendarPlus
} from 'lucide-react'
import { BORROWING_CONFIG } from '@/lib/borrowing-config'
import { TablePagination } from '@/components/ui/pagination'


interface ExtensionRequest {
    id: string
    user_id: string
    equipment_id: string
    borrow_date: string
    expected_return_date: string
    extension_requested: boolean
    extension_new_date: string | null
    extension_reason: string | null
    extension_status: string | null
    status: string
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
    }
}

export default function ExtensionRequestsPage() {
    const { user } = useCustomAuth()
    const queryClient = useQueryClient()
    const [filter, setFilter] = useState<string>('pending')
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalItems, setTotalItems] = useState(0)
    const [selectedRequest, setSelectedRequest] = useState<ExtensionRequest | null>(null)
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
    const [rejectReason, setRejectReason] = useState('')

    // Check if user is admin or lab_staff
    const canManage = user?.role === 'admin' || user?.role === 'lab_staff'

    // Fetch extension requests
    const { data: requests, isLoading, refetch } = useQuery({
        queryKey: ['extension-requests', filter, searchTerm, page, pageSize],
        queryFn: async () => {
            let query = supabase
                .from('borrowing_transactions')
                .select(`
          *,
          user:users!borrowing_transactions_user_id_fkey(full_name, email, nim, department),
          equipment:equipment!borrowing_transactions_equipment_id_fkey(id, name, serial_number)
        `, { count: 'exact' })
                .eq('extension_requested', true)
                .order('created_at', { ascending: false })

            if (filter !== 'all') {
                query = query.eq('extension_status', filter as any)
            }

            if (searchTerm) {
                query = query.or(`user.full_name.ilike.%${searchTerm}%,user.nim.ilike.%${searchTerm}%,equipment.name.ilike.%${searchTerm}%`)
            }

            const from = (page - 1) * pageSize
            const to = from + pageSize - 1
            query = query.range(from, to)

            const { data, count, error } = await query
            if (error) throw error

            if (count !== null) setTotalItems(count)

            return (data as unknown as ExtensionRequest[]) || []
        },
        enabled: canManage
    })

    // Approve extension mutation
    const approveExtensionMutation = useMutation({
        mutationFn: async (requestId: string) => {
            // Get the new date first
            const { data: transaction } = await supabase
                .from('borrowing_transactions')
                .select('*')
                .eq('id', requestId)
                .single()

            if (!transaction) throw new Error('Transaction not found')

            const transactionData = transaction as any

            // Update transaction with new return date
            const { error } = await supabase
                .from('borrowing_transactions')
                .update({
                    extension_status: 'approved',
                    expected_return_date: transactionData.extension_new_date,
                    extension_approved_by: user?.id,
                    extension_approved_at: new Date().toISOString()
                } as any)
                .eq('id', requestId)

            if (error) throw error

            // Create notification
            await supabase
                .from('notifications')
                .insert({
                    user_id: transactionData.user_id,
                    title: 'Perpanjangan Disetujui',
                    message: `Permintaan perpanjangan Anda telah disetujui. Batas pengembalian baru: ${new Date(transactionData.extension_new_date).toLocaleDateString('id-ID')}`,
                    type: 'approval',
                    is_read: false
                })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['extension-requests'] })
            setIsApproveDialogOpen(false)
            setSelectedRequest(null)
        }
    })

    // Reject extension mutation
    const rejectExtensionMutation = useMutation({
        mutationFn: async ({ requestId, reason }: { requestId: string, reason: string }) => {
            // Get user ID
            const { data: transaction } = await supabase
                .from('borrowing_transactions')
                .select('user_id')
                .eq('id', requestId)
                .single()

            const { error } = await supabase
                .from('borrowing_transactions')
                .update({
                    extension_status: 'rejected',
                    extension_approved_by: user?.id,
                    extension_approved_at: new Date().toISOString()
                } as any)
                .eq('id', requestId)

            if (error) throw error

            if (transaction) {
                await supabase
                    .from('notifications')
                    .insert({
                        user_id: transaction.user_id,
                        title: 'Perpanjangan Ditolak',
                        message: `Permintaan perpanjangan Anda ditolak. Alasan: ${reason}`,
                        type: 'approval',
                        is_read: false
                    })
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['extension-requests'] })
            setIsRejectDialogOpen(false)
            setSelectedRequest(null)
            setRejectReason('')
        }
    })

    const handleApprove = (request: ExtensionRequest) => {
        setSelectedRequest(request)
        setIsApproveDialogOpen(true)
    }

    const handleReject = (request: ExtensionRequest) => {
        setSelectedRequest(request)
        setIsRejectDialogOpen(true)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const getExtensionDays = (currentDate: string, newDate: string) => {
        const diff = new Date(newDate).getTime() - new Date(currentDate).getTime()
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    const getStatusConfig = (status: string | null) => {
        const config: Record<string, { label: string; color: string; bg: string; icon: any }> = {
            pending: { label: 'Menunggu', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
            approved: { label: 'Disetujui', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle },
            rejected: { label: 'Ditolak', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle }
        }
        return config[status || 'pending'] || config.pending
    }

    const pendingCount = requests?.filter(r => r.extension_status === 'pending').length || 0

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
                            Permintaan Perpanjangan
                        </h1>
                        <p className="text-gray-600">
                            Kelola permintaan perpanjangan waktu peminjaman
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
                            { value: 'approved', label: 'Disetujui' },
                            { value: 'rejected', label: 'Ditolak' },
                            { value: 'all', label: 'Semua' }
                        ].map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setFilter(tab.value)}
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

            {/* Requests Table */}
            <div className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-gray-100 min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="py-4 px-6 text-left w-[250px]">
                                    <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Peminjam</span>
                                </th>
                                <th className="py-4 px-6 text-left w-[250px]">
                                    <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Peralatan</span>
                                </th>
                                <th className="py-4 px-6 text-center w-[150px]">
                                    <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Batas Lama</span>
                                </th>
                                <th className="py-4 px-6 text-center w-[150px]">
                                    <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Batas Baru</span>
                                </th>
                                <th className="py-4 px-6 text-center w-[150px]">
                                    <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Status</span>
                                </th>
                                <th className="py-4 px-6 text-center w-[100px]">
                                    <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Aksi</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-[#ff007a]" />
                                        </div>
                                    </td>
                                </tr>
                            ) : requests && requests.length > 0 ? (
                                requests.map((request) => {
                                    const statusConfig = getStatusConfig(request.extension_status)
                                    const extensionDays = request.extension_new_date
                                        ? getExtensionDays(request.expected_return_date, request.extension_new_date)
                                        : 0

                                    let statusDotColor = '#FFEE35'; // Default
                                    if (request.extension_status === 'approved') statusDotColor = '#3AFB57'; // Green
                                    if (request.extension_status === 'rejected') statusDotColor = '#FF6666'; // Red

                                    return (
                                        <tr
                                            key={request.id}
                                            className="group hover:bg-pink-50/10 transition-colors"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff007a] to-[#ff4d9e] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                                                        {request.user?.full_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                            {request.user?.full_name}
                                                        </span>
                                                        <span className="text-[12px] text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                            {request.user?.nim}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                        {request.equipment?.name}
                                                    </span>
                                                    <span className="text-[12px] text-gray-400 font-mono" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                        {request.equipment?.serial_number}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                    {formatDate(request.expected_return_date)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                        {request.extension_new_date ? formatDate(request.extension_new_date) : '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div
                                                        className="w-[12px] h-[12px] rounded-full shadow-sm"
                                                        style={{ backgroundColor: statusDotColor }}
                                                    />
                                                    <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                        {statusConfig.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {request.extension_status === 'pending' ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleApprove(request)}
                                                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                                                            title="Setujui"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(request)}
                                                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                                            title="Tolak"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[12px] text-gray-400 italic" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                        Selesai
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                <CalendarPlus className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>Tidak Ada Permintaan</h3>
                                            <p className="text-gray-400 text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                {filter === 'pending'
                                                    ? 'Tidak ada permintaan yang menunggu persetujuan'
                                                    : 'Tidak ada permintaan perpanjangan ditemukan'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Pagination */}
            <TablePagination
                currentPage={page}
                totalPages={Math.ceil(totalItems / pageSize)}
                onPageChange={setPage}
                totalItems={totalItems}
                itemsPerPage={pageSize}
                onPageSizeChange={setPageSize}
            />

            {/* Approve Dialog */}
            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Setujui Perpanjangan</DialogTitle>
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
                                        Perpanjangan untuk <strong>{selectedRequest.equipment?.name}</strong> akan disetujui.
                                        Batas pengembalian baru: <strong>{selectedRequest.extension_new_date ? formatDate(selectedRequest.extension_new_date) : '-'}</strong>
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setIsApproveDialogOpen(false)}
                                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={() => approveExtensionMutation.mutate(selectedRequest.id)}
                                        disabled={approveExtensionMutation.isPending}
                                        className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {approveExtensionMutation.isPending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-5 h-5" />
                                        )}
                                        Setujui Perpanjangan
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
                        <DialogTitle>Tolak Perpanjangan</DialogTitle>
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
                                        Permintaan perpanjangan untuk <strong>{selectedRequest.equipment?.name}</strong> akan ditolak.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Alasan Penolakan <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Berikan alasan mengapa permintaan ditolak..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:bg-white outline-none transition-all resize-none"
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
                                        onClick={() => rejectExtensionMutation.mutate({ requestId: selectedRequest.id, reason: rejectReason })}
                                        disabled={rejectExtensionMutation.isPending || !rejectReason.trim()}
                                        className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {rejectExtensionMutation.isPending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <XCircle className="w-5 h-5" />
                                        )}
                                        Tolak Perpanjangan
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    )
}
