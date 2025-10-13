'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernBadge } from '@/components/ui/modern-badge'
import { Calendar, Clock, Users, Filter, Search, MoreHorizontal } from 'lucide-react'

interface Reservation {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'
  equipment_name: string
  equipment_id: string
  user_name: string
  user_email: string
  user_role: string
  category_name?: string
  duration_hours: number
}

interface ReservationListProps {
  equipmentId?: string
  userId?: string
  onEdit?: (reservation: Reservation) => void
  onCancel?: (reservation: Reservation) => void
}

export function ReservationList({ equipmentId, userId, onEdit, onCancel }: ReservationListProps) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadReservations()
  }, [currentPage, equipmentId, userId, statusFilter])

  const loadReservations = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })

      if (equipmentId) params.append('equipment_id', equipmentId)
      if (userId) params.append('user_id', userId)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/reservations?${params}`)
      const data = await response.json()

      if (data.success) {
        setReservations(data.reservations)
        setTotalPages(data.pagination.pages)
      } else {
        setError(data.error || 'Failed to load reservations')
      }
    } catch (error) {
      console.error('Error loading reservations:', error)
      setError('Failed to load reservations')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return '✓'
      case 'pending':
        return '⏱'
      case 'rejected':
        return '✗'
      case 'cancelled':
        return '○'
      case 'completed':
        return '✓'
      default:
        return '?'
    }
  }

  const filteredReservations = reservations.filter(reservation =>
    reservation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.user_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCancel = async (reservation: Reservation) => {
    if (!confirm(`Are you sure you want to cancel this reservation?`)) {
      return
    }

    try {
      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        loadReservations()
        onCancel?.(reservation)
      } else {
        setError(data.error || 'Failed to cancel reservation')
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error)
      setError('Failed to cancel reservation')
    }
  }

  return (
    <ModernCard variant="default" padding="lg" className="w-full">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Reservations</h3>
          <ModernButton
            onClick={() => window.location.href = '/calendar'}
            variant="outline"
            size="sm"
            leftIcon={<Calendar className="w-4 h-4" />}
          >
            Calendar View
          </ModernButton>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reservations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Reservations List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No reservations found</p>
            </div>
          ) : (
            filteredReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-gray-900">
                          {reservation.title}
                        </span>
                        <ModernBadge variant="outline" size="sm" className={getStatusColor(reservation.status)}>
                          {getStatusIcon(reservation.status)} {reservation.status}
                        </ModernBadge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{reservation.user_name}</span>
                        <span className="text-gray-400">•</span>
                        <span>{reservation.user_role}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{reservation.equipment_name}</span>
                        </div>
                        {reservation.category_name && (
                          <ModernBadge variant="outline" size="sm">
                            {reservation.category_name}
                          </ModernBadge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {format(new Date(reservation.start_time), 'MMM d, yyyy h:mm a')} - {format(new Date(reservation.end_time), 'h:mm a')}
                          </span>
                        </div>
                        <span className="text-gray-400">•</span>
                        <span>{reservation.duration_hours} hours</span>
                      </div>

                      {reservation.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {reservation.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onEdit && reservation.status === 'pending' && (
                      <ModernButton
                        onClick={() => onEdit(reservation)}
                        variant="outline"
                        size="sm"
                      >
                        Edit
                      </ModernButton>
                    )}
                    {(reservation.status === 'pending' || reservation.status === 'approved') && onCancel && (
                      <ModernButton
                        onClick={() => handleCancel(reservation)}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </ModernButton>
                    )}
                    <ModernButton
                      variant="ghost"
                      size="sm"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </ModernButton>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <ModernButton
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
              >
                Previous
              </ModernButton>
              <ModernButton
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
              >
                Next
              </ModernButton>
            </div>
          </div>
        )}
      </div>
    </ModernCard>
  )
}