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
import { TablePagination } from '@/components/ui/pagination'

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
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalItems, setTotalItems] = useState(0)
    const [selectedCase, setSelectedCase] = useState<OverdueTransaction | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    const queryClient = useQueryClient()

    const today = new Date().toISOString().split('T')[0]

    // Fetch stats (all items)
    const { data: statsData } = useQuery({
        queryKey: ['penalties-stats'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('borrowing_transactions')
                .select('id, expected_return_date, status, penalty_paid')
                .or(`status.eq.active,status.eq.returned`)
                .lt('expected_return_date', today)

            if (error) throw error
            return data as any[]
        }
    })

    // Fetch paginated items
    const { data: overdueItems, isLoading } = useQuery({
        queryKey: ['penalties', filter, searchQuery, page, pageSize],
        queryFn: async () => {
            let query = supabase
                .from('borrowing_transactions')
                .select(`
                    *,
                    user:users!borrowing_transactions_user_id_fkey(full_name, email, department, nim),
                    equipment:equipment!borrowing_transactions_equipment_id_fkey(name, serial_number)
                `, { count: 'exact' })
                .or(`status.eq.active,status.eq.returned`)
                .lt('expected_return_date', today)
                .order('expected_return_date', { ascending: true })

            // Apply search
            if (searchQuery) {
                query = query.or(`user.full_name.ilike.%${searchQuery}%,user.nim.ilike.%${searchQuery}%,equipment.name.ilike.%${searchQuery}%`)
            }

            // Apply filters
            if (filter === 'pending') {
                query = query.eq('status', 'active').is('penalty_paid', false) // or false/null logic handled by default? paid defaults to false mostly.
                // Note: penalty_paid might be null. .not('penalty_paid', 'is', true) is safer but let's assume boolean. 
                // Actually supabase boolean filters can be tricky.
                // Let's rely on status active for now, but pending payment means status active AND not paid.
                query = query.eq('status', 'active').neq('penalty_paid', true)
            } else if (filter === 'paid') {
                query = query.eq('penalty_paid', true)
            } else if (filter === 'resolved') {
                query = query.eq('status', 'returned')
            }

            const from = (page - 1) * pageSize
            const to = from + pageSize - 1
            query = query.range(from, to)

            const { data, error, count } = await query
            if (error) throw error
            if (count !== null) setTotalItems(count)

            return (data || []) as unknown as OverdueTransaction[]
        }
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

    // Calculate stats from separate query
    const stats = {
        total: statsData?.length || 0,
        pending: statsData?.filter(t => t.status === 'active' && !t.penalty_paid).length || 0,
        resolved: statsData?.filter(t => t.status === 'returned' || t.penalty_paid).length || 0,
        totalFines: statsData?.reduce((sum, t) => {
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

                {/* Content Table */}
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
                                        <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Jatuh Tempo</span>
                                    </th>
                                    <th className="py-4 px-6 text-center w-[100px]">
                                        <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Terlambat</span>
                                    </th>
                                    <th className="py-4 px-6 text-center w-[150px]">
                                        <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Denda</span>
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
                                        <td colSpan={7} className="py-20 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin h-8 w-8 border-4 border-[#ff007a] border-t-transparent rounded-full" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : (overdueItems || []).length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>Tidak Ada Denda</h3>
                                                <p className="text-gray-400 text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                    {filter === 'all'
                                                        ? 'Hebat! Tidak ada satupun keterlambatan atau denda yang tercatat saat ini.'
                                                        : 'Tidak ada data item yang sesuai dengan filter ini.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    (overdueItems || []).map((item) => {
                                        const daysLate = getDaysLate(item.expected_return_date)
                                        const penaltyAmount = calculatePenalty(daysLate)

                                        // Status logic
                                        let statusLabel = 'Belum Lunas'
                                        let statusDotColor = '#FFEE35' // Yellow/Default
                                        if (item.penalty_paid) {
                                            statusLabel = 'Lunas'
                                            statusDotColor = '#3AFB57' // Green
                                        } else if (item.status === 'returned') {
                                            // Could be resolved but unpaid, or specific logic needed
                                            // Assuming returned means resolved for now in some contexts, but let's stick to paid status primary
                                        }

                                        return (
                                            <tr
                                                key={item.id}
                                                className="group hover:bg-pink-50/10 transition-colors"
                                            >
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff007a] to-[#ff4d9e] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                                                            {item.user?.full_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                                {item.user?.full_name}
                                                            </span>
                                                            <span className="text-[12px] text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                                {item.user?.nim}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                            {item.equipment?.name}
                                                        </span>
                                                        <span className="text-[12px] text-gray-400 font-mono" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                            {item.equipment?.serial_number}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                        {formatDate(item.expected_return_date)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="text-[14px] font-bold text-red-500" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                        {daysLate} Hari
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="text-[14px] font-bold text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                        {formatCurrency(penaltyAmount)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div
                                                            className="w-[12px] h-[12px] rounded-full shadow-sm"
                                                            style={{ backgroundColor: statusDotColor }}
                                                        />
                                                        <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                            {statusLabel}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleViewDetail(item)}
                                                            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                                                            title="Detail"
                                                        >
                                                            <AlertTriangle className="w-4 h-4" />
                                                        </button>
                                                        {!item.penalty_paid && (
                                                            <button
                                                                onClick={() => markPaidMutation.mutate(item.id)}
                                                                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                                                                title="Tandai Sudah Bayar"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

            {/* Pagination */ }
    <TablePagination
        currentPage={page}
        totalPages={Math.ceil(totalItems / pageSize)}
        onPageChange={setPage}
        totalItems={totalItems}
        itemsPerPage={pageSize}
        onPageSizeChange={setPageSize}
    />

    {/* Detail Dialog */ }
    <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg rounded-[24px] p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 bg-[#f8f9fc] border-b border-gray-100">
                <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Detail Denda
                </DialogTitle>
            </DialogHeader>

            {selectedCase && ((item) => {
                if (!item) return null
                const daysLate = getDaysLate(item.expected_return_date)
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
                                <div className="font-bold text-gray-900">{item.user?.full_name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{item.user?.email}</div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 block">Peralatan</label>
                                <div className="font-bold text-gray-900">{item.equipment?.name}</div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">{item.equipment?.serial_number}</div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 block">Jatuh Tempo</label>
                                <div className="font-bold text-red-600 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {formatDate(item.expected_return_date)}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 block">Status</label>
                                {item.penalty_paid ? (
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

                        {!item.penalty_paid && (
                            <div className="pt-2">
                                <ModernButton
                                    variant="default"
                                    onClick={() => markPaidMutation.mutate(item.id)}
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
            })(selectedCase)}
        </DialogContent>
    </Dialog>
        </div >
    )
}
