'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRScanner } from '@/components/mobile/qr-scanner'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import { Camera, Search, ArrowLeft, Info } from 'lucide-react'

export default function QRScannerPage() {
  const router = useRouter()
  const [scanResult, setScanResult] = useState<any>(null)
  const [equipmentDetails, setEquipmentDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleScanSuccess = async (qrData: any) => {
    setScanResult(qrData)
    await fetchEquipmentDetails(qrData.id)
  }

  const handleScanError = (error: string) => {
    console.error('QR scan error:', error)
  }

  const fetchEquipmentDetails = async (equipmentId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/equipment/${equipmentId}`)

      if (response.ok) {
        const data = await response.json()
        setEquipmentDetails(data.equipment)
      } else {
        console.error('Failed to fetch equipment details')
      }
    } catch (error) {
      console.error('Error fetching equipment details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBorrowEquipment = () => {
    if (equipmentDetails) {
      router.push(`/dashboard/transactions/borrow?equipment=${equipmentDetails.id}`)
    }
  }

  const handleReserveEquipment = () => {
    if (equipmentDetails) {
      router.push(`/dashboard/scheduling?equipment=${equipmentDetails.id}`)
    }
  }

  const handleViewDetails = () => {
    if (equipmentDetails) {
      router.push(`/dashboard/equipment/${equipmentDetails.id}`)
    }
  }

  const resetScanner = () => {
    setScanResult(null)
    setEquipmentDetails(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ModernButton
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </ModernButton>
              <div>
                <h1 className="text-xl font-bold text-gray-900">QR Scanner</h1>
                <p className="text-sm text-gray-600">Scan equipment QR codes for quick access</p>
              </div>
            </div>

            <ModernButton
              onClick={() => router.push('/dashboard/equipment')}
              variant="outline"
              size="sm"
              leftIcon={<Search className="w-4 h-4" />}
            >
              Search Manual
            </ModernButton>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* QR Scanner */}
          {!scanResult && (
            <QRScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
            />
          )}

          {/* Equipment Details */}
          {scanResult && (
            <div className="space-y-4">
              {/* Scan Success Card */}
              <ModernCard variant="default" padding="lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Camera className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">QR Code Scanned</h2>
                    <p className="text-sm text-gray-600">Equipment identified successfully</p>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span className="ml-2 text-gray-600">Loading equipment details...</span>
                  </div>
                ) : equipmentDetails ? (
                  <div className="space-y-4">
                    {/* Equipment Info */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">Equipment Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium">{equipmentDetails.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Serial Number</p>
                          <p className="font-medium">{equipmentDetails.serial_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Category</p>
                          <p className="font-medium">{equipmentDetails.category_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="font-medium">{equipmentDetails.location}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            equipmentDetails.status === 'available'
                              ? 'bg-green-100 text-green-800'
                              : equipmentDetails.status === 'borrowed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {equipmentDetails.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Condition</p>
                          <p className="font-medium capitalize">{equipmentDetails.condition}</p>
                        </div>
                      </div>

                      {equipmentDetails.description && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600">Description</p>
                          <p className="text-sm">{equipmentDetails.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Quick Actions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <ModernButton
                          onClick={handleBorrowEquipment}
                          variant="default"
                          disabled={equipmentDetails.status !== 'available'}
                          className="w-full"
                        >
                          Borrow Now
                        </ModernButton>
                        <ModernButton
                          onClick={handleReserveEquipment}
                          variant="outline"
                          className="w-full"
                        >
                          Reserve
                        </ModernButton>
                        <ModernButton
                          onClick={handleViewDetails}
                          variant="outline"
                          className="w-full"
                        >
                          View Details
                        </ModernButton>
                      </div>
                    </div>

                    {equipmentDetails.status !== 'available' && (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                        <Info className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">
                          This equipment is currently {equipmentDetails.status}.
                          {equipmentDetails.status === 'borrowed' && ' You can reserve it for future use.'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Equipment details not found</p>
                    <ModernButton
                      onClick={resetScanner}
                      variant="outline"
                      size="sm"
                      className="mt-3"
                    >
                      Scan Another QR Code
                    </ModernButton>
                  </div>
                )}

                {/* Reset Button */}
                {!isLoading && (
                  <div className="pt-4 border-t">
                    <ModernButton
                      onClick={resetScanner}
                      variant="outline"
                      className="w-full"
                    >
                      Scan Another QR Code
                    </ModernButton>
                  </div>
                )}
              </ModernCard>
            </div>
          )}

          {/* Instructions */}
          {!scanResult && (
            <ModernCard variant="outline" padding="lg">
              <h3 className="font-semibold text-gray-900 mb-3">How to Use QR Scanner</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>1. Position your device camera over the equipment QR code</p>
                <p>2. Ensure good lighting and steady hands for best results</p>
                <p>3. The scanner will automatically detect and read the QR code</p>
                <p>4. Once scanned, you'll see equipment details and available actions</p>
              </div>
            </ModernCard>
          )}
        </div>
      </div>
    </div>
  )
}