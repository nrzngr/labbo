'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MaintenanceForm } from './maintenance-form'
import { supabase } from '@/lib/supabase'
import { Search, Filter, Plus, Eye, AlertCircle, Wrench } from 'lucide-react'

interface MaintenanceRecord {
  id: string
  equipment: {
    name: string
    serial_number: string
  }
  maintenance_date: string
  description: string
  cost: number
  performed_by: string
  next_maintenance_date: string
  notes: string
  created_at: string
}

interface Equipment {
  id: string
  name: string
  serial_number: string
  status: string
}

export function MaintenanceList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [viewingRecord, setViewingRecord] = useState<MaintenanceRecord | null>(null)

  const queryClient = useQueryClient()

  // Auto-refetch on mount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['maintenance-records'] })
    queryClient.invalidateQueries({ queryKey: ['equipment'] })
  }, [queryClient])

  const { data: maintenanceRecords, isLoading, refetch, error } = useQuery({
    queryKey: ['maintenance-records', searchTerm, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('maintenance_records')
        .select(`
          *,
          equipment:equipment(name, serial_number)
        `)
        .order('maintenance_date', { ascending: false })

      if (searchTerm) {
        query = query.or(`equipment.name.ilike.%${searchTerm}%,equipment.serial_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,performed_by.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }
      return data as MaintenanceRecord[]
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  const { data: equipment } = useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('maintenance_records').delete().eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] })
    }
  })

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this maintenance record?')) {
      deleteMutation.mutate(id)
    }
  }

  const isOverdue = (nextMaintenanceDate: string) => {
    return new Date(nextMaintenanceDate) < new Date()
  }

  const isUpcoming = (nextMaintenanceDate: string) => {
    const nextDate = new Date(nextMaintenanceDate)
    const today = new Date()
    const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 30 && daysUntil > 0
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getMaintenanceStatusBadge = (nextMaintenanceDate: string) => {
    if (isOverdue(nextMaintenanceDate)) {
      return <Badge variant="destructive">Terlambat</Badge>
    } else if (isUpcoming(nextMaintenanceDate)) {
      return <Badge variant="outline">Akan Datang</Badge>
    } else {
      return <Badge variant="secondary">Terjadwal</Badge>
    }
  }

  // Calculate maintenance statistics
  const stats = {
    total: maintenanceRecords?.length || 0,
    overdue: maintenanceRecords?.filter(r => isOverdue(r.next_maintenance_date)).length || 0,
    upcoming: maintenanceRecords?.filter(r => isUpcoming(r.next_maintenance_date)).length || 0,
    totalCost: maintenanceRecords?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black">PEMELIHARAAN</h1>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <button className="w-full sm:w-auto border border-black px-4 sm:px-6 py-2 sm:py-3 hover:bg-black hover:text-white transition-none text-sm sm:text-base">
              <Plus className="inline w-4 h-4 mr-2" />
              CATAT PEMELIHARAAN
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] border border-black">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">CATAT PEMELIHARAAN</DialogTitle>
            </DialogHeader>
            <MaintenanceForm
              onSuccess={() => {
                setIsAddDialogOpen(false)
                refetch()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-black p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-xs sm:text-sm font-medium">TOTAL CATATAN</span>
            <Wrench className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black mb-2">{stats.total}</div>
          <div className="text-xs sm:text-sm text-gray-600">Semua aktivitas pemeliharaan</div>
        </div>

        <div className="border border-black p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-xs sm:text-sm font-medium">TERLAMBAT</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black mb-2 text-red-600">{stats.overdue}</div>
          <div className="text-xs sm:text-sm text-gray-600">Memerlukan perhatian segera</div>
        </div>

        <div className="border border-black p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-xs sm:text-sm font-medium">AKAN DATANG</span>
            <Wrench className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black mb-2">{stats.upcoming}</div>
          <div className="text-xs sm:text-sm text-gray-600">Jatuh tempo dalam 30 hari</div>
        </div>

        <div className="border border-black p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-xs sm:text-sm font-medium">TOTAL BIAYA</span>
            <span className="text-lg sm:text-xl">Rp</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mb-2">Rp{stats.totalCost.toLocaleString('id-ID')}</div>
          <div className="text-xs sm:text-sm text-gray-600">Biaya pemeliharaan</div>
        </div>
      </div>

      {/* Alert for overdue maintenance */}
      {stats.overdue > 0 && (
        <div className="border border-black p-4 sm:p-6">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
            <span className="font-bold text-sm sm:text-base">PEMELIHARAAN TERLAMBAT</span>
          </div>
          <p className="text-xs sm:text-sm">
            Anda memiliki {stats.overdue} catatan pemeliharaan yang terlambat.
            Harap jadwalkan pemeliharaan sesegera mungkin.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 lg:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4" />
          <Input
            placeholder="Cari catatan pemeliharaan..."
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
          <option value="overdue">Terlambat</option>
          <option value="upcoming">Akan Datang</option>
          <option value="scheduled">Terjadwal</option>
        </select>
      </div>

      {/* Maintenance Records Table */}
      {isLoading ? (
        <div className="border border-black p-8 sm:p-12 text-center">
          <div className="text-base sm:text-lg">Memuat data pemeliharaan...</div>
        </div>
      ) : (
        <div className="border border-black">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-black">
                <tr>
                  <th className="text-left p-4 font-medium">Peralatan</th>
                  <th className="text-left p-4 font-medium">Tanggal Pemeliharaan</th>
                  <th className="text-left p-4 font-medium">Deskripsi</th>
                  <th className="text-left p-4 font-medium">Dilakukan Oleh</th>
                  <th className="text-left p-4 font-medium">Biaya</th>
                  <th className="text-left p-4 font-medium">Pemeliharaan Berikutnya</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-right p-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceRecords?.map((record) => (
                  <tr key={record.id} className="border-t border-black hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{record.equipment?.name || 'Unknown Equipment'}</div>
                        <div className="text-sm text-gray-600 font-mono">{record.equipment?.serial_number}</div>
                      </div>
                    </td>
                    <td className="p-4">{formatDate(record.maintenance_date)}</td>
                    <td className="p-4">
                      <div className="max-w-xs truncate" title={record.description}>
                        {record.description}
                      </div>
                    </td>
                    <td className="p-4">{record.performed_by}</td>
                    <td className="p-4">Rp{record.cost?.toLocaleString('id-ID') || '0'}</td>
                    <td className="p-4">{formatDate(record.next_maintenance_date)}</td>
                    <td className="p-4">{getMaintenanceStatusBadge(record.next_maintenance_date)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setViewingRecord(record)}
                          className="border border-black p-2 hover:bg-black hover:text-white transition-none"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          disabled={deleteMutation.isPending}
                          className="border border-black p-2 hover:bg-red-600 hover:text-white hover:border-red-600 transition-none"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
              {maintenanceRecords?.map((record) => (
                <div key={record.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg truncate">{record.equipment?.name}</h3>
                      <p className="text-sm text-gray-600 font-mono truncate">{record.equipment?.serial_number}</p>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      {getMaintenanceStatusBadge(record.next_maintenance_date)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-sm">Deskripsi:</span>
                      <p className="text-sm truncate">{record.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Tanggal:</span>
                        <p>{formatDate(record.maintenance_date)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Oleh:</span>
                        <p>{record.performed_by}</p>
                      </div>
                      <div>
                        <span className="font-medium">Biaya:</span>
                        <p>Rp{record.cost?.toLocaleString('id-ID') || '0'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Berikutnya:</span>
                        <p>{formatDate(record.next_maintenance_date)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-black">
                    <button
                      onClick={() => setViewingRecord(record)}
                      className="border border-black p-2 hover:bg-black hover:text-white transition-none"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      disabled={deleteMutation.isPending}
                      className="border border-black p-2 hover:bg-red-600 hover:text-white hover:border-red-600 transition-none"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {maintenanceRecords?.length === 0 && (
            <div className="text-center py-8 sm:py-12 px-4">
              <Wrench className="mx-auto w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4" />
              <p className="font-bold text-base sm:text-lg mb-2">Tidak ada catatan pemeliharaan ditemukan</p>
              <p className="text-xs sm:text-sm text-gray-600">Mulai dengan mencatat aktivitas pemeliharaan pertama Anda</p>
            </div>
          )}
        </div>
      )}

      {/* View Dialog */}
      {viewingRecord && (
        <Dialog open={!!viewingRecord} onOpenChange={() => setViewingRecord(null)}>
          <DialogContent className="sm:max-w-[600px] border border-black">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">DETAIL PEMELIHARAAN</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium mb-2">PERALATAN</div>
                  <div className="font-bold">{viewingRecord.equipment?.name}</div>
                  <div className="text-sm text-gray-600 font-mono">{viewingRecord.equipment?.serial_number}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">TANGGAL PEMELIHARAAN</div>
                  <div>{formatDate(viewingRecord.maintenance_date)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">DILAKUKAN OLEH</div>
                  <div>{viewingRecord.performed_by}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">BIAYA</div>
                  <div>Rp{viewingRecord.cost?.toLocaleString('id-ID') || '0'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">PEMELIHARAAN BERIKUTNYA</div>
                  <div>{formatDate(viewingRecord.next_maintenance_date)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">STATUS</div>
                  <div>{getMaintenanceStatusBadge(viewingRecord.next_maintenance_date)}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">DESKRIPSI</div>
                <div>{viewingRecord.description}</div>
              </div>

              {viewingRecord.notes && (
                <div>
                  <div className="text-sm font-medium mb-2">CATATAN</div>
                  <div>{viewingRecord.notes}</div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}