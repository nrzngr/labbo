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
    const [selectedRequest, setSelectedRequest] = useState<ExtensionRequest | null>(null)
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
    const [rejectReason, setRejectReason] = useState('')

    // Check if user is admin or lab_staff
    const canManage = user?.role === 'admin' || user?.role === 'lab_staff'

    // Fetch extension requests
    const { data: requests, isLoading, refetch } = useQuery({
        queryKey: ['extension-requests', filter, searchTerm],
        queryFn: async () => {
            let query = supabase
                .from('borrowing_transactions')
                .select(`
          *,
          user:users!borrowing_transactions_user_id_fkey(full_name, email, nim, department),
          equipment:equipment!borrowing_transactions_equipment_id_fkey(id, name, serial_number)
        `)
                .eq('extension_requested', true)
                .order('created_at', { ascending: false })

            if (filter !== 'all') {
                query = query.eq('extension_status', filter as any)
            }

            const { data, error } = await query
            if (error) throw error

            // Filter by search term
            let filtered = (data as unknown as ExtensionRequest[]) || []
            if (searchTerm) {
                const search = searchTerm.toLowerCase()
                filtered = filtered.filter(r =>
                    r.user?.full_name?.toLowerCase().includes(search) ||
                    r.user?.nim?.toLowerCase().includes(search) ||
                    r.equipment?.name?.toLowerCase().includes(search)
                )
            }

            return filtered
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

                {/* Requests List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[#ff007a]" />
                    </div>
                ) : requests && requests.length > 0 ? (
                    <div className="space-y-4">
                        {requests.map((request) => {
                            const statusConfig = getStatusConfig(request.extension_status)
                            const StatusIcon = statusConfig.icon
                            const extensionDays = request.extension_new_date
                                ? getExtensionDays(request.expected_return_date, request.extension_new_date)
                                : 0

                            return (
                                <div
                                    key={request.id}
                                    className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-lg transition-all"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                        {/* User Info */}
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                                <User className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">{request.user?.full_name}</h3>
                                                <p className="text-sm text-gray-500">{request.user?.nim} • {request.user?.department}</p>
                                            </div>
                                        </div>

                                        {/* Equipment Info */}
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                                <Package className="w-6 h-6 text-gray-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 truncate">{request.equipment?.name}</h4>
                                                <p className="text-sm text-gray-500 font-mono">{request.equipment?.serial_number}</p>
                                            </div>
                                        </div>

                                        {/* Extension Info */}
                                        <div className="flex items-center gap-6 bg-blue-50 rounded-xl p-3">
                                            <div className="text-center">
                                                <p className="text-xs text-blue-600 uppercase font-medium">Batas Lama</p>
                                                <p className="font-medium text-gray-900">{formatDate(request.expected_return_date)}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-blue-400" />
                                            <div className="text-center">
                                                <p className="text-xs text-blue-600 uppercase font-medium">
                                                    Batas Baru (+{extensionDays} hari)
                                                </p>
                                                <p className="font-semibold text-blue-700">
                                                    {request.extension_new_date ? formatDate(request.extension_new_date) : '-'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.color}`}>
                                                <StatusIcon className="w-4 h-4" />
                                                {statusConfig.label}
                                            </span>

                                            {request.extension_status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApprove(request)}
                                                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        Setujui
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(request)}
                                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        Tolak
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    {request.extension_reason && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="flex items-start gap-2">
                                                <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase mb-1">Alasan Perpanjangan</p>
                                                    <p className="text-sm text-gray-700">{request.extension_reason}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <CalendarPlus className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-700 mb-1">Tidak ada permintaan perpanjangan</h3>
                        <p className="text-sm text-gray-500">
                            {filter === 'pending'
                                ? 'Tidak ada permintaan yang menunggu persetujuan'
                                : 'Tidak ada permintaan perpanjangan ditemukan'}
                        </p>
                    </div>
                )}

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
            </div>
            )
}
