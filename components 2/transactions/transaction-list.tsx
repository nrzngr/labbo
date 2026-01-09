'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Search,
  ChevronDown,
  Package,
  AlertTriangle
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ModernButton } from '@/components/ui/modern-button'
import { TransactionItemCard } from '@/components/transactions/transaction-item-card'
import { ModernCard } from '@/components/ui/modern-card'
import { ExportDropdown } from '@/components/common/ExportDropdown'

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
    nim: string | null
  } | null
  equipment: {
    name: string
    serial_number: string
  } | null
}

import { TablePagination } from '@/components/ui/pagination'

export function TransactionList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions', searchTerm, filterStatus, currentPage, pageSize],
    queryFn: async () => {
      // First get basic query for count and pagination
      let baseQuery = supabase
        .from('borrowing_transactions')
        .select('*', { count: 'exact', head: true })

      if (filterStatus) {
        baseQuery = baseQuery.eq('status', filterStatus as any)
      }

      // We cannot easily do deep string search in count query without joining again or denormalizing
      // For now, let's keep search client side for small datasets or assume basic filtering
      // To strictly support server side search with relations, we'd need RPC or View

      // Actual data fetch
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
          user:users!borrowing_transactions_user_id_fkey(full_name, email, role, nim),
          equipment:equipment!borrowing_transactions_equipment_id_fkey(name, serial_number)
        `)
        .order('created_at', { ascending: false })

      if (filterStatus) {
        query = query.eq('status', filterStatus as any)
      }

      // If search term is present, we might need to filter after fetch if we don't want to complicate query
      // OR better, do a best-effort server side filter if possible.
      // Since relationships are involved, text search is tricky.
      // Let's implement pagination on the fetched set if searching to keep it consistent, 
      // or just paginate normally and filter results (which might result in empty pages).
      // A common pattern with Supabase for complex search is to just paginate the main table.

      const { count } = await baseQuery

      // If we are searching, we unfortunately might need to fetch more to filter.
      // But for "server-side pagination" requested, we should apply range.
      // Let's apply range logic.
      if (!searchTerm) {
        query = query.range((currentPage - 1) * pageSize, currentPage * pageSize - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Query error:', error)
        throw error
      }

      let result = (data || []) as Transaction[]
      let totalCount = count || 0

      // Client-side filtering for search term if present
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const allDataForSearch = await supabase
          .from('borrowing_transactions')
          .select(`
              *,
              user:users!borrowing_transactions_user_id_fkey(full_name, email),
              equipment:equipment!borrowing_transactions_equipment_id_fkey(name, serial_number)
           `)
          .order('created_at', { ascending: false })

        if (allDataForSearch.data) {
          const filtered = (allDataForSearch.data as unknown as Transaction[]).filter(t =>
            t.user?.full_name?.toLowerCase().includes(search) ||
            t.user?.email?.toLowerCase().includes(search) ||
            t.equipment?.name?.toLowerCase().includes(search) ||
            t.equipment?.serial_number?.toLowerCase().includes(search)
          )
          totalCount = filtered.length
          result = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        }
      }

      return { data: result, totalCount }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-4 border-pink-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-500 font-medium">Memuat transaksi...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-100">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-600 font-bold">Gagal memuat data</p>
        <p className="text-red-500 text-sm">{(error as Error).message}</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Header Toolbar */}
        <div className="p-6 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Daftar Transaksi</h2>
              <p className="text-sm text-gray-500">{transactions?.totalCount || 0} transaksi ditemukan</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#ff007a] transition-colors" />
              <input
                type="text"
                placeholder="Cari user, alat, atau info transaksi..."
                className="w-full pl-12 h-11 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-[#ff007a] focus:ring-[#ff007a]/20 transition-all text-sm outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none w-full sm:w-48 px-4 pl-4 pr-10 h-11 bg-white border border-gray-200 rounded-xl focus:border-[#ff007a] focus:ring-[#ff007a]/20 outline-none transition-all text-sm font-medium cursor-pointer"
              >
                <option value="">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="active">Aktif</option>
                <option value="returned">Dikembalikan</option>
                <option value="rejected">Ditolak</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <ExportDropdown
              data={transactions?.data || []}
              columns={[
                { header: 'Peminjam', key: 'user', formatter: (u: any) => u?.full_name || '-' },
                { header: 'Peralatan', key: 'equipment', formatter: (e: any) => e?.name || '-' },
                { header: 'No. Seri', key: 'equipment', formatter: (e: any) => e?.serial_number || '-' },
                { header: 'Tgl Pinjam', key: 'borrow_date', formatter: (d: any) => d ? new Date(d).toLocaleDateString('id-ID') : '-' },
                { header: 'Batas Kembali', key: 'expected_return_date', formatter: (d: any) => d ? new Date(d).toLocaleDateString('id-ID') : '-' },
                { header: 'Aktual Kembali', key: 'actual_return_date', formatter: (d: any) => d ? new Date(d).toLocaleDateString('id-ID') : '-' },
                { header: 'Status', key: 'status' },
                { header: 'Catatan', key: 'notes' },
              ]}
              filename="Data_Transaksi_Labbo"
              title="Laporan Transaksi Peminjaman"
            />
          </div>
        </div>

        {/* Transaction Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-4 px-6 w-[50px]">
                  <div className="w-[18px] h-[18px] border-[1.5px] border-[#FD1278] rounded-[5px] flex items-center justify-center cursor-pointer">
                    {/* Header Checkbox (static for now) */}
                  </div>
                </th>
                <th className="py-4 px-6 text-left">
                  <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Barang</span>
                </th>
                <th className="py-4 px-6 text-center w-[100px]">
                  <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Jumlah</span>
                </th>
                <th className="py-4 px-6 text-center w-[150px]">
                  <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Tanggal Pinjam</span>
                </th>
                <th className="py-4 px-6 text-center w-[150px]">
                  <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Tanggal Kembali</span>
                </th>
                <th className="py-4 px-6 text-center w-[150px]">
                  <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Status</span>
                </th>
                <th className="py-4 px-6 text-center w-[150px]">
                  <span className="text-[12px] font-medium uppercase text-[#A09FA2] tracking-wider" style={{ fontFamily: 'Satoshi, sans-serif' }}>Keterangan</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions?.data && transactions.data.length > 0 ? (
                transactions.data.map((transaction) => {
                  // Determine Status Display
                  let statusDotColor = '#FFEE35'; // Default Yellow (Masih Dipinjam)
                  let statusText = 'Masih Dipinjam';

                  if (transaction.status === 'returned') {
                    statusDotColor = '#3AFB57'; // Green
                    statusText = 'Dikembalikan';
                  } else if (transaction.status === 'overdue' || (transaction.status === 'active' && new Date(transaction.expected_return_date) < new Date())) {
                    statusDotColor = '#FF6666'; // Red
                    statusText = 'Telat';
                  }

                  // Determine Keterangan
                  let keteranganText = 'AMAN';
                  if (statusText === 'Telat') {
                    keteranganText = 'DIKENAKAN DENDA';
                  }

                  return (
                    <tr
                      key={transaction.id}
                      onClick={() => setViewingTransaction(transaction)}
                      className="group hover:bg-pink-50/10 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6">
                        <div className="w-[18px] h-[18px] border-[1.125px] border-[#FD1278] rounded-[5px] flex items-center justify-center bg-[#F9FBFC] group-hover:bg-white transition-colors">
                          {/* Row Checkbox */}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                            {transaction.equipment?.name || 'Unknown Item'}
                          </span>
                          <span className="text-[12px] text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                            {transaction.equipment?.serial_number}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                          1
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                            {formatDate(transaction.borrow_date)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                            {formatDate(transaction.expected_return_date)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className="w-[12px] h-[12px] rounded-full shadow-sm"
                            style={{ backgroundColor: statusDotColor }}
                          />
                          <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                            {statusText}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-[14px] font-medium text-[#6E6E6E]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                          {keteranganText}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>Tidak Ada Transaksi</h3>
                      <p className="text-gray-400 text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>Belum ada data peminjaman yang ditemukan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {transactions && transactions.totalCount > 0 && (
          <div className="p-4 border-t border-gray-100 bg-white">
            <TablePagination
              currentPage={currentPage}
              totalPages={Math.ceil(transactions.totalCount / pageSize)}
              onPageChange={setCurrentPage}
              totalItems={transactions.totalCount}
              itemsPerPage={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!viewingTransaction} onOpenChange={() => setViewingTransaction(null)}>
        <DialogContent className="max-w-lg rounded-[24px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-gray-50 border-b border-gray-100">
            <DialogTitle className="text-xl font-black text-gray-900">Detail Transaksi</DialogTitle>
          </DialogHeader>
          {viewingTransaction && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 block">Peminjam</label>
                  <p className="font-bold text-gray-900">
                    {viewingTransaction.user?.full_name || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {viewingTransaction.user?.email || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 block">Peralatan</label>
                  <p className="font-bold text-gray-900">
                    {viewingTransaction.equipment?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-user-500 font-mono mt-0.5 text-gray-500">
                    {viewingTransaction.equipment?.serial_number || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 block">Tanggal Pinjam</label>
                  <p className="font-medium text-gray-900">
                    {formatDate(viewingTransaction.borrow_date)}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 block">Batas Kembali</label>
                  <p className="font-medium text-gray-900">
                    {formatDate(viewingTransaction.expected_return_date)}
                  </p>
                </div>
                {viewingTransaction.actual_return_date && (
                  <div className="col-span-2">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 block">Dikembalikan Pada</label>
                    <p className="font-bold text-green-600">
                      {formatDate(viewingTransaction.actual_return_date)}
                    </p>
                  </div>
                )}
              </div>

              {viewingTransaction.notes && (
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 block">Catatan</label>
                  <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-sm text-yellow-800 font-medium">
                    {viewingTransaction.notes}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <ModernButton
                  variant="outline"
                  fullWidth
                  onClick={() => setViewingTransaction(null)}
                  className="h-12 rounded-xl"
                >
                  Tutup
                </ModernButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}