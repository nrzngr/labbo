export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "13.0.5"
    }
    public: {
        Tables: {
            audit_log: {
                Row: {
                    action: string
                    created_at: string | null
                    id: string
                    new_values: Json | null
                    old_values: Json | null
                    record_id: string
                    table_name: string
                    user_id: string | null
                }
                Insert: {
                    action: string
                    created_at?: string | null
                    id?: string
                    new_values?: Json | null
                    old_values?: Json | null
                    record_id: string
                    table_name: string
                    user_id?: string | null
                }
                Update: {
                    action?: string
                    created_at?: string | null
                    id?: string
                    new_values?: Json | null
                    old_values?: Json | null
                    record_id?: string
                    table_name?: string
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "audit_log_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            borrowing_limits: {
                Row: {
                    category_id: string | null
                    created_at: string | null
                    id: string
                    max_duration_days: number | null
                    max_items: number | null
                    requires_approval: boolean | null
                    role: string
                    updated_at: string | null
                }
                Insert: {
                    category_id?: string | null
                    created_at?: string | null
                    id?: string
                    max_duration_days?: number | null
                    max_items?: number | null
                    requires_approval?: boolean | null
                    role: string
                    updated_at?: string | null
                }
                Update: {
                    category_id?: string | null
                    created_at?: string | null
                    id?: string
                    max_duration_days?: number | null
                    max_items?: number | null
                    requires_approval?: boolean | null
                    role?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "borrowing_limits_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                ]
            }
            borrowing_transactions: {
                Row: {
                    actual_return_date: string | null
                    approved_at: string | null
                    approved_by: string | null
                    borrow_date: string
                    created_at: string | null
                    equipment_id: string | null
                    expected_return_date: string
                    id: string
                    notes: string | null
                    quantity: number
                    rejection_reason: string | null
                    return_condition: string | null
                    return_notes: string | null
                    returned_to: string | null
                    status: Database["public"]["Enums"]["transaction_status"] | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    actual_return_date?: string | null
                    approved_at?: string | null
                    approved_by?: string | null
                    borrow_date: string
                    created_at?: string | null
                    equipment_id?: string | null
                    expected_return_date: string
                    id?: string
                    notes?: string | null
                    quantity?: number
                    rejection_reason?: string | null
                    return_condition?: string | null
                    return_notes?: string | null
                    returned_to?: string | null
                    status?: Database["public"]["Enums"]["transaction_status"] | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    actual_return_date?: string | null
                    approved_at?: string | null
                    approved_by?: string | null
                    borrow_date?: string
                    created_at?: string | null
                    equipment_id?: string | null
                    expected_return_date?: string
                    id?: string
                    notes?: string | null
                    quantity?: number
                    rejection_reason?: string | null
                    return_condition?: string | null
                    return_notes?: string | null
                    returned_to?: string | null
                    status?: Database["public"]["Enums"]["transaction_status"] | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "borrowing_transactions_approved_by_fkey"
                        columns: ["approved_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "borrowing_transactions_equipment_id_fkey"
                        columns: ["equipment_id"]
                        isOneToOne: false
                        referencedRelation: "equipment"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "borrowing_transactions_returned_to_fkey"
                        columns: ["returned_to"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "borrowing_transactions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            categories: {
                Row: {
                    created_at: string | null
                    description: string | null
                    id: string
                    name: string
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name: string
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            email_verification_tokens: {
                Row: {
                    id: string
                    user_id: string
                    token: string
                    expires_at: string
                    used_at: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    token: string
                    expires_at: string
                    used_at?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    token?: string
                    expires_at?: string
                    used_at?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "email_verification_tokens_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            equipment: {
                Row: {
                    category_id: string | null
                    condition: string | null
                    created_at: string | null
                    description: string | null
                    id: string
                    image_url: string | null
                    location: string | null
                    name: string
                    purchase_date: string | null
                    purchase_price: number | null
                    qr_code: string | null
                    serial_number: string | null
                    status: Database["public"]["Enums"]["equipment_status"] | null
                    stock: number
                    updated_at: string | null
                }
                Insert: {
                    category_id?: string | null
                    condition?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    location?: string | null
                    name: string
                    purchase_date?: string | null
                    purchase_price?: number | null
                    qr_code?: string | null
                    serial_number?: string | null
                    status?: Database["public"]["Enums"]["equipment_status"] | null
                    stock?: number
                    updated_at?: string | null
                }
                Update: {
                    category_id?: string | null
                    condition?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    location?: string | null
                    name?: string
                    purchase_date?: string | null
                    purchase_price?: number | null
                    qr_code?: string | null
                    serial_number?: string | null
                    status?: Database["public"]["Enums"]["equipment_status"] | null
                    stock?: number
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "equipment_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                ]
            }
            equipment_images: {
                Row: {
                    created_at: string | null
                    display_order: number | null
                    equipment_id: string | null
                    id: string
                    image_url: string
                    is_primary: boolean | null
                    uploaded_by: string | null
                }
                Insert: {
                    created_at?: string | null
                    display_order?: number | null
                    equipment_id?: string | null
                    id?: string
                    image_url: string
                    is_primary?: boolean | null
                    uploaded_by?: string | null
                }
                Update: {
                    created_at?: string | null
                    display_order?: number | null
                    equipment_id?: string | null
                    id?: string
                    image_url?: string
                    is_primary?: boolean | null
                    uploaded_by?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "equipment_images_equipment_id_fkey"
                        columns: ["equipment_id"]
                        isOneToOne: false
                        referencedRelation: "equipment"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "equipment_images_uploaded_by_fkey"
                        columns: ["uploaded_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            maintenance_records: {
                Row: {
                    cost: number | null
                    created_at: string | null
                    description: string
                    equipment_id: string | null
                    id: string
                    maintenance_date: string
                    next_maintenance_date: string | null
                    notes: string | null
                    performed_by: string | null
                    updated_at: string | null
                }
                Insert: {
                    cost?: number | null
                    created_at?: string | null
                    description: string
                    equipment_id?: string | null
                    id?: string
                    maintenance_date: string
                    next_maintenance_date?: string | null
                    notes?: string | null
                    performed_by?: string | null
                    updated_at?: string | null
                }
                Update: {
                    cost?: number | null
                    created_at?: string | null
                    description?: string
                    equipment_id?: string | null
                    id?: string
                    maintenance_date?: string
                    next_maintenance_date?: string | null
                    notes?: string | null
                    performed_by?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "maintenance_records_equipment_id_fkey"
                        columns: ["equipment_id"]
                        isOneToOne: false
                        referencedRelation: "equipment"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "maintenance_records_performed_by_fkey"
                        columns: ["performed_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            maintenance_schedules: {
                Row: {
                    assigned_to: string | null
                    completed_at: string | null
                    created_at: string | null
                    created_by: string | null
                    description: string | null
                    equipment_id: string | null
                    frequency_unit: Database["public"]["Enums"]["frequency_unit"] | null
                    frequency_value: number | null
                    id: string
                    is_recurring: boolean | null
                    maintenance_type: Database["public"]["Enums"]["maintenance_type"]
                    notes: string | null
                    priority: Database["public"]["Enums"]["maintenance_priority"] | null
                    scheduled_date: string
                    status: Database["public"]["Enums"]["maintenance_schedule_status"] | null
                    title: string
                    updated_at: string | null
                }
                Insert: {
                    assigned_to?: string | null
                    completed_at?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    description?: string | null
                    equipment_id?: string | null
                    frequency_unit?: Database["public"]["Enums"]["frequency_unit"] | null
                    frequency_value?: number | null
                    id?: string
                    is_recurring?: boolean | null
                    maintenance_type: Database["public"]["Enums"]["maintenance_type"]
                    notes?: string | null
                    priority?: Database["public"]["Enums"]["maintenance_priority"] | null
                    scheduled_date: string
                    status?: Database["public"]["Enums"]["maintenance_schedule_status"] | null
                    title: string
                    updated_at?: string | null
                }
                Update: {
                    assigned_to?: string | null
                    completed_at?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    description?: string | null
                    equipment_id?: string | null
                    frequency_unit?: Database["public"]["Enums"]["frequency_unit"] | null
                    frequency_value?: number | null
                    id?: string
                    is_recurring?: boolean | null
                    maintenance_type?: Database["public"]["Enums"]["maintenance_type"]
                    notes?: string | null
                    priority?: Database["public"]["Enums"]["maintenance_priority"] | null
                    scheduled_date?: string
                    status?: Database["public"]["Enums"]["maintenance_schedule_status"] | null
                    title?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "maintenance_schedules_assigned_to_fkey"
                        columns: ["assigned_to"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "maintenance_schedules_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "maintenance_schedules_equipment_id_fkey"
                        columns: ["equipment_id"]
                        isOneToOne: false
                        referencedRelation: "equipment"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notifications: {
                Row: {
                    created_at: string | null
                    id: string
                    is_read: boolean | null
                    message: string
                    title: string
                    type: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    is_read?: boolean | null
                    message: string
                    title: string
                    type?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    is_read?: boolean | null
                    message?: string
                    title?: string
                    type?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            penalties: {
                Row: {
                    amount: number
                    created_at: string | null
                    id: string
                    notes: string | null
                    paid_at: string | null
                    reason: string
                    status: string | null
                    transaction_id: string | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    amount: number
                    created_at?: string | null
                    id?: string
                    notes?: string | null
                    paid_at?: string | null
                    reason: string
                    status?: string | null
                    transaction_id?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    amount?: number
                    created_at?: string | null
                    id?: string
                    notes?: string | null
                    paid_at?: string | null
                    reason?: string
                    status?: string | null
                    transaction_id?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "penalties_transaction_id_fkey"
                        columns: ["transaction_id"]
                        isOneToOne: false
                        referencedRelation: "borrowing_transactions"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "penalties_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            reservations: {
                Row: {
                    approved_at: string | null
                    approved_by: string | null
                    created_at: string | null
                    end_date: string
                    equipment_id: string | null
                    id: string
                    notes: string | null
                    purpose: string | null
                    quantity: number | null
                    rejection_reason: string | null
                    start_date: string
                    status: Database["public"]["Enums"]["reservation_status"] | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    approved_at?: string | null
                    approved_by?: string | null
                    created_at?: string | null
                    end_date: string
                    equipment_id?: string | null
                    id?: string
                    notes?: string | null
                    purpose?: string | null
                    quantity?: number | null
                    rejection_reason?: string | null
                    start_date: string
                    status?: Database["public"]["Enums"]["reservation_status"] | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    approved_at?: string | null
                    approved_by?: string | null
                    created_at?: string | null
                    end_date?: string
                    equipment_id?: string | null
                    id?: string
                    notes?: string | null
                    purpose?: string | null
                    quantity?: number | null
                    rejection_reason?: string | null
                    start_date?: string
                    status?: Database["public"]["Enums"]["reservation_status"] | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "reservations_approved_by_fkey"
                        columns: ["approved_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "reservations_equipment_id_fkey"
                        columns: ["equipment_id"]
                        isOneToOne: false
                        referencedRelation: "equipment"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "reservations_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_profiles: {
                Row: {
                    created_at: string | null
                    department: string | null
                    email: string
                    full_name: string
                    id: string
                    is_active: boolean | null
                    nim: string | null
                    nip: string | null
                    phone: string | null
                    role: Database["public"]["Enums"]["user_role"] | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    department?: string | null
                    email: string
                    full_name: string
                    id: string
                    is_active?: boolean | null
                    nim?: string | null
                    nip?: string | null
                    phone?: string | null
                    role?: Database["public"]["Enums"]["user_role"] | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    department?: string | null
                    email?: string
                    full_name?: string
                    id?: string
                    is_active?: boolean | null
                    nim?: string | null
                    nip?: string | null
                    phone?: string | null
                    role?: Database["public"]["Enums"]["user_role"] | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            waitlist: {
                Row: {
                    created_at: string | null
                    equipment_id: string | null
                    id: string
                    notes: string | null
                    notified_at: string | null
                    priority: Database["public"]["Enums"]["waitlist_priority"] | null
                    quantity_requested: number | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    equipment_id?: string | null
                    id?: string
                    notes?: string | null
                    notified_at?: string | null
                    priority?: Database["public"]["Enums"]["waitlist_priority"] | null
                    quantity_requested?: number | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    equipment_id?: string | null
                    id?: string
                    notes?: string | null
                    notified_at?: string | null
                    priority?: Database["public"]["Enums"]["waitlist_priority"] | null
                    quantity_requested?: number | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "waitlist_equipment_id_fkey"
                        columns: ["equipment_id"]
                        isOneToOne: false
                        referencedRelation: "equipment"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "waitlist_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            users: {
                Row: {
                    id: string
                    email: string
                    password_hash: string
                    full_name: string
                    department: string
                    role: Database["public"]["Enums"]["user_role"]
                    phone: string | null
                    nim: string | null
                    nip: string | null
                    student_level: string | null
                    lecturer_rank: string | null
                    is_active: boolean | null
                    last_login: string | null
                    created_at: string | null
                    updated_at: string | null
                    email_verified: boolean | null
                    email_verified_at: string | null
                    last_login_at: string | null
                    login_count: number | null
                    locked_until: string | null
                    failed_login_attempts: number | null
                    refresh_token: string | null
                    refresh_token_expires_at: string | null
                    department_id: string | null
                    approval_status: string | null
                }
                Insert: {
                    id?: string
                    email: string
                    password_hash: string
                    full_name: string
                    department: string
                    role?: Database["public"]["Enums"]["user_role"]
                    phone?: string | null
                    nim?: string | null
                    nip?: string | null
                    student_level?: string | null
                    lecturer_rank?: string | null
                    is_active?: boolean | null
                    last_login?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    email_verified?: boolean | null
                    email_verified_at?: string | null
                    last_login_at?: string | null
                    login_count?: number | null
                    locked_until?: string | null
                    failed_login_attempts?: number | null
                    refresh_token?: string | null
                    refresh_token_expires_at?: string | null
                    department_id?: string | null
                    approval_status?: string | null
                }
                Update: {
                    id?: string
                    email?: string
                    password_hash?: string
                    full_name?: string
                    department?: string
                    role?: Database["public"]["Enums"]["user_role"]
                    phone?: string | null
                    nim?: string | null
                    nip?: string | null
                    student_level?: string | null
                    lecturer_rank?: string | null
                    is_active?: boolean | null
                    last_login?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    email_verified?: boolean | null
                    email_verified_at?: string | null
                    last_login_at?: string | null
                    login_count?: number | null
                    locked_until?: string | null
                    failed_login_attempts?: number | null
                    refresh_token?: string | null
                    refresh_token_expires_at?: string | null
                    department_id?: string | null
                    approval_status?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            category:
            | "electronics"
            | "mechanical"
            | "chemical"
            | "optical"
            | "measurement"
            | "computer"
            | "general"
            equipment_status: "available" | "borrowed" | "maintenance" | "retired"
            frequency_unit: "days" | "weeks" | "months" | "years"
            maintenance_priority: "low" | "medium" | "high" | "critical"
            maintenance_schedule_status:
            | "scheduled"
            | "in_progress"
            | "completed"
            | "cancelled"
            maintenance_type: "routine" | "repair" | "calibration" | "replacement"
            recurrence_pattern: "daily" | "weekly" | "monthly" | "yearly"
            reservation_status:
            | "pending"
            | "approved"
            | "rejected"
            | "cancelled"
            | "completed"
            transaction_status:
            | "active"
            | "returned"
            | "overdue"
            | "pending"
            | "rejected"
            user_role: "admin" | "lab_staff" | "dosen" | "mahasiswa"
            waitlist_priority: "low" | "normal" | "high" | "urgent"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {
            category: [
                "electronics",
                "mechanical",
                "chemical",
                "optical",
                "measurement",
                "computer",
                "general",
            ],
            equipment_status: ["available", "borrowed", "maintenance", "retired"],
            frequency_unit: ["days", "weeks", "months", "years"],
            maintenance_priority: ["low", "medium", "high", "critical"],
            maintenance_schedule_status: [
                "scheduled",
                "in_progress",
                "completed",
                "cancelled",
            ],
            maintenance_type: ["routine", "repair", "calibration", "replacement"],
            recurrence_pattern: ["daily", "weekly", "monthly", "yearly"],
            reservation_status: [
                "pending",
                "approved",
                "rejected",
                "cancelled",
                "completed",
            ],
            transaction_status: [
                "active",
                "returned",
                "overdue",
                "pending",
                "rejected",
            ],
            user_role: ["admin", "lab_staff", "dosen", "mahasiswa"],
            waitlist_priority: ["low", "normal", "high", "urgent"],
        },
    },
} as const
