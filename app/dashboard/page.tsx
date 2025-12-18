"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCustomAuth } from "@/components/auth/custom-auth-provider"
import {
  Package,
  Users,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  ArrowUpRight,
  Clock
} from "lucide-react"
import { supabase } from '@/lib/supabase'
import { DashboardCharts } from '@/components/analytics/dashboard-charts'
import { DashboardSkeleton } from '@/components/ui/loading-skeleton'
import { ModernButton } from '@/components/ui/modern-button'
import { StatCard } from '@/components/dashboard/stat-card'
import { cn } from '@/lib/utils'

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
    if (user?.role === 'mahasiswa') {
      router.replace('/dashboard/student')
    }
  }, [user, router])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!user || user.role === 'mahasiswa') return

        const { data: equipmentData } = await supabase.from('equipment').select('status')
        const equipmentStats = equipmentData?.reduce((acc, item: any) => {
          acc[item.status] = (acc[item.status] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        const { data: transactionData } = await supabase
          .from('borrowing_transactions')
          .select('status, expected_return_date')

        const activeBorrowings = transactionData?.filter((t: any) => t.status === 'active').length || 0
        const overdueBorrowings = transactionData?.filter((t: any) =>
          t.status === 'active' && new Date(t.expected_return_date) < new Date()
        ).length || 0

        const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true })
        const { count: categoriesCount } = await supabase.from('categories').select('*', { count: 'exact', head: true })

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

        const { data: activityData } = await supabase
          .from('borrowing_transactions')
          .select(`
            id, status, created_at, actual_return_date,
            user:users!borrowing_transactions_user_id_fkey(full_name),
            equipment:equipment!borrowing_transactions_equipment_id_fkey(name)
          `)
          .order('created_at', { ascending: false })
          .limit(6)

        const formattedActivity: RecentActivity[] = (activityData || []).map((activity: any) => ({
          id: activity.id,
          type: activity.actual_return_date ? 'return' : 'borrow',
          user_name: activity.user?.full_name || 'Tidak Diketahui',
          equipment_name: activity.equipment?.name || 'Peralatan Tidak Diketahui',
          date: activity.created_at,
          status: activity.status
        }))

        setRecentActivity(formattedActivity)
      } catch (error) {
        console.error("Dashboard data fetch error:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user && user.role !== 'student') {
      fetchDashboardData()
    }
  }, [user])

  if (!user || user.role === 'mahasiswa') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    )
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 content-fade-in">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Live Overview</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 py-1">
            Dashboard Admin.
          </h1>
          <p className="text-lg text-gray-500 mt-2 max-w-xl leading-relaxed">
            Pantau seluruh ekosistem laboratorium, inventaris, dan aktivitas peminjaman secara realtime.
          </p>
        </div>

        <div className="flex gap-3">
          <ModernButton onClick={() => router.push('/dashboard/equipment')} variant="outline" className="bg-white/80 border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300 hover:text-gray-900 hover:shadow-md transition-all">
            <Package className="w-4 h-4 mr-2" />
            Inventaris
          </ModernButton>
          <ModernButton onClick={() => router.push('/dashboard/transactions')}>
            <Activity className="w-4 h-4 mr-2" />
            Transaksi
          </ModernButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Aset"
          value={stats?.totalEquipment || 0}
          subtitle="Barang tersedia"
          icon={Package}
          delay={100}
        />
        <StatCard
          title="Peminjaman Aktif"
          value={stats?.activeBorrowings || 0}
          subtitle={stats?.overdueBorrowings ? `${stats.overdueBorrowings} Terlambat` : "Tepat waktu"}
          icon={Activity}
          delay={200}
        />
        <StatCard
          title="Total Pengguna"
          value={stats?.totalUsers || 0}
          subtitle="Mahasiswa & Staff"
          icon={Users}
          delay={300}
        />
        <StatCard
          title="Kategori"
          value={stats?.totalCategories || 0}
          subtitle="Jenis peralatan"
          icon={BarChart3}
          delay={400}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: '500ms' }}>
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-black text-gray-900 mb-1">Analitik & Statistik</h3>
              <p className="text-gray-500 text-sm font-medium">Pantau performa dan aktivitas laboratorium</p>
            </div>
            <DashboardCharts />
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-5 px-1">Akses Cepat</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { title: 'Scan QR', desc: 'Scan peralatan', icon: Clock, href: '/dashboard/scan', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { title: 'Users', desc: 'Kelola akses', icon: Users, href: '/dashboard/users', color: 'text-pink-600', bg: 'bg-pink-50' },
                { title: 'Laporan', desc: 'Unduh data', icon: BarChart3, href: '/dashboard/reports', color: 'text-teal-600', bg: 'bg-teal-50' },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => router.push(item.href)}
                  className="group glass-panel p-4 rounded-2xl hover:bg-white text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-white/80"
                >
                  <div className={cn("w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-colors group-hover:bg-gray-900 group-hover:text-white", item.bg, item.color)}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                  <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-1 animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: '600ms' }}>
          <div className="sticky top-6">
            <div className="glass-panel p-6 rounded-[32px] border-white/60">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-gray-900">Aktivitas Terbaru</h3>
                <button
                  onClick={() => router.push('/dashboard/transactions')}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
                  aria-label="Lihat semua transaksi"
                >
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {recentActivity.length > 0 ? recentActivity.map((activity) => (
                  <div key={activity.id} className="group flex items-start gap-4 p-3 rounded-2xl hover:bg-white hover:shadow-md transition-all duration-300 cursor-default border border-transparent hover:border-gray-50">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110",
                      activity.type === 'borrow' ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                      {activity.type === 'borrow' ? <Package className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-gray-900 text-sm truncate pr-2">{activity.user_name}</p>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                          {new Date(activity.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{activity.equipment_name}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                          activity.type === 'borrow' ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        )}>
                          {activity.type === 'borrow' ? 'Dipinjam' : 'Dikembalikan'}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-12 text-center text-gray-400">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">Belum ada aktivitas</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <ModernButton variant="outline" fullWidth onClick={() => router.push('/dashboard/transactions')}>
                  Lihat Semua Log
                </ModernButton>
              </div>
            </div>

            {stats && stats.overdueBorrowings > 0 && (
              <div className="mt-6 p-6 rounded-3xl bg-red-50 border border-red-100 shadow-sm">
                <div className="flex items-center gap-3 text-red-700 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-bold text-sm uppercase tracking-wide">Perhatian</span>
                </div>
                <p className="text-red-900 font-bold text-lg leading-tight mb-4">
                  {stats.overdueBorrowings} Peminjaman belum dikembalikan melewati batas waktu.
                </p>
                <button
                  onClick={() => router.push('/dashboard/transactions')}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                >
                  Tindak Lanjuti
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
