'use client'

import { useState, useEffect } from 'react'
import { MaintenanceList } from '@/components/maintenance/maintenance-list'
import { MaintenanceScheduler } from '@/components/maintenance/maintenance-scheduler'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ModernCard, ModernCardHeader } from '@/components/ui/modern-card'
import { Wrench, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernBadge } from '@/components/ui/modern-badge'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function MaintenancePage() {
  const [stats, setStats] = useState({
    scheduled: 0,
    inProgress: 0,
    overdue: 0,
    completed: 0
  })
  const [loading, setLoading] = useState(true)

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

      const { count: scheduledCount } = await supabase
        .from('maintenance_records')
        .select('*', { count: 'exact', head: true })
        .gte('maintenance_date', today)
        .lte('maintenance_date', sevenDaysFromNow.toISOString())

      const { count: inProgressCount } = await supabase
        .from('maintenance_records')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress')

      const { count: overdueCount } = await supabase
        .from('maintenance_records')
        .select('*', { count: 'exact', head: true })
        .lt('maintenance_date', today)
        .neq('status', 'completed')

      const { count: completedCount } = await supabase
        .from('maintenance_records')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('maintenance_date', firstDayOfMonth.toISOString())

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
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 page-gradient min-h-screen">
        {/* Enhanced Page Header */}
        <ModernCard variant="elevated" padding="lg" className="mb-6 sm:mb-8 fade-in">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-orange-600 rounded-xl">
                <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 mb-1 sm:mb-2">
                  Maintenance Management
                </h1>
                <p className="text-sm sm:text-base text-gray-600 font-medium">
                  Schedule and track equipment maintenance activities
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <ModernButton
                variant="outline"
                size="sm"
                leftIcon={<Calendar className="w-4 h-4" />}
                className="w-full sm:w-auto button-hover-lift"
              >
                Schedule Maintenance
              </ModernButton>
              <ModernButton
                variant="default"
                size="sm"
                leftIcon={<Wrench className="w-4 h-4" />}
                className="w-full sm:w-auto button-hover-lift"
              >
                New Maintenance Record
              </ModernButton>
            </div>
          </div>
        </ModernCard>

        {/* Maintenance Overview Stats */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Scheduled</span>
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-xl">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">
              {loading ? '...' : stats.scheduled}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Upcoming</div>
          </ModernCard>

          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">In Progress</span>
              <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-xl">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">
              {loading ? '...' : stats.inProgress}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Active now</div>
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
            <div className="text-xs sm:text-sm text-red-600 font-medium">Requires attention</div>
          </ModernCard>

          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Completed</span>
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-xl">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">
              {loading ? '...' : stats.completed}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">This month</div>
          </ModernCard>
        </div>

        {/* Upcoming Maintenance Alert */}
        <ModernCard variant="default" className="mb-6 sm:mb-8 border-l-4 border-l-orange-600 slide-up p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="p-2 bg-orange-100 rounded-xl">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base sm:text-lg text-orange-800 mb-2">Upcoming Maintenance Due</h3>
              <p className="text-orange-700 font-medium mb-3 sm:mb-4 text-sm sm:text-base">
                {loading ? 'Loading...' : `${stats.scheduled} equipment item${stats.scheduled !== 1 ? 's' : ''} require maintenance within the next 7 days.`}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <ModernButton
                  variant="outline"
                  size="sm"
                  className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white w-full sm:w-auto"
                >
                  View Schedule
                </ModernButton>
                <ModernButton
                  variant="default"
                  size="sm"
                  className="bg-orange-600 text-white hover:bg-orange-700 w-full sm:w-auto"
                >
                  Schedule Now
                </ModernButton>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold mb-2">Quick Actions</h2>
            <p className="text-sm text-gray-600">Common maintenance tasks and reports</p>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
            <ModernCard variant="outline" hover className="text-center quick-action-card group p-3 sm:p-4">
              <div className="p-2 sm:p-3 bg-blue-100 group-hover:bg-blue-200 rounded-xl mx-auto mb-2 sm:mb-3 transition-colors w-fit">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto" />
              </div>
              <h3 className="font-bold text-sm sm:text-lg mb-1 sm:mb-2">Schedule</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Plan routine maintenance</p>
              <p className="text-xs text-gray-600 sm:hidden">Schedule</p>
            </ModernCard>

            <ModernCard variant="outline" hover className="text-center quick-action-card group p-3 sm:p-4">
              <div className="p-2 sm:p-3 bg-green-100 group-hover:bg-green-200 rounded-xl mx-auto mb-2 sm:mb-3 transition-colors w-fit">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mx-auto" />
              </div>
              <h3 className="font-bold text-sm sm:text-lg mb-1 sm:mb-2">Complete</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Mark as completed</p>
              <p className="text-xs text-gray-600 sm:hidden">Complete</p>
            </ModernCard>

            <ModernCard variant="outline" hover className="text-center quick-action-card group p-3 sm:p-4">
              <div className="p-2 sm:p-3 bg-purple-100 group-hover:bg-purple-200 rounded-xl mx-auto mb-2 sm:mb-3 transition-colors w-fit">
                <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mx-auto" />
              </div>
              <h3 className="font-bold text-sm sm:text-lg mb-1 sm:mb-2">Emergency</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Report urgent issues</p>
              <p className="text-xs text-gray-600 sm:hidden">Emergency</p>
            </ModernCard>

            <ModernCard variant="outline" hover className="text-center quick-action-card group p-3 sm:p-4">
              <div className="p-2 sm:p-3 bg-gray-100 group-hover:bg-gray-200 rounded-xl mx-auto mb-2 sm:mb-3 transition-colors w-fit">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mx-auto" />
              </div>
              <h3 className="font-bold text-sm sm:text-lg mb-1 sm:mb-2">History</h3>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">View past records</p>
              <p className="text-xs text-gray-600 sm:hidden">History</p>
            </ModernCard>
          </div>
        </div>

        {/* Main Maintenance Content */}
        <div className="slide-up">
          <MaintenanceScheduler />
        </div>
      </div>
    </DashboardLayout>
  )
}