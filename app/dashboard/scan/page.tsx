'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRScanner } from '@/components/mobile/qr-scanner'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card'
import {
    QrCode,
    Package,
    AlertCircle,
    Zap,
    CheckCircle2,
    Camera,
    Smartphone,
    Upload
} from 'lucide-react'

export default function ScanPage() {
    const router = useRouter()
    const [scannedEquipment, setScannedEquipment] = useState<any>(null)

    const handleScanSuccess = (data: any) => {
        setScannedEquipment(data)
        // Navigate to equipment detail page
        if (data.id) {
            router.push(`/dashboard/equipment/${data.id}`)
        }
    }

    const handleScanError = (error: string) => {
        console.error('QR Scan Error:', error)
        // Error is handled by the QRScanner component itself
    }

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header with Gradient */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff007a] to-[#ff88c4] shadow-lg shadow-[#ff007a]/20 mb-4">
                        <QrCode className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Scan QR Code
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Pindai kode QR pada peralatan untuk akses cepat ke informasi lengkap
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Scanner - Takes 2 columns on large screens */}
                    <div className="lg:col-span-2">
                        <QRScanner
                            onScanSuccess={handleScanSuccess}
                            onScanError={handleScanError}
                        />
                    </div>

                    {/* Instructions Sidebar */}
                    <div className="space-y-4">
                        {/* Quick Guide */}
                        <ModernCard variant="default" padding="lg" className="border-2 border-[#ffe0f2]">
                            <ModernCardContent>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                                        <Zap className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">Panduan Cepat</h3>
                                </div>
                                <div className="space-y-3">
                                    <StepItem
                                        number="1"
                                        icon={Camera}
                                        text="Klik tombol Open Camera"
                                    />
                                    <StepItem
                                        number="2"
                                        icon={QrCode}
                                        text="Arahkan ke kode QR"
                                    />
                                    <StepItem
                                        number="3"
                                        icon={CheckCircle2}
                                        text="Sistem auto-detect"
                                    />
                                </div>
                            </ModernCardContent>
                        </ModernCard>

                        {/* Alternative Method */}
                        <ModernCard variant="default" padding="md" className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                            <ModernCardContent>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                        <Upload className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-sm mb-1">Alternatif</h4>
                                        <p className="text-xs text-gray-700">
                                            Jika kamera tidak tersedia, upload gambar QR code dari galeri
                                        </p>
                                    </div>
                                </div>
                            </ModernCardContent>
                        </ModernCard>
                    </div>
                </div>

                {/* Features Grid */}
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Apa yang Bisa Dilakukan?</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FeatureCard
                            icon={Package}
                            iconColor="text-purple-600"
                            bgColor="bg-purple-50"
                            title="Detail Lengkap"
                            description="Lihat spesifikasi, kondisi, lokasi, dan riwayat peralatan"
                        />
                        <FeatureCard
                            icon={Zap}
                            iconColor="text-green-600"
                            bgColor="bg-green-50"
                            title="Quick Action"
                            description="Langsung ajukan peminjaman tanpa perlu mencari manual"
                        />
                        <FeatureCard
                            icon={CheckCircle2}
                            iconColor="text-blue-600"
                            bgColor="bg-blue-50"
                            title="Verifikasi"
                            description="Pastikan alat yang dipinjam sesuai dengan yang dibutuhkan"
                        />
                    </div>
                </div>

                {/* Browser Compatibility */}
                <ModernCard variant="default" padding="md" className="bg-orange-50 border-orange-200">
                    <ModernCardContent>
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-orange-900 text-sm">Kompatibilitas Browser</h4>
                                    <Smartphone className="w-4 h-4 text-orange-600" />
                                </div>
                                <p className="text-sm text-orange-800">
                                    Fitur scan QR memerlukan browser modern (Chrome, Edge, Safari). Jika kamera tidak berfungsi, gunakan opsi <span className="font-semibold">"Upload Image"</span>.
                                </p>
                            </div>
                        </div>
                    </ModernCardContent>
                </ModernCard>
            </div>
        </DashboardLayout>
    )
}

// Step Item Component
function StepItem({ number, icon: Icon, text }: { number: string; icon: any; text: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-[#ff007a] to-[#ff88c4] text-white text-xs font-bold flex-shrink-0">
                {number}
            </div>
            <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-700">{text}</span>
        </div>
    )
}

// Feature Card Component
function FeatureCard({
    icon: Icon,
    iconColor,
    bgColor,
    title,
    description
}: {
    icon: any
    iconColor: string
    bgColor: string
    title: string
    description: string
}) {
    return (
        <ModernCard variant="default" padding="lg" className="group hover:shadow-lg hover:border-[#ff007a]/20 transition-all duration-300">
            <ModernCardContent>
                <div className="flex items-start gap-4">
                    <div className={`p-3 ${bgColor} rounded-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 mb-2 group-hover:text-[#ff007a] transition-colors">
                            {title}
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>
            </ModernCardContent>
        </ModernCard>
    )
}
