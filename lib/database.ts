import { supabase } from './supabase'
import * as TableTypes from '@/types/tables'

export type Category = TableTypes.Category
export type Equipment = TableTypes.Equipment
export type UserProfile = TableTypes.UserProfile
export type BorrowingTransaction = TableTypes.BorrowingTransaction
export type MaintenanceRecord = TableTypes.MaintenanceRecord

export type CategoryInsert = TableTypes.CategoryInsert
export type EquipmentInsert = TableTypes.EquipmentInsert
export type UserProfileInsert = TableTypes.UserProfileInsert
export type BorrowingTransactionInsert = TableTypes.BorrowingTransactionInsert
export type MaintenanceRecordInsert = TableTypes.MaintenanceRecordInsert

export type CategoryUpdate = TableTypes.CategoryUpdate
export type EquipmentUpdate = TableTypes.EquipmentUpdate
export type UserProfileUpdate = TableTypes.UserProfileUpdate
export type BorrowingTransactionUpdate = TableTypes.BorrowingTransactionUpdate
export type MaintenanceRecordUpdate = TableTypes.MaintenanceRecordUpdate

// Categories
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

export async function getCategory(id: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createCategory(category: CategoryInsert) {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCategory(id: string, category: CategoryUpdate) {
  const { data, error } = await supabase
    .from('categories')
    .update(category)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Equipment
export async function getEquipment() {
  const { data, error } = await supabase
    .from('equipment')
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .order('name')

  if (error) throw error
  return data
}

export async function getEquipmentWithStatus() {
  const { data, error } = await supabase
    .from('equipment_status_view')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

export async function getEquipmentById(id: string) {
  const { data, error } = await supabase
    .from('equipment')
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createEquipment(equipment: EquipmentInsert) {
  const { data, error } = await supabase
    .from('equipment')
    .insert(equipment)
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .single()

  if (error) throw error
  return data
}

export async function updateEquipment(id: string, equipment: EquipmentUpdate) {
  const { data, error } = await supabase
    .from('equipment')
    .update(equipment)
    .eq('id', id)
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .single()

  if (error) throw error
  return data
}

export async function deleteEquipment(id: string) {
  const { error } = await supabase
    .from('equipment')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getAvailableEquipment() {
  const { data, error } = await supabase
    .from('equipment_status_view')
    .select('*')
    .eq('current_status', 'available')
    .order('name')

  if (error) throw error
  return data
}

// User Profiles
export async function getUserProfiles() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('full_name')

  if (error) throw error
  return data
}

export async function getUserProfile(id: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function updateUserProfile(id: string, profile: UserProfileUpdate) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(profile)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createUserProfile(profile: UserProfileInsert) {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert(profile)
    .select()
    .single()

  if (error) throw error
  return data
}

// Borrowing Transactions
export async function getBorrowingTransactions() {
  const { data, error } = await supabase
    .from('borrowing_transactions')
    .select(`
      *,
      user_profiles (
        id,
        full_name,
        department,
        role
      ),
      equipment (
        id,
        name,
        serial_number,
        categories (
          name
        )
      )
    `)
    .order('borrow_date', { ascending: false })

  if (error) throw error
  return data
}

export async function getBorrowingTransactionsByUser(userId: string) {
  const { data, error } = await supabase
    .from('borrowing_transactions')
    .select(`
      *,
      equipment (
        id,
        name,
        serial_number,
        categories (
          name
        )
      )
    `)
    .eq('user_id', userId)
    .order('borrow_date', { ascending: false })

  if (error) throw error
  return data
}

export async function createBorrowingTransaction(transaction: BorrowingTransactionInsert) {
  const { data, error } = await supabase
    .from('borrowing_transactions')
    .insert(transaction)
    .select(`
      *,
      user_profiles (
        id,
        full_name,
        department,
        role
      ),
      equipment (
        id,
        name,
        serial_number,
        categories (
          name
        )
      )
    `)
    .single()

  if (error) throw error
  return data
}

export async function updateBorrowingTransaction(id: string, transaction: BorrowingTransactionUpdate) {
  const { data, error } = await supabase
    .from('borrowing_transactions')
    .update(transaction)
    .eq('id', id)
    .select(`
      *,
      user_profiles (
        id,
        full_name,
        department,
        role
      ),
      equipment (
        id,
        name,
        serial_number,
        categories (
          name
        )
      )
    `)
    .single()

  if (error) throw error
  return data
}

export async function returnEquipment(transactionId: string) {
  const { data, error } = await supabase
    .from('borrowing_transactions')
    .update({
      actual_return_date: new Date().toISOString().split('T')[0],
      status: 'returned'
    })
    .eq('id', transactionId)
    .select(`
      *,
      user_profiles (
        id,
        full_name,
        department,
        role
      ),
      equipment (
        id,
        name,
        serial_number,
        categories (
          name
        )
      )
    `)
    .single()

  if (error) throw error
  return data
}

export async function getOverdueTransactions() {
  const { data, error } = await supabase
    .from('borrowing_transactions')
    .select(`
      *,
      user_profiles (
        id,
        full_name,
        department,
        email
      ),
      equipment (
        id,
        name,
        serial_number
      )
    `)
    .eq('status', 'active')
    .lt('expected_return_date', new Date().toISOString().split('T')[0])
    .order('expected_return_date', { ascending: true })

  if (error) throw error
  return data
}

// Maintenance Records
export async function getMaintenanceRecords() {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select(`
      *,
      equipment (
        id,
        name,
        serial_number,
        categories (
          name
        )
      )
    `)
    .order('maintenance_date', { ascending: false })

  if (error) throw error
  return data
}

export async function getMaintenanceRecordsByEquipment(equipmentId: string) {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*')
    .eq('equipment_id', equipmentId)
    .order('maintenance_date', { ascending: false })

  if (error) throw error
  return data
}

export async function createMaintenanceRecord(record: MaintenanceRecordInsert) {
  const { data, error } = await supabase
    .from('maintenance_records')
    .insert(record)
    .select(`
      *,
      equipment (
        id,
        name,
        serial_number,
        categories (
          name
        )
      )
    `)
    .single()

  if (error) throw error
  return data
}

export async function updateMaintenanceRecord(id: string, record: MaintenanceRecordUpdate) {
  const { data, error } = await supabase
    .from('maintenance_records')
    .update(record)
    .eq('id', id)
    .select(`
      *,
      equipment (
        id,
        name,
        serial_number,
        categories (
          name
        )
      )
    `)
    .single()

  if (error) throw error
  return data
}

export async function deleteMaintenanceRecord(id: string) {
  const { error } = await supabase
    .from('maintenance_records')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Analytics and Reporting
export async function getDashboardStats() {
  const [
    equipmentResult,
    activeBorrowsResult,
    maintenanceResult,
    usersResult
  ] = await Promise.all([
    supabase.from('equipment').select('id, status').eq('status', 'available'),
    supabase.from('borrowing_transactions').select('id').eq('status', 'active'),
    supabase.from('equipment').select('id').eq('status', 'maintenance'),
    supabase.from('user_profiles').select('id').eq('role', 'student')
  ])

  return {
    availableEquipment: equipmentResult.data?.length || 0,
    activeBorrows: activeBorrowsResult.data?.length || 0,
    equipmentInMaintenance: maintenanceResult.data?.length || 0,
    totalStudents: usersResult.data?.length || 0
  }
}

export async function getBorrowingHistory(days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('user_borrowing_history')
    .select('*')
    .gte('borrow_date', startDate.toISOString().split('T')[0])
    .order('borrow_date', { ascending: false })

  if (error) throw error
  return data
}

export async function getEquipmentUtilization() {
  const { data, error } = await supabase
    .from('equipment')
    .select(`
      id,
      name,
      borrowing_transactions (
        id,
        borrow_date,
        actual_return_date
      )
    `)

  if (error) throw error
  return data
}