'use client'

import { ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { LoginAccent } from '@/components/auth/login-accent'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="relative flex flex-col lg:flex-row min-h-screen w-full bg-[#f7f6fb] text-[#111827] overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute right-[-14%] top-[-18%] hidden xl:block h-[640px] w-[520px] saturate-110">
          <LoginAccent className="h-full w-full opacity-70" />
        </div>
        <div className="absolute bottom-[-22%] left-[-12%] hidden lg:block h-[420px] w-[420px] rounded-full bg-[#ff007a]/12 blur-3xl" />
        <div className="absolute top-[25%] right-[-18%] hidden xl:block h-[320px] w-[320px] rounded-full bg-[#4f46e5]/10 blur-3xl" />
      </div>

      <Sidebar />

      <div className="relative w-full flex-1 lg:pl-72 xl:pl-[21rem] min-w-0">
        <main className="flex-1 w-full min-w-0">
          <div className="w-full min-w-0 max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout

