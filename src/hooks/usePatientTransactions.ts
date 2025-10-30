/**
 * Hook to fetch all transaction details for a specific patient
 * This file provides separate hooks for service transactions and payment transactions
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
 * Hook to fetch SERVICE transactions for a patient (OPD, Lab, Pharmacy, etc.)
 * EXCLUDES advance payments and other payment transactions
 */
export const usePatientServiceTransactions = (
  patientId?: string,
  visitId?: string,
  filterDate?: string
) => {
  return useQuery({
    queryKey: ['patient-service-transactions', patientId, visitId, filterDate],
    queryFn: async () => {
      if (!patientId && !visitId) {
        return [];
      }

      // Fetch billing transactions (services only, exclude payments)
      let query = supabase
        .from('v_cash_book_all_daily_transactions')
        .select('*')
        .neq('transaction_type', 'ADVANCE_PAYMENT') // Exclude advance payments
        .order('transaction_date', { ascending: false })
        .order('transaction_time', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      } else if (visitId) {
        query = query.eq('visit_id', visitId);
      }

      // Apply date filter if provided
      if (filterDate) {
        query = query.eq('transaction_date', filterDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching patient service transactions:', error);
        throw new Error(`Failed to fetch service transactions: ${error.message}`);
      }

      return (data || []) as PatientTransactionDetail[];
    },
    enabled: !!(patientId || visitId),
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to fetch PAYMENT transactions for a patient (Advance payments, etc.)
 * ONLY includes payment-related transactions
 */
export const usePatientPaymentTransactions = (
  patientId?: string,
  filterDate?: string
) => {
  return useQuery({
    queryKey: ['patient-payment-transactions', patientId, filterDate],
    queryFn: async () => {
      if (!patientId) {
        return [];
      }

      // Fetch advance payments from advance_payment table
      let advanceQuery = supabase
        .from('advance_payment')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'ACTIVE')
        .order('payment_date', { ascending: false });

      // Apply date filter if provided
      if (filterDate) {
        advanceQuery = advanceQuery.eq('payment_date', filterDate);
      }

      const { data: advanceData, error: advanceError } = await advanceQuery;

      if (advanceError) {
        console.error('Error fetching advance payments:', advanceError);
        throw new Error(`Failed to fetch advance payments: ${advanceError.message}`);
      }

      // Transform advance payments to match transaction format
      const formattedPayments: PatientTransactionDetail[] = (advanceData || []).map((adv: any) => ({
        transaction_id: adv.id,
        transaction_type: 'ADVANCE_PAYMENT',
        transaction_date: adv.payment_date,
        description: adv.remarks || 'Advance Payment',
        amount: adv.advance_amount,
        quantity: 1,
        unit_rate: adv.advance_amount,
        payment_mode: adv.payment_mode,
        rate_type: 'ADVANCE',
      }));

      // Sort by date (most recent first)
      formattedPayments.sort((a, b) => {
        return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
      });

      return formattedPayments;
    },
    enabled: !!patientId,
    staleTime: 30000,
  });
};

/**
 * Hook to fetch ALL transactions (services + payments combined)
 * Use this only if you need both together
 */
export const usePatientTransactionDetails = (
  patientId?: string,
  visitId?: string,
  filterDate?: string
) => {
  const { data: services } = usePatientServiceTransactions(patientId, visitId, filterDate);
  const { data: payments } = usePatientPaymentTransactions(patientId, filterDate);

  // Combine and sort
  const allTransactions = [
    ...(services || []),
    ...(payments || [])
  ].sort((a, b) => {
    return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
  });

  return {
    data: allTransactions,
    isLoading: false,
  };
};

/**
 * Hook to fetch patient advance payments (raw data)
 * Keep this for compatibility with existing code
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
 * FIXED: Properly separates service charges from payments
 */
export const usePatientTransactionSummary = (
  patientId?: string,
  visitId?: string,
  filterDate?: string
) => {
  const { data: services } = usePatientServiceTransactions(patientId, visitId, filterDate);
  const { data: payments } = usePatientPaymentTransactions(patientId, filterDate);

  // Calculate totals correctly
  const totalCharges = services?.reduce((sum, txn) => sum + (txn.amount || 0), 0) || 0;
  const totalPaid = payments?.reduce((sum, txn) => sum + (txn.amount || 0), 0) || 0;
  const balance = totalCharges - totalPaid; // Positive = patient owes, Negative = patient has credit

  return {
    totalCharges,      // Total amount of services consumed
    totalPaid,         // Total amount already paid (advances, etc.)
    totalAdvance: totalPaid, // Alias for backward compatibility
    balance,           // Amount due (positive) or credit (negative)
    transactionCount: (services?.length || 0) + (payments?.length || 0),
    serviceCount: services?.length || 0,
    paymentCount: payments?.length || 0,
    advancePaymentCount: payments?.length || 0, // Alias for backward compatibility
  };
};
