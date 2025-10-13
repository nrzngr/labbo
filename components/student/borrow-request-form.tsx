'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
import { supabase } from '@/lib/supabase'
import { ModernInput } from '@/components/ui/modern-input'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernBadge } from '@/components/ui/modern-badge'
import { Package, Calendar, Search, AlertTriangle, CheckCircle } from 'lucide-react'

interface Equipment {
  id: string
  name: string
  serial_number: string
  category?: { name: string }
  condition: string
  location: string
  description?: string
  image_url?: string
}

interface BorrowRequestFormProps {
  onSuccess: () => void
}

export function BorrowRequestForm({ onSuccess }: BorrowRequestFormProps) {
  const { user } = useCustomAuth()
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [borrowDays, setBorrowDays] = useState(7)
  const [notes, setNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [step, setStep] = useState<'search' | 'details' | 'confirm'>('search')

  const queryClient = useQueryClient()

  const { data: availableEquipment, isLoading } = useQuery({
    queryKey: ['available-equipment', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('equipment')
        .select('*, categories(name)')
        .eq('status', 'available')
        .order('name')

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Equipment[]
    }
  })

  const borrowMutation = useMutation({
    mutationFn: async ({ equipmentId, expectedReturnDate, notes }: {
      equipmentId: string
      expectedReturnDate: string
      notes: string
    }) => {
      if (!user) throw new Error('User not authenticated')

      const borrowDate = new Date().toISOString().split('T')[0]

      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Borrow request created:', {
        user_id: user.id,
        equipment_id: equipmentId,
        borrow_date: borrowDate,
        expected_return_date: expectedReturnDate,
        notes,
        status: 'active'
      })
      return { id: 'mock-id' }
    },
    onSuccess: async () => {
      if (selectedEquipment) {
        console.log('Equipment status updated to borrowed:', selectedEquipment.id)
      }

      queryClient.invalidateQueries({ queryKey: ['available-equipment'] })
      queryClient.invalidateQueries({ queryKey: ['my-borrowings'] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })

      onSuccess()
    }
  })

  const handleSelectEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment)
    setStep('details')
  }

  const handleSubmitRequest = () => {
    if (!selectedEquipment || !user) return

    const expectedReturnDate = new Date()
    expectedReturnDate.setDate(expectedReturnDate.getDate() + borrowDays)

    borrowMutation.mutate({
      equipmentId: selectedEquipment.id,
      expectedReturnDate: expectedReturnDate.toISOString().split('T')[0],
      notes
    })
  }

  const getConditionBadge = (condition: string) => {
    const variants: Record<string, "success" | "default" | "warning" | "destructive"> = {
      excellent: 'success',
      good: 'default',
      fair: 'warning',
      poor: 'destructive'
    }

    const conditionLabels: Record<string, string> = {
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      poor: 'Poor'
    }

    return <ModernBadge variant={variants[condition] || 'default'} size="sm">{conditionLabels[condition] || condition}</ModernBadge>
  }

  const calculateReturnDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + borrowDays)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (step === 'search') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold mb-4">Search Available Equipment</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <ModernInput
              placeholder="Search by name, serial number, or description..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-sm text-gray-600">Searching equipment...</div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-3">
            {availableEquipment && availableEquipment.length > 0 ? (
              availableEquipment.map((equipment) => (
                <ModernCard
                  key={equipment.id}
                  variant="outline"
                  hover
                  className="p-4 cursor-pointer border-2 hover:border-black"
                  onClick={() => handleSelectEquipment(equipment)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-base truncate">{equipment.name}</h4>
                        {getConditionBadge(equipment.condition)}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Serial: <span className="font-mono">{equipment.serial_number}</span></div>
                        <div>Category: {equipment.category?.name || 'Uncategorized'}</div>
                        <div>Location: {equipment.location}</div>
                        {equipment.description && (
                          <div className="text-xs text-gray-500 line-clamp-2">{equipment.description}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </ModernCard>
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="mx-auto w-12 h-12 mb-4 text-gray-400" />
                <h4 className="font-bold text-lg mb-2">No equipment found</h4>
                <p className="text-sm text-gray-600">
                  {searchTerm ? 'Try adjusting your search terms' : 'No equipment is currently available'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (step === 'details') {
    return (
      <div className="space-y-6">
        {selectedEquipment && (
          <ModernCard variant="default" padding="sm">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-8 h-8 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg mb-2">{selectedEquipment.name}</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Serial: <span className="font-mono">{selectedEquipment.serial_number}</span></div>
                  <div>Category: {selectedEquipment.category?.name || 'Uncategorized'}</div>
                  <div>Location: {selectedEquipment.location}</div>
                  <div className="flex items-center gap-2">
                    Condition: {getConditionBadge(selectedEquipment.condition)}
                  </div>
                </div>
              </div>
            </div>
          </ModernCard>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
            Borrowing Period
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="30"
              value={borrowDays}
              onChange={(e) => setBorrowDays(parseInt(e.target.value))}
              className="flex-1"
            />
            <div className="w-20 text-center">
              <div className="text-2xl font-bold">{borrowDays}</div>
              <div className="text-xs text-gray-600">days</div>
            </div>
          </div>
          <div className="text-sm text-gray-600 mt-2">
            Return date: <span className="font-medium">{calculateReturnDate()}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
            Notes (Optional)
          </label>
          <textarea
            placeholder="Any special requirements or notes for this borrowing..."
            className="w-full px-4 py-3 border border-black focus:ring-0 focus:border-black resize-none"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <ModernButton
            variant="outline"
            size="lg"
            onClick={() => setStep('search')}
            className="flex-1"
          >
            Back
          </ModernButton>
          <ModernButton
            variant="default"
            size="lg"
            onClick={() => setStep('confirm')}
            className="flex-1"
          >
            Review Request
          </ModernButton>
        </div>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="space-y-6">
        <ModernCard variant="default" padding="sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <h4 className="font-bold text-lg">Review Your Request</h4>
            </div>

            {selectedEquipment && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Equipment:</span>
                  <span className="font-medium">{selectedEquipment.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Serial Number:</span>
                  <span className="font-mono text-sm">{selectedEquipment.serial_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Borrow Period:</span>
                  <span className="font-medium">{borrowDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Return Date:</span>
                  <span className="font-medium">{calculateReturnDate()}</span>
                </div>
                {notes && (
                  <div>
                    <span className="text-gray-600">Notes:</span>
                    <div className="mt-1 p-2 bg-gray-50 rounded text-sm">{notes}</div>
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex items-start gap-2 text-amber-600">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <p className="font-medium mb-1">Please Note:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>You are responsible for the equipment during the borrowing period</li>
                    <li>Return the equipment in the same condition as received</li>
                    <li>Late returns may result in penalties or borrowing restrictions</li>
                    <li>Contact lab staff immediately if equipment is damaged or lost</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </ModernCard>

        <div className="flex gap-3">
          <ModernButton
            variant="outline"
            size="lg"
            onClick={() => setStep('details')}
            disabled={borrowMutation.isPending}
            className="flex-1"
          >
            Back
          </ModernButton>
          <ModernButton
            variant="default"
            size="lg"
            onClick={handleSubmitRequest}
            disabled={borrowMutation.isPending}
            loading={borrowMutation.isPending}
            className="flex-1"
          >
            {borrowMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </ModernButton>
        </div>
      </div>
    )
  }

  return null
}