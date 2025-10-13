'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCustomAuth } from "@/components/auth/custom-auth-provider"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from "@/components/ui/badge"
import { Package, Calendar, Clock, AlertTriangle, CheckCircle, RefreshCw, Search } from "lucide-react"
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ModernCard, ModernCardHeader, ModernCardContent } from '@/components/ui/modern-card'
import { ModernBadge } from '@/components/ui/modern-badge'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernInput } from '@/components/ui/modern-input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BorrowRequestForm } from '@/components/student/borrow-request-form'

interface BorrowingTransaction {
  id: string
  equipment: {
    id: string
    name: string
    serial_number: string
    category?: { name: string }
  }
  borrow_date: string
  expected_return_date: string
  actual_return_date: string | null
  status: 'active' | 'returned' | 'overdue'
  notes?: string
}

export default function MyBorrowingsPage() {
  const { user } = useCustomAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)

  const queryClient = useQueryClient()

  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['my-borrowings', searchTerm, statusFilter],
    queryFn: async () => {
      if (!user) return []

      let query = supabase
        .from('borrowing_transactions')
        .select(`
          *,
          equipment:equipment(id, name, serial_number, categories(name))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`equipment.name.ilike.%${searchTerm}%,equipment.serial_number.ilike.%${searchTerm}%`)
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error

      return data?.map((transaction: any) => {
        let status: 'active' | 'returned' | 'overdue' = transaction.status as 'active' | 'returned'

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

  const extendBorrowingMutation = useMutation({
    mutationFn: async ({ transactionId, newReturnDate }: { transactionId: string, newReturnDate: string }) => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return { success: true }
      } catch (error) {
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-borrowings'] })
    }
  })

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Please log in to continue...</div>
        </div>
      </DashboardLayout>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string, expectedReturnDate: string) => {
    const isOverdue = status === 'active' && new Date(expectedReturnDate) < new Date()

    if (isOverdue) {
      return <ModernBadge variant="destructive" size="sm">Overdue</ModernBadge>
    }

    const variants: Record<string, "default" | "success" | "warning" | "destructive"> = {
      active: 'success',
      returned: 'default'
    }

    const statusLabels: Record<string, string> = {
      active: 'Active',
      returned: 'Returned'
    }

    return <ModernBadge variant={variants[status] || 'default'} size="sm">{statusLabels[status] || status}</ModernBadge>
  }

  const getDaysLeft = (expectedReturnDate: string) => {
    const today = new Date()
    const dueDate = new Date(expectedReturnDate)
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: `${Math.abs(diffDays)} days overdue`, color: 'text-red-600' }
    if (diffDays === 0) return { text: 'Due today', color: 'text-orange-600' }
    if (diffDays <= 3) return { text: `${diffDays} days left`, color: 'text-yellow-600' }
    return { text: `${diffDays} days left`, color: 'text-green-600' }
  }

  const handleExtendBorrowing = async (transactionId: string) => {
    const transaction = transactions?.find(t => t.id === transactionId)
    if (!transaction) return

    const currentDate = new Date()
    const newReturnDate = new Date(transaction.expected_return_date)
    newReturnDate.setDate(newReturnDate.getDate() + 7) // Extend by 7 days

    if (confirm('Do you want to extend this borrowing by 7 days?')) {
      extendBorrowingMutation.mutate({
        transactionId,
        newReturnDate: newReturnDate.toISOString().split('T')[0]
      })
    }
  }

  const activeCount = transactions?.filter(t => t.status === 'active').length || 0
  const overdueCount = transactions?.filter(t => t.status === 'overdue').length || 0
  const returnedCount = transactions?.filter(t => t.status === 'returned').length || 0

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 page-gradient min-h-screen">
        {/* Header */}
        <ModernCard variant="elevated" padding="lg" className="mb-6 sm:mb-8 fade-in">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 mb-1 sm:mb-2">
                My Borrowings
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Track your equipment borrowing history</p>
            </div>
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
              <DialogTrigger asChild>
                <ModernButton
                  variant="default"
                  size="lg"
                  leftIcon={<Package className="w-5 h-5" />}
                  className="w-full sm:w-auto button-hover-lift"
                >
                  New Borrow Request
                </ModernButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] border-2 border-black rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">Request New Equipment</DialogTitle>
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
        </ModernCard>

        {/* Stats Overview */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Active</span>
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-xl">
                <Package className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">{activeCount}</div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Currently borrowed</div>
          </ModernCard>

          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Overdue</span>
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-xl">
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">{overdueCount}</div>
            <div className="text-xs sm:text-sm text-red-600 font-medium">
              {overdueCount > 0 ? 'Return immediately' : 'All clear'}
            </div>
          </ModernCard>

          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Returned</span>
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-xl">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">{returnedCount}</div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Completed</div>
          </ModernCard>

          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Total</span>
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-xl">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">{transactions?.length || 0}</div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">All time</div>
          </ModernCard>
        </div>

        {/* Filters */}
        <ModernCard variant="default" padding="sm" className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <ModernInput
                placeholder="Search equipment name or serial number..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-black focus:ring-0 focus:border-black min-w-[120px] sm:min-w-[150px] text-sm bg-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="returned">Returned</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </ModernCard>

        {/* Transactions List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-lg font-medium">Loading borrowings...</div>
          </div>
        ) : (
          <ModernCard variant="default" padding="none">
            {transactions && transactions.length > 0 ? (
              <div className="divide-y divide-black">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg sm:text-xl mb-1 truncate">{transaction.equipment.name}</h3>
                            <div className="space-y-1 sm:space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm">
                                <span className="text-gray-600">
                                  Serial: <span className="font-mono">{transaction.equipment.serial_number}</span>
                                </span>
                                <span className="text-gray-600">
                                  Category: {transaction.equipment.category?.name || 'Uncategorized'}
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm">
                                <span className="text-gray-600">
                                  Borrowed: {formatDate(transaction.borrow_date)}
                                </span>
                                <span className="text-gray-600">
                                  Due: {formatDate(transaction.expected_return_date)}
                                </span>
                                {transaction.actual_return_date && (
                                  <span className="text-gray-600">
                                    Returned: {formatDate(transaction.actual_return_date)}
                                  </span>
                                )}
                              </div>
                              {transaction.notes && (
                                <div className="text-xs sm:text-sm text-gray-600">
                                  Notes: {transaction.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex flex-col items-start sm:items-center gap-2">
                          {getStatusBadge(transaction.status, transaction.expected_return_date)}
                          {transaction.status === 'active' && (
                            <span className={`text-xs font-medium ${getDaysLeft(transaction.expected_return_date).color}`}>
                              {getDaysLeft(transaction.expected_return_date).text}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {transaction.status === 'active' && (
                            <ModernButton
                              variant="outline"
                              size="sm"
                              leftIcon={<RefreshCw className="w-4 h-4" />}
                              onClick={() => handleExtendBorrowing(transaction.id)}
                              disabled={extendBorrowingMutation.isPending}
                              className="text-xs sm:text-sm"
                            >
                              Extend
                            </ModernButton>
                          )}
                          <ModernButton
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/equipment?item=${transaction.equipment.id}`)}
                            className="text-xs sm:text-sm"
                          >
                            View Details
                          </ModernButton>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16 px-4">
                <Package className="mx-auto w-12 h-12 sm:w-16 sm:h-16 mb-4 text-gray-400" />
                <h3 className="font-bold text-lg sm:text-xl text-gray-700 mb-2">No borrowing history found</h3>
                <p className="text-sm text-gray-600 mb-6">Start by requesting your first equipment borrow</p>
                <ModernButton
                  variant="default"
                  size="lg"
                  leftIcon={<Package className="w-5 h-5" />}
                  onClick={() => setIsRequestDialogOpen(true)}
                >
                  Request Equipment
                </ModernButton>
              </div>
            )}
          </ModernCard>
        )}
      </div>
    </DashboardLayout>
  )
}