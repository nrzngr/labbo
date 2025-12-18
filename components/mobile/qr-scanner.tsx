'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernCard } from '@/components/ui/modern-card'
import { Camera, X, CheckCircle, AlertTriangle, PauseCircle } from 'lucide-react'
import { QRCodeService } from '@/lib/qr-service'

type BarcodeDetectorResult = { rawValue: string }

type BarcodeDetectorInstance = {
  detect: (source: CanvasImageSource | HTMLVideoElement | HTMLImageElement) => Promise<BarcodeDetectorResult[]>
}

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance & {
  detect: BarcodeDetectorInstance['detect']
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor & {
      getSupportedFormats?: () => Promise<string[]>
    }
  }
}

interface QRScannerProps {
  onScanSuccess: (data: any) => void
  onScanError: (error: string) => void
  onClose?: () => void
}

export function QRScanner({ onScanSuccess, onScanError, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isDetectorSupported, setIsDetectorSupported] = useState(false)
  const [isCameraSupported, setIsCameraSupported] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const barcodeDetectorRef = useRef<BarcodeDetectorInstance | null>(null)
  const detectionFrameRef = useRef<number | null>(null)
  const detectionActiveRef = useRef(false)
  const isProcessingRef = useRef(false)
  const lastScannedValueRef = useRef<string | null>(null)

  const barcodeSupportedText = useMemo(() => {
    if (!isDetectorSupported) {
      return 'QR scanning is not supported on this device. You can upload an image instead.'
    }
    if (!isCameraSupported) {
      return 'Camera access is unavailable. Try uploading an image of the QR code.'
    }
    return null
  }, [isDetectorSupported, isCameraSupported])

  const stopCamera = useCallback(() => {
    detectionActiveRef.current = false
    if (detectionFrameRef.current) {
      cancelAnimationFrame(detectionFrameRef.current)
      detectionFrameRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }

    setIsCameraActive(false)
    setIsScanning(false)
    isProcessingRef.current = false
  }, [])

  useEffect(() => {
    const detectorAvailable = typeof window !== 'undefined' && typeof window.BarcodeDetector !== 'undefined'
    const cameraAvailable = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

    setIsDetectorSupported(detectorAvailable)
    setIsCameraSupported(cameraAvailable)

    if (detectorAvailable && !barcodeDetectorRef.current) {
      try {
        const Detector = window.BarcodeDetector
        if (Detector) {
          barcodeDetectorRef.current = new Detector({ formats: ['qr_code'] })
        }
      } catch (err) {
        console.warn('Failed to initialize BarcodeDetector:', err)
        setIsDetectorSupported(false)
      }
    }

    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const handleDetectedValue = useCallback(
    (rawValue: string) => {
      if (!rawValue || rawValue === lastScannedValueRef.current) {
        return
      }

      lastScannedValueRef.current = rawValue

      try {
        const parsedData = QRCodeService.parseQRData(rawValue)
        if (QRCodeService.validateQRData(parsedData)) {
          setScanResult(parsedData)
          setError(null)
          stopCamera()
          onScanSuccess(parsedData)
        } else {
          const errorMsg = 'Invalid QR code data'
          setError(errorMsg)
          onScanError(errorMsg)
        }
      } catch (err) {
        const errorMsg = 'Failed to parse QR code data'
        setError(errorMsg)
        onScanError(errorMsg)
      }
    },
    [onScanError, onScanSuccess, stopCamera]
  )

  const detectLoop = useCallback(async () => {
    if (!detectionActiveRef.current || !barcodeDetectorRef.current || !videoRef.current) {
      return
    }

    if (isProcessingRef.current) {
      detectionFrameRef.current = requestAnimationFrame(detectLoop)
      return
    }

    if (videoRef.current.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
      detectionFrameRef.current = requestAnimationFrame(detectLoop)
      return
    }

    try {
      isProcessingRef.current = true
      const results = await barcodeDetectorRef.current.detect(videoRef.current)
      if (results.length > 0) {
        handleDetectedValue(results[0].rawValue)
        return
      }
    } catch (err) {
      console.error('QR detection error:', err)
      if (!cameraError) {
        setError('Unable to read QR code from camera feed')
      }
    } finally {
      isProcessingRef.current = false
    }

    detectionFrameRef.current = requestAnimationFrame(detectLoop)
  }, [cameraError, handleDetectedValue])

  const startCameraScan = useCallback(async () => {
    if (!isDetectorSupported || !isCameraSupported) {
      setCameraError('Live scanning is not supported on this device.')
      if (!isDetectorSupported) {
        setError('QR scanning is not supported. Please upload an image instead.')
      }
      fileInputRef.current?.click()
      return
    }

    if (isCameraActive) {
      return
    }

    try {
      setError(null)
      setCameraError(null)
      setIsScanning(true)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      detectionActiveRef.current = true
      setIsCameraActive(true)
      lastScannedValueRef.current = null
      detectionFrameRef.current = requestAnimationFrame(detectLoop)
    } catch (err) {
      console.error('Camera access error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Unable to access camera'
      setCameraError(errorMsg)
      setIsScanning(false)
      setIsCameraActive(false)
      onScanError(errorMsg)
    }
  }, [detectLoop, isCameraActive, isCameraSupported, isDetectorSupported, onScanError])

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      try {
        setError(null)
        setCameraError(null)
        stopCamera()
        setIsScanning(true)

        const reader = new FileReader()
        reader.onload = async (e) => {
          const imageSrc = e.target?.result
          if (!imageSrc) {
            const errorMsg = 'Unable to read image data'
            setError(errorMsg)
            onScanError(errorMsg)
            setIsScanning(false)
            return
          }

          try {
            const Detector = window.BarcodeDetector
            if (!Detector) {
              const errorMsg = 'QR scanning is not supported on this device'
              setError(errorMsg)
              onScanError(errorMsg)
              return
            }

            if (!barcodeDetectorRef.current) {
              barcodeDetectorRef.current = new Detector({ formats: ['qr_code'] })
            }

            const imageElement = new Image()
            imageElement.src = imageSrc as string
            imageElement.onload = async () => {
              try {
                const results = await barcodeDetectorRef.current?.detect(imageElement)
                if (results && results.length > 0) {
                  handleDetectedValue(results[0].rawValue)
                } else {
                  const errorMsg = 'No QR code found in image'
                  setError(errorMsg)
                  onScanError(errorMsg)
                }
              } catch (detectErr) {
                console.error('Image detection error:', detectErr)
                const errorMsg = 'Failed to process QR code image'
                setError(errorMsg)
                onScanError(errorMsg)
              } finally {
                setIsScanning(false)
              }
            }
            imageElement.onerror = () => {
              const errorMsg = 'Unable to load image for scanning'
              setError(errorMsg)
              onScanError(errorMsg)
              setIsScanning(false)
            }
          } catch (err) {
            console.error('QR scan error:', err)
            const errorMsg = 'Failed to scan QR code from image'
            setError(errorMsg)
            onScanError(errorMsg)
            setIsScanning(false)
          }
        }

        reader.readAsDataURL(file)
      } catch (err) {
        console.error('File processing error:', err)
        const errorMsg = 'Failed to process image'
        setError(errorMsg)
        onScanError(errorMsg)
        setIsScanning(false)
      }
    },
    [handleDetectedValue, onScanError, stopCamera]
  )

  const resetScanner = useCallback(() => {
    stopCamera()
    setScanResult(null)
    setError(null)
    setCameraError(null)
    lastScannedValueRef.current = null
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [stopCamera])

  // ... inside QRScanner ...

  return (
    <ModernCard variant="elevated" padding="none" className="w-full max-w-lg mx-auto overflow-hidden border-2 border-[#ff007a]/10 shadow-2xl shadow-[#ff007a]/5">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#ff007a]/10 rounded-lg">
            <Camera className="w-5 h-5 text-[#ff007a]" />
          </div>
          <h3 className="text-lg font-black text-gray-900 tracking-tight">Scanner</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      <div className="p-4 sm:p-6 bg-white min-h-[400px] flex flex-col">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        {scanResult ? (
          <div className="flex-1 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-500/20">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-1">Berhasil!</h3>
              <p className="text-gray-500">QR Code terdeteksi</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#ff007a]"></div>

              <div className="space-y-4 relative z-10">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Nama Peralatan</span>
                  <p className="text-xl font-bold text-gray-900 text-wrap break-words">{scanResult.name || 'Unknown Item'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Serial Number</span>
                    <p className="font-mono text-sm bg-white border border-gray-200 rounded px-2 py-1 inline-block text-gray-700">
                      {scanResult.serial || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Lokasi</span>
                    <p className="text-sm font-medium text-gray-700">{scanResult.location || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-auto">
              <ModernButton
                onClick={() => onScanSuccess(scanResult)}
                variant="default"
                size="lg"
                fullWidth
                className="bg-[#ff007a] hover:bg-[#df006b] shadow-lg shadow-[#ff007a]/30 border-none h-12 text-lg"
              >
                Lihat Detail Peralatan
              </ModernButton>
              <ModernButton
                onClick={resetScanner}
                variant="outline"
                size="lg"
                fullWidth
                className="h-12 border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Scan Lagi
              </ModernButton>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 min-h-[300px]">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="relative w-64 h-64 border-2 border-white/50 rounded-3xl overflow-hidden shadow-[0_0_0_1000px_rgba(0,0,0,0.5)]">
                      {/* Corner Markers */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#ff007a] rounded-tl-xl"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#ff007a] rounded-tr-xl"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#ff007a] rounded-bl-xl"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#ff007a] rounded-br-xl"></div>

                      {/* Scanning Animation */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-[#ff007a] shadow-[0_0_20px_#ff007a] animate-[scan_2s_ease-in-out_infinite]"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-8 left-0 right-0 text-center">
                    <span className="inline-block px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white text-sm font-medium border border-white/10">
                      Arahkan kamera ke QR Code
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-2">
                    <Camera className="w-10 h-10 text-gray-300" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">Siap untuk Scan</h4>
                    <p className="text-sm text-gray-500 max-w-[200px] mx-auto">Izinkan akses kamera atau upload gambar QR Code</p>
                  </div>
                </div>
              )}
            </div>

            {(error || cameraError || barcodeSupportedText) && (
              <div className="mt-4 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl animate-in slide-in-from-top-2">
                <div className="p-2 bg-red-100 rounded-full flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div className="text-sm text-red-800 font-medium">
                  {barcodeSupportedText && <p>{barcodeSupportedText}</p>}
                  {cameraError && <p>{cameraError}</p>}
                  {error && <p>{error}</p>}
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <ModernButton
                onClick={startCameraScan}
                variant="default"
                size="lg"
                disabled={isScanning}
                loading={isScanning}
                className="w-full h-12 text-lg shadow-lg hover:shadow-xl transition-all"
                leftIcon={<Camera className="w-5 h-5" />}
              >
                {isCameraActive ? 'Sedang Memindai...' : 'Buka Kamera'}
              </ModernButton>

              {isCameraActive && (
                <ModernButton
                  onClick={stopCamera}
                  variant="outline"
                  size="lg"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                  leftIcon={<PauseCircle className="w-5 h-5" />}
                >
                  Hentikan Kamera
                </ModernButton>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400 font-medium">Atau</span>
                </div>
              </div>

              <ModernButton
                onClick={() => fileInputRef.current?.click()}
                variant="ghost"
                size="lg"
                disabled={isScanning}
                className="w-full text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                Upload Gambar dari Galeri
              </ModernButton>
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </ModernCard>
  )
}
