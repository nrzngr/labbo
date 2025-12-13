'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QRPrintGrid } from '@/components/equipment/qr-print-grid'
import { Loader2, Printer, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

function PrintLabelsContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const idsParam = searchParams.get('ids')
    const ids = idsParam ? idsParam.split(',') : []

    const { data: items, isLoading } = useQuery({
        queryKey: ['equipment-print', ids],
        queryFn: async () => {
            if (ids.length === 0) return []

            const { data, error } = await supabase
                .from('equipment')
                .select('id, name, serial_number, category:categories(name), location')
                .in('id', ids)

            if (error) throw error

            // Generate QR data for each item
            return data.map(item => ({
                id: item.id,
                name: item.name,
                serial_number: item.serial_number,
                qr_data: JSON.stringify({
                    id: item.id,
                    name: item.name,
                    sn: item.serial_number,
                    g: new Date().toISOString()
                })
            }))
        },
        enabled: ids.length > 0
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        )
    }

    if (!items || items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <div className="text-xl font-semibold">Tidak ada item yang dipilih</div>
                <Button onClick={() => router.back()}>Kembali</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 print:bg-white">
            {/* Toolbar - Hidden when printing */}
            <div className="bg-white border-b border-gray-200 p-4 shadow-sm print:hidden sticky top-0 z-10">
                <div className="max-w-screen-xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => router.back()}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Kembali
                        </Button>
                        <div>
                            <h1 className="font-bold text-lg">Cetak Label QR</h1>
                            <p className="text-sm text-gray-500">{items.length} item dipilih</p>
                        </div>
                    </div>
                    <Button onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" />
                        Cetak Sekarang
                    </Button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="p-8 print:p-0">
                <QRPrintGrid items={items} />
            </div>
        </div>
    )
}

export default function PrintLabelsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        }>
            <PrintLabelsContent />
        </Suspense>
    )
}
