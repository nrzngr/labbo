'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
import { ModernBadge } from '@/components/ui/modern-badge'
import { ModernButton } from '@/components/ui/modern-button'
import { LoginAccent } from '@/components/auth/login-accent'
import {
  LayoutDashboard,
  Package,
  Activity,
  Users,
  Settings,
  LogOut,
  Menu,
  BarChart3,
  Wrench,
  Calendar,
  Camera,
  Target,
  Bell,
  FileText,
  Building2,
  AlertTriangle,
  UserCheck,
  CalendarDays
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
  badge?: string
}

const navItems: NavItem[] = [
  // === UMUM ===
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Katalog Peralatan',
    href: '/dashboard/equipment',
    icon: Package,
  },
  {
    title: 'Scan QR Code',
    href: '/dashboard/scan',
    icon: Camera,
  },

  // === MAHASISWA/DOSEN ===
  {
    title: 'Peminjaman Saya',
    href: '/dashboard/my-borrowings',
    icon: Activity,
    roles: ['mahasiswa', 'dosen'],
  },

  // === ADMIN: MANAJEMEN PEMINJAMAN ===
  {
    title: 'Transaksi',
    href: '/dashboard/transactions',
    icon: Activity,
    roles: ['admin', 'lab_staff'],
  },
  {
    title: 'Permintaan Peminjaman',
    href: '/dashboard/borrowing-requests',
    icon: UserCheck,
    roles: ['admin', 'lab_staff'],
  },
  {
    title: 'Permintaan Pengembalian',
    href: '/dashboard/return-requests',
    icon: Package,
    roles: ['admin', 'lab_staff'],
  },
  {
    title: 'Permintaan Perpanjangan',
    href: '/dashboard/extension-requests',
    icon: CalendarDays,
    roles: ['admin', 'lab_staff'],
  },
  {
    title: 'Denda & Pelanggaran',
    href: '/dashboard/penalties',
    icon: AlertTriangle,
    roles: ['admin', 'lab_staff'],
  },

  // === ADMIN: MONITORING & REPORTS ===
  {
    title: 'Monitoring Mahasiswa',
    href: '/dashboard/monitoring',
    icon: Users,
    roles: ['dosen', 'admin', 'lab_staff'],
  },

  // === ADMIN: OPERASIONAL ===
  {
    title: 'Pemeliharaan',
    href: '/dashboard/maintenance',
    icon: Wrench,
    roles: ['admin', 'lab_staff'],
  },
  {
    title: 'Pengguna',
    href: '/dashboard/users',
    icon: Users,
    roles: ['admin'],
  },

  // === SEMUA USER ===
  {
    title: 'Notifikasi',
    href: '/dashboard/notifications',
    icon: Bell,
  },
  {
    title: 'Profil Saya',
    href: '/dashboard/profile',
    icon: Users,
    roles: ['mahasiswa', 'dosen'],
  },
  {
    title: 'Pengaturan',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['admin'],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useCustomAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await logout()
    router.push('/')
  }

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true
    return user?.role && item.roles.includes(user.role)
  })

  const displayName = user?.full_name || user?.email || 'Pengguna Tidak Diketahui'
  const displayEmail = user?.full_name && user?.email ? user.email : ''
  const userInitial = displayName.charAt(0).toUpperCase()

  const NavContent = () => (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-r-[36px] border border-[#f1d6e6]/70 bg-white/85 backdrop-blur-xl shadow-[0_24px_50px_rgba(17,24,39,0.08)] pointer-events-auto">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-56 -right-56 hidden xl:block h-[520px] w-[520px] opacity-45 pointer-events-none">
          <LoginAccent className="h-full w-full opacity-70" />
        </div>
        <div className="absolute top-[36%] left-[-32%] h-64 w-64 rounded-full bg-[#ff007a]/16 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-28%] right-[-18%] h-72 w-72 rounded-full bg-[#4f46e5]/12 blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 flex h-[4.5rem] items-center justify-center px-6 py-3 border-b border-[#f1d6e6]/70 pointer-events-auto">
        <Link
          href="/dashboard"
          className="flex items-center justify-center rounded-[18px] px-4 py-2 transition-colors duration-200 hover:bg-white/50 pointer-events-auto"
          onClick={() => setMobileMenuOpen(false)}
        >
          <Image
            src="/logo.svg"
            alt="Labbo"
            width={140}
            height={40}
            priority
            className="h-10 w-auto"
          />
        </Link>
      </div>

      <nav className="relative z-10 flex-1 px-4 py-4 pointer-events-auto">
        <div className="space-y-0.5 pb-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-2.5 rounded-[14px] px-3 py-2 text-sm font-semibold transition-all duration-200 pointer-events-auto',
                  isActive
                    ? 'bg-[#ff007a] text-white shadow-[0_18px_40px_rgba(255,0,122,0.35)]'
                    : 'text-[#6d7079] hover:bg-[#ffe4f2] hover:text-[#ff007a]'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-[12px] border border-transparent bg-[#eef0f8] text-[#8b8f99] transition-all duration-200',
                    isActive
                      ? 'bg-white text-[#ff007a]'
                      : 'group-hover:border-[#ff007a]/40 group-hover:bg-white group-hover:text-[#ff007a]'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="flex-1 leading-tight">{item.title}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.75)]" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="relative z-10 border-t border-[#f1d6e6]/70 bg-white/70 px-4 py-4 backdrop-blur-xl pointer-events-auto">
        <div className="rounded-[20px] border border-[#ffe0f2] bg-white/85 p-3.5 shadow-[0_18px_36px_rgba(255,0,122,0.1)]">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#ff88c4] to-[#ff007a] text-sm font-semibold text-white shadow-[0_12px_22px_rgba(255,0,122,0.22)]">
              {userInitial}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[#111827]">
                {displayName}
              </div>
              {displayEmail && (
                <div className="truncate text-xs font-medium text-[#6d7079]">
                  {displayEmail}
                </div>
              )}
              <ModernBadge variant="secondary" size="sm" className="mt-2 capitalize">
                {user?.role || 'user'}
              </ModernBadge>
            </div>
          </div>
          <ModernButton
            variant="outline"
            size="sm"
            fullWidth
            className="mt-3 pointer-events-auto"
            onClick={handleSignOut}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Keluar
          </ModernButton>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:w-72 xl:w-[21rem] lg:flex-col lg:z-50">
        <NavContent />
      </div>

      {/* Enhanced Mobile Header */}
      <div className="relative lg:hidden flex h-20 w-full items-center border-b border-[#f1d6e6]/70 bg-white/90 px-4 backdrop-blur-xl shadow-[0_12px_28px_rgba(17,24,39,0.08)]">
        <Link
          href="/dashboard"
          className="mx-auto flex items-center justify-center rounded-[16px] px-3 py-2 transition-colors duration-200 hover:bg-white/60"
          onClick={() => setMobileMenuOpen(false)}
        >
          <Image
            src="/logo.svg"
            alt="Labbo"
            width={132}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <ModernButton
              variant="ghost"
              size="sm"
              className="absolute right-4 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full p-0 text-[#ff007a] hover:bg-[#ffe4f2]"
            >
              <Menu className="w-5 h-5" />
            </ModernButton>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-80 border-r border-[#f1d6e6]/70 bg-white/90 p-0 backdrop-blur-xl"
          >
            <VisuallyHidden>
              <SheetTitle>Menu Navigasi</SheetTitle>
            </VisuallyHidden>
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
