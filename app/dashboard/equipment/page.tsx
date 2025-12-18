"use client"

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCustomAuth } from '@/components/auth/custom-auth-provider'
import { EquipmentList } from '@/components/equipment/equipment-list'
import { ModernButton } from '@/components/ui/modern-button'
import { Package, Filter, Download, Upload, BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BorrowRequestForm } from '@/components/student/borrow-request-form'

export default function EquipmentPage() {
  const { user } = useCustomAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [isBorrowDialogOpen, setIsBorrowDialogOpen] = useState(false)

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

  const isStudent = user?.role === 'student' || user?.role === 'mahasiswa'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1a1f36] tracking-tight mb-2">
            {isStudent ? 'Katalog Peralatan.' : 'Inventori Peralatan.'}
          </h1>
          <p className="text-gray-500 font-medium text-lg">
            {isStudent
              ? 'Jelajahi dan pinjam peralatan laboratorium yang tersedia'
              : 'Kelola dan pantau semua peralatan laboratorium'
            }
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {isStudent ? (
            <Dialog open={isBorrowDialogOpen} onOpenChange={setIsBorrowDialogOpen}>
              <DialogTrigger asChild>
                <ModernButton
                  variant="default"
                  size="lg"
                  leftIcon={<Package className="w-5 h-5" />}
                  className="w-full sm:w-auto bg-[#ff007a] hover:bg-[#df006b] text-white border-none shadow-lg shadow-pink-500/30"
                >
                  Pinjam Peralatan
                </ModernButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] border-none rounded-[2rem] mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                <DialogHeader className="p-6 pb-2">
                  <DialogTitle className="text-2xl font-black text-gray-900">Pinjam Peralatan</DialogTitle>
                </DialogHeader>
                <div className="p-6 pt-2">
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
                className="w-full sm:w-auto border-gray-200 text-gray-600 hover:text-[#ff007a] hover:border-[#ff007a]/30"
              >
                Impor
              </ModernButton>
              <ModernButton
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-4 h-4" />}
                className="w-full sm:w-auto border-gray-200 text-gray-600 hover:text-[#ff007a] hover:border-[#ff007a]/30"
              >
                Ekspor
              </ModernButton>
              <ModernButton
                variant="secondary"
                size="sm"
                leftIcon={<Filter className="w-4 h-4" />}
                className="w-full sm:w-auto text-[#ff007a] bg-[#ff007a]/10 hover:bg-[#ff007a]/20 border-none"
              >
                Filter Lanjutan
              </ModernButton>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-500">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-1">{totalCount || 0}</h3>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Total Peralatan</p>
          <p className="text-xs text-gray-400 mt-1 font-medium">Semua aset terdaftar</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-green-50 text-green-500">
              <div className="w-6 h-6 rounded-full border-[5px] border-current"></div>
            </div>
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-1">{availableCount || 0}</h3>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Tersedia</p>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            {totalCount && availableCount ? `${Math.round((availableCount / totalCount) * 100)}% dari total aset` : '0%'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-yellow-50 text-yellow-500">
              <div className="w-6 h-6 rounded-full border-[5px] border-current border-t-transparent"></div>
            </div>
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-1">{borrowedCount || 0}</h3>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Sedang Digunakan</p>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            {totalCount && borrowedCount ? `${Math.round((borrowedCount / totalCount) * 100)}% sedang dipinjam` : '0%'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-500">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-1">{categories?.length || 0}</h3>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Kategori</p>
          <p className="text-xs text-gray-400 mt-1 font-medium">Jenis peralatan</p>
        </div>
      </div>

      {/* Categories Quick Filter (Student Only) */}
      {isStudent && categories && categories.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Kategori Populer</h3>
          <div className="flex flex-wrap gap-2">
            {categories?.slice(0, 8).map((category: any) => (
              <button
                key={category.id}
                onClick={() => setSearchTerm(category.name)}
                className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-600 hover:bg-[#ff007a] hover:text-white hover:border-[#ff007a] transition-all duration-200"
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <EquipmentList />
      </div>
    </div>
  )
}
