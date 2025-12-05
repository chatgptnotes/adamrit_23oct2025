
export interface AddPatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded?: (patient: Patient) => void;
}

export interface Patient {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  blood_group?: string;
  allergies?: string;
  medical_history?: string;
  current_medications?: string;
  insurance_provider?: string;
  policy_number?: string;
  group_code?: string;
  relationship_with_employee?: string;
  employee_name?: string;
  employee_id?: string;
  employee_department?: string;
  employee_designation?: string;
  employee_phone?: string;
  employee_email?: string;
  employee_address?: string;
  employee_blood_group?: string;
  employee_allergies?: string;
  employee_medical_history?: string;
  employee_current_medications?: string;
  employee_insurance_provider?: string;
  employee_policy_number?: string;
  employee_group_code?: string;
  employee_relationship_with_patient?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FormData {
  name: string;
  age: string;
  gender: string;
  phone: string;
  address: string;
  emergency_contact: string;
  emergency_phone: string;
  blood_group: string;
  allergies: string;
  medical_history: string;
  current_medications: string;
  insurance_provider: string;
  policy_number: string;
  group_code: string;
  relationship_with_employee: string;
  employee_name: string;
  employee_id: string;
  employee_department: string;
  employee_designation: string;
  employee_phone: string;
  employee_email: string;
  employee_address: string;
  employee_blood_group: string;
  employee_allergies: string;
  employee_medical_history: string;
  employee_current_medications: string;
  employee_insurance_provider: string;
  employee_policy_number: string;
  employee_group_code: string;
  employee_relationship_with_patient: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface SearchableFieldConfig {
  tableName: string;
  fieldName: string;
  placeholder: string;
  displayField: string;
  searchFields: string[];
  additionalFilter?: Record<string, unknown>;
}

export interface SelectedIds {
  labId: string;
  radiologyId: string;
  surgeryId: string;
  antibioticId: string;
  esicSurgeonId: string;
  consultantId: string;
  hopeSurgeonId: string;
  hopeConsultantId: string;
  diagnosisId: string;
}
