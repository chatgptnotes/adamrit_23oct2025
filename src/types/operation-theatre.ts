
export interface OperationTheatrePatient {
  id: string;
  patient_id: string;
  patient_name: string;
  surgery: string;
  surgeon: string;
  anesthesiologist?: string;
  scheduled_time: string;
  estimated_duration: number; // in minutes
  priority: 'Emergency' | 'Urgent' | 'Routine';
  status: PatientWorkflowStatus;
  theatre_number: number;
  pre_op_checklist: PreOpChecklist;
  intra_op_notes?: IntraOpNotes;
  post_op_notes?: PostOpNotes;
  resources_allocated: ResourceAllocation[];
  created_at: string;
  updated_at: string;
}

export type PatientWorkflowStatus = 
  | 'scheduled'
  | 'pre_op_preparation'
  | 'ready_for_surgery'
  | 'in_theatre'
  | 'surgery_in_progress'
  | 'surgery_completed'
  | 'post_op_recovery'
  | 'discharged_from_ot'
  | 'cancelled';

export interface PreOpChecklist {
  consent_obtained: boolean;
  fasting_confirmed: boolean;
  allergies_checked: boolean;
  medications_reviewed: boolean;
  vital_signs_recorded: boolean;
  lab_results_available: boolean;
  imaging_available: boolean;
  surgical_site_marked: boolean;
  patient_identity_verified: boolean;
  anesthesia_clearance: boolean;
  completed_by: string;
  completed_at?: string;
}

export interface IntraOpNotes {
  start_time: string;
  end_time?: string;
  procedure_performed: string;
  surgeon: string;
  assistants: string[];
  anesthesia_type: string;
  anesthesiologist: string;
  complications?: string;
  blood_loss?: number;
  fluids_given?: string;
  specimens_collected?: string[];
  implants_used?: string[];
  notes: string;
}

export interface PostOpNotes {
  recovery_start_time: string;
  vital_signs_stable: boolean;
  pain_score: number;
  nausea_vomiting: boolean;
  bleeding_check: boolean;
  drain_output?: string;
  instructions: string;
  medications_prescribed: string[];
  follow_up_required: boolean;
  discharge_time?: string;
  discharge_condition: string;
}

export interface OperationTheatre {
  id: number;
  name: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  equipment: Equipment[];
  capacity: number;
  specialty_type?: string;
  last_cleaned?: string;
  next_maintenance?: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: 'surgical' | 'anesthesia' | 'monitoring' | 'disposable';
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_stock';
  quantity_available: number;
  quantity_required?: number;
  expiry_date?: string;
  last_sterilized?: string;
  manufacturer?: string;
  model?: string;
}

export interface ResourceAllocation {
  resource_id: string;
  resource_name: string;
  resource_type: 'equipment' | 'staff' | 'consumable';
  quantity_allocated: number;
  allocated_at: string;
  allocated_by: string;
  status: 'allocated' | 'in_use' | 'returned' | 'consumed';
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'surgeon' | 'anesthesiologist' | 'nurse' | 'technician';
  specialization?: string;
  availability_status: 'available' | 'busy' | 'on_break' | 'off_duty';
  current_assignment?: string;
  shift_start: string;
  shift_end: string;
}

export interface WorkflowTransition {
  from_status: PatientWorkflowStatus;
  to_status: PatientWorkflowStatus;
  timestamp: string;
  performed_by: string;
  notes?: string;
  duration_in_status?: number; // minutes spent in previous status
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'surgical_instruments' | 'consumables' | 'implants' | 'medications' | 'anesthesia_supplies';
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  unit_cost: number;
  supplier: string;
  expiry_date?: string;
  batch_number?: string;
  sterilization_required: boolean;
  last_restocked?: string;
  usage_per_day?: number;
  created_at: string;
  updated_at: string;
}
