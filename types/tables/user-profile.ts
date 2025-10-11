export interface UserProfile {
  id: string
  full_name: string
  role: 'admin' | 'lab_staff' | 'lecturer' | 'student'
  nim: string | null
  nip: string | null
  phone: string | null
  department: string
  created_at: string
  updated_at: string
}

export interface UserProfileInsert {
  id: string
  full_name: string
  role: 'admin' | 'lab_staff' | 'lecturer' | 'student'
  nim?: string | null
  nip?: string | null
  phone?: string | null
  department: string
  created_at?: string
  updated_at?: string
}

export interface UserProfileUpdate {
  id?: string
  full_name?: string
  role?: 'admin' | 'lab_staff' | 'lecturer' | 'student'
  nim?: string | null
  nip?: string | null
  phone?: string | null
  department?: string
  created_at?: string
  updated_at?: string
}