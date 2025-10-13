'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCustomAuth } from "@/components/auth/custom-auth-provider"
import { Badge } from "@/components/ui/badge"
import { Package, Users, Activity, TrendingUp, AlertTriangle, CheckCircle, Calendar, Clock, BookOpen, User } from "lucide-react"
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardCharts } from '@/components/analytics/dashboard-charts'
import { DashboardSkeleton } from '@/components/ui/loading-skeleton'
import { ModernCard, ModernCardHeader, ModernCardContent } from '@/components/ui/modern-card'
import { ModernBadge } from '@/components/ui/modern-badge'
import { ModernButton } from '@/components/ui/modern-button'

interface StudentStats {
  totalBorrowed: number
  currentlyBorrowed: number
  overdueItems: number
  borrowingHistory: number
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
        // Fetch student's borrowing stats
        const { data: transactionData } = await supabase
          .from('borrowing_transactions')
          .select('*, equipment(name, categories(name))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (transactionData) {
          const currentlyBorrowed = transactionData.filter((t: any) => t.status === 'active').length
          const overdueItems = transactionData.filter((t: any) =>
            t.status === 'active' &&
            new Date(t.expected_return_date) < new Date()
          ).length
          const totalBorrowed = transactionData.length

          // Calculate favorite category
          const categoryCount: Record<string, number> = {}
          transactionData.forEach((t: any) => {
            const categoryName = (t.equipment as { categories?: { name?: string } })?.categories?.name || 'Uncategorized'
            categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1
          })

          const favoriteCategory = Object.entries(categoryCount)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'

          setStats({
            totalBorrowed,
            currentlyBorrowed,
            overdueItems,
            borrowingHistory: totalBorrowed,
            favoriteCategory
          })
        }

        // Fetch recent transactions (last 5)
        const recentData = transactionData?.slice(0, 5).map((t: any) => ({
          id: t.id,
          equipment_name: (t.equipment as { name?: string })?.name || 'Unknown Equipment',
          borrow_date: t.borrow_date,
          expected_return_date: t.expected_return_date,
          actual_return_date: t.actual_return_date,
          status: t.status
        })) || []

        setRecentTransactions(recentData)

        // Fetch available equipment for quick browse
        const { data: availableData } = await supabase
          .from('equipment')
          .select('id, name, categories(name), image_url')
          .eq('status', 'available')
          .limit(6)

