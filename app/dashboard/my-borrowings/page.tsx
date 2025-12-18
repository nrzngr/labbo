"use client"

import { useState } from 'react'
import { useCustomAuth } from "@/components/auth/custom-auth-provider"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  Plus,
  Timer,
  CalendarDays,
  MapPin,
  Tag,
  Eye,
  Sparkles,
  X,
  HourglassIcon,
  XCircle,
  FileDown
} from "lucide-react"
import { supabase } from '@/lib/supabase'
import { TablePagination } from '@/components/ui/pagination'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BorrowRequestForm } from '@/components/student/borrow-request-form'
import { EarlyReturnForm } from '@/components/student/early-return-form'
import { generateBorrowingLetter } from '@/lib/pdf-generator'
import { RotateCcw } from 'lucide-react'


interface BorrowingTransaction {
  id: string
  equipment: {
    id: string
    name: string
    serial_number: string
    category?: { name: string }
    location?: string
    condition?: string
    image_url?: string
  }
  quantity: number
  borrow_date: string
  expected_return_date: string
  actual_return_date: string | null
  status: 'pending' | 'active' | 'returned' | 'overdue' | 'rejected'
  notes?: string
  created_at?: string
  return_requested?: boolean
  return_requested_at?: string
}

export default function MyBorrowingsPage() {
  const { user } = useCustomAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<BorrowingTransaction | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isExtensionDialogOpen, setIsExtensionDialogOpen] = useState(false)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [extensionDate, setExtensionDate] = useState('')
  const [extensionReason, setExtensionReason] = useState('')

  const queryClient = useQueryClient()

  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['my-borrowings', searchTerm, statusFilter, user?.id, page, pageSize],
    queryFn: async () => {
      if (!user) {

        return []
      }



      let query = supabase
        .from('borrowing_transactions')
        .select(`
          *,
          equipment(id, name, serial_number, location, condition)
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`equipment.name.ilike.%${searchTerm}%,equipment.serial_number.ilike.%${searchTerm}%`)
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter as any)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query



      if (error) throw error
      if (count !== null) setTotalItems(count)

      return data?.map((transaction: any) => {
        let status = transaction.status

        // Check if active item is overdue
        if (transaction.status === 'active' && new Date(transaction.expected_return_date) < new Date()) {
          status = 'overdue'
        }

        return {
          ...transaction,
          status
        }
      }) || []
    },
    enabled: !!user
  })

  // NOTE: Direct extension mutation removed - all extensions must go through approval flow
  // See requestExtensionMutation below for proper implementation

  const cancelBorrowingMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from('borrowing_transactions')
        .delete()
        .eq('id', transactionId)

      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-borrowings'] })
      setIsDetailDialogOpen(false)
    }
  })

  // Request return mutation
  const requestReturnMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from('borrowing_transactions')
        .update({
          return_requested: true,
          return_requested_at: new Date().toISOString()
        } as any)
        .eq('id', transactionId)

      if (error) throw error
      // Skip notification insert - admin will see in return-requests page

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-borrowings'] })
      setIsDetailDialogOpen(false)
    }
  })

  // Request extension mutation
  const requestExtensionMutation = useMutation({
    mutationFn: async ({ transactionId, newDate, reason }: { transactionId: string, newDate: string, reason: string }) => {
      const { error } = await supabase
        .from('borrowing_transactions')
        .update({
          extension_requested: true,
          extension_new_date: newDate,
          extension_reason: reason,
          extension_status: 'pending'
        } as any)
        .eq('id', transactionId)

      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-borrowings'] })
      setIsExtensionDialogOpen(false)
    }
  })

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#ff007a] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat...</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysInfo = (expectedReturnDate: string, status: string) => {
    if (status === 'pending') {
      return { text: 'Menunggu Persetujuan', color: 'text-amber-600', bg: 'bg-amber-50' }
    }
    if (status === 'rejected') {
      return { text: 'Ditolak', color: 'text-red-600', bg: 'bg-red-50' }
    }
    if (status === 'returned') {
      return { text: 'Selesai', color: 'text-gray-500', bg: 'bg-gray-100' }
    }

    const today = new Date()
    const dueDate = new Date(expectedReturnDate)
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} hari terlambat`, color: 'text-red-600', bg: 'bg-red-50' }
    }
    if (diffDays === 0) {
      return { text: 'Hari ini', color: 'text-orange-600', bg: 'bg-orange-50' }
    }
    if (diffDays <= 3) {
      return { text: `${diffDays} hari lagi`, color: 'text-amber-600', bg: 'bg-amber-50' }
    }
    return { text: `${diffDays} hari lagi`, color: 'text-emerald-600', bg: 'bg-emerald-50' }
  }

  const getStatusConfig = (status: string) => {
    const config: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
      pending: {
        label: 'Menunggu',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: <HourglassIcon className="w-3.5 h-3.5" />
      },
      active: {
        label: 'Aktif',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: <Package className="w-3.5 h-3.5" />
      },
      returned: {
        label: 'Dikembalikan',
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        border: 'border-gray-200',
        icon: <CheckCircle className="w-3.5 h-3.5" />
      },
      overdue: {
        label: 'Terlambat',
        color: 'text-red-700',
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: <AlertTriangle className="w-3.5 h-3.5" />
      },
      rejected: {
        label: 'Ditolak',
        color: 'text-red-700',
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: <XCircle className="w-3.5 h-3.5" />
      }
    }
    return config[status] || config.pending
  }

  const handleExtendBorrowing = async (transactionId: string) => {
    const transaction = transactions?.find(t => t.id === transactionId)
    if (!transaction) return

    setSelectedTransaction(transaction)

    // Default 7 days from expected return date
    const defaultDate = new Date(transaction.expected_return_date)
    defaultDate.setDate(defaultDate.getDate() + 7)
    setExtensionDate(defaultDate.toISOString().split('T')[0])
    setExtensionReason('')

    setIsExtensionDialogOpen(true)
  }

  const handleCancelBorrowing = async (transactionId: string) => {
    if (confirm('Batalkan permintaan peminjaman ini?')) {
      cancelBorrowingMutation.mutate(transactionId)
    }
  }

  const handleViewDetails = (transaction: BorrowingTransaction) => {
    setSelectedTransaction(transaction)
    setIsDetailDialogOpen(true)
  }

  const handleDownloadPDF = (transaction: BorrowingTransaction) => {
    // Extract purpose from notes if present (format: [PURPOSE] notes)
    const purposeMatch = transaction.notes?.match(/^\[(\w+)\]/)
    const purpose = purposeMatch ? purposeMatch[1].toLowerCase() : 'lainnya'
    const cleanNotes = transaction.notes?.replace(/^\[\w+\]\s*/, '') || ''

    generateBorrowingLetter({
      id: transaction.id,
      borrowerName: user?.full_name || '',
      borrowerNim: user?.nim || user?.nip || '',
      borrowerDepartment: user?.department || '',
      equipmentName: transaction.equipment?.name || '',
      serialNumber: transaction.equipment?.serial_number || '',
      borrowDate: transaction.borrow_date,
      expectedReturnDate: transaction.expected_return_date,
      purpose: purpose,
      notes: cleanNotes
    })
  }

  const pendingCount = transactions?.filter(t => t.status === 'pending').length || 0
  const activeCount = transactions?.filter(t => t.status === 'active').length || 0
  const overdueCount = transactions?.filter(t => t.status === 'overdue').length || 0
  const returnedCount = transactions?.filter(t => t.status === 'returned').length || 0

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen bg-gradient-to-br from-[#f8f7fc] via-white to-[#fff5f9]">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Peminjaman Saya
          </h1>
          <p className="text-gray-500">Kelola dan pantau peralatan yang Anda pinjam</p>
        </div>
        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogTrigger asChild>
            <button className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-[#ff007a] to-[#ff4d9e] text-white rounded-2xl font-semibold shadow-lg shadow-[rgba(255,0,122,0.3)] hover:shadow-xl hover:shadow-[rgba(255,0,122,0.4)] transition-all flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              Pinjam Peralatan
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-0 rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">Pinjam Peralatan Baru</DialogTitle>
            </DialogHeader>
            <BorrowRequestForm
              onSuccess={() => {
                setIsRequestDialogOpen(false)
                refetch()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* Pending */}
        <div className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-[#ff007a] flex-shrink-0 flex items-center justify-center shadow-lg shadow-[#ff007a]/30">
              <HourglassIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">MENUNGGU</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{pendingCount}</div>
          <div className="text-sm text-amber-600">{pendingCount > 0 ? 'Menunggu persetujuan' : 'Tidak ada'}</div>
        </div>

        {/* Active */}
        <div className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-[#ff007a] flex-shrink-0 flex items-center justify-center shadow-lg shadow-[#ff007a]/30">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">AKTIF</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{activeCount}</div>
          <div className="text-sm text-gray-500">Sedang dipinjam</div>
        </div>

        {/* Overdue */}
        <div className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-[#ff007a] flex-shrink-0 flex items-center justify-center shadow-lg shadow-[#ff007a]/30">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">TERLAMBAT</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{overdueCount}</div>
          <div className="text-sm text-red-500">{overdueCount > 0 ? 'Segera kembalikan' : 'Tidak ada'}</div>
        </div>

        {/* Returned */}
        <div className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-[#ff007a] flex-shrink-0 flex items-center justify-center shadow-lg shadow-[#ff007a]/30">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">SELESAI</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{returnedCount}</div>
          <div className="text-sm text-gray-500">Dikembalikan</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama peralatan atau nomor seri..."
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:bg-white focus:ring-4 focus:ring-[rgba(255,0,122,0.08)] outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.08)] outline-none transition-all text-sm min-w-[150px]"
          >
            <option value="">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="active">Aktif</option>
            <option value="returned">Dikembalikan</option>
            <option value="overdue">Terlambat</option>
          </select>
        </div>
      </div>

      {/* Borrowings Table */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[#ff007a]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#ff007a] border-t-transparent animate-spin"></div>
          </div>
          <div className="text-gray-500 font-medium">Memuat peminjaman...</div>
        </div>
      ) : transactions && transactions.length > 0 ? (
        <div className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-gray-100 min-h-[400px]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 px-6 text-left w-[300px]">
                    <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Peralatan</span>
                  </th>
                  <th className="py-4 px-6 text-center w-[180px] whitespace-nowrap">
                    <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Tgl Pinjam</span>
                  </th>
                  <th className="py-4 px-6 text-center w-[180px] whitespace-nowrap">
                    <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Batas</span>
                  </th>
                  <th className="py-4 px-6 text-center w-[140px] whitespace-nowrap">
                    <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Status</span>
                  </th>
                  <th className="py-4 px-6 text-center w-[220px] whitespace-nowrap">
                    <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((transaction) => {
                  const statusConfig = getStatusConfig(transaction.status)
                  const daysInfo = getDaysInfo(transaction.expected_return_date, transaction.status)

                  return (
                    <tr
                      key={transaction.id}
                      className="group hover:bg-pink-50/10 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${transaction.status === 'pending'
                            ? 'bg-gradient-to-br from-amber-100 to-amber-50'
                            : 'bg-gradient-to-br from-[#ff007a]/10 to-[#ff007a]/5'
                            }`}>
                            {transaction.status === 'pending' ? (
                              <HourglassIcon className="w-5 h-5 text-amber-500" />
                            ) : (
                              <Package className="w-5 h-5 text-[#ff007a]" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                              {transaction.equipment.name}
                              {(transaction.quantity || 1) > 1 && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ff007a] text-white">
                                  ×{transaction.quantity || 1}
                                </span>
                              )}
                            </span>
                            <span className="text-[12px] text-gray-400 font-mono" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                              {transaction.equipment.serial_number}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                          {formatDate(transaction.borrow_date)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                            {formatDate(transaction.expected_return_date)}
                          </span>
                          {transaction.status === 'active' && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 ${daysInfo.bg} ${daysInfo.color}`}>
                              {daysInfo.text}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${statusConfig.bg.replace('bg-', 'bg-').replace('50', '500')}`}
                          />
                          <span className={`text-[14px] font-medium ${statusConfig.color}`} style={{ fontFamily: 'Satoshi, sans-serif' }}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(transaction)}
                            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                            title="Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {transaction.status === 'pending' && (
                            <button
                              onClick={() => handleCancelBorrowing(transaction.id)}
                              disabled={cancelBorrowingMutation.isPending}
                              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                              title="Batalkan"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}

                          {transaction.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleExtendBorrowing(transaction.id)}
                                disabled={requestExtensionMutation.isPending}
                                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors disabled:opacity-50"
                                title="Perpanjang"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDownloadPDF(transaction)}
                                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                                title="Surat Peminjaman"
                              >
                                <FileDown className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {(transaction.status === 'active' || transaction.status === 'overdue') && (
                            transaction.return_requested ? (
                              <span className="p-2 bg-amber-50 text-amber-600 rounded-lg cursor-help" title="Menunggu Konfirmasi Pengembalian">
                                <Clock className="w-4 h-4" />
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedTransaction(transaction)
                                  setIsReturnDialogOpen(true)
                                }}
                                className="p-2 bg-[#ff007a]/10 hover:bg-[#ff007a]/20 text-[#ff007a] rounded-lg transition-colors"
                                title="Kembalikan"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <TablePagination
            currentPage={page}
            totalPages={Math.ceil(totalItems / pageSize)}
            onPageChange={setPage}
            totalItems={totalItems}
            itemsPerPage={pageSize}
            onPageSizeChange={setPageSize}
          />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-[#ff007a]/10 to-[#ff007a]/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-12 h-12 text-[#ff007a]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada peminjaman</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Mulai pinjam peralatan laboratorium yang Anda butuhkan untuk proyek Anda
          </p>
          <button
            onClick={() => setIsRequestDialogOpen(true)}
            className="px-6 py-3.5 bg-gradient-to-r from-[#ff007a] to-[#ff4d9e] text-white rounded-2xl font-semibold shadow-lg shadow-[rgba(255,0,122,0.3)] hover:shadow-xl hover:shadow-[rgba(255,0,122,0.4)] transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Pinjam Peralatan Pertama
          </button>
        </div>
      )
      }

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[500px] border-0 rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Detail Peminjaman</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <>
              {/* Header with gradient */}
              <div className={`p-6 ${selectedTransaction.status === 'pending' ? 'bg-gradient-to-br from-amber-400 to-amber-500' :
                selectedTransaction.status === 'active' ? 'bg-gradient-to-br from-emerald-400 to-emerald-500' :
                  selectedTransaction.status === 'overdue' ? 'bg-gradient-to-br from-red-400 to-red-500' :
                    selectedTransaction.status === 'rejected' ? 'bg-gradient-to-br from-red-400 to-red-500' :
                      'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{selectedTransaction.equipment.name}</h3>
                    <p className="text-white/80 text-sm font-mono">SN: {selectedTransaction.equipment.serial_number}</p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusConfig(selectedTransaction.status).bg} ${getStatusConfig(selectedTransaction.status).color} ${getStatusConfig(selectedTransaction.status).border}`}>
                    {getStatusConfig(selectedTransaction.status).icon}
                    {getStatusConfig(selectedTransaction.status).label}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Kategori</span>
                  <span className="font-medium text-gray-900">{selectedTransaction.equipment.category?.name || '-'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Lokasi</span>
                  <span className="font-medium text-gray-900">{selectedTransaction.equipment.location || '-'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Kondisi</span>
                  <span className="font-medium text-gray-900">{selectedTransaction.equipment.condition || '-'}</span>
                </div>

                <hr className="border-gray-100" />

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Tanggal Pengajuan</span>
                  <span className="font-medium text-gray-900">{formatDate(selectedTransaction.borrow_date)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Batas Pengembalian</span>
                  <span className="font-medium text-gray-900">{formatDate(selectedTransaction.expected_return_date)}</span>
                </div>

                {selectedTransaction.actual_return_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Tanggal Dikembalikan</span>
                    <span className="font-medium text-gray-900">{formatDate(selectedTransaction.actual_return_date)}</span>
                  </div>
                )}

                {selectedTransaction.notes && (
                  <div className="pt-2">
                    <span className="text-gray-500 text-sm block mb-2">Catatan</span>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-xl text-sm">{selectedTransaction.notes}</p>
                  </div>
                )}

                {/* Pending message */}
                {selectedTransaction.status === 'pending' && (
                  <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <HourglassIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-800">
                      Permintaan peminjaman Anda sedang menunggu persetujuan dari admin lab. Anda akan mendapat notifikasi setelah disetujui.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="p-6 pt-0 flex gap-3">
                {selectedTransaction.status === 'pending' && (
                  <button
                    onClick={() => handleCancelBorrowing(selectedTransaction.id)}
                    disabled={cancelBorrowingMutation.isPending}
                    className="flex-1 py-3 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Batalkan Permintaan
                  </button>
                )}
                <button
                  onClick={() => setIsDetailDialogOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Tutup
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Extension Dialog */}
      <Dialog open={isExtensionDialogOpen} onOpenChange={setIsExtensionDialogOpen}>
        <DialogContent className="sm:max-w-[500px] border-0 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Ajukan Perpanjangan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <HourglassIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Pengajuan perpanjangan harus disetujui oleh admin lab. Status akan berubah menjadi "Pending Extension".
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tanggal Pengembalian Baru</label>
              <input
                type="date"
                value={extensionDate}
                onChange={(e) => setExtensionDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.08)] outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Alasan Perpanjangan</label>
              <textarea
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                placeholder="Jelaskan kenapa Anda butuh waktu tambahan..."
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.08)] outline-none transition-all h-32 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsExtensionDialogOpen(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!selectedTransaction) return
                  if (!extensionReason.trim()) {
                    alert('Mohon isi alasan perpanjangan')
                    return
                  }
                  if (!extensionDate) {
                    alert('Mohon pilih tanggal pengembalian baru')
                    return
                  }
                  requestExtensionMutation.mutate({
                    transactionId: selectedTransaction.id,
                    newDate: extensionDate,
                    reason: extensionReason
                  })
                }}
                disabled={requestExtensionMutation.isPending}
                className="flex-1 py-3 bg-gradient-to-r from-[#ff007a] to-[#ff4d9e] text-white rounded-xl font-semibold shadow-lg shadow-[rgba(255,0,122,0.3)] hover:shadow-xl hover:shadow-[rgba(255,0,122,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {requestExtensionMutation.isPending ? 'Mengirim...' : 'Ajukan Perpanjangan'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-0 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Pengembalian Barang</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <EarlyReturnForm
              transaction={selectedTransaction}
              onSuccess={() => {
                setIsReturnDialogOpen(false)
                refetch()
              }}
              onCancel={() => setIsReturnDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div >
  )
}

