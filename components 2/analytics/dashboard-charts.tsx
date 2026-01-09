'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { TrendingUp, RefreshCw, Package, Users, Activity, BarChart3 } from 'lucide-react'

interface ChartData {
  [key: string]: string | number | undefined
  name: string
  value: number
  fill?: string
}

interface TransactionData {
  date: string
  borrowings: number
  returns: number
}

interface CategoryData {
  name: string
  count: number
}

interface UserActivityData {
  month: string
  active: number
  new: number
}

const COLORS = ['#10b981', '#FD1278', '#f59e0b', '#ef4444', '#8b5cf6', '#C20F5D']

export function DashboardCharts() {
  const [equipmentStatusData, setEquipmentStatusData] = useState<ChartData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [transactionData, setTransactionData] = useState<TransactionData[]>([])
  const [userActivityData, setUserActivityData] = useState<UserActivityData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('30days')

  useEffect(() => {
    fetchChartData()
  }, [timeRange])

  const fetchChartData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [equipmentResult, categoriesResult, transactionsResult, usersResult] = await Promise.allSettled([
        supabase.from('equipment').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('borrowing_transactions').select('*'),
        supabase.from('users').select('*')
      ])

      const equipmentData = equipmentResult.status === 'fulfilled' ? equipmentResult.value.data || [] : []
      const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value.data || [] : []
      const transactions = transactionsResult.status === 'fulfilled' ? transactionsResult.value.data || [] : []
      const users = usersResult.status === 'fulfilled' ? usersResult.value.data || [] : []

      // Equipment status
      const statusCounts = equipmentData.reduce((acc, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const statusChartData: ChartData[] = [
        { name: 'Tersedia', value: statusCounts.available || 0, fill: '#10b981' },
        { name: 'Dipinjam', value: statusCounts.borrowed || 0, fill: '#3b82f6' },
        { name: 'Perawatan', value: statusCounts.maintenance || 0, fill: '#f59e0b' },
        { name: 'Rusak', value: statusCounts.retired || 0, fill: '#ef4444' }
      ]
      setEquipmentStatusData(statusChartData)

      // Category data
      const availableEquipment = equipmentData.filter((item: any) => item.status === 'available')
      const categoryCounts = categories.map((category: any) => ({
        name: category.name,
        count: availableEquipment.filter((item: any) => item.category_id === category.id).length
      })).filter((cat: any) => cat.count > 0)
      setCategoryData(categoryCounts.slice(0, 6).sort((a, b) => b.count - a.count))

      // Transaction trends
      const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      const recentTransactions = transactions.filter((t: any) => new Date(t.created_at) >= cutoffDate)

      const processedTransactionData: TransactionData[] = []
      const today = new Date()

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        const borrowings = recentTransactions.filter((t: any) => t.created_at.startsWith(dateStr)).length
        const returns = recentTransactions.filter((t: any) => t.actual_return_date && t.actual_return_date.startsWith(dateStr)).length

        processedTransactionData.push({
          date: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          borrowings,
          returns
        })
      }
      setTransactionData(processedTransactionData)

      // User activity
      const monthlyData: UserActivityData[] = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStr = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })

        const newUsers = users.filter((u: any) => {
          const userDate = new Date(u.created_at)
          return userDate.getMonth() === date.getMonth() && userDate.getFullYear() === date.getFullYear()
        }).length

        const activeDate = new Date()
        activeDate.setMonth(activeDate.getMonth() - 1)
        const activeUsers = new Set(
          transactions.filter((t: any) => new Date(t.created_at) >= activeDate).map((t: any) => t.user_id)
        ).size

        monthlyData.push({ month: monthStr, active: activeUsers, new: newUsers })
      }
      setUserActivityData(monthlyData)

    } catch (error) {
      setError(`Gagal memuat data analitik`)
    } finally {
      setLoading(false)
    }
  }

  // Compute summary stats
  const totalTransactions = transactionData.reduce((sum, day) => sum + day.borrowings + day.returns, 0)
  const avgDaily = transactionData.length > 0 ? Math.round(transactionData.reduce((sum, day) => sum + day.borrowings, 0) / transactionData.length) : 0
  const availableEquipment = equipmentStatusData.find(item => item.name === 'Tersedia')?.value || 0
  const utilizationRate = equipmentStatusData.length > 0
    ? Math.round(((equipmentStatusData.find(item => item.name === 'Dipinjam')?.value || 0) / equipmentStatusData.reduce((sum, item) => sum + item.value, 0)) * 100)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#ff007a] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm font-medium">Memuat data analitik...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={fetchChartData} className="mt-3 text-sm text-red-700 underline">Coba lagi</button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 h-9 text-sm bg-gray-50 border-gray-200 rounded-xl">
              <SelectValue placeholder="Rentang waktu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 Hari</SelectItem>
              <SelectItem value="30days">30 Hari</SelectItem>
              <SelectItem value="90days">90 Hari</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={fetchChartData}
            disabled={loading}
            className="h-9 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          Data Langsung
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStat
          label="Total Transaksi"
          value={totalTransactions}
          subtext={timeRange === '7days' ? '7 hari' : timeRange === '30days' ? '30 hari' : '90 hari'}
          icon={Activity}
          color="blue"
        />
        <QuickStat
          label="Rata-rata Harian"
          value={avgDaily}
          subtext="peminjaman/hari"
          icon={TrendingUp}
          color="emerald"
        />
        <QuickStat
          label="Peralatan Tersedia"
          value={availableEquipment}
          subtext="siap dipinjam"
          icon={Package}
          color="purple"
        />
        <QuickStat
          label="Utilisasi"
          value={`${utilizationRate}%`}
          subtext="sedang dipinjam"
          icon={BarChart3}
          color="orange"
        />
      </div>

      {/* Main Charts - 2 column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Trend */}
        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100/50 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-[29px] h-[29px] bg-[#F9FBFC] border border-[#FD1278] rounded-[5px] flex items-center justify-center">
              <Activity className="w-[18px] h-[18px] text-[#FD1278]" />
            </div>
            <div>
              <h4 className="text-[16px] font-bold text-[#222222]">Tren Transaksi</h4>
              <p className="text-[12px] text-gray-500">Aktivitas peminjaman dan pengembalian</p>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={transactionData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  interval={Math.max(1, Math.floor(transactionData.length / 6))}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '16px' }} iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="borrowings" stroke="#FD1278" strokeWidth={3} dot={false} name="Peminjaman" />
                <Line type="monotone" dataKey="returns" stroke="#10b981" strokeWidth={3} dot={false} name="Pengembalian" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Activity */}
        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100/50 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-[29px] h-[29px] bg-[#F9FBFC] border border-[#C20F5D] rounded-[5px] flex items-center justify-center">
              <Users className="w-[18px] h-[18px] text-[#C20F5D]" />
            </div>
            <div>
              <h4 className="text-[16px] font-bold text-[#222222]">Aktivitas Pengguna</h4>
              <p className="text-[12px] text-gray-500">Registrasi dan aktivitas bulanan</p>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userActivityData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '16px' }} iconType="circle" iconSize={8} />
                <Bar dataKey="active" fill="#10b981" radius={[6, 6, 0, 0]} name="Pengguna Aktif" />
                <Bar dataKey="new" fill="#C20F5D" radius={[6, 6, 0, 0]} name="Pengguna Baru" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row - Status Distribution + Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Status Pie */}
        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100/50 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-[29px] h-[29px] bg-[#F9FBFC] border border-[#10b981] rounded-[5px] flex items-center justify-center">
              <Package className="w-[18px] h-[18px] text-[#10b981]" />
            </div>
            <div>
              <h4 className="text-[16px] font-bold text-[#222222]">Status Peralatan</h4>
              <p className="text-[12px] text-gray-500">Distribusi berdasarkan status</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="w-[180px] h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={equipmentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {equipmentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 ml-6 space-y-4">
              {equipmentStatusData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.fill || COLORS[index % COLORS.length] }}></div>
                    <span className="text-[14px] text-gray-600 font-medium">{item.name}</span>
                  </div>
                  <span className="text-[16px] font-bold text-[#222222]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Bar */}
        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100/50 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-[29px] h-[29px] bg-[#F9FBFC] border border-[#FD1278] rounded-[5px] flex items-center justify-center">
              <BarChart3 className="w-[18px] h-[18px] text-[#FD1278]" />
            </div>
            <div>
              <h4 className="text-[16px] font-bold text-[#222222]">Peralatan per Kategori</h4>
              <p className="text-[12px] text-gray-500">Jumlah peralatan tersedia</p>
            </div>
          </div>
          <div className="space-y-3">
            {categoryData.length > 0 ? (
              categoryData.map((item, index) => {
                const maxCount = Math.max(...categoryData.map(c => c.count))
                const width = (item.count / maxCount) * 100
                const colors = ['#FD1278', '#C20F5D', '#8E0C44', '#FD1278', '#C20F5D', '#8E0C44']
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-[100px] flex-shrink-0">
                      <p className="text-[13px] text-[#222222] font-medium truncate">
                        {item.name}
                      </p>
                    </div>
                    <div className="flex-1 h-[28px] bg-gray-100 rounded-full overflow-hidden relative">
                      <div
                        className="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                        style={{
                          width: `${Math.max(width, 15)}%`,
                          backgroundColor: colors[index % colors.length]
                        }}
                      >
                        <span className="text-[11px] font-bold text-white">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="h-[150px] flex items-center justify-center text-gray-400">
                <span className="text-sm">Belum ada data kategori</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Quick Stat Card Component
function QuickStat({ label, value, subtext, icon: Icon, color }: {
  label: string
  value: string | number
  subtext: string
  icon: any
  color: 'blue' | 'emerald' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-black text-gray-900 mb-0.5">{value}</div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-xs text-gray-500">{subtext}</div>
    </div>
  )
}