'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernBadge } from '@/components/ui/modern-badge'
import {
  Calendar,
  Clock,
  Wrench,
  Plus,
  Edit,
  Trash2,
  Repeat,
  Users,
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
      setError('Gagal memuat jadwal pemeliharaan')
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
        setError(data.error || 'Gagal menyimpan jadwal pemeliharaan')
      }
    } catch (error) {
      setError('Masalah jaringan. Silakan coba lagi.')
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
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal pemeliharaan ini?')) {
      return
    }

    try {
      const response = await fetch(`/api/maintenance/${scheduleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchMaintenanceSchedules()
      } else {
        setError('Gagal menghapus jadwal pemeliharaan')
      }
    } catch (error) {
      setError('Masalah jaringan. Silakan coba lagi.')
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

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent': return { label: 'Mendesak', color: 'bg-red-50 text-red-600 border-red-200' }
      case 'high': return { label: 'Tinggi', color: 'bg-orange-50 text-orange-600 border-orange-200' }
      case 'medium': return { label: 'Sedang', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' }
      case 'low': return { label: 'Rendah', color: 'bg-green-50 text-green-600 border-green-200' }
      default: return { label: 'Sedang', color: 'text-gray-600 border-gray-200' }
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { label: 'Selesai', color: 'bg-green-50 text-green-600 border-green-200' }
      case 'in_progress': return { label: 'Proses', color: 'bg-blue-50 text-blue-600 border-blue-200' }
      case 'scheduled': return { label: 'Terjadwal', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' }
      case 'cancelled': return { label: 'Batal', color: 'bg-gray-100 text-gray-500 border-gray-200' }
      default: return { label: status, color: 'text-gray-600' }
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'preventive': return 'Pencegahan'
      case 'corrective': return 'Perbaikan'
      case 'calibration': return 'Kalibrasi'
      default: return type
    }
  }

  const renderMaintenanceForm = () => (
    <div className="bg-white rounded-[20px] p-6 sm:p-8 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Satoshi, sans-serif' }}>
          {editingSchedule ? 'Edit Jadwal Pemeliharaan' : 'Jadwal Pemeliharaan Baru'}
        </h2>
        <button
          onClick={() => {
            setShowForm(false)
            setEditingSchedule(null)
            resetForm()
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span className="sr-only">Tutup</span>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Peralatan *</label>
            <div className="relative">
              <select
                value={formData.equipment_id}
                onChange={(e) => setFormData(prev => ({ ...prev, equipment_id: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:ring-4 focus:ring-[#ff007a]/10 outline-none transition-all appearance-none"
                required
                disabled={!!equipmentId}
              >
                <option value="">Pilih Peralatan</option>
                {equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} ({eq.serial_number})
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tipe Pemeliharaan *</label>
            <div className="relative">
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:ring-4 focus:ring-[#ff007a]/10 outline-none transition-all appearance-none"
                required
              >
                <option value="preventive">Pencegahan (Preventive)</option>
                <option value="corrective">Perbaikan (Corrective)</option>
                <option value="calibration">Kalibrasi</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Judul Kegiatan *</label>
          <input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Contoh: Pembersihan Lensa Rutin"
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:ring-4 focus:ring-[#ff007a]/10 outline-none transition-all"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Deskripsi Detail</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Jelaskan langkah-langkah atau detail pekerjaan..."
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:ring-4 focus:ring-[#ff007a]/10 outline-none transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tanggal *</label>
            <input
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:ring-4 focus:ring-[#ff007a]/10 outline-none transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Waktu *</label>
            <input
              type="time"
              value={formData.scheduled_time}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:ring-4 focus:ring-[#ff007a]/10 outline-none transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Durasi (jam)</label>
            <input
              type="number"
              min="1"
              value={formData.estimated_duration}
              onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 1 }))}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:ring-4 focus:ring-[#ff007a]/10 outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Prioritas *</label>
            <div className="relative">
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:ring-4 focus:ring-[#ff007a]/10 outline-none transition-all appearance-none"
                required
              >
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
                <option value="urgent">Mendesak</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Ditugaskan Kepada</label>
            <input
              value={formData.assigned_to}
              onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
              placeholder="Nama Teknisi atau ID"
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:ring-4 focus:ring-[#ff007a]/10 outline-none transition-all"
            />
          </div>
        </div>

        {/* Recurrence Options */}
        <div className="pt-6 border-t border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4" style={{ fontFamily: 'Satoshi, sans-serif' }}>Pengulangan (Opsional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Ulangi</label>
              <div className="relative">
                <select
                  value={formData.recurrence_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurrence_type: e.target.value as any }))}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:ring-4 focus:ring-[#ff007a]/10 outline-none transition-all appearance-none"
                >
                  <option value="none">Tidak berulang</option>
                  <option value="daily">Harian</option>
                  <option value="weekly">Mingguan</option>
                  <option value="monthly">Bulanan</option>
                  <option value="yearly">Tahunan</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {formData.recurrence_type !== 'none' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Setiap</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="1"
                      value={formData.recurrence_interval}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurrence_interval: parseInt(e.target.value) || 1 }))}
                      className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:ring-4 focus:ring-[#ff007a]/10 outline-none transition-all"
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {formData.recurrence_type === 'daily' && 'hari'}
                      {formData.recurrence_type === 'weekly' && 'minggu'}
                      {formData.recurrence_type === 'monthly' && 'bulan'}
                      {formData.recurrence_type === 'yearly' && 'tahun'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Sampai Tanggal (Opsional)</label>
                  <input
                    type="date"
                    value={formData.recurrence_end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurrence_end_date: e.target.value }))}
                    min={formData.scheduled_date}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:ring-4 focus:ring-[#ff007a]/10 outline-none transition-all"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={() => {
              setShowForm(false)
              setEditingSchedule(null)
              resetForm()
            }}
            className="px-6 py-3 rounded-xl border-2 border-gray-100 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 rounded-xl bg-[#ff007a] text-white font-semibold hover:bg-[#e6006e] transition-colors shadow-lg shadow-[#ff007a]/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {editingSchedule ? 'Simpan Perubahan' : 'Buat Jadwal'}
          </button>
        </div>
      </form>
    </div>
  )

  const renderScheduleList = () => (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Satoshi, sans-serif' }}>
          Jadwal Pemeliharaan
        </h2>

        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 rounded-xl bg-[#ff007a] text-white font-semibold hover:bg-[#e6006e] transition-colors shadow-lg shadow-[#ff007a]/30 flex items-center gap-2 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span>Jadwalkan Pemeliharaan</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 border-4 border-[#ff007a]/20 border-t-[#ff007a] rounded-full animate-spin mb-4" />
          <span className="text-gray-500 font-medium">Memuat data...</span>
        </div>
      ) : schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Wrench className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Belum ada jadwal</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">
            Belum ada kegiatan pemeliharaan yang dijadwalkan. Buat jadwal pertama Anda sekarang.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 rounded-xl border-2 border-[#ff007a] text-[#ff007a] font-semibold hover:bg-[#ff007a] hover:text-white transition-all"
          >
            Buat Jadwal Pertama
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {schedules.map((schedule) => {
            const statusConfig = getStatusConfig(schedule.status)
            const priorityConfig = getPriorityConfig(schedule.priority)

            return (
              <div key={schedule.id} className="p-6 hover:bg-gray-50/50 transition-colors group">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Icon Column */}
                  <div className="hidden lg:flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-[#ff007a]/10 group-hover:text-[#ff007a] transition-colors">
                      <Wrench className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getTypeColorClass(schedule.type)}`}>
                        {getTypeLabel(schedule.type)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${priorityConfig.color}`}>
                        {priorityConfig.label}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#ff007a] transition-colors">
                      {schedule.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4 font-medium">
                      {schedule.equipment_name}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{format(new Date(schedule.scheduled_date), 'dd MMM yyyy', { locale: id })}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{schedule.estimated_duration} Jam</span>
                      </div>
                      {schedule.assigned_to && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{schedule.assigned_to}</span>
                        </div>
                      )}
                      {schedule.recurrence_pattern && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                          <Repeat className="w-4 h-4 text-gray-400" />
                          <span>Setiap {schedule.recurrence_pattern.interval} {schedule.recurrence_pattern.type}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex lg:flex-col gap-2 mt-4 lg:mt-0">
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div className="w-full">
      {showForm ? renderMaintenanceForm() : renderScheduleList()}
    </div>
  )
}

function getTypeColorClass(type: string) {
  switch (type) {
    case 'preventive': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'corrective': return 'bg-red-50 text-red-700 border-red-200'
    case 'calibration': return 'bg-purple-50 text-purple-700 border-purple-200'
    default: return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}