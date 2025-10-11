export interface BorrowingTransaction {
  id: string
  user_id: string
  equipment_id: string
  borrow_date: string
  expected_return_date: string
  actual_return_date: string | null
  notes: string | null
  status: 'active' | 'returned' | 'overdue'
  created_at: string
  updated_at: string
}

export interface BorrowingTransactionInsert {
  id?: string
  user_id: string
  equipment_id: string
  borrow_date: string
  expected_return_date: string
  actual_return_date?: string | null
  notes?: string | null
  status?: 'active' | 'returned' | 'overdue'
  created_at?: string
  updated_at?: string
}

export interface BorrowingTransactionUpdate {
  id?: string
  user_id?: string
  equipment_id?: string
  borrow_date?: string
  expected_return_date?: string
  actual_return_date?: string | null
  notes?: string | null
  status?: 'active' | 'returned' | 'overdue'
  created_at?: string
  updated_at?: string
}