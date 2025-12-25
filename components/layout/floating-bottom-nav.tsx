'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  Camera,
  Bell,
  Menu,
  Plus,
  Activity,
  UserCheck,
  CalendarDays,
  AlertTriangle,
  Users,
  Wrench,
  Settings,
  LogOut,
  X
} from 'lucide-react'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
}

const mainNavItems: NavItem[] = [
  { title: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Katalog', href: '/dashboard/equipment', icon: Package },
  { title: 'Hub', href: '#hub', icon: Plus }, // Central Action Sheet Toggle
  { title: 'Notif', href: '/dashboard/notifications', icon: Bell },
  { title: 'Scan', href: '/dashboard/scan', icon: Camera },
]

const hubNavItems: NavItem[] = [
  { title: 'Peminjaman Saya', href: '/dashboard/my-borrowings', icon: Activity, roles: ['mahasiswa', 'dosen'] },
  { title: 'Transaksi', href: '/dashboard/transactions', icon: Activity, roles: ['admin', 'lab_staff'] },
  { title: 'Permintaan Pinjam', href: '/dashboard/borrowing-requests', icon: UserCheck, roles: ['admin', 'lab_staff'] },
  { title: 'Permintaan Kembali', href: '/dashboard/return-requests', icon: Package, roles: ['admin', 'lab_staff'] },
  { title: 'Monitoring', href: '/dashboard/monitoring', icon: Users, roles: ['dosen', 'admin', 'lab_staff'] },
  { title: 'Pemeliharaan', href: '/dashboard/maintenance', icon: Wrench, roles: ['admin', 'lab_staff'] },
  { title: 'Pengguna', href: '/dashboard/users', icon: Users, roles: ['admin'] },
  { title: 'Pengaturan', href: '/dashboard/settings', icon: Settings, roles: ['admin'] },
  { title: 'Profil', href: '/dashboard/profile', icon: Users, roles: ['mahasiswa', 'dosen'] },
]

export function FloatingBottomNav() {
  const pathname = usePathname()
  const { user, logout } = useCustomAuth()
  const [isHubOpen, setIsHubOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const filteredHubItems = hubNavItems.filter(item => {
    if (!item.roles) return true
    return user?.role && item.roles.includes(user.role)
  })

  // Conditionally include Hub in main nav
  const activeMainNavItems = mainNavItems.filter(item => {
    if (item.href === '#hub') {
      return filteredHubItems.length > 0
    }
    return true
  })

  return (
    <div className="lg:hidden">
      {/* Backdrop Blur overlay when hub is open */}
      <AnimatePresence>
        {isHubOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsHubOpen(false)}
            className="fixed inset-0 z-[42] bg-black/20 backdrop-blur-sm shadow-xl"
          />
        )}
      </AnimatePresence>

      {/* Action Sheet (Hub) */}
      <AnimatePresence>
        {isHubOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[45] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-xl rounded-t-[32px] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] border-t border-gray-100"
          >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 flex-shrink-0" />
            <div className="max-h-[60vh] overflow-y-auto pb-24">
              <div className="grid grid-cols-3 gap-4">
                {filteredHubItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsHubOpen(false)}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-[#ff007a]/5 transition-colors group"
                  >
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 group-hover:bg-[#ff007a]/10 transition-colors">
                      <item.icon className="w-6 h-6 text-gray-500 group-hover:text-[#ff007a]" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">
                      {item.title}
                    </span>
                  </Link>
                ))}
                
                {/* Always show logout in Action Sheet */}
                <button
                  onClick={async () => {
                    setIsHubOpen(false)
                    await logout()
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-red-50 transition-colors group"
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-50 group-hover:bg-red-100 transition-colors">
                    <LogOut className="w-6 h-6 text-red-500" />
                  </div>
                  <span className="text-[10px] font-medium text-red-600 text-center leading-tight">
                    Keluar
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Bottom Bar */}
      <nav className="fixed bottom-6 left-4 right-4 z-[40] h-[72px] bg-white/70 backdrop-blur-md rounded-[32px] border border-white/40 shadow-[0_12px_40px_rgba(0,0,0,0.15)] flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] overflow-hidden">
        {activeMainNavItems.map((item) => {
          const isActive = pathname === item.href
          const isHubToggle = item.href === '#hub'

          if (isHubToggle) {
            return (
              <button
                key={item.title}
                onClick={() => setIsHubOpen(!isHubOpen)}
                className="relative flex items-center justify-center group"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 shadow-lg",
                    isHubOpen 
                      ? "bg-[#ff007a] text-white rotate-45" 
                      : "bg-[#111827] text-white"
                  )}
                >
                  <Plus className="w-6 h-6" />
                </motion.div>
                <div className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-[#ff007a] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center flex-1 h-full group"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={cn(
                  "flex items-center justify-center rounded-2xl transition-all duration-300",
                  isActive ? "text-[#ff007a]" : "text-gray-400 group-hover:text-gray-600"
                )}
              >
                <item.icon className={cn("w-6 h-6", isActive ? "fill-[#ff007a]/10" : "")} />
              </motion.div>
              
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#ff007a]"
                  transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
