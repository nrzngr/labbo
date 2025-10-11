'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

      // Fetch real data using direct Supabase calls
      const [equipmentResult, categoriesResult, transactionsResult, usersResult] = await Promise.allSettled([
        supabase.from('equipment').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('borrowing_transactions').select('*'),
        supabase.from('user_profiles').select('*')
      ])

      const equipmentData = equipmentResult.status === 'fulfilled' ? equipmentResult.value.data || [] : []
      const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value.data || [] : []
      const transactions = transactionsResult.status === 'fulfilled' ? transactionsResult.value.data || [] : []
      const users = usersResult.status === 'fulfilled' ? usersResult.value.data || [] : []

      // Check if we have sufficient data
      if (equipmentData.length === 0 || categories.length === 0) {
        throw new Error('No equipment or categories data available')
      }

      // Process equipment status data
      const statusCounts = equipmentData.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const statusChartData: ChartData[] = [
        { name: 'Available', value: statusCounts.available || 0, fill: '#10b981' },
        { name: 'Borrowed', value: statusCounts.borrowed || 0, fill: '#3b82f6' },
        { name: 'Maintenance', value: statusCounts.maintenance || 0, fill: '#f59e0b' },
        { name: 'Lost', value: statusCounts.lost || 0, fill: '#ef4444' }
      ]

      setEquipmentStatusData(statusChartData)

      // Process category data
      const availableEquipment = equipmentData.filter(item => item.status === 'available')
      const categoryCounts = categories.map(category => ({
        name: category.name,
        count: availableEquipment.filter(item => item.category_id === category.id).length
      })).filter(cat => cat.count > 0) // Only show categories with available equipment

      setCategoryData(categoryCounts.slice(0, 6).sort((a, b) => b.count - a.count))

      // Process transaction data for line chart
      const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      const recentTransactions = transactions.filter(t =>
        new Date(t.created_at) >= cutoffDate
      )

      const processedTransactionData: TransactionData[] = []
      const today = new Date()

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        const borrowings = recentTransactions.filter(t =>
          t.created_at.startsWith(dateStr)
        ).length

        const returns = recentTransactions.filter(t =>
          t.actual_return_date && t.actual_return_date.startsWith(dateStr)
        ).length

        processedTransactionData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          borrowings,
          returns
        })
      }

      setTransactionData(processedTransactionData)

      // Process user activity by month (only use real data)
      const monthlyData: UserActivityData[] = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

        const newUsers = users.filter(u => {
          const userDate = new Date(u.created_at)
          return userDate.getMonth() === date.getMonth() && userDate.getFullYear() === date.getFullYear()
        }).length

        // Calculate active users (users with transactions in the last month)
        const activeDate = new Date()
        activeDate.setMonth(activeDate.getMonth() - 1)
        const activeUsers = new Set(
          transactions
            .filter(t => new Date(t.created_at) >= activeDate)
            .map(t => t.user_id)
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

      // Set empty data arrays - no mock data
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
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* No Data Alert */}
      {!loading && !error && (equipmentStatusData.length === 0 || categoryData.length === 0) && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">
            No data available. Please add equipment and categories to see analytics.
          </AlertDescription>
        </Alert>
      )}

      {/* Header with time range selector */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Analytics Overview</h3>
          {!loading && !error && equipmentStatusData.length > 0 && (
            <Badge variant="outline" className="text-green-600">Live Data</Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchChartData()}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            disabled={loading}
          >
            Refresh
          </button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

          {/* Analytics Content */}
      {equipmentStatusData.length > 0 || categoryData.length > 0 || transactionData.length > 0 || userActivityData.length > 0 ? (
        <>
          {/* Charts Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Equipment Status Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Equipment Status</CardTitle>
                <CardDescription>Distribution of equipment by current status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={equipmentStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name?: string; percent?: number }) => {
                        if (name && percent !== undefined) {
                          return `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        return ''
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {equipmentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {equipmentStatusData.map((item, index) => (
                    <div key={item.name} className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.fill || COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Equipment Categories Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Equipment by Category</CardTitle>
                <CardDescription>Number of available equipment by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Transaction Trend Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Trends</CardTitle>
                <CardDescription>Daily borrowing and return activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={transactionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={Math.floor(transactionData.length / 5)}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="borrowings"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Borrowings"
                    />
                    <Line
                      type="monotone"
                      dataKey="returns"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Returns"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Monthly user registration and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={userActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="new" fill="#8b5cf6" name="New Users" />
                    <Bar dataKey="active" fill="#10b981" name="Active Users" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {transactionData.reduce((sum, day) => sum + day.borrowings + day.returns, 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {timeRange === '7days' ? 'Last 7 days' : timeRange === '30days' ? 'Last 30 days' : 'Last 90 days'}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Daily Borrowings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {transactionData.length > 0
                        ? Math.round(transactionData.reduce((sum, day) => sum + day.borrowings, 0) / transactionData.length)
                        : 0
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {transactionData.length > 0 ? 'Per day average' : 'No data'}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 bg-green-600 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Available Equipment</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {equipmentStatusData.find(item => item.name === 'Available')?.value || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      Ready for borrowing
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 bg-green-600 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Top Category</p>
                    <p className="text-lg font-bold text-gray-900 truncate">
                      {categoryData.length > 0 ? categoryData[0]?.name : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {categoryData.length > 0 ? `${categoryData[0]?.count} items` : 'No data'}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 bg-purple-600 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Insights */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Equipment Utilization</p>
                    <p className="text-lg font-bold text-gray-900">
                      {equipmentStatusData.length > 0
                        ? Math.round(((equipmentStatusData.find(item => item.name === 'Borrowed')?.value || 0) /
                                    equipmentStatusData.reduce((sum, item) => sum + item.value, 0)) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-500">
                      Currently borrowed / total
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 bg-orange-600 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Active Users</p>
                    <p className="text-lg font-bold text-gray-900">
                      {userActivityData.length > 0
                        ? userActivityData[userActivityData.length - 1]?.active || 0
                        : 0
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      Last 30 days activity
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 bg-indigo-600 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}