'use client'

import { useState, useEffect } from 'react'
import { format, addDays, addWeeks, addMonths, startOfWeek } from 'date-fns'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernInput } from '@/components/ui/modern-input'
import { ModernBadge } from '@/components/ui/modern-badge'
import {
  Calendar,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Repeat,
  Users
} from 'lucide-react'

interface Equipment {
  id: string
  name: string
  serial_number: string
  category: string
  location: string
}

interface MaintenanceSchedule {
  id: string
  equipment_id: string
  equipment_name: string
  type: 'preventive' | 'corrective' | 'calibration'
  title: string
  description: string
  scheduled_date: string
  estimated_duration: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  recurrence_pattern?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    end_date?: string
  }
  created_at: string
}

interface MaintenanceSchedulerProps {
  equipmentId?: string
}

export function MaintenanceScheduler({ equipmentId }: MaintenanceSchedulerProps) {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null)
  const [view, setView] = useState<'list' | 'calendar'>('list')

  // Form state
  const [formData, setFormData] = useState({
    equipment_id: equipmentId || '',
    type: 'preventive' as 'preventive' | 'corrective' | 'calibration',
    title: '',
    description: '',
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    scheduled_time: '09:00',
    estimated_duration: 2,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    assigned_to: '',
    recurrence_type: 'none' as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurrence_interval: 1,
    recurrence_end_date: ''
  })

  useEffect(() => {
    fetchMaintenanceSchedules()
    fetchEquipment()
  }, [])

  const fetchMaintenanceSchedules = async () => {
    try {
      setIsLoading(true)
      const url = equipmentId
        ? `/api/maintenance?equipment_id=${equipmentId}`
        : '/api/maintenance'

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setSchedules(data.schedules || [])
      }
    } catch (error) {
      setError('Failed to load maintenance schedules')
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
        scheduled_datetime: `${formData.scheduled_date}T${formData.scheduled_time}:00`,
        ...(formData.recurrence_type !== 'none' && {
          recurrence_pattern: {
            type: formData.recurrence_type,
            interval: formData.recurrence_interval,
            ...(formData.recurrence_end_date && { end_date: formData.recurrence_end_date })
          }
        })
      }

      const url = editingSchedule
        ? `/api/maintenance/${editingSchedule.id}`
        : '/api/maintenance'

      const method = editingSchedule ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await fetchMaintenanceSchedules()
        setShowForm(false)
        setEditingSchedule(null)
        resetForm()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save maintenance schedule')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (schedule: MaintenanceSchedule) => {
    setEditingSchedule(schedule)
    setFormData({
      equipment_id: schedule.equipment_id,
      type: schedule.type,
      title: schedule.title,
      description: schedule.description,
      scheduled_date: schedule.scheduled_date.split('T')[0],
      scheduled_time: schedule.scheduled_date.split('T')[1].slice(0, 5),
      estimated_duration: schedule.estimated_duration,
      priority: schedule.priority,
      assigned_to: schedule.assigned_to || '',
      recurrence_type: schedule.recurrence_pattern?.type || 'none',
      recurrence_interval: schedule.recurrence_pattern?.interval || 1,
      recurrence_end_date: schedule.recurrence_pattern?.end_date || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this maintenance schedule?')) {
      return
    }

    try {
      const response = await fetch(`/api/maintenance/${scheduleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchMaintenanceSchedules()
      } else {
        setError('Failed to delete maintenance schedule')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      equipment_id: equipmentId || '',
      type: 'preventive',
      title: '',
      description: '',
      scheduled_date: format(new Date(), 'yyyy-MM-dd'),
      scheduled_time: '09:00',
      estimated_duration: 2,
      priority: 'medium',
      assigned_to: '',
      recurrence_type: 'none',
      recurrence_interval: 1,
      recurrence_end_date: ''
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'preventive':
        return 'bg-blue-100 text-blue-800'
      case 'corrective':
        return 'bg-red-100 text-red-800'
      case 'calibration':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const renderMaintenanceForm = () => (
    <ModernCard variant="default" padding="lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          {editingSchedule ? 'Edit Maintenance Schedule' : 'Schedule Maintenance'}
        </h2>
        <ModernButton
          onClick={() => {
            setShowForm(false)
            setEditingSchedule(null)
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
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="preventive">Preventive</option>
              <option value="corrective">Corrective</option>
              <option value="calibration">Calibration</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <ModernInput
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter maintenance title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the maintenance work"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <ModernInput
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time *
            </label>
            <ModernInput
              type="time"
              value={formData.scheduled_time}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (hours)
            </label>
            <ModernInput
              type="number"
              min="1"
              value={formData.estimated_duration}
              onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 1 }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority *
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned To
            </label>
            <ModernInput
              value={formData.assigned_to}
              onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
              placeholder="Technician name or ID"
            />
          </div>
        </div>

        {/* Recurrence Options */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Recurrence (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repeat
              </label>
              <select
                value={formData.recurrence_type}
                onChange={(e) => setFormData(prev => ({ ...prev, recurrence_type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {formData.recurrence_type !== 'none' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Every
                  </label>
                  <div className="flex gap-2">
                    <ModernInput
                      type="number"
                      min="1"
                      value={formData.recurrence_interval}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurrence_interval: parseInt(e.target.value) || 1 }))}
                      className="flex-1"
                    />
                    <span className="flex items-center text-sm text-gray-600">
                      {formData.recurrence_type === 'daily' && 'day(s)'}
                      {formData.recurrence_type === 'weekly' && 'week(s)'}
                      {formData.recurrence_type === 'monthly' && 'month(s)'}
                      {formData.recurrence_type === 'yearly' && 'year(s)'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <ModernInput
                    type="date"
                    value={formData.recurrence_end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurrence_end_date: e.target.value }))}
                    min={formData.scheduled_date}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <ModernButton
            type="button"
            onClick={() => {
              setShowForm(false)
              setEditingSchedule(null)
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
            {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
          </ModernButton>
        </div>
      </form>
    </ModernCard>
  )

  const renderScheduleList = () => (
    <ModernCard variant="default" padding="lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Maintenance Schedules</h2>
        <div className="flex gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <ModernButton
              onClick={() => setView('list')}
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
            >
              List
            </ModernButton>
            <ModernButton
              onClick={() => setView('calendar')}
              variant={view === 'calendar' ? 'default' : 'ghost'}
              size="sm"
            >
              Calendar
            </ModernButton>
          </div>
          <ModernButton
            onClick={() => setShowForm(true)}
            variant="default"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Schedule Maintenance
          </ModernButton>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-8">
          <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No maintenance schedules found</p>
          <ModernButton
            onClick={() => setShowForm(true)}
            variant="outline"
            size="sm"
            className="mt-3"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Schedule First Maintenance
          </ModernButton>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{schedule.title}</h3>
                    <ModernBadge variant="outline" size="sm" className={getTypeColor(schedule.type)}>
                      {schedule.type}
                    </ModernBadge>
                    <ModernBadge variant="outline" size="sm" className={getPriorityColor(schedule.priority)}>
                      {schedule.priority}
                    </ModernBadge>
                    <ModernBadge variant="outline" size="sm" className={getStatusColor(schedule.status)}>
                      {schedule.status}
                    </ModernBadge>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Equipment: {schedule.equipment_name}</p>
                    <p className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(schedule.scheduled_date), 'MMM d, yyyy h:mm a')}
                    </p>
                    <p className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Estimated duration: {schedule.estimated_duration} hours
                    </p>
                    {schedule.assigned_to && (
                      <p className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Assigned to: {schedule.assigned_to}
                      </p>
                    )}
                    {schedule.recurrence_pattern && (
                      <p className="flex items-center gap-1">
                        <Repeat className="w-4 h-4" />
                        Recurs: {schedule.recurrence_pattern.type} (every {schedule.recurrence_pattern.interval})
                      </p>
                    )}
                  </div>

                  {schedule.description && (
                    <p className="text-sm text-gray-700 mt-2">{schedule.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <ModernButton
                    onClick={() => handleEdit(schedule)}
                    variant="outline"
                    size="sm"
                    leftIcon={<Edit className="w-4 h-4" />}
                  >
                    Edit
                  </ModernButton>
                  <ModernButton
                    onClick={() => handleDelete(schedule.id)}
                    variant="outline"
                    size="sm"
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    Delete
                  </ModernButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ModernCard>
  )

  return (
    <div className="space-y-6">
      {showForm ? renderMaintenanceForm() : renderScheduleList()}
    </div>
  )
}