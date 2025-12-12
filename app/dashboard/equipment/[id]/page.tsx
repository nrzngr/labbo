"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QRCodeDisplay } from '@/components/equipment/qr-code-display'
import { ImageGallery } from '@/components/equipment/image-gallery'
import { ImageUpload } from '@/components/equipment/image-upload'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
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
  QrCode,
  Tag,
  DollarSign
} from 'lucide-react'

interface Equipment {
  id: string
  name: string
  serial_number: string
  category: { id: string; name: string } | string
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

  const { user } = useCustomAuth()
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([])
  const [images, setImages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'maintenance' | 'images' | 'qr'>('overview')

  useEffect(() => {
    if (equipmentId) {
      fetchEquipmentDetails()
      fetchMaintenanceHistory()
      fetchImages()
    }
  }, [equipmentId])

  const fetchImages = async () => {
    try {
      const response = await fetch(`/api/equipment/${equipmentId}/images`)
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
      }
    } catch (error) {
      console.error('Error fetching images:', error)
    }
  }

  const handleImageUploadComplete = (newImages: any[]) => {
    setImages(prev => [...prev, ...newImages])
  }

  const handleImageDelete = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
  }

  const handleImageSetPrimary = (imageId: string) => {
    setImages(prev => prev.map(img => ({ ...img, is_primary: img.id === imageId })))
  }

  const fetchEquipmentDetails = async () => {
    try {
      const response = await fetch(`/api/equipment/${equipmentId}`)
      if (response.ok) {
        const data = await response.json()
        setEquipment(data.equipment)
      } else {
        setError('Gagal memuat detail peralatan')
      }
    } catch (error) {
      setError('Kesalahan jaringan. Silakan coba lagi.')
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
      <div className="min-h-screen page-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#ff007a] border-t-transparent"></div>
          <p className="text-sm font-medium text-[#6d7079]">Memuat detail peralatan...</p>
        </div>
      </div>
    )
  }

  if (error || !equipment) {
    return (
      <div className="min-h-screen page-gradient flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-[#ff007a]" />
          <p className="mb-4 text-sm font-medium text-[#b4235d]">{error || 'Peralatan tidak ditemukan'}</p>
          <ModernButton onClick={() => router.back()} variant="outline">
            Kembali
          </ModernButton>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen page-gradient pb-10">
      {/* Enhanced Header with Gradient */}
      <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500"></div>
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ModernButton
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-900"
                leftIcon={<ArrowLeft className="w-5 h-5" />}
              >
                Kembali
              </ModernButton>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{equipment.name}</h1>
                  <ModernBadge variant="outline" className={getStatusColor(equipment.status)}>
                    {equipment.status}
                  </ModernBadge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                    <QrCode className="w-3 h-3" />
                    {equipment.serial_number}
                  </span>
                  {equipment.category && (
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      {typeof equipment.category === 'object' ? equipment.category?.name : equipment.category}
                    </span>
                  )}
                  {equipment.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {equipment.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ModernButton
                onClick={handleEditEquipment}
                variant="outline"
                leftIcon={<Edit className="w-4 h-4" />}
              >
                Edit
              </ModernButton>

              {equipment.status === 'available' && (
                <>
                  <ModernButton
                    onClick={handleBorrowEquipment}
                    variant="default"
                    className="shadow-lg shadow-pink-200"
                  >
                    Pinjam Sekarang
                  </ModernButton>
                  <ModernButton
                    onClick={handleReserveEquipment}
                    variant="outline"
                    leftIcon={<Calendar className="w-4 h-4" />}
                  >
                    Reservasi
                  </ModernButton>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: 'Ringkasan', icon: FileText },
              { id: 'maintenance', label: 'Pemeliharaan', icon: Wrench },
              { id: 'images', label: `Foto (${images.length})`, icon: Camera },
              { id: 'qr', label: 'QR Code', icon: QrCode },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`group flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                  ? 'border-[#ff007a] text-[#ff007a]'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                  }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[#ff007a]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Information Card */}
              <ModernCard variant="default" padding="lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Detail Peralatan</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                      <Tag className="w-3 h-3" /> Kategori
                    </p>
                    <p className="font-medium text-gray-900">
                      {typeof equipment.category === 'object' ? equipment.category?.name : equipment.category || '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" /> Kondisi
                    </p>
                    {equipment.condition ? (
                      <ModernBadge variant="outline" className={getConditionColor(equipment.condition)}>
                        {equipment.condition}
                      </ModernBadge>
                    ) : (
                      <span className="text-gray-400 italic">Tidak spesifik</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> Lokasi
                    </p>
                    <p className="font-medium text-gray-900">{equipment.location || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Tanggal Ditambahkan
                    </p>
                    <p className="font-medium text-gray-900">
                      {new Date(equipment.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {equipment.description && (
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Deskripsi</p>
                    <p className="text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                      {equipment.description}
                    </p>
                  </div>
                )}
              </ModernCard>

              {/* Purchase Information Card */}
              <ModernCard variant="default" padding="lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Informasi Aset</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                    <p className="text-xs text-emerald-600 font-medium mb-1">Tanggal Pembelian</p>
                    <p className="font-bold text-emerald-900">
                      {equipment.purchase_date
                        ? new Date(equipment.purchase_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                        : '-'}
                    </p>
                  </div>
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                    <p className="text-xs text-blue-600 font-medium mb-1">Harga Pembelian</p>
                    <p className="font-bold text-blue-900">
                      {equipment.purchase_price
                        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(equipment.purchase_price)
                        : '-'}
                    </p>
                  </div>
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                    <p className="text-xs text-amber-600 font-medium mb-1">Garansi Berakhir</p>
                    <p className="font-bold text-amber-900">
                      {equipment.warranty_expiry
                        ? new Date(equipment.warranty_expiry).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                        : '-'}
                    </p>
                  </div>
                </div>
              </ModernCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Quick Actions Card */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-pink-400" />
                  Aksi Cepat
                </h3>
                <div className="space-y-3">
                  {equipment.status === 'available' ? (
                    <button
                      onClick={handleBorrowEquipment}
                      className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl flex items-center gap-3 transition-colors backdrop-blur-sm"
                    >
                      <div className="p-2 bg-pink-500 rounded-lg">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">Pinjam Barang</p>
                        <p className="text-xs text-gray-400">Proses peminjaman instan</p>
                      </div>
                    </button>
                  ) : (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                      <p className="font-medium text-amber-400">Sedang Tidak Tersedia</p>
                      <p className="text-xs text-gray-400 mt-1">Cek status atau tanggal kembali</p>
                    </div>
                  )}

                  <button
                    onClick={() => setActiveTab('qr')}
                    className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-3 transition-colors group"
                  >
                    <div className="p-2 bg-blue-500 rounded-lg group-hover:bg-blue-400 transition-colors">
                      <QrCode className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">Cetak / Lihat QR</p>
                      <p className="text-xs text-gray-400">Generate label untuk item ini</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Maintenance Info */}
              {(equipment.last_maintenance || equipment.next_maintenance) && (
                <ModernCard variant="default" padding="lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Wrench className="w-4 h-4 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-bold">Status Pemeliharaan</h3>
                  </div>

                  <div className="space-y-4">
                    {equipment.last_maintenance && (
                      <div className="flex items-start gap-4">
                        <div className="w-1 h-full bg-gray-200 rounded-full my-1"></div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold">Servis Terakhir</p>
                          <p className="font-medium text-gray-900">{new Date(equipment.last_maintenance).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                    {equipment.next_maintenance && (
                      <div className="flex items-start gap-4">
                        <div className="w-1 h-full bg-orange-400 rounded-full my-1"></div>
                        <div>
                          <p className="text-xs text-orange-600 uppercase font-semibold">Jadwal Berikutnya</p>
                          <p className="font-medium text-gray-900">{new Date(equipment.next_maintenance).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <button
                      onClick={() => setActiveTab('maintenance')}
                      className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
                    >
                      Lihat Riwayat <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </ModernCard>
              )}
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <ModernCard variant="default" padding="lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold">Riwayat Pemeliharaan</h2>
                  <p className="text-gray-500 text-sm">Lacak semua perbaikan dan servis</p>
                </div>
                <ModernButton
                  variant="default"
                  size="sm"
                  leftIcon={<Wrench className="w-4 h-4" />}
                >
                  Catat Pemeliharaan
                </ModernButton>
              </div>

              {maintenanceHistory.length > 0 ? (
                <div className="space-y-3">
                  {maintenanceHistory.map((record) => (
                    <div key={record.id} className="p-4 border border-gray-100 bg-gray-50/50 hover:bg-white rounded-xl transition-all hover:shadow-md">
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
                            <span className="text-sm text-gray-600 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(record.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 font-medium mb-1">{record.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" /> {record.performed_by}
                            </div>
                            {record.cost && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> ${record.cost.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <ModernBadge variant="outline" size="sm" className={
                          record.status === 'completed'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }>
                          {record.status}
                        </ModernBadge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                  <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-3">
                    <Wrench className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-gray-900 font-medium font-medium">Belum ada riwayat</h3>
                  <p className="text-gray-500 text-sm mt-1">Belum ada catatan pemeliharaan untuk alat ini.</p>
                </div>
              )}
            </ModernCard>
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div className="space-y-6">
            <ModernCard variant="default" padding="lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#ff007a]" />
                    Galeri Foto
                  </h2>
                  <p className="text-gray-500 text-sm">Dokumentasi visual peralatan</p>
                </div>
              </div>

              {/* Image Gallery */}
              <ImageGallery
                images={images}
                equipmentId={equipmentId}
                editable={user?.role === 'admin' || user?.role === 'lab_staff'}
                onDelete={handleImageDelete}
                onSetPrimary={handleImageSetPrimary}
                className="mb-8"
              />
            </ModernCard>

            {/* Image Upload - Admin Only */}
            {(user?.role === 'admin' || user?.role === 'lab_staff') && (
              <ModernCard variant="default" padding="lg" className="bg-gradient-to-r from-gray-50 to-white">
                <h3 className="text-lg font-semibold mb-2">Upload Foto Baru</h3>
                <p className="text-sm text-gray-500 mb-6">Tambahkan foto untuk mendokumentasikan kondisi atau fitur.</p>
                <ImageUpload
                  equipmentId={equipmentId}
                  onUploadComplete={handleImageUploadComplete}
                  maxFiles={5}
                />
              </ModernCard>
            )}
          </div>
        )}

        {/* QR Code Tab */}
        {activeTab === 'qr' && (
          <div className="max-w-xl mx-auto">
            <ModernCard variant="default" padding="lg" className="text-center">
              <h2 className="text-xl font-bold mb-2">Identifikasi Digital</h2>
              <p className="text-gray-500 text-sm mb-8">Scan untuk akses cepat ke detail peralatan</p>

              <div className="bg-white p-8 rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] inline-block mb-8 border border-gray-100">
                <QRCodeDisplay
                  equipmentId={equipment.id}
                  equipmentName={equipment.name}
                  serialNumber={equipment.serial_number}
                  category={typeof equipment.category === 'object' ? equipment.category?.name : equipment.category}
                  location={equipment.location}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <ModernButton variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" /> Download
                </ModernButton>
                <ModernButton variant="default" className="w-full">
                  <Share className="w-4 h-4 mr-2" /> Bagikan
                </ModernButton>
              </div>
            </ModernCard>
          </div>
        )}
      </div>
    </div>
  )
}
