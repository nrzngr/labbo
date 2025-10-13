'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
import { ModernBadge } from '@/components/ui/modern-badge'
import { ModernCard } from '@/components/ui/modern-card'
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
  Target
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
}

const navItems: NavItem[] = [
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
    title: 'Penjadwalan',
    href: '/dashboard/scheduling',
    icon: Calendar,
    roles: ['admin', 'lab_staff', 'lecturer'],
  },
  {
    title: 'Mobile Checkout',
    href: '/dashboard/checkout',
    icon: Camera,
  },
  {
    title: 'QR Scanner',
    href: '/dashboard/qr-scanner',
    icon: Camera,
  },
  {
    title: 'Peminjaman Saya',
    href: '/dashboard/my-borrowings',
    icon: Activity,
    roles: ['student', 'lecturer'],
  },
  {
    title: 'Transaksi',
    href: '/dashboard/transactions',
    icon: Activity,
    roles: ['admin', 'lab_staff'],
  },
  {
    title: 'Pemeliharaan',
    href: '/dashboard/maintenance',
    icon: Wrench,
    roles: ['admin', 'lab_staff'],
  },
  {
    title: 'Kalibrasi',
    href: '/dashboard/calibration',
    icon: Target,
    roles: ['admin', 'lab_staff'],
  },
  {
    title: 'Analitik',
    href: '/dashboard/analytics',
    icon: BarChart3,
    roles: ['admin', 'lab_staff'],
  },
  {
    title: 'Pengguna',
    href: '/dashboard/users',
    icon: Users,
    roles: ['admin', 'lab_staff'],
  },
  {
    title: 'Profil Saya',
    href: '/dashboard/profile',
    icon: Users,
    roles: ['student', 'lecturer'],
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

  const NavContent = () => (
    <div className="flex h-full flex-col bg-white">
      {/* Enhanced Logo */}
      <div className="h-20 flex items-center px-8 border-b border-black bg-gradient-to-r from-black to-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl">
            <Package className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-white">INVENTORI</div>
            <div className="text-xs text-gray-300">Sistem Manajemen Lab</div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation */}
      <nav className="flex-1 py-6">
        <div className="px-4 space-y-2">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-200 hover:scale-105',
                  isActive
                    ? 'bg-black text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className={cn(
                  'p-2 rounded-xl mr-3 transition-colors',
                  isActive ? 'bg-white text-black' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                )}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="flex-1">{item.title}</span>
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Enhanced User Info */}
      <div className="border-t border-black bg-gray-50 px-6 py-4">
        <ModernCard variant="default" className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold">
                {(user?.full_name || user?.email || 'U')?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 truncate max-w-[120px]">
                  {user?.full_name || user?.email || 'Pengguna Tidak Diketahui'}
                </div>
                <ModernBadge
                  variant="default"
                  size="sm"
                  className="capitalize mt-1"
                >
                  {user?.role || 'user'}
                </ModernBadge>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-black text-black hover:bg-black hover:text-white transition-colors font-medium"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </Button>
        </ModernCard>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <NavContent />
      </div>

      {/* Enhanced Mobile Header */}
      <div className="lg:hidden flex items-center justify-between h-20 px-4 border-b border-black bg-gradient-to-r from-black to-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl">
            <Package className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight text-white">INVENTORI</div>
            <div className="text-xs text-gray-300">Manajemen Lab</div>
          </div>
        </div>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2 text-white hover:bg-white/20">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-white">
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