'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { TransactionForm } from './transaction-form'
import { supabase } from '@/lib/supabase'
import { Search, Filter, Plus, Eye, RotateCcw } from 'lucide-react'

interface Transaction {
  id: string
  user: {
    full_name: string
    email: string
    role: string
  }
  equipment: {
    name: string
    serial_number: string
  }
  borrow_date: string
  expected_return_date: string
  actual_return_date: string | null
  status: string
  notes: string
  created_at: string
}

interface User {
  id: string
  full_name: string
  email: string
  role: string
}

interface Equipment {
  id: string
  name: string
  serial_number: string
  status: string
}

export function TransactionList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null)

  const queryClient = useQueryClient()

  // Auto-refetch on mount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['users'] })
    queryClient.invalidateQueries({ queryKey: ['available-equipment'] })
  }, [queryClient])

  const { data: transactions, isLoading, refetch, error } = useQuery({
    queryKey: ['transactions', searchTerm, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('borrowing_transactions')
        .select(`
          *,
          user:user_profiles(full_name, email, role),
          equipment:equipment(name, serial_number, status)
        `)
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`user.full_name.ilike.%${searchTerm}%,equipment.name.ilike.%${searchTerm}%,equipment.serial_number.ilike.%${searchTerm}%`)
      }

      if (filterStatus) {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }
      return data as Transaction[]
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('full_name')


      if (error) {
        throw error
      }
      return data as User[]
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  const { data: availableEquipment } = useQuery({
    queryKey: ['available-equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('status', 'available')
        .order('name')


      if (error) {
        throw error
      }
      return data as Equipment[]
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  const returnMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const now = new Date().toISOString()

      // Update transaction
      const { error: transactionError } = await supabase
        .from('borrowing_transactions')
        .update({
          status: 'returned',
          actual_return_date: now
        })
        .eq('id', transactionId)

      if (transactionError) throw transactionError

      // Get equipment ID from the transaction
      const { data: transaction } = await supabase
        .from('borrowing_transactions')
        .select('equipment_id')
        .eq('id', transactionId)
        .single()

      if (transaction) {
        // Update equipment status back to available
        await supabase
          .from('equipment')
          .update({ status: 'available' })
          .eq('id', transaction.equipment_id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
    }
  })

  const handleReturn = async (transactionId: string) => {
    if (confirm('Are you sure you want to mark this item as returned?')) {
      returnMutation.mutate(transactionId)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: 'default',
      returned: 'secondary',
      overdue: 'destructive'
    }

    const statusLabels: Record<string, string> = {
      active: 'Aktif',
      returned: 'Dikembalikan',
      overdue: 'Terlambat'
    }

    return <Badge variant={variants[status] || 'outline'}>{statusLabels[status] || status}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = (expectedReturnDate: string, actualReturnDate: string | null) => {
    if (actualReturnDate) return false
    return new Date(expectedReturnDate) < new Date()
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black">TRANSAKSI</h1>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <button className="w-full sm:w-auto border border-black px-4 sm:px-6 py-2 sm:py-3 hover:bg-black hover:text-white transition-none text-sm sm:text-base">
              <Plus className="inline w-4 h-4 mr-2" />
              PINJAM BARU
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] border border-black">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">PINJAM BARU</DialogTitle>
            </DialogHeader>
            <TransactionForm
              onSuccess={() => {
                setIsAddDialogOpen(false)
                refetch()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 lg:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4" />
          <Input
            placeholder="Cari transaksi..."
            className="pl-10 border border-black focus:ring-0 focus:border-black h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 sm:px-4 py-3 border border-black focus:ring-0 focus:border-black min-w-[120px] sm:min-w-[150px] h-12 text-sm"
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="returned">Dikembalikan</option>
          <option value="overdue">Terlambat</option>
        </select>
      </div>

      {/* Transactions Table */}
      {isLoading ? (
        <div className="border border-black p-8 sm:p-12 text-center">
          <div className="text-base sm:text-lg">Memuat data transaksi...</div>
        </div>
      ) : (
        <div className="border border-black">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-black">
                <tr>
                  <th className="text-left p-4 font-medium">Peminjam</th>
                  <th className="text-left p-4 font-medium">Peralatan</th>
                  <th className="text-left p-4 font-medium">Tanggal Pinjam</th>
                  <th className="text-left p-4 font-medium">Batas Kembali</th>
                  <th className="text-left p-4 font-medium">Tanggal Kembali</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-right p-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transactions?.map((transaction) => (
                  <tr key={transaction.id} className="border-t border-black hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{transaction.user?.full_name || 'Unknown'}</div>
                        <div className="text-sm text-gray-600">{transaction.user?.email}</div>
                        <div className="text-xs text-gray-500 capitalize">{transaction.user?.role}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{transaction.equipment?.name || 'Unknown Equipment'}</div>
                        <div className="text-sm text-gray-600 font-mono">{transaction.equipment?.serial_number}</div>
                      </div>
                    </td>
                    <td className="p-4">{formatDate(transaction.borrow_date)}</td>
                    <td className="p-4">
                      <div className={isOverdue(transaction.expected_return_date, transaction.actual_return_date) ? 'text-red-600 font-bold' : ''}>
                        {formatDate(transaction.expected_return_date)}
                        {isOverdue(transaction.expected_return_date, transaction.actual_return_date) && (
                          <div className="text-xs font-bold">TERLAMBAT</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {transaction.actual_return_date ? formatDate(transaction.actual_return_date) : '-'}
                    </td>
                    <td className="p-4">{getStatusBadge(transaction.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setViewingTransaction(transaction)}
                          className="border border-black p-2 hover:bg-black hover:text-white transition-none"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {transaction.status === 'active' && (
                          <button
                            onClick={() => handleReturn(transaction.id)}
                            disabled={returnMutation.isPending}
                            className="border border-black p-2 hover:bg-black hover:text-white transition-none"
                            title="Tandai sebagai dikembalikan"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden">
            <div className="divide-y divide-black">
              {transactions?.map((transaction) => (
                <div key={transaction.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg truncate">{transaction.user?.full_name}</h3>
                      <p className="text-sm text-gray-600 truncate">{transaction.user?.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{transaction.user?.role}</p>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-sm">Peralatan:</span>
                      <p className="font-medium">{transaction.equipment?.name}</p>
                      <p className="text-sm text-gray-600 font-mono">{transaction.equipment?.serial_number}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Pinjam:</span>
                        <p>{formatDate(transaction.borrow_date)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Kembali:</span>
                        <p>{transaction.actual_return_date ? formatDate(transaction.actual_return_date) : '-'}</p>
                      </div>
                    </div>

                    <div>
                      <span className="font-medium text-sm">Batas Kembali:</span>
                      <div className={isOverdue(transaction.expected_return_date, transaction.actual_return_date) ? 'text-red-600 font-bold' : ''}>
                        <p>{formatDate(transaction.expected_return_date)}</p>
                        {isOverdue(transaction.expected_return_date, transaction.actual_return_date) && (
                          <div className="text-xs font-bold">TERLAMBAT</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-black">
                    <button
                      onClick={() => setViewingTransaction(transaction)}
                      className="border border-black p-2 hover:bg-black hover:text-white transition-none"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {transaction.status === 'active' && (
                      <button
                        onClick={() => handleReturn(transaction.id)}
                        disabled={returnMutation.isPending}
                        className="border border-black p-2 hover:bg-black hover:text-white transition-none"
                        title="Tandai sebagai dikembalikan"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {transactions?.length === 0 && (
            <div className="text-center py-8 sm:py-12 px-4">
              <p className="font-bold text-base sm:text-lg mb-2">Tidak ada transaksi ditemukan</p>
              <p className="text-xs sm:text-sm text-gray-600">Coba sesuaikan pencarian atau filter Anda</p>
            </div>
          )}
        </div>
      )}

      {/* View Dialog */}
      {viewingTransaction && (
        <Dialog open={!!viewingTransaction} onOpenChange={() => setViewingTransaction(null)}>
          <DialogContent className="sm:max-w-[600px] border border-black">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">DETAIL TRANSAKSI</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium mb-2">PEMINJAM</div>
                  <div className="font-bold">{viewingTransaction.user?.full_name}</div>
                  <div className="text-sm text-gray-600">{viewingTransaction.user?.email}</div>
                  <div className="text-xs text-gray-500 capitalize">{viewingTransaction.user?.role}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">PERALATAN</div>
                  <div className="font-bold">{viewingTransaction.equipment?.name}</div>
                  <div className="text-sm text-gray-600 font-mono">{viewingTransaction.equipment?.serial_number}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">TANGGAL PINJAM</div>
                  <div>{formatDate(viewingTransaction.borrow_date)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">BATAS KEMBALI</div>
                  <div>{formatDate(viewingTransaction.expected_return_date)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">TANGGAL KEMBALI</div>
                  <div>
                    {viewingTransaction.actual_return_date ? formatDate(viewingTransaction.actual_return_date) : 'Belum dikembalikan'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">STATUS</div>
                  <div>{getStatusBadge(viewingTransaction.status)}</div>
                </div>
              </div>

              {viewingTransaction.notes && (
                <div>
                  <div className="text-sm font-medium mb-2">CATATAN</div>
                  <div>{viewingTransaction.notes}</div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}