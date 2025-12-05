
export interface Patient {
  id: string;
  name: string;
  patients_id?: string;
  primary_diagnosis?: string;
  admission_date?: string;
  created_at: string;
  surgeon?: string;
  consultant?: string;
}

export interface PatientLookupProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientSelected?: (patient: Patient) => void;
  onNewPatientRegistration?: () => void;
}

export interface SearchCriteria {
  mobile: string;
  name: string;
  patientId: string;
}
