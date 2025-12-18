import { ModernCard } from '@/components/ui/modern-card'
import { ModernBadge } from '@/components/ui/modern-badge'
import { ModernButton } from '@/components/ui/modern-button'
import { Shield, Eye, Trash2, Mail, Building, Phone, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface UserItemCardProps {
    user: User
    onView: (user: User) => void
    onDelete: (id: string) => void
    canManage: boolean
    isDeleting: boolean
}

export function UserItemCard({ user, onView, onDelete, canManage, isDeleting }: UserItemCardProps) {
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
        <ModernCard className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-l-4 border-l-transparent hover:border-l-[#ff007a]">
            <div className="p-5 flex flex-col h-full">
                {/* Header: Avatar, Name, Role */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md transition-transform group-hover:scale-105",
                            user.role === 'admin' ? "bg-gradient-to-br from-red-500 to-pink-600" :
                                user.role === 'lab_staff' ? "bg-gradient-to-br from-blue-500 to-indigo-600" :
                                    "bg-gradient-to-br from-gray-500 to-gray-700"
                        )}>
                            {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 leading-tight group-hover:text-[#ff007a] transition-colors">
                                {user.full_name}
                            </h3>
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                                {user.role === 'admin' && <Shield className="h-3 w-3 text-red-500" />}
                                <span className="capitalize">{user.role.replace('_', ' ')}</span>
                            </div>
                        </div>
                    </div>
                    {getRoleBadge(user.role)}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="truncate" title={user.email}>{user.email || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{user.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <Hash className="h-4 w-4 text-gray-400" />
                        <span className="font-mono text-xs">{user.nim || user.nip || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{user.phone || '-'}</span>
                    </div>
                </div>

                {/* Footer: Date & Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <div className="text-xs text-gray-400 font-medium">
                        Bergabung: {formatDate(user.created_at)}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <ModernButton
                            variant="outline"
                            size="sm"
                            onClick={() => onView(user)}
                            className="h-8 px-2"
                            title="Lihat Detail"
                        >
                            <Eye className="h-4 w-4" />
                        </ModernButton>
                        {canManage && user.role !== 'admin' && (
                            <ModernButton
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete(user.id)}
                                disabled={isDeleting}
                                className="h-8 px-2 text-red-600 hover:bg-red-50 hover:border-red-200"
                                title="Hapus Pengguna"
                            >
                                <Trash2 className="h-4 w-4" />
                            </ModernButton>
                        )}
                    </div>
                </div>
            </div>
        </ModernCard>
    )
}
