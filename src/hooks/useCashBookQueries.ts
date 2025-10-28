import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CashBookEntry {
  voucher_date: string;
  transaction_time: string;
  time_only: string;
  voucher_number: string;
  voucher_type: string;
  voucher_narration: string;
  entry_narration: string;
  debit_amount: number;
  credit_amount: number;
  particulars: string;
  user_id: string;
  entered_by: string;
  status: string;
  voucher_id: string;
  entry_id: string;
}

export interface CashBookFilters {
  from_date?: string;
  to_date?: string;
  created_by?: string;
  voucher_type?: string;
  search_narration?: string;
}

export interface CashAccountBalance {
  opening_balance: number;
  opening_balance_type: 'DR' | 'CR';
  balance_amount: number;
}

/**
 * Hook to fetch cash book transactions from database
 */
export const useCashBookEntries = (filters?: CashBookFilters) => {
  return useQuery({
    queryKey: ['cash-book-entries', filters],
    queryFn: async () => {
      // First, get the Cash account ID
      // Note: The account name in database is 'Cash in Hand' (account code 1110)
      const { data: cashAccount, error: accountError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_name, opening_balance, opening_balance_type, is_active')
        .eq('account_name', 'Cash in Hand')
        .maybeSingle();

      if (accountError) {
        console.error('Error fetching cash account:', accountError);
        throw new Error(`Database error: ${accountError.message}`);
      }

      if (!cashAccount) {
        console.error('Cash account not found in chart_of_accounts');
        throw new Error('Cash account "Cash in Hand" not found. Please ensure it exists in the chart of accounts.');
      }

      if (!cashAccount.is_active) {
        console.error('Cash account exists but is inactive');
        throw new Error('Cash account "Cash in Hand" is inactive. Please activate it in the chart of accounts.');
      }

      // Build the main query
      let query = supabase
        .from('voucher_entries')
        .select(`
          id,
          voucher_id,
          narration,
          debit_amount,
          credit_amount,
          voucher:vouchers (
            id,
            voucher_date,
            voucher_number,
            narration,
            status,
            created_at,
            created_by,
            patient_id,
            voucher_type:voucher_types (
              id,
              voucher_type_name,
              voucher_category,
              voucher_type_code
            ),
            patient:patients (
              id,
              name
            )
          )
        `)
        .eq('account_id', cashAccount.id)
        .order('voucher(voucher_date)', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching cash book entries:', error);
        throw error;
      }

      // Transform the data to match CashBookEntry interface
      const entries: CashBookEntry[] = (data || [])
        .map((entry: any) => {
          const voucher = entry.voucher;
          if (!voucher) return null;

          // Apply status filter
          if (voucher.status !== 'AUTHORISED') return null;

          // Apply date filters
          if (filters?.from_date && voucher.voucher_date < filters.from_date) return null;
          if (filters?.to_date && voucher.voucher_date > filters.to_date) return null;

          // Apply user filter
          if (filters?.created_by && voucher.created_by !== filters.created_by) return null;

          // Apply voucher type filter
          if (filters?.voucher_type && voucher.voucher_type?.voucher_category !== filters.voucher_type) return null;

          // Apply narration search filter
          if (filters?.search_narration) {
            const searchLower = filters.search_narration.toLowerCase();
            const voucherNarration = (voucher.narration || '').toLowerCase();
            const entryNarration = (entry.narration || '').toLowerCase();
            if (!voucherNarration.includes(searchLower) && !entryNarration.includes(searchLower)) {
              return null;
            }
          }

          const createdAt = new Date(voucher.created_at);
          const timeOnly = createdAt.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });

          return {
            voucher_date: voucher.voucher_date,
            transaction_time: voucher.created_at,
            time_only: timeOnly,
            voucher_number: voucher.voucher_number || '',
            voucher_type: voucher.voucher_type?.voucher_type_name || '',
            voucher_narration: voucher.narration || '',
            entry_narration: entry.narration || '',
            debit_amount: entry.debit_amount || 0,
            credit_amount: entry.credit_amount || 0,
            particulars: voucher.patient?.name || 'Cash Transaction',
            user_id: voucher.created_by || '',
            entered_by: 'System',
            status: voucher.status,
            voucher_id: voucher.id,
            entry_id: entry.id
          };
        })
        .filter((entry): entry is CashBookEntry => entry !== null);

      return {
        entries,
        openingBalance: {
          opening_balance: cashAccount.opening_balance || 0,
          opening_balance_type: cashAccount.opening_balance_type as 'DR' | 'CR',
          balance_amount: cashAccount.opening_balance_type === 'DR'
            ? cashAccount.opening_balance
            : -cashAccount.opening_balance
        }
      };
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true
  });
};

/**
 * Hook to get list of users who created cash transactions
 */
