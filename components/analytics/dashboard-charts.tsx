'use client'

import { useState, useEffect } from 'react'
import { ModernCard, ModernCardContent, ModernCardHeader } from '@/components/ui/modern-card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ModernBadge } from '@/components/ui/modern-badge'
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

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
  }, [timeRange]) // eslint-disable-line react-hooks/exhaustive-deps

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

      if (equipmentData.length === 0 || categories.length === 0) {
        throw new Error('No equipment or categories data available')
      }

      const statusCounts = equipmentData.reduce((acc, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const statusChartData: ChartData[] = [
        { name: 'Tersedia', value: statusCounts.available || 0, fill: '#10b981' },
        { name: 'Dipinjam', value: statusCounts.borrowed || 0, fill: '#3b82f6' },
        { name: 'Perawatan', value: statusCounts.maintenance || 0, fill: '#f59e0b' },
        { name: 'Hilang', value: statusCounts.lost || 0, fill: '#ef4444' }
      ]

      setEquipmentStatusData(statusChartData)

      const availableEquipment = equipmentData.filter((item: any) => item.status === 'available')
      const categoryCounts = categories.map((category: any) => ({
        name: category.name,
        count: availableEquipment.filter((item: any) => item.category_id === category.id).length
      })).filter((cat: any) => cat.count > 0) // Only show categories with available equipment

      setCategoryData(categoryCounts.slice(0, 6).sort((a, b) => b.count - a.count))

      const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      const recentTransactions = transactions.filter((t: any) =>
        new Date(t.created_at) >= cutoffDate
      )

      const processedTransactionData: TransactionData[] = []
      const today = new Date()

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        const borrowings = recentTransactions.filter((t: any) =>
          t.created_at.startsWith(dateStr)
        ).length

        const returns = recentTransactions.filter((t: any) =>
          t.actual_return_date && t.actual_return_date.startsWith(dateStr)
        ).length

        processedTransactionData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          borrowings,
          returns
        })
      }

      setTransactionData(processedTransactionData)

      const monthlyData: UserActivityData[] = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

        const newUsers = users.filter((u: any) => {
          const userDate = new Date(u.created_at)
          return userDate.getMonth() === date.getMonth() && userDate.getFullYear() === date.getFullYear()
        }).length

        const activeDate = new Date()
        activeDate.setMonth(activeDate.getMonth() - 1)
        const activeUsers = new Set(
          transactions
            .filter((t: any) => new Date(t.created_at) >= activeDate)
            .map((t: any) => t.user_id)
        ).size

        monthlyData.push({
          month: monthStr,
          active: activeUsers,
          new: newUsers
        })
      }

      setUserActivityData(monthlyData)

    } catch (error) {
      setError(`Failed to load analytics data: ${error instanceof Error ? error.message : 'Unknown error'}`)

      setEquipmentStatusData([])
      setCategoryData([])
      setTransactionData([])
      setUserActivityData([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="border border-black p-12 text-center">
        <div className="text-lg">Loading analytics data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <ModernCard variant="default" className="border-red-200 bg-red-50 p-4">
          <p className="text-red-800">
            {error}
          </p>
        </ModernCard>
      )}

      {/* No Data Alert */}
      {!loading && !error && (equipmentStatusData.length === 0 || categoryData.length === 0) && (
        <ModernCard variant="default" className="border-blue-200 bg-blue-50 p-4">
          <p className="text-blue-800">
            Data tidak tersedia. Silakan tambahkan peralatan dan kategori untuk melihat analitik.
          </p>
        </ModernCard>
      )}

      {/* Header with time range selector - Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6">
        {/* Title and badge */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Ringkasan Analitik</h3>
            {!loading && !error && equipmentStatusData.length > 0 && (
              <ModernBadge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs sm:text-sm">Data Langsung</ModernBadge>
            )}
          </div>
          <p className="text-sm sm:text-base text-gray-600 hidden sm:block">
            Metrik penggunaan dan performa peralatan secara real-time
          </p>
        </div>

        {/* Controls - Responsive layout */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => fetchChartData()}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 w-full sm:w-auto order-2 sm:order-1"
            disabled={loading}
          >
            {loading ? 'Memuat...' : 'Segarkan'}
          </button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-40 order-1 sm:order-2">
              <SelectValue placeholder="Pilih rentang waktu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 hari terakhir</SelectItem>
              <SelectItem value="30days">30 hari terakhir</SelectItem>
              <SelectItem value="90days">90 hari terakhir</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Analytics Content */}
      {equipmentStatusData.length > 0 || categoryData.length > 0 || transactionData.length > 0 || userActivityData.length > 0 ? (
        <>
          {/* Charts Grid */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Equipment Status Pie Chart */}
            <ModernCard className="min-h-[350px] sm:min-h-[400px]">
              <ModernCardHeader>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Status Peralatan</h3>
                <p className="text-xs sm:text-sm text-gray-600">Distribusi peralatan berdasarkan status saat ini</p>
              </ModernCardHeader>
              <ModernCardContent className="px-2 sm:px-4">
                <div className="w-full h-[250px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={equipmentStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name?: string; percent?: number }) => {
                          if (name && percent !== undefined && percent > 0.05) {
                            return `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          return ''
                        }}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {equipmentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap gap-1 sm:gap-2 justify-center">
                  {equipmentStatusData.map((item, index) => (
                    <div key={item.name} className="flex items-center space-x-1 sm:space-x-2">
                      <div
                        className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.fill || COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-xs sm:text-sm text-gray-600">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </ModernCardContent>
            </ModernCard>

            {/* Equipment Categories Bar Chart */}
            <ModernCard className="min-h-[350px] sm:min-h-[400px]">
              <ModernCardHeader>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Peralatan per Kategori</h3>
                <p className="text-xs sm:text-sm text-gray-600">Jumlah peralatan tersedia per kategori</p>
              </ModernCardHeader>
              <ModernCardContent className="px-2 sm:px-4">
                <div className="w-full h-[250px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ModernCardContent>
            </ModernCard>

            {/* Transaction Trend Line Chart */}
            <ModernCard className="min-h-[350px] sm:min-h-[400px]">
              <ModernCardHeader>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Tren Transaksi</h3>
                <p className="text-xs sm:text-sm text-gray-600">Aktivitas peminjaman dan pengembalian harian</p>
              </ModernCardHeader>
              <ModernCardContent className="px-2 sm:px-4">
                <div className="w-full h-[250px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={transactionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={Math.max(1, Math.floor(transactionData.length / 3))}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="borrowings"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Peminjaman"
                      />
                      <Line
                        type="monotone"
                        dataKey="returns"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Pengembalian"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ModernCardContent>
            </ModernCard>

            {/* User Activity Chart */}
            <ModernCard className="min-h-[350px] sm:min-h-[400px]">
              <ModernCardHeader>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Aktivitas Pengguna</h3>
                <p className="text-xs sm:text-sm text-gray-600">Registrasi dan aktivitas pengguna bulanan</p>
              </ModernCardHeader>
              <ModernCardContent className="px-2 sm:px-4">
                <div className="w-full h-[250px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userActivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="new" fill="#8b5cf6" name="Pengguna Baru" />
                      <Bar dataKey="active" fill="#10b981" name="Pengguna Aktif" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ModernCardContent>
            </ModernCard>
          </div>

          {/* Summary Stats */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
            <ModernCard>
              <ModernCardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Transaksi</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {transactionData.reduce((sum, day) => sum + day.borrowings + day.returns, 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {timeRange === '7days' ? '7 hari terakhir' : timeRange === '30days' ? '30 hari terakhir' : '90 hari terakhir'}
                    </p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 sm:w-5 sm:h-5 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
              </ModernCardContent>
            </ModernCard>

            <ModernCard>
              <ModernCardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Rata-rata Harian</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {transactionData.length > 0
                        ? Math.round(transactionData.reduce((sum, day) => sum + day.borrowings, 0) / transactionData.length)
                        : 0
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {transactionData.length > 0 ? 'Per hari' : 'Tidak ada data'}
                    </p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 sm:w-5 sm:h-5 bg-green-600 rounded-full"></div>
                  </div>
                </div>
              </ModernCardContent>
            </ModernCard>

            <ModernCard>
              <ModernCardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Tersedia</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {equipmentStatusData.find(item => item.name === 'Tersedia')?.value || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      Siap dipinjam
                    </p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 sm:w-5 sm:h-5 bg-green-600 rounded-full"></div>
                  </div>
                </div>
              </ModernCardContent>
            </ModernCard>

            <ModernCard>
              <ModernCardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Kategori Teratas</p>
                    <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                      {categoryData.length > 0 ? categoryData[0]?.name : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {categoryData.length > 0 ? `${categoryData[0]?.count} item` : 'Tidak ada data'}
                    </p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 sm:w-5 sm:h-5 bg-purple-600 rounded-full"></div>
                  </div>
                </div>
              </ModernCardContent>
            </ModernCard>
          </div>

          {/* Additional Insights */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <ModernCard>
              <ModernCardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Utilisasi Peralatan</p>
                    <p className="text-sm sm:text-lg font-bold text-gray-900">
                      {equipmentStatusData.length > 0
                        ? Math.round(((equipmentStatusData.find(item => item.name === 'Dipinjam')?.value || 0) /
                          equipmentStatusData.reduce((sum, item) => sum + item.value, 0)) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-500">
                      Sedang dipinjam / total
                    </p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 sm:w-5 sm:h-5 bg-orange-600 rounded-full"></div>
                  </div>
                </div>
              </ModernCardContent>
            </ModernCard>

            <ModernCard>
              <ModernCardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Pengguna Aktif Bulanan</p>
                    <p className="text-sm sm:text-lg font-bold text-gray-900">
                      {userActivityData.length > 0
                        ? userActivityData[userActivityData.length - 1]?.active || 0
                        : 0
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      Aktivitas 30 hari terakhir
                    </p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 sm:w-5 sm:h-5 bg-indigo-600 rounded-full"></div>
                  </div>
                </div>
              </ModernCardContent>
            </ModernCard>
          </div>
        </>
      ) : null}
    </div>
  )
}