'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { UserList } from '@/components/users/user-list'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ModernCard, ModernCardHeader } from '@/components/ui/modern-card'
import { Users, UserPlus } from 'lucide-react'
import { ModernButton } from '@/components/ui/modern-button'

export default function UsersPage() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 page-gradient min-h-screen">
          {/* Enhanced Page Header */}
          <ModernCard variant="elevated" padding="lg" className="mb-6 sm:mb-8 fade-in">
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-purple-600 rounded-xl">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 mb-1 sm:mb-2">
                    MANAJEMEN PENGGUNA
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 font-medium">
                    Kelola pengguna, peran, dan perizinan
                  </p>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <ModernButton
                  variant="outline"
                  size="sm"
                  leftIcon={<UserPlus className="w-4 h-4" />}
                  className="w-full sm:w-auto button-hover-lift"
                >
                  Tambah Pengguna
                </ModernButton>
              </div>
            </div>
          </ModernCard>

          {/* Main User List */}
          <div className="slide-up">
            <UserList />
          </div>
        </div>
      </DashboardLayout>
    </QueryClientProvider>
  )
}