"use client"

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
    Package,
    Clock,
    CheckCircle,
    Search,
    AlertTriangle,
    Loader2,
    ChevronRight,
    User,
    Camera,
    FileText
} from 'lucide-react'
import { BORROWING_CONFIG, calculatePenalty, formatPenalty, getOverdueDays } from '@/lib/borrowing-config'


interface ReturnRequest {
    id: string
    user_id: string
    equipment_id: string
    borrow_date: string
    expected_return_date: string
    notes: string | null
    status: string
    return_requested: boolean
    return_requested_at: string | null
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
    }
}

export default function ReturnRequestsPage() {
    const { user } = useCustomAuth()
    const queryClient = useQueryClient()
    const [filter, setFilter] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null)
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
    const [returnCondition, setReturnCondition] = useState('')
    const [returnNotes, setReturnNotes] = useState('')
    const [hasDamage, setHasDamage] = useState(false)
    const [checklist, setChecklist] = useState({
        physicalCheck: false,
        accessoriesComplete: false,
        functionalityOk: false,
        cleanliness: false
    })
    const allChecklistComplete = Object.values(checklist).every(v => v)

    // Check if user is admin or lab_staff
    const canManage = user?.role === 'admin' || user?.role === 'lab_staff'

    // Fetch active borrowings that need return processing
    const { data: requests, isLoading, refetch } = useQuery({
        queryKey: ['return-requests', filter, searchTerm],
        queryFn: async () => {
            let query = supabase
                .from('borrowing_transactions')
                .select(`
          *,
          user:users!borrowing_transactions_user_id_fkey(full_name, email, nim, department),
          equipment:equipment!borrowing_transactions_equipment_id_fkey(id, name, serial_number, condition, location)
        `)
                .eq('status', 'active' as any)
                .order('expected_return_date', { ascending: true })

            if (filter === 'return_requested') {
                query = query.eq('return_requested', true)
            } else if (filter === 'overdue') {
                query = query.lt('expected_return_date', new Date().toISOString().split('T')[0])
            }

            const { data, error } = await query
            if (error) throw error

            // Filter by search term
            let filtered = (data as unknown as ReturnRequest[]) || []
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

    // Confirm return mutation
    const confirmReturnMutation = useMutation({
        mutationFn: async ({
            requestId,
            condition,
            notes,
            equipmentId,
            expectedDate
        }: {
            requestId: string
            condition: string
            notes: string
            equipmentId: string
            expectedDate: string
        }) => {
            const actualReturnDate = new Date()
            const penaltyAmount = calculatePenalty(new Date(expectedDate), actualReturnDate)

            // Update transaction status
            const { error: transactionError } = await supabase
                .from('borrowing_transactions')
                .update({
                    status: 'returned' as any,
                    actual_return_date: actualReturnDate.toISOString().split('T')[0],
                    return_condition: condition,
                    return_notes: notes,
                    penalty_amount: penaltyAmount,
                    penalty_paid: penaltyAmount === 0
                })
                .eq('id', requestId)

            if (transactionError) throw transactionError

            // Update equipment status to available and condition if damaged
            const equipmentUpdate: any = { status: 'available' }
            if (hasDamage) {
                equipmentUpdate.condition = condition
            }

            await supabase
                .from('equipment')
                .update(equipmentUpdate)
                .eq('id', equipmentId)

            // Get user ID for notification
            const { data: transaction } = await supabase
                .from('borrowing_transactions')
                .select('user_id')
                .eq('id', requestId)
                .single()

            if (transaction) {
                // Create notification for user
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
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['return-requests'] })
            setIsConfirmDialogOpen(false)
            setSelectedRequest(null)
            setReturnCondition('')
            setReturnNotes('')
            setHasDamage(false)
        }
    })

    const handleConfirmReturn = (request: ReturnRequest) => {
        setSelectedRequest(request)
        setReturnCondition(request.equipment?.condition || 'good')
        setIsConfirmDialogOpen(true)
    }

    const confirmReturn = () => {
        if (selectedRequest && returnCondition) {
            confirmReturnMutation.mutate({
                requestId: selectedRequest.id,
                condition: returnCondition,
                notes: returnNotes,
                equipmentId: selectedRequest.equipment?.id,
                expectedDate: selectedRequest.expected_return_date
            })
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const getOverdueStatus = (expectedDate: string) => {
        const days = getOverdueDays(new Date(expectedDate))
        if (days === 0) return null
        return {
            days,
            penalty: calculatePenalty(new Date(expectedDate), new Date())
        }
    }

    const pendingReturnsCount = requests?.filter(r => r.return_requested).length || 0
    const overdueCount = requests?.filter(r => getOverdueDays(new Date(r.expected_return_date)) > 0).length || 0

    if (!canManage) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
                        <p className="text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen bg-gradient-to-br from-[#f8f7fc] via-white to-[#fff5f9]">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                                Permintaan Pengembalian
                            </h1>
                            <p className="text-gray-600">
                                Verifikasi dan konfirmasi pengembalian peralatan
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {pendingReturnsCount > 0 && (
                                <div className="px-4 py-2 bg-blue-100 rounded-xl">
                                    <span className="text-blue-800 font-semibold">
                                        {pendingReturnsCount} menunggu verifikasi
                                    </span>
                                </div>
                            )}
                            {overdueCount > 0 && (
                                <div className="px-4 py-2 bg-red-100 rounded-xl">
                                    <span className="text-red-800 font-semibold">
                                        {overdueCount} terlambat
                                    </span>
                                </div>
                            )}
                        </div>
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
                                { value: 'all', label: 'Semua' },
                                { value: 'return_requested', label: 'Menunggu Verifikasi', count: pendingReturnsCount },
                                { value: 'overdue', label: 'Terlambat', count: overdueCount }
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
                            const overdueStatus = getOverdueStatus(request.expected_return_date)

                            return (
                                <div
                                    key={request.id}
                                    className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-lg transition-all ${overdueStatus ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
                                        }`}
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                        {/* User Info */}
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${overdueStatus ? 'bg-red-500' : 'bg-gradient-to-br from-[#ff007a] to-[#ff4d9e]'
                                                }`}>
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

                                        {/* Overdue Info */}
                                        {overdueStatus && (
                                            <div className="bg-red-100 rounded-xl p-3 text-center">
                                                <p className="text-xs text-red-600 uppercase font-semibold">Terlambat</p>
                                                <p className="text-lg font-bold text-red-700">{overdueStatus.days} hari</p>
                                                <p className="text-xs text-red-600">{formatPenalty(overdueStatus.penalty)}</p>
                                            </div>
                                        )}

                                        {/* Dates */}
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500 uppercase">Tanggal Pinjam</p>
                                                <p className="font-medium text-gray-900">{formatDate(request.borrow_date)}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500 uppercase">Batas Kembali</p>
                                                <p className={`font-medium ${overdueStatus ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {formatDate(request.expected_return_date)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3">
                                            {request.return_requested && (
                                                <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4" />
                                                    Menunggu Verifikasi
                                                </span>
                                            )}

                                            <button
                                                onClick={() => handleConfirmReturn(request)}
                                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Konfirmasi Pengembalian
                                            </button>
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
                        <h3 className="font-semibold text-gray-700 mb-1">Tidak ada peminjaman aktif</h3>
                        <p className="text-sm text-gray-500">
                            Semua peralatan sudah dikembalikan atau tidak ada peminjaman yang sesuai filter.
                        </p>
                    </div>
                )}

                {/* Confirm Return Dialog */}
                <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                    <DialogContent className="sm:max-w-[550px]">
                        <DialogHeader>
                            <DialogTitle>Konfirmasi Pengembalian</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-5">
                            {selectedRequest && (
                                <>
                                    {/* Equipment Info */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Package className="w-5 h-5 text-gray-600" />
                                            <span className="font-semibold text-gray-900">{selectedRequest.equipment?.name}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Peminjam:</span>
                                                <p className="font-medium">{selectedRequest.user?.full_name}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">NIM:</span>
                                                <p className="font-medium">{selectedRequest.user?.nim}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Overdue Warning */}
                                    {(() => {
                                        const overdueStatus = getOverdueStatus(selectedRequest.expected_return_date)
                                        if (overdueStatus) {
                                            return (
                                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                                        <span className="font-semibold text-red-800">Terlambat {overdueStatus.days} Hari</span>
                                                    </div>
                                                    <p className="text-sm text-red-700">
                                                        Denda keterlambatan: <strong>{formatPenalty(overdueStatus.penalty)}</strong>
                                                    </p>
                                                </div>
                                            )
                                        }
                                        return null
                                    })()}

                                    {/* Inspection Checklist */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                                            ✅ Checklist Pemeriksaan
                                        </label>
                                        <div className="space-y-2">
                                            {[
                                                { key: 'physicalCheck', label: 'Kondisi fisik sudah diperiksa' },
                                                { key: 'accessoriesComplete', label: 'Kelengkapan/aksesoris lengkap' },
                                                { key: 'functionalityOk', label: 'Fungsi alat sudah diuji' },
                                                { key: 'cleanliness', label: 'Kebersihan alat sudah dicek' }
                                            ].map((item) => (
                                                <label
                                                    key={item.key}
                                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-all"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checklist[item.key as keyof typeof checklist]}
                                                        onChange={(e) => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                                                        className="w-5 h-5 rounded border-gray-300 text-[#ff007a] focus:ring-[#ff007a]"
                                                    />
                                                    <span className="text-sm text-gray-700">{item.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {!allChecklistComplete && (
                                            <p className="text-xs text-amber-600 mt-2">⚠️ Selesaikan semua pemeriksaan sebelum konfirmasi</p>
                                        )}
                                    </div>

                                    {/* Condition Check */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Kondisi Peralatan Saat Dikembalikan
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.entries(BORROWING_CONFIG.CONDITION_LABELS).map(([value, label]) => (
                                                <button
                                                    key={value}
                                                    onClick={() => {
                                                        setReturnCondition(value)
                                                        setHasDamage(value === 'poor' || value === 'damaged')
                                                    }}
                                                    className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${returnCondition === value
                                                        ? 'border-[#ff007a] bg-[#ff007a]/10 text-[#ff007a]'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Catatan Pengembalian (Opsional)
                                        </label>
                                        <textarea
                                            value={returnNotes}
                                            onChange={(e) => setReturnNotes(e.target.value)}
                                            placeholder="Catat kondisi atau masalah jika ada..."
                                            rows={3}
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:bg-white outline-none transition-all resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={() => setIsConfirmDialogOpen(false)}
                                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            onClick={confirmReturn}
                                            disabled={confirmReturnMutation.isPending || !returnCondition || !allChecklistComplete}
                                            className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {confirmReturnMutation.isPending ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-5 h-5" />
                                            )}
                                            Konfirmasi Pengembalian
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    )
}
