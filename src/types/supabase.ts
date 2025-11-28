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
      labs: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      radiology: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      medications: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      visit_labs: {
        Row: {
          id: string
          visit_id: string
          lab_id: string
          status: string
          ordered_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          visit_id: string
          lab_id: string
          status?: string
          ordered_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          visit_id?: string
          lab_id?: string
          status?: string
          ordered_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_labs_lab_id_fkey"
            columns: ["lab_id"]
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_labs_visit_id_fkey"
            columns: ["visit_id"]
            referencedRelation: "visits"
            referencedColumns: ["id"]
          }
        ]
      }
      visit_radiology: {
        Row: {
          id: string
          visit_id: string
          radiology_id: string
          status: string
          ordered_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          visit_id: string
          radiology_id: string
          status?: string
          ordered_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          visit_id?: string
          radiology_id?: string
          status?: string
          ordered_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_radiology_radiology_id_fkey"
            columns: ["radiology_id"]
            referencedRelation: "radiology"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_radiology_visit_id_fkey"
            columns: ["visit_id"]
            referencedRelation: "visits"
            referencedColumns: ["id"]
          }
        ]
      }
      visit_medications: {
        Row: {
          id: string
          visit_id: string
          medication_id: string
          status: string
          prescribed_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          visit_id: string
          medication_id: string
          status?: string
          prescribed_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          visit_id?: string
          medication_id?: string
          status?: string
          prescribed_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_medications_medication_id_fkey"
            columns: ["medication_id"]
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_medications_visit_id_fkey"
            columns: ["visit_id"]
            referencedRelation: "visits"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      begin_transaction: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      commit_transaction: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      rollback_transaction: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
    }
  }
} 