'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { UserPlus, Loader2, AlertCircle } from 'lucide-react'
import bcrypt from 'bcryptjs'

interface AddUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

type UserRole = 'admin' | 'lab_staff' | 'dosen' | 'mahasiswa'

interface UserFormData {
    full_name: string
    email: string
    password: string
    role: UserRole
    department: string
    nim: string
    nip: string
    phone: string
}

const initialFormData: UserFormData = {
    full_name: '',
    email: '',
    password: '',
    role: 'mahasiswa',
    department: '',
    nim: '',
    nip: '',
    phone: ''
}

export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
    const [formData, setFormData] = useState<UserFormData>(initialFormData)
    const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({})
    const queryClient = useQueryClient()

    const createUserMutation = useMutation({
        mutationFn: async (data: UserFormData) => {
            // Validate required fields
            const newErrors: Partial<Record<keyof UserFormData, string>> = {}

            if (!data.full_name.trim()) newErrors.full_name = 'Nama lengkap wajib diisi'
            if (!data.email.trim()) newErrors.email = 'Email wajib diisi'
            if (!data.password || data.password.length < 8) newErrors.password = 'Password minimal 8 karakter'
            if (!data.department.trim()) newErrors.department = 'Departemen wajib diisi'

            // Role-specific validation
            if (data.role === 'mahasiswa' && !data.nim.trim()) {
                newErrors.nim = 'NIM wajib diisi untuk mahasiswa'
            }
            if ((data.role === 'dosen' || data.role === 'lab_staff') && !data.nip.trim()) {
                newErrors.nip = 'NIP wajib diisi untuk dosen/staff'
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors)
                throw new Error('Validation failed')
            }

            // Check if email already exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', data.email)
                .single()

            if (existingUser) {
                setErrors({ email: 'Email sudah terdaftar' })
                throw new Error('Email already exists')
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(data.password, 10)

            // Create user in database
            const userPayload = {
                full_name: data.full_name.trim(),
                email: data.email.trim().toLowerCase(),
                role: data.role,
                department: data.department.trim(),
                nim: data.role === 'mahasiswa' ? data.nim.trim() : null,
                nip: (data.role === 'dosen' || data.role === 'lab_staff' || data.role === 'admin') ? data.nip.trim() || null : null,
                phone: data.phone.trim() || null,
                password_hash: hashedPassword,
                email_verified: true // Admin-created users are auto-verified
            }

            const { error: insertError } = await supabase
                .from('users')
                .insert(userPayload as any)

            if (insertError) {
                console.error('Error creating user:', insertError)
                throw new Error(insertError.message || 'Gagal membuat pengguna')
            }

            return { success: true }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            setFormData(initialFormData)
            setErrors({})
            onOpenChange(false)
        },
        onError: (error: Error) => {
            if (error.message !== 'Validation failed' && error.message !== 'Email already exists') {
                setErrors({ full_name: error.message })
            }
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})
        createUserMutation.mutate(formData)
    }

    const handleChange = (field: keyof UserFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const showNim = formData.role === 'mahasiswa'
    const showNip = formData.role === 'dosen' || formData.role === 'lab_staff' || formData.role === 'admin'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-0 rounded-3xl p-6">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-gradient-to-br from-[#ff007a] to-[#ff4d9e] rounded-xl shadow-lg shadow-[rgba(255,0,122,0.25)]">
                            <UserPlus className="w-5 h-5 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-gray-900">Tambah Pengguna Baru</DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-500">
                        Buat akun pengguna baru untuk mengakses sistem
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.full_name}
                            onChange={(e) => handleChange('full_name', e.target.value)}
                            placeholder="Masukkan nama lengkap"
                            className={`h-12 rounded-xl ${errors.full_name ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.full_name && (
                            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> {errors.full_name}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="email@example.com"
                            className={`h-12 rounded-xl ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="password"
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            placeholder="Minimal 8 karakter"
                            className={`h-12 rounded-xl ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Peran <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => handleChange('role', e.target.value)}
                            className="w-full h-12 px-4 border border-gray-200 bg-gray-50 rounded-xl text-[15px] font-medium text-gray-700 outline-none transition focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.16)] cursor-pointer hover:bg-white"
                        >
                            <option value="mahasiswa">Mahasiswa</option>
                            <option value="dosen">Dosen</option>
                            <option value="lab_staff">Staff Laboratorium</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Departemen <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.department}
                            onChange={(e) => handleChange('department', e.target.value)}
                            placeholder="Contoh: Teknik Informatika"
                            className={`h-12 rounded-xl ${errors.department ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.department && (
                            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> {errors.department}
                            </p>
                        )}
                    </div>

                    {/* NIM (for mahasiswa) */}
                    {showNim && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                NIM <span className="text-red-500">*</span>
                            </label>
                            <Input
                                value={formData.nim}
                                onChange={(e) => handleChange('nim', e.target.value)}
                                placeholder="Nomor Induk Mahasiswa"
                                className={`h-12 rounded-xl ${errors.nim ? 'border-red-500 focus:ring-red-500' : ''}`}
                            />
                            {errors.nim && (
                                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" /> {errors.nim}
                                </p>
                            )}
                        </div>
                    )}

                    {/* NIP (for dosen/staff/admin) */}
                    {showNip && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                NIP {formData.role !== 'admin' && <span className="text-red-500">*</span>}
                            </label>
                            <Input
                                value={formData.nip}
                                onChange={(e) => handleChange('nip', e.target.value)}
                                placeholder="Nomor Induk Pegawai"
                                className={`h-12 rounded-xl ${errors.nip ? 'border-red-500 focus:ring-red-500' : ''}`}
                            />
                            {errors.nip && (
                                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" /> {errors.nip}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Phone (optional) */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Telepon <span className="text-gray-400 font-normal">(opsional)</span>
                        </label>
                        <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="08xxxxxxxxxx"
                            className="h-12 rounded-xl"
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={createUserMutation.isPending}
                            className="flex-1 py-3 bg-gradient-to-r from-[#ff007a] to-[#ff4d9e] text-white rounded-xl font-semibold shadow-lg shadow-[rgba(255,0,122,0.3)] hover:shadow-xl hover:shadow-[rgba(255,0,122,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {createUserMutation.isPending ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Tambah Pengguna
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
