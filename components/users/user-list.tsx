'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ModernButton } from '@/components/ui/modern-button'
import { Input } from '@/components/ui/input'
import { ModernCard, ModernCardContent, ModernCardHeader } from '@/components/ui/modern-card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ModernBadge } from '@/components/ui/modern-badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit, Eye, Shield, Users } from 'lucide-react'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  nim: string | null
  nip: string | null
  phone: string | null
  department: string
  created_at: string
}

export function UserList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [viewingUser, setViewingUser] = useState<User | null>(null)

  const queryClient = useQueryClient()

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['users', searchTerm, filterRole],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`)
      }

      if (filterRole) {
        query = query.eq('role', filterRole as 'admin' | 'lab_staff' | 'dosen' | 'mahasiswa')
      }

      const { data, error } = await query

      if (error) throw error
      return data as User[]
    }
  })

  const { data: authUsers } = useQuery({
    queryKey: ['auth-users'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.admin.listUsers()
      if (error) throw error
      return data.users
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete the user from users table 
      // Note: In production, use a proper admin API route
      await supabase.from('users').delete().eq('id', userId)

      // Then delete the auth user (this requires admin privileges)
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['auth-users'] })
    }
  })

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.')) {
      deleteMutation.mutate(id)
    }
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      admin: 'destructive',
      lab_staff: 'default',
      dosen: 'secondary',
      mahasiswa: 'outline'
    }
    return <ModernBadge variant={variants[role] || 'outline'}>{role}</ModernBadge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Manajemen Pengguna</h1>
            <p className="text-gray-600">Kelola pengguna dan perizinan mereka</p>
          </div>
          <ModernButton disabled title="Fitur dalam pengembangan">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Pengguna
          </ModernButton>
        </div>

        <ModernCard className="border-2 border-[#dfe2ec] bg-white/85 backdrop-blur-xl shadow-[0_25px_55px_rgba(17,24,39,0.06)]">
          <ModernCardHeader title="Pengguna" description="Lihat dan kelola semua pengguna terdaftar" className="border-b border-[#dfe2ec]/50" />
          <ModernCardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari pengguna..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-5 py-3 border border-[#dfe2ec] bg-[#eef0f8] rounded-[16px] text-[15px] font-medium text-[#1f2937] shadow-sm outline-none transition focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.16)] h-12 min-w-[120px]"
              >
                <option value="">Semua Peran</option>
                <option value="admin">Admin</option>
                <option value="lab_staff">Staff Lab</option>
                <option value="dosen">Dosen</option>
                <option value="mahasiswa">Mahasiswa</option>
              </select>
            </div>

            {isLoading ? (
              <div className="rounded-2xl border-2 border-[#dfe2ec] bg-white/85 backdrop-blur-xl shadow-[0_25px_55px_rgba(17,24,39,0.06)] p-6 lg:p-8">
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="animate-spin w-8 h-8 border-4 border-[#ff007a] border-t-transparent rounded-full"></div>
                    </div>
                    <p className="text-[#6d7079] font-medium">Memuat data pengguna...</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Peran</TableHead>
                      <TableHead>Departemen</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Dibuat</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <div className="font-semibold">{user.full_name}</div>
                            {user.role === 'admin' && <Shield className="h-4 w-4 text-red-600" />}
                          </div>
                        </TableCell>
                        <TableCell>{user.email || 'N/A'}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {user.nim || user.nip || '-'}
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <ModernButton
                              variant="outline"
                              size="icon"
                              onClick={() => setViewingUser(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </ModernButton>
                            <ModernButton
                              variant="outline"
                              size="icon"
                              disabled
                              title="Fitur dalam pengembangan"
                            >
                              <Edit className="h-4 w-4" />
                            </ModernButton>
                            <ModernButton
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(user.id)}
                              disabled={deleteMutation.isPending || user.role === 'admin'}
                              title={user.role === 'admin' ? 'Tidak dapat menghapus pengguna admin' : 'Hapus pengguna'}
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </ModernButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {users?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2">Tidak ada pengguna ditemukan</p>
                    <p className="text-sm">Coba sesuaikan pencarian atau filter Anda</p>
                  </div>
                )}
              </div>
            )}
          </ModernCardContent>
        </ModernCard>
      </div>

      {/* View Dialog */}
      {viewingUser && (
        <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detail Pengguna</DialogTitle>
              <DialogDescription>
                Lihat informasi detail tentang pengguna ini.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                  <p className="mt-1 font-semibold">{viewingUser.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1">{viewingUser.email || 'Tidak Ada'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Peran</label>
                  <div className="mt-1">{getRoleBadge(viewingUser.role)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Departemen</label>
                  <p className="mt-1">{viewingUser.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ID Mahasiswa/Dosen</label>
                  <p className="mt-1 font-mono">{viewingUser.nim || viewingUser.nip || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Telepon</label>
                  <p className="mt-1">{viewingUser.phone || '-'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">ID Pengguna</label>
                  <p className="mt-1 font-mono text-sm">{viewingUser.id}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">Anggota Sejak</label>
                  <p className="mt-1">{formatDate(viewingUser.created_at)}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}