'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { EquipmentForm } from './equipment-form'
import { EquipmentDetailModal } from './equipment-detail-modal'
import { AdvancedSearch } from './advanced-search'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit, Trash2, Eye, Package } from 'lucide-react'
import { EquipmentItemCard } from './equipment-item-card'
import { EquipmentGridCard } from './equipment-grid-card'
import { TableSkeleton } from '@/components/ui/loading-skeleton'
import { ModernCard, ModernCardHeader, ModernCardContent } from '@/components/ui/modern-card'
import { ModernBadge } from '@/components/ui/modern-badge'
import { ModernButton } from '@/components/ui/modern-button'
import { TablePagination } from '@/components/ui/pagination'
import { useRouter } from 'next/navigation'
import { Printer } from 'lucide-react'
import { ExportDropdown } from '@/components/common/ExportDropdown'
import { ImportModal } from './import-modal'
import { Upload } from 'lucide-react'

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
  stock: number
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
  const { user } = useCustomAuth()

  // Only admin and lab_staff can manage equipment
  const canManageEquipment = user?.role === 'admin' || user?.role === 'lab_staff'

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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const router = useRouter()

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
      if (filters.status) countQuery = countQuery.eq('status', filters.status as 'available' | 'borrowed' | 'maintenance' | 'retired')
      if (filters.categoryId) countQuery = countQuery.eq('category_id', filters.categoryId)
      if (filters.condition) countQuery = countQuery.eq('condition', filters.condition)
      if (filters.location) countQuery = countQuery.ilike('location', `%${filters.location}%`)
      if (filters.minPrice) countQuery = countQuery.gte('purchase_price', parseFloat(filters.minPrice))
      if (filters.maxPrice) countQuery = countQuery.lte('purchase_price', parseFloat(filters.maxPrice))
      if (filters.purchaseDateFrom) countQuery = countQuery.gte('purchase_date', filters.purchaseDateFrom)
      if (filters.purchaseDateTo) countQuery = countQuery.lte('purchase_date', filters.purchaseDateTo)
      if (filters.availableOnly) countQuery = countQuery.eq('status', 'available')

      const { count } = await countQuery

      let query = supabase
        .from('equipment')
        .select(`
          *,
          category:categories (name),
          equipment_images!equipment_images_equipment_id_fkey (
            id,
            image_url,
            is_primary
          )
        `)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,serial_number.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`)
      }
      if (filters.status) query = query.eq('status', filters.status as 'available' | 'borrowed' | 'maintenance' | 'retired')
      if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
      if (filters.condition) query = query.eq('condition', filters.condition)
      if (filters.location) query = query.ilike('location', `%${filters.location}%`)
      if (filters.minPrice) query = query.gte('purchase_price', parseFloat(filters.minPrice))
      if (filters.maxPrice) query = query.lte('purchase_price', parseFloat(filters.maxPrice))
      if (filters.purchaseDateFrom) query = query.gte('purchase_date', filters.purchaseDateFrom)
      if (filters.purchaseDateTo) query = query.lte('purchase_date', filters.purchaseDateTo)
      if (filters.availableOnly) query = query.eq('status', 'available')

      const { data, error } = await query
      if (error) throw error
      return { data: data as unknown as Equipment[], totalCount: count || 0 }
    }
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      if (error) throw error

      const uniqueCategories = Array.from(
        new Map(data?.map((item) => [item.name, item])).values()
      )
      return uniqueCategories as Category[]
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
    }
  })

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus peralatan ini?')) {
      deleteMutation.mutate(id)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "default" | "warning" | "destructive"> = {
      available: 'success',
      borrowed: 'warning',
      maintenance: 'default',
      retired: 'destructive'
    }

    const statusLabels: Record<string, string> = {
      available: 'Tersedia',
      borrowed: 'Dipinjam',
      maintenance: 'Dalam Pemeliharaan',
      retired: 'Rusak / Hilang'
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

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkPrint = () => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds).join(',')
    router.push(`/dashboard/equipment/print-labels?ids=${ids}`)
  }

  const toggleSelectAll = () => {
    if (equipmentData?.data?.length === 0) return

    if (selectedIds.size === equipmentData?.data?.length) {
      setSelectedIds(new Set())
    } else {
      const allIds = equipmentData?.data?.map(item => item.id) || []
      setSelectedIds(new Set(allIds))
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Add Equipment Button - Only for admin/lab_staff */}
      {canManageEquipment && (
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
                Tambah Peralatan
              </ModernButton>
            </DialogTrigger>
            <DialogContent className="mx-4 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Peralatan Baru</DialogTitle>
                <DialogDescription className="sr-only">
                  Isi formulir berikut untuk menambahkan peralatan baru.
                </DialogDescription>
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
      )}

      {/* Search and Filters */}
      <AdvancedSearch
        filters={filters}
        categories={categories || []}
        onFiltersChange={setFilters}
      />

      {/* Equipment List */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={4} />
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-4 text-sm text-gray-600 font-medium">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-[#ff007a] focus:ring-[#ff007a]"
                  checked={(equipmentData?.data?.length ?? 0) > 0 && selectedIds.size === (equipmentData?.data?.length ?? 0)}
                  onChange={toggleSelectAll}
                />
                <span>Pilih Semua</span>
              </div>
              <span className="w-px h-4 bg-gray-300"></span>
              <span>
                Menampilkan {equipmentData?.data?.length || 0} dari {equipmentData?.totalCount || 0} peralatan
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <ExportDropdown
                data={equipmentData?.data || []}
                columns={[
                  { header: 'Nama Peralatan', key: 'name' },
                  { header: 'Kategori', key: 'category', formatter: (v: any) => v?.name || '-' },
                  { header: 'Nomor Seri', key: 'serial_number' },
                  { header: 'Kondisi', key: 'condition' },
                  { header: 'Status', key: 'status' },
                  { header: 'Lokasi', key: 'location' },
                  { header: 'Harga Beli', key: 'purchase_price', formatter: (v: any) => v ? `Rp ${parseInt(v).toLocaleString('id-ID')}` : '-' },
                  { header: 'Tanggal Beli', key: 'purchase_date', formatter: (v: any) => v ? new Date(v).toLocaleDateString('id-ID') : '-' },
                ]}
                filename="Data_Peralatan_Labbo"
                title="Laporan Data Peralatan"
              />

              {canManageEquipment && (
                <ModernButton
                  variant="outline"
                  className="bg-white hidden lg:flex"
                  leftIcon={<Upload className="w-4 h-4" />}
                  onClick={() => setIsImportModalOpen(true)}
                >
                  Impor
                </ModernButton>
              )}

              {canManageEquipment && (
                <div className="hidden lg:block">
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <ModernButton
                        variant="default"
                        size="lg"
                        className="button-hover-lift"
                        leftIcon={<Plus className="w-5 h-5" />}
                      >
                        Tambah Peralatan
                      </ModernButton>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] mx-4 max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Tambah Peralatan Baru</DialogTitle>
                        <DialogDescription className="sr-only">
                          Isi formulir berikut untuk menambahkan peralatan baru.
                        </DialogDescription>
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
              )}
            </div>

            {/* Import Modal */}
            <ImportModal
              isOpen={isImportModalOpen}
              onClose={() => setIsImportModalOpen(false)}
              onSuccess={() => {
                refetch()
              }}
            />
          </div>

          {equipmentData?.data && equipmentData.data.length === 0 ? (
            <ModernCard variant="default" padding="lg" className="text-center">
              <Package className="mx-auto w-12 h-12 sm:w-16 sm:h-16 mb-4 text-gray-400" />
              <h3 className="font-bold text-lg sm:text-xl text-gray-700 mb-2">Tidak ada peralatan ditemukan</h3>
              <p className="text-sm text-gray-500 mb-6">Coba ubah filter atau tambahkan peralatan baru</p>
              {canManageEquipment && (
                <ModernButton
                  variant="default"
                  leftIcon={<Plus className="w-5 h-5" />}
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  Tambah Peralatan
                </ModernButton>
              )}
            </ModernCard>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {equipmentData?.data?.map((item) => (
                <EquipmentGridCard
                  key={item.id}
                  item={item}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={toggleSelection}
                  onView={setViewingEquipment}
                  onEdit={canManageEquipment ? setEditingEquipment : undefined}
                  onDelete={canManageEquipment ? handleDelete : undefined}
                  canManage={canManageEquipment}
                />
              ))}
            </div>
          )}
        </div>
      )
      }

      {/* Edit Dialog - Only for admin/lab_staff */}
      {
        canManageEquipment && editingEquipment && (
          <Dialog open={!!editingEquipment} onOpenChange={() => setEditingEquipment(null)}>
            <DialogContent className="sm:max-w-[600px] mx-4 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ubah Peralatan</DialogTitle>
                <DialogDescription className="sr-only">
                  Modifikasi data peralatan yang sudah ada.
                </DialogDescription>
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
        )
      }

      {/* View Detail Dialog */}
      {
        viewingEquipment && (
          <EquipmentDetailModal
            equipment={viewingEquipment}
            isOpen={!!viewingEquipment}
            onClose={() => setViewingEquipment(null)}
          />
        )
      }

      {/* Pagination */}
      {
        equipmentData && equipmentData.totalCount > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={Math.ceil(equipmentData.totalCount / pageSize)}
            onPageChange={setCurrentPage}
            totalItems={equipmentData.totalCount}
            itemsPerPage={pageSize}
            onPageSizeChange={setPageSize}
          />
        )
      }
      {/* Floating Bulk Action Bar */}
      {
        selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-xl border border-gray-200 px-6 py-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="font-medium text-gray-900">
              {selectedIds.size} item dipilih
            </div>
            <div className="h-6 w-px bg-gray-200"></div>
            <ModernButton
              variant="default"
              size="sm"
              onClick={handleBulkPrint}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Cetak QR
            </ModernButton>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-gray-500 hover:text-gray-900 text-sm font-medium"
            >
              Batal
            </button>
          </div>
        )
      }
    </div >
  )
}