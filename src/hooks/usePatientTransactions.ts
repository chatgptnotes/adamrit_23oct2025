/**
 * Hook to fetch all transaction details for a specific patient
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PatientTransactionDetail {
  transaction_id: string;
  transaction_type: string;
  transaction_date: string;
  description: string;
  amount: number;
  quantity: number;
  unit_rate: number;
  payment_mode: string;
  rate_type: string;
}

/**
 * Hook to fetch all transactions for a patient
 */
export const usePatientTransactionDetails = (
  patientId?: string,
  visitId?: string,
  filterDate?: string
) => {
  return useQuery({
    queryKey: ['patient-transactions', patientId, visitId, filterDate],
    queryFn: async () => {
      if (!patientId && !visitId) {
        return [];
      }

      // Build query based on what's provided
      let query = supabase
        .from('v_cash_book_all_daily_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('transaction_time', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      } else if (visitId) {
        query = query.eq('visit_id', visitId);
      }

      // Apply date filter if provided (for today's transactions only)
      if (filterDate) {
        query = query.eq('transaction_date', filterDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching patient transactions:', error);
        throw new Error(`Failed to fetch transactions: ${error.message}`);
      }

      return (data || []) as PatientTransactionDetail[];
    },
    enabled: !!(patientId || visitId), // Only run if we have patient_id or visit_id
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to fetch patient advance payments
 */
export const usePatientAdvancePayments = (patientId?: string) => {
  return useQuery({
    queryKey: ['patient-advance-payments', patientId],
    queryFn: async () => {
      if (!patientId) {
        return [];
      }

      const { data, error } = await supabase
        .from('advance_payment')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'ACTIVE')
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching advance payments:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!patientId,
    staleTime: 30000,
  });
};

/**
 * Hook to calculate patient transaction summary
 */
export const usePatientTransactionSummary = (
  patientId?: string,
  visitId?: string,
  filterDate?: string
) => {
  const { data: transactions } = usePatientTransactionDetails(patientId, visitId, filterDate);
  const { data: advancePayments } = usePatientAdvancePayments(patientId);

  // Calculate totals
  const totalCharges = transactions?.reduce((sum, txn) => sum + (txn.amount || 0), 0) || 0;
  const totalAdvance = advancePayments?.reduce((sum, adv: any) => sum + (adv.advance_amount || 0), 0) || 0;
  const balance = totalAdvance - totalCharges;

  return {
    totalCharges,
    totalAdvance,
    balance,
    transactionCount: transactions?.length || 0,
    advancePaymentCount: advancePayments?.length || 0,
  };
};
