// Bill Aging Statement Types
// Types for corporate bill submission to payment tracking

import { AgingBucket } from './accounting';

// Status of a bill in the aging report
export type BillAgingStatus = 'Pending' | 'Received' | 'Partial' | 'Overdue';

// Single bill record in the aging report
export interface BillAgingRecord {
  id: string;
  visit_id: string;
  patient_name: string;
  patient_id: string;
  corporate: string;
  hospital_name: string;
  admission_date: string | null;
  discharge_date: string | null;

  // Financial fields
  bill_amount: number;
  received_amount: number;
  deduction_amount: number;
  outstanding_amount: number;

  // Date fields
  date_of_submission: string | null;
  expected_payment_date: string | null;
  received_date: string | null;

  // Calculated fields
  days_outstanding: number;
  aging_bucket: AgingBucket;
  status: BillAgingStatus;
}

// Filter options for the aging report
export interface BillAgingFilters {
  hospital: string;
  corporate: string;
  status: string;
  agingBucket: string;
  dateFrom: string;
  dateTo: string;
  searchTerm: string;
}

// Sort configuration
export interface BillAgingSortConfig {
  column: keyof BillAgingRecord | '';
  direction: 'asc' | 'desc';
}

// Summary by aging bucket
export interface AgingBucketSummary {
  bucket: AgingBucket;
  count: number;
  total_bill_amount: number;
  total_received_amount: number;
  total_outstanding_amount: number;
}

// Corporate summary
export interface CorporateSummary {
  corporate: string;
  total_bills: number;
  total_bill_amount: number;
  total_received: number;
  total_outstanding: number;
  average_days_to_payment: number;
}

// Overall report summary
export interface BillAgingReportSummary {
  total_bills: number;
  total_pending: number;
  total_received: number;
  total_overdue: number;
  total_partial: number;
  total_bill_amount: number;
  total_received_amount: number;
  total_outstanding_amount: number;
  average_days_to_payment: number;
  buckets: AgingBucketSummary[];
  by_corporate: CorporateSummary[];
}

// Default filter values
export const defaultBillAgingFilters: BillAgingFilters = {
  hospital: 'all',
  corporate: 'all',
  status: 'all',
  agingBucket: 'all',
  dateFrom: '',
  dateTo: '',
  searchTerm: '',
};
