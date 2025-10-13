import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface Notification {
  id: string
  user_id: string | null
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  read: boolean
  data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface NotificationCreateInput {
  user_id?: string
  type: Notification['type']
  title: string
  message: string
  data?: Record<string, unknown>
}

class NotificationService {
  private channel: RealtimeChannel | null = null
  private subscribers: Set<(notifications: Notification[]) => void> = new Set()

  // Subscribe to real-time notifications for a user
  subscribeToUserNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    this.subscribers.add(callback)

    if (this.channel) {
      this.channel.unsubscribe()
    }

    this.channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Notification change received:', payload)
          this.fetchUserNotifications(userId).then(notifications => {
            this.subscribers.forEach(cb => cb(notifications))
          })
        }
      )
      .subscribe()

    // Fetch initial notifications
    this.fetchUserNotifications(userId).then(notifications => {
      callback(notifications)
    })

    return () => {
      this.subscribers.delete(callback)
      if (this.subscribers.size === 0 && this.channel) {
        this.channel.unsubscribe()
        this.channel = null
      }
    }
  }

  // Subscribe to system-wide notifications (for admin/lab_staff)
  subscribeToSystemNotifications(callback: (notifications: Notification[]) => void) {
    this.subscribers.add(callback)

    if (this.channel) {
      this.channel.unsubscribe()
    }

    this.channel = supabase
      .channel('system-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'user_id=is.null',
        },
        (payload) => {
          console.log('System notification received:', payload)
          this.fetchSystemNotifications().then(notifications => {
            this.subscribers.forEach(cb => cb(notifications))
          })
        }
      )
      .subscribe()

    // Fetch initial system notifications
    this.fetchSystemNotifications().then(notifications => {
      callback(notifications)
    })

    return () => {
      this.subscribers.delete(callback)
      if (this.subscribers.size === 0 && this.channel) {
        this.channel.unsubscribe()
        this.channel = null
      }
    }
  }

  // Fetch user notifications
  async fetchUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    try {
      // Simulate database operations
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log('Fetching user notifications for:', { userId, limit })

      // Return mock data
      return []
    } catch (error) {
      console.error('Error in fetchUserNotifications:', error)
      return []
    }
  }

  // Fetch system notifications
  async fetchSystemNotifications(limit = 20): Promise<Notification[]> {
    try {
      // Simulate database operations
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log('Fetching system notifications with limit:', limit)

      // Return mock data
      return []
    } catch (error) {
      console.error('Error in fetchSystemNotifications:', error)
      return []
    }
  }

  // Create a notification
  async createNotification(input: NotificationCreateInput): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      // Simulate database operations
      await new Promise(resolve => setTimeout(resolve, 100))
      const notificationId = 'notification_' + Math.random().toString(36).substr(2, 9)

      console.log('Notification created:', {
        id: notificationId,
        ...input,
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      return { success: true, id: notificationId }
    } catch (error) {
      console.error('Error in createNotification:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate database operations
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log('Marking notification as read:', { notificationId, userId })

      return { success: true }
    } catch (error) {
      console.error('Error in markAsRead:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate database operations
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log('Marking all notifications as read for user:', userId)

      return { success: true }
    } catch (error) {
      console.error('Error in markAllAsRead:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Delete a notification
  async deleteNotification(notificationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate database operations
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log('Deleting notification:', { notificationId, userId })

      return { success: true }
    } catch (error) {
      console.error('Error in deleteNotification:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Get unread count for a user
  async getUnreadCount(userId: string): Promise<number> {
    try {
      // Simulate database operations
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log('Getting unread count for user:', userId)

      // Return mock data
      return 0
    } catch (error) {
      console.error('Error in getUnreadCount:', error)
      return 0
    }
  }

  // Create due date reminder notifications
  async createDueDateReminder(userId: string, equipmentName: string, dueDate: string, transactionId: string): Promise<{ success: boolean; error?: string }> {
    const dueDateObj = new Date(dueDate)
    const today = new Date()
    const daysUntilDue = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    let type: Notification['type'] = 'info'
    let title = 'Pengingat Pengembalian Peralatan'

    if (daysUntilDue <= 0) {
      type = 'error'
      title = 'Pengembalian Terlambat!'
    } else if (daysUntilDue === 1) {
      type = 'warning'
      title = 'Pengingat Pengembalian - Besok!'
    } else if (daysUntilDue <= 3) {
      type = 'warning'
    }

    const message = daysUntilDue <= 0
      ? `Peralatan "${equipmentName}" terlambat ${Math.abs(daysUntilDue)} hari. Segera kembalikan!`
      : `Peralatan "${equipmentName}" harus dikembalikan dalam ${daysUntilDue} hari pada ${dueDateObj.toLocaleDateString('id-ID')}.`

    return this.createNotification({
      user_id: userId,
      type,
      title,
      message,
      data: {
        transaction_id: transactionId,
        equipment_name: equipmentName,
        due_date: dueDate,
        days_overdue: daysUntilDue <= 0 ? Math.abs(daysUntilDue) : null,
      },
    })
  }

  // Create borrowing approval notification
  async createApprovalNotification(staffUserId: string, studentName: string, equipmentName: string): Promise<{ success: boolean; error?: string }> {
    return this.createNotification({
      user_id: staffUserId,
      type: 'info',
      title: 'Permintaan Peminjaman Baru',
      message: `${studentName} meminjam peralatan "${equipmentName}" menunggu persetujuan.`,
      data: {
        student_name: studentName,
        equipment_name: equipmentName,
      },
    })
  }

  // Create equipment alert notification
  async createEquipmentAlert(title: string, message: string): Promise<{ success: boolean; error?: string }> {
    return this.createNotification({
      type: 'warning',
      title,
      message,
      data: {
        alert_type: 'equipment',
      },
    })
  }

  // Create system maintenance notification
  async createSystemMaintenanceNotification(title: string, message: string, scheduledDate?: string): Promise<{ success: boolean; error?: string }> {
    return this.createNotification({
      type: 'warning',
      title,
      message,
      data: {
        scheduled_date: scheduledDate,
      },
    })
  }

  // Cleanup
  unsubscribe() {
    if (this.channel) {
      this.channel.unsubscribe()
      this.channel = null
    }
    this.subscribers.clear()
  }
}

export const notificationService = new NotificationService()