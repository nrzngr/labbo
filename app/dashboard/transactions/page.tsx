'use client'

import { useState, useEffect } from 'react'
import { TransactionList } from '@/components/transactions/transaction-list'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ModernCard, ModernCardHeader } from '@/components/ui/modern-card'
import { Activity, ArrowUpRight, ArrowDownLeft, Clock, AlertTriangle, Download, Plus } from 'lucide-react'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernBadge } from '@/components/ui/modern-badge'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function TransactionsPage() {
  const [stats, setStats] = useState({
    active: 0,
    returned: 0,
    overdue: 0,
    today: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransactionStats()
  }, [])

  const fetchTransactionStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { count: activeCount } = await supabase
        .from('borrowing_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      const firstDayOfMonth = new Date()
      firstDayOfMonth.setDate(1)
      const { count: returnedCount } = await supabase
        .from('borrowing_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'returned')
        .gte('actual_return_date', firstDayOfMonth.toISOString())

      const { count: overdueCount } = await supabase
        .from('borrowing_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lt('expected_return_date', today)

      const { count: todayCount } = await supabase
        .from('borrowing_transactions')
        .select('*', { count: 'exact', head: true })
        .gte('borrow_date', today)
        .lte('borrow_date', today + 'T23:59:59.999Z')

      setStats({
        active: activeCount || 0,
        returned: returnedCount || 0,
        overdue: overdueCount || 0,
        today: todayCount || 0
      })
    } catch (error) {
      console.error('Error fetching transaction stats:', error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 page-gradient min-h-screen">
        {/* Enhanced Page Header */}
        <ModernCard variant="elevated" padding="lg" className="mb-6 sm:mb-8 fade-in">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-blue-600 rounded-xl">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 mb-1 sm:mb-2">
                  Manajemen Transaksi
                </h1>
                <p className="text-sm sm:text-base text-gray-600 font-medium">
                  Lacak aktivitas peminjaman dan pengembalian peralatan
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <ModernButton
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-4 h-4" />}
                className="w-full sm:w-auto button-hover-lift"
              >
                Ekspor Laporan
              </ModernButton>
              <ModernButton
                variant="default"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                className="w-full sm:w-auto button-hover-lift"
              >
                Transaksi Baru
              </ModernButton>
            </div>
          </div>
        </ModernCard>

        {/* Transaction Overview Stats */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Active</span>
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-xl">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">
              {loading ? '...' : stats.active}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Sedang dipinjam</div>
          </ModernCard>

          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Returned</span>
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-xl">
                <ArrowDownLeft className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">
              {loading ? '...' : stats.returned}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Bulan ini</div>
          </ModernCard>

          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Overdue</span>
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-xl">
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">
              {loading ? '...' : stats.overdue}
            </div>
            <div className="text-xs sm:text-sm text-red-600 font-medium">Memerlukan perhatian</div>
          </ModernCard>

          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Today</span>
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-xl">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">
              {loading ? '...' : stats.today}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Transaksi baru</div>
          </ModernCard>
        </div>

        {/* Overdue Transactions Alert */}
        <ModernCard variant="default" className="mb-6 sm:mb-8 border-l-4 border-l-red-600 slide-up p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base sm:text-lg text-red-800 mb-2">Peringatan Item Terlambat</h3>
              <p className="text-red-700 font-medium mb-3 sm:mb-4 text-sm sm:text-base">
                Anda memiliki {loading ? '...' : stats.overdue} item terlambat{stats.overdue !== 1 ? '' : ''} yang perlu dikembalikan. Silakan hubungi peminjam.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <ModernButton
                  variant="outline"
                  size="sm"
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white w-full sm:w-auto"
                >
                  View Overdue
                </ModernButton>
                <ModernButton
                  variant="default"
                  size="sm"
                  className="bg-red-600 text-white hover:bg-red-700 w-full sm:w-auto"
                >
                  Send Reminders
                </ModernButton>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Transaction Type Filters */}
        <div className="mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold mb-2">Filter Cepat</h2>
            <p className="text-sm text-gray-600">Filter transaksi berdasarkan jenis dan status</p>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
            <ModernCard variant="outline" hover className="quick-action-card group cursor-pointer p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-blue-100 group-hover:bg-blue-200 rounded-xl transition-colors">
                    <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-lg">Semua</h3>
                    <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                      {loading ? 'Memuat...' : `${stats.active + stats.returned} transaksi`}
                    </p>
                    <p className="text-xs text-gray-600 sm:hidden">
                      {loading ? '...' : stats.active + stats.returned}
                    </p>
                  </div>
                </div>
                <ModernBadge variant="default" size="sm">Aktif</ModernBadge>
              </div>
            </ModernCard>

            <ModernCard variant="outline" hover className="quick-action-card group cursor-pointer p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-green-100 group-hover:bg-green-200 rounded-xl transition-colors">
                    <ArrowDownLeft className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-lg">Pengembalian</h3>
                    <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                      {loading ? 'Memuat...' : `${stats.returned} selesai`}
                    </p>
                    <p className="text-xs text-gray-600 sm:hidden">
                      {loading ? '...' : stats.returned}
                    </p>
                  </div>
                </div>
                <ModernBadge variant="success" size="sm">Lihat</ModernBadge>
              </div>
            </ModernCard>

            <ModernCard variant="outline" hover className="quick-action-card group cursor-pointer p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-blue-100 group-hover:bg-blue-200 rounded-xl transition-colors">
                    <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-lg">Peminjaman</h3>
                    <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                      {loading ? 'Memuat...' : `${stats.active} aktif`}
                    </p>
                    <p className="text-xs text-gray-600 sm:hidden">
                      {loading ? '...' : stats.active}
                    </p>
                  </div>
                </div>
                <ModernBadge variant="default" size="sm">Lihat</ModernBadge>
              </div>
            </ModernCard>

            <ModernCard variant="outline" hover className="quick-action-card group cursor-pointer p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-red-100 group-hover:bg-red-200 rounded-xl transition-colors">
                    <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-lg">Terlambat</h3>
                    <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                      {loading ? 'Memuat...' : `${stats.overdue} item`}
                    </p>
                    <p className="text-xs text-gray-600 sm:hidden">
                      {loading ? '...' : stats.overdue}
                    </p>
                  </div>
                </div>
                <ModernBadge variant="destructive" size="sm">Penting</ModernBadge>
              </div>
            </ModernCard>
          </div>
        </div>

        {/* Main Transaction List */}
        <div className="slide-up">
          <TransactionList />
        </div>
      </div>
    </DashboardLayout>
  )
}