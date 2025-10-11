'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardCharts } from '@/components/analytics/dashboard-charts'
import { supabase } from '@/lib/supabase'
import { Activity, Download, TrendingUp, Users, Package } from 'lucide-react'

interface TopBorrower {
  user_name: string
  borrow_count: number
  email: string
}

interface PopularEquipment {
  equipment_name: string
  borrow_count: number
  category: string
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30days')
  const [topBorrowers, setTopBorrowers] = useState<TopBorrower[]>([])
  const [popularEquipment, setPopularEquipment] = useState<PopularEquipment[]>([])

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)

      // Fetch top borrowers
      const { data: borrowerData } = await supabase
        .from('user_borrowing_history')
        .select('*')
        .gte('borrow_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      const borrowerCounts = borrowerData?.reduce((acc, transaction) => {
        const userName = transaction.full_name || 'Unknown'
        const userEmail = transaction.department + '@example.com' // Use department as email placeholder

        if (!acc[userName]) {
          acc[userName] = { user_name: userName, borrow_count: 0, email: userEmail }
        }
        acc[userName].borrow_count++
        return acc
      }, {} as Record<string, TopBorrower>) || {}

      const topBorrowersList = (Object.values(borrowerCounts) as TopBorrower[])
        .sort((a, b) => b.borrow_count - a.borrow_count)
        .slice(0, 10)

      setTopBorrowers(topBorrowersList)

      // Fetch popular equipment
      const { data: equipmentData } = await supabase
        .from('user_borrowing_history')
        .select('*')
        .gte('borrow_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      const equipmentCounts = equipmentData?.reduce((acc, transaction) => {
        const equipmentName = transaction.equipment_name || 'Unknown Equipment'

        if (!acc[equipmentName]) {
          acc[equipmentName] = { equipment_name: equipmentName, borrow_count: 0, category: 'General' }
        }
        acc[equipmentName].borrow_count++
        return acc
      }, {} as Record<string, PopularEquipment>) || {}

      const popularEquipmentList = (Object.values(equipmentCounts) as PopularEquipment[])
        .sort((a, b) => b.borrow_count - a.borrow_count)
        .slice(0, 10)

      setPopularEquipment(popularEquipmentList)

    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    // Simple export functionality
    const csvContent = "data:text/csv;charset=utf-8,"
      + "User Name,Email,Borrow Count\n"
      + topBorrowers.map(e => `${e.user_name},${e.email},${e.borrow_count}`).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "top_borrowers.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="border border-black p-8 sm:p-12 text-center">
            <div className="text-base sm:text-lg">Memuat data analitik...</div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black">ANALITIK</h1>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 lg:space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 sm:px-4 py-3 border border-black focus:ring-0 focus:border-black h-12 text-sm w-full sm:w-auto"
              >
                <option value="7days">7 Hari Terakhir</option>
                <option value="30days">30 Hari Terakhir</option>
                <option value="90days">90 Hari Terakhir</option>
              </select>
              <button
                onClick={exportData}
                className="border border-black px-4 sm:px-6 py-2 sm:py-3 hover:bg-black hover:text-white transition-none text-sm sm:text-base w-full sm:w-auto"
              >
                <Download className="inline w-4 h-4 mr-2" />
                EKSPOR
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Tile Layout */}
        <div className="sm:hidden space-y-4">
          {/* Overview Tile */}
          <div className="border border-black p-4">
            <div className="flex items-center mb-3">
              <TrendingUp className="w-5 h-5 mr-2" />
              <h2 className="text-lg font-bold">RINGKASAN</h2>
            </div>
            <p className="text-xs text-gray-600 mb-3">Grafik dan statistik umum sistem</p>
            <div className="border border-black p-4">
              <DashboardCharts />
            </div>
          </div>

          {/* Top Borrowers Tile */}
          <div className="border border-black p-4">
            <div className="flex items-center mb-3">
              <Users className="w-5 h-5 mr-2" />
              <h2 className="text-lg font-bold">PEMINJAM TERAKTIF</h2>
            </div>
            <p className="text-xs text-gray-600 mb-3">Pengguna paling aktif dalam periode yang dipilih</p>
            <div className="space-y-3">
              {topBorrowers.slice(0, 5).map((borrower, index) => (
                <div key={borrower.email} className="flex items-center justify-between p-3 border border-black hover:bg-gray-50">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="flex items-center justify-center w-6 h-6 border border-black flex-shrink-0">
                      <span className="text-xs font-bold">#{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{borrower.user_name}</p>
                      <p className="text-xs text-gray-600 truncate">{borrower.email}</p>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-lg font-black">{borrower.borrow_count}</p>
                    <p className="text-xs text-gray-600">peminjaman</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Equipment Tile */}
          <div className="border border-black p-4">
            <div className="flex items-center mb-3">
              <Package className="w-5 h-5 mr-2" />
              <h2 className="text-lg font-bold">PERALATAN POPULER</h2>
            </div>
            <p className="text-xs text-gray-600 mb-3">Peralatan yang paling sering dipinjam</p>
            <div className="space-y-3">
              {popularEquipment.slice(0, 5).map((item, index) => (
                <div key={item.equipment_name} className="flex items-center justify-between p-3 border border-black hover:bg-gray-50">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="flex items-center justify-center w-6 h-6 border border-black flex-shrink-0">
                      <span className="text-xs font-bold">#{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.equipment_name}</p>
                      <p className="text-xs text-gray-600 truncate">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-lg font-black">{item.borrow_count}</p>
                    <p className="text-xs text-gray-600">kali dipinjam</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trends Tile */}
          <div className="border border-black p-4">
            <div className="flex items-center mb-3">
              <Activity className="w-5 h-5 mr-2" />
              <h2 className="text-lg font-bold">TREN</h2>
            </div>
            <p className="text-xs text-gray-600 mb-3">Pola penggunaan peralatan dari waktu ke waktu</p>
            <div className="text-center py-6 px-2">
              <Activity className="mx-auto w-10 h-10 mb-2" />
              <h3 className="font-bold text-sm mb-1">ANALISIS TREN</h3>
              <p className="text-xs text-gray-600 mb-4">
                Fitur analisis tren tingkat lanjutan akan segera hadir.
              </p>
              <div className="grid gap-2 grid-cols-1">
                <div className="border border-black p-3 text-center">
                  <div className="text-xs font-medium mb-1">WAKTU PENGGUNAAN PIK</div>
                  <div className="text-lg font-black mb-1">14.00-16.00</div>
                  <div className="text-xs text-gray-600">Jam paling aktif</div>
                </div>
                <div className="border border-black p-3 text-center">
                  <div className="text-xs font-medium mb-1">HARI TERAKTIF</div>
                  <div className="text-lg font-black mb-1">SELASA</div>
                  <div className="text-xs text-gray-600">Aktivitas tertinggi</div>
                </div>
                <div className="border border-black p-3 text-center">
                  <div className="text-xs font-medium mb-1">RATA-RATA DURASI</div>
                  <div className="text-lg font-black mb-1">5,2 HARI</div>
                  <div className="text-xs text-gray-600">Periode peminjaman rata-rata</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Tab Layout */}
        <div className="hidden sm:block">
          <Tabs defaultValue="overview" className="space-y-6 sm:space-y-8">
            <TabsList className="border border-black inline-flex bg-transparent p-0 gap-0 overflow-x-auto flex w-full">
              <TabsTrigger value="overview" className="px-6 py-3 border-r border-black hover:bg-gray-100 transition-none rounded-none data-[state=active]:bg-black data-[state=active]:text-white text-base">RINGKASAN</TabsTrigger>
              <TabsTrigger value="borrowers" className="px-6 py-3 border-r border-black hover:bg-gray-100 transition-none rounded-none data-[state=active]:bg-black data-[state=active]:text-white text-base">PEMINJAM TERAKTIF</TabsTrigger>
              <TabsTrigger value="equipment" className="px-6 py-3 border-r border-black hover:bg-gray-100 transition-none rounded-none data-[state=active]:bg-black data-[state=active]:text-white text-base">PERALATAN POPULER</TabsTrigger>
              <TabsTrigger value="trends" className="px-6 py-3 hover:bg-gray-100 transition-none rounded-none data-[state=active]:bg-black data-[state=active]:text-white text-base">TREN</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="border border-black p-6">
                <DashboardCharts />
              </div>
            </TabsContent>

            <TabsContent value="borrowers">
              <div className="border border-black p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-2">PEMINJAM TERAKTIF</h2>
                  <p className="text-sm text-gray-600">Pengguna paling aktif dalam periode yang dipilih</p>
                </div>
                <div className="space-y-4">
                  {topBorrowers.map((borrower, index) => (
                    <div key={borrower.email} className="flex items-center justify-between p-4 border border-black hover:bg-gray-50">
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 border border-black flex-shrink-0">
                          <span className="text-sm font-bold">#{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-base truncate">{borrower.user_name}</p>
                          <p className="text-sm text-gray-600 truncate">{borrower.email}</p>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-2xl font-black">{borrower.borrow_count}</p>
                        <p className="text-sm text-gray-600">peminjaman</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="equipment">
              <div className="border border-black p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-2">PERALATAN POPULER</h2>
                  <p className="text-sm text-gray-600">Peralatan yang paling sering dipinjam dalam periode yang dipilih</p>
                </div>
                <div className="space-y-4">
                  {popularEquipment.map((item, index) => (
                    <div key={item.equipment_name} className="flex items-center justify-between p-4 border border-black hover:bg-gray-50">
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 border border-black flex-shrink-0">
                          <span className="text-sm font-bold">#{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-base truncate">{item.equipment_name}</p>
                          <p className="text-sm text-gray-600 truncate">{item.category}</p>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-2xl font-black">{item.borrow_count}</p>
                        <p className="text-sm text-gray-600">kali dipinjam</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trends">
              <div className="space-y-8">
                <div className="border border-black p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold mb-2">POLA PENGGUNAAN</h2>
                    <p className="text-sm text-gray-600">Pola penggunaan peralatan dari waktu ke waktu</p>
                  </div>
                  <div className="text-center py-12 px-4">
                    <Activity className="mx-auto w-16 h-16 mb-4" />
                    <h3 className="font-bold text-lg mb-2">ANALISIS TREN</h3>
                    <p className="text-sm text-gray-600">
                      Fitur analisis tren tingkat lanjutan akan segera hadir.
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 lg:gap-8 grid-cols-3">
                  <div className="border border-black p-6">
                    <div className="text-sm font-medium mb-4">WAKTU PENGGUNAAN PIK</div>
                    <div className="text-3xl font-black mb-2">14.00-16.00</div>
                    <div className="text-sm text-gray-600">Jam paling aktif</div>
                  </div>

                  <div className="border border-black p-6">
                    <div className="text-sm font-medium mb-4">HARI TERAKTIF</div>
                    <div className="text-3xl font-black mb-2">SELASA</div>
                    <div className="text-sm text-gray-600">Aktivitas tertinggi</div>
                  </div>

                  <div className="border border-black p-6">
                    <div className="text-sm font-medium mb-4">RATA-RATA DURASI PINJAM</div>
                    <div className="text-3xl font-black mb-2">5,2 HARI</div>
                    <div className="text-sm text-gray-600">Periode peminjaman rata-rata</div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}