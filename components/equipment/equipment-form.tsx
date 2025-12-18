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
import { Upload, X, Loader2 } from 'lucide-react'

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
  stock: number
}

interface EquipmentFormProps {
  equipment?: Equipment
  onSuccess: () => void
}

export function EquipmentForm({ equipment, onSuccess }: EquipmentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  // Image Upload State
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)

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
      status: equipment.status as 'available' | 'borrowed' | 'maintenance' | 'retired',
      purchase_date: equipment.purchase_date ? new Date(equipment.purchase_date).toISOString().split('T')[0] : '',
      purchase_price: equipment.purchase_price ? equipment.purchase_price.toString() : '',
      stock: equipment.stock || 1,
    } : {
      name: '',
      description: '',
      serial_number: '',
      category_id: '',
      purchase_date: '',
      purchase_price: '',
      condition: 'good',
      status: 'available',
      location: '',
      stock: 1,
    }
  })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase.from('categories').select('*').order('name')
        if (error) throw error

        // Deduplicate categories by name
        const uniqueCategories = Array.from(
          new Map(data?.map((item) => [item.name, item])).values()
        )
        setCategories(uniqueCategories)
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCategories()
  }, [])

  // Image Handling Functions
  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return

    const validFiles: File[] = []
    const newPreviews: string[] = []

    Array.from(newFiles).forEach(file => {
      if (!file.type.startsWith('image/')) return
      if (file.size > 5 * 1024 * 1024) return // 5MB limit

      const preview = URL.createObjectURL(file)
      validFiles.push(file)
      newPreviews.push(preview)
    })

    setFiles(prev => [...prev, ...validFiles].slice(0, 5))
    setPreviews(prev => [...prev, ...newPreviews].slice(0, 5))
  }

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const onSubmit = async (data: EquipmentFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      // 1. Create/Update Equipment Record
      const equipmentData = {
        name: data.name,
        description: data.description,
        category_id: data.category_id,
        serial_number: data.serial_number,
        purchase_date: data.purchase_date || null,
        purchase_price: data.purchase_price ? parseFloat(data.purchase_price) : null,
        condition: data.condition,
        status: data.status,
        location: data.location,
        stock: data.stock || 1,
      }

      let equipmentId = equipment?.id

      if (equipmentId) {
        const { error: updateError } = await supabase
          .from('equipment')
          .update(equipmentData)
          .eq('id', equipmentId)

        if (updateError) {
          if (updateError.code === '23505') {
            throw new Error('Nomor seri sudah terdaftar. Harap gunakan nomor seri yang berbeda.')
          }
          throw updateError
        }
      } else {
        const { data: newEquipment, error: insertError } = await supabase
          .from('equipment')
          .insert(equipmentData)
          .select()
          .single()

        if (insertError) {
          if (insertError.code === '23505') {
            throw new Error('Nomor seri sudah terdaftar. Harap gunakan nomor seri yang berbeda.')
          }
          throw insertError
        }
        equipmentId = newEquipment.id
      }

      // Upload Images directly to Supabase Storage
      if (files.length > 0 && equipmentId) {
        // Get current max display order
        const { data: maxOrderData } = await supabase
          .from('equipment_images')
          .select('display_order')
          .eq('equipment_id', equipmentId)
          .order('display_order', { ascending: false })
          .limit(1)
          .single()

        let nextOrder = (maxOrderData?.display_order || 0) + 1

        const uploadedImages: { image_url: string; is_primary: boolean | null }[] = []

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const ext = file.name.split('.').pop()
          const filename = `${equipmentId}/${Date.now()}-${i}.${ext}`

          // Upload to Storage
          const { error: uploadError } = await supabase.storage
            .from('equipment-images')
            .upload(filename, file, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            console.error('Error uploading file:', uploadError)
            continue
          }

          // Get Public URL
          const { data: urlData } = supabase.storage
            .from('equipment-images')
            .getPublicUrl(filename)

          const imageUrl = urlData.publicUrl

          // Prepare database record
          const isPrimary = i === 0 // Logic: first uploaded is primary if none exists presumably, or simplify to just this batch
          // Note: If updating existing, we might not want to override primary unless specified. 
          // The previous API logic forced is_primary=true for the batch. Let's keep it simple: First of this batch is primary candidate.

          // Helper to unset other primaries if this one is primary
          if (isPrimary) {
            await supabase
              .from('equipment_images')
              .update({ is_primary: false })
              .eq('equipment_id', equipmentId)
          }

          const { data: imageRecord, error: dbError } = await supabase
            .from('equipment_images')
            .insert({
              equipment_id: equipmentId,
              image_url: imageUrl,
              is_primary: isPrimary,
              display_order: nextOrder + i,
              // uploaded_by can be handled by RLS 'auth.uid()' default or trigger, 
              // but if we need to set it explicit:
              uploaded_by: (await supabase.auth.getUser()).data.user?.id
            })
            .select()
            .single()

          if (!dbError && imageRecord) {
            uploadedImages.push(imageRecord)
          }
        }

        // Update equipment main image if we uploaded a primary one
        if (uploadedImages.length > 0 && uploadedImages[0].is_primary) {
          await supabase
            .from('equipment')
            .update({ image_url: uploadedImages[0].image_url })
            .eq('id', equipmentId)
        }
      }

      onSuccess()
      if (!equipment) {
        reset()
        setFiles([])
        setPreviews([])
      }
    } catch (error: unknown) {
      console.error('Submit Error:', error)
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

      {/* Basic Info Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">Nama Peralatan *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Masukkan nama peralatan"
            className="h-10 sm:h-11 border-gray-300 focus:border-[#ff007a] focus:ring-[#ff007a]"
          />
          {errors.name && <p className="text-xs sm:text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="serial_number" className="text-sm font-medium">Nomor Seri *</Label>
          <Input
            id="serial_number"
            {...register('serial_number')}
            placeholder="Masukkan nomor seri"
            className="h-10 sm:h-11 border-gray-300 focus:border-[#ff007a] focus:ring-[#ff007a]"
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
          className="border-gray-300 focus:border-[#ff007a] focus:ring-[#ff007a]"
        />
      </div>

      {/* Category & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="category_id" className="text-sm font-medium">Kategori *</Label>
          <Select
            value={watch('category_id')}
            onValueChange={(value) => setValue('category_id', value)}
          >
            <SelectTrigger className="h-10 sm:h-11 border-gray-300 focus:border-[#ff007a] focus:ring-[#ff007a]">
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
            className="h-10 sm:h-11 border-gray-300 focus:border-[#ff007a] focus:ring-[#ff007a]"
          />
          {errors.location && <p className="text-xs sm:text-sm text-red-500">{errors.location.message}</p>}
        </div>
      </div>

      {/* Condition & Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="condition" className="text-sm font-medium">Kondisi *</Label>
          <Select
            value={watch('condition')}
            onValueChange={(value) => setValue('condition', value as 'excellent' | 'good' | 'fair' | 'poor')}
          >
            <SelectTrigger className="h-10 sm:h-11 border-gray-300 focus:border-[#ff007a] focus:ring-[#ff007a]">
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
            onValueChange={(value) => setValue('status', value as 'available' | 'borrowed' | 'maintenance' | 'retired')}
          >
            <SelectTrigger className="h-10 sm:h-11 border-gray-300 focus:border-[#ff007a] focus:ring-[#ff007a]">
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Tersedia</SelectItem>
              <SelectItem value="borrowed">Dipinjam</SelectItem>
              <SelectItem value="maintenance">Dalam Pemeliharaan</SelectItem>
              <SelectItem value="retired">Tidak Aktif / Hilang</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-xs sm:text-sm text-red-500">{errors.status.message}</p>}
        </div>
      </div>

      {/* Purchase Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="purchase_date" className="text-sm font-medium">Tanggal Pembelian</Label>
          <Input
            id="purchase_date"
            type="date"
            {...register('purchase_date')}
            className="h-10 sm:h-11 border-gray-300 focus:border-[#ff007a] focus:ring-[#ff007a]"
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
            className="h-10 sm:h-11 border-gray-300 focus:border-[#ff007a] focus:ring-[#ff007a]"
          />
        </div>
      </div>

      {/* Stock */}
      <div className="space-y-2">
        <Label htmlFor="stock" className="text-sm font-medium">Jumlah Stok *</Label>
        <div className="flex items-center gap-4">
          <Input
            id="stock"
            type="number"
            min={0}
            {...register('stock', { valueAsNumber: true })}
            placeholder="1"
            className="h-10 sm:h-11 border-gray-300 focus:border-[#ff007a] focus:ring-[#ff007a] max-w-[200px]"
          />
          <span className="text-sm text-gray-500">unit tersedia untuk dipinjam</span>
        </div>
        {errors.stock && <p className="text-xs sm:text-sm text-red-500">{errors.stock.message}</p>}
        <p className="text-xs text-gray-400">Stok akan berkurang otomatis saat peminjaman disetujui</p>
      </div>

      {/* Integrated Image Upload - Only for New Equipment or if user wants to add more */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-sm font-medium">Foto Peralatan</Label>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-6 text-center transition-colors
            ${dragActive ? 'border-[#ff007a] bg-pink-50' : 'border-gray-300 hover:border-gray-400'}
            ${files.length >= 5 ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => handleFiles(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={files.length >= 5}
          />
          <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700">
            {dragActive ? 'Lepaskan file di sini' : 'Seret & lepas gambar di sini'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            atau klik untuk memilih (Maks. 5 foto)
          </p>
        </div>

        {/* Previews */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group border border-gray-200">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                {index === 0 && (
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] py-1 text-center">
                    Cover
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            equipment ? 'Perbarui Data' : 'Simpan & Upload'
          )}
        </ModernButton>
      </div>
    </form>
  )
}