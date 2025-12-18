import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ModernButton } from '@/components/ui/modern-button'
import { Input } from '@/components/ui/input'
import { ModernCard, ModernCardContent, ModernCardHeader } from '@/components/ui/modern-card'
import { ModernBadge } from '@/components/ui/modern-badge'
import { UserItemCard } from './user-item-card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Users } from 'lucide-react'


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

  const { data: users, isLoading } = useQuery({
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

  // Auth users fetching isn't strictly needed for display if we trust 'users' table, 
  // but kept if logic depended on it (it didn't seem to).

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await supabase.from('users').delete().eq('id', userId)
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
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
    return <ModernBadge variant={variants[role] || 'outline'} className="capitalize">{role.replace('_', ' ')}</ModernBadge>
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
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 hidden">Manajemen Pengguna</h1> {/* Hidden as page header handles this */}
            {/* Keeping it simple inside the card or just the controls */}
          </div>
        </div>

        <ModernCard className="border-2 border-[#dfe2ec] bg-white/85 backdrop-blur-xl shadow-[0_25px_55px_rgba(17,24,39,0.06)]">
          <ModernCardHeader title="Daftar Pengguna" description="Kelola akses dan data pengguna" className="border-b border-[#dfe2ec]/50" />
          <ModernCardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Cari nama, email, atau departemen..."
                  className="pl-10 h-12 text-base rounded-2xl border-gray-200 bg-gray-50 focus:bg-white transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full sm:w-auto px-5 py-3 border border-gray-200 bg-gray-50 rounded-2xl text-[15px] font-medium text-gray-700 shadow-sm outline-none transition focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.16)] h-12 cursor-pointer hover:bg-white"
              >
                <option value="">Semua Peran</option>
                <option value="admin">Admin</option>
                <option value="lab_staff">Staff Lab</option>
                <option value="dosen">Dosen</option>
                <option value="mahasiswa">Mahasiswa</option>
              </select>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {users?.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4">
                      <Users className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Tidak ada pengguna ditemukan</h3>
                    <p className="text-gray-500 mt-1 max-w-sm mx-auto">Coba ubah kata kunci pencarian atau filter peran untuk menemukan pengguna.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {users?.map((user) => (
                      <UserItemCard
                        key={user.id}
                        user={user}
                        onView={setViewingUser}
                        onDelete={handleDelete}
                        // Admin check: simplified for now, assuming currentUser has rights to see this page implies management
                        // Ideally pass down actual current user role
                        canManage={true}
                        isDeleting={deleteMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </>
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