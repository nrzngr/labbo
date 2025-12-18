"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Database } from '@/types/database'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
import {
  Package,
  Activity,
  AlertTriangle,
  Clock,
  FileText,
  Search,
  Plus,
  ChevronRight,
  Calendar,
  LogOut
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { DashboardSkeleton } from '@/components/ui/loading-skeleton'

interface StudentStats {
  totalBorrowed: number
  currentlyBorrowed: number
  returnedItems: number
  overdueItems: number
}

interface RecentTransaction {
  id: string
  equipment_name: string
  quantity: number
  borrow_date: string
  expected_return_date: string
  actual_return_date: string | null
  status: string
}

interface FrequentlyBorrowed {
  name: string
  count: number
}

type BorrowingTransactionRow = Database['public']['Tables']['borrowing_transactions']['Row']

type TransactionWithEquipment = BorrowingTransactionRow & {
  equipment?: {
    name?: string | null
    condition?: string | null
    categories?: {
      name?: string | null
    } | null
  } | null
}

export default function StudentDashboard() {
  const { user, isAuthenticated, logout } = useCustomAuth()
  const router = useRouter()
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [frequentlyBorrowed, setFrequentlyBorrowed] = useState<FrequentlyBorrowed[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user || !isAuthenticated) return

      try {
        const { data: transactionData } = await supabase
          .from('borrowing_transactions')
          .select('*, equipment(name, condition, categories(name))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        const transactions = (transactionData ?? []) as TransactionWithEquipment[]

        if (transactions.length) {
          const currentlyBorrowed = transactions.filter((t: any) => t.status === 'active').length
          const returnedItems = transactions.filter((t: any) => t.status === 'returned').length
          const overdueItems = transactions.filter(
            (t: any) => t.status === 'active' && new Date(t.expected_return_date) < new Date()
          ).length
          const totalBorrowed = transactions.length

          setStats({
            totalBorrowed,
            currentlyBorrowed,
            returnedItems,
            overdueItems
          })

          // Calculate frequently borrowed
          const equipmentCount: Record<string, number> = {}
          transactions.forEach((t) => {
            const name = t.equipment?.name || 'Unknown'
            equipmentCount[name] = (equipmentCount[name] || 0) + 1
          })
          const sorted = Object.entries(equipmentCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 7)
            .map(([name, count]) => ({ name, count }))
          setFrequentlyBorrowed(sorted)
        } else {
          setStats({
            totalBorrowed: 0,
            currentlyBorrowed: 0,
            returnedItems: 0,
            overdueItems: 0
          })
        }

        const recentData = transactions.slice(0, 3).map((t) => ({
          id: t.id,
          equipment_name: t.equipment?.name || 'Unknown Equipment',
          quantity: (t as any).quantity || 1,
          borrow_date: t.borrow_date,
          expected_return_date: t.expected_return_date,
          actual_return_date: t.actual_return_date,
          status: (t.status === 'active' && new Date(t.expected_return_date) < new Date() ? 'overdue' : t.status) || 'pending'
        })) || []

        setRecentTransactions(recentData)
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

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (!user || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#FD1278] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getStatusConfig = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      pending: { label: 'Menunggu', color: '#FFEE35' },
      active: { label: 'Dipinjam', color: '#FFEE35' },
      returned: { label: 'Dikembalikan', color: '#3AFB57' },
      overdue: { label: 'Telat', color: '#FF6666' }
    }
    return config[status] || config.active
  }

  // Find the most urgent overdue item for reminder
  const overdueTransaction = recentTransactions.find(t => t.status === 'overdue')

  // Max count for bar chart scaling
  const maxCount = Math.max(...frequentlyBorrowed.map(f => f.count), 1)

  return (
    <div className="min-h-screen">

      {/* Content Area */}
      <div className="p-6 lg:p-10">

        {/* Greeting */}
        <div className="mb-8">
          <h2 className="text-[28px] font-bold text-[#222222] mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            Hai, {user?.full_name?.split(' ')[0]}!
          </h2>
          <p className="text-[22px] text-[#222222]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            Selamat datang di Labbo Inventory.
          </p>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Barang Dipinjam */}
          <div className="group bg-white rounded-[20px] p-6 relative overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100/50">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FD1278]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[16px] font-medium text-[#222222] mb-3 relative z-10" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Barang Dipinjam
            </p>
            <p className="text-[48px] font-bold text-[#222222] relative z-10" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              {stats?.currentlyBorrowed || 0}
            </p>
            <div className="absolute bottom-4 right-4 w-[60px] h-[60px] bg-[#FD1278] rounded-full flex items-center justify-center shadow-lg shadow-[#FD1278]/30 group-hover:scale-110 transition-transform">
              <Search className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Peminjaman Saya */}
          <div className="group bg-white rounded-[20px] p-6 relative overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100/50">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FD1278]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[16px] font-medium text-[#222222] mb-3 relative z-10" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Peminjaman Saya
            </p>
            <p className="text-[48px] font-bold text-[#222222] relative z-10" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              {stats?.totalBorrowed || 0}
            </p>
            <div className="absolute bottom-4 right-4 w-[60px] h-[60px] bg-[#FD1278] rounded-full flex items-center justify-center shadow-lg shadow-[#FD1278]/30 group-hover:scale-110 transition-transform">
              <FileText className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Barang Dikembalikan */}
          <div className="group bg-white rounded-[20px] p-6 relative overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100/50">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FD1278]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[16px] font-medium text-[#222222] mb-3 relative z-10" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Barang Dikembalikan
            </p>
            <p className="text-[48px] font-bold text-[#222222] relative z-10" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              {stats?.returnedItems || 0}
            </p>
            <div className="absolute bottom-4 right-4 w-[60px] h-[60px] bg-[#FD1278] rounded-full flex items-center justify-center shadow-lg shadow-[#FD1278]/30 group-hover:scale-110 transition-transform">
              <Calendar className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Terlambat Dikembalikan */}
          <div className="group bg-white rounded-[20px] p-6 relative overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100/50">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FD1278]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[16px] font-medium text-[#222222] mb-3 relative z-10" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Terlambat Dikembalikan
            </p>
            <p className="text-[48px] font-bold text-[#222222] relative z-10" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              {stats?.overdueItems || 0}
            </p>
            <div className="absolute bottom-4 right-4 w-[60px] h-[60px] bg-[#FD1278] rounded-full flex items-center justify-center shadow-lg shadow-[#FD1278]/30 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        {/* Middle Row: History Table + Reminder */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-8">
          {/* Riwayat Peminjaman Table */}
          <div className="lg:col-span-3 bg-white rounded-[20px] p-6 shadow-sm border border-gray-100/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-[29px] h-[29px] bg-[#F9FBFC] border border-[#FD1278] rounded-[5px] flex items-center justify-center">
                  <Activity className="w-[18px] h-[18px] text-[#FD1278]" />
                </div>
                <span className="text-[16px] font-medium text-[#222222]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Riwayat Peminjaman
                </span>
              </div>
              <Link
                href="/dashboard/my-borrowings"
                className="text-[12px] font-medium text-[#FD1278]"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              >
                See All
              </Link>
            </div>

            {/* Table Header */}
            <div className="bg-[#F9FBFC] grid grid-cols-5 gap-4 px-4 py-3 rounded-t-lg">
              <span className="text-[12px] font-medium text-[#A09FA2] uppercase" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Barang
              </span>
              <span className="text-[12px] font-medium text-[#A09FA2] uppercase text-center" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Jumlah
              </span>
              <span className="text-[12px] font-medium text-[#A09FA2] uppercase text-center" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Tanggal Pinjam
              </span>
              <span className="text-[12px] font-medium text-[#A09FA2] uppercase text-center" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Tanggal Kembali
              </span>
              <span className="text-[12px] font-medium text-[#A09FA2] uppercase text-center" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Status
              </span>
            </div>

            {/* Table Rows */}
            {recentTransactions.length > 0 ? (
              <div className="divide-y divide-[#F9FBFC]">
                {recentTransactions.map((transaction) => {
                  const statusConfig = getStatusConfig(transaction.status)
                  return (
                    <div key={transaction.id} className="grid grid-cols-5 gap-4 px-4 py-4 items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-[#E6E6E6] rounded-full flex items-center justify-center">
                          <Package className="w-3 h-3 text-gray-500" />
                        </div>
                        <span className="text-[14px] text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                          {transaction.equipment_name}
                        </span>
                      </div>
                      <span className="text-[14px] text-[#6E6E6E] text-center" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                        {transaction.quantity}
                      </span>
                      <span className="text-[14px] text-[#6E6E6E] text-center" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                        {formatDate(transaction.borrow_date)}
                      </span>
                      <span className="text-[14px] text-[#6E6E6E] text-center" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                        {formatDate(transaction.expected_return_date)}
                      </span>
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: statusConfig.color }}
                        />
                        <span className="text-[14px] text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Belum ada aktivitas</p>
              </div>
            )}
          </div>

          {/* Reminder Card */}
          <div className="bg-white rounded-[20px] p-6 flex flex-col shadow-sm border border-gray-100/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-[29px] h-[29px] bg-[#F9FBFC] border border-[#FD1278] rounded-[5px] flex items-center justify-center">
                <AlertTriangle className="w-[18px] h-[18px] text-[#FD1278]" />
              </div>
              <span className="text-[16px] font-medium text-[#222222]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Reminder
              </span>
            </div>

            {overdueTransaction ? (
              <>
                <p className="text-[22px] font-medium text-[#FF6666] leading-[30px] mb-3" style={{ fontFamily: 'Satoshi, sans-serif', letterSpacing: '-0.03em' }}>
                  {overdueTransaction.equipment_name} harus segera dikembalikan!!
                </p>
                <p className="text-[12px] text-[#A09FA2] mb-4" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Batas Waktu : {formatDate(overdueTransaction.expected_return_date)}.
                </p>
                <p className="text-[10px] italic text-[#FF6666] leading-[12px] mb-auto" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Note: Jika peminjam mengembalikan barang melewati batas waktu, maka akan dikenakan denda sesuai aturan laboratorium.
                </p>
                <button
                  onClick={() => router.push('/dashboard/my-borrowings')}
                  className="w-full mt-4 py-3 bg-[#FD1278] text-white rounded-full text-[12px] font-bold"
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
                >
                  Kembalikan
                </button>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[14px] text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Tidak ada barang terlambat
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Chart + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Sering Dipinjam Chart */}
          <div className="lg:col-span-3 bg-white rounded-[20px] p-6 shadow-sm border border-gray-100/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-[29px] h-[29px] bg-[#F9FBFC] border border-[#FD1278] rounded-[5px] flex items-center justify-center">
                <Search className="w-[18px] h-[18px] text-[#FD1278]" />
              </div>
              <span className="text-[16px] font-medium text-[#222222]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Sering Dipinjam
              </span>
            </div>

            {/* Horizontal Bar Chart */}
            {frequentlyBorrowed.length > 0 ? (
              <div className="space-y-4">
                {frequentlyBorrowed.slice(0, 5).map((item, index) => {
                  const width = (item.count / maxCount) * 100
                  const colors = ['#FD1278', '#C20F5D', '#8E0C44', '#FD1278', '#C20F5D']
                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-[140px] flex-shrink-0">
                        <p className="text-[14px] text-[#222222] font-medium truncate" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                          {item.name}
                        </p>
                      </div>
                      <div className="flex-1 h-[32px] bg-gray-100 rounded-full overflow-hidden relative">
                        <div
                          className="h-full rounded-full flex items-center justify-end pr-4 transition-all duration-500"
                          style={{
                            width: `${Math.max(width, 20)}%`,
                            backgroundColor: colors[index % colors.length]
                          }}
                        >
                          <span className="text-[12px] font-bold text-white" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                            {item.count}x
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-gray-400">
                <Package className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Belum ada data peminjaman</p>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="lg:col-span-2 bg-white rounded-[20px] p-6 shadow-sm border border-gray-100/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-[29px] h-[29px] bg-[#F9FBFC] border border-[#FD1278] rounded-[5px] flex items-center justify-center">
                <Activity className="w-[18px] h-[18px] text-[#FD1278]" />
              </div>
              <span className="text-[16px] font-medium text-[#222222]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Quick Action
              </span>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard/my-borrowings')}
                className="group w-full py-4 px-6 bg-gradient-to-r from-[#C20F5D] to-[#a00d4d] hover:from-[#a00d4d] hover:to-[#8a0b42] text-white rounded-full text-[15px] font-semibold flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#C20F5D]/20 hover:shadow-xl hover:shadow-[#C20F5D]/30"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                Ajukan Peminjaman
              </button>

              <button
                onClick={() => router.push('/dashboard/equipment')}
                className="group w-full py-4 px-6 bg-gradient-to-r from-[#FD1278] to-[#ff4d9e] hover:from-[#e0106c] hover:to-[#ff3d8e] text-white rounded-full text-[15px] font-semibold flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#FD1278]/20 hover:shadow-xl hover:shadow-[#FD1278]/30"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              >
                <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Lihat Barang
              </button>

              <button
                onClick={() => router.push('/dashboard/my-borrowings')}
                className="group w-full py-4 px-6 bg-gradient-to-r from-[#8E0C44] to-[#740a38] hover:from-[#740a38] hover:to-[#5f082e] text-white rounded-full text-[15px] font-semibold flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#8E0C44]/20 hover:shadow-xl hover:shadow-[#8E0C44]/30"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              >
                <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Lihat Riwayat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
