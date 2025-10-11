export interface MaintenanceRecord {
  id: string
  equipment_id: string
  maintenance_date: string
  description: string
  cost: string | null
  performed_by: string
  next_maintenance_date: string | null
  created_at: string
  updated_at: string
}

export interface MaintenanceRecordInsert {
  id?: string
  equipment_id: string
  maintenance_date: string
  description: string
  cost?: string | null
  performed_by: string
  next_maintenance_date?: string | null
  created_at?: string
  updated_at?: string
}

export interface MaintenanceRecordUpdate {
  id?: string
  equipment_id?: string
  maintenance_date?: string
  description?: string
  cost?: string | null
  performed_by?: string
  next_maintenance_date?: string | null
  created_at?: string
  updated_at?: string
}