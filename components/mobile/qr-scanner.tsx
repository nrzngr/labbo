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
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-900">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white/70 rounded-lg" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-2 text-xs text-white text-center">
                    Align the QR code within the frame to scan automatically
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <Camera className="w-12 h-12 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-300">Open your device camera to scan the QR code</p>
                    <p className="text-xs text-gray-400">You can also upload an image if camera access is unavailable</p>
                  </div>
                </div>
              )}
            </div>

            {(error || cameraError || barcodeSupportedText) && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-800 space-y-1">
                  {barcodeSupportedText && <p>{barcodeSupportedText}</p>}
                  {cameraError && <p>{cameraError}</p>}
                  {error && <p>{error}</p>}
                </div>
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
                leftIcon={<Camera className="w-4 h-4" />}
              >
                {isCameraActive ? 'Scanning...' : 'Open Camera'}
              </ModernButton>

              {isCameraActive && (
                <ModernButton
                  onClick={stopCamera}
                  variant="outline"
                  size="lg"
                  className="w-full"
                  leftIcon={<PauseCircle className="w-4 h-4" />}
                >
                  Pause Camera
                </ModernButton>
              )}

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

            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>Make sure the QR code is clear, well-lit, and within the frame.</p>
              <p>Supported image formats: JPG, PNG, GIF</p>
            </div>
          </div>
        )}
      </div>
    </ModernCard>
  )
}
