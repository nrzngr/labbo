'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
import { supabase } from '@/lib/supabase'
import {
  Package,
  Calendar,
  Search,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  MapPin,
  Tag,
  FileText,
  Clock,
  ArrowLeft,
  Sparkles,
  GraduationCap,
  FlaskConical,
  Microscope
} from 'lucide-react'
import { BORROWING_CONFIG, getLimitsForRole } from '@/lib/borrowing-config'

interface Equipment {
  id: string
  name: string
  serial_number: string
  category?: { name: string }
  condition: string
  location: string
  description?: string
  image_url?: string
  stock: number
}

interface BorrowRequestFormProps {
  onSuccess: () => void
}

export function BorrowRequestForm({ onSuccess }: BorrowRequestFormProps) {
  const { user } = useCustomAuth()
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [returnDate, setReturnDate] = useState<string>(() => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().split('T')[0]
  })
  const [notes, setNotes] = useState('')
  const [purpose, setPurpose] = useState<'praktikum' | 'tugas_akhir' | 'penelitian' | 'lainnya'>('praktikum')
  const [quantity, setQuantity] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  const queryClient = useQueryClient()

  // Check current active borrowings count for limit enforcement
  const { data: activeBorrowingsCount = 0 } = useQuery({
    queryKey: ['active-borrowings-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0
      const { count, error } = await supabase
        .from('borrowing_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pending', 'active'] as any)

      if (error) throw error
      return count || 0
    },
    enabled: !!user?.id
  })

  // Check if user is banned
  const { data: bannedUntil } = useQuery({
    queryKey: ['user-banned-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from('users')
        .select('banned_until')
        .eq('id', user.id)
        .single()

      if (error) return null
      return (data as any)?.banned_until
    },
    enabled: !!user?.id
  })

  const isBanned = bannedUntil && new Date(bannedUntil) > new Date()
  const bannedUntilFormatted = bannedUntil ? new Date(bannedUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null

  const userLimits = getLimitsForRole(user?.role || 'mahasiswa')
  const hasReachedLimit = activeBorrowingsCount >= userLimits.maxItems
  const remainingSlots = userLimits.maxItems - activeBorrowingsCount

  const { data: availableEquipment, isLoading } = useQuery({
    queryKey: ['available-equipment', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('equipment')
        .select('*, categories(name), stock')
        .eq('status', 'available')
        .gt('stock', 0)
        .order('name')

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data as unknown as Equipment[]
    }
  })

  const borrowMutation = useMutation({
    mutationFn: async ({ equipmentId, expectedReturnDate, notes, purpose, quantity }: {
      equipmentId: string
      expectedReturnDate: string
      notes: string
      purpose: string
      quantity: number
    }) => {
      if (!user) throw new Error('User not authenticated')

      // Check if user is banned
      if (isBanned) {
        throw new Error(`Akun Anda telah diblokir hingga ${bannedUntilFormatted}. Silakan hubungi admin.`)
      }

      // Check borrowing limit before submitting
      if (hasReachedLimit) {
        throw new Error(`Anda telah mencapai batas maksimal peminjaman (${userLimits.maxItems} item)`)
      }

      // Check stock availability
      const { data: equipmentData, error: stockError } = await supabase
        .from('equipment')
        .select('stock, name')
        .eq('id', equipmentId)
        .single()

      if (stockError) throw stockError

      if (!equipmentData || equipmentData.stock < quantity) {
        throw new Error(`Stok tidak cukup! Tersedia: ${equipmentData?.stock || 0} unit, diminta: ${quantity} unit`)
      }

      const borrowDate = new Date().toISOString().split('T')[0]

      // Submit via Server Action (handles DB insert and email notifications)
      const { submitBorrowRequest } = await import('@/app/actions/borrowing')

      const result = await submitBorrowRequest({
        equipmentId,
        expectedReturnDate,
        notes,
        purpose,
        quantity
      })

      return result.data
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['available-equipment'] })
      queryClient.invalidateQueries({ queryKey: ['my-borrowings'] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['active-borrowings-count'] })

      // Show success step
      setStep(4)
    }
  })

  const handleSelectEquipment = (equipment: Equipment) => {
    // Block if user reached borrowing limit or is banned
    if (hasReachedLimit || isBanned) return

    setSelectedEquipment(equipment)
    setStep(2)
  }

  const handleSubmitRequest = () => {
    if (!selectedEquipment || !user) return

    borrowMutation.mutate({
      equipmentId: selectedEquipment.id,
      expectedReturnDate: returnDate,
      notes,
      purpose,
      quantity
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const calculateDaysLeft = () => {
    const today = new Date()
    const target = new Date(returnDate)
    const diffTime = target.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getConditionInfo = (condition: string) => {
    const info: Record<string, { label: string; color: string; bg: string }> = {
      excellent: { label: 'Sangat Baik', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
      good: { label: 'Baik', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
      fair: { label: 'Cukup', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
      poor: { label: 'Rusak', color: 'text-red-700', bg: 'bg-red-50 border-red-200' }
    }
    return info[condition] || { label: condition, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' }
  }

  const minDate = new Date().toISOString().split('T')[0]
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
            ${step >= s
              ? 'bg-gradient-to-br from-[#ff007a] to-[#ff4d9e] text-white shadow-lg shadow-[rgba(255,0,122,0.3)]'
              : 'bg-gray-100 text-gray-400'
            }
          `}>
            {step > s ? <CheckCircle className="w-5 h-5" /> : s}
          </div>
          {i < 2 && (
            <div className={`w-16 h-1 mx-2 rounded-full transition-all ${step > s ? 'bg-gradient-to-r from-[#ff007a] to-[#ff4d9e]' : 'bg-gray-200'
              }`} />
          )}
        </div>
      ))}
    </div>
  )

  // Step 1: Search and Select Equipment
  if (step === 1) {
    return (
      <div className="space-y-6">
        <StepIndicator />

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Pilih Peralatan</h3>
          <p className="text-sm text-gray-500">Cari dan pilih peralatan yang ingin Anda pinjam</p>
        </div>

        {/* Banned User Warning */}
        {isBanned && (
          <div className="flex gap-3 p-4 bg-red-100 border-2 border-red-300 rounded-2xl">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <p className="font-bold mb-1">🚫 Akun Diblokir</p>
              <p className="text-red-700">Anda tidak dapat meminjam peralatan hingga <strong>{bannedUntilFormatted}</strong>. Silakan hubungi admin laboratorium untuk informasi lebih lanjut.</p>
            </div>
          </div>
        )}

        {/* Borrowing Limit Warning - More Prominent */}
        {!isBanned && hasReachedLimit && (
          <div className="relative overflow-hidden p-6 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl text-white shadow-lg shadow-red-500/30">
            {/* Background decoration */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white/10 rounded-full"></div>

            <div className="relative flex items-start gap-4">
              {/* Warning Icon */}
              <div className="flex-shrink-0 w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>

              <div className="flex-1">
                <h4 className="text-xl font-bold mb-2">⚠️ Batas Peminjaman Tercapai!</h4>
                <p className="text-red-100 text-sm leading-relaxed mb-3">
                  Anda sudah meminjam <span className="font-bold text-white">{activeBorrowingsCount} item</span> dari maksimal <span className="font-bold text-white">{userLimits.maxItems} item</span> yang diperbolehkan.
                </p>
                <div className="flex items-center gap-2 text-xs text-red-200">
                  <Clock className="w-4 h-4" />
                  <span>Kembalikan item terlebih dahulu untuk dapat meminjam lagi</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Remaining slots indicator - shown when not at limit */}
        {!isBanned && !hasReachedLimit && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-sm text-blue-700">Sisa kuota peminjaman:</span>
            <span className="font-bold text-blue-800">{remainingSlots} dari {userLimits.maxItems} item</span>
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari peralatan..."
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#ff007a] focus:bg-white focus:ring-4 focus:ring-[rgba(255,0,122,0.08)] outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Equipment List */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-[#ff007a]/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[#ff007a] border-t-transparent animate-spin"></div>
            </div>
            <div className="text-sm text-gray-500 font-medium">Memuat peralatan...</div>
          </div>
        ) : (
          <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {availableEquipment && availableEquipment.length > 0 ? (
              availableEquipment.map((equipment) => {
                const conditionInfo = getConditionInfo(equipment.condition)
                return (
                  <div
                    key={equipment.id}
                    className={`group relative p-4 bg-white border-2 rounded-2xl transition-all duration-300 ${hasReachedLimit || isBanned
                      ? 'border-gray-200 opacity-50 cursor-not-allowed'
                      : 'border-gray-100 cursor-pointer hover:border-[#ff007a] hover:shadow-xl hover:shadow-[rgba(255,0,122,0.1)] hover:-translate-y-0.5'
                      }`}
                    onClick={() => handleSelectEquipment(equipment)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Equipment Icon */}
                      <div className="w-16 h-16 bg-gradient-to-br from-[#ff007a]/10 to-[#ff007a]/5 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:from-[#ff007a]/20 group-hover:to-[#ff007a]/10 transition-all">
                        <Package className="w-8 h-8 text-[#ff007a]" />
                      </div>

                      {/* Equipment Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900 truncate">{equipment.name}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${conditionInfo.bg} ${conditionInfo.color}`}>
                            {conditionInfo.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5" />
                            {equipment.category?.name || 'Tidak berkategori'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {equipment.location}
                          </span>
                        </div>

                        <div className="mt-1 text-xs text-gray-400 font-mono">
                          SN: {equipment.serial_number}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#ff007a] transition-all">
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h4 className="font-bold text-lg text-gray-700 mb-2">Tidak ada peralatan</h4>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  {searchTerm ? 'Tidak ditemukan hasil untuk pencarian Anda' : 'Belum ada peralatan yang tersedia'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Step 2: Set Return Date and Notes
  if (step === 2) {
    return (
      <div className="space-y-6">
        <StepIndicator />

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Detail Peminjaman</h3>
          <p className="text-sm text-gray-500">Tentukan durasi dan catatan peminjaman</p>
        </div>

        {/* Selected Equipment Card */}
        {selectedEquipment && (
          <div className="p-4 bg-gradient-to-br from-[#ff007a]/5 to-[#ff007a]/10 border-2 border-[#ff007a]/20 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Package className="w-7 h-7 text-[#ff007a]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900">{selectedEquipment.name}</h4>
                <p className="text-sm text-gray-600">{selectedEquipment.category?.name} • {selectedEquipment.location}</p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-[#ff007a] font-medium hover:underline"
              >
                Ubah
              </button>
            </div>
          </div>
        )}

        {/* Purpose Selector */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <GraduationCap className="w-4 h-4" />
            Tujuan Peminjaman
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'praktikum', label: 'Praktikum', icon: FlaskConical },
              { value: 'tugas_akhir', label: 'Tugas Akhir / Skripsi', icon: GraduationCap },
              { value: 'penelitian', label: 'Penelitian', icon: Microscope },
              { value: 'lainnya', label: 'Lainnya', icon: FileText }
            ].map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.value}
                  onClick={() => setPurpose(item.value as any)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${purpose === item.value
                    ? 'border-[#ff007a] bg-[#ff007a]/10 text-[#ff007a]'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Return Date Picker */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Calendar className="w-4 h-4" />
            Tanggal Pengembalian
          </label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            min={minDate}
            max={maxDate}
            className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#ff007a] focus:bg-white focus:ring-4 focus:ring-[rgba(255,0,122,0.08)] outline-none transition-all text-sm"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Durasi peminjaman:</span>
            <span className="font-bold text-[#ff007a]">{calculateDaysLeft()} hari</span>
          </div>
        </div>

        {/* Quick Duration Buttons */}
        <div className="flex gap-2">
          {[3, 7, 14, 30].map((days) => {
            const date = new Date()
            date.setDate(date.getDate() + days)
            const dateStr = date.toISOString().split('T')[0]
            const isSelected = returnDate === dateStr
            return (
              <button
                key={days}
                onClick={() => setReturnDate(dateStr)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${isSelected
                  ? 'bg-[#ff007a] text-white shadow-lg shadow-[rgba(255,0,122,0.3)]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {days} hari
              </button>
            )
          })}
        </div>

        {/* Quantity Input */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Package className="w-4 h-4" />
            Jumlah Barang
          </label>

          {/* Stock Warning */}
          {selectedEquipment && (selectedEquipment.stock || 1) <= 3 && (
            <div className={`flex items-center gap-2 p-3 rounded-xl ${(selectedEquipment.stock || 1) === 0
              ? 'bg-red-50 border border-red-200'
              : 'bg-amber-50 border border-amber-200'
              }`}>
              <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${(selectedEquipment.stock || 1) === 0 ? 'text-red-500' : 'text-amber-500'
                }`} />
              <span className={`text-sm font-medium ${(selectedEquipment.stock || 1) === 0 ? 'text-red-700' : 'text-amber-700'
                }`}>
                {(selectedEquipment.stock || 1) === 0
                  ? 'Stok habis! Barang tidak tersedia untuk dipinjam.'
                  : `Stok terbatas! Hanya tersedia ${selectedEquipment.stock} unit.`}
              </span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center text-xl font-bold text-gray-600"
            >
              −
            </button>
            <div className="flex-1 text-center">
              <span className={`text-3xl font-bold ${quantity > (selectedEquipment?.stock || 1) ? 'text-red-500' : 'text-[#222222]'
                }`}>{quantity}</span>
              <p className="text-sm text-gray-500">unit</p>
            </div>
            <button
              onClick={() => setQuantity(Math.min(selectedEquipment?.stock || 10, Math.min(10, quantity + 1)))}
              disabled={quantity >= (selectedEquipment?.stock || 10) || quantity >= 10}
              className="w-12 h-12 rounded-xl bg-[#ff007a] hover:bg-[#e0106c] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-[rgba(255,0,122,0.3)]"
            >
              +
            </button>
          </div>

          {/* Quantity Warning */}
          {quantity > (selectedEquipment?.stock || 1) && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm font-medium text-red-700">
                Jumlah melebihi stok! Tersedia: {selectedEquipment?.stock || 0} unit
              </span>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">
            Tersedia: {selectedEquipment?.stock || 0} unit | Maks: 10 unit per peminjaman
          </p>
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FileText className="w-4 h-4" />
            Catatan <span className="text-gray-400 font-normal">(opsional)</span>
          </label>
          <textarea
            placeholder="Tulis catatan atau keperluan khusus..."
            className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#ff007a] focus:bg-white focus:ring-4 focus:ring-[rgba(255,0,122,0.08)] outline-none transition-all text-sm resize-none"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setStep(1)}
            className="flex-1 py-4 px-6 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
          <button
            onClick={() => setStep(3)}
            className="flex-1 py-4 px-6 bg-gradient-to-r from-[#ff007a] to-[#ff4d9e] text-white rounded-2xl font-semibold shadow-lg shadow-[rgba(255,0,122,0.3)] hover:shadow-xl hover:shadow-[rgba(255,0,122,0.4)] transition-all flex items-center justify-center gap-2"
          >
            Lanjutkan
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // Step 3: Confirmation
  if (step === 3) {
    const conditionInfo = getConditionInfo(selectedEquipment?.condition || 'good')

    return (
      <div className="space-y-6">
        <StepIndicator />

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Konfirmasi Peminjaman</h3>
          <p className="text-sm text-gray-500">Periksa detail sebelum mengajukan</p>
        </div>

        {/* Summary Card */}
        <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
          {selectedEquipment && (
            <>
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Package className="w-7 h-7 text-[#ff007a]" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{selectedEquipment.name}</h4>
                  <p className="text-sm text-gray-500 font-mono">SN: {selectedEquipment.serial_number}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Kategori</span>
                  <span className="font-medium text-gray-900">{selectedEquipment.category?.name || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Lokasi</span>
                  <span className="font-medium text-gray-900">{selectedEquipment.location}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Kondisi</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${conditionInfo.bg} ${conditionInfo.color}`}>
                    {conditionInfo.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Tanggal Pinjam</span>
                  <span className="font-medium text-gray-900">{formatDate(new Date().toISOString())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Tanggal Kembali</span>
                  <span className="font-bold text-[#ff007a]">{formatDate(returnDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Durasi</span>
                  <span className="font-medium text-gray-900">{calculateDaysLeft()} hari</span>
                </div>
                {notes && (
                  <div className="pt-3 border-t border-gray-200">
                    <span className="text-gray-500 text-sm block mb-1">Catatan</span>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded-xl">{notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Warning */}
        <div className="flex gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Perhatian:</p>
            <ul className="space-y-1 text-amber-700">
              <li>• Anda bertanggung jawab atas peralatan selama masa peminjaman</li>
              <li>• Keterlambatan pengembalian dapat dikenakan denda</li>
              <li>• Segera hubungi staf lab jika ada kerusakan</li>
            </ul>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setStep(2)}
            disabled={borrowMutation.isPending}
            className="flex-1 py-4 px-6 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
          <button
            onClick={handleSubmitRequest}
            disabled={borrowMutation.isPending}
            className="flex-1 py-4 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {borrowMutation.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Ajukan Peminjaman
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Step 4: Success
  if (step === 4) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        {/* Success Container */}
        <div className="w-full max-w-[469px] bg-[#F3F5F7] rounded-[20px] py-12 px-8 flex flex-col items-center">
          {/* Pink Circle with Check Icon */}
          <div className="w-[113px] h-[113px] bg-[#FD1278] rounded-full flex items-center justify-center mb-8 shadow-lg shadow-[rgba(253,18,120,0.3)]">
            <CheckCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
          </div>

          {/* Success Title */}
          <h2 className="text-[32px] font-bold text-[#222222] text-center mb-4 leading-tight">
            Pengajuan berhasil!
          </h2>

          {/* Subtitle */}
          <p className="text-[16px] text-[#222222] text-center leading-relaxed max-w-[262px]">
            Tunggu ya, peminjaman kamu sedang dicek oleh admin 😊
          </p>
        </div>

        {/* Close/Done Button */}
        <button
          onClick={() => onSuccess()}
          className="mt-8 w-full max-w-[300px] py-4 px-6 bg-gradient-to-r from-[#FD1278] to-[#ff4d9e] text-white rounded-full font-bold text-sm shadow-lg shadow-[rgba(253,18,120,0.3)] hover:shadow-xl hover:shadow-[rgba(253,18,120,0.4)] transition-all"
        >
          Selesai
        </button>
      </div>
    )
  }

  return null
}