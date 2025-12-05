// Temporary types to fix build errors until Supabase types are regenerated
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: any
        Insert: any
        Update: any
        Relationships: any[]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Temporary types for common entities
export interface Patient {
  id: string
  name: string
  patients_id: string
  insurance_person_no?: string
  visit_surgeries?: any[]
}

export interface Visit {
  id: string
  visit_id: string
  reason_for_visit?: string
  admission_date?: string
  surgery_date?: string
  discharge_date?: string
  sst_treatment?: string
  remark1?: string
  remark2?: string
}

export interface Medication {
  id: string
  name: string
}

export interface DocumentType {
  document_type_id: string
  file_type: string
  is_uploaded: boolean
  file_name?: string
  file_path?: string
  uploaded_at?: string
  remark_reason?: string
}