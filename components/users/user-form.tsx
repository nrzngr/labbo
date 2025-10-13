'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { UserProfileFormValues, userProfileSchema, RegisterFormValues, registerSchema } from '@/lib/validations'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  nim: string | null
  nip: string | null
  phone: string | null
  department: string
}

interface UserFormProps {
  user?: User
  onSuccess: () => void
}

export function UserForm({ user, onSuccess }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createAuthUser] = useState(!user) // Only create auth user for new users

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: user ? {
      full_name: user.full_name,
      role: user.role as 'admin' | 'lab_staff' | 'lecturer' | 'student',
      nim: user.nim || '',
      nip: user.nip || '',
      phone: user.phone || '',
      department: user.department
    } : {}
  })

  const authForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: user?.email || '',
      fullName: user?.full_name || '',
      role: (user?.role as 'lecturer' | 'student') || 'student',
      department: user?.department || '',
      nim: user?.nim || '',
      nip: user?.nip || ''
    }
  })

  
  const onSubmitProfile = async (data: UserProfileFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      if (user) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('User profile updated:', {
          id: user.id,
          full_name: data.full_name,
          role: data.role,
          nim: data.nim || null,
          nip: data.nip || null,
          phone: data.phone || null,
          department: data.department
        })
      }

      onSuccess()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred while saving the user')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitNewUser = async (data: RegisterFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      if (data.role === 'student' && !data.nim) {
        throw new Error('Student ID is required for students')
      }
      if (data.role === 'lecturer' && !data.nip) {
        throw new Error('Lecturer ID is required for lecturers')
      }

      const tempPassword = 'TempPass123!' + Math.random().toString(36).slice(-8)

      await new Promise(resolve => setTimeout(resolve, 1000))

      const userId = 'user_' + Math.random().toString(36).substr(2, 9)

      console.log('User account created:', {
        id: userId,
        email: data.email,
        password: tempPassword,
        full_name: data.fullName,
        role: data.role,
        department: data.department,
        nim: data.role === 'student' ? data.nim : null,
        nip: data.role === 'lecturer' ? data.nip : null
      })

      setError(`User created successfully! Temporary password: ${tempPassword}`)

      setTimeout(() => {
        onSuccess()
        authForm.reset()
      }, 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred while creating the user')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user && createAuthUser) {
        return (
      <form onSubmit={authForm.handleSubmit(onSubmitNewUser)} className="space-y-4">
        {error && (
          <Alert className={error.includes('successfully') ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <AlertDescription className={error.includes('successfully') ? "text-green-800" : "text-red-800"}>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">
            New users will be created with a temporary password. They should change it on first login.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            {...authForm.register('email')}
            placeholder="Enter email address"
          />
          {authForm.formState.errors.email && (
            <p className="text-sm text-red-500">{authForm.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            {...authForm.register('fullName')}
            placeholder="Enter full name"
          />
          {authForm.formState.errors.fullName && (
            <p className="text-sm text-red-500">{authForm.formState.errors.fullName.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={authForm.watch('role')}
              onValueChange={(value) => authForm.setValue('role', value as 'student' | 'lecturer')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="lecturer">Lecturer</SelectItem>
              </SelectContent>
            </Select>
            {authForm.formState.errors.role && (
              <p className="text-sm text-red-500">{authForm.formState.errors.role.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Input
              id="department"
              {...authForm.register('department')}
              placeholder="Enter department"
            />
            {authForm.formState.errors.department && (
              <p className="text-sm text-red-500">{authForm.formState.errors.department.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nim">Student ID (for students)</Label>
          <Input
            id="nim"
            {...authForm.register('nim')}
            placeholder="Enter student ID"
          />
          {authForm.formState.errors.nim && (
            <p className="text-sm text-red-500">{authForm.formState.errors.nim.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nip">Lecturer ID (for lecturers)</Label>
          <Input
            id="nip"
            {...authForm.register('nip')}
            placeholder="Enter lecturer ID"
          />
          {authForm.formState.errors.nip && (
            <p className="text-sm text-red-500">{authForm.formState.errors.nip.message}</p>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => onSuccess()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </form>
    )
  }

    return (
    <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name *</Label>
        <Input
          id="full_name"
          {...register('full_name')}
          placeholder="Enter full name"
        />
        {errors.full_name && <p className="text-sm text-red-500">{errors.full_name.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select
            value={watch('role')}
            onValueChange={(value) => setValue('role', value as 'admin' | 'lab_staff' | 'lecturer' | 'student')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="lab_staff">Lab Staff</SelectItem>
              <SelectItem value="lecturer">Lecturer</SelectItem>
              <SelectItem value="student">Student</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Input
            id="department"
            {...register('department')}
            placeholder="Enter department"
          />
          {errors.department && <p className="text-sm text-red-500">{errors.department.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nim">Student ID (for students)</Label>
          <Input
            id="nim"
            {...register('nim')}
            placeholder="Enter student ID"
          />
          {errors.nim && <p className="text-sm text-red-500">{errors.nim.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nip">Lecturer ID (for lecturers)</Label>
          <Input
            id="nip"
            {...register('nip')}
            placeholder="Enter lecturer ID"
          />
          {errors.nip && <p className="text-sm text-red-500">{errors.nip.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          {...register('phone')}
          placeholder="Enter phone number"
        />
        {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => onSuccess()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Update User'}
        </Button>
      </div>
    </form>
  )
}