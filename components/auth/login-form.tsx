'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { useAuth } from './auth-provider'
import { loginSchema, registerSchema, RegisterFormValues } from '@/lib/validations'
import { Beaker } from 'lucide-react'

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  initialMessage?: string | null
}

export function LoginForm({ initialMessage }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const { } = useAuth()

  // Set initial message from URL params if provided
  useEffect(() => {
    if (initialMessage) {
      setError(initialMessage)
    }
  }, [initialMessage])

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  })

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  })

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (error) {
        setError(error.message)
        return
      }

      router.push('/dashboard')
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {

      // Validate required fields based on role
      if (data.role === 'student' && !data.nim) {
        setError('Student ID is required for students')
        return
      }
      if (data.role === 'lecturer' && !data.nip) {
        setError('Lecturer ID is required for lecturers')
        return
      }

      // Create auth user with complete metadata for the trigger
      const { error: authError, data: authData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: data.role,
            department: data.department,
            nim: data.nim || null,
            nip: data.nip || null
          }
        }
      })

      if (authError) {

        // Provide more specific error messages
        if (authError.message.includes('500')) {
          setError('Server error during signup. This is likely a database issue. Please contact support or try again later.')
        } else if (authError.message.includes('already registered')) {
          setError('An account with this email already exists.')
        } else if (authError.message.includes('weak password')) {
          setError('Password is too weak. Please choose a stronger password.')
        } else {
          setError(`Signup failed: ${authError.message}`)
        }
        return
      }


      if (authData.user) {
        // Wait a moment for the database trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Check if profile was created automatically by the trigger
        const { data: profile, error: profileCheckError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        }

        if (profile) {
          setSuccess('Account created successfully! You can now log in.')
          setActiveTab('login')
          registerForm.reset()
        } else {

          // Try to create the profile manually as a fallback
          const { error: manualProfileError } = await supabase
            .from('user_profiles')
            .insert({
              id: authData.user.id,
              full_name: data.fullName,
              email: data.email,
              role: data.role,
              nim: data.nim || null,
              nip: data.nip || null,
              department: data.department
            })

          if (manualProfileError) {
            setError(`Account created but profile setup failed: ${manualProfileError.message}. Please contact support.`)
          } else {
            setSuccess('Account created successfully! You can now log in.')
            setActiveTab('login')
            registerForm.reset()
          }
        }
      } else {
        setError('Failed to create user account. Please try again.')
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('500')) {
        setError('Server error during registration. This is likely a database configuration issue. Please contact support.')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-md px-4">
        <div className="border border-black p-8">
          <div className="text-center space-y-6 mb-8">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center border border-black">
                <Beaker className="h-8 w-8" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black">LAB INVENTORY SYSTEM</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage your laboratory equipment with ease</p>
            </div>
          </div>

          {error && (
            <div className="border border-red-600 bg-red-50 p-4 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="border border-green-600 bg-green-50 p-4 mb-6">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="border border-black inline-flex bg-transparent p-0 gap-0 w-full mb-6">
              <TabsTrigger value="login" className="px-6 py-3 border-r border-black hover:bg-gray-100 transition-none rounded-none data-[state=active]:bg-black data-[state=active]:text-white">
                LOGIN
              </TabsTrigger>
              <TabsTrigger value="register" className="px-6 py-3 hover:bg-gray-100 transition-none rounded-none data-[state=active]:bg-black data-[state=active]:text-white">
                REGISTER
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">EMAIL</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="h-12"
                    {...loginForm.register('email')}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">PASSWORD</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="h-12"
                    {...loginForm.register('password')}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full border border-black px-4 py-3 hover:bg-black hover:text-white transition-none text-sm font-medium h-12"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></div>
                      <span>SIGNING IN...</span>
                    </div>
                  ) : (
                    'SIGN IN'
                  )}
                </button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">FULL NAME</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    className="h-12"
                    {...registerForm.register('fullName')}
                  />
                  {registerForm.formState.errors.fullName && (
                    <p className="text-sm text-red-600">{registerForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">EMAIL</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="h-12"
                    {...registerForm.register('email')}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-red-600">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">PASSWORD</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="h-12"
                    {...registerForm.register('password')}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-red-600">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium">ROLE</Label>
                  <select
                    id="role"
                    className="w-full px-3 py-3 border border-black bg-white focus:ring-0 focus:border-black outline-none transition-none h-12"
                    {...registerForm.register('role')}
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                  </select>
                  {registerForm.formState.errors.role && (
                    <p className="text-sm text-red-600">{registerForm.formState.errors.role.message}</p>
                  )}
                </div>

                {registerForm.watch('role') === 'student' && (
                  <div className="space-y-2">
                    <Label htmlFor="nim" className="text-sm font-medium">STUDENT ID (NIM)</Label>
                    <Input
                      id="nim"
                      placeholder="Enter your student ID"
                      className="h-12"
                      {...registerForm.register('nim')}
                    />
                    {registerForm.formState.errors.nim && (
                      <p className="text-sm text-red-600">{registerForm.formState.errors.nim.message}</p>
                    )}
                  </div>
                )}

                {registerForm.watch('role') === 'lecturer' && (
                  <div className="space-y-2">
                    <Label htmlFor="nip" className="text-sm font-medium">LECTURER ID (NIP)</Label>
                    <Input
                      id="nip"
                      placeholder="Enter your lecturer ID"
                      className="h-12"
                      {...registerForm.register('nip')}
                    />
                    {registerForm.formState.errors.nip && (
                      <p className="text-sm text-red-600">{registerForm.formState.errors.nip.message}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium">DEPARTMENT</Label>
                  <Input
                    id="department"
                    placeholder="Enter your department"
                    className="h-12"
                    {...registerForm.register('department')}
                  />
                  {registerForm.formState.errors.department && (
                    <p className="text-sm text-red-600">{registerForm.formState.errors.department.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full border border-black px-4 py-3 hover:bg-black hover:text-white transition-none text-sm font-medium h-12"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></div>
                      <span>CREATING ACCOUNT...</span>
                    </div>
                  ) : (
                    'CREATE ACCOUNT'
                  )}
                </button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}