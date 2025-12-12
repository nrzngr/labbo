"use client"

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
    AlertTriangle, Clock, DollarSign, User, Package,
    Calendar, CheckCircle, XCircle, Search, ChevronDown,
    Mail, Send, Eye, Timer, AlertCircle
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import { BORROWING_CONFIG } from '@/lib/borrowing-config'

const PENALTY_RATE_PER_DAY = BORROWING_CONFIG.PENALTY_RATE_PER_DAY


// Calculate penalty based on days late
const calculatePenalty = (daysLate: number): number => {
    return Math.max(0, daysLate) * PENALTY_RATE_PER_DAY
}

interface OverdueTransaction {
    id: string
    user_id: string
    equipment_id: string
    borrow_date: string
    expected_return_date: string
    actual_return_date: string | null
    status: string
    notes: string | null
    penalty_amount: number | null
    penalty_paid: boolean | null
    created_at: string
    user: {
        full_name: string
        email: string
        department: string
        nim: string | null
    } | null
    equipment: {
        name: string
        serial_number: string
    } | null
}

export default function PenaltiesPage() {
    const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'resolved'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCase, setSelectedCase] = useState<OverdueTransaction | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    const queryClient = useQueryClient()

    // Fetch overdue transactions directly
    const { data: overdueItems, isLoading, error } = useQuery({
        queryKey: ['penalties', filter],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]

            const { data, error } = await supabase
                .from('borrowing_transactions')
                .select(`
                    *,
                    user:users!borrowing_transactions_user_id_fkey(full_name, email, department, nim),
                    equipment:equipment!borrowing_transactions_equipment_id_fkey(name, serial_number)
                `)
                .or(`status.eq.active,status.eq.returned`)
                .lt('expected_return_date', today)
                .order('expected_return_date', { ascending: true })

            if (error) throw error

            // Filter and calculate penalties
            let result = (data || []) as unknown as OverdueTransaction[]

            // Apply filters
            if (filter === 'pending') {
                result = result.filter(t => t.status === 'active' && !t.penalty_paid)
            } else if (filter === 'paid') {
                result = result.filter(t => t.penalty_paid === true)
            } else if (filter === 'resolved') {
                result = result.filter(t => t.status === 'returned')
            }

            return result
        },
        staleTime: 0,
    })

    // Mark penalty as paid mutation
    const markPaidMutation = useMutation({
        mutationFn: async (transactionId: string) => {
            const { error } = await supabase
                .from('borrowing_transactions')
                .update({ penalty_paid: true } as any)
                .eq('id', transactionId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['penalties'] })
            setIsDetailOpen(false)
        }
    })

    // Helper functions
    const getDaysLate = (expectedDate: string): number => {
        const expected = new Date(expectedDate)
        const today = new Date()
        const diffTime = today.getTime() - expected.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return Math.max(0, diffDays)
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    // Filter by search
    const filteredItems = overdueItems?.filter(item => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            item.user?.full_name?.toLowerCase().includes(query) ||
            item.user?.email?.toLowerCase().includes(query) ||
            item.equipment?.name?.toLowerCase().includes(query) ||
            item.user?.nim?.toLowerCase().includes(query)
        )
    }) || []

    // Calculate stats
    const stats = {
        total: overdueItems?.length || 0,
        pending: overdueItems?.filter(t => t.status === 'active' && !t.penalty_paid).length || 0,
        resolved: overdueItems?.filter(t => t.status === 'returned' || t.penalty_paid).length || 0,
        totalFines: overdueItems?.reduce((sum, t) => {
            const days = getDaysLate(t.expected_return_date)
            return sum + calculatePenalty(days)
        }, 0) || 0
    }

    const handleViewDetail = (item: OverdueTransaction) => {
        setSelectedCase(item)
        setIsDetailOpen(true)
    }

    return (
        <DashboardLayout>
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen bg-gradient-to-br from-[#f8f7fc] via-white to-[#fff5f9]">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg shadow-red-500/30">
                            <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Denda & Pelanggaran</h1>
                            <p className="text-gray-500 text-sm">Kelola denda keterlambatan dan pelanggaran peminjaman</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <ModernCard variant="default" padding="md" className="border-l-4 border-l-red-500">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-xl">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                <p className="text-xs text-red-600 font-medium">Total Kasus</p>
                            </div>
                        </div>
                    </ModernCard>

                    <ModernCard variant="default" padding="md" className="border-l-4 border-l-amber-500">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-xl">
                                <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                                <p className="text-xs text-amber-600 font-medium">Menunggu</p>
                            </div>
                        </div>
                    </ModernCard>

                    <ModernCard variant="default" padding="md" className="border-l-4 border-l-green-500">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-xl">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
                                <p className="text-xs text-green-600 font-medium">Diselesaikan</p>
                            </div>
                        </div>
                    </ModernCard>

                    <ModernCard variant="default" padding="md" className="border-l-4 border-l-pink-500">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-100 rounded-xl">
                                <DollarSign className="w-5 h-5 text-pink-600" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalFines)}</p>
                                <p className="text-xs text-pink-600 font-medium">Total Denda</p>
                            </div>
                        </div>
                    </ModernCard>
                </div>

                {/* Info Alert */}
                <ModernCard variant="default" padding="md" className="mb-6 border-l-4 border-l-blue-500 bg-blue-50/50">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-800">Perhitungan Denda Otomatis</p>
                            <p className="text-sm text-blue-700 mt-1">
                                Denda dihitung otomatis: <strong>{formatCurrency(PENALTY_RATE_PER_DAY)}</strong> per hari keterlambatan.
                                Kasus ditampilkan berdasarkan transaksi yang melewati batas waktu pengembalian.
                            </p>
                        </div>
                    </div>
                </ModernCard>

                {/* Filters & Search */}
                <ModernCard variant="default" padding="md" className="mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama, email, atau peralatan..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {[
                                { value: 'all', label: 'Semua' },
                                { value: 'pending', label: 'Menunggu' },
                                { value: 'paid', label: 'Dibayar' },
                                { value: 'resolved', label: 'Dikembalikan' }
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setFilter(opt.value as any)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === opt.value
                                        ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </ModernCard>

                {/* Cases List */}
                <ModernCard variant="default" padding="none" className="overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white">
                        <h2 className="text-lg font-bold text-gray-900">Daftar Kasus Keterlambatan</h2>
                        <p className="text-sm text-gray-500">{filteredItems.length} kasus ditemukan</p>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <div className="relative w-12 h-12 mx-auto mb-4">
                                    <div className="absolute inset-0 rounded-full border-4 border-red-200"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin"></div>
                                </div>
                                <p className="text-gray-500 font-medium">Memuat data...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-16">
                            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="text-red-600 font-medium">Gagal memuat data</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-16">
                            <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                            <p className="text-xl font-medium text-gray-900">Tidak Ada Kasus</p>
                            <p className="text-gray-500 mt-2">
                                {filter === 'all'
                                    ? 'Tidak ada transaksi yang terlambat'
                                    : 'Tidak ada kasus dengan filter ini'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredItems.map(item => {
                                const daysLate = getDaysLate(item.expected_return_date)
                                const penaltyAmount = calculatePenalty(daysLate)
                                const isPaid = item.penalty_paid === true
                                const isReturned = item.status === 'returned'

                                return (
                                    <div key={item.id} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                            {/* User Info */}
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 ${isPaid || isReturned
                                                    ? 'bg-gradient-to-br from-green-500 to-green-600'
                                                    : 'bg-gradient-to-br from-red-500 to-red-600'
                                                    }`}>
                                                    {item.user?.full_name?.charAt(0) || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate">{item.user?.full_name || 'N/A'}</p>
                                                    <p className="text-xs text-gray-500">{item.user?.nim || item.user?.email} • {item.user?.department}</p>
                                                </div>
                                            </div>

                                            {/* Equipment */}
                                            <div className="flex items-center gap-2 min-w-0 lg:w-48">
                                                <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 truncate text-sm">{item.equipment?.name || 'N/A'}</p>
                                                    <p className="text-xs text-gray-500 font-mono">{item.equipment?.serial_number}</p>
                                                </div>
                                            </div>

                                            {/* Days Late */}
                                            <div className="flex items-center gap-2 lg:w-32">
                                                <Timer className="w-4 h-4 text-red-500" />
                                                <div>
                                                    <p className="font-bold text-red-600">{daysLate} hari</p>
                                                    <p className="text-xs text-gray-500">terlambat</p>
                                                </div>
                                            </div>

                                            {/* Penalty Amount */}
                                            <div className="lg:w-32 text-right lg:text-left">
                                                <p className="text-lg font-bold text-red-600">{formatCurrency(penaltyAmount)}</p>
                                                <p className="text-xs text-gray-500">denda</p>
                                            </div>

                                            {/* Status & Actions */}
                                            <div className="flex items-center gap-2">
                                                {isPaid ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Dibayar
                                                    </span>
                                                ) : isReturned ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Dikembalikan
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        Menunggu
                                                    </span>
                                                )}

                                                <ModernButton
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewDetail(item)}
                                                    className="text-gray-500 hover:text-pink-600"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </ModernButton>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ModernCard>

                {/* Detail Dialog */}
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-w-lg rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                Detail Kasus Denda
                            </DialogTitle>
                        </DialogHeader>

                        {selectedCase && (() => {
                            const daysLate = getDaysLate(selectedCase.expected_return_date)
                            const penaltyAmount = calculatePenalty(daysLate)

                            return (
                                <div className="space-y-4 mt-4">
                                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-red-600">{formatCurrency(penaltyAmount)}</p>
                                            <p className="text-sm text-red-700 mt-1">Total Denda ({daysLate} hari × {formatCurrency(PENALTY_RATE_PER_DAY)})</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Peminjam</label>
                                            <p className="font-medium text-gray-900 mt-1">{selectedCase.user?.full_name}</p>
                                            <p className="text-sm text-gray-500">{selectedCase.user?.email}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Peralatan</label>
                                            <p className="font-medium text-gray-900 mt-1">{selectedCase.equipment?.name}</p>
                                            <p className="text-sm text-gray-500 font-mono">{selectedCase.equipment?.serial_number}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Batas Kembali</label>
                                            <p className="font-medium text-red-600 mt-1">{formatDate(selectedCase.expected_return_date)}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                                            <div className="mt-1">
                                                {selectedCase.penalty_paid ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                        <CheckCircle className="w-3 h-3" /> Dibayar
                                                    </span>
                                                ) : selectedCase.status === 'returned' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                                        <CheckCircle className="w-3 h-3" /> Dikembalikan
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                                        <Clock className="w-3 h-3" /> Menunggu
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {!selectedCase.penalty_paid && (
                                        <DialogFooter className="mt-6 flex gap-2">
                                            <ModernButton
                                                variant="outline"
                                                onClick={() => setIsDetailOpen(false)}
                                                className="flex-1"
                                            >
                                                Tutup
                                            </ModernButton>
                                            <ModernButton
                                                variant="default"
                                                onClick={() => markPaidMutation.mutate(selectedCase.id)}
                                                loading={markPaidMutation.isPending}
                                                className="flex-1"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Tandai Dibayar
                                            </ModernButton>
                                        </DialogFooter>
                                    )}
                                </div>
                            )
                        })()}
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    )
}
