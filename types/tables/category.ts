export interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface CategoryInsert {
  id?: string
  name: string
  description?: string | null
  created_at?: string
  updated_at?: string
}

export interface CategoryUpdate {
  id?: string
  name?: string
  description?: string | null
  created_at?: string
  updated_at?: string
}