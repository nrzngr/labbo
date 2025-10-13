'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernInput } from '@/components/ui/modern-input'
import { QRScanner } from '@/components/mobile/qr-scanner'
import {
  ArrowLeft,
  Camera,
  User,
  Calendar,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin
} from 'lucide-react'

interface Equipment {
  id: string
  name: string
  serial_number: string
  category: string
  location: string
  condition: string
  status: string
  description?: string
}

interface MobileCheckoutProps {
  onClose?: () => void
}

export function MobileCheckout({ onClose }: MobileCheckoutProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const equipmentId = searchParams?.get('equipment')

  const [step, setStep] = useState<'equipment' | 'user' | 'details' | 'confirmation' | 'success'>('equipment')
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [borrowerName, setBorrowerName] = useState('')
  const [borrowerId, setBorrowerId] = useState('')
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().split('T')[0])
  const [expectedReturnDate, setExpectedReturnDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (equipmentId) {
      fetchEquipmentDetails(equipmentId)
    }
  }, [equipmentId])

  const fetchEquipmentDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/equipment/${id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedEquipment(data.equipment)
      }
    } catch (error) {
      console.error('Error fetching equipment:', error)
    }
  }

  const handleQRScanSuccess = async (qrData: any) => {
    await fetchEquipmentDetails(qrData.id)
    setShowQRScanner(false)
  }

  const handleEquipmentSelection = (equipment: Equipment) => {
    setSelectedEquipment(equipment)
    setStep('user')
  }

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!borrowerName.trim()) {
      setError('Please enter borrower information')
      return
    }
    setError(null)
    setStep('details')
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('confirmation')
  }

  const handleConfirmCheckout = async () => {
    if (!selectedEquipment) return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equipment_id: selectedEquipment.id,
          borrower_name: borrowerName,
          borrower_id: borrowerId,
          borrow_date: borrowDate,
          expected_return_date: expectedReturnDate,
          notes: notes,
          checkout_method: 'mobile'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setStep('success')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to complete checkout')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetCheckout = () => {
    setStep('equipment')
    setSelectedEquipment(null)
    setBorrowerName('')
    setBorrowerId('')
    setNotes('')
    setError(null)
  }

  const renderEquipmentStep = () => (
    <ModernCard variant="default" padding="lg" className="w-full">
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <Camera className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold">Select Equipment</h2>
          <p className="text-gray-600 text-sm mt-1">
            Scan QR code or search manually
          </p>
        </div>

        {selectedEquipment ? (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">{selectedEquipment.name}</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Serial: {selectedEquipment.serial_number}</p>
                <p>Category: {selectedEquipment.category}</p>
                <p>Location: {selectedEquipment.location}</p>
                <p className="flex items-center gap-1">
                  Status:
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedEquipment.status === 'available'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedEquipment.status}
                  </span>
                </p>
              </div>
            </div>

            {selectedEquipment.status === 'available' ? (
              <ModernButton
                onClick={() => handleEquipmentSelection(selectedEquipment)}
                variant="default"
                className="w-full"
              >
                Proceed with Checkout
              </ModernButton>
            ) : (
              <div className="text-center text-red-600 text-sm">
                This equipment is not available for borrowing
              </div>
            )}

            <ModernButton
              onClick={() => setSelectedEquipment(null)}
              variant="outline"
              className="w-full"
            >
              Scan Different Equipment
            </ModernButton>
          </div>
        ) : (
          <div className="space-y-4">
            <ModernButton
              onClick={() => setShowQRScanner(true)}
              variant="default"
              leftIcon={<Camera className="w-4 h-4" />}
              className="w-full"
            >
              Scan QR Code
            </ModernButton>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <ModernButton
              onClick={() => router.push('/dashboard/equipment')}
              variant="outline"
              className="w-full"
            >
              Browse Equipment List
            </ModernButton>
          </div>
        )}
      </div>

      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <QRScanner
              onScanSuccess={handleQRScanSuccess}
              onScanError={(error) => setError(error)}
              onClose={() => setShowQRScanner(false)}
            />
          </div>
        </div>
      )}
    </ModernCard>
  )

  const renderUserStep = () => (
    <ModernCard variant="default" padding="lg" className="w-full">
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold">Borrower Information</h2>
          <p className="text-gray-600 text-sm mt-1">
            Enter borrower details
          </p>
        </div>

        {selectedEquipment && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium">{selectedEquipment.name}</p>
            <p className="text-xs text-gray-600">{selectedEquipment.serial_number}</p>
          </div>
        )}

        <form onSubmit={handleUserSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Borrower Name *
            </label>
            <ModernInput
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student/Staff ID
            </label>
            <ModernInput
              value={borrowerId}
              onChange={(e) => setBorrowerId(e.target.value)}
              placeholder="Enter ID number (optional)"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <ModernButton
              type="button"
              onClick={() => setStep('equipment')}
              variant="outline"
              className="flex-1"
            >
              Back
            </ModernButton>
            <ModernButton
              type="submit"
              variant="default"
              className="flex-1"
            >
              Next
            </ModernButton>
          </div>
        </form>
      </div>
    </ModernCard>
  )

  const renderDetailsStep = () => (
    <ModernCard variant="default" padding="lg" className="w-full">
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold">Checkout Details</h2>
          <p className="text-gray-600 text-sm mt-1">
            Set borrowing period
          </p>
        </div>

        <form onSubmit={handleDetailsSubmit} className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg space-y-1">
            <p className="text-sm font-medium">{selectedEquipment?.name}</p>
            <p className="text-xs text-gray-600">Borrower: {borrowerName}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Borrow Date *
              </label>
              <ModernInput
                type="date"
                value={borrowDate}
                onChange={(e) => setBorrowDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Return *
              </label>
              <ModernInput
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                min={borrowDate}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <ModernButton
              type="button"
              onClick={() => setStep('user')}
              variant="outline"
              className="flex-1"
            >
              Back
            </ModernButton>
            <ModernButton
              type="submit"
              variant="default"
              className="flex-1"
            >
              Review
            </ModernButton>
          </div>
        </form>
      </div>
    </ModernCard>
  )

  const renderConfirmationStep = () => (
    <ModernCard variant="default" padding="lg" className="w-full">
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold">Confirm Checkout</h2>
          <p className="text-gray-600 text-sm mt-1">
            Review all details before confirming
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Equipment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span>{selectedEquipment?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Serial:</span>
                <span>{selectedEquipment?.serial_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span>{selectedEquipment?.location}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Borrower Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span>{borrowerName}</span>
              </div>
              {borrowerId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ID:</span>
                  <span>{borrowerId}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Borrowing Period</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Borrow Date:</span>
                <span>{new Date(borrowDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expected Return:</span>
                <span>{new Date(expectedReturnDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span>
                  {Math.ceil((new Date(expectedReturnDate).getTime() - new Date(borrowDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
            </div>
          </div>

          {notes && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Notes:</p>
              <p className="text-sm text-blue-700">{notes}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <ModernButton
            onClick={() => setStep('details')}
            variant="outline"
            className="flex-1"
            disabled={isProcessing}
          >
            Back
          </ModernButton>
          <ModernButton
            onClick={handleConfirmCheckout}
            variant="default"
            className="flex-1"
            loading={isProcessing}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Confirm Checkout'}
          </ModernButton>
        </div>
      </div>
    </ModernCard>
  )

  const renderSuccessStep = () => (
    <ModernCard variant="default" padding="lg" className="w-full">
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-green-900">Checkout Successful!</h2>
          <p className="text-gray-600 mt-2">
            Equipment has been successfully borrowed
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg text-left">
          <h3 className="font-semibold mb-3">Transaction Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Equipment:</span>
              <span>{selectedEquipment?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Borrower:</span>
              <span>{borrowerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Return Date:</span>
              <span>{new Date(expectedReturnDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <ModernButton
            onClick={resetCheckout}
            variant="default"
            className="w-full"
          >
            New Checkout
          </ModernButton>

          <ModernButton
            onClick={() => router.push('/dashboard/transactions')}
            variant="outline"
            className="w-full"
          >
            View All Transactions
          </ModernButton>
        </div>
      </div>
    </ModernCard>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      {/* Header */}
      <div className="container mx-auto px-4 mb-6">
        <div className="flex items-center gap-3">
          {onClose && (
            <ModernButton
              onClick={onClose}
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </ModernButton>
          )}
          <div>
            <h1 className="text-xl font-bold">Mobile Checkout</h1>
            <p className="text-sm text-gray-600">Quick equipment borrowing process</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="container mx-auto px-4 mb-6">
        <div className="flex items-center justify-center space-x-4">
          {['equipment', 'user', 'details', 'confirmation'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                ${step === stepName
                  ? 'bg-blue-600 text-white'
                  : 'completed-steps-includes-step'?.includes(stepName)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {step === stepName ? index + 1 :
                 ['equipment', 'user', 'details', 'confirmation'].indexOf(stepName) < index ? '✓' : index + 1}
              </div>
              {index < 3 && (
                <div className={`w-8 h-1 ${
                  ['equipment', 'user', 'details'].includes(stepName) ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          {step === 'equipment' && renderEquipmentStep()}
          {step === 'user' && renderUserStep()}
          {step === 'details' && renderDetailsStep()}
          {step === 'confirmation' && renderConfirmationStep()}
          {step === 'success' && renderSuccessStep()}
        </div>
      </div>
    </div>
  )
}