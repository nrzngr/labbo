'use client'

import { useState, useEffect } from 'react'
import { useCustomAuth } from "@/components/auth/custom-auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ModernCard, ModernCardHeader } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernBadge } from '@/components/ui/modern-badge'
import { Settings, Database, Users, Shield, Save, CheckCircle, AlertTriangle } from 'lucide-react'

interface SystemSettings {
  site_name: string
  site_description: string
  max_borrow_days: number
  email_notifications: boolean
  maintenance_reminder_days: number
}

export default function SettingsPage() {
  const { user } = useCustomAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [settings, setSettings] = useState<SystemSettings>({
    site_name: 'Lab Inventory System',
    site_description: 'Laboratory Equipment Management System',
    max_borrow_days: 7,
    email_notifications: true,
    maintenance_reminder_days: 30
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      // For now, use default settings
      // In a real app, you'd fetch these from a settings table
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    setMessage(null)

    try {
      // Simulate saving settings
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan' })
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Please log in to continue...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 page-gradient min-h-screen">
          <ModernCard variant="default" className="text-center py-16">
            <div className="p-4 bg-red-100 rounded-full w-20 h-20 mx-auto mb-6">
              <Shield className="w-12 h-12 text-red-600 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-red-800 mb-2">Access Denied</h3>
            <p className="text-red-600 font-medium mb-6">
              You don&apos;t have permission to access settings.
            </p>
            <ModernBadge variant="destructive" size="sm">Admin Only</ModernBadge>
          </ModernCard>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 page-gradient min-h-screen">
          <div className="flex items-center justify-center min-h-screen">
            <ModernCard variant="default" className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
              <div className="text-lg font-medium">Loading settings...</div>
            </ModernCard>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 page-gradient min-h-screen">
        {/* Enhanced Page Header */}
        <ModernCard variant="elevated" padding="lg" className="mb-6 sm:mb-8 fade-in">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-gray-600 rounded-xl">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 mb-1 sm:mb-2">
                PENGATURAN
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Kelola konfigurasi dan preferensi sistem
              </p>
            </div>
          </div>
        </ModernCard>

        {/* Success/Error Message */}
        {message && (
          <ModernCard variant="default" className={`mb-8 border-l-4 ${message.type === 'success' ? 'border-l-green-600 bg-green-50' : 'border-l-red-600 bg-red-50'} slide-up`}>
            <div className="flex items-start gap-4">
              <div className={`p-2 ${message.type === 'success' ? 'bg-green-100' : 'bg-red-100'} rounded-xl`}>
                {message.type === 'success' ? (
                  <CheckCircle className={`w-6 h-6 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                  {message.text}
                </p>
              </div>
            </div>
          </ModernCard>
        )}

        {/* Improved Tabs with better spacing */}
        <div className="mb-8 sm:mb-12">
          <Tabs defaultValue="general" className="space-y-8 sm:space-y-12">
            <TabsList className="border border-black bg-white inline-flex p-1 gap-1 overflow-x-auto w-full h-auto rounded-lg shadow-sm">
              <TabsTrigger value="general" className="px-4 sm:px-8 py-3 sm:py-4 border-r border-gray-200 hover:bg-gray-50 transition-all rounded-md data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-md text-sm sm:text-base font-medium">Umum</TabsTrigger>
              <TabsTrigger value="borrowing" className="px-4 sm:px-8 py-3 sm:py-4 border-r border-gray-200 hover:bg-gray-50 transition-all rounded-md data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-md text-sm sm:text-base font-medium">Peminjaman</TabsTrigger>
              <TabsTrigger value="notifications" className="px-4 sm:px-8 py-3 sm:py-4 border-r border-gray-200 hover:bg-gray-50 transition-all rounded-md data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-md text-sm sm:text-base font-medium">Notifikasi</TabsTrigger>
              <TabsTrigger value="system" className="px-4 sm:px-8 py-3 sm:py-4 hover:bg-gray-50 transition-all rounded-md data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-md text-sm sm:text-base font-medium">Sistem</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-8 sm:space-y-10">
              <ModernCard variant="elevated" padding="xl" className="sm:p-8">
                <div className="mb-8 sm:mb-10">
                  <div className="flex items-center gap-4 sm:gap-6 mb-6">
                    <div className="p-3 sm:p-4 bg-blue-100 rounded-xl">
                      <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900">Pengaturan Umum</h2>
                      <p className="text-sm sm:text-base text-gray-600 font-medium">Konfigurasi informasi dasar sistem</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6 sm:space-y-8">
                  <div className="space-y-3 sm:space-y-4">
                    <Label htmlFor="site_name" className="text-sm sm:text-base font-bold text-gray-700 uppercase tracking-wider">Nama Situs</Label>
                    <Input
                      id="site_name"
                      value={settings.site_name}
                      onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                      className="border-black focus:ring-black h-12 sm:h-14 text-sm sm:text-base px-4 sm:px-5"
                      placeholder="Masukkan nama situs"
                    />
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <Label htmlFor="site_description" className="text-sm sm:text-base font-bold text-gray-700 uppercase tracking-wider">Deskripsi Situs</Label>
                    <Textarea
                      id="site_description"
                      value={settings.site_description}
                      onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                      rows={4}
                      className="border-black focus:ring-black text-sm sm:text-base resize-none px-4 sm:px-5 py-3 sm:py-4"
                      placeholder="Masukkan deskripsi situs"
                    />
                  </div>
                </div>
              </ModernCard>
            </TabsContent>

            <TabsContent value="borrowing" className="space-y-8 sm:space-y-10">
              <ModernCard variant="elevated" padding="xl" className="sm:p-8">
                <div className="mb-8 sm:mb-10">
                  <div className="flex items-center gap-4 sm:gap-6 mb-6">
                    <div className="p-3 sm:p-4 bg-purple-100 rounded-xl">
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900">Pengaturan Peminjaman</h2>
                      <p className="text-sm sm:text-base text-gray-600 font-medium">Konfigurasi kebijakan dan batasan peminjaman</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6 sm:space-y-8">
                  <div className="space-y-3 sm:space-y-4">
                    <Label htmlFor="max_borrow_days" className="text-sm sm:text-base font-bold text-gray-700 uppercase tracking-wider">Maksimum Hari Peminjaman</Label>
                    <Input
                      id="max_borrow_days"
                      type="number"
                      min="1"
                      max="365"
                      value={settings.max_borrow_days}
                      onChange={(e) => setSettings({ ...settings, max_borrow_days: parseInt(e.target.value) })}
                      className="border-black focus:ring-black h-12 sm:h-14 text-sm sm:text-base px-4 sm:px-5"
                      placeholder="Masukkan jumlah hari maksimum"
                    />
                    <p className="text-sm sm:text-base text-gray-600 font-medium bg-gray-50 p-3 sm:p-4 rounded-lg">
                      Jumlah maksimum hari pengguna dapat meminjam peralatan
                    </p>
                  </div>
                </div>
              </ModernCard>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-8 sm:space-y-10">
              <ModernCard variant="elevated" padding="xl" className="sm:p-8">
                <div className="mb-8 sm:mb-10">
                  <div className="flex items-center gap-4 sm:gap-6 mb-6">
                    <div className="p-3 sm:p-4 bg-green-100 rounded-xl">
                      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900">Pengaturan Notifikasi</h2>
                      <p className="text-sm sm:text-base text-gray-600 font-medium">Konfigurasi notifikasi dan pengingat sistem</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6 sm:space-y-8">
                  <ModernCard variant="outline" className="p-6 sm:p-8 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <CheckCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <Label className="text-base sm:text-lg font-semibold text-gray-900">Notifikasi Email</Label>
                          <p className="text-sm sm:text-base text-gray-600 font-medium mt-1">Kirim notifikasi email untuk berbagai peristiwa</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.email_notifications}
                          onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-7 sm:w-14 sm:h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 sm:after:h-6 sm:after:w-6 after:transition-all peer-checked:bg-black shadow-sm"></div>
                      </label>
                    </div>
                  </ModernCard>
                </div>
              </ModernCard>
            </TabsContent>

            <TabsContent value="system" className="space-y-8 sm:space-y-10">
              <ModernCard variant="elevated" padding="xl" className="sm:p-8">
                <div className="mb-8 sm:mb-10">
                  <div className="flex items-center gap-4 sm:gap-6 mb-6">
                    <div className="p-3 sm:p-4 bg-orange-100 rounded-xl">
                      <Database className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900">Informasi Sistem</h2>
                      <p className="text-sm sm:text-base text-gray-600 font-medium">Lihat status dan informasi sistem</p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  <ModernCard variant="outline" className="p-6 sm:p-8 text-center bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-shadow">
                    <div className="p-3 sm:p-4 bg-blue-200 rounded-xl w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6">
                      <Database className="w-7 h-7 sm:w-8 sm:h-8 text-blue-700 mx-auto" />
                    </div>
                    <div className="text-sm sm:text-base font-bold text-gray-700 uppercase tracking-wider mb-3 sm:mb-4">Lingkungan</div>
                    <ModernBadge variant="default" size="sm" className="text-xs sm:text-sm font-medium">Pengembangan</ModernBadge>
                  </ModernCard>
                  <ModernCard variant="outline" className="p-6 sm:p-8 text-center bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-shadow">
                    <div className="p-3 sm:p-4 bg-green-200 rounded-xl w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6">
                      <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-700 mx-auto" />
                    </div>
                    <div className="text-sm sm:text-base font-bold text-gray-700 uppercase tracking-wider mb-3 sm:mb-4">Versi</div>
                    <ModernBadge variant="success" size="sm" className="text-xs sm:text-sm font-medium">v1.0.0</ModernBadge>
                  </ModernCard>
                  <ModernCard variant="outline" className="p-6 sm:p-8 text-center bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-shadow">
                    <div className="p-3 sm:p-4 bg-purple-200 rounded-xl w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6">
                      <Settings className="w-7 h-7 sm:w-8 sm:h-8 text-purple-700 mx-auto" />
                    </div>
                    <div className="text-sm sm:text-base font-bold text-gray-700 uppercase tracking-wider mb-3 sm:mb-4">Status</div>
                    <ModernBadge variant="success" size="sm" className="text-xs sm:text-sm font-medium">Operasional</ModernBadge>
                  </ModernCard>
                </div>
              </ModernCard>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-8 sm:mt-12 sm:mt-16 flex justify-end">
          <ModernButton
            variant="default"
            size="lg"
            leftIcon={<Save className="w-4 h-4" />}
            onClick={handleSaveSettings}
            disabled={saving}
            className="button-hover-lift px-6 sm:px-8 w-full sm:w-auto"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </ModernButton>
        </div>
      </div>
    </DashboardLayout>
  )
}