'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { EquipmentForm } from './equipment-form'
import { AdvancedSearch } from './advanced-search'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit, Trash2, Eye, Package } from 'lucide-react'
import { TableSkeleton } from '@/components/ui/loading-skeleton'
import { ModernCard, ModernCardHeader, ModernCardContent } from '@/components/ui/modern-card'
import { ModernBadge } from '@/components/ui/modern-badge'
import { ModernButton } from '@/components/ui/modern-button'
import { TablePagination } from '@/components/ui/pagination'

interface Equipment {
  id: string
  name: string
  description: string
  category?: { name: string }
  category_id: string
  serial_number: string
  condition: string
  status: string
  location: string
  image_url: string
  purchase_date: string
  purchase_price: string
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  name: string
}

interface Filters {
  searchTerm: string
  status: string
  categoryId: string
  condition: string
  location: string
  minPrice: string
  maxPrice: string
  purchaseDateFrom: string
  purchaseDateTo: string
  inMaintenance: boolean
  availableOnly: boolean
}

export function EquipmentList() {
  const [filters, setFilters] = useState<Filters>({
    searchTerm: '',
    status: '',
    categoryId: '',
    condition: '',
    location: '',
    minPrice: '',
    maxPrice: '',
    purchaseDateFrom: '',
    purchaseDateTo: '',
    inMaintenance: false,
    availableOnly: false,
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  const queryClient = useQueryClient()

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['equipment'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
  }, [queryClient])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const { data: equipmentData, isLoading, refetch } = useQuery({
    queryKey: ['equipment', filters, currentPage, pageSize],
    queryFn: async () => {
      let countQuery = supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true })
      if (filters.searchTerm) {
        countQuery = countQuery.or(`name.ilike.%${filters.searchTerm}%,serial_number.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`)
      }
      if (filters.status) countQuery = countQuery.eq('status', filters.status)
      if (filters.categoryId) countQuery = countQuery.eq('category_id', filters.categoryId)
      if (filters.condition) countQuery = countQuery.eq('condition', filters.condition)
      if (filters.location) countQuery = countQuery.ilike('location', `%${filters.location}%`)
      if (filters.minPrice) countQuery = countQuery.gte('purchase_price', parseFloat(filters.minPrice))
      if (filters.maxPrice) countQuery = countQuery.lte('purchase_price', parseFloat(filters.maxPrice))
      if (filters.purchaseDateFrom) countQuery = countQuery.gte('purchase_date', filters.purchaseDateFrom)
      if (filters.purchaseDateTo) countQuery = countQuery.lte('purchase_date', filters.purchaseDateTo)
      if (filters.availableOnly) countQuery = countQuery.eq('status', 'available')
      if (filters.inMaintenance) countQuery = countQuery.eq('status', 'maintenance')

      const { count: totalCount, error: countError } = await countQuery
      if (countError) throw countError

      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('equipment')
        .select('*, categories(name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,serial_number.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`)
      }
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
      if (filters.condition) query = query.eq('condition', filters.condition)
      if (filters.location) query = query.ilike('location', `%${filters.location}%`)
      if (filters.minPrice) query = query.gte('purchase_price', parseFloat(filters.minPrice))
      if (filters.maxPrice) query = query.lte('purchase_price', parseFloat(filters.maxPrice))
      if (filters.purchaseDateFrom) query = query.gte('purchase_date', filters.purchaseDateFrom)
      if (filters.purchaseDateTo) query = query.lte('purchase_date', filters.purchaseDateTo)
      if (filters.availableOnly) query = query.eq('status', 'available')
      if (filters.inMaintenance) query = query.eq('status', 'maintenance')

      const { data, error } = await query

      if (error) {
        throw error
      }

      return {
        equipment: data as Equipment[],
        totalCount: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / pageSize)
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  const equipment = equipmentData?.equipment || []
  const totalCount = equipmentData?.totalCount || 0
  const totalPages = equipmentData?.totalPages || 0

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')


      if (error) {
        throw error
      }
      return data as Category[]
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('equipment').delete().eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
    }
  })

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus peralatan ini?')) {
      deleteMutation.mutate(id)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "default" | "warning" | "destructive"> = {
      available: 'success',
      borrowed: 'default',
      maintenance: 'warning',
      lost: 'destructive'
    }

    const statusLabels: Record<string, string> = {
      available: 'Tersedia',
      borrowed: 'Dipinjam',
      maintenance: 'Dalam Pemeliharaan',
      lost: 'Hilang'
    }

    return <ModernBadge variant={variants[status] || 'default'} size="sm">{statusLabels[status] || status}</ModernBadge>
  }

  const getConditionBadge = (condition: string) => {
    const variants: Record<string, "success" | "default" | "warning" | "destructive"> = {
      excellent: 'success',
      good: 'default',
      fair: 'warning',
      poor: 'destructive'
    }

    const conditionLabels: Record<string, string> = {
      excellent: 'Sangat Baik',
      good: 'Baik',
      fair: 'Cukup Baik',
      poor: 'Rusak'
    }

    return <ModernBadge variant={variants[condition] || 'default'} size="sm">{conditionLabels[condition] || condition}</ModernBadge>
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="lg:hidden flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <ModernButton
              variant="default"
              size="lg"
              fullWidth
              className="w-full button-hover-lift"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Equipment
            </ModernButton>
          </DialogTrigger>
          <DialogContent className="border-2 border-black rounded-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">Tambah Peralatan Baru</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <EquipmentForm
                onSuccess={() => {
                  setIsAddDialogOpen(false)
                  refetch()
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

    <AdvancedSearch
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories || []}
      />

    {isLoading ? (
        <div className="bg-white rounded-2xl border-2 border-black p-6 lg:p-8">
          <TableSkeleton rows={8} columns={7} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-black overflow-hidden">
          {equipment?.length === 0 ? (
            <div className="text-center py-12 lg:py-16 px-6">
              <Package className="mx-auto w-16 h-16 lg:w-20 lg:h-20 mb-6 text-gray-400" />
              <h3 className="font-bold text-lg lg:text-xl text-gray-700 mb-3">Tidak Ada Peralatan Ditemukan</h3>
              <p className="text-sm lg:text-base text-gray-500 mb-6">Coba sesuaikan pencarian atau filter Anda</p>
              <ModernButton
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({
                    searchTerm: '',
                    status: '',
                    categoryId: '',
                    condition: '',
                    location: '',
                    minPrice: '',
                    maxPrice: '',
                    purchaseDateFrom: '',
                    purchaseDateTo: '',
                    inMaintenance: false,
                    availableOnly: false,
                  })
                }}
                className="mx-auto"
              >
                Hapus Filter
              </ModernButton>
            </div>
          ) : (
            <div className="divide-y divide-black">
              {equipment?.map((item) => (
                <div key={item.id} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 lg:gap-4 mb-4 lg:mb-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-2 lg:mb-3">
                        <h3 className="font-semibold text-base lg:text-lg xl:text-xl truncate">{item.name}</h3>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(item.status)}
                        </div>
                      </div>
                      {item.description && (
                        <p className="text-sm lg:text-base text-gray-600 line-clamp-2">{item.description}</p>
                      )}
                    </div>

                                    <div className="flex gap-1 lg:gap-2">
                      <button
                        onClick={() => setViewingEquipment(item)}
                        className="border border-black p-2 lg:p-2.5 hover:bg-black hover:text-white transition-none rounded-lg"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 lg:w-5 lg:h-5" />
                      </button>
                      <button
                        onClick={() => setEditingEquipment(item)}
                        className="border border-black p-2 lg:p-2.5 hover:bg-black hover:text-white transition-none rounded-lg"
                        title="Edit equipment"
                      >
                        <Edit className="w-4 h-4 lg:w-5 lg:h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                        className="border border-black p-2 lg:p-2.5 hover:bg-red-600 hover:text-white hover:border-red-600 transition-none rounded-lg"
                        title="Delete equipment"
                      >
                        <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
                      </button>
                    </div>
                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                    <div className="space-y-1">
                      <span className="text-xs lg:text-sm font-medium text-gray-500 uppercase tracking-wider">Category</span>
                      <p className="text-sm lg:text-base font-medium truncate" title={item.category?.name || 'Uncategorized'}>
                        {item.category?.name || 'Uncategorized'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs lg:text-sm font-medium text-gray-500 uppercase tracking-wider">Serial Number</span>
                      <p className="text-sm lg:text-base font-mono truncate" title={item.serial_number}>
                        {item.serial_number}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs lg:text-sm font-medium text-gray-500 uppercase tracking-wider">Condition</span>
                      <div>{getConditionBadge(item.condition)}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs lg:text-sm font-medium text-gray-500 uppercase tracking-wider">Location</span>
                      <p className="text-sm lg:text-base font-medium truncate" title={item.location}>
                        {item.location}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editingEquipment && (
        <Dialog open={!!editingEquipment} onOpenChange={() => setEditingEquipment(null)}>
          <DialogContent className="sm:max-w-[600px] border-2 border-black rounded-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-xl font-bold">Ubah Peralatan</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <EquipmentForm
                equipment={editingEquipment}
                onSuccess={() => {
                  setEditingEquipment(null)
                  refetch()
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {viewingEquipment && (
        <Dialog open={!!viewingEquipment} onOpenChange={() => setViewingEquipment(null)}>
          <DialogContent className="sm:max-w-[600px] border-2 border-black rounded-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-xl font-bold">Detail Peralatan</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <div className="text-sm font-medium mb-2 text-gray-600 uppercase tracking-wider">Nama</div>
                  <div className="font-medium">{viewingEquipment.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2 text-gray-600 uppercase tracking-wider">Nomor Seri</div>
                  <div className="font-mono">{viewingEquipment.serial_number}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2 text-gray-600 uppercase tracking-wider">Kategori</div>
                  <div>{viewingEquipment.category?.name || 'Tidak Berkategori'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2 text-gray-600 uppercase tracking-wider">Lokasi</div>
                  <div>{viewingEquipment.location}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2 text-gray-600 uppercase tracking-wider">Kondisi</div>
                  <div>{getConditionBadge(viewingEquipment.condition)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2 text-gray-600 uppercase tracking-wider">Status</div>
                  <div>{getStatusBadge(viewingEquipment.status)}</div>
                </div>
              </div>

              {viewingEquipment.description && (
                <div>
                  <div className="text-sm font-medium mb-2 text-gray-600 uppercase tracking-wider">Deskripsi</div>
                  <div className="text-gray-700">{viewingEquipment.description}</div>
                </div>
              )}

              {viewingEquipment.image_url && (
                <div>
                  <div className="text-sm font-medium mb-2 text-gray-600 uppercase tracking-wider">Gambar</div>
                  <div className="border border-black rounded-xl overflow-hidden">
                    <img
                      src={viewingEquipment.image_url}
                      alt={viewingEquipment.name}
                      className="w-full h-48 sm:h-64 object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  )
}