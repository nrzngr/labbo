"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCustomAuth } from "@/components/auth/custom-auth-provider"
import { Badge } from "@/components/ui/badge"
import { Package, Users, Activity, TrendingUp, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react"
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardCharts } from '@/components/analytics/dashboard-charts'
import { DashboardSkeleton } from '@/components/ui/loading-skeleton'
import { ModernCard, ModernCardHeader, ModernCardContent } from '@/components/ui/modern-card'
import { ModernBadge } from '@/components/ui/modern-badge'
import { ModernButton } from '@/components/ui/modern-button'


interface DashboardStats {
  totalEquipment: number
  availableEquipment: number
  borrowedEquipment: number
  maintenanceEquipment: number
  activeBorrowings: number
  overdueBorrowings: number
  totalUsers: number
  totalCategories: number
}

interface RecentActivity {
  id: string
  type: 'borrow' | 'return'
  user_name: string
  equipment_name: string
  date: string
  status: 'active' | 'returned' | 'overdue'
}

export default function Dashboard() {
  const { user } = useCustomAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  // Redirect students immediately
  useEffect(() => {
    if (user?.role === 'student') {
      router.replace('/dashboard/student')
    }
  }, [user, router])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Skip fetching if user is student (will redirect)
        if (!user || user.role === 'student') {
          return
        }

        // Admin/Staff dashboard logic
        // Fetch equipment stats
        const { data: equipmentData } = await supabase
          .from('equipment')
          .select('status')

        const equipmentStats = equipmentData?.reduce((acc, item: any) => {
          acc[item.status] = (acc[item.status] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        // Fetch transaction stats
        const { data: transactionData } = await supabase
          .from('borrowing_transactions')
          .select('status, expected_return_date, actual_return_date, user_id, equipment_id, borrow_date')

        const activeBorrowings = transactionData?.filter((t: any) => t.status === 'active').length || 0
        const overdueBorrowings = transactionData?.filter((t: any) =>
          t.status === 'active' &&
          new Date(t.expected_return_date) < new Date()
        ).length || 0

        // Fetch users count
        const { count: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })

        // Fetch categories count
        const { count: categoriesCount } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true })

        setStats({
          totalEquipment: equipmentData?.length || 0,
          availableEquipment: equipmentStats.available || 0,
          borrowedEquipment: equipmentStats.borrowed || 0,
          maintenanceEquipment: equipmentStats.maintenance || 0,
          activeBorrowings,
          overdueBorrowings,
          totalUsers: usersCount || 0,
          totalCategories: categoriesCount || 0
        })

        // Fetch recent activity with user and equipment details using explicit FK
        const { data: activityData, error: activityError } = await supabase
          .from('borrowing_transactions')
          .select(`
            id,
            status,
            borrow_date,
            expected_return_date,
            actual_return_date,
            created_at,
            user:users!borrowing_transactions_user_id_fkey(full_name),
            equipment:equipment!borrowing_transactions_equipment_id_fkey(name)
          `)
          .order('created_at', { ascending: false })
          .limit(10)

        console.log('[DEBUG] Activity data:', activityData, 'error:', activityError)

        const formattedActivity: RecentActivity[] = (activityData || []).map((activity: any) => ({
          id: activity.id,
          type: activity.actual_return_date ? 'return' : 'borrow',
          user_name: activity.user?.full_name || 'Tidak Diketahui',
          equipment_name: activity.equipment?.name || 'Peralatan Tidak Diketahui',
          date: activity.created_at,
          status: activity.status as 'active' | 'returned' | 'overdue'
        }))

        setRecentActivity(formattedActivity)
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }

    if (user && user.role !== 'student') {
      fetchDashboardData()
    }
  }, [user])

  // Show loading for students while redirecting
  if (!user || user.role === 'student') {
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'borrow':
        return <Package className="h-4 w-4 text-blue-600" />
      case 'return':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "success" | "destructive" | "warning"> = {
      active: 'success',
      returned: 'default',
      overdue: 'warning'
    }

    const statusLabels: Record<string, string> = {
      active: 'Aktif',
      returned: 'Dikembalikan',
      overdue: 'Terlambat'
    }

    return <ModernBadge variant={variants[status] || 'default'} size="sm">{statusLabels[status] || status}</ModernBadge>
  }

  return (
    <DashboardLayout>
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8 lg:py-12 page-gradient min-h-screen">
        {/* Enhanced Header */}
        <div className="mb-8 lg:mb-12 fade-in">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-gray-900 mb-2">
                DASHBOARD ADMIN
              </h1>
              <p className="text-base sm:text-lg text-gray-600 font-medium">
                Ringkasan Manajemen Peralatan Laboratorium
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid - Enhanced spacing */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8 lg:mb-16">
          <ModernCard variant="elevated" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Equipment</span>
              <div className="p-1.5 sm:p-2 bg-black rounded-xl">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-1">
              {stats?.totalEquipment || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">
              <span className="text-green-600">{stats?.availableEquipment || 0}</span> tersedia •
              <span className="text-blue-600"> {stats?.borrowedEquipment || 0}</span> dipinjam
            </div>
          </ModernCard>

          <ModernCard variant="elevated" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Borrowings</span>
              <div className="p-1.5 sm:p-2 bg-blue-600 rounded-xl">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-1">
              {stats?.activeBorrowings || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">
              {stats?.overdueBorrowings ? (
                <span className="text-red-600 font-bold">{stats.overdueBorrowings} terlambat</span>
              ) : (
                <span className="text-green-600">Semua tepat waktu</span>
              )}
            </div>
          </ModernCard>

          <ModernCard variant="elevated" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Users</span>
              <div className="p-1.5 sm:p-2 bg-purple-600 rounded-xl">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-1">
              {stats?.totalUsers || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Pengguna terdaftar</div>
          </ModernCard>

          <ModernCard variant="elevated" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Categories</span>
              <div className="p-1.5 sm:p-2 bg-orange-600 rounded-xl">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-1">
              {stats?.totalCategories || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Kategori peralatan</div>
          </ModernCard>
        </div>

        {/* Alert for overdue items - Enhanced spacing */}
        {stats && stats.overdueBorrowings > 0 && (
          <ModernCard variant="default" className="mb-8 lg:mb-12 border-l-4 border-l-red-600 slide-up p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-6">
              <div className="p-3 lg:p-4 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 lg:w-8 lg:h-8 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg lg:text-xl text-red-800 mb-3">Peringatan Item Terlambat</h3>
                <p className="text-red-700 font-medium mb-4 lg:mb-6 text-base lg:text-lg">
                  Anda memiliki {stats.overdueBorrowings} item terlambat{stats.overdueBorrowings > 1 ? '' : ''}.
                  Silakan periksa halaman transaksi untuk detailnya.
                </p>
                <ModernButton
                  variant="destructive"
                  size="lg"
                  onClick={() => router.push('/dashboard/transactions')}
                  className="w-full lg:w-auto"
                >
                  Lihat Transaksi
                </ModernButton>
              </div>
            </div>
          </ModernCard>
        )}

        {/* Quick Actions - Enhanced layout */}
        <div className="mb-6 sm:mb-8 lg:mb-16">
          <ModernCardHeader
            title="Aksi Cepat"
            description="Navigasi ke area manajemen kunci"
            className="mb-4 sm:mb-6 lg:mb-8"
          />
          <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <ModernCard
              variant="default"
              hover
              className="quick-action-card group p-6 lg:p-8"
              onClick={() => router.push('/dashboard/equipment')}
            >
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <div className="p-3 lg:p-4 bg-black/10 group-hover:bg-black/20 rounded-xl transition-colors">
                  <Package className="w-5 h-5 lg:w-7 lg:h-7 text-black" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <h3 className="font-bold text-lg lg:text-xl mb-2 lg:mb-3">Peralatan</h3>
              <p className="text-sm lg:text-base text-gray-600 font-medium">Kelola inventori peralatan laboratorium</p>
            </ModernCard>

            <ModernCard
              variant="default"
              hover
              className="quick-action-card group p-6 lg:p-8"
              onClick={() => router.push('/dashboard/transactions')}
            >
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <div className="p-3 lg:p-4 bg-blue-100 group-hover:bg-blue-200 rounded-xl transition-colors">
                  <Activity className="w-5 h-5 lg:w-7 lg:h-7 text-blue-600" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <h3 className="font-bold text-lg lg:text-xl mb-2 lg:mb-3">Transaksi</h3>
              <p className="text-sm lg:text-base text-gray-600 font-medium">Lacak peminjaman dan pengembalian</p>
            </ModernCard>

            <ModernCard
              variant="default"
              hover
              className="quick-action-card group p-6 lg:p-8"
              onClick={() => router.push('/dashboard/users')}
            >
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <div className="p-3 lg:p-4 bg-purple-100 group-hover:bg-purple-200 rounded-xl transition-colors">
                  <Users className="w-5 h-5 lg:w-7 lg:h-7 text-purple-600" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <h3 className="font-bold text-lg lg:text-xl mb-2 lg:mb-3">Pengguna</h3>
              <p className="text-sm lg:text-base text-gray-600 font-medium">Kelola pengguna dan perizinan</p>
            </ModernCard>
          </div>
        </div>

        {/* Analytics - Enhanced spacing */}
        <div className="mb-6 sm:mb-8 lg:mb-16">
          <ModernCardHeader
            title="Ringkasan Analitik"
            description="Gambaran penggunaan dan tren peralatan"
            className="mb-4 sm:mb-6 lg:mb-8"
          />
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 md:p-8 lg:p-10 shadow-lg overflow-hidden">
            <div className="w-full overflow-x-auto">
              <DashboardCharts />
            </div>
          </div>
        </div>

        {/* Recent Activity - Enhanced Design */}
        <div>
          <ModernCardHeader
            title="Aktivitas Terbaru"
            description="Aktivitas peminjaman dan pengembalian peralatan terbaru"
            className="mb-6 lg:mb-8"
          />
          {recentActivity.length > 0 ? (
            <ModernCard variant="default" padding="none" className="overflow-hidden">
              <div className="divide-y divide-gray-100">
                {recentActivity.map((activity, index) => (
                  <div
                    key={activity.id}
                    className={`p-4 lg:p-5 transition-all hover:bg-gray-50 ${index === 0 ? 'bg-pink-50/30' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar/Icon */}
                      <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${activity.type === 'borrow'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                          : 'bg-gradient-to-br from-green-500 to-green-600'
                        }`}>
                        {activity.type === 'borrow' ? (
                          <Package className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                        ) : (
                          <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 truncate">
                            {activity.user_name}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${activity.type === 'borrow'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                            }`}>
                            {activity.type === 'borrow' ? 'Pinjam' : 'Kembali'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {activity.equipment_name}
                        </p>
                      </div>

                      {/* Date & Status */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-gray-500 mb-1">
                          {formatDate(activity.date)}
                        </div>
                        {getStatusBadge(activity.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Button */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <ModernButton
                  variant="ghost"
                  className="w-full text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                  onClick={() => router.push('/dashboard/transactions')}
                >
                  Lihat Semua Aktivitas →
                </ModernButton>
              </div>
            </ModernCard>
          ) : (
            <ModernCard variant="outline" className="text-center py-12 lg:py-16">
              <div className="p-4 lg:p-6 bg-gray-100 rounded-full w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-6">
                <Activity className="w-8 h-8 lg:w-10 lg:h-10 text-gray-400 mx-auto" />
              </div>
              <h3 className="font-bold text-lg lg:text-xl text-gray-700 mb-3">Tidak ada aktivitas terbaru</h3>
              <p className="text-sm lg:text-base text-gray-500 mb-6">Aktivitas akan muncul di sini setelah pengguna mulai meminjam peralatan</p>
              <ModernButton
                variant="default"
                onClick={() => router.push('/dashboard/borrowing-requests')}
              >
                Lihat Permintaan Peminjaman
              </ModernButton>
            </ModernCard>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
