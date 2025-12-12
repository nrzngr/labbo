"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
import {
  Package,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BookOpen,
  User,
  ChevronRight,
  Sparkles,
  QrCode,
  CalendarDays,
  Bell,
  HourglassIcon
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardSkeleton } from '@/components/ui/loading-skeleton'


interface StudentStats {
  totalBorrowed: number
  currentlyBorrowed: number
  overdueItems: number
  pendingItems: number
  favoriteCategory: string
}

interface RecentTransaction {
  id: string
  equipment_name: string
  borrow_date: string
  expected_return_date: string
  actual_return_date: string | null
  status: string
}

interface AvailableEquipment {
  id: string
  name: string
  category: string
  image_url?: string
  condition?: string
}

type BorrowingTransactionRow = Database['public']['Tables']['borrowing_transactions']['Row']

type TransactionWithEquipment = BorrowingTransactionRow & {
  equipment?: {
    name?: string | null
    condition?: string | null
    categories?: {
      name?: string | null
    } | null
  } | null
}

export default function StudentDashboard() {
  const { user, isAuthenticated } = useCustomAuth()
  const router = useRouter()
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [availableEquipment, setAvailableEquipment] = useState<AvailableEquipment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user || !isAuthenticated) return

      try {
        const { data: transactionData } = await supabase
          .from('borrowing_transactions')
          .select('*, equipment(name, condition, categories(name))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        const transactions = (transactionData ?? []) as TransactionWithEquipment[]

        if (transactions.length) {
          const currentlyBorrowed = transactions.filter((t: any) => t.status === 'active').length
          const pendingItems = transactions.filter((t: any) => t.status === 'pending').length
          const overdueItems = transactions.filter(
            (t: any) => t.status === 'active' && new Date(t.expected_return_date) < new Date()
          ).length
          const totalBorrowed = transactions.length
          const categoryCount: Record<string, number> = {}
          transactions.forEach((t) => {
            const categoryName = t.equipment?.categories?.name || 'Uncategorized'
            categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1
          })

          const favoriteCategory = Object.entries(categoryCount)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Tidak ada'

          setStats({
            totalBorrowed,
            currentlyBorrowed,
            overdueItems,
            pendingItems,
            favoriteCategory
          })
        } else {
          setStats({
            totalBorrowed: 0,
            currentlyBorrowed: 0,
            overdueItems: 0,
            pendingItems: 0,
            favoriteCategory: 'Tidak ada'
          })
        }

        const recentData = transactions.slice(0, 5).map((t) => ({
          id: t.id,
          equipment_name: t.equipment?.name || 'Unknown Equipment',
          borrow_date: t.borrow_date,
          expected_return_date: t.expected_return_date,
          actual_return_date: t.actual_return_date,
          status: t.status === 'active' && new Date(t.expected_return_date) < new Date() ? 'overdue' : t.status
        })) || []

        setRecentTransactions(recentData)

        const { data: availableData } = await supabase
          .from('equipment')
          .select('id, name, condition, categories(name), image_url')
          .eq('status', 'available')
          .limit(4)

        if (availableData) {
          const equipment = availableData.map((item: any) => ({
            id: item.id,
            name: item.name,
            category: (item.categories as { name?: string })?.name || 'Tidak berkategori',
            image_url: item.image_url,
            condition: item.condition
          }))
          setAvailableEquipment(equipment)
        }

      } catch (error) {
        console.error('Error fetching student data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user && isAuthenticated) {
      fetchStudentData()
    }
  }, [user, isAuthenticated])

  if (!user || !isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#ff007a] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Memuat...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusConfig = (status: string) => {
    const config: Record<string, { label: string; color: string; bg: string }> = {
      pending: { label: 'Menunggu', color: 'text-amber-700', bg: 'bg-amber-100' },
      active: { label: 'Aktif', color: 'text-emerald-700', bg: 'bg-emerald-100' },
      returned: { label: 'Dikembalikan', color: 'text-gray-600', bg: 'bg-gray-100' },
      overdue: { label: 'Terlambat', color: 'text-red-700', bg: 'bg-red-100' }
    }
    return config[status] || config.active
  }

  const getDaysInfo = (expectedReturnDate: string, status: string) => {
    if (status === 'pending') return { text: 'Menunggu persetujuan', color: 'text-amber-600' }
    if (status === 'returned') return { text: '', color: '' }

    const today = new Date()
    const dueDate = new Date(expectedReturnDate)
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: `${Math.abs(diffDays)} hari terlambat`, color: 'text-red-600' }
    if (diffDays === 0) return { text: 'Hari ini', color: 'text-orange-600' }
    if (diffDays <= 3) return { text: `${diffDays} hari lagi`, color: 'text-amber-600' }
    return { text: `${diffDays} hari lagi`, color: 'text-emerald-600' }
  }

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      excellent: 'Sangat Baik',
      good: 'Baik',
      fair: 'Cukup',
      poor: 'Rusak'
    }
    return labels[condition] || condition
  }

  return (
    <DashboardLayout>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen bg-gradient-to-br from-[#f8f7fc] via-white to-[#fff5f9]">

        {/* Welcome Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#ff007a] to-[#ff4d9e] rounded-3xl p-6 sm:p-8 mb-8 shadow-xl shadow-[rgba(255,0,122,0.2)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">
                Selamat datang, {user?.full_name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-white/80 text-sm sm:text-base">
                {user?.nim && `NIM: ${user.nim} • `}{user?.department || 'Departemen'}
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => router.push('/dashboard/notifications')}
                className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
              >
                <Bell className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => router.push('/dashboard/qr-scanner')}
                className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
              >
                <QrCode className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Currently Borrowed */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.currentlyBorrowed || 0}</div>
            <div className="text-sm text-gray-500">Sedang Dipinjam</div>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <HourglassIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.pendingItems || 0}</div>
            <div className="text-sm text-amber-600">Menunggu Persetujuan</div>
          </div>

          {/* Overdue */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.overdueItems || 0}</div>
            <div className="text-sm text-red-500">{stats?.overdueItems ? 'Segera Kembalikan!' : 'Tidak Ada'}</div>
          </div>

          {/* Total History */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.totalBorrowed || 0}</div>
            <div className="text-sm text-gray-500">Total Riwayat</div>
          </div>
        </div>

        {/* Overdue Alert */}
        {stats && stats.overdueItems > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-5 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-red-800 mb-1">Peralatan Terlambat!</h3>
                <p className="text-red-700 mb-4">
                  Anda memiliki {stats.overdueItems} peralatan yang terlambat dikembalikan. Segera kembalikan untuk menghindari denda.
                </p>
                <button
                  onClick={() => router.push('/dashboard/my-borrowings')}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
                >
                  Lihat Peminjaman
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/dashboard/my-borrowings')}
              className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#ff007a] transition-all duration-300 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-[#ff007a]/10 group-hover:bg-[#ff007a]/20 flex items-center justify-center mb-4 transition-all">
                <Package className="w-6 h-6 text-[#ff007a]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Pinjam Peralatan</h3>
              <p className="text-sm text-gray-500">Ajukan peminjaman baru</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/equipment')}
              className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center mb-4 transition-all">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Katalog Peralatan</h3>
              <p className="text-sm text-gray-500">Lihat semua peralatan</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/reservations')}
              className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-400 transition-all duration-300 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center mb-4 transition-all">
                <CalendarDays className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Reservasi</h3>
              <p className="text-sm text-gray-500">Jadwalkan peminjaman</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/profile')}
              className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-400 transition-all duration-300 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center mb-4 transition-all">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Profil Saya</h3>
              <p className="text-sm text-gray-500">Kelola informasi akun</p>
            </button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Aktivitas Terbaru</h2>
              <button
                onClick={() => router.push('/dashboard/my-borrowings')}
                className="text-sm text-[#ff007a] font-semibold flex items-center gap-1 hover:underline"
              >
                Lihat Semua <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {recentTransactions.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {recentTransactions.map((transaction) => {
                    const statusConfig = getStatusConfig(transaction.status)
                    const daysInfo = getDaysInfo(transaction.expected_return_date, transaction.status)
                    return (
                      <div
                        key={transaction.id}
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => router.push('/dashboard/my-borrowings')}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{transaction.equipment_name}</h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <span>Dipinjam: {formatDate(transaction.borrow_date)}</span>
                              {daysInfo.text && (
                                <span className={`font-medium ${daysInfo.color}`}>{daysInfo.text}</span>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-700 mb-1">Belum ada aktivitas</h4>
                  <p className="text-sm text-gray-500">Mulai pinjam peralatan untuk melihat riwayat</p>
                </div>
              )}
            </div>
          </div>

          {/* Available Equipment */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Peralatan Tersedia</h2>
              <button
                onClick={() => router.push('/dashboard/equipment')}
                className="text-sm text-[#ff007a] font-semibold flex items-center gap-1 hover:underline"
              >
                Lihat Semua <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {availableEquipment.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {availableEquipment.map((equipment) => (
                    <div
                      key={equipment.id}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-4"
                      onClick={() => router.push(`/dashboard/equipment?item=${equipment.id}`)}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-[#ff007a]/10 to-[#ff007a]/5 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-[#ff007a]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{equipment.name}</h4>
                        <p className="text-xs text-gray-500">{equipment.category}</p>
                      </div>
                      {equipment.condition && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          {getConditionLabel(equipment.condition)}
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-700 mb-1">Tidak ada peralatan tersedia</h4>
                  <p className="text-sm text-gray-500">Coba periksa kembali nanti</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
