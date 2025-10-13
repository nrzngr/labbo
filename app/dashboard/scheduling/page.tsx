'use client'

import { useState, useEffect } from 'react'
import { CalendarView } from '@/components/scheduling/calendar-view'
import { ReservationForm } from '@/components/scheduling/reservation-form'
import { ReservationList } from '@/components/scheduling/reservation-list'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ModernCard, ModernCardHeader } from '@/components/ui/modern-card'
import { ModernBadge } from '@/components/ui/modern-badge'
import { ModernButton } from '@/components/ui/modern-button'
import { Calendar, Plus, List, Settings, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default function SchedulingPage() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: Date; time: string } | null>(null)
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null)
  const [selectedEquipmentName, setSelectedEquipmentName] = useState<string | null>(null)
  const [showReservationForm, setShowReservationForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setSelectedTimeSlot({ date, time: '09:00' }) // Default to 9 AM
  }

  const handleTimeSlotClick = (date: Date, time: string) => {
    setSelectedDate(date)
    setSelectedTimeSlot({ date, time })
    setShowReservationForm(true)
  }

  const handleEventClick = (event: any) => {
    // Handle event click - could show event details or edit form
    console.log('Event clicked:', event)
  }

  const handleReservationSuccess = () => {
    setShowReservationForm(false)
    setSelectedTimeSlot(null)
    setRefreshKey(prev => prev + 1) // Trigger refresh of components
  }

  const handleNewReservation = () => {
    setShowReservationForm(true)
    setSelectedTimeSlot(null)
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 page-gradient min-h-screen">
        <ModernCard variant="elevated" padding="lg" className="mb-6 sm:mb-8 fade-in">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-blue-600 rounded-xl">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 mb-1 sm:mb-2">
                  Penjadwalan Peralatan
                </h1>
                <p className="text-sm sm:text-base text-gray-600 font-medium">
                  Reservasi dan kelola jadwal penggunaan peralatan laboratorium
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <ModernButton
                onClick={handleNewReservation}
                variant="default"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                className="w-full sm:w-auto button-hover-lift"
              >
                Reservasi Baru
              </ModernButton>

              <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                <ModernButton
                  onClick={() => setView('calendar')}
                  variant={view === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  leftIcon={<Calendar className="w-4 h-4" />}
                  className="flex-1 sm:flex-initial"
                >
                  Kalender
                </ModernButton>
                <ModernButton
                  onClick={() => setView('list')}
                  variant={view === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  leftIcon={<List className="w-4 h-4" />}
                  className="flex-1 sm:flex-initial"
                >
                  Daftar
                </ModernButton>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Aktif</span>
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-xl">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">
              --
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">
              Reservasi aktif
            </div>
          </ModernCard>

          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Menunggu</span>
              <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-xl">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">
              --
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">
              Menunggu persetujuan
            </div>
          </ModernCard>

          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Tersedia</span>
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-xl">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">
              --
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">
              Peralatan tersedia
            </div>
          </ModernCard>

          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Total</span>
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-xl">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">
              --
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">
              Total reservasi
            </div>
          </ModernCard>
        </div>

      {/* Selected Time Slot Info - Mobile & Desktop */}
        {selectedTimeSlot && (
          <ModernCard variant="default" padding="lg" className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4">
              <ModernCardHeader
                title="Slot Waktu Terpilih"
                description="Konfirmasi reservasi untuk slot waktu ini"
                className="mb-0"
              />
              <ModernButton
                onClick={() => setSelectedTimeSlot(null)}
                variant="ghost"
                size="sm"
                className="text-gray-500"
              >
                ✕
              </ModernButton>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Tanggal:</span>
                  <span className="font-medium">{selectedTimeSlot.date.toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Waktu:</span>
                  <span className="font-medium">{selectedTimeSlot.time}</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <ModernButton
                  onClick={() => setShowReservationForm(true)}
                  variant="default"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Reservasi Slot Ini
                </ModernButton>
              </div>
            </div>
          </ModernCard>
        )}

        {/* Quick Actions */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <ModernButton
            variant="outline"
            className="justify-start"
            leftIcon={<Calendar className="w-4 h-4" />}
            onClick={() => setSelectedDate(new Date())}
          >
            Lihat Hari Ini
          </ModernButton>
          <ModernButton
            variant="outline"
            className="justify-start"
            leftIcon={<Settings className="w-4 h-4" />}
          >
            Jadwal Berulang
          </ModernButton>
          <ModernButton
            variant="outline"
            className="justify-start"
            leftIcon={<List className="w-4 h-4" />}
          >
            Riwayat Reservasi
          </ModernButton>
          <ModernButton
            variant="outline"
            className="justify-start"
            leftIcon={<AlertCircle className="w-4 h-4" />}
          >
            Bantuan
          </ModernButton>
        </div>

        {/* Main Calendar/List View */}
        <div className="slide-up">
          <ModernCard variant="default" padding="lg">
            <div className="flex items-center justify-between mb-6">
              <ModernCardHeader
                title={view === 'calendar' ? 'Kalender Reservasi' : 'Daftar Reservasi'}
                description={view === 'calendar' ? 'Klik pada tanggal dan waktu untuk melakukan reservasi' : 'Kelola semua reservasi yang ada'}
                className="mb-0"
              />
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {view === 'calendar' ? (
                <CalendarView
                  onDateClick={handleDateClick}
                  onTimeSlotClick={handleTimeSlotClick}
                  onEventClick={handleEventClick}
                />
              ) : (
                <ReservationList
                  onEdit={(reservation) => {
                    console.log('Edit reservation:', reservation)
                  }}
                  onCancel={(reservation) => {
                    setRefreshKey(prev => prev + 1)
                  }}
                />
              )}
            </div>
          </ModernCard>
        </div>
      </div>

      {/* Reservation Form Modal */}
      {showReservationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[85vh] overflow-y-auto">
            <ReservationForm
              equipmentId={selectedEquipmentId || ''}
              equipmentName={selectedEquipmentName || 'Pilih Peralatan'}
              onReservationSuccess={handleReservationSuccess}
              onCancel={() => {
                setShowReservationForm(false)
                setSelectedTimeSlot(null)
              }}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}