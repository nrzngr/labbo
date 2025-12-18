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

    const { data: transactions, isLoading } = useQuery({
        queryKey: ['monitoring-transactions', searchTerm, statusFilter],
        queryFn: async () => {
            let query = supabase
                .from('borrowing_transactions')
                .select(`
          *,
          equipment:equipment_id (name, serial_number),
          user:user_id (full_name, email, nim, department)
        `)
                .order('created_at', { ascending: false })

            if (searchTerm) {
                query = query.or(`user.nim.ilike.%${searchTerm}%,user.full_name.ilike.%${searchTerm}%`)
            }

            if (statusFilter) {
                query = query.eq('status', statusFilter as any)
            }

            const { data, error } = await query

            if (error) throw error
            return data as unknown as BorrowingTransaction[]
        }
    })

    const stats = useMemo(() => {
        if (!transactions) return { total: 0, active: 0, pending: 0, overdue: 0 }

        return {
            total: transactions.length,
            active: transactions.filter(t => t.status === 'active').length,
            pending: transactions.filter(t => t.status === 'pending').length,
            overdue: transactions.filter(t => t.status === 'overdue').length,
        }
    }, [transactions])

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

                {/* Content */}
                <div className="p-6 min-h-[400px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin h-12 w-12 border-4 border-[#ff007a] border-t-transparent rounded-full mb-4"></div>
                            <p className="text-gray-500 font-medium animate-pulse">Memuat data real-time...</p>
                        </div>
                    ) : transactions && transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <Search className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak ada data ditemukan</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                Tidak ada transaksi yang cocok dengan filter pencarian Anda saat ini.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2 mb-2">
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Daftar Transaksi</span>
                                <span className="text-sm font-medium text-gray-500">{transactions?.length} Item</span>
                            </div>

                            <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {transactions?.map((transaction) => (
                                    <MonitoringItemCard key={transaction.id} transaction={transaction} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
