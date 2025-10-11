'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { useAuth } from '@/components/auth/auth-provider'
import {
  LayoutDashboard,
  Package,
  Activity,
  Users,
  Settings,
  LogOut,
  Menu,
  BarChart3,
  Wrench
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
    title: 'Equipment',
    href: '/dashboard/equipment',
    icon: Package,
  },
  {
    title: 'Transactions',
    href: '/dashboard/transactions',
    icon: Activity,
  },
  {
    title: 'Maintenance',
    href: '/dashboard/maintenance',
    icon: Wrench,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Users',
    href: '/dashboard/users',
    icon: Users,
    roles: ['admin', 'lab_staff'],
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['admin'],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true
    return profile?.role && item.roles.includes(profile.role)
  })

  const NavContent = () => (
    <div className="flex h-full flex-col bg-white">
      {/* Logo */}
      <div className="h-16 flex items-center px-8 border-b border-black">
        <div className="text-xl font-black tracking-tight">INVENTORY</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8">
        <div className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center px-8 py-3 text-sm transition-none',
                  isActive
                    ? 'bg-black text-white font-medium'
                    : 'text-gray-900 hover:bg-gray-100'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="w-4 h-4 mr-3" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Info */}
      <div className="border-t border-black px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium truncate">
              {profile?.full_name || user?.email || 'Unknown User'}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {profile?.role || 'user'}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-black p-2"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <NavContent />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-black bg-white">
        <div className="text-lg font-black tracking-tight">INVENTORY</div>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <VisuallyHidden>
              <SheetTitle>Navigation Menu</SheetTitle>
            </VisuallyHidden>
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}