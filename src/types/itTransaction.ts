export interface ITTransaction {
  id: string;
  transaction_date: string;
  patient_id: string | null;
  admission_id: string | null;
  voucher_no: string;
  invoice_amount: number;
  discount_amount: number;
  net_bill_amount: number;
  cash_amount: number;
  other_mode_amount: number;
  transaction_type: string;
  department: string;
  treatment_code: string | null;
  hospital_name: string;
  remarks: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const IT_TRANSACTION_TYPES = [
  { value: 'Receipt', label: 'Receipt' },
  { value: 'Advance', label: 'Advance' },
  { value: 'Deposit', label: 'Deposit' },
  { value: 'Part Payment', label: 'Part Payment' },
];

export const IT_DEPARTMENTS = [
  { value: 'IPD', label: 'IPD' },
  { value: 'OPD', label: 'OPD' },
  { value: 'Pharmacy', label: 'Pharmacy' },
  { value: 'Lab', label: 'Lab' },
  { value: 'Radiology', label: 'Radiology' },
  { value: 'Other', label: 'Other' },
];
