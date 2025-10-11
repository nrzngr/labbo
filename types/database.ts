import { Json } from './tables/audit-log'

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: import('./tables/category').Category
        Insert: import('./tables/category').CategoryInsert
        Update: import('./tables/category').CategoryUpdate
      }
      user_profiles: {
        Row: import('./tables/user-profile').UserProfile
        Insert: import('./tables/user-profile').UserProfileInsert
        Update: import('./tables/user-profile').UserProfileUpdate
      }
      equipment: {
        Row: import('./tables/equipment').Equipment
        Insert: import('./tables/equipment').EquipmentInsert
        Update: import('./tables/equipment').EquipmentUpdate
      }
      borrowing_transactions: {
        Row: import('./tables/borrowing-transaction').BorrowingTransaction
        Insert: import('./tables/borrowing-transaction').BorrowingTransactionInsert
        Update: import('./tables/borrowing-transaction').BorrowingTransactionUpdate
      }
      maintenance_records: {
        Row: import('./tables/maintenance-record').MaintenanceRecord
        Insert: import('./tables/maintenance-record').MaintenanceRecordInsert
        Update: import('./tables/maintenance-record').MaintenanceRecordUpdate
      }
      audit_log: {
        Row: import('./tables/audit-log').AuditLog
        Insert: import('./tables/audit-log').AuditLogInsert
        Update: import('./tables/audit-log').AuditLogUpdate
      }
    }
    Views: {
      equipment_status_view: {
        Row: {
          id: string
          name: string
          description: string | null
          category_id: string | null
          serial_number: string
          purchase_date: string | null
          purchase_price: string | null
          condition: 'excellent' | 'good' | 'fair' | 'poor'
          status: 'available' | 'borrowed' | 'maintenance' | 'lost'
          location: string
          image_url: string | null
          created_at: string
          updated_at: string
          category_name: string | null
          current_borrower: string | null
          borrow_date: string | null
          expected_return_date: string | null
          current_status: 'available' | 'borrowed' | 'overdue' | 'maintenance' | 'lost'
        }
      }
      user_borrowing_history: {
        Row: {
          full_name: string
          department: string
          role: 'admin' | 'lab_staff' | 'lecturer' | 'student'
          equipment_name: string
          serial_number: string
          borrow_date: string
          expected_return_date: string
          actual_return_date: string | null
          status: 'active' | 'returned' | 'overdue'
          notes: string | null
        }
      }
    }
    Functions: {
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      is_lab_staff: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      has_staff_role: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}