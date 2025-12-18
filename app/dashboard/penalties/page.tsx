'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
    AlertTriangle, Clock, DollarSign, Package,
    CheckCircle, XCircle, Search, AlertCircle
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ModernButton } from '@/components/ui/modern-button'
import { PenaltyItemCard } from '@/components/monitoring/penalty-item-card'
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
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-[#f8f9fc] space-y-8 max-w-[1600px] mx-auto">
                {/* Header */}
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-[#1a1f36] tracking-tight mb-2">
                        Denda & Pelanggaran.
                    </h1>
                    <p className="text-gray-500 font-medium text-lg">
                        Kelola data keterlambatan dan status pembayaran denda.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                        { label: 'Total Kasus', value: stats.total, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
                        { label: 'Menunggu', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
                        { label: 'Diselesaikan', value: stats.resolved, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
                        { label: 'Total Estimasi', value: formatCurrency(stats.totalFines), icon: DollarSign, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200', isCurrency: true },
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 group">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </div>
                            <div>
                                <h3 className={`font-black text-gray-900 mb-1 ${stat.isCurrency ? 'text-2xl' : 'text-4xl'}`}>{stat.value}</h3>
                                <p className="text-gray-500 font-medium">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Card */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                            {/* Search */}
                            <div className="relative w-full xl:w-96 group">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#ff007a] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Cari user, alat, atau info denda..."
                                    className="w-full pl-12 h-12 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-[#ff007a] focus:ring-[#ff007a]/20 transition-all text-base outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'all', label: 'Semua Kasus' },
                                    { value: 'pending', label: 'Menunggu Pembayaran' },
                                    { value: 'paid', label: 'Lunas' },
                                    { value: 'resolved', label: 'Selesai' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFilter(opt.value as any)}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === opt.value
                                            ? 'bg-[#ff007a] text-white shadow-lg shadow-pink-500/30'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content List */}
                    <div className="p-6 min-h-[400px]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="animate-spin h-12 w-12 border-4 border-[#ff007a] border-t-transparent rounded-full mb-4"></div>
                                <p className="text-gray-500 font-medium animate-pulse">Memuat data denda...</p>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle className="w-10 h-10 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak Ada Denda</h3>
                                <p className="text-gray-500 max-w-sm mx-auto">
                                    {filter === 'all'
                                        ? 'Hebat! Tidak ada satupun keterlambatan atau denda yang tercatat saat ini.'
                                        : 'Tidak ada data item yang sesuai dengan filter ini.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {filteredItems.map(item => (
                                    <PenaltyItemCard
                                        key={item.id}
                                        item={item}
                                        onViewDetail={handleViewDetail}
                                        getDaysLate={getDaysLate}
                                        calculatePenalty={calculatePenalty}
                                        formatCurrency={formatCurrency}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Dialog */}
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-w-lg rounded-[24px] p-0 overflow-hidden border-none shadow-2xl">
                        <DialogHeader className="p-6 bg-[#f8f9fc] border-b border-gray-100">
                            <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                Detail Denda
                            </DialogTitle>
                        </DialogHeader>

                        {selectedCase && (() => {
                            const daysLate = getDaysLate(selectedCase.expected_return_date)
                            const penaltyAmount = calculatePenalty(daysLate)

                            return (
                                <div className="p-6 space-y-6">
                                    <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-center">
                                        <p className="text-4xl font-black text-red-600 tracking-tight">{formatCurrency(penaltyAmount)}</p>
                                        <div className="flex items-center justify-center gap-2 mt-2 text-sm font-medium text-red-700 bg-red-100/50 py-1 px-3 rounded-full mx-auto w-fit">
                                            <span>{daysLate} Hari Terlambat</span>
                                            <span>×</span>
                                            <span>{formatCurrency(PENALTY_RATE_PER_DAY)}/hari</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                                        <div>
                                            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 block">Peminjam</label>
                                            <div className="font-bold text-gray-900">{selectedCase.user?.full_name}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{selectedCase.user?.email}</div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 block">Peralatan</label>
                                            <div className="font-bold text-gray-900">{selectedCase.equipment?.name}</div>
                                            <div className="text-xs text-gray-500 font-mono mt-0.5">{selectedCase.equipment?.serial_number}</div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 block">Jatuh Tempo</label>
                                            <div className="font-bold text-red-600 flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                {formatDate(selectedCase.expected_return_date)}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 block">Status</label>
                                            {selectedCase.penalty_paid ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                    LUNAS
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                                    BELUM LUNAS
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {!selectedCase.penalty_paid && (
                                        <div className="pt-2">
                                            <ModernButton
                                                variant="default"
                                                onClick={() => markPaidMutation.mutate(selectedCase.id)}
                                                loading={markPaidMutation.isPending}
                                                className="w-full h-12 text-base rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-none shadow-lg shadow-green-500/30"
                                            >
                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                Konfirmasi Pembayaran
                                            </ModernButton>
                                        </div>
                                    )}
                                </div>
                            )
                        })()}
                    </DialogContent>
                </Dialog>
            </div>
            )
}
