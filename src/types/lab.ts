export interface LabOrder {
  id: string;
  order_number: string;
  patient_name: string;
  patient_id?: string;
  patient_age?: number;
  patient_gender?: string;
  patient_phone?: string;
  ordering_doctor: string;
  doctor_id?: string;
  order_date: string;
  order_time?: string;
  order_status: string;
  order_type: string;
  priority: string;
  priority_level: number;
  clinical_history?: string;
  provisional_diagnosis?: string;
  collection_date?: string;
  collection_time?: string;
  collection_location?: string;
  collected_by?: string;
  sample_collection_datetime?: string;
  sample_received_datetime?: string;
  results_ready_datetime?: string;
  report_dispatch_datetime?: string;
  total_amount: number;
  final_amount: number;
  discount_amount: number;
  payment_status: string;
  payment_method?: string;
  special_instructions?: string;
  internal_notes?: string;
  icd_codes?: string[];
  referring_facility?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Additional computed properties for UI
  status: string;
  completed_tests: number;
  test_count: number;
  paid_amount: number;
}

export interface LabTest {
  id: string;
  test_code: string;
  test_name: string;
  short_name?: string;
  test_type?: string;
  category_id?: string;
  department_id?: string;
  test_price: number;
  insurance_coverage: number;
  sample_type?: string;
  sample_volume?: string;
  container_type?: string;
  method?: string;
  analyzer?: string;
  processing_time_hours: number;
  preparation_instructions?: string;
  reference_ranges?: any;
  critical_values?: any;
  is_outsourced: boolean;
  outsourced_lab?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Additional properties for compatibility
  outsourced: boolean;
  decimal_places: number;
}

export interface TestPanel {
  id: string;
  name: string;
  category?: string;
  description?: string;
  test_method?: string;
  // Add all lab table fields
  icd_10_code?: string;
  CGHS_code?: string;
  rsby_code?: string;
  loinc_code?: string;
  cpt_code?: string;
  machine_name?: string;
  title_machine_name?: string;
  sample_type?: string;
  sub_specialty?: string;
  short_form?: string;
  preparation_time?: string;
  specific_instruction_for_preparation?: string;
  attach_file?: boolean;
  service_group?: string;
  map_test_to_service?: string;
  parameter_panel_test?: string;
  test_result_help?: string;
  default_result?: string;
  note_opinion_template?: string;
  speciality?: string;
  attributes?: any; // JSON field for storing test attributes/categories
  created_at: string;
  updated_at: string;
}

export interface TestCategory {
  id: string;
  category_code: string;
  category_name: string;
  category_description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LabDepartment {
  id: string;
  department_code: string;
  department_name: string;
  description?: string;
  location?: string;
  head_of_department?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LabSample {
  id: string;
  order_id?: string;
  sample_barcode: string;
  sample_type: string;
  collection_datetime?: string;
  collected_by?: string;
  collection_location?: string;
  collection_method?: string;
  volume_collected?: string;
  container_type?: string;
  number_of_containers: number;
  received_datetime?: string;
  received_by?: string;
  temperature_at_receipt?: number;
  processing_status: string;
  sample_quality: string;
  quality_notes?: string;
  rejection_reason?: string;
  storage_location?: string;
  storage_conditions?: string;
  storage_temperature?: number;
  is_aliquot: boolean;
  parent_sample_id?: string;
  aliquot_number?: number;
  created_at: string;
  updated_at: string;
}

export interface TestResult {
  id: string;
  order_id?: string;
  sample_id?: string;
  test_id?: string;
  result_value?: string;
  result_unit?: string;
  reference_range?: string;
  result_status: string;
  is_critical: boolean;
  result_datetime?: string;
  result_notes?: string;
  performed_by?: string;
  verified_by?: string;
  verified_datetime?: string;
  equipment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LabEquipment {
  id: string;
  equipment_code: string;
  equipment_name: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  department_id?: string;
  location?: string;
  room_number?: string;
  equipment_status: string;
  is_interfaced: boolean;
  interface_type?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_frequency_days: number;
  last_calibration_date?: string;
  next_calibration_date?: string;
  calibration_frequency_days: number;
  warranty_expiry_date?: string;
  service_provider?: string;
  service_contact?: string;
  equipment_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface QualityControl {
  id: string;
  equipment_id?: string;
  test_id?: string;
  qc_lot_number?: string;
  qc_level?: string;
  expected_value?: string;
  actual_value?: string;
  qc_status: string;
  performed_datetime: string;
  performed_by?: string;
  qc_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LabReport {
  id: string;
  order_id?: string;
  report_number: string;
  report_type: string;
  report_status: string;
  report_content?: string;
  interpretation?: string;
  recommendations?: string;
  prepared_by?: string;
  prepared_datetime?: string;
  reviewed_by?: string;
  reviewed_datetime?: string;
  approved_by?: string;
  approved_datetime?: string;
  pathologist?: string;
  delivery_method?: string;
  delivery_status: string;
  dispatch_datetime?: string;
  delivered_to?: string;
  report_template?: string;
  created_at: string;
  updated_at: string;
}

// Inventory interface to fix the missing last_sterilized property
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  unit_cost: number;
  supplier: string;
  expiry_date?: string;
  batch_number?: string;
  last_restocked?: string;
  last_sterilized?: string;
  sterilization_required: boolean;
  usage_per_day?: number;
  created_at: string;
  updated_at: string;
}
