'use client'

import { useState } from 'react'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernInput } from '@/components/ui/modern-input'
import { Calendar, Clock, Users, AlertTriangle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

interface ReservationFormProps {
  equipmentId: string
  equipmentName: string
  onReservationSuccess?: () => void
  onCancel?: () => void
}

interface FormData {
  title: string
  description: string
  start_time: string
  end_time: string
  notes: string
}

export function ReservationForm({
  equipmentId,
  equipmentName,
  onReservationSuccess,
  onCancel
}: ReservationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    notes: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(null)

    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    }

    if (!formData.start_time) {
      errors.start_time = 'Start time is required'
    }

    if (!formData.end_time) {
      errors.end_time = 'End time is required'
    }

    if (formData.start_time && formData.end_time) {
      const startTime = new Date(formData.start_time)
      const endTime = new Date(formData.end_time)

      if (startTime >= endTime) {
        errors.end_time = 'End time must be after start time'
      }

      if (startTime < new Date()) {
        errors.start_time = 'Start time cannot be in the past'
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equipment_id: equipmentId,
          user_id: 'current-user-id', // This would come from auth context
          title: formData.title,
          description: formData.description,
          start_time: formData.start_time,
          end_time: formData.end_time,
          approval_required: false // This could be determined by equipment value or user role
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message || 'Reservation created successfully')

        setFormData({
          title: '',
          description: '',
          start_time: '',
          end_time: '',
          notes: ''
        })

        onReservationSuccess?.()
      } else {
        setError(data.error || 'Failed to create reservation')
      }
    } catch (error) {
      console.error('Error creating reservation:', error)
      setError('Failed to create reservation. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentDateTime = () => {
    const now = new Date()
    now.setMinutes(0)
    return now.toISOString().slice(0, 16)
  }

  const getMinimumDateTime = () => {
    const now = new Date()
    now.setMinutes(0)
    return now.toISOString().slice(0, 16)
  }

  return (
    <div className="w-full">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="bg-white p-4 sm:p-6">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">New Reservation</h3>
                <p className="text-sm text-gray-600 line-clamp-1">{equipmentName}</p>
              </div>
            </div>

            <button
              onClick={onCancel}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-700">{success}</span>
              </div>
            )}

            {/* Form Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <ModernInput
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Reservation title or purpose"
                error={validationErrors.title}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Provide details about your reservation"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <ModernInput
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                  min={getMinimumDateTime()}
                  error={validationErrors.start_time}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <ModernInput
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                  min={formData.start_time || getMinimumDateTime()}
                  error={validationErrors.end_time}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">Reservation Details</span>
              </div>
              <div className="text-sm text-gray-600">
                {formData.start_time && formData.end_time && (
                  <p>
                    Duration: {Math.round((new Date(formData.end_time).getTime() - new Date(formData.start_time).getTime()) / (1000 * 60 * 60))} hours
                  </p>
                )}
                <p className="line-clamp-2">Equipment: {equipmentName}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <ModernButton
                type="submit"
                variant="default"
                size="lg"
                loading={isLoading}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Creating...' : 'Create Reservation'}
              </ModernButton>

              {onCancel && (
                <ModernButton
                  type="button"
                  onClick={onCancel}
                  variant="outline"
                  size="lg"
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </ModernButton>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <ModernCard variant="default" padding="lg" className="w-full max-w-2xl mx-auto">
          <div className="space-y-6">
            {/* Desktop Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">New Reservation</h3>
                  <p className="text-sm text-gray-600">{equipmentName}</p>
                </div>
              </div>

              {onCancel && (
                <ModernButton
                  onClick={onCancel}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </ModernButton>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-700">{success}</span>
              </div>
            )}

            {/* Desktop Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Title *
                </label>
                <ModernInput
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Reservation title or purpose"
                  error={validationErrors.title}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Provide details about your reservation"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Start Time *
                  </label>
                  <ModernInput
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                    min={getMinimumDateTime()}
                    error={validationErrors.start_time}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                    End Time *
                  </label>
                  <ModernInput
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                    min={formData.start_time || getMinimumDateTime()}
                    error={validationErrors.end_time}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-700">Reservation Details</span>
                </div>
                <div className="text-sm text-gray-600">
                  {formData.start_time && formData.end_time && (
                    <p>
                      Duration: {Math.round((new Date(formData.end_time).getTime() - new Date(formData.start_time).getTime()) / (1000 * 60 * 60))} hours
                    </p>
                  )}
                  <p>Equipment: {equipmentName}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <ModernButton
                  type="submit"
                  variant="default"
                  size="lg"
                  loading={isLoading}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Creating...' : 'Create Reservation'}
                </ModernButton>

                {onCancel && (
                  <ModernButton
                    type="button"
                    onClick={onCancel}
                    variant="outline"
                    size="lg"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </ModernButton>
                )}
              </div>
            </form>

            {/* Help Information */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Reservation Guidelines:</p>
                  <ul className="space-y-1">
                    <li>• Reservations are subject to equipment availability</li>
                    <li>• Minimum reservation duration is 1 hour</li>
                    <li>• Cancellations must be made at least 1 hour in advance</li>
                    <li>• High-value equipment may require approval</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </ModernCard>
      </div>
    </div>
  )
}