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
import { BorrowingTransactionFormValues, borrowingTransactionSchema } from '@/lib/validations'

interface User {
  id: string
  full_name: string
  email: string
  role: string
}

interface Equipment {
  id: string
  name: string
  serial_number: string
  status: string
}

interface TransactionFormProps {
  onSuccess: () => void
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<BorrowingTransactionFormValues>({
    resolver: zodResolver(borrowingTransactionSchema),
    defaultValues: {
      borrow_date: new Date().toISOString().split('T')[0],
      expected_return_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
    }
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from('user_profiles')
          .select('*')
          .order('full_name')

        if (usersError) throw usersError
        setUsers(usersData || [])

        // Fetch available equipment
        const { data: equipmentData, error: equipmentError } = await supabase
          .from('equipment')
          .select('*')
          .eq('status', 'available')
          .order('name')

        if (equipmentError) throw equipmentError
        setAvailableEquipment(equipmentData || [])
      } catch (error) {
      }
    }

    fetchData()
  }, [])

  const onSubmit = async (data: BorrowingTransactionFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      // Create the transaction
      const { error: transactionError } = await supabase
        .from('borrowing_transactions')
        .insert({
          user_id: data.user_id,
          equipment_id: data.equipment_id,
          borrow_date: data.borrow_date,
          expected_return_date: data.expected_return_date,
          notes: data.notes || null,
          status: 'active'
        })

      if (transactionError) throw transactionError

      // Update equipment status to borrowed
      const { error: equipmentError } = await supabase
        .from('equipment')
        .update({ status: 'borrowed' })
        .eq('id', data.equipment_id)

      if (equipmentError) throw equipmentError

      onSuccess()
      reset()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred while creating the transaction')
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
          <Label htmlFor="user_id">Borrower *</Label>
          <Select
            value={watch('user_id')}
            onValueChange={(value) => setValue('user_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a borrower" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name} ({user.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.user_id && <p className="text-sm text-red-500">{errors.user_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="equipment_id">Equipment *</Label>
          <Select
            value={watch('equipment_id')}
            onValueChange={(value) => setValue('equipment_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select equipment" />
            </SelectTrigger>
            <SelectContent>
              {availableEquipment.map((equipment) => (
                <SelectItem key={equipment.id} value={equipment.id}>
                  {equipment.name} ({equipment.serial_number})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.equipment_id && <p className="text-sm text-red-500">{errors.equipment_id.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="borrow_date">Borrow Date *</Label>
          <Input
            id="borrow_date"
            type="date"
            {...register('borrow_date')}
          />
          {errors.borrow_date && <p className="text-sm text-red-500">{errors.borrow_date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="expected_return_date">Expected Return Date *</Label>
          <Input
            id="expected_return_date"
            type="date"
            {...register('expected_return_date')}
          />
          {errors.expected_return_date && <p className="text-sm text-red-500">{errors.expected_return_date.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Enter any additional notes"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => onSuccess()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Transaction'}
        </Button>
      </div>
    </form>
  )
}