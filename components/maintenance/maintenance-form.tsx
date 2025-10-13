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
import { MaintenanceRecordFormValues, maintenanceRecordSchema } from '@/lib/validations'

interface Equipment {
  id: string
  name: string
  serial_number: string
  status: string
}

interface MaintenanceFormProps {
  onSuccess: () => void
}

export function MaintenanceForm({ onSuccess }: MaintenanceFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [equipment, setEquipment] = useState<Equipment[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<MaintenanceRecordFormValues>({
    resolver: zodResolver(maintenanceRecordSchema),
    defaultValues: {
      maintenance_date: new Date().toISOString().split('T')[0],
      next_maintenance_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  })

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const { data, error } = await supabase
          .from('equipment')
          .select('*')
          .order('name')

        if (error) throw error
        setEquipment(data || [])
      } catch (error) {
      }
    }

    fetchEquipment()
  }, [])

  const onSubmit = async (data: MaintenanceRecordFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const submitData = {
        equipment_id: data.equipment_id,
        maintenance_date: data.maintenance_date,
        description: data.description,
        cost: data.cost ? parseFloat(data.cost) : null,
        performed_by: data.performed_by,
        next_maintenance_date: data.next_maintenance_date || null,
        notes: data.notes || null
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Maintenance record created:', submitData)

      onSuccess()
      reset()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan catatan pemeliharaan')
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
          <Label htmlFor="equipment_id">Peralatan *</Label>
          <Select
            value={watch('equipment_id')}
            onValueChange={(value) => setValue('equipment_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih peralatan" />
            </SelectTrigger>
            <SelectContent>
              {equipment.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} ({item.serial_number})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.equipment_id && <p className="text-sm text-red-500">{errors.equipment_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenance_date">Tanggal Pemeliharaan *</Label>
          <Input
            id="maintenance_date"
            type="date"
            {...register('maintenance_date')}
          />
          {errors.maintenance_date && <p className="text-sm text-red-500">{errors.maintenance_date.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi *</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Masukkan deskripsi pemeliharaan"
          rows={3}
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="performed_by">Dilakukan Oleh *</Label>
          <Input
            id="performed_by"
            {...register('performed_by')}
            placeholder="Masukkan nama teknisi"
          />
          {errors.performed_by && <p className="text-sm text-red-500">{errors.performed_by.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost">Biaya</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            {...register('cost')}
            placeholder="Masukkan biaya pemeliharaan"
          />
          {errors.cost && <p className="text-sm text-red-500">{errors.cost.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="next_maintenance_date">Tanggal Pemeliharaan Berikutnya</Label>
          <Input
            id="next_maintenance_date"
            type="date"
            {...register('next_maintenance_date')}
          />
          {errors.next_maintenance_date && <p className="text-sm text-red-500">{errors.next_maintenance_date.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Masukkan catatan tambahan"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => onSuccess()}>
          Batal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Menyimpan...' : 'Catat Pemeliharaan'}
        </Button>
      </div>
    </form>
  )
}