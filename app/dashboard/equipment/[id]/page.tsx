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
  QrCode,
  Tag,
  DollarSign,
  Activity,
  History,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react'

interface LastBorrowing {
  id: string
  borrow_date: string
  expected_return_date: string
  actual_return_date?: string
  status: string
  user?: {
    full_name: string
    email: string
  }
}

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
  const [lastBorrowing, setLastBorrowing] = useState<LastBorrowing | null>(null)
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([])
  const [images, setImages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'maintenance' | 'images' | 'qr'>('overview')

  useEffect(() => {
    if (equipmentId) {
      Promise.all([
        fetchEquipmentDetails(),
        fetchMaintenanceHistory(),
        fetchImages()
      ]).finally(() => setIsLoading(false))
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
        setLastBorrowing(data.lastBorrowing)
      } else {
        setError('Gagal memuat detail peralatan')
      }
    } catch (error) {
      setError('Kesalahan jaringan. Silakan coba lagi.')
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
      case 'available': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'borrowed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'maintenance': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'lost': return 'bg-rose-100 text-rose-800 border-rose-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-emerald-600 bg-emerald-50 border-emerald-100'
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-100'
      case 'fair': return 'text-amber-600 bg-amber-50 border-amber-100'
      case 'poor': return 'text-rose-600 bg-rose-50 border-rose-100'
      default: return 'text-gray-600 bg-gray-50 border-gray-100'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#ff007a] animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Memuat data...</p>
        </div>
      </div>
    )
  }

  if (error || !equipment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
          <p className="text-gray-500 mb-6">{error || 'Peralatan tidak ditemukan'}</p>
          <ModernButton onClick={() => router.back()} variant="outline" className="w-full justify-center">
            Kembali ke Daftar
          </ModernButton>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafe]">
      {/* Hero Section */}
      <div className="relative bg-[#1a1f37] text-white pb-32 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#ff007a]/20 to-purple-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-600/20 to-cyan-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="container mx-auto px-4 pt-8 relative z-10">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-400 hover:text-white transition-colors mb-8 group"
          >
            <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 mr-3 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-medium">Kembali ke Daftar</span>
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
            <div className="space-y-4 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(equipment.status)}`}>
                  {equipment.status}
                </span>
                <span className="text-gray-400 text-sm font-mono bg-white/5 px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                  <Tag className="w-3 h-3" />
                  {equipment.serial_number}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                {equipment.name}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-gray-300 text-sm md:text-base">
                {equipment.category && (
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                      <Tag className="w-4 h-4" />
                    </div>
                    {typeof equipment.category === 'object' ? equipment.category?.name : equipment.category}
                  </div>
                )}
                {equipment.location && (
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    {equipment.location}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  Ditambahkan {new Date(equipment.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {equipment.status === 'available' && (
                <button
                  onClick={() => router.push(`/dashboard/checkout?equipment=${equipmentId}`)}
                  className="px-6 py-3 bg-[#ff007a] hover:bg-[#d60066] text-white rounded-xl font-bold shadow-lg shadow-pink-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <User className="w-5 h-5" />
                  Pinjam Sekarang
                </button>
              )}
              {(user?.role === 'admin' || user?.role === 'lab_staff') && (
                <button
                  onClick={() => router.push(`/dashboard/equipment/${equipmentId}/edit`)}
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold border border-white/10 transition-all hover:border-white/30 backdrop-blur-sm"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-20 pb-12">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 mb-8 flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Ringkasan', icon: FileText },
            { id: 'maintenance', label: 'Riwayat Servis', icon: Wrench },
            { id: 'images', label: `Galeri (${images.length})`, icon: Camera },
            { id: 'qr', label: 'Kode QR', icon: QrCode },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === tab.id
                ? 'bg-[#1a1f37] text-white shadow-lg shadow-indigo-900/20 ring-2 ring-indigo-500 ring-offset-2'
                : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[#ff007a]' : ''}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Description Card */}
                <ModernCard className="bg-white hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                    <div className="p-3 bg-indigo-50 rounded-xl">
                      <FileText className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-[#1a1f37]">Deskripsi & Spesifikasi</h2>
                      <p className="text-gray-400 text-sm">Informasi detail mengenai peralatan</p>
                    </div>
                  </div>

                  <div className="text-gray-600 leading-relaxed space-y-4">
                    {equipment.description ? (
                      <p>{equipment.description}</p>
                    ) : (
                      <p className="italic text-gray-400">Tidak ada deskripsi tersedia.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <div className={`p-4 rounded-xl border ${getConditionColor(equipment.condition)} flex items-center justify-between`}>
                      <span className="text-sm font-medium opacity-80">Kondisi Fisik</span>
                      <span className="font-bold uppercase tracking-wider">{equipment.condition || '-'}</span>
                    </div>
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Garansi</span>
                      <span className="font-bold text-gray-900">
                        {equipment.warranty_expiry
                          ? new Date(equipment.warranty_expiry).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'Tidak ada'}
                      </span>
                    </div>
                  </div>
                </ModernCard>

                {/* Purchase Info */}
                <ModernCard className="bg-white hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                    <div className="p-3 bg-emerald-50 rounded-xl">
                      <DollarSign className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-[#1a1f37]">Informasi Pembelian</h2>
                      <p className="text-gray-400 text-sm">Nilai aset dan tanggal pengadaan</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Harga Beli</label>
                      <p className="text-2xl font-black text-[#1a1f37] tracking-tight">
                        {equipment.purchase_price
                          ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(equipment.purchase_price)
                          : '-'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tanggal Beli</label>
                      <p className="text-lg font-bold text-gray-700">
                        {equipment.purchase_date
                          ? new Date(equipment.purchase_date).toLocaleDateString('id-ID', { dateStyle: 'long' })
                          : '-'}
                      </p>
                    </div>
                  </div>
                </ModernCard>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ModernCard>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-extrabold text-[#1a1f37]">Riwayat Pemeliharaan</h2>
                      <p className="text-gray-400 text-sm">Log servis dan perbaikan</p>
                    </div>
                    {(user?.role === 'admin' || user?.role === 'lab_staff') && (
                      <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors">
                        + Catat Servis
                      </button>
                    )}
                  </div>

                  {maintenanceHistory.length > 0 ? (
                    <div className="relative border-l-2 border-gray-100 pl-8 space-y-8 ml-4">
                      {maintenanceHistory.map((record) => (
                        <div key={record.id} className="relative group">
                          {/* Timeline Dot */}
                          <div className={`absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm transition-colors ${record.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}></div>

                          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 group-hover:bg-white group-hover:shadow-md transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${record.type === 'preventive' ? 'bg-blue-100 text-blue-700' :
                                  record.type === 'corrective' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
                                  }`}>
                                  {record.type}
                                </span>
                                <span className="text-sm text-gray-500 font-medium">
                                  {new Date(record.date).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                                </span>
                              </div>
                              <span className={`text-xs font-bold px-2 py-1 rounded-full border ${record.status === 'completed' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-amber-200 text-amber-700 bg-amber-50'
                                }`}>
                                {record.status}
                              </span>
                            </div>

                            <h3 className="font-bold text-gray-900 mb-2">{record.description}</h3>

                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {record.performed_by}
                              </div>
                              {record.cost && (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4" />
                                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(record.cost)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">Belum ada riwayat pemeliharaan.</p>
                    </div>
                  )}
                </ModernCard>
              </div>
            )}

            {activeTab === 'images' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ModernCard>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-extrabold text-[#1a1f37]">Galeri Foto</h2>
                      <p className="text-gray-400 text-sm">Dokumentasi fisik</p>
                    </div>
                  </div>
                  <ImageGallery
                    images={images}
                    equipmentId={equipmentId}
                    editable={user?.role === 'admin' || user?.role === 'lab_staff'}
                    onDelete={handleImageDelete}
                    onSetPrimary={handleImageSetPrimary}
                  />
                  {(user?.role === 'admin' || user?.role === 'lab_staff') && (
                    <div className="mt-8 pt-8 border-t border-gray-100">
                      <h3 className="text-sm font-bold text-gray-900 mb-4">Upload Foto Baru</h3>
                      <ImageUpload
                        equipmentId={equipmentId}
                        onUploadComplete={handleImageUploadComplete}
                        maxFiles={5}
                      />
                    </div>
                  )}
                </ModernCard>
              </div>
            )}

            {activeTab === 'qr' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex justify-center">
                <ModernCard className="max-w-md w-full text-center">
                  <h2 className="text-xl font-extrabold text-[#1a1f37] mb-2">Kode QR Digital</h2>
                  <p className="text-gray-400 text-sm mb-8">Scan untuk identifikasi cepat</p>

                  <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 inline-block mb-8">
                    <QRCodeDisplay
                      equipmentId={equipment.id}
                      equipmentName={equipment.name}
                      serialNumber={equipment.serial_number}
                      category={typeof equipment.category === 'object' ? equipment.category?.name : equipment.category}
                      location={equipment.location}
                    />
                  </div>

                  <p className="text-xs text-gray-400">ID: {equipment.id}</p>
                </ModernCard>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Last Activity Card - NEW FEATURE */}
            <div className="bg-white rounded-3xl p-6 shadow-lg shadow-purple-500/5 border border-purple-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-all duration-700"></div>

              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Aktivitas Terakhir</h3>
                  <p className="text-xs text-gray-500">Status peminjaman terkini</p>
                </div>
              </div>

              {lastBorrowing ? (
                <div className="relative z-10 space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${lastBorrowing.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        lastBorrowing.status === 'returned' ? 'bg-green-100 text-green-700' :
                          lastBorrowing.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {lastBorrowing.status}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {new Date(lastBorrowing.borrow_date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        {lastBorrowing.user?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{lastBorrowing.user?.full_name || 'Pengguna'}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{lastBorrowing.user?.email}</p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1 pt-3 border-t border-gray-100">
                      <div className="flex justify-between">
                        <span>Dipinjam:</span>
                        <span className="font-medium">{new Date(lastBorrowing.borrow_date).toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Jatuh Tempo:</span>
                        <span className="font-medium text-purple-600">{new Date(lastBorrowing.expected_return_date).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(
                      (user?.role === 'admin' || user?.role === 'lab_staff')
                        ? '/dashboard/transactions'
                        : '/dashboard/my-borrowings'
                    )}
                    className="w-full py-2.5 text-xs font-bold text-purple-600 border border-purple-200 rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <History className="w-3 h-3" />
                    Lihat Semua Riwayat
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 relative z-10">
                  <p className="text-sm text-gray-500 italic mb-2">Belum ada aktivitas peminjaman.</p>
                  <p className="text-xs text-gray-400">Peralatan ini belum pernah dipinjam.</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-[#1a1f37] to-[#0f1225] rounded-3xl p-6 text-white shadow-xl shadow-gray-900/10">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-[#ff007a] rounded-full inline-block"></span>
                Menu Cepat
              </h3>

              <div className="space-y-3">
                {equipment.status === 'available' ? (
                  <button
                    onClick={() => router.push(`/dashboard/checkout?equipment=${equipmentId}`)}
                    className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl flex items-center gap-3 transition-all group"
                  >
                    <div className="p-2 bg-[#ff007a] rounded-lg group-hover:scale-110 transition-transform">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">Pinjam Alat</div>
                      <div className="text-[10px] text-gray-400">Proses sekarang</div>
                    </div>
                  </button>
                ) : (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-200">Tidak tersedia untuk dipinjam saat ini.</p>
                  </div>
                )}

                <button
                  onClick={() => setActiveTab('qr')}
                  className="w-full py-3 px-4 bg-transparent hover:bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 transition-colors"
                >
                  <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm">Cetak QR</div>
                    <div className="text-[10px] text-gray-400">Download label</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