        if (availableData) {
          const equipment = availableData.map((item: any) => ({
            id: item.id,
            name: item.name,
            category: (item.categories as { name?: string })?.name || 'Uncategorized',
            image_url: item.image_url
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
          <div className="text-center">Please log in to continue...</div>
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

  const getStatusBadge = (status: string, expectedReturnDate: string) => {
    const isOverdue = status === 'active' && new Date(expectedReturnDate) < new Date()

    if (isOverdue) {
      return <ModernBadge variant="destructive" size="sm">Overdue</ModernBadge>
    }

    const variants: Record<string, "default" | "success" | "warning" | "destructive"> = {
      active: 'success',
      returned: 'default'
    }

    const statusLabels: Record<string, string> = {
      active: 'Active',
      returned: 'Returned'
    }

    return <ModernBadge variant={variants[status] || 'default'} size="sm">{statusLabels[status] || status}</ModernBadge>
  }

  const getDaysLeft = (expectedReturnDate: string) => {
    const today = new Date()
    const dueDate = new Date(expectedReturnDate)
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `${diffDays} days left`
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 page-gradient min-h-screen">
        {/* Welcome Header */}
        <ModernCard variant="elevated" padding="lg" className="mb-6 sm:mb-8 fade-in">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-blue-600 rounded-xl">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 mb-1 sm:mb-2">
                Welcome back, {user?.full_name?.split(' ')[0]}!
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                {user?.nim && `Student ID: ${user.nim} • `}{user?.department} Department
              </p>
            </div>
          </div>
        </ModernCard>

        {/* Student Stats Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <ModernCard variant="elevated" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Currently Borrowed</span>
              <div className="p-1.5 sm:p-2 bg-blue-600 rounded-xl">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-1">
              {stats?.currentlyBorrowed || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Active items</div>
          </ModernCard>

          <ModernCard variant="elevated" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Borrowing History</span>
              <div className="p-1.5 sm:p-2 bg-purple-600 rounded-xl">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-1">
              {stats?.borrowingHistory || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Total borrowings</div>
          </ModernCard>

          <ModernCard variant="elevated" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Overdue Items</span>
              <div className="p-1.5 sm:p-2 bg-red-600 rounded-xl">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-1">
              {stats?.overdueItems || 0}
            </div>
            <div className="text-xs sm:text-sm text-red-600 font-medium">
              {stats?.overdueItems ? 'Return immediately' : 'All clear'}
            </div>
          </ModernCard>

          <ModernCard variant="elevated" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Favorite Category</span>
              <div className="p-1.5 sm:p-2 bg-green-600 rounded-xl">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-1 truncate">
              {stats?.favoriteCategory || 'None'}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Most borrowed</div>
          </ModernCard>
        </div>

        {/* Overdue Alert */}
        {stats && stats.overdueItems > 0 && (
          <ModernCard variant="default" className="mb-6 sm:mb-8 border-l-4 border-l-red-600 slide-up p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base sm:text-lg text-red-800 mb-2">Overdue Items Alert</h3>
                <p className="text-red-700 font-medium mb-3 sm:mb-4 text-sm sm:text-base">
                  You have {stats.overdueItems} overdue item{stats.overdueItems > 1 ? 's' : ''}. Please return them immediately to avoid penalties.
                </p>
                <ModernButton
                  variant="destructive"
                  size="sm"
                  onClick={() => router.push('/dashboard/my-borrowings')}
                  className="w-full sm:w-auto"
                >
                  View My Borrowings
                </ModernButton>
              </div>
            </div>
          </ModernCard>
        )}

        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8">
          <ModernCardHeader
            title="Quick Actions"
            description="Common tasks and resources"
            className="mb-4 sm:mb-6"
          />
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <ModernCard
              variant="default"
              hover
              className="quick-action-card group p-4 sm:p-6"
              onClick={() => router.push('/dashboard/equipment')}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-black/10 group-hover:bg-black/20 rounded-xl transition-colors">
                  <Package className="w-4 h-4 sm:w-6 sm:h-6 text-black" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">Browse Equipment</h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">View available equipment catalog</p>
            </ModernCard>

            <ModernCard
              variant="default"
              hover
              className="quick-action-card group p-4 sm:p-6"
              onClick={() => router.push('/dashboard/my-borrowings')}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-blue-100 group-hover:bg-blue-200 rounded-xl transition-colors">
                  <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">My Borrowings</h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Track your borrowed items</p>
            </ModernCard>

            <ModernCard
              variant="default"
              hover
              className="quick-action-card group p-4 sm:p-6"
              onClick={() => router.push('/dashboard/profile')}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-purple-100 group-hover:bg-purple-200 rounded-xl transition-colors">
                  <User className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">My Profile</h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Update your information</p>
            </ModernCard>
          </div>
        </div>

        <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2">
          {/* Recent Transactions */}
          <div>
            <ModernCardHeader
              title="Recent Activity"
              description="Your recent borrowing history"
              className="mb-4 sm:mb-6"
            />
            <ModernCard variant="default" padding="sm">
              {recentTransactions.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 pb-3 sm:pb-4 border-b border-black last:border-0">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm sm:text-base truncate">{transaction.equipment_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">Borrowed: {formatDate(transaction.borrow_date)}</span>
                          {transaction.status === 'active' && (
                            <span className="text-xs text-blue-600">
                              {getDaysLeft(transaction.expected_return_date)}
                            </span>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(transaction.status, transaction.expected_return_date)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <Package className="mx-auto w-8 h-8 sm:w-12 sm:h-12 mb-3 sm:mb-4 text-gray-400" />
                  <h3 className="font-bold text-sm sm:text-base text-gray-700 mb-2">No borrowing history</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Start borrowing equipment to see your activity here</p>
                </div>
              )}
            </ModernCard>
          </div>

          {/* Available Equipment */}
          <div>
            <ModernCardHeader
              title="Available Equipment"
              description="Recently added items you can borrow"
              className="mb-4 sm:mb-6"
            />
            <ModernCard variant="default" padding="sm">
              {availableEquipment.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {availableEquipment.map((equipment) => (
                    <div key={equipment.id} className="flex items-center justify-between pb-3 sm:pb-4 border-b border-black last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm sm:text-base truncate">{equipment.name}</h4>
                          <span className="text-xs text-gray-500">{equipment.category}</span>
                        </div>
                      </div>
                      <ModernButton
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/equipment?item=${equipment.id}`)}
                      >
                        View
                      </ModernButton>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <Package className="mx-auto w-8 h-8 sm:w-12 sm:h-12 mb-3 sm:mb-4 text-gray-400" />
                  <h3 className="font-bold text-sm sm:text-base text-gray-700 mb-2">No equipment available</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Check back later for available items</p>
                </div>
              )}
            </ModernCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}