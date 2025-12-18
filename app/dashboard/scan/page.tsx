'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRScanner } from '@/components/mobile/qr-scanner'
import {
    QrCode,
    Package,
    Zap,
    CheckCircle2,
    Camera,
    Smartphone
} from 'lucide-react'

export default function ScanPage() {
    const router = useRouter()
    const [scannedEquipment, setScannedEquipment] = useState<any>(null)

    const handleScanSuccess = (data: any) => {
        setScannedEquipment(data)
        if (data.id) {
            router.push(`/dashboard/equipment/${data.id}`)
        }
    }

    const handleScanError = (error: string) => {
        console.error('QR Scan Error:', error)
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center mb-10 fade-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff007a] to-[#ff5c9d] shadow-lg shadow-[#ff007a]/20 mb-4">
                    <QrCode className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-[#1a1f36] tracking-tight mb-3">
                    Scan QR Code
                </h1>
                <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
                    Pindai kode QR pada peralatan untuk akses cepat ke informasi lengkap dan inventarisasi.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 lg:col-start-1">
                    <div className="sticky top-8">
                        <QRScanner
                            onScanSuccess={handleScanSuccess}
                            onScanError={handleScanError}
                        />
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                            <div className="p-2.5 bg-purple-50 rounded-xl">
                                <Zap className="w-5 h-5 text-purple-600" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg">Panduan Cepat</h3>
                        </div>
                        <div className="space-y-6">
                            <StepItem number="1" icon={Camera} title="Buka Kamera" text="Izinkan akses kamera browser Anda" />
                            <StepItem number="2" icon={QrCode} title="Pindai" text="Arahkan kamera ke QR Code peralatan" />
                            <StepItem number="3" icon={CheckCircle2} title="Selesai" text="Sistem otomatis menampilkan detail" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#ff007a]/5 to-blue-50/50 p-6 rounded-3xl border border-[#ff007a]/10">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-white rounded-xl shadow-sm flex-shrink-0">
                                <Smartphone className="w-5 h-5 text-[#ff007a]" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Tips Pro</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Pastikan pencahayaan cukup terang. Jika kamera bermasalah, gunakan opsi <span className="font-semibold text-[#ff007a]">Upload Gambar</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-16 border-t border-gray-200 pt-10">
                <div className="text-center mb-10">
                    <span className="text-xs font-bold text-[#ff007a] uppercase tracking-widest bg-[#ff007a]/10 px-3 py-1 rounded-full">Fitur Utama</span>
                    <h3 className="text-2xl font-black text-gray-900 mt-4">Lebih dari sekadar Scanner</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FeatureCard icon={Package} iconColor="text-blue-500" bgColor="bg-blue-50" title="Akses Detail Instan" description="Lihat spesifikasi teknis, riwayat pemeliharaan, dan status ketersediaan dalam hitungan detik." />
                    <FeatureCard icon={Zap} iconColor="text-yellow-500" bgColor="bg-yellow-50" title="Status Real-time" description="Cek apakah peralatan sedang dipinjam, tersedia, atau dalam perbaikan secara langsung." />
                    <FeatureCard icon={CheckCircle2} iconColor="text-green-500" bgColor="bg-green-50" title="Audit Otomatis" description="Mempermudah proses inventarisasi dan audit aset laboratorium secara berkala." />
                </div>
            </div>
        </div>
    )
}

function StepItem({ number, icon: Icon, title, text }: { number: string; icon: any; title: string, text: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-900 font-black text-sm flex-shrink-0 border border-gray-200">
                {number}
            </div>
            <div>
                <h4 className="font-bold text-gray-900 mb-0.5">{title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{text}</p>
            </div>
        </div>
    )
}

function FeatureCard({ icon: Icon, iconColor, bgColor, title, description }: { icon: any; iconColor: string; bgColor: string; title: string; description: string }) {
    return (
        <div className="group bg-white p-6 rounded-3xl border border-gray-100 hover:border-[#ff007a]/20 shadow-sm hover:shadow-xl transition-all duration-300">
            <div className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <h4 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-[#ff007a] transition-colors">{title}</h4>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">{description}</p>
        </div>
    )
}
