import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LedgerStatementEntry {
  voucher_date: string;
  voucher_number: string;
  voucher_type: string;
  narration: string;
  patient_name: string;
  mrn_number: string;
  patient_id: string;
  visit_id: string;
  visit_type: string;
  patient_type: string;
  payment_type: 'ADVANCE_PAYMENT' | 'ADVANCE_REFUND' | 'FINAL_PAYMENT' | 'OTHER';
  debit_amount: number;
  credit_amount: number;
  payment_mode: string;
  remarks: string;
  is_refund: boolean;
  bank_account: string;
  account_code: string;
}

interface UseLedgerStatementParams {
  accountName: string;
  fromDate: string;
  toDate: string;
  mrnFilter?: string;
  paymentModeFilter?: string;
}

export const useLedgerStatementData = ({
  accountName,
  fromDate,
  toDate,
  mrnFilter,
  paymentModeFilter,
}: UseLedgerStatementParams) => {
  return useQuery({
    queryKey: ['ledger-statement', accountName, fromDate, toDate, mrnFilter, paymentModeFilter],
    queryFn: async () => {
      console.log('Fetching ledger statement:', {
        accountName,
        fromDate,
        toDate,
        mrnFilter,
        paymentModeFilter,
      });

      const { data, error } = await supabase.rpc('get_ledger_statement_with_patients', {
        p_account_name: accountName,
        p_from_date: fromDate,
        p_to_date: toDate,
        p_mrn_filter: mrnFilter || null,
        p_payment_mode: paymentModeFilter || null,
      });

      if (error) {
        console.error('Error fetching ledger statement:', error);
        throw error;
      }

      console.log('Ledger statement data fetched:', data);
      return data as LedgerStatementEntry[];
    },
    enabled: !!accountName && !!fromDate && !!toDate,
  });
};

// Hook to calculate ledger balances
export const useLedgerBalances = (entries: LedgerStatementEntry[] | undefined) => {
  if (!entries || entries.length === 0) {
    return {
      openingBalance: 0,
      currentDebit: 0,
      currentCredit: 0,
      closingBalance: 0,
    };
  }

  // Calculate totals
  const currentDebit = entries.reduce((sum, entry) => sum + (entry.debit_amount || 0), 0);
  const currentCredit = entries.reduce((sum, entry) => sum + (entry.credit_amount || 0), 0);

  // For simplicity, we'll calculate opening balance as 0
  // In a real scenario, you'd query the previous balance
  const openingBalance = 0;
  const closingBalance = openingBalance + currentDebit - currentCredit;

  return {
    openingBalance,
    currentDebit,
    currentCredit,
    closingBalance,
  };
};
