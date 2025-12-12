'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HourglassIcon,
  ChevronDown
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'

interface Transaction {
  id: string
  user_id: string
  equipment_id: string
  borrow_date: string
  expected_return_date: string
  actual_return_date: string | null
  status: string
  notes: string | null
  created_at: string
  user: {
    full_name: string
    email: string
    role: string
  } | null
  equipment: {
    name: string
    serial_number: string
  } | null
}

export function TransactionList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null)

  const queryClient = useQueryClient()

  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions', searchTerm, filterStatus],
    queryFn: async () => {
      console.log('[DEBUG] Fetching transactions...')

      // Use explicit foreign key references to avoid join issues
      let query = supabase
        .from('borrowing_transactions')
        .select(`
          id,
          user_id,
          equipment_id,
          borrow_date,
          expected_return_date,
          actual_return_date,
          status,
          notes,
          created_at,
          user:users!borrowing_transactions_user_id_fkey(full_name, email, role),
          equipment:equipment!borrowing_transactions_equipment_id_fkey(name, serial_number)
        `)
        .order('created_at', { ascending: false })

      if (filterStatus) {
        query = query.eq('status', filterStatus as any)
      }

      const { data, error } = await query

      console.log('[DEBUG] Transactions result:', data, 'error:', error)

      if (error) {
        console.error('Query error:', error)
        throw error
      }

      // Apply client-side search filter
      let result = (data || []) as Transaction[]

      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        result = result.filter(t =>
          t.user?.full_name?.toLowerCase().includes(search) ||
          t.user?.email?.toLowerCase().includes(search) ||
          t.equipment?.name?.toLowerCase().includes(search) ||
          t.equipment?.serial_number?.toLowerCase().includes(search)
        )
      }

      return result
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const getStatusConfig = (status: string) => {
    const config: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
      pending: {
        label: 'Menunggu',
        color: 'text-amber-700',
        bg: 'bg-amber-100',
        icon: <HourglassIcon className="w-3.5 h-3.5" />
      },
      active: {
        label: 'Aktif',
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        icon: <Clock className="w-3.5 h-3.5" />
      },
      returned: {
        label: 'Dikembalikan',
        color: 'text-green-700',
        bg: 'bg-green-100',
        icon: <CheckCircle className="w-3.5 h-3.5" />
      },
      overdue: {
        label: 'Terlambat',
        color: 'text-red-700',
        bg: 'bg-red-100',
        icon: <AlertTriangle className="w-3.5 h-3.5" />
      },
      rejected: {
        label: 'Ditolak',
        color: 'text-gray-700',
        bg: 'bg-gray-100',
        icon: <XCircle className="w-3.5 h-3.5" />
      }
    }
    return config[status] || config.pending
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const isOverdue = (expectedReturnDate: string, status: string) => {
    if (status !== 'active') return false
    return new Date(expectedReturnDate) < new Date()
  }

  if (isLoading) {
    return (
      <ModernCard variant="default" padding="lg">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-pink-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-pink-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-500 font-medium">Memuat transaksi...</p>
          </div>
        </div>
      </ModernCard>
    )
  }

  if (error) {
    return (
      <ModernCard variant="default" padding="lg">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Gagal memuat data transaksi</p>
          <p className="text-gray-500 text-sm mt-2">{(error as Error).message}</p>
        </div>
      </ModernCard>
    )
  }

  return (
    <>
      <ModernCard variant="default" padding="none" className="overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">TRANSAKSI</h2>
              <p className="text-sm text-gray-500 mt-1">
                {transactions?.length || 0} transaksi ditemukan
              </p>
            </div>
            <ModernButton
              variant="default"
              size="sm"
              className="w-full sm:w-auto"
            >
              + PINJAM BARU
            </ModernButton>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari transaksi..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none w-full sm:w-40 px-4 py-2.5 pr-10 bg-white border border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all text-sm cursor-pointer"
              >
                <option value="">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="active">Aktif</option>
                <option value="returned">Dikembalikan</option>
                <option value="rejected">Ditolak</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-4 sm:px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Peminjam</th>
                <th className="text-left py-3 px-4 sm:px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Peralatan</th>
                <th className="text-left py-3 px-4 sm:px-6 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Tanggal Pinjam</th>
                <th className="text-left py-3 px-4 sm:px-6 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Batas Kembali</th>
                <th className="text-left py-3 px-4 sm:px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 sm:px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions && transactions.length > 0 ? (
                transactions.map((transaction) => {
                  const statusConfig = getStatusConfig(
                    isOverdue(transaction.expected_return_date, transaction.status)
                      ? 'overdue'
                      : transaction.status
                  )

                  return (
                    <tr
                      key={transaction.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {transaction.user?.full_name?.charAt(0) || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {transaction.user?.full_name || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {transaction.user?.email || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {transaction.equipment?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {transaction.equipment?.serial_number || '-'}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(transaction.borrow_date)}
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 hidden lg:table-cell">
                        <div className={`flex items-center gap-2 text-sm ${isOverdue(transaction.expected_return_date, transaction.status)
                            ? 'text-red-600 font-medium'
                            : 'text-gray-600'
                          }`}>
                          <Clock className="w-4 h-4" />
                          {formatDate(transaction.expected_return_date)}
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.color}`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <ModernButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingTransaction(transaction)}
                          className="text-gray-500 hover:text-pink-600"
                        >
                          <Eye className="w-4 h-4" />
                        </ModernButton>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Tidak ada transaksi ditemukan</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {filterStatus ? 'Coba ubah filter status' : 'Belum ada data transaksi'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ModernCard>

      {/* Detail Dialog */}
      <Dialog open={!!viewingTransaction} onOpenChange={() => setViewingTransaction(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Detail Transaksi</DialogTitle>
          </DialogHeader>
          {viewingTransaction && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Peminjam</label>
                  <p className="font-medium text-gray-900 mt-1">
                    {viewingTransaction.user?.full_name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {viewingTransaction.user?.email || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Peralatan</label>
                  <p className="font-medium text-gray-900 mt-1">
                    {viewingTransaction.equipment?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500 font-mono">
                    {viewingTransaction.equipment?.serial_number || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Tanggal Pinjam</label>
                  <p className="font-medium text-gray-900 mt-1">
                    {formatDate(viewingTransaction.borrow_date)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Batas Kembali</label>
                  <p className={`font-medium mt-1 ${isOverdue(viewingTransaction.expected_return_date, viewingTransaction.status)
                      ? 'text-red-600'
                      : 'text-gray-900'
                    }`}>
                    {formatDate(viewingTransaction.expected_return_date)}
                  </p>
                </div>
                {viewingTransaction.actual_return_date && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Tanggal Kembali</label>
                    <p className="font-medium text-green-600 mt-1">
                      {formatDate(viewingTransaction.actual_return_date)}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                  <div className="mt-1">
                    {(() => {
                      const config = getStatusConfig(
                        isOverdue(viewingTransaction.expected_return_date, viewingTransaction.status)
                          ? 'overdue'
                          : viewingTransaction.status
                      )
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}>
                          {config.icon}
                          {config.label}
                        </span>
                      )
                    })()}
                  </div>
                </div>
              </div>
              {viewingTransaction.notes && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Catatan</label>
                  <p className="text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                    {viewingTransaction.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}