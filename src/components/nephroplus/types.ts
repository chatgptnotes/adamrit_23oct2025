import type { EncounterType, PayerType } from '@/lib/nephroplus/revenue-share';

export interface DialysisSession {
  id: string;
  session_date: string;
  patient_id: string | null;
  visit_id: string | null;
  patient_name: string;
  encounter_type: EncounterType;
  payer_type: PayerType;
  service_category: string;
  charged_price: number;
  margin_amount: number | null;
  rate_pct_applied: number | null;
  hope_share: number;
  nephroplus_share: number;
  notes: string | null;
  created_by: string | null;
  hospital_name: string;
  created_at: string;
  updated_at: string;
}

export interface PatientSearchResult {
  patientId: string;         // patients.id (uuid)
  name: string;
  patientsId: string | null; // patients.patients_id (human id)
  corporate: string | null;  // patient-level payer hint
}

// Seed values for a NEW session created by importing a detected dialysis visit.
export interface SessionPrefill {
  patientId: string | null;
  visitId: string | null;
  patientName: string;
  encounterType: EncounterType;
  payerType: PayerType;
  sessionDate: string;
}

export const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});
