'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ModernBadge } from '@/components/ui/modern-badge'
import { ImageGallery } from './image-gallery'
import { QRCodeDisplay } from './qr-code-display'
import { Camera, QrCode, FileText, MapPin, Tag, Calendar, DollarSign, Wrench, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ModernButton } from '@/components/ui/modern-button'

interface EquipmentDetailModalProps {
    equipment: any
    isOpen: boolean
    onClose: () => void
}

export function EquipmentDetailModal({ equipment, isOpen, onClose }: EquipmentDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'images' | 'qr'>('overview')
    const [images, setImages] = useState<any[]>([])
    const [loadingImages, setLoadingImages] = useState(false)

    useEffect(() => {
        if (isOpen && equipment?.id) {
            fetchImages()
        }
    }, [isOpen, equipment?.id])

    const fetchImages = async () => {
        setLoadingImages(true)
        try {
            const { data, error } = await supabase
                .from('equipment_images')
                .select('*')
                .eq('equipment_id', equipment.id)
                .order('display_order', { ascending: true })

            if (data) {
                setImages(data)
            }
        } catch (error) {
            console.error('Error fetching images:', error)
        } finally {
            setLoadingImages(false)
        }
    }

    if (!equipment) return null

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "success" | "default" | "warning" | "destructive"> = {
            available: 'success',
            borrowed: 'warning',
            maintenance: 'default',
            retired: 'destructive'
        }
        const labels: Record<string, string> = {
            available: 'Tersedia',
            borrowed: 'Dipinjam',
            maintenance: 'Dalam Pemeliharaan',
            retired: 'Tidak Aktif'
        }
        return <ModernBadge variant={variants[status] || 'default'}>{labels[status] || status}</ModernBadge>
    }

    const getConditionBadge = (condition: string) => {
        const variants: Record<string, "success" | "default" | "warning" | "destructive"> = {
            excellent: 'success',
            good: 'default',
            fair: 'warning',
            poor: 'destructive'
        }
        const labels: Record<string, string> = {
            excellent: 'Sangat Baik',
            good: 'Baik',
            fair: 'Cukup Baik',
            poor: 'Rusak'
        }
        return <ModernBadge variant={variants[condition] || 'default'}>{labels[condition] || condition}</ModernBadge>
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold flex items-center justify-between">
                        <span>Detail Peralatan</span>
                        <div className="flex items-center gap-3">
                            {getStatusBadge(equipment.status)}
                            <Link href={`/dashboard/equipment/${equipment.id}`}>
                                <ModernButton variant="outline" size="sm" className="gap-2 h-8">
                                    <ExternalLink className="w-4 h-4" />
                                    <span className="hidden sm:inline">Buka Halaman Full</span>
                                </ModernButton>
                            </Link>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {/* Tabs Navigation */}
                <div className="flex border-b px-6">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
                            ? 'border-[#ff007a] text-[#ff007a]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Overview
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('images')}
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'images'
                            ? 'border-[#ff007a] text-[#ff007a]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Camera className="w-4 h-4" />
                            Foto ({images.length})
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('qr')}
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'qr'
                            ? 'border-[#ff007a] text-[#ff007a]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4" />
                            QR Code
                        </div>
                    </button>
                </div>

                <div className="p-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{equipment.name}</h3>
                                    <p className="text-gray-500 font-mono text-sm">{equipment.serial_number}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <Tag className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Kategori</p>
                                            <p className="text-gray-900">{equipment.category?.name || 'Tidak Berkategori'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Lokasi</p>
                                            <p className="text-gray-900">{equipment.location}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                            <Wrench className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Kondisi</p>
                                            <div className="mt-1">{getConditionBadge(equipment.condition)}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Tanggal Pembelian</p>
                                            <p className="text-gray-900">
                                                {equipment.purchase_date
                                                    ? new Date(equipment.purchase_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                                                    : '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                            <DollarSign className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Harga Pembelian</p>
                                            <p className="text-gray-900">
                                                {equipment.purchase_price
                                                    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(equipment.purchase_price)
                                                    : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {equipment.description && (
                                <div className="mt-6 pt-6 border-t">
                                    <h4 className="font-semibold text-gray-900 mb-2">Deskripsi</h4>
                                    <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg">
                                        {equipment.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Images Tab */}
                    {activeTab === 'images' && (
                        <div>
                            <ImageGallery
                                images={images}
                                equipmentId={equipment.id}
                                editable={false} // View only mode for modal
                            />
                        </div>
                    )}

                    {/* QR Tab */}
                    {activeTab === 'qr' && (
                        <div className="flex justify-center py-4">
                            <QRCodeDisplay
                                equipmentId={equipment.id}
                                equipmentName={equipment.name}
                                serialNumber={equipment.serial_number}
                                category={equipment.category?.name || ''}
                                location={equipment.location}
                            />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
