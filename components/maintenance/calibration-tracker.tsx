'use client'

import { useState, useEffect } from 'react'
import { format, addDays, addMonths, addYears, isAfter, isBefore } from 'date-fns'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernInput } from '@/components/ui/modern-input'
import { ModernBadge } from '@/components/ui/modern-badge'
import {
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Download,
  Upload,
  Plus,
  Edit,
  Eye,
  Filter
} from 'lucide-react'

interface Equipment {
  id: string
  name: string
  serial_number: string
  category: string
  location: string
}

interface CalibrationRecord {
  id: string
  equipment_id: string
  equipment_name: string
  calibration_date: string
  next_calibration_date: string
  calibration_company: string
  technician_name: string
  certificate_number: string
  status: 'calibrated' | 'expired' | 'due_soon' | 'overdue'
  results: 'passed' | 'failed' | 'conditional'
  notes?: string
  certificate_url?: string
  cost?: number
  created_at: string
}

interface CalibrationTrackerProps {
  equipmentId?: string
}

export function CalibrationTracker({ equipmentId }: CalibrationTrackerProps) {
  const [records, setRecords] = useState<CalibrationRecord[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CalibrationRecord | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<CalibrationRecord | null>(null)
  const [filter, setFilter] = useState<'all' | 'overdue' | 'due_soon' | 'calibrated'>('all')
  const [showCertificateModal, setShowCertificateModal] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    equipment_id: equipmentId || '',
    calibration_date: format(new Date(), 'yyyy-MM-dd'),
    next_calibration_date: format(addYears(new Date(), 1), 'yyyy-MM-dd'),
    calibration_company: '',
    technician_name: '',
    certificate_number: '',
    results: 'passed' as 'passed' | 'failed' | 'conditional',
    notes: '',
    cost: ''
  })

  useEffect(() => {
    fetchCalibrationRecords()
    fetchEquipment()
  }, [])

  const fetchCalibrationRecords = async () => {
    try {
      setIsLoading(true)
      const url = equipmentId
        ? `/api/calibration?equipment_id=${equipmentId}`
        : '/api/calibration'

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setRecords(data.records || [])
      }
    } catch (error) {
      setError('Failed to load calibration records')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment')
      if (response.ok) {
        const data = await response.json()
        setEquipment(data.equipment || [])
      }
    } catch (error) {
      console.error('Error fetching equipment:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : null
      }

      const url = editingRecord
        ? `/api/calibration/${editingRecord.id}`
        : '/api/calibration'

      const method = editingRecord ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await fetchCalibrationRecords()
        setShowForm(false)
        setEditingRecord(null)
        resetForm()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save calibration record')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (record: CalibrationRecord) => {
    setEditingRecord(record)
    setFormData({
      equipment_id: record.equipment_id,
      calibration_date: record.calibration_date.split('T')[0],
      next_calibration_date: record.next_calibration_date.split('T')[0],
      calibration_company: record.calibration_company,
      technician_name: record.technician_name,
      certificate_number: record.certificate_number,
      results: record.results,
      notes: record.notes || '',
      cost: record.cost?.toString() || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this calibration record?')) {
      return
    }

    try {
      const response = await fetch(`/api/calibration/${recordId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchCalibrationRecords()
      } else {
        setError('Failed to delete calibration record')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      equipment_id: equipmentId || '',
      calibration_date: format(new Date(), 'yyyy-MM-dd'),
      next_calibration_date: format(addYears(new Date(), 1), 'yyyy-MM-dd'),
      calibration_company: '',
      technician_name: '',
      certificate_number: '',
      results: 'passed',
      notes: '',
      cost: ''
    })
  }

  const getCalibrationStatusColor = (status: string) => {
    switch (status) {
      case 'calibrated':
        return 'bg-green-100 text-green-800'
      case 'due_soon':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getResultsColor = (results: string) => {
    switch (results) {
      case 'passed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'conditional':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredRecords = records.filter(record => {
    if (filter === 'all') return true
    return record.status === filter
  })

  const getStatusStats = () => {
    return {
      total: records.length,
      calibrated: records.filter(r => r.status === 'calibrated').length,
      dueSoon: records.filter(r => r.status === 'due_soon').length,
      overdue: records.filter(r => r.status === 'overdue').length,
      expired: records.filter(r => r.status === 'expired').length
    }
  }

  const renderCalibrationForm = () => (
    <ModernCard variant="default" padding="lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          {editingRecord ? 'Edit Calibration Record' : 'Record Calibration'}
        </h2>
        <ModernButton
          onClick={() => {
            setShowForm(false)
            setEditingRecord(null)
            resetForm()
          }}
          variant="outline"
          size="sm"
        >
          Cancel
        </ModernButton>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment *
            </label>
            <select
              value={formData.equipment_id}
              onChange={(e) => setFormData(prev => ({ ...prev, equipment_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!equipmentId}
            >
              <option value="">Select Equipment</option>
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} ({eq.serial_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calibration Date *
            </label>
            <ModernInput
              type="date"
              value={formData.calibration_date}
              onChange={(e) => setFormData(prev => ({ ...prev, calibration_date: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Next Calibration Date *
            </label>
            <ModernInput
              type="date"
              value={formData.next_calibration_date}
              onChange={(e) => setFormData(prev => ({ ...prev, next_calibration_date: e.target.value }))}
              min={formData.calibration_date}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calibration Results *
            </label>
            <select
              value={formData.results}
              onChange={(e) => setFormData(prev => ({ ...prev, results: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="conditional">Conditional Pass</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calibration Company *
            </label>
            <ModernInput
              value={formData.calibration_company}
              onChange={(e) => setFormData(prev => ({ ...prev, calibration_company: e.target.value }))}
              placeholder="Company name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technician Name *
            </label>
            <ModernInput
              value={formData.technician_name}
              onChange={(e) => setFormData(prev => ({ ...prev, technician_name: e.target.value }))}
              placeholder="Technician name"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificate Number *
            </label>
            <ModernInput
              value={formData.certificate_number}
              onChange={(e) => setFormData(prev => ({ ...prev, certificate_number: e.target.value }))}
              placeholder="Certificate number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost
            </label>
            <ModernInput
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes about the calibration"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <ModernButton
            type="button"
            onClick={() => {
              setShowForm(false)
              setEditingRecord(null)
              resetForm()
            }}
            variant="outline"
          >
            Cancel
          </ModernButton>
          <ModernButton
            type="submit"
            variant="default"
            loading={isLoading}
            disabled={isLoading}
          >
            {editingRecord ? 'Update Record' : 'Save Record'}
          </ModernButton>
        </div>
      </form>
    </ModernCard>
  )

  const renderCalibrationList = () => {
    const stats = getStatusStats()

    return (
      <ModernCard variant="default" padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Calibration Records</h2>
          <div className="flex gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <ModernButton
                onClick={() => setFilter('all')}
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
              >
                All ({stats.total})
              </ModernButton>
              <ModernButton
                onClick={() => setFilter('calibrated')}
                variant={filter === 'calibrated' ? 'default' : 'ghost'}
                size="sm"
              >
                Calibrated ({stats.calibrated})
              </ModernButton>
              <ModernButton
                onClick={() => setFilter('due_soon')}
                variant={filter === 'due_soon' ? 'default' : 'ghost'}
                size="sm"
              >
                Due Soon ({stats.dueSoon})
              </ModernButton>
              <ModernButton
                onClick={() => setFilter('overdue')}
                variant={filter === 'overdue' ? 'default' : 'ghost'}
                size="sm"
              >
                Overdue ({stats.overdue})
              </ModernButton>
            </div>
            <ModernButton
              onClick={() => setShowForm(true)}
              variant="default"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Record Calibration
            </ModernButton>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No calibration records found</p>
            <ModernButton
              onClick={() => setShowForm(true)}
              variant="outline"
              size="sm"
              className="mt-3"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Record First Calibration
            </ModernButton>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => (
              <div key={record.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{record.equipment_name}</h3>
                      <ModernBadge variant="outline" size="sm" className={getCalibrationStatusColor(record.status)}>
                        {record.status.replace('_', ' ')}
                      </ModernBadge>
                      <ModernBadge variant="outline" size="sm" className={getResultsColor(record.results)}>
                        {record.results}
                      </ModernBadge>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Company: {record.calibration_company}</p>
                  <p>Technician: {record.technician_name}</p>
                      <p>Certificate: {record.certificate_number}</p>
                      <p className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Calibrated: {format(new Date(record.calibration_date), 'MMM d, yyyy')}
                      </p>
                      <p className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Next Calibration: {format(new Date(record.next_calibration_date), 'MMM d, yyyy')}
                      </p>
                      {record.cost && (
                        <p>Cost: ${record.cost.toLocaleString()}</p>
                      )}
                    </div>

                    {record.notes && (
                      <p className="text-sm text-gray-700 mt-2">{record.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <ModernButton
                      onClick={() => {
                        setSelectedRecord(record)
                        setShowCertificateModal(true)
                      }}
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye className="w-4 h-4" />}
                    >
                      View
                    </ModernButton>
                    <ModernButton
                      onClick={() => handleEdit(record)}
                      variant="outline"
                      size="sm"
                      leftIcon={<Edit className="w-4 h-4" />}
                    >
                      Edit
                    </ModernButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ModernCard>
    )
  }

  const renderCertificateModal = () => {
    if (!selectedRecord) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Calibration Certificate</h3>
              <ModernButton
                onClick={() => setShowCertificateModal(false)}
                variant="outline"
                size="sm"
              >
                Close
              </ModernButton>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-3">Certificate Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Equipment:</p>
                    <p className="font-medium">{selectedRecord.equipment_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Certificate Number:</p>
                    <p className="font-medium">{selectedRecord.certificate_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Calibration Date:</p>
                    <p className="font-medium">{format(new Date(selectedRecord.calibration_date), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Next Calibration:</p>
                    <p className="font-medium">{format(new Date(selectedRecord.next_calibration_date), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Company:</p>
                    <p className="font-medium">{selectedRecord.calibration_company}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Technician:</p>
                    <p className="font-medium">{selectedRecord.technician_name}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Test Results</h4>
                <ModernBadge variant="outline" className={getResultsColor(selectedRecord.results)}>
                  {selectedRecord.results}
                </ModernBadge>
                {selectedRecord.notes && (
                  <p className="text-sm text-gray-700 mt-2">{selectedRecord.notes}</p>
                )}
              </div>

              <div className="flex gap-3">
                <ModernButton
                  variant="outline"
                  className="flex-1"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download Certificate
                </ModernButton>
                <ModernButton
                  variant="outline"
                  className="flex-1"
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Upload Certificate
                </ModernButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showForm ? renderCalibrationForm() : renderCalibrationList()}
      {showCertificateModal && renderCertificateModal()}
    </div>
  )
}