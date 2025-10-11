'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { EquipmentForm } from './equipment-form'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit, Trash2, Eye, Package } from 'lucide-react'

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

export function EquipmentList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null)

  const queryClient = useQueryClient()

  // Auto-refetch on mount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['equipment'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
  }, [queryClient])

  const { data: equipment, isLoading, refetch } = useQuery({
    queryKey: ['equipment', searchTerm, filterStatus, filterCategory],
    queryFn: async () => {
      let query = supabase
        .from('equipment')
        .select('*, categories(name)')
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      if (filterStatus) {
        query = query.eq('status', filterStatus)
      }

      if (filterCategory) {
        query = query.eq('category_id', filterCategory)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }
      return data as Equipment[]
    },
    staleTime: 0, // Data is stale immediately
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

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
    if (confirm('Are you sure you want to delete this equipment?')) {
      deleteMutation.mutate(id)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      available: 'default',
      borrowed: 'secondary',
      maintenance: 'outline',
      lost: 'destructive'
    }

    const statusLabels: Record<string, string> = {
      available: 'Tersedia',
      borrowed: 'Dipinjam',
      maintenance: 'Pemeliharaan',
      lost: 'Hilang'
    }

    return <Badge variant={variants[status] || 'outline'}>{statusLabels[status] || status}</Badge>
  }

  const getConditionBadge = (condition: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      excellent: 'default',
      good: 'secondary',
      fair: 'outline',
      poor: 'destructive'
    }

    const conditionLabels: Record<string, string> = {
      excellent: 'Sangat Baik',
      good: 'Baik',
      fair: 'Cukup',
      poor: 'Buruk'
    }

    return <Badge variant={variants[condition] || 'outline'}>{conditionLabels[condition] || condition}</Badge>
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black">PERALATAN</h1>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <button className="w-full sm:w-auto border border-black px-4 sm:px-6 py-2 sm:py-3 hover:bg-black hover:text-white transition-none text-sm sm:text-base">
              <Plus className="inline w-4 h-4 mr-2" />
              TAMBAH PERALATAN
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] border border-black">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">TAMBAH PERALATAN</DialogTitle>
            </DialogHeader>
            <EquipmentForm
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
            placeholder="Cari peralatan..."
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
          <option value="available">Tersedia</option>
          <option value="borrowed">Dipinjam</option>
          <option value="maintenance">Pemeliharaan</option>
          <option value="lost">Hilang</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 sm:px-4 py-3 border border-black focus:ring-0 focus:border-black min-w-[120px] sm:min-w-[150px] h-12 text-sm"
        >
          <option value="">Semua Kategori</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Equipment List */}
      {isLoading ? (
        <div className="border border-black p-8 sm:p-12 text-center">
          <div className="text-base sm:text-lg">Memuat data peralatan...</div>
        </div>
      ) : (
        <div className="border border-black">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-black">
                <tr>
                  <th className="text-left p-4 font-medium">Nama</th>
                  <th className="text-left p-4 font-medium">Kategori</th>
                  <th className="text-left p-4 font-medium">Nomor Seri</th>
                  <th className="text-left p-4 font-medium">Kondisi</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Lokasi</th>
                  <th className="text-right p-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {equipment?.map((item) => (
                  <tr key={item.id} className="border-t border-black hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-600 truncate max-w-xs">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">{item.category?.name || 'Uncategorized'}</td>
                    <td className="p-4 font-mono text-sm">{item.serial_number}</td>
                    <td className="p-4">{getConditionBadge(item.condition)}</td>
                    <td className="p-4">{getStatusBadge(item.status)}</td>
                    <td className="p-4">{item.location}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setViewingEquipment(item)}
                          className="border border-black p-2 hover:bg-black hover:text-white transition-none"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingEquipment(item)}
                          className="border border-black p-2 hover:bg-black hover:text-white transition-none"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteMutation.isPending}
                          className="border border-black p-2 hover:bg-red-600 hover:text-white hover:border-red-600 transition-none"
                        >
                          <Trash2 className="w-4 h-4" />
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
              {equipment?.map((item) => (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg truncate">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 truncate mt-1">{item.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-1 ml-2">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Kategori:</span>
                      <p className="truncate">{item.category?.name || 'Uncategorized'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Nomor Seri:</span>
                      <p className="font-mono truncate">{item.serial_number}</p>
                    </div>
                    <div>
                      <span className="font-medium">Kondisi:</span>
                      <div className="mt-1">{getConditionBadge(item.condition)}</div>
                    </div>
                    <div>
                      <span className="font-medium">Lokasi:</span>
                      <p className="truncate">{item.location}</p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-black">
                    <button
                      onClick={() => setViewingEquipment(item)}
                      className="border border-black p-2 hover:bg-black hover:text-white transition-none"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingEquipment(item)}
                      className="border border-black p-2 hover:bg-black hover:text-white transition-none"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleteMutation.isPending}
                      className="border border-black p-2 hover:bg-red-600 hover:text-white hover:border-red-600 transition-none"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {equipment?.length === 0 && (
            <div className="text-center py-8 sm:py-12 px-4">
              <Package className="mx-auto w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4" />
              <h3 className="font-bold text-base sm:text-lg mb-2">Tidak ada peralatan ditemukan</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">Coba sesuaikan pencarian atau filter Anda</p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('')
                  setFilterCategory('')
                }}
                className="border border-black px-3 sm:px-4 py-2 hover:bg-black hover:text-white transition-none text-xs sm:text-sm"
              >
                Hapus Filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      {editingEquipment && (
        <Dialog open={!!editingEquipment} onOpenChange={() => setEditingEquipment(null)}>
          <DialogContent className="sm:max-w-[600px] border border-black">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">UBAH PERALATAN</DialogTitle>
            </DialogHeader>
            <EquipmentForm
              equipment={editingEquipment}
              onSuccess={() => {
                setEditingEquipment(null)
                refetch()
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* View Dialog */}
      {viewingEquipment && (
        <Dialog open={!!viewingEquipment} onOpenChange={() => setViewingEquipment(null)}>
          <DialogContent className="sm:max-w-[600px] border border-black">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">DETAIL PERALATAN</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium mb-2">NAMA</div>
                  <div>{viewingEquipment.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">NOMOR SERI</div>
                  <div className="font-mono">{viewingEquipment.serial_number}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">KATEGORI</div>
                  <div>{viewingEquipment.category?.name || 'Tidak Berkategori'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">LOKASI</div>
                  <div>{viewingEquipment.location}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">KONDISI</div>
                  <div>{getConditionBadge(viewingEquipment.condition)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">STATUS</div>
                  <div>{getStatusBadge(viewingEquipment.status)}</div>
                </div>
              </div>

              {viewingEquipment.description && (
                <div>
                  <div className="text-sm font-medium mb-2">DESKRIPSI</div>
                  <div>{viewingEquipment.description}</div>
                </div>
              )}

              {viewingEquipment.image_url && (
                <div>
                  <div className="text-sm font-medium mb-2">GAMBAR</div>
                  <div className="border border-black">
                    <img
                      src={viewingEquipment.image_url}
                      alt={viewingEquipment.name}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}