import { create } from 'zustand'

export interface User {
  id: string
  email?: string
  full_name?: string
  role?: string
  avatar_url?: string
}

export interface Equipment {
  id: string
  name: string
  description?: string
  category_id?: string
  category?: { name: string }
  serial_number: string
  purchase_date?: string
  purchase_price?: number
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  status: 'available' | 'borrowed' | 'maintenance' | 'lost'
  location: string
  image_url?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  full_name: string
  role: 'admin' | 'lab_staff' | 'lecturer' | 'student'
  nim?: string
  nip?: string
  phone?: string
  department: string
  created_at: string
  updated_at: string
}

export interface BorrowingTransaction {
  id: string
  user_id: string
  equipment_id: string
  user?: UserProfile
  equipment?: Equipment
  borrow_date: string
  expected_return_date: string
  actual_return_date?: string
  status: 'active' | 'returned' | 'overdue' | 'lost' | 'damaged'
  notes?: string
  fine_amount?: number
  condition_when_borrowed?: string
  condition_when_returned?: string
  created_at: string
  updated_at: string
}

interface AppStore {
  user: User | null
  profile: UserProfile | null
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void

  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  equipment: Equipment[]
  categories: Category[]
  setEquipment: (equipment: Equipment[]) => void
  setCategories: (categories: Category[]) => void
  addEquipment: (equipment: Equipment) => void
  updateEquipment: (id: string, equipment: Partial<Equipment>) => void
  deleteEquipment: (id: string) => void

  transactions: BorrowingTransaction[]
  setTransactions: (transactions: BorrowingTransaction[]) => void
  addTransaction: (transaction: BorrowingTransaction) => void
  updateTransaction: (id: string, transaction: Partial<BorrowingTransaction>) => void

  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    timestamp: Date
  }>
  addNotification: (notification: Omit<AppStore['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  equipment: [],
  categories: [],
  setEquipment: (equipment) => set({ equipment }),
  setCategories: (categories) => set({ categories }),
  addEquipment: (equipment) => set((state) => ({
    equipment: [...state.equipment, equipment]
  })),
  updateEquipment: (id, updatedEquipment) => set((state) => ({
    equipment: state.equipment.map(eq =>
      eq.id === id ? { ...eq, ...updatedEquipment } : eq
    )
  })),
  deleteEquipment: (id) => set((state) => ({
    equipment: state.equipment.filter(eq => eq.id !== id)
  })),

  transactions: [],
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) => set((state) => ({
    transactions: [...state.transactions, transaction]
  })),
  updateTransaction: (id, updatedTransaction) => set((state) => ({
    transactions: state.transactions.map(tr =>
      tr.id === id ? { ...tr, ...updatedTransaction } : tr
    )
  })),

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    }]
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  }))
}))

export const useAuth = () => useAppStore((state) => ({
  user: state.user,
  profile: state.profile,
  setUser: state.setUser,
  setProfile: state.setProfile
}))

export const useEquipment = () => useAppStore((state) => ({
  equipment: state.equipment,
  categories: state.categories,
  setEquipment: state.setEquipment,
  setCategories: state.setCategories,
  addEquipment: state.addEquipment,
  updateEquipment: state.updateEquipment,
  deleteEquipment: state.deleteEquipment
}))

export const useTransactions = () => useAppStore((state) => ({
  transactions: state.transactions,
  setTransactions: state.setTransactions,
  addTransaction: state.addTransaction,
  updateTransaction: state.updateTransaction
}))

export const useUI = () => useAppStore((state) => ({
  sidebarOpen: state.sidebarOpen,
  setSidebarOpen: state.setSidebarOpen,
  isLoading: state.isLoading,
  setIsLoading: state.setIsLoading
}))

export const useNotifications = () => useAppStore((state) => ({
  notifications: state.notifications,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification
}))