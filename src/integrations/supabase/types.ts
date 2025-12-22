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
      appointments: {
        Row: {
          attendance_status: string | null
          created_at: string | null
          date: string
          duration: number | null
          id: string
          invoice_number: string | null
          is_first_session: boolean | null
          notes: string | null
          package_id: string | null
          patient_id: string | null
          patient_name: string
          repeat_until: string | null
          repeat_weekly: boolean | null
          room: string | null
          session_number: number | null
          status: string | null
          therapist: string
          time: string
          updated_at: string | null
        }
        Insert: {
          attendance_status?: string | null
          created_at?: string | null
          date: string
          duration?: number | null
          id?: string
          invoice_number?: string | null
          is_first_session?: boolean | null
          notes?: string | null
          package_id?: string | null
          patient_id?: string | null
          patient_name: string
          repeat_until?: string | null
          repeat_weekly?: boolean | null
          room?: string | null
          session_number?: number | null
          status?: string | null
          therapist: string
          time: string
          updated_at?: string | null
        }
        Update: {
          attendance_status?: string | null
          created_at?: string | null
          date?: string
          duration?: number | null
          id?: string
          invoice_number?: string | null
          is_first_session?: boolean | null
          notes?: string | null
          package_id?: string | null
          patient_id?: string | null
          patient_name?: string
          repeat_until?: string | null
          repeat_weekly?: boolean | null
          room?: string | null
          session_number?: number | null
          status?: string | null
          therapist?: string
          time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "patient_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          category: string
          created_at: string | null
          date: string
          description: string
          file_url: string | null
          id: string
          observations: string | null
          responsible: string | null
          therapist: string | null
          updated_at: string | null
          value: number
        }
        Insert: {
          category: string
          created_at?: string | null
          date: string
          description: string
          file_url?: string | null
          id?: string
          observations?: string | null
          responsible?: string | null
          therapist?: string | null
          updated_at?: string | null
          value: number
        }
        Update: {
          category?: string
          created_at?: string | null
          date?: string
          description?: string
          file_url?: string | null
          id?: string
          observations?: string | null
          responsible?: string | null
          therapist?: string | null
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      income_therapists: {
        Row: {
          commission_percentage: number | null
          commission_value: number | null
          created_at: string | null
          id: string
          income_id: string
          sessions_count: number | null
          therapist: string
        }
        Insert: {
          commission_percentage?: number | null
          commission_value?: number | null
          created_at?: string | null
          id?: string
          income_id: string
          sessions_count?: number | null
          therapist: string
        }
        Update: {
          commission_percentage?: number | null
          commission_value?: number | null
          created_at?: string | null
          id?: string
          income_id?: string
          sessions_count?: number | null
          therapist?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_therapists_income_id_fkey"
            columns: ["income_id"]
            isOneToOne: false
            referencedRelation: "incomes"
            referencedColumns: ["id"]
          },
        ]
      }
      incomes: {
        Row: {
          commission_percentage: number | null
          commission_value: number | null
          created_at: string | null
          date: string
          id: string
          invoice_delivered: boolean | null
          observations: string | null
          patient_name: string
          payment_method: string | null
          payment_status: string | null
          session_id: string | null
          sessions_covered: number | null
          therapist: string
          updated_at: string | null
          value: number
        }
        Insert: {
          commission_percentage?: number | null
          commission_value?: number | null
          created_at?: string | null
          date: string
          id?: string
          invoice_delivered?: boolean | null
          observations?: string | null
          patient_name: string
          payment_method?: string | null
          payment_status?: string | null
          session_id?: string | null
          sessions_covered?: number | null
          therapist: string
          updated_at?: string | null
          value: number
        }
        Update: {
          commission_percentage?: number | null
          commission_value?: number | null
          created_at?: string | null
          date?: string
          id?: string
          invoice_delivered?: boolean | null
          observations?: string | null
          patient_name?: string
          payment_method?: string | null
          payment_status?: string | null
          session_id?: string | null
          sessions_covered?: number | null
          therapist?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "incomes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_evolutions: {
        Row: {
          created_at: string | null
          evolution_text: string | null
          id: string
          patient_id: string
          updated_at: string | null
          year_month: string
        }
        Insert: {
          created_at?: string | null
          evolution_text?: string | null
          id?: string
          patient_id: string
          updated_at?: string | null
          year_month: string
        }
        Update: {
          created_at?: string | null
          evolution_text?: string | null
          id?: string
          patient_id?: string
          updated_at?: string | null
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_evolutions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          total_sessions: number
          updated_at: string | null
          validity_days: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          total_sessions: number
          updated_at?: string | null
          validity_days?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          total_sessions?: number
          updated_at?: string | null
          validity_days?: number | null
        }
        Relationships: []
      }
      patient_files: {
        Row: {
          created_at: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          patient_id: string
          uploaded_at: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          patient_id: string
          uploaded_at?: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          patient_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_files_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_packages: {
        Row: {
          created_at: string | null
          expiration_date: string | null
          id: string
          notes: string | null
          package_id: string
          patient_id: string
          purchase_date: string | null
          purchase_price: number | null
          status: string | null
          total_sessions: number
          updated_at: string | null
          used_sessions: number | null
        }
        Insert: {
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          notes?: string | null
          package_id: string
          patient_id: string
          purchase_date?: string | null
          purchase_price?: number | null
          status?: string | null
          total_sessions: number
          updated_at?: string | null
          used_sessions?: number | null
        }
        Update: {
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          notes?: string | null
          package_id?: string
          patient_id?: string
          purchase_date?: string | null
          purchase_price?: number | null
          status?: string | null
          total_sessions?: number
          updated_at?: string | null
          used_sessions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_packages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          address_complement: string | null
          address_number: string | null
          birth_date: string | null
          cep: string | null
          city: string | null
          commission_percentage: number | null
          cpf: string | null
          created_at: string | null
          days_per_week: number | null
          diagnosis: string | null
          discount: string | null
          discount_percentage: number | null
          email: string | null
          emergency_contact: string | null
          flexibility_notes: string | null
          health_plan: string | null
          id: string
          invoice_delivery: string | null
          main_therapist: string
          medical_authorization: string | null
          medical_report: string | null
          medications: string | null
          mobility_level: string | null
          name: string
          observations: string | null
          payment_day: number | null
          payment_method: string | null
          phone: string | null
          plan_number: string | null
          previous_pathologies: string | null
          requesting_doctor: string | null
          rg: string | null
          session_value: number | null
          specific_room: string | null
          state: string | null
          status: string | null
          substitute_therapist: string | null
          surgeries: string | null
          treatment_plan: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          commission_percentage?: number | null
          cpf?: string | null
          created_at?: string | null
          days_per_week?: number | null
          diagnosis?: string | null
          discount?: string | null
          discount_percentage?: number | null
          email?: string | null
          emergency_contact?: string | null
          flexibility_notes?: string | null
          health_plan?: string | null
          id?: string
          invoice_delivery?: string | null
          main_therapist: string
          medical_authorization?: string | null
          medical_report?: string | null
          medications?: string | null
          mobility_level?: string | null
          name: string
          observations?: string | null
          payment_day?: number | null
          payment_method?: string | null
          phone?: string | null
          plan_number?: string | null
          previous_pathologies?: string | null
          requesting_doctor?: string | null
          rg?: string | null
          session_value?: number | null
          specific_room?: string | null
          state?: string | null
          status?: string | null
          substitute_therapist?: string | null
          surgeries?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          commission_percentage?: number | null
          cpf?: string | null
          created_at?: string | null
          days_per_week?: number | null
          diagnosis?: string | null
          discount?: string | null
          discount_percentage?: number | null
          email?: string | null
          emergency_contact?: string | null
          flexibility_notes?: string | null
          health_plan?: string | null
          id?: string
          invoice_delivery?: string | null
          main_therapist?: string
          medical_authorization?: string | null
          medical_report?: string | null
          medications?: string | null
          mobility_level?: string | null
          name?: string
          observations?: string | null
          payment_day?: number | null
          payment_method?: string | null
          phone?: string | null
          plan_number?: string | null
          previous_pathologies?: string | null
          requesting_doctor?: string | null
          rg?: string | null
          session_value?: number | null
          specific_room?: string | null
          state?: string | null
          status?: string | null
          substitute_therapist?: string | null
          surgeries?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          attended: boolean | null
          commission_percentage: number | null
          commission_value: number | null
          created_at: string | null
          date: string
          final_pain_level: number | null
          id: string
          initial_pain_level: number | null
          invoice_delivered: boolean | null
          observations: string | null
          patient_id: string | null
          patient_name: string
          payment_method: string | null
          payment_status: string | null
          session_number: number
          session_value: number | null
          therapist: string
          updated_at: string | null
          was_reimbursed: boolean | null
        }
        Insert: {
          attended?: boolean | null
          commission_percentage?: number | null
          commission_value?: number | null
          created_at?: string | null
          date: string
          final_pain_level?: number | null
          id?: string
          initial_pain_level?: number | null
          invoice_delivered?: boolean | null
          observations?: string | null
          patient_id?: string | null
          patient_name: string
          payment_method?: string | null
          payment_status?: string | null
          session_number: number
          session_value?: number | null
          therapist: string
          updated_at?: string | null
          was_reimbursed?: boolean | null
        }
        Update: {
          attended?: boolean | null
          commission_percentage?: number | null
          commission_value?: number | null
          created_at?: string | null
          date?: string
          final_pain_level?: number | null
          id?: string
          initial_pain_level?: number | null
          invoice_delivered?: boolean | null
          observations?: string | null
          patient_id?: string | null
          patient_name?: string
          payment_method?: string | null
          payment_status?: string | null
          session_number?: number
          session_value?: number | null
          therapist?: string
          updated_at?: string | null
          was_reimbursed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
      app_role: ["admin", "user"],
    },
  },
} as const
