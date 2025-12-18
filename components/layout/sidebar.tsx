'use client'

import { useState, useEffect } from 'react'
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
  Wrench,
  Camera,
  Bell,
  AlertTriangle,
  UserCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight
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

interface SidebarProps {
  isCollapsed?: boolean
  toggleSidebar?: () => void
}

export function Sidebar({ isCollapsed = false, toggleSidebar }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useCustomAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by waiting for client mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await logout()
    router.push('/')
  }

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true
    return user?.role && item.roles.includes(user.role)
  })

  const displayName = user?.full_name || user?.email || 'Pengguna'
  const displayEmail = user?.full_name && user?.email ? user.email : ''
  const userInitial = displayName.charAt(0).toUpperCase()

  const NavContent = ({ mobile = false }) => (
    <div className={cn(
      "relative flex h-full min-h-0 flex-col overflow-hidden border-r border-[#f1d6e6]/70 bg-white/85 backdrop-blur-xl shadow-[0_24px_50px_rgba(17,24,39,0.08)] transition-all duration-300 ease-in-out",
      mobile ? "rounded-none border-none w-full" : isCollapsed ? "w-[80px]" : "w-72 xl:w-[21rem] rounded-r-[36px]"
    )}>
      {/* Background accents only if expanded or mobile */}
      {(!isCollapsed || mobile) && (
        <div className="absolute inset-0 -z-10 opacity-100 transition-opacity duration-500">
          <div className="absolute -top-56 -right-56 hidden xl:block h-[520px] w-[520px] opacity-45 pointer-events-none">
            <LoginAccent className="h-full w-full opacity-70" />
          </div>
          <div className="absolute top-[36%] left-[-32%] h-64 w-64 rounded-full bg-[#ff007a]/16 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-28%] right-[-18%] h-72 w-72 rounded-full bg-[#4f46e5]/12 blur-3xl pointer-events-none" />
        </div>
      )}

      {/* Header / Logo */}
      <div className={cn(
        "flex-none z-20 flex items-center border-b border-[#f1d6e6]/70 transition-all duration-300 bg-white/50 backdrop-blur-sm",
        isCollapsed && !mobile ? "justify-center h-20 px-2" : "h-[4.5rem] justify-between px-4"
      )}>
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center justify-center transition-all duration-200 hover:bg-white/50",
            isCollapsed && !mobile ? "p-2 rounded-xl" : "rounded-[18px] px-4 py-2"
          )}
          onClick={() => setMobileMenuOpen(false)}
        >
          {isCollapsed && !mobile ? (
            <Image
              src="/logo-icon.svg"
              alt="Labbo"
              width={32}
              height={36}
              priority
              className="h-9 w-auto"
            />
          ) : (
            <Image
              src="/logo.svg"
              alt="Labbo"
              width={140}
              height={40}
              priority
              className="h-8 w-auto"
            />
          )}
        </Link>

        {/* Collapse Toggle Button (Desktop Only) - Shown when expanded */}
        {!mobile && toggleSidebar && !isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expand Button - Shown when collapsed (below logo) */}
      {!mobile && toggleSidebar && isCollapsed && (
        <div className="flex-none z-20 flex justify-center py-3 border-b border-[#f1d6e6]/70 bg-white/50 backdrop-blur-sm">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl bg-gray-50 hover:bg-[#ff007a]/10 text-gray-400 hover:text-[#ff007a] transition-all"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <nav className="flex-1 min-h-0 px-3 py-4 overflow-y-auto custom-scrollbar relative z-10 pointer-events-auto">
        <div className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.title : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-semibold transition-all duration-200 pointer-events-auto overflow-hidden whitespace-nowrap',
                  isActive
                    ? 'bg-[#ff007a] text-white shadow-[0_18px_40px_rgba(255,0,122,0.35)]'
                    : 'text-[#6d7079] hover:bg-[#ffe4f2] hover:text-[#ff007a]',
                  isCollapsed && !mobile ? "justify-center px-0" : ""
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div
                  className={cn(
                    'flex items-center justify-center rounded-[12px] border border-transparent transition-all duration-200 flex-shrink-0',
                    isActive
                      ? 'bg-white text-[#ff007a]'
                      : 'bg-[#eef0f8] text-[#8b8f99] group-hover:border-[#ff007a]/40 group-hover:bg-white group-hover:text-[#ff007a]',
                    isCollapsed && !mobile ? "w-10 h-10 text-lg" : "h-9 w-9"
                  )}
                >
                  <item.icon className={cn("transition-all", isCollapsed && !mobile ? "w-5 h-5" : "h-4 w-4")} />
                </div>

                <span className={cn(
                  "flex-1 leading-tight transition-all duration-300 opacity-100",
                  isCollapsed && !mobile ? "opacity-0 w-0 hidden" : "w-auto"
                )}>
                  {item.title}
                </span>

                {isActive && (!isCollapsed || mobile) && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.75)]" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className={cn(
        "flex-none relative z-10 border-t border-[#f1d6e6]/70 bg-white/70 backdrop-blur-xl pointer-events-auto transition-all mt-auto",
        isCollapsed && !mobile ? "p-2" : "px-4 py-4"
      )}>
        <div className={cn(
          "rounded-[20px] bg-white/85 shadow-[0_18px_36px_rgba(255,0,122,0.1)] transition-all overflow-hidden",
          isCollapsed && !mobile ? "border-0 bg-transparent shadow-none p-0 flex flex-col items-center gap-2" : "border border-[#ffe0f2] p-3.5"
        )}>
          <div className={cn("flex items-center gap-4", isCollapsed && !mobile ? "justify-center w-full" : "")}>
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#ff88c4] to-[#ff007a] text-sm font-semibold text-white shadow-[0_12px_22px_rgba(255,0,122,0.22)]">
              {userInitial}
            </div>
            {(!isCollapsed || mobile) && (
              <div className="min-w-0 transition-opacity duration-300">
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
            )}
          </div>

          <ModernButton
            variant={isCollapsed && !mobile ? "ghost" : "outline"}
            size="sm"
            fullWidth={!isCollapsed}
            className={cn("mt-3 pointer-events-auto", isCollapsed && !mobile ? "w-10 h-10 p-0 text-red-500 hover:bg-red-50" : "")}
            onClick={handleSignOut}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            {(!isCollapsed || mobile) && "Keluar"}
          </ModernButton>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar Container */}
      <div className={cn(
        "hidden lg:flex lg:fixed lg:inset-y-0 lg:flex-col lg:z-50 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[80px]" : "w-72 xl:w-[21rem]"
      )}>
        <NavContent />
      </div>

      {/* Mobile Header (unchanged) */}
      <div className="fixed top-0 left-0 right-0 z-50 lg:hidden flex h-16 w-full items-center border-b border-[#f1d6e6]/70 bg-white/95 px-4 backdrop-blur-xl shadow-sm">
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
        {mounted && (
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
              <NavContent mobile />
            </SheetContent>
          </Sheet>
        )}
        {!mounted && (
          <button
            className="absolute right-4 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full p-0 text-[#ff007a] hover:bg-[#ffe4f2] inline-flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>
    </>
  )
}