export const useCashBookUsers = () => {
  return useQuery({
    queryKey: ['cash-book-users'],
    queryFn: async () => {
      // Get Cash account ID first
      const { data: cashAccount, error: accountError } = await supabase
        .from('chart_of_accounts')
        .select('id, is_active')
        .eq('account_name', 'Cash in Hand')
        .maybeSingle();

      if (accountError) {
        console.error('Error fetching cash account:', accountError);
        return [];
      }

      if (!cashAccount || !cashAccount.is_active) {
        return [];
      }

      const { data, error } = await supabase
        .from('vouchers')
        .select('created_by')
        .in('id', supabase
          .from('voucher_entries')
          .select('voucher_id')
          .eq('account_id', cashAccount.id)
        );

      if (error) {
        console.error('Error fetching cash book users:', error);
        return [];
      }

      // Return a simple default user list
      // In the future, this can be enhanced to fetch actual user data
      return [{
        id: 'all',
        email: 'all@users.com',
        full_name: 'All Users'
      }];
    }
  });
};

/**
 * Hook to get list of voucher types used in cash transactions
 */
export const useCashBookVoucherTypes = () => {
  return useQuery({
    queryKey: ['cash-book-voucher-types'],
    queryFn: async () => {
      // Get Cash account ID first
      const { data: cashAccount, error: accountError } = await supabase
        .from('chart_of_accounts')
        .select('id, is_active')
        .eq('account_name', 'Cash in Hand')
        .maybeSingle();

      if (accountError) {
        console.error('Error fetching cash account:', accountError);
        return [];
      }

      if (!cashAccount || !cashAccount.is_active) {
        return [];
      }

      const { data, error } = await supabase
        .from('vouchers')
        .select(`
          voucher_type_id,
          voucher_type:voucher_types (
            id,
            voucher_type_name,
            voucher_category,
            voucher_type_code
          )
        `)
        .in('id', supabase
          .from('voucher_entries')
          .select('voucher_id')
          .eq('account_id', cashAccount.id)
        );

      if (error) {
        console.error('Error fetching cash book voucher types:', error);
        return [];
      }

      // Get unique voucher types
      const uniqueTypes = Array.from(
        new Map(
          (data || [])
            .filter(v => v.voucher_type)
            .map(v => [v.voucher_type.id, v.voucher_type])
        ).values()
      );

      return uniqueTypes;
    }
  });
};

/**
 * Calculate closing balance for cash account up to a date
 */
export const useCashBalance = (upToDate?: string) => {
  return useQuery({
    queryKey: ['cash-balance', upToDate],
    queryFn: async () => {
      // Get Cash account
      const { data: cashAccount, error: accountError } = await supabase
        .from('chart_of_accounts')
        .select('id, opening_balance, opening_balance_type, is_active')
        .eq('account_name', 'Cash in Hand')
        .maybeSingle();

      if (accountError) {
        console.error('Error fetching cash account:', accountError);
        throw new Error(`Database error: ${accountError.message}`);
      }

      if (!cashAccount) {
        console.error('Cash account not found in chart_of_accounts');
        throw new Error('Cash account "Cash in Hand" not found. Please ensure it exists in the chart of accounts.');
      }

      if (!cashAccount.is_active) {
        console.error('Cash account exists but is inactive');
        throw new Error('Cash account "Cash in Hand" is inactive. Please activate it in the chart of accounts.');
      }

      // Get all transactions up to date
      let query = supabase
        .from('voucher_entries')
        .select(`
          debit_amount,
          credit_amount,
          voucher:vouchers!inner (
            voucher_date,
            status
          )
        `)
        .eq('account_id', cashAccount.id)
        .eq('voucher.status', 'AUTHORISED');

      if (upToDate) {
        query = query.lte('voucher.voucher_date', upToDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error calculating cash balance:', error);
        throw error;
      }

      // Calculate totals
      const totalDebit = (data || []).reduce((sum, entry: any) => sum + (entry.debit_amount || 0), 0);
      const totalCredit = (data || []).reduce((sum, entry: any) => sum + (entry.credit_amount || 0), 0);

      // Calculate closing balance
      const openingBalance = cashAccount.opening_balance || 0;
      const openingType = cashAccount.opening_balance_type;

      let closingBalance: number;
      if (openingType === 'DR') {
        closingBalance = openingBalance + totalDebit - totalCredit;
      } else {
        closingBalance = openingBalance - totalDebit + totalCredit;
      }

      return {
        opening_balance: openingBalance,
        opening_balance_type: openingType,
        total_debit: totalDebit,
        total_credit: totalCredit,
        closing_balance: closingBalance,
        balance_type: closingBalance >= 0 ? 'DR' : 'CR'
      };
    }
  });
};
