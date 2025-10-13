'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay, addDays, addHours, setHours, setMinutes } from 'date-fns'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, Wrench } from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  type: 'reservation' | 'maintenance'
  status: string
  equipment_name: string
  user_name?: string
  color: string
}

interface CalendarViewProps {
  equipmentId?: string
  userId?: string
  onEventClick?: (event: CalendarEvent) => void
  onTimeSlotClick?: (date: Date, time: string) => void
  onDateClick?: (date: Date) => void
}

export function CalendarView({
  equipmentId,
  userId,
  onEventClick,
  onTimeSlotClick,
  onDateClick
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [availability, setAvailability] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [view, setView] = useState<'month' | 'week'>('month')

  useEffect(() => {
    loadCalendarData()
  }, [currentMonth, equipmentId, userId, view])

  const loadCalendarData = async () => {
    try {
      setIsLoading(true)

      const startDate = view === 'month'
        ? startOfMonth(currentMonth)
        : startOfWeek(currentMonth)

      const endDate = view === 'month'
        ? endOfMonth(currentMonth)
        : endOfWeek(currentMonth)

      const params = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        view
      })

      if (equipmentId) params.append('equipment_id', equipmentId)
      if (userId) params.append('user_id', userId)

      const response = await fetch(`/api/calendar?${params}`)
      const data = await response.json()

      if (data.success) {
        const processedEvents = data.calendar.events.map((event: any) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }))

        setEvents(processedEvents)
        setAvailability(data.calendar.availability)
      }
    } catch (error) {
      console.error('Error loading calendar data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev =>
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    )
  }

  const renderHeader = () => (
    <div className="mb-6">
      {/* Mobile Header */}
      <div className="lg:hidden space-y-4">
        {/* Month Navigation Row */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {format(currentMonth, 'MMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <ModernButton
              onClick={() => navigateMonth('prev')}
              variant="outline"
              size="sm"
              className="p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </ModernButton>
            <ModernButton
              onClick={() => navigateMonth('next')}
              variant="outline"
              size="sm"
              className="p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </ModernButton>
          </div>
        </div>

        {/* View Toggle and Today Button */}
        <div className="flex items-center justify-between">
          <div className="flex bg-gray-100 rounded-lg p-1 flex-1 max-w-xs">
            <ModernButton
              onClick={() => setView('month')}
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 text-xs"
            >
              Month
            </ModernButton>
            <ModernButton
              onClick={() => setView('week')}
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 text-xs"
            >
              Week
            </ModernButton>
          </div>

          <ModernButton
            onClick={() => setCurrentMonth(new Date())}
            variant="outline"
            size="sm"
            className="ml-3 text-xs px-3"
          >
            Today
          </ModernButton>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <ModernButton
              onClick={() => navigateMonth('prev')}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </ModernButton>
            <ModernButton
              onClick={() => navigateMonth('next')}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="w-4 h-4" />
            </ModernButton>
          </div>
        </div>

        <div className="flex gap-2">
          <ModernButton
            onClick={() => setView('month')}
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
          >
            Month
          </ModernButton>
          <ModernButton
            onClick={() => setView('week')}
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
          >
            Week
          </ModernButton>
          <ModernButton
            onClick={() => setCurrentMonth(new Date())}
            variant="outline"
            size="sm"
            leftIcon={<Calendar className="w-4 h-4" />}
          >
            Today
          </ModernButton>
        </div>
      </div>
    </div>
  )

  const renderLegend = () => (
    <div className="mb-4">
      {/* Mobile Legend */}
      <div className="lg:hidden space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
            <span className="truncate">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
            <span className="truncate">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
            <span className="truncate">Maintenance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
            <span className="truncate">Urgent</span>
          </div>
        </div>
      </div>

      {/* Desktop Legend */}
      <div className="hidden lg:flex lg:items-center lg:gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Approved Reservation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Pending Reservation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span>Maintenance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Urgent Maintenance</span>
        </div>
      </div>
    </div>
  )

  const renderMonthGrid = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
      <div className="space-y-4">
        {/* Mobile Calendar */}
        <div className="lg:hidden space-y-3">
          {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => {
            const weekDays = days.slice(weekIndex * 7, (weekIndex + 1) * 7)

            return (
              <div key={weekIndex} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Week Header */}
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <div className="text-sm font-medium text-gray-700">
                    Week of {format(weekDays[0], 'MMM d')}
                  </div>
                </div>

                {/* Week Days Grid */}
                <div className="grid grid-cols-7 gap-px bg-gray-200">
                  {weekDays.map(day => {
                    const dayEvents = events.filter(event =>
                      isSameDay(event.start, day) || isSameDay(event.end, day)
                    )
                    const isCurrentMonth = isSameMonth(day, currentMonth)
                    const isToday = isSameDay(day, new Date())
                    const isSelected = isSameDay(day, selectedDate)
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6

                    return (
                      <div
                        key={day.toString()}
                        className={`
                          bg-white p-1 min-h-[60px] cursor-pointer border-r border-b border-gray-200
                          ${!isCurrentMonth ? 'bg-gray-50' : ''}
                          ${isToday ? 'bg-blue-50' : ''}
                          ${isSelected ? 'ring-1 ring-blue-500' : ''}
                          ${isWeekend ? 'bg-gray-50' : ''}
                          hover:bg-gray-50 transition-colors relative
                        `}
                        onClick={() => {
                          setSelectedDate(day)
                          onDateClick?.(day)
                        }}
                      >
                        <div className={`text-xs font-medium mb-1 text-center ${
                          isToday ? 'text-blue-600' :
                          !isCurrentMonth ? 'text-gray-400' :
                          isWeekend ? 'text-gray-600' : 'text-gray-900'
                        }`}>
                          {format(day, 'd')}
                        </div>

                        {/* Events - Simplified for mobile */}
                        {dayEvents.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-center">
                              <div
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: dayEvents[0].color }}
                              />
                            </div>
                            {dayEvents.length > 1 && (
                              <div className="text-xs text-center text-gray-500">
                                +{dayEvents.length}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop Calendar */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {/* Week day headers */}
            {weekDays.map(day => (
              <div key={day} className="bg-gray-50 p-2 text-center text-sm font-semibold text-gray-700">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map(day => {
              const dayEvents = events.filter(event =>
                isSameDay(event.start, day) || isSameDay(event.end, day)
              )

              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isToday = isSameDay(day, new Date())
              const isSelected = isSameDay(day, selectedDate)

              return (
                <div
                  key={day.toString()}
                  className={`
                    bg-white p-2 min-h-[100px] cursor-pointer border-r border-b border-gray-200
                    ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                    ${isToday ? 'bg-blue-50' : ''}
                    ${isSelected ? 'ring-2 ring-blue-500' : ''}
                    hover:bg-gray-50 transition-colors
                  `}
                  onClick={() => {
                    setSelectedDate(day)
                    onDateClick?.(day)
                  }}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event, idx) => (
                      <div
                        key={`${event.id}-${idx}`}
                        className="text-xs p-1 rounded truncate cursor-pointer"
                        style={{ backgroundColor: event.color + '20', color: event.color }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick?.(event)
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentMonth)
    const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })
    const hours = Array.from({ length: 16 }, (_, i) => i + 6) // 6 AM to 9 PM

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Time column header */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-2 bg-gray-50 text-center text-sm font-semibold text-gray-700">
            Time
          </div>
          {weekDays.map(day => (
            <div key={day.toString()} className="p-2 bg-gray-50 text-center border-l">
              <div className="text-sm font-semibold text-gray-700">
                {format(day, 'EEE')}
              </div>
              <div className={`text-xs ${isSameDay(day, new Date()) ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                {format(day, 'MMM d')}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="max-h-[600px] overflow-y-auto">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b">
              <div className="p-2 bg-gray-50 text-center text-sm text-gray-600 border-r">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>

              {weekDays.map(day => {
                const hourStart = setHours(setMinutes(day, 0), hour)
                const hourEnd = addHours(hourStart, 1)

                const hourEvents = events.filter(event =>
                  (event.start < hourEnd && event.end > hourStart)
                )

                return (
                  <div
                    key={`${day.toString()}-${hour}`}
                    className="p-1 border-l border-r min-h-[40px] hover:bg-gray-50 cursor-pointer"
                    onClick={() => onTimeSlotClick?.(day, `${hour.toString().padStart(2, '0')}:00`)}
                  >
                    {hourEvents.map((event, idx) => (
                      <div
                        key={`${event.id}-${idx}`}
                        className="text-xs p-1 mb-1 rounded truncate cursor-pointer"
                        style={{ backgroundColor: event.color + '20', color: event.color }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick?.(event)
                        }}
                      >
                        {event.user_name && <Users className="w-3 h-3 inline mr-1" />}
                        {event.type === 'maintenance' && <Wrench className="w-3 h-3 inline mr-1" />}
                        {event.title}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <ModernCard variant="default" padding="lg" className="w-full">
      {renderHeader()}
      {renderLegend()}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="ml-2 text-gray-600">Loading calendar...</span>
        </div>
      ) : (
        <div>
          {view === 'month' ? renderMonthGrid() : renderWeekView()}
        </div>
      )}

      {selectedDate && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            Selected: <strong>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</strong>
            {onTimeSlotClick && (
              <span className="ml-2">
                Click on a time slot to make a reservation
              </span>
            )}
          </p>
        </div>
      )}
    </ModernCard>
  )
}