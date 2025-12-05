// Accounting System Types (Tally-like)
// Comprehensive types for double-entry bookkeeping system

export interface ChartOfAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  parent_account_id?: string;
  account_group?: string;
  is_active: boolean;
  opening_balance: number;
  opening_balance_type: BalanceType;
  created_at: string;
  updated_at: string;
  children?: ChartOfAccount[];
}

export type AccountType = 
  | 'ASSETS' 
  | 'LIABILITIES' 
  | 'EQUITY' 
  | 'INCOME' 
  | 'EXPENSES'
  | 'CURRENT_ASSETS' 
  | 'FIXED_ASSETS' 
  | 'CURRENT_LIABILITIES'
  | 'LONG_TERM_LIABILITIES' 
  | 'DIRECT_INCOME' 
  | 'INDIRECT_INCOME'
  | 'DIRECT_EXPENSES' 
  | 'INDIRECT_EXPENSES';

export type BalanceType = 'DR' | 'CR';

export interface PatientLedger {
  id: string;
  patient_id: string;
  account_id: string;
  ledger_name: string;
  opening_balance: number;
  opening_balance_type: BalanceType;
  current_balance: number;
  current_balance_type: BalanceType;
  credit_limit: number;
  credit_days: number;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  patient?: {
    name: string;
    patients_id: string;
  };
}

export interface VoucherType {
  id: string;
  voucher_type_code: string;
  voucher_type_name: string;
  voucher_category: VoucherCategory;
  numbering_method: 'AUTO' | 'MANUAL';
  prefix?: string;
  suffix?: string;
  starting_number: number;
  current_number: number;
  is_active: boolean;
  created_at: string;
}

export type VoucherCategory = 
  | 'PAYMENT' 
  | 'RECEIPT' 
  | 'CONTRA' 
  | 'JOURNAL' 
  | 'SALES' 
  | 'PURCHASE'
  | 'CREDIT_NOTE' 
  | 'DEBIT_NOTE' 
  | 'DELIVERY_NOTE' 
  | 'RECEIPT_NOTE';

export interface Voucher {
  id: string;
  voucher_number: string;
  voucher_type_id: string;
  voucher_date: string;
  reference_number?: string;
  reference_date?: string;
  narration?: string;
  total_amount: number;
  patient_id?: string;
  bill_id?: string;
  created_by?: string;
  authorised_by?: string;
  status: VoucherStatus;
  created_at: string;
  updated_at: string;
  voucher_type?: VoucherType;
  voucher_entries?: VoucherEntry[];
  patient?: {
    name: string;
    patients_id: string;
  };
}

export type VoucherStatus = 'PENDING' | 'AUTHORISED' | 'CANCELLED';

export interface VoucherEntry {
  id: string;
  voucher_id: string;
  account_id: string;
  patient_ledger_id?: string;
  debit_amount: number;
  credit_amount: number;
  narration?: string;
  entry_order: number;
  created_at: string;
  account?: ChartOfAccount;
  patient_ledger?: PatientLedger;
}

export interface OutstandingInvoice {
  id: string;
  patient_id: string;
  bill_id?: string;
  voucher_id?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  original_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  days_outstanding: number;
  aging_bucket: AgingBucket;
  status: OutstandingStatus;
  created_at: string;
  updated_at: string;
  patient?: {
    name: string;
    patients_id: string;
  };
}

export type AgingBucket = '0-30' | '31-60' | '61-90' | '91-180' | '181-365' | '365+';
export type OutstandingStatus = 'OPEN' | 'PARTIAL' | 'CLOSED' | 'OVERDUE';

export interface PaymentTransaction {
  id: string;
  patient_id: string;
  voucher_id?: string;
  payment_date: string;
  payment_mode: PaymentMode;
  payment_amount: number;
  reference_number?: string;
  bank_name?: string;
  cheque_number?: string;
  cheque_date?: string;
  remarks?: string;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
  patient?: {
    name: string;
    patients_id: string;
  };
  payment_allocations?: PaymentAllocation[];
}

export type PaymentMode = 
  | 'CASH' 
  | 'CHEQUE' 
  | 'DD' 
  | 'NEFT' 
  | 'RTGS' 
  | 'UPI' 
  | 'CARD' 
  | 'ONLINE';

export type PaymentStatus = 'PENDING' | 'CLEARED' | 'BOUNCED' | 'CANCELLED';

