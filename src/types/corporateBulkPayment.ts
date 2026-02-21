export interface CorporateBulkPayment {
  id: string;
  receipt_number: string;
  corporate_id: string | null;
  corporate_name: string;
  payment_date: string;
  payment_mode: string;
  reference_number: string | null;
  bank_name: string | null;
  total_amount: number;
  claim_amount: number | null;
  narration: string | null;
  hospital_name: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  allocations?: CorporateBulkPaymentAllocation[];
}

export interface CorporateBulkPaymentAllocation {
  id: string;
  bulk_payment_id: string;
  patient_id: string | null;
  patient_name: string;
  patients_id: string | null;
  visit_id: string | null;
  amount: number;
  bill_amount: number | null;
  deduction_amount: number | null;
  tds_amount: number | null;
  remarks: string | null;
  created_at: string;
}

export interface AllocationRow {
  temp_id: string;
  patient_id: string;
  patient_name: string;
  patients_id: string;
  visit_id: string;
  amount: string;
  bill_amount: string;
  deduction_amount: string;
  tds_amount: string;
  remarks: string;
}

export const CORPORATE_PAYMENT_MODES = [
  { value: 'ONLINE', label: 'Online Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'DD', label: 'Demand Draft' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
];
