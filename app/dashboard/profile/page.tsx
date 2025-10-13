'use client'

import { useState, useEffect } from 'react'
import { useCustomAuth } from "@/components/auth/custom-auth-provider"
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Building, Calendar, Edit2, Save, X, BookOpen, Award } from "lucide-react"
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ModernCard, ModernCardHeader, ModernCardContent } from '@/components/ui/modern-card'
import { ModernBadge } from '@/components/ui/modern-badge'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernInput } from '@/components/ui/modern-input'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface UserProfile {
  id: string
  full_name: string
  email: string
  department: string
  role: string
  phone?: string
  nim?: string
  nip?: string
  student_level?: string
  lecturer_rank?: string
  created_at: string
}

export default function ProfilePage() {
  const { user } = useCustomAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const queryClient = useQueryClient()

  useEffect(() => {
    if (user) {
      setEditedProfile({
        full_name: user.full_name,
        phone: user.phone || '',
        department: user.department,
        student_level: user.student_level || '',
        lecturer_rank: user.lecturer_rank || ''
      })
    }
  }, [user])

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user) throw new Error('User not authenticated')

      await new Promise(resolve => setTimeout(resolve, 1000))
      return { ...user, ...updates }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      setIsEditing(false)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    },
    onError: (error) => {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
      setTimeout(() => setMessage(null), 3000)
    }
  })

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Please log in to continue...</div>
        </div>
      </DashboardLayout>
    )
  }

  const handleSave = () => {
    updateProfileMutation.mutate(editedProfile)
  }

  const handleCancel = () => {
    setEditedProfile({
      full_name: user.full_name,
      phone: user.phone || '',
      department: user.department,
      student_level: user.student_level || '',
      lecturer_rank: user.lecturer_rank || ''
    })
    setIsEditing(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "destructive"> = {
      admin: 'destructive',
      lab_staff: 'warning',
      lecturer: 'default',
      student: 'success'
    }

    const roleLabels: Record<string, string> = {
      admin: 'Administrator',
      lab_staff: 'Lab Staff',
      lecturer: 'Lecturer',
      student: 'Student'
    }

    return <ModernBadge variant={variants[role] || 'default'} size="sm">{roleLabels[role] || role}</ModernBadge>
  }

  const getStudentLevelBadge = (level?: string) => {
    if (!level) return null

    const variants: Record<string, "default" | "success" | "warning" | "destructive"> = {
      freshman: 'success',
      sophomore: 'default',
      junior: 'warning',
      senior: 'destructive'
    }

    const levelLabels: Record<string, string> = {
      freshman: 'Freshman',
      sophomore: 'Sophomore',
      junior: 'Junior',
      senior: 'Senior'
    }

    return <ModernBadge variant={variants[level] || 'default'} size="sm">{levelLabels[level] || level}</ModernBadge>
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 page-gradient min-h-screen">
        {/* Header */}
        <ModernCard variant="elevated" padding="lg" className="mb-6 sm:mb-8 fade-in">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-blue-600 rounded-xl">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 mb-1 sm:mb-2">
                  My Profile
                </h1>
                <p className="text-sm sm:text-base text-gray-600 font-medium">
                  Manage your personal information and preferences
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <ModernButton
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit2 className="w-4 h-4" />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </ModernButton>
              ) : (
                <>
                  <ModernButton
                    variant="outline"
                    size="sm"
                    leftIcon={<X className="w-4 h-4" />}
                    onClick={handleCancel}
                    disabled={updateProfileMutation.isPending}
                  >
                    Cancel
                  </ModernButton>
                  <ModernButton
                    variant="default"
                    size="sm"
                    leftIcon={<Save className="w-4 h-4" />}
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                    loading={updateProfileMutation.isPending}
                  >
                    Save
                  </ModernButton>
                </>
              )}
            </div>
          </div>
        </ModernCard>

        {/* Success/Error Message */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'}`}>
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-3">
          {/* Main Profile Information */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Basic Information */}
            <ModernCard variant="default" padding="lg">
              <ModernCardHeader
                title="Basic Information"
                description="Your personal details and contact information"
              />
              <ModernCardContent>
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Full Name
                      </label>
                      {isEditing ? (
                        <ModernInput
                          value={editedProfile.full_name || ''}
                          onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <div className="text-base sm:text-lg font-medium">{user.full_name}</div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Email Address
                      </label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div className="text-base sm:text-lg font-medium">{user.email}</div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Phone Number
                      </label>
                      {isEditing ? (
                        <ModernInput
                          value={editedProfile.phone || ''}
                          onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                          placeholder="Enter your phone number"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <div className="text-base sm:text-lg font-medium">
                            {user.phone || 'Not provided'}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Department
                      </label>
                      {isEditing ? (
                        <ModernInput
                          value={editedProfile.department || ''}
                          onChange={(e) => setEditedProfile({ ...editedProfile, department: e.target.value })}
                          placeholder="Enter your department"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <div className="text-base sm:text-lg font-medium">{user.department}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Role-specific fields */}
                  {user.role === 'student' && (
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Student ID (NIM)
                        </label>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          <div className="text-base sm:text-lg font-medium font-mono">{user.nim}</div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Academic Level
                        </label>
                        {isEditing ? (
                          <select
                            value={editedProfile.student_level || ''}
                            onChange={(e) => setEditedProfile({ ...editedProfile, student_level: e.target.value })}
                            className="w-full px-4 py-3 border border-black focus:ring-0 focus:border-black text-sm bg-white"
                          >
                            <option value="">Select level</option>
                            <option value="freshman">Freshman</option>
                            <option value="sophomore">Sophomore</option>
                            <option value="junior">Junior</option>
                            <option value="senior">Senior</option>
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                            {user.student_level ? getStudentLevelBadge(user.student_level) : (
                              <span className="text-gray-500">Not specified</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {user.role === 'lecturer' && (
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Staff ID (NIP)
                        </label>
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-gray-400" />
                          <div className="text-base sm:text-lg font-medium font-mono">{user.nip}</div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Academic Rank
                        </label>
                        {isEditing ? (
                          <select
                            value={editedProfile.lecturer_rank || ''}
                            onChange={(e) => setEditedProfile({ ...editedProfile, lecturer_rank: e.target.value })}
                            className="w-full px-4 py-3 border border-black focus:ring-0 focus:border-black text-sm bg-white"
                          >
                            <option value="">Select rank</option>
                            <option value="assistant">Assistant Lecturer</option>
                            <option value="associate">Associate Professor</option>
                            <option value="professor">Professor</option>
                          </select>
                        ) : (
                          <div className="text-base sm:text-lg font-medium">
                            {user.lecturer_rank || 'Not specified'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ModernCardContent>
            </ModernCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 sm:space-y-8">
            {/* Role and Status */}
            <ModernCard variant="default" padding="lg">
              <ModernCardHeader
                title="Role & Status"
                description="Your account information"
              />
              <ModernCardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Account Role
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(user.role)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Member Since
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Not available</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Account Status
                    </div>
                    <ModernBadge variant="success" size="sm">Active</ModernBadge>
                  </div>
                </div>
              </ModernCardContent>
            </ModernCard>

            {/* Quick Stats */}
            {user.role === 'student' && (
              <ModernCard variant="default" padding="lg">
                <ModernCardHeader
                  title="Borrowing Statistics"
                  description="Your equipment borrowing activity"
                />
                <ModernCardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Borrowings</span>
                      <span className="font-bold">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Borrowings</span>
                      <span className="font-bold">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Overdue Items</span>
                      <span className="font-bold text-red-600">0</span>
                    </div>
                  </div>
                </ModernCardContent>
              </ModernCard>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}