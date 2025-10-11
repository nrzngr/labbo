'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { UserList } from '@/components/users/user-list'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default function UsersPage() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-8 py-8">
          <UserList />
        </div>
      </DashboardLayout>
    </QueryClientProvider>
  )
}