'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernInput } from '@/components/ui/modern-input'
import { ModernBadge } from '@/components/ui/modern-badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { Search, Filter, Eye, AlertCircle, Wrench, Calendar, DollarSign, User } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

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
  const [viewingRecord, setViewingRecord] = useState<MaintenanceRecord | null>(null)

  const queryClient = useQueryClient()

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['maintenance-records'] })
  }, [queryClient])

  const { data: maintenanceRecords, isLoading } = useQuery({
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

      if (error) throw error
      return data as unknown as MaintenanceRecord[]
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('maintenance_records').delete().eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] })
    }
  })

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
      deleteMutation.mutate(id)
    }
  }

  const isOverdue = (nextDate: string) => new Date(nextDate) < new Date()

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: id })
  }

  const getStatusBadge = (nextDate: string) => {
    if (isOverdue(nextDate)) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">Terlambat</span>
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-200">Aman</span>
  }

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            Riwayat Pemeliharaan
          </h2>
          <p className="text-gray-500 text-sm mt-1">Daftar lengkap aktivitas pemeliharaan yang telah dilakukan</p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Cari..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#ff007a]/20 focus:border-[#ff007a]"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-2 border-[#ff007a]/20 border-t-[#ff007a] rounded-full animate-spin" />
        </div>
      ) : maintenanceRecords?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Tidak ada data riwayat pemeliharaan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left">Peralatan</th>
                <th className="px-6 py-4 text-left">Tanggal</th>
                <th className="px-6 py-4 text-left">Deskripsi</th>
                <th className="px-6 py-4 text-left">Teknisi</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {maintenanceRecords?.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-bold text-gray-900">{record.equipment?.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{record.equipment?.serial_number}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(record.maintenance_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700 max-w-xs truncate">{record.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4 text-gray-400" />
                      {record.performed_by}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(record.next_maintenance_date)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setViewingRecord(record)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!viewingRecord} onOpenChange={() => setViewingRecord(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl bg-white p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-gray-50/50 border-b border-gray-100">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Wrench className="w-5 h-5 text-[#ff007a]" />
              Detail Pemeliharaan
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Peralatan</label>
                <div className="font-bold text-lg">{viewingRecord?.equipment?.name}</div>
                <div className="text-sm text-gray-500 font-mono">{viewingRecord?.equipment?.serial_number}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Tanggal</label>
                <div className="font-medium">{viewingRecord && formatDate(viewingRecord.maintenance_date)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Teknisi</label>
                <div className="font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  {viewingRecord?.performed_by}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Biaya</label>
                <div className="font-medium flex items-center gap-2 text-green-600">
                  <DollarSign className="w-4 h-4" />
                  Rp{viewingRecord?.cost?.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Deskripsi</label>
              <div className="bg-gray-50 p-4 rounded-xl text-gray-700 text-sm leading-relaxed">
                {viewingRecord?.description}
              </div>
            </div>

            {viewingRecord?.notes && (
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Catatan Tambahan</label>
                <div className="text-sm text-gray-600">
                  {viewingRecord.notes}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}