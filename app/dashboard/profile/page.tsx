"use client"

import { useState, useEffect } from 'react'
import { useCustomAuth } from "@/components/auth/custom-auth-provider"
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Mail, Phone, Building, Calendar, Edit2, Save, X, BookOpen, Award, GraduationCap } from "lucide-react"
import { supabase } from '@/lib/supabase'
import { ModernCard, ModernCardHeader, ModernCardContent } from '@/components/ui/modern-card'
import { ModernBadge } from '@/components/ui/modern-badge'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernInput } from '@/components/ui/modern-input'
import { Alert, AlertDescription } from '@/components/ui/alert'


interface UserProfile {
  id: string
  full_name: string
  email: string
  department: string
  faculty?: string
  role: string
  phone?: string
  nim?: string
  nip?: string
  student_level?: string
  lecturer_rank?: string
  created_at: string
}

export default function ProfilePage() {
  const { user } = useCustomAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const queryClient = useQueryClient()

  useEffect(() => {
    if (user) {
      setEditedProfile({
        full_name: user.full_name,
        phone: user.phone || '',
        department: user.department,
        student_level: user.student_level || '',
        lecturer_rank: user.lecturer_rank || ''
      })
    }
  }, [user])

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user) throw new Error('Pengguna belum login')

      await new Promise(resolve => setTimeout(resolve, 1000))
      return { ...user, ...updates }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      setIsEditing(false)
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' })
      setTimeout(() => setMessage(null), 3000)
    },
    onError: () => {
      setMessage({ type: 'error', text: 'Gagal memperbarui profil. Silakan coba lagi.' })
      setTimeout(() => setMessage(null), 3000)
    }
  })

  if (!user) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen bg-gradient-to-br from-[#f8f7fc] via-white to-[#fff5f9]">
        {/* Header Skeleton */}
        <div className="relative overflow-hidden bg-gradient-to-r from-gray-200 to-gray-300 rounded-3xl p-6 sm:p-8 mb-8 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-300 rounded-2xl" />
            <div className="flex-1">
              <div className="h-8 w-48 bg-gray-300 rounded-lg mb-2" />
              <div className="h-4 w-64 bg-gray-300 rounded" />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse">
              <div className="h-6 w-40 bg-gray-200 rounded mb-6" />
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
                    <div className="h-6 w-full bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse">
              <div className="h-6 w-32 bg-gray-200 rounded mb-6" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
                    <div className="h-6 w-24 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSave = () => {
    updateProfileMutation.mutate(editedProfile)
  }

  const handleCancel = () => {
    setEditedProfile({
      full_name: user.full_name,
      phone: user.phone || '',
      department: user.department,
      student_level: user.student_level || '',
      lecturer_rank: user.lecturer_rank || ''
    })
    setIsEditing(false)
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "destructive"> = {
      admin: 'destructive',
      lab_staff: 'warning',
      dosen: 'default',
      mahasiswa: 'success'
    }

    const roleLabels: Record<string, string> = {
      admin: 'Administrator',
      lab_staff: 'Staf Laboratorium',
      dosen: 'Dosen',
      mahasiswa: 'Mahasiswa'
    }

    return <ModernBadge variant={variants[role] || 'default'} size="sm">{roleLabels[role] || role}</ModernBadge>
  }

  const getSemesterBadge = (level?: string) => {
    if (!level) return null

    const variants: Record<string, "default" | "success" | "warning" | "destructive"> = {
      semester_1: 'success',
      semester_2: 'success',
      semester_3: 'default',
      semester_4: 'default',
      semester_5: 'warning',
      semester_6: 'warning',
      semester_7: 'destructive',
      semester_8: 'destructive',
      freshman: 'success',
      sophomore: 'default',
      junior: 'warning',
      senior: 'destructive'
    }

    const levelLabels: Record<string, string> = {
      semester_1: 'Semester 1',
      semester_2: 'Semester 2',
      semester_3: 'Semester 3',
      semester_4: 'Semester 4',
      semester_5: 'Semester 5',
      semester_6: 'Semester 6',
      semester_7: 'Semester 7',
      semester_8: 'Semester 8',
      freshman: 'Semester 1-2',
      sophomore: 'Semester 3-4',
      junior: 'Semester 5-6',
      senior: 'Semester 7-8'
    }

    return <ModernBadge variant={variants[level] || 'default'} size="sm">{levelLabels[level] || level}</ModernBadge>
  }

  const getLecturerRankLabel = (rank?: string) => {
    const labels: Record<string, string> = {
      assistant: 'Asisten Ahli',
      associate: 'Lektor',
      senior_associate: 'Lektor Kepala',
      professor: 'Guru Besar'
    }
    return labels[rank || ''] || rank || 'Belum ditentukan'
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen bg-gradient-to-br from-[#f8f7fc] via-white to-[#fff5f9]">

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#ff007a] to-[#ff4d9e] rounded-3xl p-6 sm:p-8 mb-8 shadow-xl shadow-[rgba(255,0,122,0.2)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                Profil Saya
              </h1>
              <p className="text-white/80 text-sm">
                Kelola informasi pribadi dan preferensi akun Anda
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profil
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  disabled={updateProfileMutation.isPending}
                  className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="px-5 py-2.5 bg-white text-[#ff007a] rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {updateProfileMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'}`}>
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Main Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Informasi Dasar</h2>
            <p className="text-sm text-gray-500 mb-6">Data pribadi dan kontak Anda</p>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Nama Lengkap
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.full_name || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:bg-white outline-none transition-all"
                  />
                ) : (
                  <div className="text-lg font-medium text-gray-900">{user.full_name}</div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Alamat Email
                </label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div className="text-lg font-medium text-gray-900">{user.email}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Nomor Telepon
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.phone || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                    placeholder="Masukkan nomor telepon"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:bg-white outline-none transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div className="text-lg font-medium text-gray-900">
                      {user.phone || 'Belum diisi'}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Program Studi
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.department || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, department: e.target.value })}
                    placeholder="Masukkan program studi"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:bg-white outline-none transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    <div className="text-lg font-medium text-gray-900">{user.department}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Role-specific fields */}
            {user.role === 'mahasiswa' && (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 mt-6 pt-6 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    NIM (Nomor Induk Mahasiswa)
                  </label>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <div className="text-lg font-medium font-mono text-gray-900">{user.nim || '-'}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Semester / Angkatan
                  </label>
                  {isEditing ? (
                    <select
                      value={editedProfile.student_level || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, student_level: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:bg-white outline-none transition-all"
                    >
                      <option value="">Pilih semester</option>
                      <option value="semester_1">Semester 1</option>
                      <option value="semester_2">Semester 2</option>
                      <option value="semester_3">Semester 3</option>
                      <option value="semester_4">Semester 4</option>
                      <option value="semester_5">Semester 5</option>
                      <option value="semester_6">Semester 6</option>
                      <option value="semester_7">Semester 7</option>
                      <option value="semester_8">Semester 8</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      {user.student_level ? getSemesterBadge(user.student_level) : (
                        <span className="text-gray-500">Belum ditentukan</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {user.role === 'dosen' && (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 mt-6 pt-6 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    NIP (Nomor Induk Pegawai)
                  </label>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-400" />
                    <div className="text-lg font-medium font-mono text-gray-900">{user.nip || '-'}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Jabatan Fungsional
                  </label>
                  {isEditing ? (
                    <select
                      value={editedProfile.lecturer_rank || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, lecturer_rank: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#ff007a] focus:bg-white outline-none transition-all"
                    >
                      <option value="">Pilih jabatan</option>
                      <option value="assistant">Asisten Ahli</option>
                      <option value="associate">Lektor</option>
                      <option value="senior_associate">Lektor Kepala</option>
                      <option value="professor">Guru Besar</option>
                    </select>
                  ) : (
                    <div className="text-lg font-medium text-gray-900">
                      {getLecturerRankLabel(user.lecturer_rank ?? undefined)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Role and Status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Status Akun</h2>
            <p className="text-sm text-gray-500 mb-6">Informasi akun Anda</p>

            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Peran Akun
                </div>
                <div className="flex items-center gap-2">
                  {getRoleBadge(user.role)}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Terdaftar Sejak
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Data tidak tersedia</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Status Akun
                </div>
                <ModernBadge variant="success" size="sm">Aktif</ModernBadge>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {user.role === 'student' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Statistik Peminjaman</h2>
              <p className="text-sm text-gray-500 mb-6">Aktivitas peminjaman Anda</p>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Peminjaman</span>
                  <span className="font-bold text-gray-900">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Peminjaman Aktif</span>
                  <span className="font-bold text-gray-900">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Terlambat</span>
                  <span className="font-bold text-red-600">0</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
