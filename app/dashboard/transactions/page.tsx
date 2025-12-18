'use client'

import { useState, useEffect } from 'react'
import { TransactionList } from '@/components/transactions/transaction-list'
import { Activity, ArrowDownLeft, Clock, AlertTriangle, Download, Plus } from 'lucide-react'
import { ModernButton } from '@/components/ui/modern-button'
import { supabase } from '@/lib/supabase'

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1a1f36] tracking-tight mb-2">
            Manajemen Transaksi.
          </h1>
          <p className="text-gray-500 font-medium text-lg">
            Lacak aktivitas peminjaman dan pengembalian peralatan.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <ModernButton
            variant="outline"
            className="flex-1 sm:flex-none border-gray-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </ModernButton>
          <ModernButton
            variant="default"
            className="flex-1 sm:flex-none bg-[#ff007a] hover:bg-[#df006b] text-white border-none"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Transaksi Baru
          </ModernButton>
        </div>
      </div>

      {/* Highlight Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Sedang Dipinjam', value: stats.active, icon: Activity },
          { label: 'Dikembalikan (Bulan Ini)', value: stats.returned, icon: ArrowDownLeft },
          { label: 'Terlambat', value: stats.overdue, icon: AlertTriangle },
          { label: 'Transaksi Hari Ini', value: stats.today, icon: Clock },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-[#ff007a] flex-shrink-0 flex items-center justify-center shadow-lg shadow-[#ff007a]/30">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              {loading && <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin" />}
            </div>
            <div>
              <h3 className="text-3xl font-black text-gray-900 mb-1">{loading ? '-' : stat.value}</h3>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction List Component */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <TransactionList />
      </div>
    </div>
  )
}
