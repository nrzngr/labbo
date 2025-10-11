export interface Equipment {
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
}

export interface EquipmentInsert {
  id?: string
  name: string
  description?: string | null
  category_id?: string | null
  serial_number: string
  purchase_date?: string | null
  purchase_price?: string | null
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  status: 'available' | 'borrowed' | 'maintenance' | 'lost'
  location: string
  image_url?: string | null
  created_at?: string
  updated_at?: string
}

export interface EquipmentUpdate {
  id?: string
  name?: string
  description?: string | null
  category_id?: string | null
  serial_number?: string
  purchase_date?: string | null
  purchase_price?: string | null
  condition?: 'excellent' | 'good' | 'fair' | 'poor'
  status?: 'available' | 'borrowed' | 'maintenance' | 'lost'
  location?: string
  image_url?: string | null
  created_at?: string
  updated_at?: string
}