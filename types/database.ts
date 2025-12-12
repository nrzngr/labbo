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
          approved_by: string | null
          borrow_date: string
          condition_on_borrow: string | null
          condition_on_return: string | null
          created_at: string | null
          equipment_id: string
          expected_return_date: string
          id: string
          notes: string | null
          purpose: string | null
          returned_to: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_return_date?: string | null
          approved_by?: string | null
          borrow_date: string
          condition_on_borrow?: string | null
          condition_on_return?: string | null
          created_at?: string | null
          equipment_id: string
          expected_return_date: string
          id?: string
          notes?: string | null
          purpose?: string | null
          returned_to?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_return_date?: string | null
          approved_by?: string | null
          borrow_date?: string
          condition_on_borrow?: string | null
          condition_on_return?: string | null
          created_at?: string | null
          equipment_id?: string
          expected_return_date?: string
          id?: string
          notes?: string | null
          purpose?: string | null
          returned_to?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string | null
          user_id?: string
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
          category: Database["public"]["Enums"]["category"]
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["category"]
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["category"]
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          head_user_id: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_department_id: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          head_user_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_department_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          head_user_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_department_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_user_id_fkey"
            columns: ["head_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verification_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          updated_at: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          updated_at?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          updated_at?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_verification_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          brand: string | null
          calibration_interval_months: number | null
          category_id: string | null
          condition: string
          created_at: string | null
          department_id: string | null
          description: string | null
          id: string
          image_url: string | null
          last_calibration_date: string | null
          location: string | null
          location_id: string | null
          manufacturer: string | null
          model: string | null
          name: string
          next_calibration_date: string | null
          purchase_date: string | null
          purchase_price: number | null
          qr_code: string | null
          serial_number: string
          status: Database["public"]["Enums"]["equipment_status"]
          updated_at: string | null
          warranty_expiry: string | null
        }
        Insert: {
          brand?: string | null
          calibration_interval_months?: number | null
          category_id?: string | null
          condition?: string
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          last_calibration_date?: string | null
          location?: string | null
          location_id?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          next_calibration_date?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          qr_code?: string | null
          serial_number: string
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          brand?: string | null
          calibration_interval_months?: number | null
          category_id?: string | null
          condition?: string
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          last_calibration_date?: string | null
          location?: string | null
          location_id?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          next_calibration_date?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          qr_code?: string | null
          serial_number?: string
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_images: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          equipment_id: string
          id: string
          image_url: string
          is_primary: boolean | null
          thumbnail_url: string | null
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          equipment_id: string
          id?: string
          image_url: string
          is_primary?: boolean | null
          thumbnail_url?: string | null
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          equipment_id?: string
          id?: string
          image_url?: string
          is_primary?: boolean | null
          thumbnail_url?: string | null
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
      equipment_tag_relations: {
        Row: {
          equipment_id: string
          tag_id: string
        }
        Insert: {
          equipment_id: string
          tag_id: string
        }
        Update: {
          equipment_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_tag_relations_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_tag_relations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "equipment_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      late_return_penalties: {
        Row: {
          created_at: string | null
          days_late: number
          id: string
          notes: string | null
          penalty_amount: number | null
          penalty_type: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          transaction_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          days_late: number
          id?: string
          notes?: string | null
          penalty_amount?: number | null
          penalty_type?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          transaction_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          days_late?: number
          id?: string
          notes?: string | null
          penalty_amount?: number | null
          penalty_type?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          transaction_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "late_return_penalties_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "late_return_penalties_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "borrowing_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "late_return_penalties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          building: string
          capacity: number | null
          created_at: string | null
          floor: string | null
          id: string
          is_active: boolean | null
          room: string | null
          shelf: string | null
          updated_at: string | null
        }
        Insert: {
          building: string
          capacity?: number | null
          created_at?: string | null
          floor?: string | null
          id?: string
          is_active?: boolean | null
          room?: string | null
          shelf?: string | null
          updated_at?: string | null
        }
        Update: {
          building?: string
          capacity?: number | null
          created_at?: string | null
          floor?: string | null
          id?: string
          is_active?: boolean | null
          room?: string | null
          shelf?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      maintenance_records: {
        Row: {
          completed_at: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          equipment_id: string
          id: string
          maintenance_type: Database["public"]["Enums"]["maintenance_type"]
          notes: string | null
          performed_by: string | null
          scheduled_date: string
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          completed_at?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          equipment_id: string
          id?: string
          maintenance_type: Database["public"]["Enums"]["maintenance_type"]
          notes?: string | null
          performed_by?: string | null
          scheduled_date: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          completed_at?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          equipment_id?: string
          id?: string
          maintenance_type?: Database["public"]["Enums"]["maintenance_type"]
          notes?: string | null
          performed_by?: string | null
          scheduled_date?: string
          updated_at?: string | null
          vendor_id?: string | null
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
          {
            foreignKeyName: "maintenance_records_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "maintenance_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          equipment_id: string
          frequency_unit: Database["public"]["Enums"]["frequency_unit"]
          frequency_value: number
          id: string
          is_active: boolean | null
          last_performed: string | null
          next_due: string
          priority: Database["public"]["Enums"]["maintenance_priority"]
          recurrence_pattern: Database["public"]["Enums"]["recurrence_pattern"]
          status: Database["public"]["Enums"]["maintenance_schedule_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          equipment_id: string
          frequency_unit?: Database["public"]["Enums"]["frequency_unit"]
          frequency_value?: number
          id?: string
          is_active?: boolean | null
          last_performed?: string | null
          next_due: string
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          recurrence_pattern?: Database["public"]["Enums"]["recurrence_pattern"]
          status?: Database["public"]["Enums"]["maintenance_schedule_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          equipment_id?: string
          frequency_unit?: Database["public"]["Enums"]["frequency_unit"]
          frequency_value?: number
          id?: string
          is_active?: boolean | null
          last_performed?: string | null
          next_due?: string
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          recurrence_pattern?: Database["public"]["Enums"]["recurrence_pattern"]
          status?: Database["public"]["Enums"]["maintenance_schedule_status"]
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
            foreignKeyName: "maintenance_schedules_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_vendors: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          rating: number | null
          specializations: string[] | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          specializations?: string[] | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          specializations?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          priority: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          priority?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          priority?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
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
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          updated_at: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          updated_at?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          updated_at?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      report_exports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          file_url: string | null
          filters: Json | null
          format: string
          id: string
          report_type: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_url?: string | null
          filters?: Json | null
          format: string
          id?: string
          report_type: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_url?: string | null
          filters?: Json | null
          format?: string
          id?: string
          report_type?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_exports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          approved_by: string | null
          created_at: string | null
          description: string | null
          end_time: string
          equipment_id: string
          id: string
          notes: string | null
          start_time: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          equipment_id: string
          id?: string
          notes?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          equipment_id?: string
          id?: string
          notes?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string | null
          user_id?: string
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
      saved_filters: {
        Row: {
          created_at: string | null
          filter_type: string
          filters: Json
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filter_type: string
          filters: Json
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filter_type?: string
          filters?: Json
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_filters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_approval_requests: {
        Row: {
          approved_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          requested_role: string
          reviewed_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          requested_role: string
          reviewed_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          requested_role?: string
          reviewed_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_approval_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_approval_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          department: string
          department_id: string | null
          email: string
          email_verified: boolean | null
          full_name: string
          id: string
          is_active: boolean | null
          mfa_enabled: boolean | null
          mfa_secret: string | null
          nim: string | null
          nip: string | null
          password_hash: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          student_level: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department: string
          department_id?: string | null
          email: string
          email_verified?: boolean | null
          full_name: string
          id?: string
          is_active?: boolean | null
          mfa_enabled?: boolean | null
          mfa_secret?: string | null
          nim?: string | null
          nip?: string | null
          password_hash: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          student_level?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string
          department_id?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          mfa_enabled?: boolean | null
          mfa_secret?: string | null
          nim?: string | null
          nip?: string | null
          password_hash?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          student_level?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string | null
          equipment_id: string
          id: string
          notes: string | null
          notified_at: string | null
          position: number
          priority: Database["public"]["Enums"]["waitlist_priority"]
          requested_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          equipment_id: string
          id?: string
          notes?: string | null
          notified_at?: string | null
          position: number
          priority?: Database["public"]["Enums"]["waitlist_priority"]
          requested_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          equipment_id?: string
          id?: string
          notes?: string | null
          notified_at?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["waitlist_priority"]
          requested_date?: string | null
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
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
      transaction_status: "active" | "returned" | "overdue"
      user_role: "admin" | "lab_staff" | "dosen" | "mahasiswa"
      waitlist_priority: "low" | "normal" | "high" | "urgent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = Database["public"]

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
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
      transaction_status: ["active", "returned", "overdue"],
      user_role: ["admin", "lab_staff", "dosen", "mahasiswa"],
      waitlist_priority: ["low", "normal", "high", "urgent"],
    },
  },
} as const