export interface PaymentAllocation {
  id: string;
  payment_transaction_id: string;
  outstanding_invoice_id: string;
  allocated_amount: number;
  allocation_date: string;
  created_at: string;
  outstanding_invoice?: OutstandingInvoice;
}

export interface AgingSnapshot {
  id: string;
  snapshot_date: string;
  patient_id: string;
  total_outstanding: number;
  bucket_0_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_91_180: number;
  bucket_181_365: number;
  bucket_365_plus: number;
  created_at: string;
  patient?: {
    name: string;
    patients_id: string;
  };
}

export interface DailyBalance {
  id: string;
  balance_date: string;
  account_id: string;
  opening_balance: number;
  total_debits: number;
  total_credits: number;
  closing_balance: number;
  balance_type: BalanceType;
  created_at: string;
  account?: ChartOfAccount;
}

// Form Interfaces
export interface VoucherEntryForm {
  account_id: string;
  patient_ledger_id?: string;
  debit_amount: number;
  credit_amount: number;
  narration?: string;
}

export interface VoucherForm {
  voucher_type_id: string;
  voucher_date: string;
  reference_number?: string;
  reference_date?: string;
  narration?: string;
  patient_id?: string;
  bill_id?: string;
  entries: VoucherEntryForm[];
}

export interface PaymentForm {
  patient_id: string;
  payment_date: string;
  payment_mode: PaymentMode;
  payment_amount: number;
  reference_number?: string;
  bank_name?: string;
  cheque_number?: string;
  cheque_date?: string;
  remarks?: string;
  allocations: PaymentAllocationForm[];
}

export interface PaymentAllocationForm {
  outstanding_invoice_id: string;
  allocated_amount: number;
}

// Report Interfaces
export interface TrialBalance {
  account_code: string;
  account_name: string;
  account_type: AccountType;
  debit_balance: number;
  credit_balance: number;
}

export interface PatientStatement {
  patient_id: string;
  patient_name: string;
  patient_code: string;
  opening_balance: number;
  opening_balance_type: BalanceType;
  transactions: PatientStatementTransaction[];
  closing_balance: number;
  closing_balance_type: BalanceType;
}

export interface PatientStatementTransaction {
  date: string;
  voucher_number: string;
  voucher_type: string;
  reference: string;
  debit_amount: number;
  credit_amount: number;
  balance: number;
  balance_type: BalanceType;
  narration: string;
}

export interface AgingReport {
  as_on_date: string;
  patients: AgingReportPatient[];
  summary: AgingReportSummary;
}

export interface AgingReportPatient {
  patient_id: string;
  patient_name: string;
  patient_code: string;
  total_outstanding: number;
  bucket_0_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_91_180: number;
  bucket_181_365: number;
  bucket_365_plus: number;
  credit_limit: number;
  days_outstanding: number;
}

export interface AgingReportSummary {
  total_outstanding: number;
  total_0_30: number;
  total_31_60: number;
  total_61_90: number;
  total_91_180: number;
  total_181_365: number;
  total_365_plus: number;
  total_patients: number;
  overdue_patients: number;
}

export interface OutstandingReport {
  as_on_date: string;
  total_outstanding: number;
  total_invoices: number;
  invoices: OutstandingInvoice[];
  summary_by_aging: {
    [key in AgingBucket]: {
      count: number;
      amount: number;
    };
  };
}

// Dashboard Interfaces
export interface AccountingDashboard {
  total_receivables: number;
  total_payables: number;
  total_cash: number;
  total_bank: number;
  overdue_amount: number;
  overdue_count: number;
  recent_payments: PaymentTransaction[];
  recent_invoices: OutstandingInvoice[];
  aging_summary: AgingReportSummary;
  monthly_collections: MonthlyCollection[];
}

export interface MonthlyCollection {
  month: string;
  year: number;
  total_collections: number;
  total_invoices: number;
  average_collection_days: number;
}

// Filter and Search Interfaces
export interface AccountingFilters {
  from_date?: string;
  to_date?: string;
  patient_id?: string;
  account_id?: string;
  voucher_type?: VoucherCategory;
  status?: string;
  payment_mode?: PaymentMode;
  aging_bucket?: AgingBucket;
}

export interface LedgerFilters {
  from_date: string;
  to_date: string;
  account_id?: string;
  patient_id?: string;
  voucher_type?: VoucherCategory;
  show_zero_balance?: boolean;
}