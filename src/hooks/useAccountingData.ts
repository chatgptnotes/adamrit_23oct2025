
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  ChartOfAccount, 
  PatientLedger, 
  Voucher, 
  VoucherForm, 
  OutstandingInvoice,
  PaymentTransaction,
  PaymentAllocation,
  AgingSnapshot,
  AccountingFilters,
  AccountType,
  BalanceType,
  VoucherStatus,
  AgingBucket,
  PaymentMode
} from '@/types/accounting';

export const useChartOfAccounts = () => {
  return useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('is_active', true)
        .order('account_code');

      if (error) {
        console.error('Error fetching chart of accounts:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        account_type: item.account_type as AccountType,
        opening_balance_type: item.opening_balance_type as BalanceType
      })) as ChartOfAccount[];
    }
  });
};

export const usePatientLedgers = () => {
  return useQuery({
    queryKey: ['patient-ledgers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_ledgers')
        .select(`
          *,
          patient:patients(
            id,
            name,
            patients_id,
            phone,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching patient ledgers:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        opening_balance_type: item.opening_balance_type as BalanceType,
        current_balance_type: item.current_balance_type as BalanceType
      })) as unknown as PatientLedger[];
    }
  });
};

export const useVouchers = (filters?: AccountingFilters) => {
  return useQuery({
    queryKey: ['vouchers', filters],
    queryFn: async () => {
      let query = supabase
        .from('vouchers')
        .select(`
          *,
          voucher_entries(
            id,
            account_id,
            patient_ledger_id,
            debit_amount,
            credit_amount,
            narration,
            account:chart_of_accounts(
              id,
              account_name,
              account_code
            ),
            patient_ledger:patient_ledgers(
              id,
              patient:patients(
                id,
                name,
                patients_id
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.from_date) {
        query = query.gte('voucher_date', filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte('voucher_date', filters.to_date);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.patient_id) {
        query = query.eq('patient_id', filters.patient_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching vouchers:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        status: item.status as VoucherStatus,
        voucher_type: {
          id: '1',
          voucher_type_code: 'JV',
          voucher_type_name: 'Journal Voucher',
          voucher_category: 'JOURNAL' as any,
          numbering_method: 'AUTO' as any,
          prefix: 'JV',
          suffix: '',
          starting_number: 1,
          current_number: 1,
          is_active: true,
          created_at: new Date().toISOString()
        },
        patient: item.patient_id ? {
          id: item.patient_id,
          name: 'Patient Name',
          patients_id: 'P001'
        } : undefined
      })) as unknown as Voucher[];
    }
  });
};

export const useOutstandingInvoices = (filters?: AccountingFilters) => {
  return useQuery({
    queryKey: ['outstanding-invoices', filters],
    queryFn: async () => {
      let query = supabase
        .from('outstanding_invoices')
        .select(`
          *,
          patient:patients(
            id,
            name,
            patients_id,
            phone,
            email
          )
        `)
        .gt('outstanding_amount', 0)
        .order('due_date', { ascending: true });

      if (filters?.from_date) {
        query = query.gte('invoice_date', filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte('invoice_date', filters.to_date);
      }
      if (filters?.patient_id) {
        query = query.eq('patient_id', filters.patient_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching outstanding invoices:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        aging_bucket: (item.aging_bucket || '0-30') as AgingBucket
      })) as unknown as OutstandingInvoice[];
    }
  });
};

export const usePaymentTransactions = (filters?: AccountingFilters) => {
  return useQuery({
    queryKey: ['payment-transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('payment_transactions')
        .select(`
          *,
          patient:patients(
            id,
            name,
            patients_id,
            phone,
            email
          )
        `)
        .order('payment_date', { ascending: false });

      if (filters?.from_date) {
        query = query.gte('payment_date', filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte('payment_date', filters.to_date);
      }
      if (filters?.patient_id) {
        query = query.eq('patient_id', filters.patient_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching payment transactions:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        payment_mode: item.payment_mode as PaymentMode,
        payment_allocations: []
      })) as unknown as PaymentTransaction[];
    }
  });
};

export const useCreateVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (voucherData: VoucherForm) => {
      const voucherNumber = `V${Date.now()}`;
      
      const { data: voucher, error: voucherError } = await supabase
        .from('vouchers')
        .insert({
          voucher_number: voucherNumber,
          voucher_type_id: voucherData.voucher_type_id,
          voucher_date: voucherData.voucher_date,
          reference_number: voucherData.reference_number || '',
          reference_date: voucherData.reference_date || '',
          narration: voucherData.narration || '',
          patient_id: voucherData.patient_id || null,
          bill_id: voucherData.bill_id || null,
          total_amount: voucherData.entries.reduce((sum, entry) => 
            sum + Math.max(entry.debit_amount || 0, entry.credit_amount || 0), 0
          ),
          status: 'PENDING',
          created_by: 'system'
        })
        .select()
        .single();

      if (voucherError) {
        console.error('Error creating voucher:', voucherError);
        throw voucherError;
      }

      const entries = voucherData.entries.map(entry => ({
        voucher_id: voucher.id,
        account_id: entry.account_id,
        patient_ledger_id: entry.patient_ledger_id || null,
        debit_amount: entry.debit_amount || 0,
        credit_amount: entry.credit_amount || 0,
        narration: entry.narration || '',
        entry_order: 1
      }));

      const { error: entriesError } = await supabase
        .from('voucher_entries')
        .insert(entries);

      if (entriesError) {
        console.error('Error creating voucher entries:', entriesError);
        throw entriesError;
      }

      return voucher;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['patient-ledgers'] });
    }
  });
};

