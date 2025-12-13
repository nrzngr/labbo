'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
import { supabase } from '@/lib/supabase'
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card'
import { ModernBadge } from '@/components/ui/modern-badge'
import { Input } from '@/components/ui/input'
import {
    Search,
    Users,
    Calendar,
    Package,
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    TrendingUp,
    Building2,
    ArrowRight
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

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

    // Calculate statistics
    const stats = useMemo(() => {
        if (!transactions) return { total: 0, active: 0, pending: 0, overdue: 0 }

        return {
            total: transactions.length,
            active: transactions.filter(t => t.status === 'active').length,
            pending: transactions.filter(t => t.status === 'pending').length,
            overdue: transactions.filter(t => t.status === 'overdue').length,
        }
    }, [transactions])

    const getStatusBadge = (status: string) => {
        const config: Record<string, { variant: "default" | "success" | "warning" | "destructive", icon: any, label: string }> = {
            pending: { variant: 'warning', icon: Clock, label: 'Menunggu' },
            active: { variant: 'default', icon: TrendingUp, label: 'Aktif' },
            returned: { variant: 'success', icon: CheckCircle, label: 'Dikembalikan' },
            overdue: { variant: 'destructive', icon: AlertCircle, label: 'Terlambat' },
            rejected: { variant: 'destructive', icon: XCircle, label: 'Ditolak' },
        }

        const { variant, icon: Icon, label } = config[status] || config.active

        return (
            <ModernBadge variant={variant} size="sm" className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                {label}
            </ModernBadge>
        )
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const getDaysRemaining = (expectedDate: string) => {
        const today = new Date()
        const returnDate = new Date(expectedDate)
        const diffTime = returnDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    // Only allow dosen, admin, lab_staff
    if (!user || !['dosen', 'admin', 'lab_staff'].includes(user.role)) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
                        <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Monitoring Mahasiswa</h1>
                    <p className="text-gray-600 mt-1">Pantau status peminjaman peralatan secara real-time</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ModernCard variant="default" padding="md" className="border-l-4 border-l-blue-500">
                        <ModernCardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Transaksi</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-2xl">
                                    <Package className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </ModernCardContent>
                    </ModernCard>

                    <ModernCard variant="default" padding="md" className="border-l-4 border-l-purple-500">
                        <ModernCardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Sedang Dipinjam</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.active}</p>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-2xl">
                                    <TrendingUp className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </ModernCardContent>
                    </ModernCard>

                    <ModernCard variant="default" padding="md" className="border-l-4 border-l-yellow-500">
                        <ModernCardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Menunggu Approval</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pending}</p>
                                </div>
                                <div className="p-3 bg-yellow-50 rounded-2xl">
                                    <Clock className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                        </ModernCardContent>
                    </ModernCard>

                    <ModernCard variant="default" padding="md" className="border-l-4 border-l-red-500">
                        <ModernCardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Terlambat</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.overdue}</p>
                                </div>
                                <div className="p-3 bg-red-50 rounded-2xl">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </ModernCardContent>
                    </ModernCard>
                </div>

                {/* Filters and Transactions */}
                <ModernCard variant="default" padding="lg">
                    <ModernCardContent>
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari NIM atau Nama Mahasiswa..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-5 py-3 border border-[#dfe2ec] bg-[#eef0f8] rounded-[16px] text-[15px] font-medium text-[#1f2937] shadow-sm outline-none transition focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.16)] min-w-[160px]"
                            >
                                <option value="">Semua Status</option>
                                <option value="pending">Menunggu</option>
                                <option value="active">Aktif</option>
                                <option value="returned">Dikembalikan</option>
                                <option value="overdue">Terlambat</option>
                            </select>
                        </div>

                        {/* Transactions List */}
                        {isLoading ? (
                            <div className="text-center py-16">
                                <div className="animate-spin mx-auto h-10 w-10 border-4 border-[#ff007a] border-t-transparent rounded-full mb-4"></div>
                                <p className="text-gray-500 font-medium">Memuat data...</p>
                            </div>
                        ) : transactions && transactions.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                                    <Users className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada data</h3>
                                <p className="text-gray-600">
                                    {searchTerm || statusFilter
                                        ? 'Coba ubah filter pencarian Anda'
                                        : 'Belum ada transaksi peminjaman'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {transactions?.map((transaction) => {
                                    const daysRemaining = getDaysRemaining(transaction.expected_return_date)
                                    const isUrgent = daysRemaining <= 2 && daysRemaining >= 0 && transaction.status === 'active'

                                    return (
                                        <div
                                            key={transaction.id}
                                            className={`group relative border-2 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg ${isUrgent
                                                ? 'border-orange-200 bg-orange-50/30'
                                                : 'border-gray-100 hover:border-[#ff007a]/20'
                                                }`}
                                        >
                                            {/* Status Indicator Line */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${transaction.status === 'active' ? 'bg-purple-500' :
                                                transaction.status === 'pending' ? 'bg-yellow-500' :
                                                    transaction.status === 'returned' ? 'bg-green-500' :
                                                        transaction.status === 'overdue' ? 'bg-red-500' :
                                                            'bg-gray-500'
                                                }`} />

                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                {/* Main Content */}
                                                <div className="flex-1 space-y-3">
                                                    {/* Equipment Name & Status */}
                                                    <div className="flex items-start gap-3 flex-wrap">
                                                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#ff007a] transition-colors">
                                                            {transaction.equipment.name}
                                                        </h3>
                                                        {getStatusBadge(transaction.status)}
                                                        {isUrgent && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold">
                                                                <AlertCircle className="w-3 h-3" />
                                                                Segera Kembali
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Student Info */}
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#ff88c4] to-[#ff007a] text-white text-xs font-bold">
                                                            {transaction.user.full_name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold">{transaction.user.full_name}</span>
                                                            {transaction.user.nim && (
                                                                <span className="ml-2 text-sm text-gray-500">• {transaction.user.nim}</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Details Grid */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <Building2 className="w-4 h-4 text-gray-400" />
                                                            <span>{transaction.user.department}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <Package className="w-4 h-4 text-gray-400" />
                                                            <span className="font-mono text-xs">{transaction.equipment.serial_number}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                            <span className="text-xs">
                                                                {formatDate(transaction.borrow_date)}
                                                                <ArrowRight className="w-3 h-3 inline mx-1" />
                                                                {formatDate(transaction.expected_return_date)}
                                                            </span>
                                                        </div>
                                                        {transaction.purpose && (
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="w-4 h-4 text-gray-400" />
                                                                <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-lg font-medium">
                                                                    {transaction.purpose.replace('[', '').replace(']', '')}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Timeline Indicator (Right Side) */}
                                                {transaction.status === 'active' && (
                                                    <div className="lg:w-32 text-center lg:border-l-2 lg:border-gray-100 lg:pl-6">
                                                        <div className={`text-3xl font-bold ${daysRemaining < 0 ? 'text-red-600' :
                                                            daysRemaining <= 2 ? 'text-orange-600' :
                                                                'text-gray-900'
                                                            }`}>
                                                            {Math.abs(daysRemaining)}
                                                        </div>
                                                        <div className="text-xs font-medium text-gray-500 mt-1">
                                                            {daysRemaining < 0 ? 'Hari Terlambat' : 'Hari Tersisa'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </ModernCardContent>
                </ModernCard>
            </div>
        </DashboardLayout>
    )
}
