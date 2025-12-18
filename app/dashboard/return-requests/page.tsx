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
    Search,
    AlertTriangle,
    Loader2,
    ChevronRight,
    User,
    Camera,
    FileText
} from 'lucide-react'
import { BORROWING_CONFIG, calculatePenalty, formatPenalty, getOverdueDays } from '@/lib/borrowing-config'
import { TablePagination } from '@/components/ui/pagination'


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
    return_notes: string | null
    return_proof_url: string | null
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
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalItems, setTotalItems] = useState(0)
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
        queryKey: ['return-requests', filter, searchTerm, page, pageSize],
        queryFn: async () => {
            let query = supabase
                .from('borrowing_transactions')
                .select(`
          id, user_id, equipment_id, borrow_date, expected_return_date, notes, status, 
          return_requested, return_requested_at, return_notes, return_proof_url, created_at,
          user:users!borrowing_transactions_user_id_fkey(full_name, email, nim, department),
          equipment:equipment!borrowing_transactions_equipment_id_fkey(id, name, serial_number, condition, location)
        `, { count: 'exact' })
                .in('status', ['active', 'overdue'] as any)
                .order('return_requested', { ascending: false })
                .order('expected_return_date', { ascending: true })

            if (filter === 'return_requested') {
                query = query.eq('return_requested', true)
            } else if (filter === 'overdue') {
                query = query.lt('expected_return_date', new Date().toISOString().split('T')[0])
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

            return (data as unknown as ReturnRequest[]) || []
        },
        enabled: canManage
    })

    // Confirm return mutation
    const confirmReturnMutation = useMutation({
        mutationFn: async ({
            requestId,
            condition,
            notes,
        }: {
            requestId: string
            condition: string
            notes: string
        }) => {
            const { confirmReturn } = await import('@/app/actions/borrowing')

            await confirmReturn({
                requestId,
                condition,
                notes,
                hasDamage: condition === 'poor' || condition === 'damaged'
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['return-requests'] })
            setIsConfirmDialogOpen(false)
            setSelectedRequest(null)
            setReturnCondition('')
            setReturnNotes('')
            setHasDamage(false)
        },
        onError: (error) => {
            alert(error.message)
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
                notes: returnNotes
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

            {/* Return Requests Table */}
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
                                    <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Tgl Pinjam</span>
                                </th>
                                <th className="py-4 px-6 text-center w-[150px]">
                                    <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Batas Kembali</span>
                                </th>
                                <th className="py-4 px-6 text-center w-[200px]">
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
                                    const overdueStatus = getOverdueStatus(request.expected_return_date)

                                    let statusDotColor = '#FFEE35'; // Default
                                    let statusText = 'Dipinjam';

                                    if (request.return_requested) {
                                        statusDotColor = '#3B82F6'; // Blue for requested
                                        statusText = 'Menunggu Verifikasi';
                                    } else if (overdueStatus) {
                                        statusDotColor = '#FF6666'; // Red for overdue
                                        statusText = `Telat ${overdueStatus.days} Hari`;
                                    }

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
                                                    {formatDate(request.borrow_date)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-[14px] font-medium ${overdueStatus ? 'text-red-500' : 'text-[#6E6E6E]'}`} style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                        {formatDate(request.expected_return_date)}
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
                                                        {statusText}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => handleConfirmReturn(request)}
                                                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                                                    title="Konfirmasi Pengembalian"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                <Package className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>Tidak Ada Peminjaman Aktif</h3>
                                            <p className="text-gray-400 text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                Semua peralatan sudah dikembalikan atau tidak ada data.
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

                                {/* User's Return Notes & Proof */}
                                {(selectedRequest.return_notes || selectedRequest.return_proof_url) && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm">
                                            <FileText className="w-4 h-4" />
                                            Catatan dari Peminjam
                                        </div>

                                        {selectedRequest.return_notes && (
                                            <p className="text-sm text-blue-900 bg-white/50 p-3 rounded-lg">
                                                {selectedRequest.return_notes}
                                            </p>
                                        )}

                                        {selectedRequest.return_proof_url && (
                                            <div className="space-y-2">
                                                <p className="text-xs text-blue-700 font-medium">Bukti Pengembalian:</p>
                                                <a
                                                    href={selectedRequest.return_proof_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block"
                                                >
                                                    <img
                                                        src={selectedRequest.return_proof_url}
                                                        alt="Bukti pengembalian"
                                                        className="w-full max-h-48 object-contain rounded-lg border border-blue-200 hover:opacity-90 transition-opacity cursor-pointer"
                                                    />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}

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
        </div >
    )
}
