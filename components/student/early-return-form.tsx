'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
import { supabase } from '@/lib/supabase'
import {
    Package,
    Calendar,
    User,
    CheckCircle,
    Clock,
    AlertTriangle,
    FileText,
    Upload,
    X,
    Image as ImageIcon
} from 'lucide-react'

interface BorrowingTransaction {
    id: string
    equipment: {
        id: string
        name: string
        serial_number: string
        location?: string
        condition?: string
    }
    borrow_date: string
    expected_return_date: string
    notes?: string
    return_requested?: boolean
}

interface EarlyReturnFormProps {
    transaction: BorrowingTransaction
    onSuccess: () => void
    onCancel: () => void
}

export function EarlyReturnForm({ transaction, onSuccess, onCancel }: EarlyReturnFormProps) {
    const { user } = useCustomAuth()
    const queryClient = useQueryClient()
    const [step, setStep] = useState<'form' | 'success'>('form')
    const [returnNotes, setReturnNotes] = useState('')
    const [proofFile, setProofFile] = useState<File | null>(null)
    const [proofPreview, setProofPreview] = useState<string | null>(null)

    // Calculate days before deadline
    const today = new Date()
    const expectedDate = new Date(transaction.expected_return_date)
    const daysBeforeDeadline = Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    const requestReturnMutation = useMutation({
        mutationFn: async () => {
            let proofUrl = null

            // Upload proof image if provided
            if (proofFile) {
                const ext = proofFile.name.split('.').pop()
                const filename = `${transaction.id}/${Date.now()}.${ext}`

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('return-proofs')
                    .upload(filename, proofFile)

                if (uploadError) {
                    console.error('Upload error:', uploadError)
                    // Continue without proof if upload fails
                } else if (uploadData) {
                    const { data: urlData } = supabase.storage
                        .from('return-proofs')
                        .getPublicUrl(filename)
                    proofUrl = urlData.publicUrl
                }
            }

            // Update transaction with return request
            const { error } = await supabase
                .from('borrowing_transactions')
                .update({
                    return_requested: true,
                    return_requested_at: new Date().toISOString(),
                    return_notes: returnNotes || null,
                    return_proof_url: proofUrl
                } as any)
                .eq('id', transaction.id)

            if (error) throw error

            return { success: true }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-borrowings'] })
            setStep('success')
        }
    })

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setProofFile(file)
            // Create preview URL
            const reader = new FileReader()
            reader.onloadend = () => {
                setProofPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeFile = () => {
        setProofFile(null)
        setProofPreview(null)
    }

    const handleSubmit = () => {
        requestReturnMutation.mutate()
    }

    // Success Step
    if (step === 'success') {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                {/* Success Container - Matching Figma Frame 183 */}
                <div className="w-full bg-white rounded-[20px] py-10 px-6 sm:px-12 flex flex-col items-center">
                    {/* Pink Circle with Check Icon - Frame 180 */}
                    <div className="w-[113px] h-[113px] bg-[#FD1278] rounded-full flex items-center justify-center mb-8 shadow-lg shadow-[rgba(253,18,120,0.3)]">
                        <CheckCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
                    </div>

                    {/* Success Title */}
                    <h2 className="text-[24px] sm:text-[32px] font-bold text-[#222222] text-center mb-6 leading-tight">
                        Barang Berhasil Dikembalikan
                    </h2>

                    {/* Detailed Description */}
                    <p className="text-[14px] sm:text-[16px] text-[#222222] text-center leading-[22px] max-w-[749px]">
                        Status peminjaman akan diperiksa oleh admin untuk memastikan kondisi barang.
                        Jika ditemukan kerusakan atau keterlambatan, maka akan dikenakan denda sesuai ketentuan.
                        Kamu dapat mengecek halaman <span className="font-semibold">Status Peminjaman</span> untuk melihat status barang dan informasi kerusakan.
                    </p>
                </div>

                {/* Close/Done Button */}
                <button
                    onClick={() => onSuccess()}
                    className="mt-8 w-full max-w-[300px] py-4 px-6 bg-gradient-to-r from-[#FD1278] to-[#ff4d9e] text-white rounded-full font-bold text-sm shadow-lg shadow-[rgba(253,18,120,0.3)] hover:shadow-xl hover:shadow-[rgba(253,18,120,0.4)] transition-all"
                >
                    Selesai
                </button>
            </div>
        )
    }

    // Form Step
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-[#FD1278]/10 flex items-center justify-center border border-[#FD1278]">
                    <Package className="w-5 h-5 text-[#FD1278]" />
                </div>
                <h3 className="text-base font-medium text-[#222222]">Form Pengembalian Barang</h3>
            </div>

            {/* Early Return Info */}
            {daysBeforeDeadline > 0 && (
                <div className="flex gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-emerald-800 mb-1">Pengembalian Dini</p>
                        <p className="text-emerald-700">
                            Anda mengembalikan <strong>{daysBeforeDeadline} hari</strong> lebih awal dari batas waktu.
                        </p>
                    </div>
                </div>
            )}

            {/* Late Return Warning */}
            {daysBeforeDeadline < 0 && (
                <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-red-800 mb-1">Keterlambatan Pengembalian</p>
                        <p className="text-red-700">
                            Anda terlambat <strong>{Math.abs(daysBeforeDeadline)} hari</strong>. Denda keterlambatan akan dikenakan sesuai ketentuan.
                        </p>
                    </div>
                </div>
            )}

            {/* Form Fields */}
            <div className="space-y-5">
                {/* Nama Peminjam (readonly) */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[#222222]">
                        Nama Orang yang mengembalikan
                    </label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <User className="w-4 h-4 text-[#FD1278]" />
                        </div>
                        <input
                            type="text"
                            value={user?.full_name || ''}
                            readOnly
                            className="w-full pl-12 pr-4 py-4 bg-[#F3F5F7] rounded-[10px] text-sm text-[#222222]"
                        />
                    </div>
                </div>

                {/* Nama Barang (readonly) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#222222]">
                            Nama Barang yang dikembalikan
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <Package className="w-4 h-4 text-[#FD1278]" />
                            </div>
                            <input
                                type="text"
                                value={transaction.equipment.name}
                                readOnly
                                className="w-full pl-12 pr-4 py-4 bg-[#F3F5F7] rounded-[10px] text-sm text-[#222222]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#222222]">
                            Jumlah Barang
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <Package className="w-4 h-4 text-[#FD1278]" />
                            </div>
                            <input
                                type="text"
                                value="1"
                                readOnly
                                className="w-full pl-12 pr-4 py-4 bg-[#F3F5F7] rounded-[10px] text-sm text-[#222222]"
                            />
                        </div>
                    </div>
                </div>

                {/* Tanggal Pinjam & Kembali */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#222222]">
                            Tanggal Pinjam
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <Calendar className="w-4 h-4 text-[#FD1278]" />
                            </div>
                            <input
                                type="text"
                                value={formatDate(transaction.borrow_date)}
                                readOnly
                                className="w-full pl-12 pr-4 py-4 bg-[#F3F5F7] rounded-[10px] text-sm text-[#222222]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#222222]">
                            Tanggal Kembali
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <Calendar className="w-4 h-4 text-[#FD1278]" />
                            </div>
                            <input
                                type="text"
                                value={formatDate(new Date().toISOString())}
                                readOnly
                                className="w-full pl-12 pr-4 py-4 bg-[#F3F5F7] rounded-[10px] text-sm text-[#222222]"
                            />
                        </div>
                    </div>
                </div>

                {/* Catatan Pengembalian */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[#222222]">
                        Catatan Pengembalian <span className="text-gray-400 font-normal">(opsional)</span>
                    </label>
                    <div className="relative">
                        <div className="absolute left-4 top-4">
                            <FileText className="w-4 h-4 text-[#FD1278]" />
                        </div>
                        <textarea
                            value={returnNotes}
                            onChange={(e) => setReturnNotes(e.target.value)}
                            placeholder="Jelaskan kondisi barang saat dikembalikan..."
                            className="w-full pl-12 pr-4 py-4 bg-[#F3F5F7] rounded-[10px] text-sm text-[#222222] resize-none min-h-[100px] placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {/* Upload Bukti */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[#222222]">
                        Foto Bukti Pengembalian <span className="text-gray-400 font-normal">(opsional)</span>
                    </label>

                    {proofPreview ? (
                        <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-[#FD1278]/30 bg-[#FD1278]/5">
                            <img
                                src={proofPreview}
                                alt="Preview"
                                className="w-full h-48 object-contain"
                            />
                            <button
                                onClick={removeFile}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="p-3 bg-white/80 text-center">
                                <p className="text-sm text-gray-600 truncate">{proofFile?.name}</p>
                            </div>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center p-6 bg-[#F3F5F7] rounded-[10px] border-2 border-dashed border-gray-300 hover:border-[#FD1278] cursor-pointer transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <div className="w-12 h-12 rounded-full bg-[#FD1278]/10 flex items-center justify-center mb-3">
                                <ImageIcon className="w-6 h-6 text-[#FD1278]" />
                            </div>
                            <p className="text-sm font-medium text-[#222222] mb-1">Klik untuk upload foto</p>
                            <p className="text-xs text-gray-500">JPG, PNG, atau WEBP (max 5MB)</p>
                        </label>
                    )}
                </div>
            </div>

            {/* Warning Note */}
            <p className="text-xs text-[#FD1278]">
                Note: Jika pengembalian barang melebihi batas waktu, maka akan dikenakan denda keterlambatan sesuai ketentuan laboratorium.
            </p>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={requestReturnMutation.isPending}
                className="w-full py-4 bg-[#FD1278] text-white rounded-[10px] font-bold text-sm hover:bg-[#e0106c] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {requestReturnMutation.isPending ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Memproses...
                    </>
                ) : (
                    <>
                        <CheckCircle className="w-5 h-5" />
                        Konfirmasi Pengembalian
                    </>
                )}
            </button>

            {requestReturnMutation.isError && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">Gagal mengajukan pengembalian. Silakan coba lagi.</p>
                </div>
            )}
        </div>
    )
}
