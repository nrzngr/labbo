export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface AuditLog {
  id: string
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values: Json | null
  new_values: Json | null
  user_id: string | null
  created_at: string
}

export interface AuditLogInsert {
  id?: string
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values?: Json | null
  new_values?: Json | null
  user_id?: string | null
  created_at?: string
}

export interface AuditLogUpdate {
  id?: string
  table_name?: string
  record_id?: string
  action?: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values?: Json | null
  new_values?: Json | null
  user_id?: string | null
  created_at?: string
}