export const useCreatePatientLedger = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ledgerData: { 
      patient_id: string; 
      account_id: string; 
      opening_balance: number; 
      opening_balance_type: BalanceType;
    }) => {
      const { data, error } = await supabase
        .from('patient_ledgers')
        .insert({
          ...ledgerData,
          ledger_name: `Patient Ledger ${Date.now()}`,
          current_balance: ledgerData.opening_balance,
          current_balance_type: ledgerData.opening_balance_type
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating patient ledger:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-ledgers'] });
    }
  });
};

export const useCreatePaymentTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentData: Omit<PaymentTransaction, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .insert({
          patient_id: paymentData.patient_id,
          payment_date: paymentData.payment_date,
          payment_mode: paymentData.payment_mode,
          payment_amount: paymentData.payment_amount,
          reference_number: paymentData.reference_number,
          bank_name: paymentData.bank_name,
          cheque_number: paymentData.cheque_number,
          cheque_date: paymentData.cheque_date,
          remarks: paymentData.remarks,
          status: paymentData.status || 'CLEARED'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating payment transaction:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['outstanding-invoices'] });
    }
  });
};

export const useAccountingSummary = () => {
  return useQuery({
    queryKey: ['accounting-summary'],
    queryFn: async () => {
      try {
        const [paymentsResult, outstandingResult] = await Promise.all([
          supabase.from('payment_transactions').select('payment_amount'),
          supabase.from('outstanding_invoices').select('outstanding_amount')
        ]);

        const paymentsData = paymentsResult.data || [];
        const outstandingData = outstandingResult.data || [];

        const totalPayments = paymentsData.reduce((sum, p) => sum + (p.payment_amount || 0), 0);
        const totalOutstanding = outstandingData.reduce((sum, o) => sum + (o.outstanding_amount || 0), 0);

        return {
          payments: paymentsData.map(item => ({
            ...item,
            payment_mode: 'CASH' as PaymentMode
          })) as unknown as PaymentTransaction[],
          outstanding: outstandingData.map(item => ({
            ...item,
            aging_bucket: '0-30' as AgingBucket
          })) as unknown as OutstandingInvoice[],
          totalPayments,
          totalOutstanding
        };
      } catch (error) {
        console.error('Error fetching accounting summary:', error);
        return {
          payments: [],
          outstanding: [],
          totalPayments: 0,
          totalOutstanding: 0
        };
      }
    }
  });
};

export const useAgingReport = () => {
  return useQuery({
    queryKey: ['aging-report'],
    queryFn: async () => {
      const { data: snapshots, error } = await supabase
        .from('aging_snapshots')
        .select(`
          *,
          patient:patients(
            id,
            name,
            patients_id
          )
        `)
        .order('snapshot_date', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching aging report:', error);
        throw error;
      }

      if (!snapshots || snapshots.length === 0) {
        return {
          patients: [],
          summary: {
            bucket_0_30: 0,
            bucket_31_60: 0,
            bucket_61_90: 0,
            bucket_91_180: 0,
            bucket_181_365: 0,
            bucket_365_plus: 0,
            total_outstanding: 0
          }
        };
      }

      const summary = snapshots.reduce((acc, snapshot) => ({
        bucket_0_30: acc.bucket_0_30 + (snapshot.bucket_0_30 || 0),
        bucket_31_60: acc.bucket_31_60 + (snapshot.bucket_31_60 || 0),
        bucket_61_90: acc.bucket_61_90 + (snapshot.bucket_61_90 || 0),
        bucket_91_180: acc.bucket_91_180 + (snapshot.bucket_91_180 || 0),
        bucket_181_365: acc.bucket_181_365 + (snapshot.bucket_181_365 || 0),
        bucket_365_plus: acc.bucket_365_plus + (snapshot.bucket_365_plus || 0),
        total_outstanding: acc.total_outstanding + (snapshot.total_outstanding || 0)
      }), {
        bucket_0_30: 0,
        bucket_31_60: 0,
        bucket_61_90: 0,
        bucket_91_180: 0,
        bucket_181_365: 0,
        bucket_365_plus: 0,
        total_outstanding: 0
      });

      return {
        patients: snapshots,
        summary
      };
    }
  });
};

export const usePatientStatement = () => {
  return useQuery({
    queryKey: ['patient-statement'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_ledgers')
        .select(`
          *,
          patient:patients(
            id,
            name,
            patients_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching patient statement:', error);
        throw error;
      }

      return data || [];
    }
  });
};

// Export aliases for backward compatibility
export const useAccountingData = useAccountingSummary;
export const useCreatePayment = useCreatePaymentTransaction;
