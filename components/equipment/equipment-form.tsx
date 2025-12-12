'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ModernButton } from '@/components/ui/modern-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ImageUpload } from '@/components/equipment/image-upload'
import { supabase } from '@/lib/supabase'
import { equipmentSchema, EquipmentFormValues } from '@/lib/validations'
import { Upload } from 'lucide-react'

interface Category {
  id: string
  name: string
}

interface Equipment {
  id: string
  name: string
  description: string
  category_id: string
  serial_number: string
  purchase_date: string
  purchase_price: string
  condition: string
  status: string
  location: string
  image_url: string
}

interface EquipmentFormProps {
  equipment?: Equipment
  onSuccess: () => void
}

export function EquipmentForm({ equipment, onSuccess }: EquipmentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [createdEquipmentId, setCreatedEquipmentId] = useState<string | null>(null)
  const [showImageUpload, setShowImageUpload] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: equipment ? {
      ...equipment,
      condition: equipment.condition as 'excellent' | 'good' | 'fair' | 'poor',
      status: equipment.status as 'available' | 'borrowed' | 'maintenance' | 'lost',
      purchase_date: equipment.purchase_date ? new Date(equipment.purchase_date).toISOString().split('T')[0] : '',
      purchase_price: equipment.purchase_price ? equipment.purchase_price.toString() : '',
    } : {
      condition: 'good',
      status: 'available'
    }
  })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase.from('categories').select('*').order('name')
        if (error) throw error
        setCategories(data || [])
      } catch (error) {
      }
    }
    fetchCategories()
  }, [])

  const onSubmit = async (data: EquipmentFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const submitData = {
        ...data,
        purchase_price: data.purchase_price ? parseFloat(data.purchase_price) : null,
        purchase_date: data.purchase_date || null,
        description: data.description || null
      }

      if (equipment) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('Equipment updated:', submitData)
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('Equipment created:', submitData)
      }

      onSuccess()
      if (!equipment) {
        reset()
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan data peralatan')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">Nama Peralatan *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Masukkan nama peralatan"
            className="h-10 sm:h-11"
          />
          {errors.name && <p className="text-xs sm:text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="serial_number" className="text-sm font-medium">Nomor Seri *</Label>
          <Input
            id="serial_number"
            {...register('serial_number')}
            placeholder="Masukkan nomor seri"
            className="h-10 sm:h-11"
          />
          {errors.serial_number && <p className="text-xs sm:text-sm text-red-500">{errors.serial_number.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">Deskripsi</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Masukkan deskripsi peralatan"
          rows={3}
          variant="filled"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="category_id" className="text-sm font-medium">Kategori *</Label>
          <Select
            value={watch('category_id')}
            onValueChange={(value) => setValue('category_id', value)}
          >
            <SelectTrigger className="h-10 sm:h-11">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category_id && <p className="text-xs sm:text-sm text-red-500">{errors.category_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm font-medium">Lokasi *</Label>
          <Input
            id="location"
            {...register('location')}
            placeholder="Masukkan lokasi peralatan"
            className="h-10 sm:h-11"
          />
          {errors.location && <p className="text-xs sm:text-sm text-red-500">{errors.location.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="condition" className="text-sm font-medium">Kondisi *</Label>
          <Select
            value={watch('condition')}
            onValueChange={(value) => setValue('condition', value as 'excellent' | 'good' | 'fair' | 'poor')}
          >
            <SelectTrigger className="h-10 sm:h-11">
              <SelectValue placeholder="Pilih kondisi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Sangat Baik</SelectItem>
              <SelectItem value="good">Baik</SelectItem>
              <SelectItem value="fair">Cukup Baik</SelectItem>
              <SelectItem value="poor">Rusak</SelectItem>
            </SelectContent>
          </Select>
          {errors.condition && <p className="text-xs sm:text-sm text-red-500">{errors.condition.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm font-medium">Status *</Label>
          <Select
            value={watch('status')}
            onValueChange={(value) => setValue('status', value as 'available' | 'borrowed' | 'maintenance' | 'lost')}
          >
            <SelectTrigger className="h-10 sm:h-11">
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Tersedia</SelectItem>
              <SelectItem value="borrowed">Dipinjam</SelectItem>
              <SelectItem value="maintenance">Dalam Pemeliharaan</SelectItem>
              <SelectItem value="lost">Hilang</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-xs sm:text-sm text-red-500">{errors.status.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="purchase_date" className="text-sm font-medium">Tanggal Pembelian</Label>
          <Input
            id="purchase_date"
            type="date"
            {...register('purchase_date')}
            className="h-10 sm:h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_price" className="text-sm font-medium">Harga Pembelian</Label>
          <Input
            id="purchase_price"
            type="number"
            step="0.01"
            {...register('purchase_price')}
            placeholder="Masukkan harga pembelian"
            className="h-10 sm:h-11"
          />
        </div>
      </div>

      {/* Image Upload Section - Only for New Equipment */}
      {!equipment && (
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Foto Peralatan</Label>
              <p className="text-xs text-gray-500 mt-1">Upload foto peralatan (opsional, maks 5 foto)</p>
            </div>
            {!showImageUpload && (
              <ModernButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowImageUpload(true)}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Tambah Foto
              </ModernButton>
            )}
          </div>

          {showImageUpload && createdEquipmentId && (
            <ImageUpload
              equipmentId={createdEquipmentId}
              maxFiles={5}
              onUploadComplete={() => {
                // Optionally refresh or show success
              }}
            />
          )}

          {showImageUpload && !createdEquipmentId && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
              💡 Simpan data Peralatan terlebih dahulu, kemudian upload foto
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
        <ModernButton
          type="button"
          variant="outline"
          onClick={() => onSuccess()}
          className="w-full sm:w-auto h-10 sm:h-11"
        >
          Batal
        </ModernButton>
        <ModernButton
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto h-10 sm:h-11"
        >
          {isLoading ? 'Menyimpan...' : equipment ? 'Perbarui' : 'Simpan'}
        </ModernButton>
      </div>
    </form>
  )
}