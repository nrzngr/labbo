'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
import { supabase } from '@/lib/supabase'
import { MonitoringItemCard } from '@/components/monitoring/monitoring-item-card'
import { Input } from '@/components/ui/input'
import {
    Search,
    Package,
    Clock,
    AlertCircle,
    TrendingUp,
    XCircle,

    Filter
} from 'lucide-react'
import { TablePagination } from '@/components/ui/pagination'

interface BorrowingTransaction {
    id: string
    borrow_date: string
    expected_return_date: string
    actual_return_date: string | null
    status: string
    purpose: string | null
    notes: string | null
    equipment: {
        name: string
        serial_number: string
    }
    user: {
        full_name: string
        email: string
        nim: string | null
        department: string
    }
}

export default function MonitoringPage() {
    const { user } = useCustomAuth()
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalItems, setTotalItems] = useState(0)

    // Fetch stats (all items lightweight)
    const { data: statsData } = useQuery({
        queryKey: ['monitoring-stats'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('borrowing_transactions')
                .select('id, status')

            if (error) throw error
            return data as { id: string, status: string }[]
        }
    })

    const { data: transactions, isLoading } = useQuery({
        queryKey: ['monitoring-transactions', searchTerm, statusFilter, page, pageSize],
        queryFn: async () => {
            let query = supabase
                .from('borrowing_transactions')
                .select(`
          *,
          equipment:equipment_id (name, serial_number),
          user:user_id (full_name, email, nim, department)
        `, { count: 'exact' })
                .order('created_at', { ascending: false })

            if (searchTerm) {
                query = query.or(`user.nim.ilike.%${searchTerm}%,user.full_name.ilike.%${searchTerm}%`)
            }

            if (statusFilter) {
                query = query.eq('status', statusFilter as any)
            }

            const from = (page - 1) * pageSize
            const to = from + pageSize - 1
            query = query.range(from, to)

            const { data, error, count } = await query

            if (error) throw error
            if (count !== null) setTotalItems(count)

            return data as unknown as BorrowingTransaction[]
        }
    })

    const stats = useMemo(() => {
        if (!statsData) return { total: 0, active: 0, pending: 0, overdue: 0 }

        return {
            total: statsData.length,
            active: statsData.filter(t => t.status === 'active').length,
            pending: statsData.filter(t => t.status === 'pending').length,
            overdue: statsData.filter(t => t.status === 'overdue').length,
        }
    }, [statsData])

    if (!user || !['dosen', 'admin', 'lab_staff'].includes(user.role)) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
                    <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div>
                <h1 className="text-3xl sm:text-4xl font-black text-[#1a1f36] tracking-tight mb-2">
                    Monitoring Mahasiswa.
                </h1>
                <p className="text-gray-500 font-medium text-lg">
                    Pantau aktivitas peminjaman dan pengembalian peralatan secara real-time.
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: 'Total Transaksi', value: stats.total, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Sedang Dipinjam', value: stats.active, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Menunggu Approval', value: stats.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { label: 'Terlambat', value: stats.overdue, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black text-gray-900 mb-1">{stat.value}</h3>
                            <p className="text-gray-500 font-medium">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#ff007a] transition-colors" />
                            <Input
                                placeholder="Cari NIM atau Nama Mahasiswa..."
                                className="pl-12 h-12 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-[#ff007a] transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-12 pr-10 h-12 w-full sm:w-[200px] appearance-none bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium focus:bg-white focus:border-[#ff007a] outline-none transition-all cursor-pointer"
                            >
                                <option value="">Semua Status</option>
                                <option value="pending">Menunggu</option>
                                <option value="active">Aktif</option>
                                <option value="returned">Dikembalikan</option>
                                <option value="overdue">Terlambat</option>
                            </select>
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
                                        <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Tgl Pinjam</span>
                                    </th>
                                    <th className="py-4 px-6 text-center w-[150px]">
                                        <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Status</span>
                                    </th>
                                    <th className="py-4 px-6 text-left w-[200px]">
                                        <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Keterangan</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin h-8 w-8 border-4 border-[#ff007a] border-t-transparent rounded-full" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : transactions && transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                    <Search className="w-8 h-8 text-gray-300" />
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>Tidak ada data</h3>
                                                <p className="text-gray-400 text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                    Tidak ada transaksi yang cocok.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions?.map((transaction) => {
                                        // Helper for date formatting
                                        const formatDate = (date: string) => {
                                            return new Date(date).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })
                                        }

                                        // Status logic
                                        let statusLabel = 'Dipinjam'
                                        let statusDotColor = '#FFEE35' // Yellow
                                        if (transaction.status === 'returned') {
                                            statusLabel = 'Dikembalikan'
                                            statusDotColor = '#3AFB57' // Green
                                        } else if (transaction.status === 'overdue') {
                                            statusLabel = 'Terlambat'
                                            statusDotColor = '#FF6666' // Red
                                        } else if (transaction.status === 'pending') {
                                            statusLabel = 'Menunggu'
                                            statusDotColor = '#FFA500' // Orange
                                        }

                                        return (
                                            <tr
                                                key={transaction.id}
                                                className="group hover:bg-pink-50/10 transition-colors"
                                            >
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff007a] to-[#ff4d9e] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                                                            {transaction.user?.full_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                                {transaction.user?.full_name}
                                                            </span>
                                                            <span className="text-[12px] text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                                {transaction.user?.nim}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                            {transaction.equipment?.name}
                                                        </span>
                                                        <span className="text-[12px] text-gray-400 font-mono" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                            {transaction.equipment?.serial_number}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                        {formatDate(transaction.borrow_date)}
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
                                                <td className="py-4 px-6 text-left">
                                                    <span className="text-[14px] text-gray-500 line-clamp-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                                        {transaction.purpose || transaction.notes || '-'}
                                                    </span>
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


            {/* Pagination */}
            <TablePagination
                currentPage={page}
                totalPages={Math.ceil(totalItems / pageSize)}
                onPageChange={setPage}
                totalItems={totalItems}
                itemsPerPage={pageSize}
                onPageSizeChange={setPageSize}
            />
        </div>
    )
}
