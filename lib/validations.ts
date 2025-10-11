import * as z from 'zod'

export const equipmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category_id: z.string().uuid('Please select a category'),
  serial_number: z.string().min(1, 'Serial number is required'),
  purchase_date: z.string().optional(),
  purchase_price: z.string().optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  status: z.enum(['available', 'borrowed', 'maintenance', 'lost']),
  location: z.string().min(1, 'Location is required'),
  image_url: z.string().url('Invalid URL format').optional().or(z.literal(''))
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional()
})

export const userProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['admin', 'lab_staff', 'lecturer', 'student']),
  nim: z.string().optional(),
  nip: z.string().optional(),
  phone: z.string().optional(),
  department: z.string().min(1, 'Department is required')
}).refine(
  (data) => {
    if (data.role === 'student' && !data.nim) return false
    if (data.role === 'lecturer' && !data.nip) return false
    return true
  },
  {
    message: "Student ID is required for students and Lecturer ID is required for lecturers",
    path: ["nim"]
  }
)

export const borrowingTransactionSchema = z.object({
  user_id: z.string().uuid('Please select a borrower'),
  equipment_id: z.string().uuid('Please select equipment'),
  borrow_date: z.string().min(1, 'Borrow date is required'),
  expected_return_date: z.string().min(1, 'Expected return date is required'),
  notes: z.string().optional()
})

export const maintenanceRecordSchema = z.object({
  equipment_id: z.string().uuid('Please select equipment'),
  maintenance_date: z.string().min(1, 'Maintenance date is required'),
  description: z.string().min(1, 'Description is required'),
  cost: z.string().optional(),
  performed_by: z.string().min(1, 'Performed by is required'),
  next_maintenance_date: z.string().optional(),
  notes: z.string().optional()
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['student', 'lecturer']),
  nim: z.string().optional(),
  nip: z.string().optional(),
  department: z.string().min(1, 'Department is required')
}).refine(
  (data) => {
    if (data.role === 'student' && !data.nim) return false
    if (data.role === 'lecturer' && !data.nip) return false
    return true
  },
  {
    message: "Student ID is required for students and Lecturer ID is required for lecturers",
    path: ["nim"]
  }
)

export type EquipmentFormValues = z.infer<typeof equipmentSchema>
export type CategoryFormValues = z.infer<typeof categorySchema>
export type UserProfileFormValues = z.infer<typeof userProfileSchema>
export type BorrowingTransactionFormValues = z.infer<typeof borrowingTransactionSchema>
export type MaintenanceRecordFormValues = z.infer<typeof maintenanceRecordSchema>
export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>