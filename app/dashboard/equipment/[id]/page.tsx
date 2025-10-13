'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QRCodeDisplay } from '@/components/equipment/qr-code-display'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernBadge } from '@/components/ui/modern-badge'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Wrench,
  FileText,
  Camera,
  Clock,
  AlertTriangle,
  CheckCircle,
  Edit,
  Share,
  Download,
  QrCode
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
  purchase_date?: string
  purchase_price?: number
  warranty_expiry?: string
  last_maintenance?: string
  next_maintenance?: string
  created_at: string
  updated_at: string
}

interface MaintenanceRecord {
  id: string
  date: string
  type: 'preventive' | 'corrective' | 'calibration'
  description: string
  cost?: number
  performed_by: string
  status: 'completed' | 'pending' | 'cancelled'
}

export default function EquipmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const equipmentId = params?.id as string

  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'maintenance' | 'qr'>('overview')

  useEffect(() => {
    if (equipmentId) {
      fetchEquipmentDetails()
      fetchMaintenanceHistory()
    }
  }, [equipmentId])

  const fetchEquipmentDetails = async () => {
    try {
      const response = await fetch(`/api/equipment/${equipmentId}`)
      if (response.ok) {
        const data = await response.json()
        setEquipment(data.equipment)
      } else {
        setError('Failed to load equipment details')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMaintenanceHistory = async () => {
    try {
      const response = await fetch(`/api/equipment/${equipmentId}/maintenance`)
      if (response.ok) {
        const data = await response.json()
        setMaintenanceHistory(data.maintenance || [])
      }
    } catch (error) {
      console.error('Error fetching maintenance history:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'borrowed':
        return 'bg-red-100 text-red-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      case 'lost':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return 'bg-green-100 text-green-800'
      case 'good':
        return 'bg-blue-100 text-blue-800'
      case 'fair':
        return 'bg-yellow-100 text-yellow-800'
      case 'poor':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleBorrowEquipment = () => {
    router.push(`/dashboard/checkout?equipment=${equipmentId}`)
  }

  const handleReserveEquipment = () => {
    router.push(`/dashboard/scheduling?equipment=${equipmentId}`)
  }

  const handleEditEquipment = () => {
    router.push(`/dashboard/equipment/${equipmentId}/edit`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading equipment details...</p>
        </div>
      </div>
    )
  }

  if (error || !equipment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Equipment not found'}</p>
          <ModernButton onClick={() => router.back()} variant="outline">
            Go Back
          </ModernButton>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ModernButton
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </ModernButton>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{equipment.name}</h1>
                <p className="text-gray-600">Serial: {equipment.serial_number}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ModernButton
                onClick={handleEditEquipment}
                variant="outline"
                size="sm"
                leftIcon={<Edit className="w-4 h-4" />}
              >
                Edit
              </ModernButton>

              {equipment.status === 'available' && (
                <>
                  <ModernButton
                    onClick={handleBorrowEquipment}
                    variant="default"
                    size="sm"
                  >
                    Borrow Now
                  </ModernButton>
                  <ModernButton
                    onClick={handleReserveEquipment}
                    variant="outline"
                    size="sm"
                    leftIcon={<Calendar className="w-4 h-4" />}
                  >
                    Reserve
                  </ModernButton>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <ModernBadge variant="outline" className={getStatusColor(equipment.status)}>
              {equipment.status}
            </ModernBadge>
            <ModernBadge variant="outline" className={getConditionColor(equipment.condition)}>
              Condition: {equipment.condition}
            </ModernBadge>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              {equipment.location}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'maintenance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Maintenance
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'qr'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              QR Code
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <ModernCard variant="default" padding="lg">
                <h2 className="text-lg font-bold mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Equipment Name</p>
                    <p className="font-medium">{equipment.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Serial Number</p>
                    <p className="font-medium">{equipment.serial_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium capitalize">{equipment.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{equipment.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Condition</p>
                    <p className="font-medium capitalize">{equipment.condition}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium capitalize">{equipment.status}</p>
                  </div>
                </div>

                {equipment.description && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-1">Description</p>
                    <p className="text-sm">{equipment.description}</p>
                  </div>
                )}
              </ModernCard>

              {/* Purchase Information */}
              <ModernCard variant="default" padding="lg">
                <h2 className="text-lg font-bold mb-4">Purchase Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Purchase Date</p>
                    <p className="font-medium">
                      {equipment.purchase_date
                        ? new Date(equipment.purchase_date).toLocaleDateString()
                        : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Purchase Price</p>
                    <p className="font-medium">
                      {equipment.purchase_price
                        ? `$${equipment.purchase_price.toLocaleString()}`
                        : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Warranty Expiry</p>
                    <p className="font-medium">
                      {equipment.warranty_expiry
                        ? new Date(equipment.warranty_expiry).toLocaleDateString()
                        : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="font-medium">
                      {Math.floor(
                        (new Date().getTime() - new Date(equipment.created_at).getTime()) /
                          (1000 * 60 * 60 * 24 * 365)
                      )} years
                    </p>
                  </div>
                </div>
              </ModernCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <ModernCard variant="default" padding="lg">
                <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {equipment.status === 'available' && (
                    <>
                      <ModernButton
                        onClick={handleBorrowEquipment}
                        variant="default"
                        className="w-full justify-start"
                        leftIcon={<User className="w-4 h-4" />}
                      >
                        Borrow Equipment
                      </ModernButton>
                      <ModernButton
                        onClick={handleReserveEquipment}
                        variant="outline"
                        className="w-full justify-start"
                        leftIcon={<Calendar className="w-4 h-4" />}
                      >
                        Reserve Equipment
                      </ModernButton>
                    </>
                  )}
                  <ModernButton
                    onClick={() => setActiveTab('qr')}
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<QrCode className="w-4 h-4" />}
                  >
                    View QR Code
                  </ModernButton>
                  <ModernButton
                    onClick={() => router.push('/dashboard/checkout')}
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<Camera className="w-4 h-4" />}
                  >
                    Mobile Checkout
                  </ModernButton>
                </div>
              </ModernCard>

              {/* Maintenance Info */}
              {equipment.last_maintenance || equipment.next_maintenance ? (
                <ModernCard variant="default" padding="lg">
                  <h3 className="text-lg font-bold mb-4">Maintenance</h3>
                  <div className="space-y-3">
                    {equipment.last_maintenance && (
                      <div>
                        <p className="text-sm text-gray-600">Last Maintenance</p>
                        <p className="font-medium">
                          {new Date(equipment.last_maintenance).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {equipment.next_maintenance && (
                      <div>
                        <p className="text-sm text-gray-600">Next Maintenance</p>
                        <p className="font-medium">
                          {new Date(equipment.next_maintenance).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </ModernCard>
              ) : null}
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <ModernCard variant="default" padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Maintenance History</h2>
                <ModernButton
                  variant="default"
                  size="sm"
                  leftIcon={<Wrench className="w-4 h-4" />}
                >
                  Schedule Maintenance
                </ModernButton>
              </div>

              {maintenanceHistory.length > 0 ? (
                <div className="space-y-3">
                  {maintenanceHistory.map((record) => (
                    <div key={record.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <ModernBadge variant="outline" size="sm" className={
                              record.type === 'preventive'
                                ? 'bg-blue-100 text-blue-800'
                                : record.type === 'calibration'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }>
                              {record.type}
                            </ModernBadge>
                            <span className="text-sm text-gray-600">
                              {new Date(record.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 mb-1">{record.description}</p>
                          <p className="text-xs text-gray-600">
                            Performed by: {record.performed_by}
                          </p>
                          {record.cost && (
                            <p className="text-xs text-gray-600">
                              Cost: ${record.cost.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <ModernBadge variant="outline" size="sm" className={
                          record.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }>
                          {record.status}
                        </ModernBadge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No maintenance records found</p>
                </div>
              )}
            </ModernCard>
          </div>
        )}

        {/* QR Code Tab */}
        {activeTab === 'qr' && (
          <div className="max-w-md mx-auto">
            <ModernCard variant="default" padding="lg">
              <h2 className="text-lg font-bold mb-4 text-center">Equipment QR Code</h2>
              <QRCodeDisplay
                equipmentId={equipment.id}
                equipmentName={equipment.name}
                serialNumber={equipment.serial_number}
                category={equipment.category}
                location={equipment.location}
              />
              <div className="mt-6 text-center text-sm text-gray-600">
                <p>Scan this QR code to quickly access this equipment</p>
                <p className="mt-1">Perfect for mobile operations and quick lookups</p>
              </div>
            </ModernCard>
          </div>
        )}
      </div>
    </div>
  )
}