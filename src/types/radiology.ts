// Priority types
export type Priority = 'routine' | 'urgent' | 'stat';
export type OrderStatus = 'ordered' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type AppointmentStatus = 'scheduled' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type ReportStatus = 'pending' | 'preliminary' | 'final' | 'amended';

// Base radiology interfaces
export interface RadiologyModality {
  id: string;
  name: string;
  code: string;
  manufacturer?: string;
  model?: string;
  location?: string;
  is_active: boolean;
  installation_date?: string;
  calibration_date?: string;
  next_calibration_date?: string;
  radiation_type?: string;
  max_patients_per_day?: number;
  avg_study_duration?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface RadiologyProcedure {
  id: string;
  code: string;
  name: string;
  modality_id?: string;
  body_part?: string;
  study_type?: string;
  contrast_required: boolean;
  contrast_type?: string;
  preparation_instructions?: string;
  procedure_steps?: string;
  estimated_duration?: number;
  price?: number;
  cpt_code?: string;
  icd_codes?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Radiologist {
  id: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  license_number?: string;
  specializations?: string[];
  hire_date?: string;
  is_active: boolean;
  digital_signature_path?: string;
  reporting_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface RadiologyTechnologist {
  id: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  license_number?: string;
  certified_modalities?: string[];
  hire_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RadiologyOrder {
  id: string;
  order_number: string;
  patient_id: string;
  ordering_physician?: string;
  ordering_department?: string;
  procedure_id?: string;
  modality_id?: string;
  clinical_indication?: string;
  clinical_history?: string;
  priority: Priority;
  status: OrderStatus;
  order_date?: string;
  requested_date?: string;
  scheduled_date?: string;
  estimated_cost?: number;
  insurance_authorization?: string;
  patient_weight?: number;
  patient_height?: number;
  pregnancy_status?: string;
  contrast_allergies?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RadiologyAppointment {
  id: string;
  appointment_number?: string;
  patient_id: string;
  order_id?: string;
  modality_id?: string;
  technologist_id?: string;
  appointment_date: string;
  appointment_time: string;
  estimated_duration?: number;
  status: AppointmentStatus;
  patient_arrived_at?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  preparation_completed: boolean;
  contrast_administered: boolean;
  contrast_volume?: number;
  complications?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DicomStudy {
  id: string;
  study_instance_uid: string;
  patient_id: string;
  order_id?: string;
  appointment_id?: string;
  accession_number?: string;
  study_date: string;
  study_time?: string;
  modality: string;
  study_description?: string;
  series_count: number;
  image_count: number;
  performing_physician?: string;
  referring_physician?: string;
  body_part_examined?: string;
  patient_position?: string;
  view_position?: string;
  study_size_mb?: number;
  pacs_location?: string;
  archived: boolean;
  archive_location?: string;
  quality_score?: number;
  technical_adequacy?: string;
  artifacts_present: boolean;
  artifact_description?: string;
  created_at: string;
  updated_at: string;
}

export interface RadiologyReport {
  id: string;
  report_number: string;
  study_id: string;
  order_id: string;
  patient_id: string;
  radiologist_id?: string;
  template_id?: string;
  report_status: ReportStatus;
  priority: Priority;
  findings: string;
  impression: string;
  recommendations?: string;
  comparison_studies?: string;
  clinical_information?: string;
  technique?: string;
  limitations?: string;
  critical_findings?: string;
  turnaround_time_minutes?: number;
  dictated_at?: string;
  transcribed_at?: string;
  reviewed_at?: string;
  finalized_at?: string;
  amended_at?: string;
  amendment_reason?: string;
  verified_by?: string;
  signed_by?: string;
  word_count?: number;
  created_at: string;
  updated_at: string;
}

export interface RadiologyReportTemplate {
  id: string;
  template_name: string;
  modality?: string;
  body_part?: string;
  procedure_type?: string;
  template_content: string;
  findings_sections?: string[];
  impression_template?: string;
  recommendations_template?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RadiologyQACheck {
  id: string;
  modality_id?: string;
  test_type: string;
  test_date: string;
  performed_by?: string;
  test_parameters?: Record<string, any>;
  measured_values?: Record<string, any>;
  reference_values?: Record<string, any>;
  deviation_percentage?: number;
  pass_fail_status: string;
  corrective_action?: string;
  next_test_date?: string;
  documentation_path?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RadiationDoseTracking {
  id: string;
  patient_id: string;
  study_id?: string;
  modality: string;
  procedure_name?: string;
  patient_age?: number;
  patient_weight?: number;
  body_part?: string;
  effective_dose?: number;
  entrance_skin_dose?: number;
  ct_dose_index?: number;
  dose_length_product?: number;
  fluoroscopy_time?: number;
  exposure_factors?: Record<string, any>;
  kvp?: number;
  mas?: number;
  dose_reference_level?: number;
  exceeds_drl: boolean;
  pregnancy_status?: string;
  dose_optimization_notes?: string;
  recorded_at?: string;
  created_at: string;
}

export interface ContrastAdministration {
  id: string;
  patient_id: string;
  study_id?: string;
  contrast_agent: string;
  contrast_type: string;
  volume_administered: number;
  concentration?: string;
  administration_route: string;
  administration_time?: string;
  administered_by?: string;
  patient_weight?: number;
  dose_per_kg?: number;
  allergic_reaction: boolean;
  reaction_severity?: string;
  reaction_description?: string;
  treatment_given?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ImageArchive {
  id: string;
  study_id: string;
  archive_type: string;
  archive_location: string;
  archive_date?: string;
  archive_size_mb?: number;
  compression_type?: string;
  encryption_status?: string;
  retrieval_time_estimate?: number;
  storage_tier: string;
  retention_period_years?: number;
  deletion_date?: string;
  backup_location?: string;
  checksum?: string;
  created_at: string;
  updated_at: string;
}

export interface RadiologyMaintenance {
  id: string;
  modality_id?: string;
  maintenance_type: string;
  scheduled_date?: string;
  performed_date?: string;
  performed_by?: string;
  maintenance_description?: string;
  parts_replaced?: string[];
  labor_hours?: number;
  cost?: number;
  next_maintenance_date?: string;
  maintenance_notes?: string;
  documentation_path?: string;
  created_at: string;
  updated_at: string;
}

export interface RadiologyMetrics {
  id: string;
  metric_date: string;
  modality?: string;
  total_studies: number;
  completed_studies: number;
  cancelled_studies: number;
  avg_turnaround_time_minutes?: number;
  avg_report_time_minutes?: number;
  patient_satisfaction_score?: number;
  equipment_uptime_percentage?: number;
  critical_findings_count: number;
  repeat_exam_rate?: number;
  no_show_rate?: number;
  created_at: string;
  updated_at: string;
}
