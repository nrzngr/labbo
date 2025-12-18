import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ModernButton } from '@/components/ui/modern-button'
import { Upload, FileSpreadsheet, X, CheckCircle, AlertTriangle, AlertCircle, Download, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Database } from '@/types/database'

interface ImportModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

interface ParsedRow {
    rowNum: number
    name: string
    categoryName: string
    stock: number
    condition: string
    status: string
    serialNumber: string
    location: string
    purchasePrice: number | null
    purchaseDate: string | null
    description: string
    isValid: boolean
    errors: string[]
    categoryId?: string // Populated if valid
}

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
    const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload')
    const [parsedData, setParsedData] = useState<ParsedRow[]>([])
    const [fileName, setFileName] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [importProgress, setImportProgress] = useState(0)

    // Fetch categories for validation
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data, error } = await supabase.from('categories').select('id, name')
            if (error) throw error
            return data
        },
        staleTime: 1000 * 60 * 5 // Cache for 5 minutes
    })

    const resetModal = () => {
        setStep('upload')
        setParsedData([])
        setFileName('')
        setImportProgress(0)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleClose = () => {
        if (step === 'importing') return
        onClose()
        setTimeout(resetModal, 300)
    }

    const downloadTemplate = () => {
        const headers = [
            'Nama Peralatan (Wajib)',
            'Kategori (Wajib)',
            'Stok (Default: 1)',
            'Kondisi (Default: Baik)',
            'Status (Default: Tersedia)',
            'Nomor Seri',
            'Lokasi',
            'Harga Beli',
            'Tanggal Beli (YYYY-MM-DD)',
            'Deskripsi'
        ]
        const exampleRow = [
            'Mikroskop Cahaya X200',
            'Mikroskop', // Must match exact category name
            '5',
            'Baik',
            'Tersedia',
            'MC-2024-001',
            'Lemari A1',
            '2500000',
            '2024-01-15',
            'Mikroskop untuk pengamatan biologi dasar'
        ]

        const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template')
        XLSX.writeFile(wb, 'Template_Import_Peralatan_Labbo.xlsx')
    }

    const mapCondition = (val: string): string => {
        const normalized = val?.toString().toLowerCase().trim() || ''
        if (['sangat baik', 'excellent'].includes(normalized)) return 'excellent'
        if (['baik', 'good'].includes(normalized)) return 'good'
        if (['cukup', 'fair', 'cukup baik'].includes(normalized)) return 'fair'
        if (['rusak', 'poor', 'bad'].includes(normalized)) return 'poor'
        return 'good' // Default
    }

    const mapStatus = (val: string): string => {
        const normalized = val?.toString().toLowerCase().trim() || ''
        if (['tersedia', 'available'].includes(normalized)) return 'available'
        if (['dipinjam', 'borrowed'].includes(normalized)) return 'borrowed'
        if (['pemeliharaan', 'maintenance', 'dalam pemeliharaan'].includes(normalized)) return 'maintenance'
        if (['rusak', 'hilang', 'retired', 'lost'].includes(normalized)) return 'retired'
        return 'available' // Default
    }

    const parseDate = (val: any): string | null => {
        if (!val) return null
        if (val instanceof Date) return val.toISOString().split('T')[0]

        // Handle Excel serial date
        if (typeof val === 'number') {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000))
            return date.toISOString().split('T')[0]
        }

        // Try parsing string
        const date = new Date(val)
        if (!isNaN(date.getTime())) return date.toISOString().split('T')[0]

        return null
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFileName(file.name)
        const reader = new FileReader()

        reader.onload = (event) => {
            try {
                const bstr = event.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]

                // Skip header
                const rows = data.slice(1)

                const parsed: ParsedRow[] = rows.map((row, index) => {
                    const errors: string[] = []

                    // Column mapping based on Template index
                    // 0: Name, 1: Category, 2: Stock, 3: Condition, 4: Status, 
                    // 5: Serial, 6: Location, 7: Price, 8: Date, 9: Desc

                    const name = row[0]?.toString().trim()
                    const categoryName = row[1]?.toString().trim()

                    if (!name) errors.push('Nama peralatan wajib diisi')
                    if (!categoryName) errors.push('Kategori wajib diisi')

                    // Validate Category
                    let categoryId: string | undefined
                    if (categoryName && categories) {
                        const category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
                        if (category) {
                            categoryId = category.id
                        } else {
                            errors.push(`Kategori "${categoryName}" tidak ditemukan`)
                        }
                    }

                    return {
                        rowNum: index + 2, // Excel row number (1-based, +1 for header)
                        name: name || '',
                        categoryName: categoryName || '',
                        stock: parseInt(row[2]) || 1,
                        condition: mapCondition(row[3]),
                        status: mapStatus(row[4]),
                        serialNumber: row[5]?.toString() || '',
                        location: row[6]?.toString() || '',
                        purchasePrice: row[7] ? parseFloat(row[7]) : null,
                        purchaseDate: parseDate(row[8]),
                        description: row[9]?.toString() || '',
                        isValid: errors.length === 0,
                        errors,
                        categoryId
                    }
                }).filter(row => row.name || row.categoryName) // Filter completely empty rows

                setParsedData(parsed)
                setStep('preview')

            } catch (error) {
                console.error('Error parsing file:', error)
                toast.error('Gagal membaca file. Pastikan format Excel/CSV benar.')
            }
        }

        reader.readAsBinaryString(file)
    }

    const handleImport = async () => {
        const validRows = parsedData.filter(r => r.isValid)
        if (validRows.length === 0) {
            toast.error('Tidak ada data valid untuk diimpor')
            return
        }

        setStep('importing')
        setImportProgress(0)

        let successCount = 0
        let failCount = 0

        const chunkSize = 20
        const chunks = []

        for (let i = 0; i < validRows.length; i += chunkSize) {
            chunks.push(validRows.slice(i, i + chunkSize))
        }

        try {
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i]
                const payload = chunk.map(row => ({
                    name: row.name,
                    category_id: row.categoryId,
                    stock: row.stock,
                    condition: row.condition,
                    status: row.status as Database["public"]["Enums"]["equipment_status"],
                    serial_number: row.serialNumber || null,
                    location: row.location || null,
                    purchase_price: row.purchasePrice,
                    purchase_date: row.purchaseDate,
                    description: row.description || null,
                }))

                const { error } = await supabase
                    .from('equipment')
                    .insert(payload)

                if (error) {
                    console.error('Batch import error:', error)
                    failCount += chunk.length
                    toast.error(`Gagal mengimpor batch ${i + 1}`)
                } else {
                    successCount += chunk.length
                }

                // Update progress
                setImportProgress(Math.round(((i + 1) / chunks.length) * 100))
            }

            if (successCount > 0) {
                toast.success(`Berhasil mengimpor ${successCount} peralatan`)
                onSuccess()
                handleClose()
            } else {
                toast.error('Gagal mengimpor semua data')
                setStep('preview') // Go back to allow fix? or just close
            }

        } catch (error) {
            console.error('Import exception:', error)
            toast.error('Terjadi kesalahan sistem saat impor')
            setStep('preview')
        }
    }

    const validCount = parsedData.filter(r => r.isValid).length

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Impor Peralatan (Bulk Import)</DialogTitle>
                    <DialogDescription>
                        Unggah file Excel untuk menambahkan banyak peralatan sekaligus.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-2">
                    {step === 'upload' && (
                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-[#ff007a] hover:bg-pink-50/10 transition-all cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileUpload}
                                />
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Upload className="w-8 h-8 text-[#ff007a]" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Klik untuk unggah file</h3>
                                <p className="text-gray-500 text-sm">Format yang didukung: .xlsx, .xls, .csv</p>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-blue-800 text-sm">Petunjuk Impor</h4>
                                    <ul className="text-sm text-blue-700 mt-1 list-disc list-inside space-y-1">
                                        <li>Gunakan template yang disediakan agar format sesuai.</li>
                                        <li>Pastikan nama <strong>Kategori</strong> sama persis dengan yang ada di sistem.</li>
                                        <li>Kolom Status dan Kondisi akan otomatis disesuaikan (contoh: "Baik" &rarr; "Good").</li>
                                    </ul>
                                    <div className="mt-3">
                                        <button
                                            onClick={downloadTemplate}
                                            className="text-xs font-bold bg-white text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 flex items-center gap-2 inline-flex"
                                        >
                                            <Download className="w-3 h-3" />
                                            Download Template Excel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-gray-900">Preview Data ({parsedData.length} baris)</h3>
                                <div className="flex gap-2">
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> {validCount} Valid
                                    </span>
                                    {parsedData.length - validCount > 0 && (
                                        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-md font-medium flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> {parsedData.length - validCount} Invalid
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-left sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-4 py-3 font-medium text-gray-500 w-[50px]">#</th>
                                            <th className="px-4 py-3 font-medium text-gray-500">Nama</th>
                                            <th className="px-4 py-3 font-medium text-gray-500">Kategori</th>
                                            <th className="px-4 py-3 font-medium text-gray-500">Stok</th>
                                            <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                                            <th className="px-4 py-3 font-medium text-gray-500">Status Validasi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {parsedData.map((row, i) => (
                                            <tr key={i} className={`hover:bg-gray-50 ${!row.isValid ? 'bg-red-50/50' : ''}`}>
                                                <td className="px-4 py-3 text-gray-400">{row.rowNum}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                                                <td className="px-4 py-3 text-gray-600">{row.categoryName}</td>
                                                <td className="px-4 py-3 text-gray-600">{row.stock}</td>
                                                <td className="px-4 py-3 text-gray-600 capitalize">{row.status}</td>
                                                <td className="px-4 py-3">
                                                    {row.isValid ? (
                                                        <span className="text-green-600 flex items-center gap-1 text-xs font-bold">
                                                            <CheckCircle className="w-3 h-3" /> OK
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            {row.errors.map((err, idx) => (
                                                                <span key={idx} className="text-red-600 flex items-center gap-1 text-xs font-bold">
                                                                    <X className="w-3 h-3" /> {err}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {step === 'importing' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative w-20 h-20 mb-6">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <circle
                                        className="text-gray-100 stroke-current"
                                        strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"
                                    />
                                    <circle
                                        className="text-[#ff007a] progress-ring__circle stroke-current transition-all duration-300 ease-in-out"
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        cx="50" cy="50" r="40"
                                        fill="transparent"
                                        strokeDasharray={`${2 * Math.PI * 40}`}
                                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - importProgress / 100)}`}
                                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-[#ff007a] font-bold text-lg">
                                    {importProgress}%
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Mengimpor Data...</h3>
                            <p className="text-gray-500">Mohon jangan tutup jendela ini.</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t border-gray-100 bg-gray-50/50">
                    {step === 'upload' && (
                        <ModernButton variant="outline" onClick={handleClose}>Tutup</ModernButton>
                    )}
                    {step === 'preview' && (
                        <div className="flex gap-3 w-full justify-end">
                            <ModernButton variant="outline" onClick={resetModal}>Upload Ulang</ModernButton>
                            <ModernButton
                                variant="default"
                                onClick={handleImport}
                                disabled={validCount === 0}
                                leftIcon={<Upload className="w-4 h-4" />}
                            >
                                Impor {validCount} Data Valid
                            </ModernButton>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
