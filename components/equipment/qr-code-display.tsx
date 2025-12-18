'use client'

import { useState, useEffect } from 'react'
import { ModernButton } from '@/components/ui/modern-button'
import { QrCode, Download, Printer, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'
import { QRCodeService } from '@/lib/qr-service'

interface QRCodeDisplayProps {
  equipmentId: string
  equipmentName: string
  serialNumber: string
  category?: string
  location?: string
}

export function QRCodeDisplay({
  equipmentId,
  equipmentName,
  serialNumber,
  category,
  location
}: QRCodeDisplayProps) {
  const [qrCode, setQrCode] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQRCode()
  }, [equipmentId])

  const loadQRCode = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const existingQR = await QRCodeService.getEquipmentQR(equipmentId)

      if (existingQR) {
        setQrCode(existingQR)
      } else {
        await generateNewQRCode()
      }
    } catch (error) {
      console.error('Error loading QR code:', error)
      setError('Gagal memuat kode QR')
    } finally {
      setIsLoading(false)
    }
  }

  const generateNewQRCode = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/qr-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipment_id: equipmentId }),
      })

      const data = await response.json()

      if (data.success) {
        setQrCode(data.qr_code)
      } else {
        setError(data.error || 'Gagal generate kode QR')
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
      setError('Gagal generate kode QR')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrCode?.qr_code_url) return

    try {
      const link = document.createElement('a')
      link.href = qrCode.qr_code_url
      link.download = `qr-${equipmentName.replace(/\s+/g, '-').toLowerCase()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading QR code:', error)
      setError('Gagal download kode QR')
    }
  }

  const printQRCode = () => {
    if (!qrCode?.qr_code_url) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${equipmentName}</title>
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; margin: 40px; }
            .container { max-width: 400px; margin: 0 auto; padding: 30px; border: 2px solid #eee; border-radius: 16px; }
            .qr-image { width: 250px; height: 250px; margin: 20px auto; }
            .title { font-size: 24px; font-weight: bold; color: #1a1f36; margin-bottom: 10px; }
            .serial { color: #666; font-family: monospace; background: #f5f5f5; padding: 8px 16px; border-radius: 8px; display: inline-block; }
            .info { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
            .info p { margin: 8px 0; color: #666; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="title">${equipmentName}</div>
            <div class="serial">${serialNumber}</div>
            <img src="${qrCode.qr_code_url}" alt="QR Code" class="qr-image" />
            <div class="info">
              ${category ? `<p><strong>Kategori:</strong> ${category}</p>` : ''}
              ${location ? `<p><strong>Lokasi:</strong> ${location}</p>` : ''}
              <p style="font-size: 12px; color: #999; margin-top: 16px;">Scan untuk akses detail peralatan</p>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#ff007a] animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Memuat kode QR...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <p className="text-red-600 font-medium mb-4">{error}</p>
        <ModernButton onClick={loadQRCode} variant="outline" size="sm">
          Coba Lagi
        </ModernButton>
      </div>
    )
  }

  if (!qrCode) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <QrCode className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-gray-600 mb-4">Belum ada kode QR</p>
        <ModernButton onClick={generateNewQRCode} loading={isLoading}>
          Generate Kode QR
        </ModernButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-6 px-4 py-2 bg-emerald-50 rounded-full">
        <CheckCircle className="w-4 h-4 text-emerald-600" />
        <span className="text-sm font-semibold text-emerald-700">Kode QR Aktif</span>
      </div>

      {/* QR Image */}
      <div className="p-4 bg-white rounded-2xl border-2 border-gray-100 shadow-sm mb-6">
        <img
          src={qrCode.qr_code_url}
          alt={`QR Code for ${equipmentName}`}
          className="w-52 h-52 object-contain"
        />
      </div>

      {/* Equipment Info */}
      <div className="text-center mb-8">
        <p className="font-bold text-lg text-gray-900 mb-1">{equipmentName}</p>
        <p className="text-sm text-gray-500 font-mono bg-gray-100 px-4 py-1.5 rounded-xl inline-block">
          {serialNumber}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <ModernButton
          onClick={downloadQRCode}
          variant="outline"
          size="sm"
          leftIcon={<Download className="w-4 h-4" />}
          className="border-[#ff007a] text-[#ff007a] hover:bg-[#ff007a]/5 rounded-xl"
        >
          Download
        </ModernButton>

        <ModernButton
          onClick={printQRCode}
          variant="outline"
          size="sm"
          leftIcon={<Printer className="w-4 h-4" />}
          className="border-[#ff007a] text-[#ff007a] hover:bg-[#ff007a]/5 rounded-xl"
        >
          Print
        </ModernButton>

        <ModernButton
          onClick={generateNewQRCode}
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          className="rounded-xl"
        >
          Regenerate
        </ModernButton>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-400 mt-6 text-center">
        Scan kode QR ini untuk mengakses detail peralatan dengan cepat
      </p>
    </div>
  )
}