'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { equipmentSchema, EquipmentFormValues } from '@/lib/validations'

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
        // Category fetch failed - continue with empty categories
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
        image_url: data.image_url && data.image_url.trim() !== '' ? data.image_url : null,
        description: data.description || null
      }

      if (equipment) {
        const { error } = await supabase
          .from('equipment')
          .update(submitData)
          .eq('id', equipment.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('equipment')
          .insert(submitData)

        if (error) throw error
      }

      onSuccess()
      if (!equipment) {
        reset()
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan peralatan')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Peralatan *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Masukkan nama peralatan"
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="serial_number">Nomor Seri *</Label>
          <Input
            id="serial_number"
            {...register('serial_number')}
            placeholder="Masukkan nomor seri"
          />
          {errors.serial_number && <p className="text-sm text-red-500">{errors.serial_number.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Masukkan deskripsi peralatan"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category_id">Kategori *</Label>
          <Select
            value={watch('category_id')}
            onValueChange={(value) => setValue('category_id', value)}
          >
            <SelectTrigger>
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
          {errors.category_id && <p className="text-sm text-red-500">{errors.category_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Lokasi *</Label>
          <Input
            id="location"
            {...register('location')}
            placeholder="Masukkan lokasi peralatan"
          />
          {errors.location && <p className="text-sm text-red-500">{errors.location.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="condition">Kondisi *</Label>
          <Select
            value={watch('condition')}
            onValueChange={(value) => setValue('condition', value as 'excellent' | 'good' | 'fair' | 'poor')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih kondisi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Sangat Baik</SelectItem>
              <SelectItem value="good">Baik</SelectItem>
              <SelectItem value="fair">Cukup</SelectItem>
              <SelectItem value="poor">Buruk</SelectItem>
            </SelectContent>
          </Select>
          {errors.condition && <p className="text-sm text-red-500">{errors.condition.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={watch('status')}
            onValueChange={(value) => setValue('status', value as 'available' | 'borrowed' | 'maintenance' | 'lost')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Tersedia</SelectItem>
              <SelectItem value="borrowed">Dipinjam</SelectItem>
              <SelectItem value="maintenance">Pemeliharaan</SelectItem>
              <SelectItem value="lost">Hilang</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="purchase_date">Tanggal Pembelian</Label>
          <Input
            id="purchase_date"
            type="date"
            {...register('purchase_date')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_price">Harga Pembelian</Label>
          <Input
            id="purchase_price"
            type="number"
            step="0.01"
            {...register('purchase_price')}
            placeholder="Masukkan harga pembelian"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_url">URL Gambar</Label>
        <Input
          id="image_url"
          {...register('image_url')}
          placeholder="Masukkan URL gambar"
        />
        {errors.image_url && <p className="text-sm text-red-500">{errors.image_url.message}</p>}
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => onSuccess()}>
          Batal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Menyimpan...' : equipment ? 'Perbarui' : 'Buat'}
        </Button>
      </div>
    </form>
  )
}