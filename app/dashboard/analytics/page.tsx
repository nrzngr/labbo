'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardCharts } from '@/components/analytics/dashboard-charts'
import { RealtimeAnalytics } from '@/components/analytics/realtime-analytics'
import { ModernCard, ModernCardHeader } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernBadge } from '@/components/ui/modern-badge'
import { supabase } from '@/lib/supabase'
import { Activity, Download, TrendingUp, Users, Package, BarChart3, Clock, Calendar, ArrowUp, ArrowDown } from 'lucide-react'

interface TopBorrower {
  user_name: string
  borrow_count: number
  email: string
}

interface PopularEquipment {
  equipment_name: string
  borrow_count: number
  category: string
}

interface LiveStats {
  totalUsers: number
  totalEquipment: number
  activeTransactions: number
  availableEquipment: number
  totalBorrows: number
  avgDuration: number
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30days')
  const [topBorrowers, setTopBorrowers] = useState<TopBorrower[]>([])
  const [popularEquipment, setPopularEquipment] = useState<PopularEquipment[]>([])
  const [liveStats, setLiveStats] = useState<LiveStats>({
    totalUsers: 0,
    totalEquipment: 0,
    activeTransactions: 0,
    availableEquipment: 0,
    totalBorrows: 0,
    avgDuration: 0
  })

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)

      const daysAgo = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90
      const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      const { count: totalEquipment } = await supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true })

      const { count: activeTransactions } = await supabase
        .from('borrowing_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      const { count: availableEquipment } = await supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available')

      const { count: totalBorrows } = await supabase
        .from('borrowing_transactions')
        .select('*', { count: 'exact', head: true })
        .gte('borrow_date', startDate)

            const { data: completedTransactions } = await supabase
        .from('borrowing_transactions')
        .select('borrow_date, actual_return_date')
        .eq('status', 'returned')
        .gte('borrow_date', startDate)
        .limit(100)

      let avgDuration = 0
      if (completedTransactions && completedTransactions.length > 0) {
        const durations = completedTransactions
          .filter((t: any) => t.actual_return_date)
          .map((t: any) => {
            const start = new Date(t.borrow_date)
            const end = new Date(t.actual_return_date!)
            return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
          })
        avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0
      }

      setLiveStats({
        totalUsers: totalUsers || 0,
        totalEquipment: totalEquipment || 0,
        activeTransactions: activeTransactions || 0,
        availableEquipment: availableEquipment || 0,
        totalBorrows: totalBorrows || 0,
        avgDuration
      })

            const { data: transactionData } = await supabase
        .from('borrowing_transactions')
        .select(`
          user_id,
          users!inner(full_name, email, role)
        `)
        .gte('borrow_date', startDate)

      const borrowerCounts = transactionData?.reduce((acc: Record<string, TopBorrower>, transaction: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const userName = transaction.users?.full_name || 'Tidak Diketahui'
        const userEmail = transaction.users?.email || 'tidakdiketahui@example.com'

        if (!acc[userName]) {
          acc[userName] = { user_name: userName, borrow_count: 0, email: userEmail }
        }
        acc[userName].borrow_count++
        return acc
      }, {}) || {}

      const topBorrowersList = (Object.values(borrowerCounts) as TopBorrower[])
        .sort((a, b) => b.borrow_count - a.borrow_count)
        .slice(0, 10)

      setTopBorrowers(topBorrowersList)

            const { data: equipmentTransactionData } = await supabase
        .from('borrowing_transactions')
        .select(`
          equipment_id,
          equipment!inner(name, categories(name))
        `)
        .gte('borrow_date', startDate)

      const equipmentCounts = equipmentTransactionData?.reduce((acc: Record<string, PopularEquipment>, transaction: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const equipmentName = transaction.equipment?.name || 'Peralatan Tidak Diketahui'
        const categoryName = transaction.equipment?.categories?.name || 'Umum'

        if (!acc[equipmentName]) {
          acc[equipmentName] = { equipment_name: equipmentName, borrow_count: 0, category: categoryName }
        }
        acc[equipmentName].borrow_count++
        return acc
      }, {}) || {}

      const popularEquipmentList = (Object.values(equipmentCounts) as PopularEquipment[])
        .sort((a, b) => b.borrow_count - a.borrow_count)
        .slice(0, 10)

      setPopularEquipment(popularEquipmentList)

    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange, fetchAnalyticsData])

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Nama Pengguna,Email,Jumlah Pinjaman\n"
      + topBorrowers.map(e => `${e.user_name},${e.email},${e.borrow_count}`).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "peminjam_teratas.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="border border-black p-8 sm:p-12 text-center">
            <div className="text-base sm:text-lg">Memuat data analitik...</div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 page-gradient min-h-screen">
        <ModernCard variant="elevated" padding="lg" className="mb-6 sm:mb-8 fade-in">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-green-600 rounded-xl">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 mb-1 sm:mb-2">
                  ANALITIK
                </h1>
                <p className="text-sm sm:text-base text-gray-600 font-medium">
                  Wawasan penggunaan dan tren peralatan
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full sm:flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-black focus:ring-0 focus:border-black h-10 sm:h-12 text-sm bg-white hover:bg-gray-50 transition-colors"
              >
                <option value="7days">7 Hari Terakhir</option>
                <option value="30days">30 Hari Terakhir</option>
                <option value="90days">90 Hari Terakhir</option>
              </select>
              <ModernButton
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={exportData}
                className="w-full sm:w-auto button-hover-lift"
              >
                EKSPOR
              </ModernButton>
            </div>
          </div>
        </ModernCard>

        <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-8 sm:mb-12">
          <ModernCard variant="default" hover className="stats-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Total Pengguna</span>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2">
              {loading ? '...' : liveStats.totalUsers}
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Pengguna aktif
            </div>
          </ModernCard>

          <ModernCard variant="default" hover className="stats-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Equipment</span>
              <div className="p-2 sm:p-3 bg-green-100 rounded-xl">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2">
              {loading ? '...' : liveStats.totalEquipment}
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Total item
            </div>
          </ModernCard>

          <ModernCard variant="default" hover className="stats-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Peminjaman Aktif</span>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-xl">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2">
              {loading ? '...' : liveStats.activeTransactions}
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              Sedang dipinjam
            </div>
          </ModernCard>

          <ModernCard variant="default" hover className="stats-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Avg Duration</span>
              <div className="p-2 sm:p-3 bg-orange-100 rounded-xl">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2">
              {loading ? '...' : liveStats.avgDuration}
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Rata-rata hari
            </div>
          </ModernCard>
        </div>

        <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-3 mb-8 sm:mb-12">
          <ModernCard variant="outline" hover className="stats-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Available</span>
              <div className="p-2 bg-green-50 rounded-xl">
                <ArrowUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-green-600 mb-2">
              {loading ? '...' : liveStats.availableEquipment}
            </div>
            <div className="text-xs text-gray-600">Siap untuk dipinjam</div>
          </ModernCard>

          <ModernCard variant="outline" hover className="stats-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Total Borrows</span>
              <div className="p-2 bg-blue-50 rounded-xl">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-600 mb-2">
              {loading ? '...' : liveStats.totalBorrows}
            </div>
            <div className="text-xs text-gray-600">Periode ini</div>
          </ModernCard>

          <ModernCard variant="outline" hover className="stats-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Utilization</span>
              <div className="p-2 bg-purple-50 rounded-xl">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-600 mb-2">
              {loading ? '...' : liveStats.totalEquipment > 0
                ? Math.round((liveStats.activeTransactions / liveStats.totalEquipment) * 100)
                : 0}%
            </div>
            <div className="text-xs text-gray-600">Tingkat penggunaan saat ini</div>
          </ModernCard>
        </div>

        <div className="space-y-8 sm:space-y-12">
          {/* Real-time Analytics Section */}
          <RealtimeAnalytics />

          <ModernCard variant="default" className="overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-black bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">RINGKASAN VISUAL</h2>
                  <p className="text-sm text-gray-600">Grafik dan statistik umum sistem</p>
                </div>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <DashboardCharts />
            </div>
          </ModernCard>

          <div className="grid gap-8 sm:gap-12 grid-cols-1 lg:grid-cols-2">
            <ModernCard variant="default" padding="md">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">PEMINJAM TERAKTIF</h2>
                  <p className="text-sm text-gray-600">Pengguna paling aktif</p>
                </div>
              </div>
              <div className="space-y-4">
                {topBorrowers.slice(0, 5).map((borrower, index) => (
                  <ModernCard key={`${borrower.user_name}-${index}`} variant="outline" hover className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 bg-black text-white rounded-full flex-shrink-0">
                          <span className="text-sm font-bold">#{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{borrower.user_name}</p>
                          <p className="text-sm text-gray-600 truncate hidden md:block">{borrower.email}</p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xl font-black">{borrower.borrow_count}</p>
                        <ModernBadge variant="default" size="sm" className="hidden md:inline-block">peminjaman</ModernBadge>
                      </div>
                    </div>
                  </ModernCard>
                ))}
              </div>
            </ModernCard>

            <ModernCard variant="default" padding="md">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">PERALATAN POPULER</h2>
                  <p className="text-sm text-gray-600">Paling sering dipinjam</p>
                </div>
              </div>
              <div className="space-y-4">
                {popularEquipment.slice(0, 5).map((item, index) => (
                  <ModernCard key={`${item.equipment_name}-${index}`} variant="outline" hover className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 bg-black text-white rounded-full flex-shrink-0">
                          <span className="text-sm font-bold">#{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.equipment_name}</p>
                          <p className="text-sm text-gray-600 truncate hidden md:block">{item.category}</p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xl font-black">{item.borrow_count}</p>
                        <ModernBadge variant="default" size="sm" className="hidden md:inline-block">kali</ModernBadge>
                      </div>
                    </div>
                  </ModernCard>
                ))}
              </div>
            </ModernCard>
          </div>

          <ModernCard variant="default" padding="md">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold">INSIGHTS</h2>
                <p className="text-sm text-gray-600">Pola penggunaan dan statistik</p>
              </div>
            </div>
            <div className="text-center py-8 px-4">
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                <ModernCard variant="outline" className="text-center p-6">
                  <div className="p-3 bg-purple-100 rounded-xl w-12 h-12 mx-auto mb-4">
                    <Clock className="w-6 h-6 text-purple-600 mx-auto" />
                  </div>
                  <div className="text-sm font-medium mb-2 text-gray-600">PEAK TIME</div>
                  <div className="text-2xl font-black mb-2">14:00-16:00</div>
                  <ModernBadge variant="default" size="sm">Jam Sibuk</ModernBadge>
                </ModernCard>
                <ModernCard variant="outline" className="text-center p-6">
                  <div className="p-3 bg-blue-100 rounded-xl w-12 h-12 mx-auto mb-4">
                    <Calendar className="w-6 h-6 text-blue-600 mx-auto" />
                  </div>
                  <div className="text-sm font-medium mb-2 text-gray-600">BUSIEST DAY</div>
                  <div className="text-2xl font-black mb-2">SELASA</div>
                  <ModernBadge variant="default" size="sm">Puncak Aktivitas</ModernBadge>
                </ModernCard>
                <ModernCard variant="outline" className="text-center p-6">
                  <div className="p-3 bg-green-100 rounded-xl w-12 h-12 mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-green-600 mx-auto" />
                  </div>
                  <div className="text-sm font-medium mb-2 text-gray-600">AVG DURATION</div>
                  <div className="text-2xl font-black mb-2">{liveStats.avgDuration} HARI</div>
                  <ModernBadge variant="default" size="sm">Rata-rata</ModernBadge>
                </ModernCard>
              </div>
            </div>
          </ModernCard>
        </div>
      </div>
    </DashboardLayout>
  )
}