export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      aging_snapshots: {
        Row: {
          bucket_0_30: number | null
          bucket_181_365: number | null
          bucket_31_60: number | null
          bucket_365_plus: number | null
          bucket_61_90: number | null
          bucket_91_180: number | null
          created_at: string | null
          id: string
          patient_id: string | null
          snapshot_date: string
          total_outstanding: number
        }
        Insert: {
          bucket_0_30?: number | null
          bucket_181_365?: number | null
          bucket_31_60?: number | null
          bucket_365_plus?: number | null
          bucket_61_90?: number | null
          bucket_91_180?: number | null
          created_at?: string | null
          id?: string
          patient_id?: string | null
          snapshot_date: string
          total_outstanding: number
        }
        Update: {
          bucket_0_30?: number | null
          bucket_181_365?: number | null
          bucket_31_60?: number | null
          bucket_365_plus?: number | null
          bucket_61_90?: number | null
          bucket_91_180?: number | null
          created_at?: string | null
          id?: string
          patient_id?: string | null
          snapshot_date?: string
          total_outstanding?: number
        }
        Relationships: [
          {
            foreignKeyName: "aging_snapshots_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_clinical_recommendations: {
        Row: {
          ai_model: string | null
          applied_at: string | null
          complications: Json | null
          confidence_score: number | null
          created_at: string | null
          diagnosis_text: string | null
          generated_at: string | null
          id: string
          lab_tests: Json | null
          medications: Json | null
          notes: string | null
          prompt_version: string | null
          radiology_procedures: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          selected_complications: Json | null
          status: string | null
          surgery_names: string[] | null
          updated_at: string | null
          visit_id: string
        }
        Insert: {
          ai_model?: string | null
          applied_at?: string | null
          complications?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          diagnosis_text?: string | null
          generated_at?: string | null
          id?: string
          lab_tests?: Json | null
          medications?: Json | null
          notes?: string | null
          prompt_version?: string | null
          radiology_procedures?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selected_complications?: Json | null
          status?: string | null
          surgery_names?: string[] | null
          updated_at?: string | null
          visit_id: string
        }
        Update: {
          ai_model?: string | null
          applied_at?: string | null
          complications?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          diagnosis_text?: string | null
          generated_at?: string | null
          id?: string
          lab_tests?: Json | null
          medications?: Json | null
          notes?: string | null
          prompt_version?: string | null
          radiology_procedures?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selected_complications?: Json | null
          status?: string | null
          surgery_names?: string[] | null
          updated_at?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_clinical_recommendations_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_trail: {
        Row: {
          action: string
          bill_id: string
          changed_by: string | null
          changes: Json | null
          id: string
          timestamp: string
        }
        Insert: {
          action: string
          bill_id: string
          changed_by?: string | null
          changes?: Json | null
          id?: string
          timestamp?: string
        }
        Update: {
          action?: string
          bill_id?: string
          changed_by?: string | null
          changes?: Json | null
          id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_line_items: {
        Row: {
          amount: number | null
          base_amount: number | null
          bill_id: string
          bill_section_id: string | null
          cghs_nabh_code: string | null
          cghs_nabh_rate: number | null
          created_at: string
          dates_info: string | null
          id: string
          item_description: string
          item_order: number
          item_type: string | null
          primary_adjustment: string | null
          qty: number | null
          secondary_adjustment: string | null
          sr_no: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          base_amount?: number | null
          bill_id: string
          bill_section_id?: string | null
          cghs_nabh_code?: string | null
          cghs_nabh_rate?: number | null
          created_at?: string
          dates_info?: string | null
          id?: string
          item_description: string
          item_order?: number
          item_type?: string | null
          primary_adjustment?: string | null
          qty?: number | null
          secondary_adjustment?: string | null
          sr_no: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          base_amount?: number | null
          bill_id?: string
          bill_section_id?: string | null
          cghs_nabh_code?: string | null
          cghs_nabh_rate?: number | null
          created_at?: string
          dates_info?: string | null
          id?: string
          item_description?: string
          item_order?: number
          item_type?: string | null
          primary_adjustment?: string | null
          qty?: number | null
          secondary_adjustment?: string | null
          sr_no?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_line_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_line_items_bill_section_id_fkey"
            columns: ["bill_section_id"]
            isOneToOne: false
            referencedRelation: "bill_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_sections: {
        Row: {
          bill_id: string
          created_at: string
          date_from: string | null
          date_to: string | null
          id: string
          section_order: number
          section_title: string
          updated_at: string
        }
        Insert: {
          bill_id: string
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          id?: string
          section_order?: number
          section_title: string
          updated_at?: string
        }
        Update: {
          bill_id?: string
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          id?: string
          section_order?: number
          section_title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_sections_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          bill_no: string
          category: string
          claim_id: string
          created_at: string
          date: string
          id: string
          patient_id: string
          status: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          bill_no: string
          category?: string
          claim_id: string
          created_at?: string
          date?: string
          id?: string
          patient_id: string
          status?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          bill_no?: string
          category?: string
          claim_id?: string
          created_at?: string
          date?: string
          id?: string
          patient_id?: string
          status?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      cghs_surgery: {
        Row: {
          bhopal_nabh_rate: string | null
          bhopal_non_nabh_rate: string | null
          category: string | null
          code: string | null
          cost: string | null
          created_at: string | null
          description: string | null
          id: string
          NABH_NABL_Rate: string | null
          name: string
          Non_NABH_NABL_Rate: string | null
          private: string | null
          Procedure_Name: string | null
          Revised_Date: string | null
          updated_at: string | null
        }
        Insert: {
          bhopal_nabh_rate?: string | null
          bhopal_non_nabh_rate?: string | null
          category?: string | null
          code?: string | null
          cost?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          NABH_NABL_Rate?: string | null
          name: string
          Non_NABH_NABL_Rate?: string | null
          private?: string | null
          Procedure_Name?: string | null
          Revised_Date?: string | null
          updated_at?: string | null
        }
        Update: {
          bhopal_nabh_rate?: string | null
          bhopal_non_nabh_rate?: string | null
          category?: string | null
          code?: string | null
          cost?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          NABH_NABL_Rate?: string | null
          name?: string
          Non_NABH_NABL_Rate?: string | null
          private?: string | null
          Procedure_Name?: string | null
          Revised_Date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          account_code: string
          account_group: string | null
          account_name: string
          account_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          opening_balance: number | null
          opening_balance_type: string | null
          parent_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_code: string
          account_group?: string | null
          account_name: string
          account_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          opening_balance?: number | null
          opening_balance_type?: string | null
          parent_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_code?: string
          account_group?: string | null
          account_name?: string
          account_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          opening_balance?: number | null
          opening_balance_type?: string | null
          parent_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      complications: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_balances: {
        Row: {
          account_id: string | null
          balance_date: string
          balance_type: string | null
          closing_balance: number | null
          created_at: string | null
          credit_total: number | null
          debit_total: number | null
          id: string
          opening_balance: number | null
        }
        Insert: {
          account_id?: string | null
          balance_date: string
          balance_type?: string | null
          closing_balance?: number | null
          created_at?: string | null
          credit_total?: number | null
          debit_total?: number | null
          id?: string
          opening_balance?: number | null
        }
        Update: {
          account_id?: string | null
          balance_date?: string
          balance_type?: string | null
          closing_balance?: number | null
          created_at?: string | null
          credit_total?: number | null
          debit_total?: number | null
          id?: string
          opening_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_balances_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnoses: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "diagnosis_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosis_categories: {
        Row: {
          active: boolean | null
          color_code: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dicom_studies: {
        Row: {
          accession_number: string | null
          appointment_id: string | null
          archive_location: string | null
          archived: boolean | null
          artifact_description: string | null
          artifacts_present: boolean | null
          body_part_examined: string | null
          created_at: string | null
          id: string
          image_count: number | null
          modality: string
          order_id: string | null
          pacs_location: string | null
          patient_id: string
          patient_position: string | null
          performing_physician: string | null
          quality_score: number | null
          referring_physician: string | null
          series_count: number | null
          study_date: string
          study_description: string | null
          study_instance_uid: string
          study_size_mb: number | null
          study_time: string | null
          technical_adequacy: string | null
          updated_at: string | null
          view_position: string | null
        }
        Insert: {
          accession_number?: string | null
          appointment_id?: string | null
          archive_location?: string | null
          archived?: boolean | null
          artifact_description?: string | null
          artifacts_present?: boolean | null
          body_part_examined?: string | null
          created_at?: string | null
          id?: string
          image_count?: number | null
          modality: string
          order_id?: string | null
          pacs_location?: string | null
          patient_id: string
          patient_position?: string | null
          performing_physician?: string | null
          quality_score?: number | null
          referring_physician?: string | null
          series_count?: number | null
          study_date: string
          study_description?: string | null
          study_instance_uid: string
          study_size_mb?: number | null
          study_time?: string | null
          technical_adequacy?: string | null
          updated_at?: string | null
          view_position?: string | null
        }
        Update: {
          accession_number?: string | null
          appointment_id?: string | null
          archive_location?: string | null
          archived?: boolean | null
          artifact_description?: string | null
          artifacts_present?: boolean | null
          body_part_examined?: string | null
          created_at?: string | null
          id?: string
          image_count?: number | null
          modality?: string
          order_id?: string | null
          pacs_location?: string | null
          patient_id?: string
          patient_position?: string | null
          performing_physician?: string | null
          quality_score?: number | null
          referring_physician?: string | null
          series_count?: number | null
          study_date?: string
          study_description?: string | null
          study_instance_uid?: string
          study_size_mb?: number | null
          study_time?: string | null
          technical_adequacy?: string | null
          updated_at?: string | null
          view_position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dicom_studies_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "radiology_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dicom_studies_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "radiology_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      discharge_checklist: {
        Row: {
          authorized_at: string | null
          authorized_by: string | null
          created_at: string | null
          discharge_mode: string | null
          discharge_summary_uploaded: boolean | null
          doctor_signature: boolean | null
          final_bill_generated: boolean | null
          final_bill_printed: boolean | null
          gate_pass_generated: boolean | null
          id: string
          notes: string | null
          nurse_clearance: boolean | null
          patient_signature: boolean | null
          payment_verified: boolean | null
          pharmacy_clearance: boolean | null
          security_verification: boolean | null
          updated_at: string | null
          visit_id: string
        }
        Insert: {
          authorized_at?: string | null
          authorized_by?: string | null
          created_at?: string | null
          discharge_mode?: string | null
          discharge_summary_uploaded?: boolean | null
          doctor_signature?: boolean | null
          final_bill_generated?: boolean | null
          final_bill_printed?: boolean | null
          gate_pass_generated?: boolean | null
          id?: string
          notes?: string | null
          nurse_clearance?: boolean | null
          patient_signature?: boolean | null
          payment_verified?: boolean | null
          pharmacy_clearance?: boolean | null
          security_verification?: boolean | null
          updated_at?: string | null
          visit_id: string
        }
        Update: {
          authorized_at?: string | null
          authorized_by?: string | null
          created_at?: string | null
          discharge_mode?: string | null
          discharge_summary_uploaded?: boolean | null
          doctor_signature?: boolean | null
          final_bill_generated?: boolean | null
          final_bill_printed?: boolean | null
          gate_pass_generated?: boolean | null
          id?: string
          notes?: string | null
          nurse_clearance?: boolean | null
          patient_signature?: boolean | null
          payment_verified?: boolean | null
          pharmacy_clearance?: boolean | null
          security_verification?: boolean | null
          updated_at?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discharge_checklist_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_assignments: {
        Row: {
          bill_id: string
          consultation_end: string
          consultation_start: string
          created_at: string
          doctor_name: string
          id: string
          specialization: string | null
        }
        Insert: {
          bill_id: string
          consultation_end: string
          consultation_start: string
          created_at?: string
          doctor_name: string
          id?: string
          specialization?: string | null
        }
        Update: {
          bill_id?: string
          consultation_end?: string
          consultation_start?: string
          created_at?: string
          doctor_name?: string
          id?: string
          specialization?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_assignments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_plan: {
        Row: {
          accommodation: string | null
          additional_approval_investigation: string | null
          additional_approval_investigation_date: string | null
          additional_approval_surgery: string | null
          additional_approval_surgery_date: string | null
          created_at: string | null
          date_of_stay: string | null
          day_number: number
          extension_stay_approval: string | null
          extension_stay_approval_date: string | null
          id: number
          lab_and_radiology: string | null
          medication: string | null
          updated_at: string | null
          visit_id: string
        }
        Insert: {
          accommodation?: string | null
          additional_approval_investigation?: string | null
          additional_approval_investigation_date?: string | null
          additional_approval_surgery?: string | null
          additional_approval_surgery_date?: string | null
          created_at?: string | null
          date_of_stay?: string | null
          day_number: number
          extension_stay_approval?: string | null
          extension_stay_approval_date?: string | null
          id?: never
          lab_and_radiology?: string | null
          medication?: string | null
          updated_at?: string | null
          visit_id: string
        }
        Update: {
          accommodation?: string | null
          additional_approval_investigation?: string | null
          additional_approval_investigation_date?: string | null
          additional_approval_surgery?: string | null
          additional_approval_surgery_date?: string | null
          created_at?: string | null
          date_of_stay?: string | null
          day_number?: number
          extension_stay_approval?: string | null
          extension_stay_approval_date?: string | null
          id?: never
          lab_and_radiology?: string | null
          medication?: string | null
          updated_at?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_plan_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          id: string
          last_sterilized: string | null
          manufacturer: string | null
          model: string | null
          name: string
          quantity_available: number
          status: string
          theatre_id: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          last_sterilized?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          quantity_available?: number
          status?: string
          theatre_id?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          last_sterilized?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          quantity_available?: number
          status?: string
          theatre_id?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_theatre_id_fkey"
            columns: ["theatre_id"]
            isOneToOne: false
            referencedRelation: "operation_theatres"
            referencedColumns: ["id"]
          },
        ]
      }
      esic_surgeons: {
        Row: {
          contact_info: string | null
          created_at: string
          department: string | null
          id: string
          name: string
          specialty: string | null
          updated_at: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          department?: string | null
          id?: string
          name: string
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          department?: string | null
          id?: string
          name?: string
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      external_labs: {
        Row: {
          address: string | null
          contact_person: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string | null
          email: string | null
          id: string
          interface_type: string | null
          is_active: boolean | null
          lab_code: string
          lab_name: string
          lis_connection_details: Json | null
          phone: string | null
          pricing_structure: Json | null
          speciality_areas: string[] | null
          turnaround_time_hours: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          interface_type?: string | null
          is_active?: boolean | null
          lab_code: string
          lab_name: string
          lis_connection_details?: Json | null
          phone?: string | null
          pricing_structure?: Json | null
          speciality_areas?: string[] | null
          turnaround_time_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          interface_type?: string | null
          is_active?: boolean | null
          lab_code?: string
          lab_name?: string
          lis_connection_details?: Json | null
          phone?: string | null
          pricing_structure?: Json | null
          speciality_areas?: string[] | null
          turnaround_time_hours?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gate_passes: {
        Row: {
          barcode_data: string | null
          bill_paid: boolean | null
          billing_officer_signature: string | null
          created_at: string | null
          discharge_date: string
          discharge_mode: string
          gate_pass_number: string
          id: string
          is_active: boolean | null
          patient_id: string
          patient_name: string
          payment_amount: number | null
          receptionist_signature: string | null
          security_verified: boolean | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
          visit_id: string
        }
        Insert: {
          barcode_data?: string | null
          bill_paid?: boolean | null
          billing_officer_signature?: string | null
          created_at?: string | null
          discharge_date: string
          discharge_mode?: string
          gate_pass_number: string
          id?: string
          is_active?: boolean | null
          patient_id: string
          patient_name: string
          payment_amount?: number | null
          receptionist_signature?: string | null
          security_verified?: boolean | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          visit_id: string
        }
        Update: {
          barcode_data?: string | null
          bill_paid?: boolean | null
          billing_officer_signature?: string | null
          created_at?: string | null
          discharge_date?: string
          discharge_mode?: string
          gate_pass_number?: string
          id?: string
          is_active?: boolean | null
          patient_id?: string
          patient_name?: string
          payment_amount?: number | null
          receptionist_signature?: string | null
          security_verified?: boolean | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gate_passes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gate_passes_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      hope_consultants: {
        Row: {
          contact_info: string | null
          created_at: string
          department: string | null
          id: string
          name: string
          nabh_rate: number | null
          non_nabh_rate: number | null
          private_rate: number | null
          specialty: string | null
          tpa_rate: number | null
          updated_at: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          department?: string | null
          id?: string
          name: string
          nabh_rate?: number | null
          non_nabh_rate?: number | null
          private_rate?: number | null
          specialty?: string | null
          tpa_rate?: number | null
          updated_at?: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          department?: string | null
          id?: string
          name?: string
          nabh_rate?: number | null
          non_nabh_rate?: number | null
          private_rate?: number | null
          specialty?: string | null
          tpa_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      hope_surgeons: {
        Row: {
          contact_info: string | null
          created_at: string
          department: string | null
          id: string
          name: string
          nabh_rate: number | null
          "non-nabh_rate": number | null
          private_rate: number | null
          specialty: string | null
          tpa_rate: number | null
          updated_at: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          department?: string | null
          id?: string
          name: string
          nabh_rate?: number | null
          "non-nabh_rate"?: number | null
          private_rate?: number | null
          specialty?: string | null
          tpa_rate?: number | null
          updated_at?: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          department?: string | null
          id?: string
          name?: string
          nabh_rate?: number | null
          "non-nabh_rate"?: number | null
          private_rate?: number | null
          specialty?: string | null
          tpa_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      intra_op_notes: {
        Row: {
          anesthesia_type: string
          anesthesiologist: string
          assistants: string[] | null
          blood_loss: number | null
          complications: string | null
          created_at: string | null
          end_time: string | null
          fluids_given: string | null
          id: string
          implants_used: string[] | null
          notes: string | null
          ot_patient_id: string | null
          procedure_performed: string
          specimens_collected: string[] | null
          start_time: string
          surgeon: string
          updated_at: string | null
        }
        Insert: {
          anesthesia_type: string
          anesthesiologist: string
          assistants?: string[] | null
          blood_loss?: number | null
          complications?: string | null
          created_at?: string | null
          end_time?: string | null
          fluids_given?: string | null
          id?: string
          implants_used?: string[] | null
          notes?: string | null
          ot_patient_id?: string | null
          procedure_performed: string
          specimens_collected?: string[] | null
          start_time: string
          surgeon: string
          updated_at?: string | null
        }
        Update: {
          anesthesia_type?: string
          anesthesiologist?: string
          assistants?: string[] | null
          blood_loss?: number | null
          complications?: string | null
          created_at?: string | null
          end_time?: string | null
          fluids_given?: string | null
          id?: string
          implants_used?: string[] | null
          notes?: string | null
          ot_patient_id?: string | null
          procedure_performed?: string
          specimens_collected?: string[] | null
          start_time?: string
          surgeon?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intra_op_notes_ot_patient_id_fkey"
            columns: ["ot_patient_id"]
            isOneToOne: false
            referencedRelation: "active_ot_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intra_op_notes_ot_patient_id_fkey"
            columns: ["ot_patient_id"]
            isOneToOne: false
            referencedRelation: "ot_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          batch_number: string | null
          category: string
          created_at: string | null
          current_stock: number
          expiry_date: string | null
          id: string
          last_restocked: string | null
          last_sterilized: string | null
          max_stock_level: number
          min_stock_level: number
          name: string
          sterilization_required: boolean | null
          supplier: string
          unit_cost: number
          updated_at: string | null
          usage_per_day: number | null
        }
        Insert: {
          batch_number?: string | null
          category: string
          created_at?: string | null
          current_stock?: number
          expiry_date?: string | null
          id?: string
          last_restocked?: string | null
          last_sterilized?: string | null
          max_stock_level?: number
          min_stock_level?: number
          name: string
          sterilization_required?: boolean | null
          supplier: string
          unit_cost?: number
          updated_at?: string | null
          usage_per_day?: number | null
        }
        Update: {
          batch_number?: string | null
          category?: string
          created_at?: string | null
          current_stock?: number
          expiry_date?: string | null
          id?: string
          last_restocked?: string | null
          last_sterilized?: string | null
          max_stock_level?: number
          min_stock_level?: number
          name?: string
          sterilization_required?: boolean | null
          supplier?: string
          unit_cost?: number
          updated_at?: string | null
          usage_per_day?: number | null
        }
        Relationships: []
      }
      item_stock: {
        Row: {
          batch_number: string | null
          cost_price: number | null
          cst: number | null
          expiry_date: string | null
          id: number
          is_deleted: boolean | null
          item_id: number | null
          location_id: number | null
          loose_stock: number | null
          mrp: number | null
          mstpflag: boolean | null
          purchase_price: number | null
          sale_price: number | null
          stock: number | null
          tax: number | null
          vat_class_id: number | null
          vat_class_name: string | null
          vat_sat_sum: number | null
        }
        Insert: {
          batch_number?: string | null
          cost_price?: number | null
          cst?: number | null
          expiry_date?: string | null
          id?: number
          is_deleted?: boolean | null
          item_id?: number | null
          location_id?: number | null
          loose_stock?: number | null
          mrp?: number | null
          mstpflag?: boolean | null
          purchase_price?: number | null
          sale_price?: number | null
          stock?: number | null
          tax?: number | null
          vat_class_id?: number | null
          vat_class_name?: string | null
          vat_sat_sum?: number | null
        }
        Update: {
          batch_number?: string | null
          cost_price?: number | null
          cst?: number | null
          expiry_date?: string | null
          id?: number
          is_deleted?: boolean | null
          item_id?: number | null
          location_id?: number | null
          loose_stock?: number | null
          mrp?: number | null
          mstpflag?: boolean | null
          purchase_price?: number | null
          sale_price?: number | null
          stock?: number | null
          tax?: number | null
          vat_class_id?: number | null
          vat_class_name?: string | null
          vat_sat_sum?: number | null
        }
        Relationships: []
      }
      lab: {
        Row: {
          attach_file: boolean | null
          attributes: Json | null
          category: string | null
          CGHS_code: string | null
          cpt_code: string | null
          created_at: string
          default_result: string | null
          description: string | null
          icd_10_code: string | null
          id: string
          interface_code: string | null
          is_header: boolean | null
          loinc_code: string | null
          machine_name: string | null
          map_test_to_service: string | null
          NABH_rates_in_rupee: string | null
          name: string
          "Non-NABH_rates_in_rupee": string | null
          note_opinion_display_text: string | null
          note_opinion_template: string | null
          parameter_panel_test: string | null
          preparation_time: string | null
          rsby_code: string | null
          sample_type: string | null
          service_group: string | null
          set_as_default: boolean | null
          short_form: string | null
          speciality: string | null
          specific_instruction_for_preparation: string | null
          sub_specialty: string | null
          tariff_list_id: number | null
          tariff_list_name: string | null
          test_method: string | null
          test_order: string | null
          test_result_help: string | null
          title_machine_name: string | null
          updated_at: string
        }
        Insert: {
          attach_file?: boolean | null
          attributes?: Json | null
          category?: string | null
          CGHS_code?: string | null
          cpt_code?: string | null
          created_at?: string
          default_result?: string | null
          description?: string | null
          icd_10_code?: string | null
          id?: string
          interface_code?: string | null
          is_header?: boolean | null
          loinc_code?: string | null
          machine_name?: string | null
          map_test_to_service?: string | null
          NABH_rates_in_rupee?: string | null
          name: string
          "Non-NABH_rates_in_rupee"?: string | null
          note_opinion_display_text?: string | null
          note_opinion_template?: string | null
          parameter_panel_test?: string | null
          preparation_time?: string | null
          rsby_code?: string | null
          sample_type?: string | null
          service_group?: string | null
          set_as_default?: boolean | null
          short_form?: string | null
          speciality?: string | null
          specific_instruction_for_preparation?: string | null
          sub_specialty?: string | null
          tariff_list_id?: number | null
          tariff_list_name?: string | null
          test_method?: string | null
          test_order?: string | null
          test_result_help?: string | null
          title_machine_name?: string | null
          updated_at?: string
        }
        Update: {
          attach_file?: boolean | null
          attributes?: Json | null
          category?: string | null
          CGHS_code?: string | null
          cpt_code?: string | null
          created_at?: string
          default_result?: string | null
          description?: string | null
          icd_10_code?: string | null
          id?: string
          interface_code?: string | null
          is_header?: boolean | null
          loinc_code?: string | null
          machine_name?: string | null
          map_test_to_service?: string | null
          NABH_rates_in_rupee?: string | null
          name?: string
          "Non-NABH_rates_in_rupee"?: string | null
          note_opinion_display_text?: string | null
          note_opinion_template?: string | null
          parameter_panel_test?: string | null
          preparation_time?: string | null
          rsby_code?: string | null
          sample_type?: string | null
          service_group?: string | null
          set_as_default?: boolean | null
          short_form?: string | null
          speciality?: string | null
          specific_instruction_for_preparation?: string | null
          sub_specialty?: string | null
          tariff_list_id?: number | null
          tariff_list_name?: string | null
          test_method?: string | null
          test_order?: string | null
          test_result_help?: string | null
          title_machine_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lab_departments: {
        Row: {
          created_at: string | null
          department_code: string
          department_name: string
          description: string | null
          email: string | null
          head_of_department: string | null
          id: string
          is_active: boolean | null
          location: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_code: string
          department_name: string
          description?: string | null
          email?: string | null
          head_of_department?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_code?: string
          department_name?: string
          description?: string | null
          email?: string | null
          head_of_department?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lab_equipment: {
        Row: {
          calibration_frequency_days: number | null
          created_at: string | null
          department_id: string | null
          equipment_code: string
          equipment_name: string
          equipment_notes: string | null
          equipment_status: string | null
          id: string
          interface_type: string | null
          is_interfaced: boolean | null
          last_calibration_date: string | null
          last_maintenance_date: string | null
          location: string | null
          maintenance_frequency_days: number | null
          manufacturer: string | null
          model: string | null
          next_calibration_date: string | null
          next_maintenance_date: string | null
          room_number: string | null
          serial_number: string | null
          service_contact: string | null
          service_provider: string | null
          updated_at: string | null
          warranty_expiry_date: string | null
        }
        Insert: {
          calibration_frequency_days?: number | null
          created_at?: string | null
          department_id?: string | null
          equipment_code: string
          equipment_name: string
          equipment_notes?: string | null
          equipment_status?: string | null
          id?: string
          interface_type?: string | null
          is_interfaced?: boolean | null
          last_calibration_date?: string | null
          last_maintenance_date?: string | null
          location?: string | null
          maintenance_frequency_days?: number | null
          manufacturer?: string | null
          model?: string | null
          next_calibration_date?: string | null
          next_maintenance_date?: string | null
          room_number?: string | null
          serial_number?: string | null
          service_contact?: string | null
          service_provider?: string | null
          updated_at?: string | null
          warranty_expiry_date?: string | null
        }
        Update: {
          calibration_frequency_days?: number | null
          created_at?: string | null
          department_id?: string | null
          equipment_code?: string
          equipment_name?: string
          equipment_notes?: string | null
          equipment_status?: string | null
          id?: string
          interface_type?: string | null
          is_interfaced?: boolean | null
          last_calibration_date?: string | null
          last_maintenance_date?: string | null
          location?: string | null
          maintenance_frequency_days?: number | null
          manufacturer?: string | null
          model?: string | null
          next_calibration_date?: string | null
          next_maintenance_date?: string | null
          room_number?: string | null
          serial_number?: string | null
          service_contact?: string | null
          service_provider?: string | null
          updated_at?: string | null
          warranty_expiry_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_equipment_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "lab_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_orders: {
        Row: {
          cancellation_reason: string | null
          clinical_history: string | null
          collected_by: string | null
          collection_date: string | null
          collection_location: string | null
          collection_time: string | null
          created_at: string | null
          created_by: string | null
          discount_amount: number | null
          doctor_id: string | null
          final_amount: number | null
          icd_codes: string[] | null
          id: string
          internal_notes: string | null
          order_date: string | null
          order_number: string
          order_status: string | null
          order_time: string | null
          order_type: string | null
          ordering_doctor: string
          patient_age: number | null
          patient_gender: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          payment_method: string | null
          payment_status: string | null
          priority: string | null
          provisional_diagnosis: string | null
          referring_facility: string | null
          report_dispatch_datetime: string | null
          results_ready_datetime: string | null
          sample_collection_datetime: string | null
          sample_received_datetime: string | null
          special_instructions: string | null
          total_amount: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          clinical_history?: string | null
          collected_by?: string | null
          collection_date?: string | null
          collection_location?: string | null
          collection_time?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          doctor_id?: string | null
          final_amount?: number | null
          icd_codes?: string[] | null
          id?: string
          internal_notes?: string | null
          order_date?: string | null
          order_number: string
          order_status?: string | null
          order_time?: string | null
          order_type?: string | null
          ordering_doctor: string
          patient_age?: number | null
          patient_gender?: string | null
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
          payment_method?: string | null
          payment_status?: string | null
          priority?: string | null
          provisional_diagnosis?: string | null
          referring_facility?: string | null
          report_dispatch_datetime?: string | null
          results_ready_datetime?: string | null
          sample_collection_datetime?: string | null
          sample_received_datetime?: string | null
          special_instructions?: string | null
          total_amount?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          clinical_history?: string | null
          collected_by?: string | null
          collection_date?: string | null
          collection_location?: string | null
          collection_time?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          doctor_id?: string | null
          final_amount?: number | null
          icd_codes?: string[] | null
          id?: string
          internal_notes?: string | null
          order_date?: string | null
          order_number?: string
          order_status?: string | null
          order_time?: string | null
          order_type?: string | null
          ordering_doctor?: string
          patient_age?: number | null
          patient_gender?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          payment_method?: string | null
          payment_status?: string | null
          priority?: string | null
          provisional_diagnosis?: string | null
          referring_facility?: string | null
          report_dispatch_datetime?: string | null
          results_ready_datetime?: string | null
          sample_collection_datetime?: string | null
          sample_received_datetime?: string | null
          special_instructions?: string | null
          total_amount?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_parameters: {
        Row: {
          by_age_between_num_gret_years: string | null
          by_age_between_num_less_years: string | null
          by_age_between_years: string | null
          by_age_between_years_default_result: string | null
          by_age_between_years_lower_limit: string | null
          by_age_between_years_upper_limit: string | null
          by_age_days_between: string | null
          by_age_days_less: string | null
          by_age_days_less_female: string | null
          by_age_days_more: string | null
          by_age_days_more_female: string | null
          by_age_less_years: string | null
          by_age_less_years_female: string | null
          by_age_more_years: string | null
          by_age_more_years_female: string | null
          by_age_num_gret_years_default_result: string | null
          by_age_num_gret_years_default_result_female: string | null
          by_age_num_gret_years_lower_limit: string | null
          by_age_num_gret_years_lower_limit_female: string | null
          by_age_num_gret_years_upper_limit: string | null
          by_age_num_gret_years_upper_limit_female: string | null
          by_age_num_less_years: string | null
          by_age_num_less_years_default_result: string | null
          by_age_num_less_years_default_result_female: string | null
          by_age_num_less_years_female: string | null
          by_age_num_less_years_lower_limit: string | null
          by_age_num_less_years_lower_limit_female: string | null
          by_age_num_less_years_upper_limit: string | null
          by_age_num_less_years_upper_limit_female: string | null
          by_age_num_more_years: string | null
          by_age_num_more_years_female: string | null
          by_age_sex: string | null
          by_gender_age: string | null
          by_gender_child: string | null
          by_gender_child_default_result: string | null
          by_gender_child_lower_limit: string | null
          by_gender_child_upper_limit: string | null
          by_gender_female: string | null
          by_gender_female_default_result: string | null
          by_gender_female_lower_limit: string | null
          by_gender_female_upper_limit: string | null
          by_gender_male: string | null
          by_gender_male_default_result: string | null
          by_gender_male_lower_limit: string | null
          by_gender_male_upper_limit: string | null
          by_range_between: boolean | null
          by_range_between_interpretation: string | null
          by_range_between_lower_limit: string | null
          by_range_between_upper_limit: string | null
          by_range_greater_than: boolean | null
          by_range_greater_than_interpretation: string | null
          by_range_greater_than_limit: string | null
          by_range_less_than: boolean | null
          by_range_less_than_interpretation: string | null
          by_range_less_than_limit: string | null
          by_range_positive_negative: string | null
          create_time: string
          created_by: number
          culture_group_id: string
          decimal: number | null
          formula: string | null
          formula_text: string | null
          id: number
          interface_code: string | null
          is_descriptive: boolean | null
          is_formula: boolean | null
          is_mandatory: boolean | null
          is_multiple_options: boolean
          lab_id: string
          laboratory_categories_id: number | null
          location_id: number
          modified_by: number
          modify_time: string
          multiply_by: number | null
          name: string
          parameter_text: string | null
          sort_attribute: number | null
          sort_category: number | null
          type: string
          unit: string
          unit_txt: string | null
        }
        Insert: {
          by_age_between_num_gret_years?: string | null
          by_age_between_num_less_years?: string | null
          by_age_between_years?: string | null
          by_age_between_years_default_result?: string | null
          by_age_between_years_lower_limit?: string | null
          by_age_between_years_upper_limit?: string | null
          by_age_days_between?: string | null
          by_age_days_less?: string | null
          by_age_days_less_female?: string | null
          by_age_days_more?: string | null
          by_age_days_more_female?: string | null
          by_age_less_years?: string | null
          by_age_less_years_female?: string | null
          by_age_more_years?: string | null
          by_age_more_years_female?: string | null
          by_age_num_gret_years_default_result?: string | null
          by_age_num_gret_years_default_result_female?: string | null
          by_age_num_gret_years_lower_limit?: string | null
          by_age_num_gret_years_lower_limit_female?: string | null
          by_age_num_gret_years_upper_limit?: string | null
          by_age_num_gret_years_upper_limit_female?: string | null
          by_age_num_less_years?: string | null
          by_age_num_less_years_default_result?: string | null
          by_age_num_less_years_default_result_female?: string | null
          by_age_num_less_years_female?: string | null
          by_age_num_less_years_lower_limit?: string | null
          by_age_num_less_years_lower_limit_female?: string | null
          by_age_num_less_years_upper_limit?: string | null
          by_age_num_less_years_upper_limit_female?: string | null
          by_age_num_more_years?: string | null
          by_age_num_more_years_female?: string | null
          by_age_sex?: string | null
          by_gender_age?: string | null
          by_gender_child?: string | null
          by_gender_child_default_result?: string | null
          by_gender_child_lower_limit?: string | null
          by_gender_child_upper_limit?: string | null
          by_gender_female?: string | null
          by_gender_female_default_result?: string | null
          by_gender_female_lower_limit?: string | null
          by_gender_female_upper_limit?: string | null
          by_gender_male?: string | null
          by_gender_male_default_result?: string | null
          by_gender_male_lower_limit?: string | null
          by_gender_male_upper_limit?: string | null
          by_range_between?: boolean | null
          by_range_between_interpretation?: string | null
          by_range_between_lower_limit?: string | null
          by_range_between_upper_limit?: string | null
          by_range_greater_than?: boolean | null
          by_range_greater_than_interpretation?: string | null
          by_range_greater_than_limit?: string | null
          by_range_less_than?: boolean | null
          by_range_less_than_interpretation?: string | null
          by_range_less_than_limit?: string | null
          by_range_positive_negative?: string | null
          create_time?: string
          created_by?: number
          culture_group_id?: string
          decimal?: number | null
          formula?: string | null
          formula_text?: string | null
          id?: number
          interface_code?: string | null
          is_descriptive?: boolean | null
          is_formula?: boolean | null
          is_mandatory?: boolean | null
          is_multiple_options?: boolean
          lab_id: string
          laboratory_categories_id?: number | null
          location_id?: number
          modified_by?: number
          modify_time?: string
          multiply_by?: number | null
          name: string
          parameter_text?: string | null
          sort_attribute?: number | null
          sort_category?: number | null
          type?: string
          unit: string
          unit_txt?: string | null
        }
        Update: {
          by_age_between_num_gret_years?: string | null
          by_age_between_num_less_years?: string | null
          by_age_between_years?: string | null
          by_age_between_years_default_result?: string | null
          by_age_between_years_lower_limit?: string | null
          by_age_between_years_upper_limit?: string | null
          by_age_days_between?: string | null
          by_age_days_less?: string | null
          by_age_days_less_female?: string | null
          by_age_days_more?: string | null
          by_age_days_more_female?: string | null
          by_age_less_years?: string | null
          by_age_less_years_female?: string | null
          by_age_more_years?: string | null
          by_age_more_years_female?: string | null
          by_age_num_gret_years_default_result?: string | null
          by_age_num_gret_years_default_result_female?: string | null
          by_age_num_gret_years_lower_limit?: string | null
          by_age_num_gret_years_lower_limit_female?: string | null
          by_age_num_gret_years_upper_limit?: string | null
          by_age_num_gret_years_upper_limit_female?: string | null
          by_age_num_less_years?: string | null
          by_age_num_less_years_default_result?: string | null
          by_age_num_less_years_default_result_female?: string | null
          by_age_num_less_years_female?: string | null
          by_age_num_less_years_lower_limit?: string | null
          by_age_num_less_years_lower_limit_female?: string | null
          by_age_num_less_years_upper_limit?: string | null
          by_age_num_less_years_upper_limit_female?: string | null
          by_age_num_more_years?: string | null
          by_age_num_more_years_female?: string | null
          by_age_sex?: string | null
          by_gender_age?: string | null
          by_gender_child?: string | null
          by_gender_child_default_result?: string | null
          by_gender_child_lower_limit?: string | null
          by_gender_child_upper_limit?: string | null
          by_gender_female?: string | null
          by_gender_female_default_result?: string | null
          by_gender_female_lower_limit?: string | null
          by_gender_female_upper_limit?: string | null
          by_gender_male?: string | null
          by_gender_male_default_result?: string | null
          by_gender_male_lower_limit?: string | null
          by_gender_male_upper_limit?: string | null
          by_range_between?: boolean | null
          by_range_between_interpretation?: string | null
          by_range_between_lower_limit?: string | null
          by_range_between_upper_limit?: string | null
          by_range_greater_than?: boolean | null
          by_range_greater_than_interpretation?: string | null
          by_range_greater_than_limit?: string | null
          by_range_less_than?: boolean | null
          by_range_less_than_interpretation?: string | null
          by_range_less_than_limit?: string | null
          by_range_positive_negative?: string | null
          create_time?: string
          created_by?: number
          culture_group_id?: string
          decimal?: number | null
          formula?: string | null
          formula_text?: string | null
          id?: number
          interface_code?: string | null
          is_descriptive?: boolean | null
          is_formula?: boolean | null
          is_mandatory?: boolean | null
          is_multiple_options?: boolean
          lab_id?: string
          laboratory_categories_id?: number | null
          location_id?: number
          modified_by?: number
          modify_time?: string
          multiply_by?: number | null
          name?: string
          parameter_text?: string | null
          sort_attribute?: number | null
          sort_category?: number | null
          type?: string
          unit?: string
          unit_txt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_parameters_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "lab"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_results: {
        Row: {
          authenticated_result: boolean | null
          collection_date: string | null
          comments: string | null
          created_at: string | null
          id: string
          is_abnormal: boolean | null
          lab_id: string | null
          lab_sample_id: string | null
          ordering_doctor: string | null
          patient_age: number | null
          patient_gender: string | null
          patient_id: string | null
          patient_name: string | null
          patient_phone: string | null
          pathologist_name: string | null
          reference_range: string | null
          result_status: string | null
          result_unit: string | null
          result_value: string | null
          technician_name: string | null
          test_category: string | null
          test_name: string
          test_priority: string | null
          updated_at: string | null
          visit_date: string | null
          visit_id: string | null
        }
        Insert: {
          authenticated_result?: boolean | null
          collection_date?: string | null
          comments?: string | null
          created_at?: string | null
          id?: string
          is_abnormal?: boolean | null
          lab_id?: string | null
          lab_sample_id?: string | null
          ordering_doctor?: string | null
          patient_age?: number | null
          patient_gender?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          pathologist_name?: string | null
          reference_range?: string | null
          result_status?: string | null
          result_unit?: string | null
          result_value?: string | null
          technician_name?: string | null
          test_category?: string | null
          test_name: string
          test_priority?: string | null
          updated_at?: string | null
          visit_date?: string | null
          visit_id?: string | null
        }
        Update: {
          authenticated_result?: boolean | null
          collection_date?: string | null
          comments?: string | null
          created_at?: string | null
          id?: string
          is_abnormal?: boolean | null
          lab_id?: string | null
          lab_sample_id?: string | null
          ordering_doctor?: string | null
          patient_age?: number | null
          patient_gender?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          pathologist_name?: string | null
          reference_range?: string | null
          result_status?: string | null
          result_unit?: string | null
          result_value?: string | null
          technician_name?: string | null
          test_category?: string | null
          test_name?: string
          test_priority?: string | null
          updated_at?: string | null
          visit_date?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "lab"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          }
        ]
      }
      lab_reports: {
        Row: {
          approved_by: string | null
          approved_datetime: string | null
          created_at: string | null
          delivered_to: string | null
          delivery_method: string | null
          delivery_status: string | null
          dispatch_datetime: string | null
          id: string
          interpretation: string | null
          order_id: string | null
          pathologist: string | null
          prepared_by: string | null
          prepared_datetime: string | null
          recommendations: string | null
          report_content: string | null
          report_number: string
          report_status: string | null
          report_template: string | null
          report_type: string | null
          reviewed_by: string | null
          reviewed_datetime: string | null
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          approved_datetime?: string | null
          created_at?: string | null
          delivered_to?: string | null
          delivery_method?: string | null
          delivery_status?: string | null
          dispatch_datetime?: string | null
          id?: string
          interpretation?: string | null
          order_id?: string | null
          pathologist?: string | null
          prepared_by?: string | null
          prepared_datetime?: string | null
          recommendations?: string | null
          report_content?: string | null
          report_number: string
          report_status?: string | null
          report_template?: string | null
          report_type?: string | null
          reviewed_by?: string | null
          reviewed_datetime?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          approved_datetime?: string | null
          created_at?: string | null
          delivered_to?: string | null
          delivery_method?: string | null
          delivery_status?: string | null
          dispatch_datetime?: string | null
          id?: string
          interpretation?: string | null
          order_id?: string | null
          pathologist?: string | null
          prepared_by?: string | null
          prepared_datetime?: string | null
          recommendations?: string | null
          report_content?: string | null
          report_number?: string
          report_status?: string | null
          report_template?: string | null
          report_type?: string | null
          reviewed_by?: string | null
          reviewed_datetime?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_reports_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_samples: {
        Row: {
          aliquot_number: number | null
          collected_by: string | null
          collection_datetime: string | null
          collection_location: string | null
          collection_method: string | null
          container_type: string | null
          created_at: string | null
          id: string
          is_aliquot: boolean | null
          number_of_containers: number | null
          order_id: string | null
          parent_sample_id: string | null
          processing_status: string | null
          quality_notes: string | null
          received_by: string | null
          received_datetime: string | null
          rejection_reason: string | null
          sample_barcode: string
          sample_quality: string | null
          sample_type: string
          storage_conditions: string | null
          storage_location: string | null
          storage_temperature: number | null
          temperature_at_receipt: number | null
          updated_at: string | null
          volume_collected: string | null
        }
        Insert: {
          aliquot_number?: number | null
          collected_by?: string | null
          collection_datetime?: string | null
          collection_location?: string | null
          collection_method?: string | null
          container_type?: string | null
          created_at?: string | null
          id?: string
          is_aliquot?: boolean | null
          number_of_containers?: number | null
          order_id?: string | null
          parent_sample_id?: string | null
          processing_status?: string | null
          quality_notes?: string | null
          received_by?: string | null
          received_datetime?: string | null
          rejection_reason?: string | null
          sample_barcode: string
          sample_quality?: string | null
          sample_type: string
          storage_conditions?: string | null
          storage_location?: string | null
          storage_temperature?: number | null
          temperature_at_receipt?: number | null
          updated_at?: string | null
          volume_collected?: string | null
        }
        Update: {
          aliquot_number?: number | null
          collected_by?: string | null
          collection_datetime?: string | null
          collection_location?: string | null
          collection_method?: string | null
          container_type?: string | null
          created_at?: string | null
          id?: string
          is_aliquot?: boolean | null
          number_of_containers?: number | null
          order_id?: string | null
          parent_sample_id?: string | null
          processing_status?: string | null
          quality_notes?: string | null
          received_by?: string | null
          received_datetime?: string | null
          rejection_reason?: string | null
          sample_barcode?: string
          sample_quality?: string | null
          sample_type?: string
          storage_conditions?: string | null
          storage_location?: string | null
          storage_temperature?: number | null
          temperature_at_receipt?: number | null
          updated_at?: string | null
          volume_collected?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_samples_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_samples_parent_sample_id_fkey"
            columns: ["parent_sample_id"]
            isOneToOne: false
            referencedRelation: "lab_samples"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_sub_speciality: {
        Row: {
          id: string
          modality: string | null
          name: string | null
          remark: string | null
          sub_code: string | null
        }
        Insert: {
          id?: string
          modality?: string | null
          name?: string | null
          remark?: string | null
          sub_code?: string | null
        }
        Update: {
          id?: string
          modality?: string | null
          name?: string | null
          remark?: string | null
          sub_code?: string | null
        }
        Relationships: []
      }
      lab_subspeciality: {
        Row: {
          id: string
          modality: string | null
          name: string
          remark: string | null
          sub_speciality_code: string | null
        }
        Insert: {
          id?: string
          modality?: string | null
          name: string
          remark?: string | null
          sub_speciality_code?: string | null
        }
        Update: {
          id?: string
          modality?: string | null
          name?: string
          remark?: string | null
          sub_speciality_code?: string | null
        }
        Relationships: []
      }
      lab_worklists: {
        Row: {
          assigned_technician: string | null
          completed_samples: number | null
          created_at: string | null
          department_id: string | null
          end_time: string | null
          equipment_id: string | null
          id: string
          pending_samples: number | null
          shift: string | null
          start_time: string | null
          supervisor: string | null
          total_samples: number | null
          updated_at: string | null
          worklist_date: string | null
          worklist_name: string
          worklist_status: string | null
          worklist_type: string | null
        }
        Insert: {
          assigned_technician?: string | null
          completed_samples?: number | null
          created_at?: string | null
          department_id?: string | null
          end_time?: string | null
          equipment_id?: string | null
          id?: string
          pending_samples?: number | null
          shift?: string | null
          start_time?: string | null
          supervisor?: string | null
          total_samples?: number | null
          updated_at?: string | null
          worklist_date?: string | null
          worklist_name: string
          worklist_status?: string | null
          worklist_type?: string | null
        }
        Update: {
          assigned_technician?: string | null
          completed_samples?: number | null
          created_at?: string | null
          department_id?: string | null
          end_time?: string | null
          equipment_id?: string | null
          id?: string
          pending_samples?: number | null
          shift?: string | null
          start_time?: string | null
          supervisor?: string | null
          total_samples?: number | null
          updated_at?: string | null
          worklist_date?: string | null
          worklist_name?: string
          worklist_status?: string | null
          worklist_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_worklists_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "lab_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_worklists_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "lab_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_groups: {
        Row: {
          group_type: string
          id: string
          name: string
          nature: string | null
        }
        Insert: {
          group_type: string
          id?: string
          name: string
          nature?: string | null
        }
        Update: {
          group_type?: string
          id?: string
          name?: string
          nature?: string | null
        }
        Relationships: []
      }
      ledgers: {
        Row: {
          account_id: string | null
          account_number: string | null
          alias: string | null
          ask_for_reference_no: boolean | null
          bank_branch: string | null
          bank_name: string | null
          bank_passbook_copy_obtained: boolean | null
          code: string
          created_at: string | null
          current_balance: number | null
          description: string | null
          gl_code: string | null
          gl_format: string | null
          group_id: string | null
          group_name: string | null
          id: string
          ifsc_code: string | null
          is_active: boolean | null
          name: string
          nature: string | null
          neft_authorization_received: boolean | null
          opening_balance: number | null
          pan: string | null
          status: string | null
          updated_at: string | null
          visit_id: string | null
        }
        Insert: {
          account_id?: string | null
          account_number?: string | null
          alias?: string | null
          ask_for_reference_no?: boolean | null
          bank_branch?: string | null
          bank_name?: string | null
          bank_passbook_copy_obtained?: boolean | null
          code: string
          created_at?: string | null
          current_balance?: number | null
          description?: string | null
          gl_code?: string | null
          gl_format?: string | null
          group_id?: string | null
          group_name?: string | null
          id?: string
          ifsc_code?: string | null
          is_active?: boolean | null
          name: string
          nature?: string | null
          neft_authorization_received?: boolean | null
          opening_balance?: number | null
          pan?: string | null
          status?: string | null
          updated_at?: string | null
          visit_id?: string | null
        }
        Update: {
          account_id?: string | null
          account_number?: string | null
          alias?: string | null
          ask_for_reference_no?: boolean | null
          bank_branch?: string | null
          bank_name?: string | null
          bank_passbook_copy_obtained?: boolean | null
          code?: string
          created_at?: string | null
          current_balance?: number | null
          description?: string | null
          gl_code?: string | null
          gl_format?: string | null
          group_id?: string | null
          group_name?: string | null
          id?: string
          ifsc_code?: string | null
          is_active?: boolean | null
          name?: string
          nature?: string | null
          neft_authorization_received?: boolean | null
          opening_balance?: number | null
          pan?: string | null
          status?: string | null
          updated_at?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledgers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ledger_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledgers_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      medication: {
        Row: {
          barcode: string | null
          brand_name: string[] | null
          category: string | null
          created_at: string
          description: string | null
          dosage: string | null
          drug_id: string | null
          druginfo: string | null
          exp_date: string | null
          Exp_date: string | null
          generic_name: string | null
          id: string
          is_deleted: boolean | null
          is_implant: boolean | null
          item_code: string | null
          item_type: number | null
          loose_stock: number | null
          manufacturer: string | null
          manufacturer_id: string | null
          medicine_code: string | null
          name: string
          pack: string | null
          price_per_strip: string | null
          shelf: string | null
          stock: string | null
          strength: string | null
          supplier_id: string | null
          supplier_name: string | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          brand_name?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          dosage?: string | null
          drug_id?: string | null
          druginfo?: string | null
          exp_date?: string | null
          Exp_date?: string | null
          generic_name?: string | null
          id?: string
          is_deleted?: boolean | null
          is_implant?: boolean | null
          item_code?: string | null
          item_type?: number | null
          loose_stock?: number | null
          manufacturer?: string | null
          manufacturer_id?: string | null
          medicine_code?: string | null
          name: string
          pack?: string | null
          price_per_strip?: string | null
          shelf?: string | null
          stock?: string | null
          strength?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          brand_name?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          dosage?: string | null
          drug_id?: string | null
          druginfo?: string | null
          exp_date?: string | null
          Exp_date?: string | null
          generic_name?: string | null
          id?: string
          is_deleted?: boolean | null
          is_implant?: boolean | null
          item_code?: string | null
          item_type?: number | null
          loose_stock?: number | null
          manufacturer?: string | null
          manufacturer_id?: string | null
          medicine_code?: string | null
          name?: string
          pack?: string | null
          price_per_strip?: string | null
          shelf?: string | null
          stock?: string | null
          strength?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      medicine_categories: {
        Row: {
          category_code: string
          category_name: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          parent_category_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_code: string
          category_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          parent_category_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_code?: string
          category_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          parent_category_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "medicine_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_inventory: {
        Row: {
          batch_number: string
          created_at: string | null
          current_stock: number
          damaged_stock: number | null
          expiry_date: string
          id: string
          is_active: boolean | null
          manufacturing_date: string | null
          medicine_id: string | null
          purchase_date: string | null
          purchase_order_id: string | null
          purchase_rate: number | null
          rack_number: string | null
          received_quantity: number
          reserved_stock: number | null
          shelf_location: string | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          batch_number: string
          created_at?: string | null
          current_stock?: number
          damaged_stock?: number | null
          expiry_date: string
          id?: string
          is_active?: boolean | null
          manufacturing_date?: string | null
          medicine_id?: string | null
          purchase_date?: string | null
          purchase_order_id?: string | null
          purchase_rate?: number | null
          rack_number?: string | null
          received_quantity?: number
          reserved_stock?: number | null
          shelf_location?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          batch_number?: string
          created_at?: string | null
          current_stock?: number
          damaged_stock?: number | null
          expiry_date?: string
          id?: string
          is_active?: boolean | null
          manufacturing_date?: string | null
          medicine_id?: string | null
          purchase_date?: string | null
          purchase_order_id?: string | null
          purchase_rate?: number | null
          rack_number?: string | null
          received_quantity?: number
          reserved_stock?: number | null
          shelf_location?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_inventory_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_inventory_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "medicine_manufacturers"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_manufacturers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          gst_number: string | null
          id: string
          is_active: boolean | null
          license_number: string | null
          manufacturer_code: string | null
          manufacturer_name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          manufacturer_code?: string | null
          manufacturer_name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          manufacturer_code?: string | null
          manufacturer_name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      medicine_return_items: {
        Row: {
          batch_number: string | null
          can_restock: boolean | null
          created_at: string | null
          expiry_date: string | null
          id: string
          medicine_condition: string | null
          medicine_id: string | null
          original_sale_item_id: string | null
          quantity_returned: number
          refund_amount: number
          return_id: string | null
          unit_price: number
        }
        Insert: {
          batch_number?: string | null
          can_restock?: boolean | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          medicine_condition?: string | null
          medicine_id?: string | null
          original_sale_item_id?: string | null
          quantity_returned: number
          refund_amount: number
          return_id?: string | null
          unit_price: number
        }
        Update: {
          batch_number?: string | null
          can_restock?: boolean | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          medicine_condition?: string | null
          medicine_id?: string | null
          original_sale_item_id?: string | null
          quantity_returned?: number
          refund_amount?: number
          return_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "medicine_return_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_return_items_original_sale_item_id_fkey"
            columns: ["original_sale_item_id"]
            isOneToOne: false
            referencedRelation: "medicine_sale_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "medicine_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_returns: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          net_refund: number | null
          notes: string | null
          original_sale_id: string | null
          patient_id: string | null
          processed_at: string | null
          processed_by: string | null
          processing_fee: number | null
          refund_amount: number | null
          return_date: string | null
          return_number: string
          return_reason: string
          return_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          net_refund?: number | null
          notes?: string | null
          original_sale_id?: string | null
          patient_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          processing_fee?: number | null
          refund_amount?: number | null
          return_date?: string | null
          return_number: string
          return_reason: string
          return_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          net_refund?: number | null
          notes?: string | null
          original_sale_id?: string | null
          patient_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          processing_fee?: number | null
          refund_amount?: number | null
          return_date?: string | null
          return_number?: string
          return_reason?: string
          return_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_returns_original_sale_id_fkey"
            columns: ["original_sale_id"]
            isOneToOne: false
            referencedRelation: "medicine_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_returns_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_sale_items: {
        Row: {
          batch_number: string | null
          created_at: string | null
          discount_amount: number | null
          discount_percentage: number | null
          expiry_date: string | null
          id: string
          inventory_id: string | null
          medicine_id: string | null
          quantity_sold: number
          sale_id: string | null
          tax_amount: number | null
          tax_percentage: number | null
          total_amount: number
          unit_price: number
        }
        Insert: {
          batch_number?: string | null
          created_at?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          expiry_date?: string | null
          id?: string
          inventory_id?: string | null
          medicine_id?: string | null
          quantity_sold: number
          sale_id?: string | null
          tax_amount?: number | null
          tax_percentage?: number | null
          total_amount: number
          unit_price: number
        }
        Update: {
          batch_number?: string | null
          created_at?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          expiry_date?: string | null
          id?: string
          inventory_id?: string | null
          medicine_id?: string | null
          quantity_sold?: number
          sale_id?: string | null
          tax_amount?: number | null
          tax_percentage?: number | null
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "medicine_sale_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "medicine_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_sale_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "medicine_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_sales: {
        Row: {
          balance_amount: number | null
          bill_number: string
          cashier_id: string | null
          created_at: string | null
          discount_amount: number | null
          id: string
          insurance_claim_number: string | null
          notes: string | null
          paid_amount: number | null
          patient_id: string | null
          payment_method: string | null
          payment_reference: string | null
          pharmacist_id: string | null
          prescription_id: string | null
          sale_date: string | null
          sale_type: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          balance_amount?: number | null
          bill_number: string
          cashier_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          insurance_claim_number?: string | null
          notes?: string | null
          paid_amount?: number | null
          patient_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          pharmacist_id?: string | null
          prescription_id?: string | null
          sale_date?: string | null
          sale_type?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          balance_amount?: number | null
          bill_number?: string
          cashier_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          insurance_claim_number?: string | null
          notes?: string | null
          paid_amount?: number | null
          patient_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          pharmacist_id?: string | null
          prescription_id?: string | null
          sale_date?: string | null
          sale_type?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_sales_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_sales_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          barcode: string | null
          brand_name: string | null
          category: string | null
          category_id: string | null
          contraindications: string | null
          controlled_substance: boolean | null
          created_at: string | null
          current_stock: number | null
          discount_percentage: number | null
          dosage_form: string | null
          drug_interactions: string | null
          generic_name: string | null
          gst_percentage: number | null
          id: string
          is_active: boolean | null
          manufacturer_id: string | null
          maximum_stock_level: number | null
          medicine_code: string
          medicine_name: string
          minimum_stock_level: number | null
          mrp: number
          pack_size: number | null
          prescription_required: boolean | null
          purchase_rate: number | null
          reorder_level: number | null
          schedule_type: string | null
          selling_rate: number | null
          side_effects: string | null
          storage_conditions: string | null
          strength: string | null
          unit_of_measurement: string | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          brand_name?: string | null
          category?: string | null
          category_id?: string | null
          contraindications?: string | null
          controlled_substance?: boolean | null
          created_at?: string | null
          current_stock?: number | null
          discount_percentage?: number | null
          dosage_form?: string | null
          drug_interactions?: string | null
          generic_name?: string | null
          gst_percentage?: number | null
          id?: string
          is_active?: boolean | null
          manufacturer_id?: string | null
          maximum_stock_level?: number | null
          medicine_code: string
          medicine_name: string
          minimum_stock_level?: number | null
          mrp: number
          pack_size?: number | null
          prescription_required?: boolean | null
          purchase_rate?: number | null
          reorder_level?: number | null
          schedule_type?: string | null
          selling_rate?: number | null
          side_effects?: string | null
          storage_conditions?: string | null
          strength?: string | null
          unit_of_measurement?: string | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          brand_name?: string | null
          category?: string | null
          category_id?: string | null
          contraindications?: string | null
          controlled_substance?: boolean | null
          created_at?: string | null
          current_stock?: number | null
          discount_percentage?: number | null
          dosage_form?: string | null
          drug_interactions?: string | null
          generic_name?: string | null
          gst_percentage?: number | null
          id?: string
          is_active?: boolean | null
          manufacturer_id?: string | null
          maximum_stock_level?: number | null
          medicine_code?: string
          medicine_name?: string
          minimum_stock_level?: number | null
          mrp?: number
          pack_size?: number | null
          prescription_required?: boolean | null
          purchase_rate?: number | null
          reorder_level?: number | null
          schedule_type?: string | null
          selling_rate?: number | null
          side_effects?: string | null
          storage_conditions?: string | null
          strength?: string | null
          unit_of_measurement?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicines_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "medicine_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicines_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "medicine_manufacturers"
            referencedColumns: ["id"]
          },
        ]
      }
      nabh_rates: {
        Row: {
          category: string | null
          code: string
          created_at: string
          id: string
          item_name: string
          rate: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          id?: string
          item_name: string
          rate: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          id?: string
          item_name?: string
          rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      operation_theatres: {
        Row: {
          capacity: number
          created_at: string | null
          id: number
          last_cleaned: string | null
          name: string
          next_maintenance: string | null
          specialty_type: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string | null
          id?: number
          last_cleaned?: string | null
          name: string
          next_maintenance?: string | null
          specialty_type?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          id?: number
          last_cleaned?: string | null
          name?: string
          next_maintenance?: string | null
          specialty_type?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      order_test_items: {
        Row: {
          analyzer_used: string | null
          assigned_technician: string | null
          container_type: string | null
          created_at: string | null
          id: string
          item_code: string
          item_name: string
          item_status: string | null
          item_type: string
          order_id: string | null
          panel_id: string | null
          processing_end_time: string | null
          processing_start_time: string | null
          quality_notes: string | null
          quantity: number | null
          sample_type: string | null
          sample_volume: string | null
          technician_notes: string | null
          test_id: string | null
          total_price: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          analyzer_used?: string | null
          assigned_technician?: string | null
          container_type?: string | null
          created_at?: string | null
          id?: string
          item_code: string
          item_name: string
          item_status?: string | null
          item_type: string
          order_id?: string | null
          panel_id?: string | null
          processing_end_time?: string | null
          processing_start_time?: string | null
          quality_notes?: string | null
          quantity?: number | null
          sample_type?: string | null
          sample_volume?: string | null
          technician_notes?: string | null
          test_id?: string | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          analyzer_used?: string | null
          assigned_technician?: string | null
          container_type?: string | null
          created_at?: string | null
          id?: string
          item_code?: string
          item_name?: string
          item_status?: string | null
          item_type?: string
          order_id?: string | null
          panel_id?: string | null
          processing_end_time?: string | null
          processing_start_time?: string | null
          quality_notes?: string | null
          quantity?: number | null
          sample_type?: string | null
          sample_volume?: string | null
          technician_notes?: string | null
          test_id?: string | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_test_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_test_items_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "test_panels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_test_items_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "lab_subspeciality"
            referencedColumns: ["id"]
          },
        ]
      }
      ot_patients: {
        Row: {
          anesthesiologist: string | null
          created_at: string | null
          estimated_duration: number
          id: string
          patient_id: string | null
          patient_name: string
          priority: string
          scheduled_time: string
          status: string
          surgeon: string
          surgery: string
          theatre_number: number
          updated_at: string | null
        }
        Insert: {
          anesthesiologist?: string | null
          created_at?: string | null
          estimated_duration: number
          id?: string
          patient_id?: string | null
          patient_name: string
          priority?: string
          scheduled_time: string
          status?: string
          surgeon: string
          surgery: string
          theatre_number: number
          updated_at?: string | null
        }
        Update: {
          anesthesiologist?: string | null
          created_at?: string | null
          estimated_duration?: number
          id?: string
          patient_id?: string | null
          patient_name?: string
          priority?: string
          scheduled_time?: string
          status?: string
          surgeon?: string
          surgery?: string
          theatre_number?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ot_patients_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_patients_theatre_number_fkey"
            columns: ["theatre_number"]
            isOneToOne: false
            referencedRelation: "operation_theatres"
            referencedColumns: ["id"]
          },
        ]
      }
      outstanding_invoices: {
        Row: {
          aging_bucket: string | null
          bill_id: string | null
          created_at: string | null
          days_outstanding: number | null
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          original_amount: number
          outstanding_amount: number
          paid_amount: number | null
          patient_id: string | null
          status: string | null
          updated_at: string | null
          voucher_id: string | null
        }
        Insert: {
          aging_bucket?: string | null
          bill_id?: string | null
          created_at?: string | null
          days_outstanding?: number | null
          due_date: string
          id?: string
          invoice_date: string
          invoice_number: string
          original_amount: number
          outstanding_amount: number
          paid_amount?: number | null
          patient_id?: string | null
          status?: string | null
          updated_at?: string | null
          voucher_id?: string | null
        }
        Update: {
          aging_bucket?: string | null
          bill_id?: string | null
          created_at?: string | null
          days_outstanding?: number | null
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          original_amount?: number
          outstanding_amount?: number
          paid_amount?: number | null
          patient_id?: string | null
          status?: string | null
          updated_at?: string | null
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outstanding_invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outstanding_invoices_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      panel_tests: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_mandatory: boolean | null
          panel_id: string | null
          test_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_mandatory?: boolean | null
          panel_id?: string | null
          test_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_mandatory?: boolean | null
          panel_id?: string | null
          test_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "panel_tests_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "test_panels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "panel_tests_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "lab_subspeciality"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_data: {
        Row: {
          adhar_card_yes_no: string | null
          age: string | null
          bill_amount: string | null
          bill_made_by_name_of_billing_executive: string | null
          cghs_code_unlisted_with_approval_from_esic: string | null
          cghs_package_amount_approved_unlisted_amount: string | null
          cghs_surgery_esic_referral: string | null
          claim_id: string | null
          date_column_1: Database["public"]["Enums"]["date_status"] | null
          date_column_2: Database["public"]["Enums"]["date_status"] | null
          date_column_3: Database["public"]["Enums"]["date_status"] | null
          date_column_4: Database["public"]["Enums"]["date_status"] | null
          date_column_5: Database["public"]["Enums"]["date_status"] | null
          date_of_admission: string | null
          date_of_discharge: string | null
          date_of_surgery: string | null
          delay_waiver_for_intimation_bill_submission_taken_not_required:
            | string
            | null
          diagnosis_and_surgery_performed: string | null
          e_pahachan_card_yes_no: string | null
          extension_taken_not_taken_not_required: string | null
          hitlabh_or_entitelment_benefits_yes_no: string | null
          intimation_done_not_done: string | null
          mrn: string | null
          on_portal_submission_date: string | null
          patient_id: string | null
          patient_name: string | null
          patient_type: string | null
          patient_uuid: string | null
          payment_status: string | null
          referral_original_yes_no: string | null
          reff_dr_name: string | null
          remark_1: string | null
          remark_2: string | null
          sex: string | null
          sr_no: number
          sst_or_secondary_treatment: string | null
          surgery_name_with_cghs_amount_with_cghs_code: string | null
          surgery_performed_by: string | null
          surgery1_in_referral_letter: string | null
          surgery2: string | null
          surgery3: string | null
          surgery4: string | null
          surgical_additional_approval_taken_not_taken_not_required_both_:
            | string
            | null
          total_package_amount: string | null
        }
        Insert: {
          adhar_card_yes_no?: string | null
          age?: string | null
          bill_amount?: string | null
          bill_made_by_name_of_billing_executive?: string | null
          cghs_code_unlisted_with_approval_from_esic?: string | null
          cghs_package_amount_approved_unlisted_amount?: string | null
          cghs_surgery_esic_referral?: string | null
          claim_id?: string | null
          date_column_1?: Database["public"]["Enums"]["date_status"] | null
          date_column_2?: Database["public"]["Enums"]["date_status"] | null
          date_column_3?: Database["public"]["Enums"]["date_status"] | null
          date_column_4?: Database["public"]["Enums"]["date_status"] | null
          date_column_5?: Database["public"]["Enums"]["date_status"] | null
          date_of_admission?: string | null
          date_of_discharge?: string | null
          date_of_surgery?: string | null
          delay_waiver_for_intimation_bill_submission_taken_not_required?:
            | string
            | null
          diagnosis_and_surgery_performed?: string | null
          e_pahachan_card_yes_no?: string | null
          extension_taken_not_taken_not_required?: string | null
          hitlabh_or_entitelment_benefits_yes_no?: string | null
          intimation_done_not_done?: string | null
          mrn?: string | null
          on_portal_submission_date?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_type?: string | null
          patient_uuid?: string | null
          payment_status?: string | null
          referral_original_yes_no?: string | null
          reff_dr_name?: string | null
          remark_1?: string | null
          remark_2?: string | null
          sex?: string | null
          sr_no?: number
          sst_or_secondary_treatment?: string | null
          surgery_name_with_cghs_amount_with_cghs_code?: string | null
          surgery_performed_by?: string | null
          surgery1_in_referral_letter?: string | null
          surgery2?: string | null
          surgery3?: string | null
          surgery4?: string | null
          surgical_additional_approval_taken_not_taken_not_required_both_?:
            | string
            | null
          total_package_amount?: string | null
        }
        Update: {
          adhar_card_yes_no?: string | null
          age?: string | null
          bill_amount?: string | null
          bill_made_by_name_of_billing_executive?: string | null
          cghs_code_unlisted_with_approval_from_esic?: string | null
          cghs_package_amount_approved_unlisted_amount?: string | null
          cghs_surgery_esic_referral?: string | null
          claim_id?: string | null
          date_column_1?: Database["public"]["Enums"]["date_status"] | null
          date_column_2?: Database["public"]["Enums"]["date_status"] | null
          date_column_3?: Database["public"]["Enums"]["date_status"] | null
          date_column_4?: Database["public"]["Enums"]["date_status"] | null
          date_column_5?: Database["public"]["Enums"]["date_status"] | null
          date_of_admission?: string | null
          date_of_discharge?: string | null
          date_of_surgery?: string | null
          delay_waiver_for_intimation_bill_submission_taken_not_required?:
            | string
            | null
          diagnosis_and_surgery_performed?: string | null
          e_pahachan_card_yes_no?: string | null
          extension_taken_not_taken_not_required?: string | null
          hitlabh_or_entitelment_benefits_yes_no?: string | null
          intimation_done_not_done?: string | null
          mrn?: string | null
          on_portal_submission_date?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_type?: string | null
          patient_uuid?: string | null
          payment_status?: string | null
          referral_original_yes_no?: string | null
          reff_dr_name?: string | null
          remark_1?: string | null
          remark_2?: string | null
          sex?: string | null
          sr_no?: number
          sst_or_secondary_treatment?: string | null
          surgery_name_with_cghs_amount_with_cghs_code?: string | null
          surgery_performed_by?: string | null
          surgery1_in_referral_letter?: string | null
          surgery2?: string | null
          surgery3?: string | null
          surgery4?: string | null
          surgical_additional_approval_taken_not_taken_not_required_both_?:
            | string
            | null
          total_package_amount?: string | null
        }
        Relationships: []
      }
      patient_documents: {
        Row: {
          created_at: string | null
          document_name: string
          document_type_id: number
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          is_uploaded: boolean | null
          patient_id: string | null
          remark_reason: string | null
          remarks: string | null
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          visit_id: string
        }
        Insert: {
          created_at?: string | null
          document_name: string
          document_type_id: number
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_uploaded?: boolean | null
          patient_id?: string | null
          remark_reason?: string | null
          remarks?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          visit_id: string
        }
        Update: {
          created_at?: string | null
          document_name?: string
          document_type_id?: number
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_uploaded?: boolean | null
          patient_id?: string | null
          remark_reason?: string | null
          remarks?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          visit_id?: string
        }
        Relationships: []
      }
      patient_ledgers: {
        Row: {
          account_id: string | null
          address: string | null
          contact_person: string | null
          created_at: string | null
          credit_days: number | null
          credit_limit: number | null
          current_balance: number | null
          current_balance_type: string | null
          email: string | null
          id: string
          is_active: boolean | null
          ledger_name: string
          opening_balance: number | null
          opening_balance_type: string | null
          patient_id: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          credit_days?: number | null
          credit_limit?: number | null
          current_balance?: number | null
          current_balance_type?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          ledger_name: string
          opening_balance?: number | null
          opening_balance_type?: string | null
          patient_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          credit_days?: number | null
          credit_limit?: number | null
          current_balance?: number | null
          current_balance_type?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          ledger_name?: string
          opening_balance?: number | null
          opening_balance_type?: string | null
          patient_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_ledgers_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_ledgers_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          aadhar_passport: string | null
          address: string | null
          age: number | null
          allergies: string | null
          billing_link: string | null
          blood_group: string | null
          city_town: string | null
          corporate: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          emergency_contact_mobile: string | null
          emergency_contact_name: string | null
          gender: string | null
          hospital_name: string | null
          id: string
          identity_type: string | null
          instructions: string | null
          insurance_person_no: string | null
          name: string
          panchayat: string | null
          patient_photo: string | null
          patients_id: string | null
          phone: string | null
          pin_code: string | null
          privilege_card_number: string | null
          quarter_plot_no: string | null
          relationship_manager: string | null
          relative_phone_no: string | null
          second_emergency_contact_mobile: string | null
          second_emergency_contact_name: string | null
          spouse_name: string | null
          state: string | null
          updated_at: string
          ward: string | null
        }
        Insert: {
          aadhar_passport?: string | null
          address?: string | null
          age?: number | null
          allergies?: string | null
          billing_link?: string | null
          blood_group?: string | null
          city_town?: string | null
          corporate?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_mobile?: string | null
          emergency_contact_name?: string | null
          gender?: string | null
          hospital_name?: string | null
          id?: string
          identity_type?: string | null
          instructions?: string | null
          insurance_person_no?: string | null
          name: string
          panchayat?: string | null
          patient_photo?: string | null
          patients_id?: string | null
          phone?: string | null
          pin_code?: string | null
          privilege_card_number?: string | null
          quarter_plot_no?: string | null
          relationship_manager?: string | null
          relative_phone_no?: string | null
          second_emergency_contact_mobile?: string | null
          second_emergency_contact_name?: string | null
          spouse_name?: string | null
          state?: string | null
          updated_at?: string
          ward?: string | null
        }
        Update: {
          aadhar_passport?: string | null
          address?: string | null
          age?: number | null
          allergies?: string | null
          billing_link?: string | null
          blood_group?: string | null
          city_town?: string | null
          corporate?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_mobile?: string | null
          emergency_contact_name?: string | null
          gender?: string | null
          hospital_name?: string | null
          id?: string
          identity_type?: string | null
          instructions?: string | null
          insurance_person_no?: string | null
          name?: string
          panchayat?: string | null
          patient_photo?: string | null
          patients_id?: string | null
          phone?: string | null
          pin_code?: string | null
          privilege_card_number?: string | null
          quarter_plot_no?: string | null
          relationship_manager?: string | null
          relative_phone_no?: string | null
          second_emergency_contact_mobile?: string | null
          second_emergency_contact_name?: string | null
          spouse_name?: string | null
          state?: string | null
          updated_at?: string
          ward?: string | null
        }
        Relationships: []
      }
      payment_allocations: {
        Row: {
          allocated_amount: number
          allocation_date: string
          created_at: string | null
          id: string
          outstanding_invoice_id: string | null
          payment_transaction_id: string | null
        }
        Insert: {
          allocated_amount: number
          allocation_date: string
          created_at?: string | null
          id?: string
          outstanding_invoice_id?: string | null
          payment_transaction_id?: string | null
        }
        Update: {
          allocated_amount?: number
          allocation_date?: string
          created_at?: string | null
          id?: string
          outstanding_invoice_id?: string | null
          payment_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_outstanding_invoice_id_fkey"
            columns: ["outstanding_invoice_id"]
            isOneToOne: false
            referencedRelation: "outstanding_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          bank_name: string | null
          cheque_date: string | null
          cheque_number: string | null
          created_at: string | null
          id: string
          patient_id: string | null
          payment_amount: number
          payment_date: string
          payment_mode: string
          reference_number: string | null
          remarks: string | null
          status: string | null
          updated_at: string | null
          voucher_id: string | null
        }
        Insert: {
          bank_name?: string | null
          cheque_date?: string | null
          cheque_number?: string | null
          created_at?: string | null
          id?: string
          patient_id?: string | null
          payment_amount: number
          payment_date: string
          payment_mode: string
          reference_number?: string | null
          remarks?: string | null
          status?: string | null
          updated_at?: string | null
          voucher_id?: string | null
        }
        Update: {
          bank_name?: string | null
          cheque_date?: string | null
          cheque_number?: string | null
          created_at?: string | null
          id?: string
          patient_id?: string | null
          payment_amount?: number
          payment_date?: string
          payment_mode?: string
          reference_number?: string | null
          remarks?: string | null
          status?: string | null
          updated_at?: string | null
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_sales: {
        Row: {
          bill_no: string | null
          created_at: string | null
          date: string | null
          discount: number | null
          id: string
          paid: number | null
          patient_id: string | null
          patient_name: string | null
          total: number | null
          updated_at: string | null
          visit_id: string | null
        }
        Insert: {
          bill_no?: string | null
          created_at?: string | null
          date?: string | null
          discount?: number | null
          id?: string
          paid?: number | null
          patient_id?: string | null
          patient_name?: string | null
          total?: number | null
          updated_at?: string | null
          visit_id?: string | null
        }
        Update: {
          bill_no?: string | null
          created_at?: string | null
          date?: string | null
          discount?: number | null
          id?: string
          paid?: number | null
          patient_id?: string | null
          patient_name?: string | null
          total?: number | null
          updated_at?: string | null
          visit_id?: string | null
        }
        Relationships: []
      }
      post_op_notes: {
        Row: {
          bleeding_check: boolean | null
          created_at: string | null
          discharge_condition: string | null
          discharge_time: string | null
          drain_output: string | null
          follow_up_required: boolean | null
          id: string
          instructions: string | null
          medications_prescribed: string[] | null
          nausea_vomiting: boolean | null
          ot_patient_id: string | null
          pain_score: number | null
          recovery_start_time: string
          updated_at: string | null
          vital_signs_stable: boolean | null
        }
        Insert: {
          bleeding_check?: boolean | null
          created_at?: string | null
          discharge_condition?: string | null
          discharge_time?: string | null
          drain_output?: string | null
          follow_up_required?: boolean | null
          id?: string
          instructions?: string | null
          medications_prescribed?: string[] | null
          nausea_vomiting?: boolean | null
          ot_patient_id?: string | null
          pain_score?: number | null
          recovery_start_time: string
          updated_at?: string | null
          vital_signs_stable?: boolean | null
        }
        Update: {
          bleeding_check?: boolean | null
          created_at?: string | null
          discharge_condition?: string | null
          discharge_time?: string | null
          drain_output?: string | null
          follow_up_required?: boolean | null
          id?: string
          instructions?: string | null
          medications_prescribed?: string[] | null
          nausea_vomiting?: boolean | null
          ot_patient_id?: string | null
          pain_score?: number | null
          recovery_start_time?: string
          updated_at?: string | null
          vital_signs_stable?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "post_op_notes_ot_patient_id_fkey"
            columns: ["ot_patient_id"]
            isOneToOne: false
            referencedRelation: "active_ot_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_op_notes_ot_patient_id_fkey"
            columns: ["ot_patient_id"]
            isOneToOne: false
            referencedRelation: "ot_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      post_surgical_consultations: {
        Row: {
          amount: number
          code_number: string | null
          cost: number
          created_at: string | null
          date_from: string | null
          date_to: string | null
          doctor_id: string | null
          doctor_name: string
          id: string
          nabh_rate: number
          quantity: number
          sort_order: number
          surgical_billing_id: string | null
          updated_at: string | null
          visible: boolean
        }
        Insert: {
          amount?: number
          code_number?: string | null
          cost?: number
          created_at?: string | null
          date_from?: string | null
          date_to?: string | null
          doctor_id?: string | null
          doctor_name: string
          id?: string
          nabh_rate?: number
          quantity?: number
          sort_order?: number
          surgical_billing_id?: string | null
          updated_at?: string | null
          visible?: boolean
        }
        Update: {
          amount?: number
          code_number?: string | null
          cost?: number
          created_at?: string | null
          date_from?: string | null
          date_to?: string | null
          doctor_id?: string | null
          doctor_name?: string
          id?: string
          nabh_rate?: number
          quantity?: number
          sort_order?: number
          surgical_billing_id?: string | null
          updated_at?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "post_surgical_consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "hope_consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_surgical_consultations_surgical_billing_id_fkey"
            columns: ["surgical_billing_id"]
            isOneToOne: false
            referencedRelation: "surgical_billing"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_op_checklist: {
        Row: {
          allergies_checked: boolean | null
          anesthesia_clearance: boolean | null
          completed_at: string | null
          completed_by: string | null
          consent_obtained: boolean | null
          created_at: string | null
          fasting_confirmed: boolean | null
          id: string
          imaging_available: boolean | null
          lab_results_available: boolean | null
          medications_reviewed: boolean | null
          ot_patient_id: string | null
          patient_identity_verified: boolean | null
          surgical_site_marked: boolean | null
          updated_at: string | null
          vital_signs_recorded: boolean | null
        }
        Insert: {
          allergies_checked?: boolean | null
          anesthesia_clearance?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          consent_obtained?: boolean | null
          created_at?: string | null
          fasting_confirmed?: boolean | null
          id?: string
          imaging_available?: boolean | null
          lab_results_available?: boolean | null
          medications_reviewed?: boolean | null
          ot_patient_id?: string | null
          patient_identity_verified?: boolean | null
          surgical_site_marked?: boolean | null
          updated_at?: string | null
          vital_signs_recorded?: boolean | null
        }
        Update: {
          allergies_checked?: boolean | null
          anesthesia_clearance?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          consent_obtained?: boolean | null
          created_at?: string | null
          fasting_confirmed?: boolean | null
          id?: string
          imaging_available?: boolean | null
          lab_results_available?: boolean | null
          medications_reviewed?: boolean | null
          ot_patient_id?: string | null
          patient_identity_verified?: boolean | null
          surgical_site_marked?: boolean | null
          updated_at?: string | null
          vital_signs_recorded?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_op_checklist_ot_patient_id_fkey"
            columns: ["ot_patient_id"]
            isOneToOne: false
            referencedRelation: "active_ot_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_op_checklist_ot_patient_id_fkey"
            columns: ["ot_patient_id"]
            isOneToOne: false
            referencedRelation: "ot_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_items: {
        Row: {
          batch_numbers: string[] | null
          created_at: string | null
          discount_percentage: number | null
          dispensed_at: string | null
          dosage_frequency: string | null
          dosage_timing: string | null
          duration_days: number | null
          id: string
          is_substituted: boolean | null
          medicine_id: string | null
          prescription_id: string | null
          quantity_dispensed: number | null
          quantity_prescribed: number
          special_instructions: string | null
          substitute_medicine_id: string | null
          substitute_reason: string | null
          total_price: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          batch_numbers?: string[] | null
          created_at?: string | null
          discount_percentage?: number | null
          dispensed_at?: string | null
          dosage_frequency?: string | null
          dosage_timing?: string | null
          duration_days?: number | null
          id?: string
          is_substituted?: boolean | null
          medicine_id?: string | null
          prescription_id?: string | null
          quantity_dispensed?: number | null
          quantity_prescribed: number
          special_instructions?: string | null
          substitute_medicine_id?: string | null
          substitute_reason?: string | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          batch_numbers?: string[] | null
          created_at?: string | null
          discount_percentage?: number | null
          dispensed_at?: string | null
          dosage_frequency?: string | null
          dosage_timing?: string | null
          duration_days?: number | null
          id?: string
          is_substituted?: boolean | null
          medicine_id?: string | null
          prescription_id?: string | null
          quantity_dispensed?: number | null
          quantity_prescribed?: number
          special_instructions?: string | null
          substitute_medicine_id?: string | null
          substitute_reason?: string | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_substitute_medicine_id_fkey"
            columns: ["substitute_medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string | null
          diagnosis: string | null
          discount_amount: number | null
          dispensed_at: string | null
          dispensed_by: string | null
          doctor_id: string | null
          doctor_name: string | null
          final_amount: number | null
          id: string
          notes: string | null
          patient_id: string | null
          prescription_date: string
          prescription_number: string
          priority: string | null
          status: string | null
          symptoms: string | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string | null
          vital_signs: Json | null
        }
        Insert: {
          created_at?: string | null
          diagnosis?: string | null
          discount_amount?: number | null
          dispensed_at?: string | null
          dispensed_by?: string | null
          doctor_id?: string | null
          doctor_name?: string | null
          final_amount?: number | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          prescription_date: string
          prescription_number: string
          priority?: string | null
          status?: string | null
          symptoms?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
          vital_signs?: Json | null
        }
        Update: {
          created_at?: string | null
          diagnosis?: string | null
          discount_amount?: number | null
          dispensed_at?: string | null
          dispensed_by?: string | null
          doctor_id?: string | null
          doctor_name?: string | null
          final_amount?: number | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          prescription_date?: string
          prescription_number?: string
          priority?: string | null
          status?: string | null
          symptoms?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
          vital_signs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          batch_number: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          manufacturing_date: string | null
          medicine_id: string | null
          purchase_order_id: string | null
          quantity_ordered: number
          quantity_received: number | null
          total_price: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          manufacturing_date?: string | null
          medicine_id?: string | null
          purchase_order_id?: string | null
          quantity_ordered: number
          quantity_received?: number | null
          total_price: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          manufacturing_date?: string | null
          medicine_id?: string | null
          purchase_order_id?: string | null
          quantity_ordered?: number
          quantity_received?: number | null
          total_price?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery_date: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string
          status: string | null
          subtotal: number | null
          supplier_id: string | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date: string
          po_number: string
          status?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          status?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "medicine_manufacturers"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_controls: {
        Row: {
          acceptable_range_max: number | null
          acceptable_range_min: number | null
          actual_value: number | null
          corrective_action: string | null
          created_at: string | null
          equipment_id: string | null
          expected_unit: string | null
          expected_value: number | null
          expiry_date: string | null
          follow_up_required: boolean | null
          id: string
          level: string | null
          lot_number: string | null
          performed_by: string | null
          performed_datetime: string | null
          qc_material: string | null
          qc_status: string | null
          qc_type: string
          result_unit: string | null
          reviewed_by: string | null
          reviewed_datetime: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          acceptable_range_max?: number | null
          acceptable_range_min?: number | null
          actual_value?: number | null
          corrective_action?: string | null
          created_at?: string | null
          equipment_id?: string | null
          expected_unit?: string | null
          expected_value?: number | null
          expiry_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          level?: string | null
          lot_number?: string | null
          performed_by?: string | null
          performed_datetime?: string | null
          qc_material?: string | null
          qc_status?: string | null
          qc_type: string
          result_unit?: string | null
          reviewed_by?: string | null
          reviewed_datetime?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          acceptable_range_max?: number | null
          acceptable_range_min?: number | null
          actual_value?: number | null
          corrective_action?: string | null
          created_at?: string | null
          equipment_id?: string | null
          expected_unit?: string | null
          expected_value?: number | null
          expiry_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          level?: string | null
          lot_number?: string | null
          performed_by?: string | null
          performed_datetime?: string | null
          qc_material?: string | null
          qc_status?: string | null
          qc_type?: string
          result_unit?: string | null
          reviewed_by?: string | null
          reviewed_datetime?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_controls_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "lab_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_controls_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "lab_subspeciality"
            referencedColumns: ["id"]
          },
        ]
      }
      radiation_dose_tracking: {
        Row: {
          body_part: string | null
          created_at: string | null
          ct_dose_index: number | null
          dose_length_product: number | null
          dose_optimization_notes: string | null
          dose_reference_level: number | null
          effective_dose: number | null
          entrance_skin_dose: number | null
          exceeds_drl: boolean | null
          exposure_factors: Json | null
          fluoroscopy_time: number | null
          id: string
          kvp: number | null
          mas: number | null
          modality: string
          patient_age: number | null
          patient_id: string
          patient_weight: number | null
          pregnancy_status: string | null
          procedure_name: string | null
          recorded_at: string | null
          study_id: string | null
        }
        Insert: {
          body_part?: string | null
          created_at?: string | null
          ct_dose_index?: number | null
          dose_length_product?: number | null
          dose_optimization_notes?: string | null
          dose_reference_level?: number | null
          effective_dose?: number | null
          entrance_skin_dose?: number | null
          exceeds_drl?: boolean | null
          exposure_factors?: Json | null
          fluoroscopy_time?: number | null
          id?: string
          kvp?: number | null
          mas?: number | null
          modality: string
          patient_age?: number | null
          patient_id: string
          patient_weight?: number | null
          pregnancy_status?: string | null
          procedure_name?: string | null
          recorded_at?: string | null
          study_id?: string | null
        }
        Update: {
          body_part?: string | null
          created_at?: string | null
          ct_dose_index?: number | null
          dose_length_product?: number | null
          dose_optimization_notes?: string | null
          dose_reference_level?: number | null
          effective_dose?: number | null
          entrance_skin_dose?: number | null
          exceeds_drl?: boolean | null
          exposure_factors?: Json | null
          fluoroscopy_time?: number | null
          id?: string
          kvp?: number | null
          mas?: number | null
          modality?: string
          patient_age?: number | null
          patient_id?: string
          patient_weight?: number | null
          pregnancy_status?: string | null
          procedure_name?: string | null
          recorded_at?: string | null
          study_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "radiation_dose_tracking_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "dicom_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      radiologists: {
        Row: {
          created_at: string | null
          digital_signature_path: string | null
          email: string | null
          employee_id: string | null
          first_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          last_name: string
          license_number: string | null
          phone: string | null
          reporting_rate: number | null
          specializations: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          digital_signature_path?: string | null
          email?: string | null
          employee_id?: string | null
          first_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_name: string
          license_number?: string | null
          phone?: string | null
          reporting_rate?: number | null
          specializations?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          digital_signature_path?: string | null
          email?: string | null
          employee_id?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          license_number?: string | null
          phone?: string | null
          reporting_rate?: number | null
          specializations?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      radiology: {
        Row: {
          category: string | null
          cost: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cost?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cost?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      radiology_appointments: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          appointment_date: string
          appointment_number: string | null
          appointment_time: string
          complications: string | null
          contrast_administered: boolean | null
          contrast_volume: number | null
          created_at: string | null
          estimated_duration: number | null
          id: string
          modality_id: string | null
          notes: string | null
          order_id: string | null
          patient_arrived_at: string | null
          patient_id: string
          preparation_completed: boolean | null
          status: string | null
          technologist_id: string | null
          updated_at: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          appointment_date: string
          appointment_number?: string | null
          appointment_time: string
          complications?: string | null
          contrast_administered?: boolean | null
          contrast_volume?: number | null
          created_at?: string | null
          estimated_duration?: number | null
          id?: string
          modality_id?: string | null
          notes?: string | null
          order_id?: string | null
          patient_arrived_at?: string | null
          patient_id: string
          preparation_completed?: boolean | null
          status?: string | null
          technologist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          appointment_date?: string
          appointment_number?: string | null
          appointment_time?: string
          complications?: string | null
          contrast_administered?: boolean | null
          contrast_volume?: number | null
          created_at?: string | null
          estimated_duration?: number | null
          id?: string
          modality_id?: string | null
          notes?: string | null
          order_id?: string | null
          patient_arrived_at?: string | null
          patient_id?: string
          preparation_completed?: boolean | null
          status?: string | null
          technologist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "radiology_appointments_modality_id_fkey"
            columns: ["modality_id"]
            isOneToOne: false
            referencedRelation: "radiology_modalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radiology_appointments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "radiology_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radiology_appointments_technologist_id_fkey"
            columns: ["technologist_id"]
            isOneToOne: false
            referencedRelation: "radiology_technologists"
            referencedColumns: ["id"]
          },
        ]
      }
      radiology_modalities: {
        Row: {
          avg_study_duration: number | null
          calibration_date: string | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          installation_date: string | null
          is_active: boolean | null
          location: string | null
          manufacturer: string | null
          max_patients_per_day: number | null
          model: string | null
          name: string
          next_calibration_date: string | null
          radiation_type: string | null
          updated_at: string | null
        }
        Insert: {
          avg_study_duration?: number | null
          calibration_date?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          installation_date?: string | null
          is_active?: boolean | null
          location?: string | null
          manufacturer?: string | null
          max_patients_per_day?: number | null
          model?: string | null
          name: string
          next_calibration_date?: string | null
          radiation_type?: string | null
          updated_at?: string | null
        }
        Update: {
          avg_study_duration?: number | null
          calibration_date?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          installation_date?: string | null
          is_active?: boolean | null
          location?: string | null
          manufacturer?: string | null
          max_patients_per_day?: number | null
          model?: string | null
          name?: string
          next_calibration_date?: string | null
          radiation_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      radiology_orders: {
        Row: {
          clinical_history: string | null
          clinical_indication: string | null
          contrast_allergies: string | null
          created_at: string | null
          created_by: string | null
          estimated_cost: number | null
          id: string
          insurance_authorization: string | null
          modality_id: string | null
          notes: string | null
          order_date: string | null
          order_number: string
          ordering_department: string | null
          ordering_physician: string | null
          patient_height: number | null
          patient_id: string
          patient_weight: number | null
          pregnancy_status: string | null
          priority: string | null
          procedure_id: string | null
          requested_date: string | null
          scheduled_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          clinical_history?: string | null
          clinical_indication?: string | null
          contrast_allergies?: string | null
          created_at?: string | null
          created_by?: string | null
          estimated_cost?: number | null
          id?: string
          insurance_authorization?: string | null
          modality_id?: string | null
          notes?: string | null
          order_date?: string | null
          order_number: string
          ordering_department?: string | null
          ordering_physician?: string | null
          patient_height?: number | null
          patient_id: string
          patient_weight?: number | null
          pregnancy_status?: string | null
          priority?: string | null
          procedure_id?: string | null
          requested_date?: string | null
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          clinical_history?: string | null
          clinical_indication?: string | null
          contrast_allergies?: string | null
          created_at?: string | null
          created_by?: string | null
          estimated_cost?: number | null
          id?: string
          insurance_authorization?: string | null
          modality_id?: string | null
          notes?: string | null
          order_date?: string | null
          order_number?: string
          ordering_department?: string | null
          ordering_physician?: string | null
          patient_height?: number | null
          patient_id?: string
          patient_weight?: number | null
          pregnancy_status?: string | null
          priority?: string | null
          procedure_id?: string | null
          requested_date?: string | null
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "radiology_orders_modality_id_fkey"
            columns: ["modality_id"]
            isOneToOne: false
            referencedRelation: "radiology_modalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radiology_orders_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "radiology_procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      radiology_procedures: {
        Row: {
          body_part: string | null
          code: string
          contrast_required: boolean | null
          contrast_type: string | null
          cpt_code: string | null
          created_at: string | null
          estimated_duration: number | null
          icd_codes: string[] | null
          id: string
          is_active: boolean | null
          modality_id: string | null
          name: string
          preparation_instructions: string | null
          price: number | null
          procedure_steps: string | null
          radiation_dose: number | null
          study_type: string | null
          updated_at: string | null
        }
        Insert: {
          body_part?: string | null
          code: string
          contrast_required?: boolean | null
          contrast_type?: string | null
          cpt_code?: string | null
          created_at?: string | null
          estimated_duration?: number | null
          icd_codes?: string[] | null
          id?: string
          is_active?: boolean | null
          modality_id?: string | null
          name: string
          preparation_instructions?: string | null
          price?: number | null
          procedure_steps?: string | null
          radiation_dose?: number | null
          study_type?: string | null
          updated_at?: string | null
        }
        Update: {
          body_part?: string | null
          code?: string
          contrast_required?: boolean | null
          contrast_type?: string | null
          cpt_code?: string | null
          created_at?: string | null
          estimated_duration?: number | null
          icd_codes?: string[] | null
          id?: string
          is_active?: boolean | null
          modality_id?: string | null
          name?: string
          preparation_instructions?: string | null
          price?: number | null
          procedure_steps?: string | null
          radiation_dose?: number | null
          study_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "radiology_procedures_modality_id_fkey"
            columns: ["modality_id"]
            isOneToOne: false
            referencedRelation: "radiology_modalities"
            referencedColumns: ["id"]
          },
        ]
      }
      radiology_qa_checks: {
        Row: {
          corrective_action: string | null
          created_at: string | null
          deviation_percentage: number | null
          documentation_path: string | null
          id: string
          measured_values: Json | null
          modality_id: string | null
          next_test_date: string | null
          pass_fail_status: string | null
          performed_by: string | null
          phantom_used: string | null
          qa_type: string
          reference_values: Json | null
          supervisor_comments: string | null
          supervisor_review: boolean | null
          test_date: string
          test_name: string
          test_parameters: Json | null
          tolerance_limits: Json | null
          updated_at: string | null
        }
        Insert: {
          corrective_action?: string | null
          created_at?: string | null
          deviation_percentage?: number | null
          documentation_path?: string | null
          id?: string
          measured_values?: Json | null
          modality_id?: string | null
          next_test_date?: string | null
          pass_fail_status?: string | null
          performed_by?: string | null
          phantom_used?: string | null
          qa_type: string
          reference_values?: Json | null
          supervisor_comments?: string | null
          supervisor_review?: boolean | null
          test_date: string
          test_name: string
          test_parameters?: Json | null
          tolerance_limits?: Json | null
          updated_at?: string | null
        }
        Update: {
          corrective_action?: string | null
          created_at?: string | null
          deviation_percentage?: number | null
          documentation_path?: string | null
          id?: string
          measured_values?: Json | null
          modality_id?: string | null
          next_test_date?: string | null
          pass_fail_status?: string | null
          performed_by?: string | null
          phantom_used?: string | null
          qa_type?: string
          reference_values?: Json | null
          supervisor_comments?: string | null
          supervisor_review?: boolean | null
          test_date?: string
          test_name?: string
          test_parameters?: Json | null
          tolerance_limits?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "radiology_qa_checks_modality_id_fkey"
            columns: ["modality_id"]
            isOneToOne: false
            referencedRelation: "radiology_modalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radiology_qa_checks_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "radiology_technologists"
            referencedColumns: ["id"]
          },
        ]
      }
      radiology_reports: {
        Row: {
          amended_at: string | null
          amendment_reason: string | null
          clinical_information: string | null
          comparison_studies: string | null
          created_at: string | null
          critical_findings: string | null
          critical_notification_time: string | null
          critical_notified: boolean | null
          critical_notified_to: string | null
          dictated_at: string | null
          final_report_time: string | null
          findings: string
          id: string
          impression: string
          order_id: string | null
          patient_id: string
          preliminary_radiologist_id: string | null
          preliminary_report_time: string | null
          priority: string | null
          radiologist_id: string | null
          recommendations: string | null
          report_number: string
          report_status: string | null
          signed_at: string | null
          structured_reporting: Json | null
          study_id: string | null
          technique: string | null
          template_used: string | null
          turnaround_time_minutes: number | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          amended_at?: string | null
          amendment_reason?: string | null
          clinical_information?: string | null
          comparison_studies?: string | null
          created_at?: string | null
          critical_findings?: string | null
          critical_notification_time?: string | null
          critical_notified?: boolean | null
          critical_notified_to?: string | null
          dictated_at?: string | null
          final_report_time?: string | null
          findings: string
          id?: string
          impression: string
          order_id?: string | null
          patient_id: string
          preliminary_radiologist_id?: string | null
          preliminary_report_time?: string | null
          priority?: string | null
          radiologist_id?: string | null
          recommendations?: string | null
          report_number: string
          report_status?: string | null
          signed_at?: string | null
          structured_reporting?: Json | null
          study_id?: string | null
          technique?: string | null
          template_used?: string | null
          turnaround_time_minutes?: number | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          amended_at?: string | null
          amendment_reason?: string | null
          clinical_information?: string | null
          comparison_studies?: string | null
          created_at?: string | null
          critical_findings?: string | null
          critical_notification_time?: string | null
          critical_notified?: boolean | null
          critical_notified_to?: string | null
          dictated_at?: string | null
          final_report_time?: string | null
          findings?: string
          id?: string
          impression?: string
          order_id?: string | null
          patient_id?: string
          preliminary_radiologist_id?: string | null
          preliminary_report_time?: string | null
          priority?: string | null
          radiologist_id?: string | null
          recommendations?: string | null
          report_number?: string
          report_status?: string | null
          signed_at?: string | null
          structured_reporting?: Json | null
          study_id?: string | null
          technique?: string | null
          template_used?: string | null
          turnaround_time_minutes?: number | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "radiology_reports_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "radiology_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radiology_reports_preliminary_radiologist_id_fkey"
            columns: ["preliminary_radiologist_id"]
            isOneToOne: false
            referencedRelation: "radiologists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radiology_reports_radiologist_id_fkey"
            columns: ["radiologist_id"]
            isOneToOne: false
            referencedRelation: "radiologists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radiology_reports_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "dicom_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      radiology_technologists: {
        Row: {
          certified_modalities: string[] | null
          created_at: string | null
          email: string | null
          employee_id: string | null
          first_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          last_name: string
          license_number: string | null
          phone: string | null
          shift_timings: Json | null
          updated_at: string | null
        }
        Insert: {
          certified_modalities?: string[] | null
          created_at?: string | null
          email?: string | null
          employee_id?: string | null
          first_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_name: string
          license_number?: string | null
          phone?: string | null
          shift_timings?: Json | null
          updated_at?: string | null
        }
        Update: {
          certified_modalities?: string[] | null
          created_at?: string | null
          email?: string | null
          employee_id?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          license_number?: string | null
          phone?: string | null
          shift_timings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      referees: {
        Row: {
          contact_info: string | null
          created_at: string
          id: string
          institution: string | null
          name: string
          specialty: string | null
          updated_at: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          id?: string
          institution?: string | null
          name: string
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          id?: string
          institution?: string | null
          name?: string
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      resource_allocations: {
        Row: {
          allocated_at: string | null
          allocated_by: string
          created_at: string | null
          id: string
          ot_patient_id: string | null
          quantity_allocated: number
          resource_id: string | null
          resource_name: string
          resource_type: string
          status: string
          updated_at: string | null
        }
        Insert: {
          allocated_at?: string | null
          allocated_by: string
          created_at?: string | null
          id?: string
          ot_patient_id?: string | null
          quantity_allocated?: number
          resource_id?: string | null
          resource_name: string
          resource_type: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          allocated_at?: string | null
          allocated_by?: string
          created_at?: string | null
          id?: string
          ot_patient_id?: string | null
          quantity_allocated?: number
          resource_id?: string | null
          resource_name?: string
          resource_type?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_allocations_ot_patient_id_fkey"
            columns: ["ot_patient_id"]
            isOneToOne: false
            referencedRelation: "active_ot_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_allocations_ot_patient_id_fkey"
            columns: ["ot_patient_id"]
            isOneToOne: false
            referencedRelation: "ot_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          availability_status: string
          created_at: string | null
          current_assignment: string | null
          id: string
          name: string
          role: string
          shift_end: string
          shift_start: string
          specialization: string | null
          updated_at: string | null
        }
        Insert: {
          availability_status?: string
          created_at?: string | null
          current_assignment?: string | null
          id?: string
          name: string
          role: string
          shift_end: string
          shift_start: string
          specialization?: string | null
          updated_at?: string | null
        }
        Update: {
          availability_status?: string
          created_at?: string | null
          current_assignment?: string | null
          id?: string
          name?: string
          role?: string
          shift_end?: string
          shift_start?: string
          specialization?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string | null
          id: string
          inventory_id: string | null
          medicine_id: string | null
          movement_date: string | null
          movement_type: string
          performed_by: string | null
          quantity_after: number
          quantity_before: number
          quantity_changed: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_id?: string | null
          medicine_id?: string | null
          movement_date?: string | null
          movement_type: string
          performed_by?: string | null
          quantity_after: number
          quantity_before: number
          quantity_changed: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_id?: string | null
          medicine_id?: string | null
          movement_date?: string | null
          movement_type?: string
          performed_by?: string | null
          quantity_after?: number
          quantity_before?: number
          quantity_changed?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "medicine_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transactions: {
        Row: {
          created_at: string | null
          id: string
          inventory_item_id: string | null
          new_stock: number
          notes: string | null
          performed_by: string
          previous_stock: number
          quantity_change: number
          reference_id: string | null
          total_cost: number | null
          transaction_type: string
          unit_cost: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          new_stock: number
          notes?: string | null
          performed_by: string
          previous_stock: number
          quantity_change: number
          reference_id?: string | null
          total_cost?: number | null
          transaction_type: string
          unit_cost?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          new_stock?: number
          notes?: string | null
          performed_by?: string
          previous_stock?: number
          quantity_change?: number
          reference_id?: string | null
          total_cost?: number | null
          transaction_type?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_transactions_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_status"
            referencedColumns: ["id"]
          },
        ]
      }
      surgical_billing: {
        Row: {
          claim_id: string | null
          corporate_type: string
          created_at: string | null
          id: string
          patient_id: string | null
          presurgical_date_from: string | null
          presurgical_date_to: string | null
          section_visibility: Json | null
          surgical_conservative_date_from: string | null
          surgical_conservative_date_to: string | null
          surgical_package_date_from: string | null
          surgical_package_date_to: string | null
          updated_at: string | null
        }
        Insert: {
          claim_id?: string | null
          corporate_type?: string
          created_at?: string | null
          id?: string
          patient_id?: string | null
          presurgical_date_from?: string | null
          presurgical_date_to?: string | null
          section_visibility?: Json | null
          surgical_conservative_date_from?: string | null
          surgical_conservative_date_to?: string | null
          surgical_package_date_from?: string | null
          surgical_package_date_to?: string | null
          updated_at?: string | null
        }
        Update: {
          claim_id?: string | null
          corporate_type?: string
          created_at?: string | null
          id?: string
          patient_id?: string | null
          presurgical_date_from?: string | null
          presurgical_date_to?: string | null
          section_visibility?: Json | null
          surgical_conservative_date_from?: string | null
          surgical_conservative_date_to?: string | null
          surgical_package_date_from?: string | null
          surgical_package_date_to?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surgical_billing_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      surgical_treatments: {
        Row: {
          adjustment_type: string
          adjustment_value: number
          amount: number
          base_amount: number
          created_at: string | null
          final_amount: number
          id: string
          quantity: number
          sort_order: number
          surgery_name: string
          surgical_billing_id: string | null
          updated_at: string | null
          visible: boolean
        }
        Insert: {
          adjustment_type?: string
          adjustment_value?: number
          amount?: number
          base_amount?: number
          created_at?: string | null
          final_amount?: number
          id?: string
          quantity?: number
          sort_order?: number
          surgery_name: string
          surgical_billing_id?: string | null
          updated_at?: string | null
          visible?: boolean
        }
        Update: {
          adjustment_type?: string
          adjustment_value?: number
          amount?: number
          base_amount?: number
          created_at?: string | null
          final_amount?: number
          id?: string
          quantity?: number
          sort_order?: number
          surgery_name?: string
          surgical_billing_id?: string | null
          updated_at?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "surgical_treatments_surgical_billing_id_fkey"
            columns: ["surgical_billing_id"]
            isOneToOne: false
            referencedRelation: "surgical_billing"
            referencedColumns: ["id"]
          },
        ]
      }
      test_categories: {
        Row: {
          category_code: string
          category_name: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          parent_category_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_code: string
          category_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          parent_category_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_code?: string
          category_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          parent_category_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "test_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      test_panels: {
        Row: {
          category_id: string | null
          created_at: string | null
          department_id: string | null
          description: string | null
          discount_percentage: number | null
          id: string
          is_active: boolean | null
          panel_code: string
          panel_name: string
          panel_price: number | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          panel_code: string
          panel_name: string
          panel_price?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          panel_code?: string
          panel_name?: string
          panel_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_panels_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "test_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_panels_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "lab_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          abnormal_flag: string | null
          analyzer_used: string | null
          approved_by: string | null
          approved_datetime: string | null
          calibration_datetime: string | null
          created_at: string | null
          id: string
          is_abnormal: boolean | null
          is_critical: boolean | null
          method_used: string | null
          order_id: string | null
          order_item_id: string | null
          pathologist_comment: string | null
          performed_by: string | null
          qc_status: string | null
          reagent_lot: string | null
          reference_range: string | null
          result_comment: string | null
          result_datetime: string | null
          result_status: string | null
          result_type: string | null
          result_unit: string | null
          result_value: string | null
          reviewed_by: string | null
          reviewed_datetime: string | null
          sample_id: string | null
          technician_comment: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          abnormal_flag?: string | null
          analyzer_used?: string | null
          approved_by?: string | null
          approved_datetime?: string | null
          calibration_datetime?: string | null
          created_at?: string | null
          id?: string
          is_abnormal?: boolean | null
          is_critical?: boolean | null
          method_used?: string | null
          order_id?: string | null
          order_item_id?: string | null
          pathologist_comment?: string | null
          performed_by?: string | null
          qc_status?: string | null
          reagent_lot?: string | null
          reference_range?: string | null
          result_comment?: string | null
          result_datetime?: string | null
          result_status?: string | null
          result_type?: string | null
          result_unit?: string | null
          result_value?: string | null
          reviewed_by?: string | null
          reviewed_datetime?: string | null
          sample_id?: string | null
          technician_comment?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          abnormal_flag?: string | null
          analyzer_used?: string | null
          approved_by?: string | null
          approved_datetime?: string | null
          calibration_datetime?: string | null
          created_at?: string | null
          id?: string
          is_abnormal?: boolean | null
          is_critical?: boolean | null
          method_used?: string | null
          order_id?: string | null
          order_item_id?: string | null
          pathologist_comment?: string | null
          performed_by?: string | null
          qc_status?: string | null
          reagent_lot?: string | null
          reference_range?: string | null
          result_comment?: string | null
          result_datetime?: string | null
          result_status?: string | null
          result_type?: string | null
          result_unit?: string | null
          result_value?: string | null
          reviewed_by?: string | null
          reviewed_datetime?: string | null
          sample_id?: string | null
          technician_comment?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_results_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_test_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "lab_samples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "lab_subspeciality"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          created_at: string | null
          email: string
          hospital_type: string | null
          id: string
          password: string
          role: string
        }
        Insert: {
          created_at?: string | null
          email: string
          hospital_type?: string | null
          id?: string
          password: string
          role?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          hospital_type?: string | null
          id?: string
          password?: string
          role?: string
        }
        Relationships: []
      }
      visit_complications: {
        Row: {
          complication_id: string | null
          id: string
          visit_id: string | null
        }
        Insert: {
          complication_id?: string | null
          id?: string
          visit_id?: string | null
        }
        Update: {
          complication_id?: string | null
          id?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_complications_complication_id_fkey"
            columns: ["complication_id"]
            isOneToOne: false
            referencedRelation: "complications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_complications_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_consultants: {
        Row: {
          consultant_id: string | null
          id: string
          visit_id: string | null
        }
        Insert: {
          consultant_id?: string | null
          id?: string
          visit_id?: string | null
        }
        Update: {
          consultant_id?: string | null
          id?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_consultants_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "referees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_consultants_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_diagnoses: {
        Row: {
          created_at: string | null
          diagnosis_id: string
          id: string
          is_primary: boolean | null
          notes: string | null
          updated_at: string | null
          visit_id: string
        }
        Insert: {
          created_at?: string | null
          diagnosis_id: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          updated_at?: string | null
          visit_id: string
        }
        Update: {
          created_at?: string | null
          diagnosis_id?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          updated_at?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_diagnoses_diagnosis_id_fkey"
            columns: ["diagnosis_id"]
            isOneToOne: false
            referencedRelation: "diagnoses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_diagnoses_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_esic_surgeons: {
        Row: {
          created_at: string | null
          id: string
          surgeon_id: string
          updated_at: string | null
          visit_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          surgeon_id: string
          updated_at?: string | null
          visit_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          surgeon_id?: string
          updated_at?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_esic_surgeons_surgeon_id_fkey"
            columns: ["surgeon_id"]
            isOneToOne: false
            referencedRelation: "esic_surgeons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_esic_surgeons_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_hope_consultants: {
        Row: {
          consultant_id: string
          created_at: string | null
          id: string
          updated_at: string | null
          visit_id: string
        }
        Insert: {
          consultant_id: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          visit_id: string
        }
        Update: {
          consultant_id?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_hope_consultants_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "hope_consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_hope_consultants_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_hope_surgeons: {
        Row: {
          created_at: string | null
          id: string
          surgeon_id: string
          updated_at: string | null
          visit_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          surgeon_id: string
          updated_at?: string | null
          visit_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          surgeon_id?: string
          updated_at?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_hope_surgeons_surgeon_id_fkey"
            columns: ["surgeon_id"]
            isOneToOne: false
            referencedRelation: "hope_surgeons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_hope_surgeons_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_labs: {
        Row: {
          collected_date: string | null
          completed_date: string | null
          created_at: string | null
          id: string
          lab_id: string
          normal_range: string | null
          notes: string | null
          ordered_date: string | null
          result_value: string | null
          status: string | null
          updated_at: string | null
          visit_id: string
        }
        Insert: {
          collected_date?: string | null
          completed_date?: string | null
          created_at?: string | null
          id?: string
          lab_id: string
          normal_range?: string | null
          notes?: string | null
          ordered_date?: string | null
          result_value?: string | null
          status?: string | null
          updated_at?: string | null
          visit_id: string
        }
        Update: {
          collected_date?: string | null
          completed_date?: string | null
          created_at?: string | null
          id?: string
          lab_id?: string
          normal_range?: string | null
          notes?: string | null
          ordered_date?: string | null
          result_value?: string | null
          status?: string | null
          updated_at?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_labs_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "lab"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_labs_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_medical_data: {
        Row: {
          allergies: string | null
          created_at: string | null
          current_medications: string | null
          examination_findings: string | null
          id: string
          medical_history: string | null
          notes: string | null
          primary_diagnosis: string | null
          secondary_diagnosis: string | null
          symptoms: string | null
          treatment_plan: string | null
          updated_at: string | null
          visit_id: string
          vital_signs: Json | null
        }
        Insert: {
          allergies?: string | null
          created_at?: string | null
          current_medications?: string | null
          examination_findings?: string | null
          id?: string
          medical_history?: string | null
          notes?: string | null
          primary_diagnosis?: string | null
          secondary_diagnosis?: string | null
          symptoms?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
          visit_id: string
          vital_signs?: Json | null
        }
        Update: {
          allergies?: string | null
          created_at?: string | null
          current_medications?: string | null
          examination_findings?: string | null
          id?: string
          medical_history?: string | null
          notes?: string | null
          primary_diagnosis?: string | null
          secondary_diagnosis?: string | null
          symptoms?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
          visit_id?: string
          vital_signs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_medical_data_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_medications: {
        Row: {
          created_at: string | null
          dosage: string | null
          duration: string | null
          end_date: string | null
          frequency: string | null
          id: string
          medication_id: string
          medication_type: string | null
          notes: string | null
          prescribed_date: string | null
          route: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          visit_id: string
        }
        Insert: {
          created_at?: string | null
          dosage?: string | null
          duration?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          medication_id: string
          medication_type?: string | null
          notes?: string | null
          prescribed_date?: string | null
          route?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          visit_id: string
        }
        Update: {
          created_at?: string | null
          dosage?: string | null
          duration?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          medication_id?: string
          medication_type?: string | null
          notes?: string | null
          prescribed_date?: string | null
          route?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_medications_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medication"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_medications_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_radiology: {
        Row: {
          additional_notes: string | null
          advice: string | null
          completed_date: string | null
          cost: number | null
          created_at: string | null
          findings: string | null
          id: string
          image_impression: string | null
          impression: string | null
          no_of_slices: number | null
          notes: string | null
          ordered_date: string | null
          quantity: number | null
          radiology_id: string
          report_text: string | null
          result_date: string | null
          result_status: string | null
          scheduled_date: string | null
          selected_doctor: string | null
          status: string | null
          template_used: string | null
          unit_rate: number | null
          updated_at: string | null
          uploaded_file_name: string | null
          uploaded_file_path: string | null
          uploaded_file_size: number | null
          visit_id: string
        }
        Insert: {
          additional_notes?: string | null
          advice?: string | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          findings?: string | null
          id?: string
          image_impression?: string | null
          impression?: string | null
          no_of_slices?: number | null
          notes?: string | null
          ordered_date?: string | null
          quantity?: number | null
          radiology_id: string
          report_text?: string | null
          result_date?: string | null
          result_status?: string | null
          scheduled_date?: string | null
          selected_doctor?: string | null
          status?: string | null
          template_used?: string | null
          unit_rate?: number | null
          updated_at?: string | null
          uploaded_file_name?: string | null
          uploaded_file_path?: string | null
          uploaded_file_size?: number | null
          visit_id: string
        }
        Update: {
          additional_notes?: string | null
          advice?: string | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          findings?: string | null
          id?: string
          image_impression?: string | null
          impression?: string | null
          no_of_slices?: number | null
          notes?: string | null
          ordered_date?: string | null
          quantity?: number | null
          radiology_id?: string
          report_text?: string | null
          result_date?: string | null
          result_status?: string | null
          scheduled_date?: string | null
          selected_doctor?: string | null
          status?: string | null
          template_used?: string | null
          unit_rate?: number | null
          updated_at?: string | null
          uploaded_file_name?: string | null
          uploaded_file_path?: string | null
          uploaded_file_size?: number | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_radiology_radiology_id_fkey"
            columns: ["radiology_id"]
            isOneToOne: false
            referencedRelation: "radiology"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_radiology_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_referees: {
        Row: {
          created_at: string | null
          id: string
          referee_id: string
          updated_at: string | null
          visit_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          referee_id: string
          updated_at?: string | null
          visit_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          referee_id?: string
          updated_at?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_referees_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "referees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_referees_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_surgeons: {
        Row: {
          id: string
          surgeon_id: string | null
          surgeon_type: string | null
          visit_id: string | null
        }
        Insert: {
          id?: string
          surgeon_id?: string | null
          surgeon_type?: string | null
          visit_id?: string | null
        }
        Update: {
          id?: string
          surgeon_id?: string | null
          surgeon_type?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_surgeons_surgeon_id_fkey"
            columns: ["surgeon_id"]
            isOneToOne: false
            referencedRelation: "esic_surgeons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_surgeons_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_surgeries: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          notes: string | null
          sanction_status: string | null
          status: string | null
          surgery_id: string
          updated_at: string | null
          visit_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          sanction_status?: string | null
          status?: string | null
          surgery_id: string
          updated_at?: string | null
          visit_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          sanction_status?: string | null
          status?: string | null
          surgery_id?: string
          updated_at?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_surgeries_surgery_id_fkey"
            columns: ["surgery_id"]
            isOneToOne: false
            referencedRelation: "cghs_surgery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_surgeries_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          additional_approvals: string | null
          admission_date: string | null
          appointment_with: string
          authorized_by: string | null
          bill_paid: boolean | null
          billing_executive: string | null
          billing_status: string | null
          billing_sub_status: string | null
          bunch_no: string | null
          cghs_code: string | null
          claim_id: string | null
          esic_uh_id: string | null
          condonation_delay_claim: string | null
          condonation_delay_intimation: string | null
          condonation_delay_submission: string | null
          created_at: string
          delay_waiver_intimation: string | null
          diagnosis_id: string | null
          discharge_date: string | null
          discharge_mode: string | null
          discharge_notes: string | null
          discharge_summary_signed: boolean | null
          extension_of_stay: string | null
          extension_taken: string | null
          file_status: string | null
          final_bill_printed: boolean | null
          gate_pass_generated: boolean | null
          gate_pass_id: string | null
          id: string
          intimation_done: string | null
          nurse_clearance: boolean | null
          package_amount: string | null
          patient_id: string
          pharmacy_clearance: boolean | null
          reason_for_visit: string | null
          referring_doctor_id: string | null
          relation_with_employee: string | null
          remark1: string | null
          remark2: string | null
          sr_no: string | null
          discharged_sr_no: string | null
          sst_treatment: string | null
          status: string | null
          surgery_date: string | null
          surgical_approval: string | null
          updated_at: string
          visit_date: string
          visit_id: string
          visit_type: string
        }
        Insert: {
          additional_approvals?: string | null
          admission_date?: string | null
          appointment_with: string
          authorized_by?: string | null
          bill_paid?: boolean | null
          billing_executive?: string | null
          billing_status?: string | null
          billing_sub_status?: string | null
          bunch_no?: string | null
          cghs_code?: string | null
          claim_id?: string | null
          esic_uh_id?: string | null
          condonation_delay_claim?: string | null
          condonation_delay_intimation?: string | null
          condonation_delay_submission?: string | null
          created_at?: string
          delay_waiver_intimation?: string | null
          diagnosis_id?: string | null
          discharge_date?: string | null
          discharge_mode?: string | null
          discharge_notes?: string | null
          discharge_summary_signed?: boolean | null
          extension_of_stay?: string | null
          extension_taken?: string | null
          file_status?: string | null
          final_bill_printed?: boolean | null
          gate_pass_generated?: boolean | null
          gate_pass_id?: string | null
          id?: string
          intimation_done?: string | null
          nurse_clearance?: boolean | null
          package_amount?: string | null
          patient_id: string
          pharmacy_clearance?: boolean | null
          reason_for_visit?: string | null
          referring_doctor_id?: string | null
          relation_with_employee?: string | null
          remark1?: string | null
          remark2?: string | null
          sr_no?: string | null
          discharged_sr_no?: string | null
          sst_treatment?: string | null
          status?: string | null
          surgery_date?: string | null
          surgical_approval?: string | null
          updated_at?: string
          visit_date: string
          visit_id: string
          visit_type: string
        }
        Update: {
          additional_approvals?: string | null
          admission_date?: string | null
          appointment_with?: string
          authorized_by?: string | null
          bill_paid?: boolean | null
          billing_executive?: string | null
          billing_status?: string | null
          billing_sub_status?: string | null
          bunch_no?: string | null
          cghs_code?: string | null
          claim_id?: string | null
          esic_uh_id?: string | null
          condonation_delay_claim?: string | null
          condonation_delay_intimation?: string | null
          condonation_delay_submission?: string | null
          created_at?: string
          delay_waiver_intimation?: string | null
          diagnosis_id?: string | null
          discharge_date?: string | null
          discharge_mode?: string | null
          discharge_notes?: string | null
          discharge_summary_signed?: boolean | null
          extension_of_stay?: string | null
          extension_taken?: string | null
          file_status?: string | null
          final_bill_printed?: boolean | null
          gate_pass_generated?: boolean | null
          gate_pass_id?: string | null
          id?: string
          intimation_done?: string | null
          nurse_clearance?: boolean | null
          package_amount?: string | null
          patient_id?: string
          pharmacy_clearance?: boolean | null
          reason_for_visit?: string | null
          referring_doctor_id?: string | null
          relation_with_employee?: string | null
          remark1?: string | null
          remark2?: string | null
          sr_no?: string | null
          discharged_sr_no?: string | null
          sst_treatment?: string | null
          status?: string | null
          surgery_date?: string | null
          surgical_approval?: string | null
          updated_at?: string
          visit_date?: string
          visit_id?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_diagnosis_id_fkey"
            columns: ["diagnosis_id"]
            isOneToOne: false
            referencedRelation: "diagnoses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_referring_doctor_id_fkey"
            columns: ["referring_doctor_id"]
            isOneToOne: false
            referencedRelation: "referees"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_entries: {
        Row: {
          account_id: string | null
          created_at: string | null
          credit_amount: number | null
          debit_amount: number | null
          entry_order: number | null
          id: string
          narration: string | null
          patient_ledger_id: string | null
          voucher_id: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          entry_order?: number | null
          id?: string
          narration?: string | null
          patient_ledger_id?: string | null
          voucher_id?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          entry_order?: number | null
          id?: string
          narration?: string | null
          patient_ledger_id?: string | null
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voucher_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_entries_patient_ledger_id_fkey"
            columns: ["patient_ledger_id"]
            isOneToOne: false
            referencedRelation: "patient_ledgers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_entries_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_types: {
        Row: {
          created_at: string | null
          current_number: number | null
          id: string
          is_active: boolean | null
          prefix: string
          updated_at: string | null
          voucher_category: string
          voucher_type_code: string
          voucher_type_name: string
        }
        Insert: {
          created_at?: string | null
          current_number?: number | null
          id?: string
          is_active?: boolean | null
          prefix: string
          updated_at?: string | null
          voucher_category: string
          voucher_type_code: string
          voucher_type_name: string
        }
        Update: {
          created_at?: string | null
          current_number?: number | null
          id?: string
          is_active?: boolean | null
          prefix?: string
          updated_at?: string | null
          voucher_category?: string
          voucher_type_code?: string
          voucher_type_name?: string
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          bill_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          narration: string | null
          patient_id: string | null
          reference_date: string | null
          reference_number: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
          voucher_date: string
          voucher_number: string
          voucher_type_id: string | null
        }
        Insert: {
          bill_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          narration?: string | null
          patient_id?: string | null
          reference_date?: string | null
          reference_number?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          voucher_date: string
          voucher_number: string
          voucher_type_id?: string | null
        }
        Update: {
          bill_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          narration?: string | null
          patient_id?: string | null
          reference_date?: string | null
          reference_number?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          voucher_date?: string
          voucher_number?: string
          voucher_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_voucher_type_id_fkey"
            columns: ["voucher_type_id"]
            isOneToOne: false
            referencedRelation: "voucher_types"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_transitions: {
        Row: {
          created_at: string | null
          duration_in_previous_status: number | null
          from_status: string
          id: string
          notes: string | null
          ot_patient_id: string | null
          performed_by: string
          to_status: string
          transition_time: string | null
        }
        Insert: {
          created_at?: string | null
          duration_in_previous_status?: number | null
          from_status: string
          id?: string
          notes?: string | null
          ot_patient_id?: string | null
          performed_by: string
          to_status: string
          transition_time?: string | null
        }
        Update: {
          created_at?: string | null
          duration_in_previous_status?: number | null
          from_status?: string
          id?: string
          notes?: string | null
          ot_patient_id?: string | null
          performed_by?: string
          to_status?: string
          transition_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_transitions_ot_patient_id_fkey"
            columns: ["ot_patient_id"]
            isOneToOne: false
            referencedRelation: "active_ot_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_transitions_ot_patient_id_fkey"
            columns: ["ot_patient_id"]
            isOneToOne: false
            referencedRelation: "ot_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      worklist_items: {
        Row: {
          completed_by: string | null
          completion_time: string | null
          created_at: string | null
          id: string
          item_status: string | null
          order_id: string | null
          order_item_id: string | null
          priority: string | null
          processing_notes: string | null
          sample_id: string | null
          sample_type: string | null
          sequence_number: number | null
          start_time: string | null
          started_by: string | null
          test_name: string | null
          updated_at: string | null
          worklist_id: string | null
        }
        Insert: {
          completed_by?: string | null
          completion_time?: string | null
          created_at?: string | null
          id?: string
          item_status?: string | null
          order_id?: string | null
          order_item_id?: string | null
          priority?: string | null
          processing_notes?: string | null
          sample_id?: string | null
          sample_type?: string | null
          sequence_number?: number | null
          start_time?: string | null
          started_by?: string | null
          test_name?: string | null
          updated_at?: string | null
          worklist_id?: string | null
        }
        Update: {
          completed_by?: string | null
          completion_time?: string | null
          created_at?: string | null
          id?: string
          item_status?: string | null
          order_id?: string | null
          order_item_id?: string | null
          priority?: string | null
          processing_notes?: string | null
          sample_id?: string | null
          sample_type?: string | null
          sequence_number?: number | null
          start_time?: string | null
          started_by?: string | null
          test_name?: string | null
          updated_at?: string | null
          worklist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worklist_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worklist_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_test_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worklist_items_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "lab_samples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worklist_items_worklist_id_fkey"
            columns: ["worklist_id"]
            isOneToOne: false
            referencedRelation: "lab_worklists"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_ot_patients: {
        Row: {
          anesthesiologist: string | null
          checklist_complete: boolean | null
          checklist_completed_at: string | null
          created_at: string | null
          estimated_duration: number | null
          id: string | null
          patient_id: string | null
          patient_name: string | null
          priority: string | null
          scheduled_time: string | null
          status: string | null
          surgeon: string | null
          surgery: string | null
          theatre_name: string | null
          theatre_number: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ot_patients_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_patients_theatre_number_fkey"
            columns: ["theatre_number"]
            isOneToOne: false
            referencedRelation: "operation_theatres"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_status: {
        Row: {
          batch_number: string | null
          category: string | null
          created_at: string | null
          current_stock: number | null
          expiring_soon: boolean | null
          expiry_date: string | null
          id: string | null
          last_restocked: string | null
          last_sterilized: string | null
          max_stock_level: number | null
          min_stock_level: number | null
          name: string | null
          sterilization_required: boolean | null
          stock_status: string | null
          supplier: string | null
          total_value: number | null
          unit_cost: number | null
          updated_at: string | null
          usage_per_day: number | null
        }
        Insert: {
          batch_number?: string | null
          category?: string | null
          created_at?: string | null
          current_stock?: number | null
          expiring_soon?: never
          expiry_date?: string | null
          id?: string | null
          last_restocked?: string | null
          last_sterilized?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          name?: string | null
          sterilization_required?: boolean | null
          stock_status?: never
          supplier?: string | null
          total_value?: never
          unit_cost?: number | null
          updated_at?: string | null
          usage_per_day?: number | null
        }
        Update: {
          batch_number?: string | null
          category?: string | null
          created_at?: string | null
          current_stock?: number | null
          expiring_soon?: never
          expiry_date?: string | null
          id?: string | null
          last_restocked?: string | null
          last_sterilized?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          name?: string | null
          sterilization_required?: boolean | null
          stock_status?: never
          supplier?: string | null
          total_value?: never
          unit_cost?: number | null
          updated_at?: string | null
          usage_per_day?: number | null
        }
        Relationships: []
      }
      resource_allocation_summary: {
        Row: {
          allocated_at: string | null
          allocated_by: string | null
          created_at: string | null
          id: string | null
          ot_patient_id: string | null
          patient_name: string | null
          patient_status: string | null
          quantity_allocated: number | null
          resource_id: string | null
          resource_name: string | null
          resource_type: string | null
          status: string | null
          surgery: string | null
          theatre_name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_allocations_ot_patient_id_fkey"
            columns: ["ot_patient_id"]
            isOneToOne: false
            referencedRelation: "active_ot_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_allocations_ot_patient_id_fkey"
            columns: ["ot_patient_id"]
            isOneToOne: false
            referencedRelation: "ot_patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_gate_pass_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      date_status: "0" | "1" | "2"
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
      date_status: ["0", "1", "2"],
    },
  },
} as const
