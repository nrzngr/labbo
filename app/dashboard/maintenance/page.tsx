"use client"

import { useState, useEffect } from 'react'
import { MaintenanceList } from '@/components/maintenance/maintenance-list'
import { MaintenanceScheduler } from '@/components/maintenance/maintenance-scheduler'
import { Wrench, Calendar, AlertTriangle, CheckCircle, Clock, Plus, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function MaintenancePage() {
  const [stats, setStats] = useState({
    scheduled: 0,
    inProgress: 0,
    overdue: 0,
    completed: 0
  })
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'scheduler' | 'history'>('scheduler')

  useEffect(() => {
    fetchMaintenanceStats()
  }, [])

  const fetchMaintenanceStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
      const firstDayOfMonth = new Date()
      firstDayOfMonth.setDate(1)

      // Use maintenance_schedules table (consistent with API)
      const { count: scheduledCount } = await supabase
        .from('maintenance_schedules')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_date', today)
        .lte('scheduled_date', sevenDaysFromNow.toISOString())

      const { count: inProgressCount } = await supabase
        .from('maintenance_schedules')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress')

      const { count: overdueCount } = await supabase
        .from('maintenance_schedules')
        .select('*', { count: 'exact', head: true })
        .lt('scheduled_date', today)
        .neq('status', 'completed')

      const { count: completedCount } = await supabase
        .from('maintenance_schedules')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('scheduled_date', firstDayOfMonth.toISOString())

      setStats({
        scheduled: scheduledCount || 0,
        inProgress: inProgressCount || 0,
        overdue: overdueCount || 0,
        completed: completedCount || 0
      })
    } catch (error) {
      console.error('Error fetching maintenance stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            Manajemen Pemeliharaan
          </h1>
          <p className="text-gray-500 font-medium">
            Jadwalkan dan pantau aktivitas pemeliharaan peralatan laboratorium
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* Scheduled */}
        <div className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-[#ff007a] flex-shrink-0 flex items-center justify-center shadow-lg shadow-[#ff007a]/30">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">TERJADWAL</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{loading ? '...' : stats.scheduled}</div>
          <div className="text-sm text-gray-500">Akan datang (7 hari)</div>
        </div>

        {/* In Progress */}
        <div className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-[#ff007a] flex-shrink-0 flex items-center justify-center shadow-lg shadow-[#ff007a]/30">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">PROSES</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{loading ? '...' : stats.inProgress}</div>
          <div className="text-sm text-gray-500">Sedang dikerjakan</div>
        </div>

        {/* Overdue */}
        <div className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-[#ff007a] flex-shrink-0 flex items-center justify-center shadow-lg shadow-[#ff007a]/30">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">TERLAMBAT</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{loading ? '...' : stats.overdue}</div>
          <div className="text-sm text-red-500">Butuh perhatian segera</div>
        </div>

        {/* Completed */}
        <div className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-[#ff007a] flex-shrink-0 flex items-center justify-center shadow-lg shadow-[#ff007a]/30">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">SELESAI</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{loading ? '...' : stats.completed}</div>
          <div className="text-sm text-gray-500">Bulan ini</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setView('scheduler')}
          className={`pb-3 px-1 text-sm font-bold transition-all relative ${view === 'scheduler'
            ? 'text-[#ff007a]'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Jadwal Pemeliharaan
          {view === 'scheduler' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#ff007a] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setView('history')}
          className={`pb-3 px-1 text-sm font-bold transition-all relative ${view === 'history'
            ? 'text-[#ff007a]'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Riwayat & Catatan
          {view === 'history' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#ff007a] rounded-t-full" />
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {view === 'scheduler' ? (
          <MaintenanceScheduler />
        ) : (
          <MaintenanceList />
        )}
      </div>
    </div>
  )
}
