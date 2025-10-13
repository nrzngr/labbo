'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
import { EquipmentList } from '@/components/equipment/equipment-list'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ModernCard, ModernCardHeader } from '@/components/ui/modern-card'
import { ModernBadge } from '@/components/ui/modern-badge'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernInput } from '@/components/ui/modern-input'
import { Package, Filter, Download, Upload, Search, Calendar, BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BorrowRequestForm } from '@/components/student/borrow-request-form'

export default function EquipmentPage() {
  const { user } = useCustomAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [isBorrowDialogOpen, setIsBorrowDialogOpen] = useState(false)
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null)

  const { data: availableCount } = useQuery({
    queryKey: ['available-equipment-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available')
      return count || 0
    }
  })

  const { data: totalCount } = useQuery({
    queryKey: ['total-equipment-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true })
      return count || 0
    }
  })

  const { data: borrowedCount } = useQuery({
    queryKey: ['borrowed-equipment-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'borrowed')
      return count || 0
    }
  })

  const { data: categories } = useQuery({
    queryKey: ['equipment-categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
      return data || []
    }
  })

  const isStudent = user?.role === 'student'
  const isLecturer = user?.role === 'lecturer'

  const handleBorrowEquipment = (equipmentId: string) => {
    setSelectedEquipmentId(equipmentId)
    setIsBorrowDialogOpen(true)
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 page-gradient min-h-screen">
          <ModernCard variant="elevated" padding="lg" className="mb-6 sm:mb-8 fade-in">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-blue-600 rounded-xl">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 mb-1 sm:mb-2">
                  {isStudent ? 'Katalog Peralatan' : 'Inventori Peralatan'}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 font-medium">
                  {isStudent
                    ? 'Jelajahi dan pinjam peralatan laboratorium yang tersedia'
                    : 'Kelola dan pantau semua peralatan laboratorium'
                  }
                </p>
              </div>
            </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {isStudent ? (
                <Dialog open={isBorrowDialogOpen} onOpenChange={setIsBorrowDialogOpen}>
                  <DialogTrigger asChild>
                    <ModernButton
                      variant="default"
                      size="sm"
                      leftIcon={<Package className="w-4 h-4" />}
                      className="w-full sm:w-auto button-hover-lift"
                    >
                      Pinjam Peralatan
                    </ModernButton>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] border-2 border-black rounded-2xl mx-4 max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-2">
                      <DialogTitle className="text-2xl font-black">Pinjam Peralatan</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                      <BorrowRequestForm
                        onSuccess={() => {
                          setIsBorrowDialogOpen(false)
                        }}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <>
                  <ModernButton
                    variant="outline"
                    size="sm"
                    leftIcon={<Upload className="w-4 h-4" />}
                    className="w-full sm:w-auto button-hover-lift"
                  >
                    Impor
                  </ModernButton>
                  <ModernButton
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="w-4 h-4" />}
                    className="w-full sm:w-auto button-hover-lift"
                  >
                    Ekspor
                  </ModernButton>
                  <ModernButton
                    variant="secondary"
                    size="sm"
                    leftIcon={<Filter className="w-4 h-4" />}
                    className="w-full sm:w-auto button-hover-lift"
                  >
                    Filter Lanjutan
                  </ModernButton>
                </>
              )}
            </div>
          </div>
        </ModernCard>

        <ModernCard variant="default" padding="sm" className="mb-6 sm:mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <ModernInput
              placeholder={isStudent
                ? "Cari peralatan berdasarkan nama, kategori, atau deskripsi..."
                : "Cari peralatan berdasarkan nama, nomor seri, atau kategori..."
              }
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </ModernCard>

        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">
                {isStudent ? 'Total Item' : 'Peralatan'}
              </span>
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-xl">
                <Package className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">
              {totalCount || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">
              {isStudent ? 'Tersedia untuk ditelusuri' : 'Total peralatan'}
            </div>
          </ModernCard>

          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Tersedia</span>
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-xl">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">
              {availableCount || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">
              {totalCount && availableCount ? `${Math.round((availableCount / totalCount) * 100)}% tersedia` : '0% tersedia'}
            </div>
          </ModernCard>

          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Digunakan</span>
              <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-xl">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded-full"></div>
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">
              {borrowedCount || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">
              {totalCount && borrowedCount ? `${Math.round((borrowedCount / totalCount) * 100)}% digunakan` : '0% digunakan'}
            </div>
          </ModernCard>

          <ModernCard variant="default" hover className="stats-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">
                {isStudent ? 'Kategori' : 'Pemeliharaan'}
              </span>
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-xl">
                {isStudent ? (
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                ) : (
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                )}
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1">
              {isStudent ? (categories?.length || 0) : '0'}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">
              {isStudent ? 'Kategori peralatan' : 'Dalam pemeliharaan'}
            </div>
          </ModernCard>
        </div>

        {isStudent && categories && categories.length > 0 && (
          <ModernCard variant="default" padding="lg" className="mb-6 sm:mb-8">
            <ModernCardHeader
              title="Kategori Populer"
              description="Jelajahi peralatan berdasarkan kategori"
              className="mb-4 sm:mb-6"
            />
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {categories?.slice(0, 8).map((category: any) => (
                <ModernButton
                  key={category.id}
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm(category.name)}
                  className="justify-start"
                >
                  {category.name}
                </ModernButton>
              ))}
            </div>
          </ModernCard>
        )}

        <div className="slide-up">
          <EquipmentList />
        </div>
      </div>
    </DashboardLayout>
  )
}