'use client'

import { useState, useEffect, useCallback } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Activity, TrendingUp, Users, Package, AlertCircle } from 'lucide-react'

interface RealtimeStats {
  totalUsers: number
  totalEquipment: number
  activeTransactions: number
  availableEquipment: number
  newUsersToday: number
  newTransactionsToday: number
  equipmentUtilization: number
  lastUpdated: string
}

interface ActivityEvent {
  id: string
  type: 'transaction' | 'equipment' | 'user' | 'maintenance'
  action: string
  description: string
  timestamp: string
  user?: string
}

export function RealtimeAnalytics() {
  const [stats, setStats] = useState<RealtimeStats>({
    totalUsers: 0,
    totalEquipment: 0,
    activeTransactions: 0,
    availableEquipment: 0,
    newUsersToday: 0,
    newTransactionsToday: 0,
    equipmentUtilization: 0,
    lastUpdated: new Date().toISOString(),
  })

  const [recentActivities, setRecentActivities] = useState<ActivityEvent[]>([])
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const { data: initialStats, refetch: refetchStats } = useQuery({
    queryKey: ['realtime-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]

      const [
        usersResult,
        equipmentResult,
        transactionsResult,
        newUsersResult,
        newTransactionsResult,
      ] = await Promise.allSettled([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('equipment').select('id', { count: 'exact', head: true }),
        supabase.from('borrowing_transactions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('borrowing_transactions').select('id', { count: 'exact', head: true }).gte('created_at', today),
      ])

      const totalUsers = usersResult.status === 'fulfilled' ? usersResult.value.count || 0 : 0
      const totalEquipment = equipmentResult.status === 'fulfilled' ? equipmentResult.value.count || 0 : 0
      const activeTransactions = transactionsResult.status === 'fulfilled' ? transactionsResult.value.count || 0 : 0
      const newUsersToday = newUsersResult.status === 'fulfilled' ? newUsersResult.value.count || 0 : 0
      const newTransactionsToday = newTransactionsResult.status === 'fulfilled' ? newTransactionsResult.value.count || 0 : 0

      // Get available equipment count
      const { count: availableCount } = await supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available')

      const availableEquipment = availableCount || 0
      const equipmentUtilization = totalEquipment > 0 ? Math.round(((totalEquipment - availableEquipment) / totalEquipment) * 100) : 0

      return {
        totalUsers,
        totalEquipment,
        activeTransactions,
        availableEquipment,
        newUsersToday,
        newTransactionsToday,
        equipmentUtilization,
        lastUpdated: new Date().toISOString(),
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  })

  useEffect(() => {
    const setupRealtimeSubscriptions = async () => {
      try {
        const equipmentChannel = supabase
          .channel('equipment-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'equipment',
            },
            (payload) => {
              console.log('Equipment change:', payload)
              addActivityEvent({
                id: `eq-${Date.now()}`,
                type: 'equipment',
                action: payload.eventType,
                description: `Equipment ${payload.eventType}: ${(payload.new as any)?.name || (payload.old as any)?.name || 'Unknown'}`,
                timestamp: new Date().toISOString(),
              })
              refetchStats()
            }
          )
          .subscribe()

        const transactionChannel = supabase
          .channel('transaction-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'borrowing_transactions',
            },
            (payload) => {
              console.log('Transaction change:', payload)
              addActivityEvent({
                id: `tx-${Date.now()}`,
                type: 'transaction',
                action: payload.eventType,
                description: `Transaction ${payload.eventType}: ${payload.eventType === 'INSERT' ? 'New borrowing' : payload.eventType === 'UPDATE' ? 'Status updated' : 'Transaction removed'}`,
                timestamp: new Date().toISOString(),
              })
              refetchStats()
            }
          )
          .subscribe()

        const userChannel = supabase
          .channel('user-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'users',
            },
            (payload) => {
              console.log('User change:', payload)
              addActivityEvent({
                id: `user-${Date.now()}`,
                type: 'user',
                action: payload.eventType,
                description: `User ${payload.eventType}: ${(payload.new as any)?.full_name || (payload.old as any)?.full_name || 'Unknown'}`,
                timestamp: new Date().toISOString(),
              })
              refetchStats()
            }
          )
          .subscribe()

        setChannel(equipmentChannel)
        setIsRealtimeConnected(true)

        return () => {
          equipmentChannel.unsubscribe()
          transactionChannel.unsubscribe()
          userChannel.unsubscribe()
        }
      } catch (error) {
        console.error('Error setting up realtime subscriptions:', error)
        setIsRealtimeConnected(false)
      }
    }

    const cleanup = setupRealtimeSubscriptions()

    return () => {
      cleanup.then(unsubscribe => unsubscribe?.())
    }
  }, [])

  useEffect(() => {
    if (initialStats) {
      setStats(prev => ({
        ...prev,
        ...initialStats,
      }))
    }
  }, [initialStats])

  const addActivityEvent = useCallback((event: ActivityEvent) => {
    setRecentActivities(prev => [event, ...prev.slice(0, 9)]) // Keep only last 10 events
  }, [])

  const handleRefresh = useCallback(() => {
    refetchStats()
    addActivityEvent({
      id: `refresh-${Date.now()}`,
      type: 'transaction',
      action: 'refresh',
      description: 'Analytics data refreshed',
      timestamp: new Date().toISOString(),
    })
  }, [refetchStats, addActivityEvent])

  const getConnectionStatus = () => {
    if (isRealtimeConnected) {
      return { color: 'bg-green-500', text: 'Connected', icon: Activity }
    } else {
      return { color: 'bg-red-500', text: 'Disconnected', icon: AlertCircle }
    }
  }

  const connectionStatus = getConnectionStatus()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Real-time Analytics</h3>
            <p className="text-sm text-gray-600">Live system monitoring and activity tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connectionStatus.color}`} />
            <span className="text-sm text-gray-600">{connectionStatus.text}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-xs text-green-600">+{stats.newUsersToday} today</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-xl">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Equipment</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEquipment}</p>
                <p className="text-xs text-gray-600">{stats.availableEquipment} available</p>
              </div>
              <div className="p-2 bg-green-100 rounded-xl">
                <Package className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Loans</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeTransactions}</p>
                <p className="text-xs text-orange-600">+{stats.newTransactionsToday} today</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-xl">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utilization</p>
                <p className="text-2xl font-bold text-gray-900">{stats.equipmentUtilization}%</p>
                <p className="text-xs text-gray-600">Equipment in use</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-xl">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Live system events and updates</CardDescription>
            </div>
            {isRealtimeConnected && (
              <Badge variant="outline" className="text-green-600">
                Live
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-3 pb-3 ${
                    index < recentActivities.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'transaction' ? 'bg-blue-500' :
                    activity.type === 'equipment' ? 'bg-green-500' :
                    activity.type === 'user' ? 'bg-purple-500' :
                    'bg-orange-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Activity className="mx-auto w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-xs text-gray-500">
        Last updated: {new Date(stats.lastUpdated).toLocaleString()}
        {isRealtimeConnected && ' • Real-time updates enabled'}
      </div>
    </div>
  )
}