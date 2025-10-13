'use client'

import { useState, useRef } from 'react'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernCard } from '@/components/ui/modern-card'
import { Camera, X, CheckCircle, AlertTriangle } from 'lucide-react'
import { QRCodeService } from '@/lib/qr-service'

interface QRScannerProps {
  onScanSuccess: (data: any) => void
  onScanError: (error: string) => void
  onClose?: () => void
}

export function QRScanner({ onScanSuccess, onScanError, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError(null)
      setIsScanning(true)

      // Read the image file
      const reader = new FileReader()
      reader.onload = async (e) => {
        const imageData = e.target?.result as string

        try {
          // In a real implementation, you would use a QR code scanning library
          // For now, we'll simulate the scan with a mock implementation
          const mockQRData = simulateQRScan(imageData)

          if (mockQRData) {
            const parsedData = QRCodeService.parseQRData(mockQRData)

            if (QRCodeService.validateQRData(parsedData)) {
              setScanResult(parsedData)
              onScanSuccess(parsedData)
            } else {
              const errorMsg = 'Invalid QR code format'
              setError(errorMsg)
              onScanError(errorMsg)
            }
          } else {
            const errorMsg = 'No QR code found in image'
            setError(errorMsg)
            onScanError(errorMsg)
          }
        } catch (parseError) {
          const errorMsg = 'Failed to parse QR code'
          setError(errorMsg)
          onScanError(errorMsg)
        } finally {
          setIsScanning(false)
        }
      }

      reader.readAsDataURL(file)
    } catch (error) {
      const errorMsg = 'Failed to process image'
      setError(errorMsg)
      onScanError(errorMsg)
      setIsScanning(false)
    }
  }

  // Mock function to simulate QR code scanning
  // In production, replace with actual QR code scanning library
  const simulateQRScan = (imageData: string): string | null => {
    // This is a mock implementation
    // In production, you would use libraries like qr-scanner or jsQR
    return JSON.stringify({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Digital Microscope',
      serial: 'DM-2023-001',
      category: 'Electronics',
      location: 'Lab A',
      type: 'lab-equipment',
      generated: new Date().toISOString()
    })
  }

  const startCameraScan = () => {
    // In a real implementation, you would access the camera
    // For now, we'll trigger file upload as fallback
    fileInputRef.current?.click()
  }

  const resetScanner = () => {
    setScanResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <ModernCard variant="default" padding="lg" className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">QR Scanner</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="space-y-4">
        {scanResult ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">QR Code Scanned Successfully</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Equipment Details:</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {scanResult.name}</p>
                <p><strong>Serial:</strong> {scanResult.serial}</p>
                <p><strong>Category:</strong> {scanResult.category}</p>
                <p><strong>Location:</strong> {scanResult.location}</p>
              </div>
            </div>

            <ModernButton
              onClick={resetScanner}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Scan Another QR Code
            </ModernButton>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Camera className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-center text-gray-600 text-sm">
                Position QR code within the frame or upload an image
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <ModernButton
                onClick={startCameraScan}
                variant="default"
                size="lg"
                disabled={isScanning}
                loading={isScanning}
                className="w-full"
              >
                {isScanning ? 'Scanning...' : 'Open Camera'}
              </ModernButton>

              <ModernButton
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="lg"
                disabled={isScanning}
                className="w-full"
              >
                Upload Image
              </ModernButton>
            </div>

            <div className="text-xs text-gray-500 text-center">
              <p>Make sure the QR code is clear and well-lit</p>
              <p>Supported formats: JPG, PNG, GIF</p>
            </div>
          </div>
        )}
      </div>
    </ModernCard>
  )
}