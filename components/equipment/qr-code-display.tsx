'use client'

import { useState, useEffect } from 'react'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernCard } from '@/components/ui/modern-card'
import { QrCode, Download, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'
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
        // Generate new QR code if none exists
        await generateNewQRCode()
      }
    } catch (error) {
      console.error('Error loading QR code:', error)
      setError('Failed to load QR code')
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ equipment_id: equipmentId }),
      })

      const data = await response.json()

      if (data.success) {
        setQrCode(data.qr_code)
      } else {
        setError(data.error || 'Failed to generate QR code')
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
      setError('Failed to generate QR code')
    } finally {
      setIsLoading(false)
    }
  }

  const regenerateQRCode = async () => {
    await generateNewQRCode()
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
      setError('Failed to download QR code')
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
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              margin: 20px;
            }
            .qr-container {
              margin: 20px auto;
              max-width: 400px;
            }
            .qr-image {
              max-width: 300px;
              height: auto;
              border: 2px solid #000;
              padding: 10px;
            }
            .equipment-info {
              margin-top: 20px;
              border: 1px solid #ccc;
              padding: 10px;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>${equipmentName}</h2>
            <img src="${qrCode.qr_code_url}" alt="QR Code" class="qr-image" />
            <div class="equipment-info">
              <p><strong>Serial Number:</strong> ${serialNumber}</p>
              ${category ? `<p><strong>Category:</strong> ${category}</p>` : ''}
              ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
            </div>
            <p><em>Scan this QR code to access equipment details</em></p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (isLoading) {
    return (
      <ModernCard variant="default" padding="lg" className="w-full max-w-sm">
        <div className="flex flex-col items-center justify-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-gray-600">Loading QR code...</p>
        </div>
      </ModernCard>
    )
  }

  if (error) {
    return (
      <ModernCard variant="default" padding="lg" className="w-full max-w-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
          <ModernButton
            onClick={loadQRCode}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Retry
          </ModernButton>
        </div>
      </ModernCard>
    )
  }

  if (!qrCode) {
    return (
      <ModernCard variant="default" padding="lg" className="w-full max-w-sm">
        <div className="text-center py-8">
          <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-4">No QR code available</p>
          <ModernButton
            onClick={generateNewQRCode}
            variant="default"
            size="sm"
            loading={isLoading}
            className="w-full"
          >
            Generate QR Code
          </ModernButton>
        </div>
      </ModernCard>
    )
  }

  return (
    <ModernCard variant="default" padding="lg" className="w-full max-w-sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold">Equipment QR Code</h3>
        </div>

        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg shadow-sm border">
            <img
              src={qrCode.qr_code_url}
              alt={`QR Code for ${equipmentName}`}
              className="w-64 h-64 object-contain"
            />
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">{equipmentName}</p>
          <p className="text-xs text-gray-500">Serial: {serialNumber}</p>
        </div>

        <div className="flex gap-2">
          <ModernButton
            onClick={downloadQRCode}
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            className="flex-1"
          >
            Download
          </ModernButton>

          <ModernButton
            onClick={printQRCode}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Print
          </ModernButton>

          <ModernButton
            onClick={regenerateQRCode}
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="flex-1"
          >
            Regenerate
          </ModernButton>
        </div>

        <div className="text-xs text-gray-500 text-center">
          <p>Scan this QR code to quickly access equipment details</p>
        </div>
      </div>
    </ModernCard>
  )
}