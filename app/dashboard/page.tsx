'use client'

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (user?.role === 'student') {
          // Redirect students to their specific dashboard
          router.push('/dashboard/student')
          return null
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

        // Fetch recent activity with user and equipment details
        const { data: activityData } = await supabase
          .from('borrowing_transactions')
          .select(`
            *,
            user:users(full_name),
            equipment:equipment(name)
          `)
          .order('created_at', { ascending: false })
          .limit(10)

        const formattedActivity: RecentActivity[] = activityData?.map((activity: any) => ({
          id: activity.id,
          type: activity.actual_return_date ? 'return' : 'borrow',
          user_name: activity.user?.full_name || 'Tidak Diketahui',
          equipment_name: activity.equipment?.name || 'Peralatan Tidak Diketahui',
          date: activity.created_at,
          status: activity.status as 'active' | 'returned' | 'overdue'
        })) || []

        setRecentActivity(formattedActivity)
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Silakan masuk untuk melanjutkan...</div>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 page-gradient min-h-screen">
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
        <div className="grid gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8 lg:mb-16">
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
        <div className="mb-8 lg:mb-16">
          <ModernCardHeader
            title="Aksi Cepat"
            description="Navigasi ke area manajemen kunci"
            className="mb-6 lg:mb-8"
          />
          <div className="grid gap-6 lg:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="mb-8 lg:mb-16">
          <ModernCardHeader
            title="Ringkasan Analitik"
            description="Gambaran penggunaan dan tren peralatan"
            className="mb-6 lg:mb-8"
          />
          <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:p-10 shadow-lg">
            <DashboardCharts />
          </div>
        </div>

        {/* Recent Activity - Consolidated responsive layout */}
        <div>
          <ModernCardHeader
            title="Aktivitas Terbaru"
            description="Aktivitas peminjaman dan pengembalian peralatan terbaru"
            className="mb-6 lg:mb-8"
          />
          {recentActivity.length > 0 ? (
            <ModernCard variant="default" padding="none">
              <div className="divide-y divide-black">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                    {/* Header row with type, date and status */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-3 lg:mb-4">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <div className="p-1.5 lg:p-2 bg-gray-100 rounded-lg">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div>
                          <span className="capitalize font-medium text-sm lg:text-base">{activity.type}</span>
                          <div className="text-xs lg:text-sm text-gray-500 lg:hidden">
                            {formatDate(activity.date)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-start gap-2 lg:gap-4">
                        <div className="hidden lg:block text-sm text-gray-500">
                          {formatDate(activity.date)}
                        </div>
                        {getStatusBadge(activity.status)}
                      </div>
                    </div>

                    {/* Content row with user and equipment info */}
                    <div className="space-y-2 lg:space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="text-xs lg:text-sm font-medium text-gray-600 w-16">Pengguna:</span>
                        <span className="text-sm lg:text-base truncate" title={activity.user_name}>
                          {activity.user_name}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="text-xs lg:text-sm font-medium text-gray-600 w-16">Peralatan:</span>
                        <span className="text-sm lg:text-base truncate" title={activity.equipment_name}>
                          {activity.equipment_name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ModernCard>
          ) : (
            <ModernCard variant="outline" className="text-center py-12 lg:py-16">
              <div className="p-4 lg:p-6 bg-gray-100 rounded-full w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-6">
                <Activity className="w-8 h-8 lg:w-10 lg:h-10 text-gray-400 mx-auto" />
              </div>
              <h3 className="font-bold text-lg lg:text-xl text-gray-700 mb-3">Tidak ada aktivitas terbaru</h3>
              <p className="text-sm lg:text-base text-gray-500">Aktivitas akan muncul di sini setelah pengguna mulai meminjam peralatan</p>
            </ModernCard>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}