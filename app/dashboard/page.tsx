'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Package, Users, Activity, TrendingUp, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react"
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardCharts } from '@/components/analytics/dashboard-charts'

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
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch equipment stats
        const { data: equipmentData } = await supabase
          .from('equipment')
          .select('status')

        const equipmentStats = equipmentData?.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        // Fetch transaction stats
        const { data: transactionData } = await supabase
          .from('borrowing_transactions')
          .select('status, expected_return_date, actual_return_date, user_id, equipment_id, borrow_date')

        const activeBorrowings = transactionData?.filter(t => t.status === 'active').length || 0
        const overdueBorrowings = transactionData?.filter(t =>
          t.status === 'active' &&
          new Date(t.expected_return_date) < new Date()
        ).length || 0

        // Fetch users count
        const { count: usersCount } = await supabase
          .from('user_profiles')
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
            user:user_profiles(full_name),
            equipment:equipment(name)
          `)
          .order('created_at', { ascending: false })
          .limit(10)

        const formattedActivity: RecentActivity[] = activityData?.map(activity => ({
          id: activity.id,
          type: activity.actual_return_date ? 'return' : 'borrow',
          user_name: activity.user?.full_name || 'Unknown',
          equipment_name: activity.equipment?.name || 'Unknown Equipment',
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
          <div className="text-center">Please log in to continue...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="border border-black p-12 text-center">
            <div className="text-lg">Memuat data dashboard...</div>
          </div>
        </div>
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
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: 'default',
      returned: 'secondary',
      overdue: 'destructive'
    }

    const statusLabels: Record<string, string> = {
      active: 'Aktif',
      returned: 'Dikembalikan',
      overdue: 'Terlambat'
    }

    return <Badge variant={variants[status] || 'outline'}>{statusLabels[status] || status}</Badge>
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black">DASHBOARD</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8 sm:mb-12">
          <div className="border border-black p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-medium">PERALATAN</span>
              <Package className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black mb-2">{stats?.totalEquipment || 0}</div>
            <div className="text-xs sm:text-sm text-gray-600">
              {stats?.availableEquipment || 0} tersedia / {stats?.borrowedEquipment || 0} dipinjam
            </div>
          </div>

          <div className="border border-black p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-medium">PEMINJAMAN</span>
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black mb-2">{stats?.activeBorrowings || 0}</div>
            <div className="text-xs sm:text-sm text-gray-600">
              {stats?.overdueBorrowings ? (
                <span className="text-black font-medium">{stats.overdueBorrowings} terlambat</span>
              ) : (
                <span>Semua tepat waktu</span>
              )}
            </div>
          </div>

          <div className="border border-black p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-medium">PENGGUNA</span>
              <Users className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black mb-2">{stats?.totalUsers || 0}</div>
            <div className="text-xs sm:text-sm text-gray-600">Pengguna terdaftar</div>
          </div>

          <div className="border border-black p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-medium">KATEGORI</span>
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black mb-2">{stats?.totalCategories || 0}</div>
            <div className="text-xs sm:text-sm text-gray-600">Kategori peralatan</div>
          </div>
        </div>

        {/* Alert for overdue items */}
        {stats && stats.overdueBorrowings > 0 && (
          <div className="border border-black p-4 sm:p-6 mb-6 sm:mb-12">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
              <span className="font-bold text-sm sm:text-base">OVERDUE ITEMS</span>
            </div>
            <p className="text-xs sm:text-sm">
              You have {stats.overdueBorrowings} overdue item{stats.overdueBorrowings > 1 ? 's' : ''}.
              Please check the transactions page for details.
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8 sm:mb-12">
          <div
            className="border border-black p-4 sm:p-6 cursor-pointer hover:bg-black hover:text-white transition-none"
            onClick={() => router.push('/dashboard/equipment')}
          >
            <Package className="w-5 h-5 sm:w-6 sm:h-6 mb-3 sm:mb-4" />
            <h3 className="font-bold text-sm sm:text-base mb-2">Equipment</h3>
            <p className="text-xs sm:text-sm text-gray-600">Manage laboratory equipment</p>
          </div>

          <div
            className="border border-black p-4 sm:p-6 cursor-pointer hover:bg-black hover:text-white transition-none"
            onClick={() => router.push('/dashboard/transactions')}
          >
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 mb-3 sm:mb-4" />
            <h3 className="font-bold text-sm sm:text-base mb-2">Transactions</h3>
            <p className="text-xs sm:text-sm text-gray-600">Borrowing and returns</p>
          </div>

          <div
            className="border border-black p-4 sm:p-6 cursor-pointer hover:bg-black hover:text-white transition-none"
            onClick={() => router.push('/dashboard/users')}
          >
            <Users className="w-5 h-5 sm:w-6 sm:h-6 mb-3 sm:mb-4" />
            <h3 className="font-bold text-sm sm:text-base mb-2">Users</h3>
            <p className="text-xs sm:text-sm text-gray-600">Manage users and permissions</p>
          </div>
        </div>

        {/* Analytics */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">ANALYTICS</h2>
          <div className="border border-black p-4 sm:p-6">
            <DashboardCharts />
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">RECENT ACTIVITY</h2>
          {recentActivity.length > 0 ? (
            <div className="border border-black">
              {/* Desktop table view */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-black">
                    <tr>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-left p-4 font-medium">User</th>
                      <th className="text-left p-4 font-medium">Equipment</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((activity) => (
                      <tr key={activity.id} className="border-t border-black hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {getActivityIcon(activity.type)}
                            <span className="capitalize">{activity.type}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="max-w-[120px] truncate" title={activity.user_name}>
                            {activity.user_name}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="max-w-[150px] truncate" title={activity.equipment_name}>
                            {activity.equipment_name}
                          </div>
                        </td>
                        <td className="p-4 text-sm">
                          {formatDate(activity.date)}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(activity.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tablet view */}
              <div className="hidden sm:block lg:hidden">
                <div className="divide-y divide-black">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getActivityIcon(activity.type)}
                          <span className="capitalize font-medium">{activity.type}</span>
                        </div>
                        {getStatusBadge(activity.status)}
                      </div>
                      <div className="text-sm space-y-1">
                        <div><span className="font-medium">User:</span> {activity.user_name}</div>
                        <div><span className="font-medium">Equipment:</span> {activity.equipment_name}</div>
                        <div><span className="font-medium">Date:</span> {formatDate(activity.date)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile view */}
              <div className="sm:hidden divide-y divide-black">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getActivityIcon(activity.type)}
                        <span className="capitalize text-sm font-medium">{activity.type}</span>
                      </div>
                      <div className="scale-75 origin-right">
                        {getStatusBadge(activity.status)}
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm space-y-1">
                      <div><span className="font-medium">User:</span> <span className="truncate block">{activity.user_name}</span></div>
                      <div><span className="font-medium">Equipment:</span> <span className="truncate block">{activity.equipment_name}</span></div>
                      <div><span className="font-medium">Date:</span> {formatDate(activity.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border border-black p-8 sm:p-12 text-center">
              <Activity className="mx-auto w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4" />
              <p className="font-medium text-sm sm:text-base mb-2">No recent activity</p>
              <p className="text-xs sm:text-sm text-gray-600">Activity will appear here once users start borrowing equipment</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}