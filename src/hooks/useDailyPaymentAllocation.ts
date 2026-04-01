import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ScheduleEntry {
  id: string;
  schedule_date: string;
  obligation_id: string;
  party_name: string;
  category: string;
  daily_amount: number;
  carryforward_amount: number;
  total_due: number;
  paid_amount: number;
  status: string;
  days_overdue: number;
  voucher_id: string | null;
  paid_at: string | null;
  paid_by: string | null;
  notes: string | null;
  hospital_name: string;
}

export interface TallyBalance {
  hopeCash: number;
  hopeBank: number;
  ayushmanCash: number;
  ayushmanBank: number;
  lastSyncAt: string | null;
}

// Generate today's schedule by calling the RPC
const generateSchedule = async (date: string, hospital: string) => {
  const { error } = await (supabase as any).rpc('generate_daily_payment_schedule', {
    p_date: date,
    p_hospital: hospital,
  });
  if (error) {
    console.error('Failed to generate schedule:', error);
  }
};

export const useDailyPaymentSchedule = (date: string, hospital: string = 'hope') => {
  const queryClient = useQueryClient();

  // Auto-generate schedule on query, then fetch
  const schedule = useQuery({
    queryKey: ['daily-payment-schedule', date, hospital],
    queryFn: async () => {
      // Lazily generate schedule for the selected date
      await generateSchedule(date, hospital);

      const { data, error } = await (supabase as any)
        .from('daily_payment_schedule')
        .select('*')
        .eq('schedule_date', date)
        .eq('hospital_name', hospital)
        .order('days_overdue', { ascending: false })
        .order('category', { ascending: true });

      if (error) throw error;
      return (data || []) as ScheduleEntry[];
    },
  });

  // Mark as paid mutation
  const markPaid = useMutation({
    mutationFn: async ({ scheduleId, amount, userId }: { scheduleId: string; amount: number; userId: string }) => {
      const { data, error } = await (supabase as any).rpc('mark_obligation_paid', {
        p_schedule_id: scheduleId,
        p_amount: amount,
        p_user_id: userId,
      });
      if (error) throw error;
      return data; // voucher_id
    },
    onSuccess: (_voucherId: string, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['daily-payment-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['cash-book-entries'] });
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      toast.success(`Payment of Rs. ${variables.amount.toLocaleString('en-IN')} recorded successfully`);
    },
    onError: (err: any) => {
      toast.error('Payment failed: ' + err.message);
    },
  });

  return {
    schedule: schedule.data || [],
    isLoading: schedule.isLoading,
    error: schedule.error,
    refetch: schedule.refetch,
    markPaid,
  };
};

// Fetch Tally bank/cash balances for both hospitals
export const useTallyBalances = () => {
  return useQuery({
    queryKey: ['tally-balances-allocation'],
    queryFn: async () => {
      // Get all tally configs to find company IDs
      const { data: configs } = await (supabase as any)
        .from('tally_config')
        .select('id, company_name');

      const result: TallyBalance = {
        hopeCash: 0,
        hopeBank: 0,
        ayushmanCash: 0,
        ayushmanBank: 0,
        lastSyncAt: null,
      };

      if (!configs || configs.length === 0) return result;

      // For each config, fetch cash and bank ledgers
      for (const config of configs) {
        const companyLower = (config.company_name || '').toLowerCase();
        const isHope = companyLower.includes('hope');
        const isAyushman = companyLower.includes('ayushman') || companyLower.includes('aishman');

        const { data: ledgers } = await (supabase as any)
          .from('tally_ledgers')
          .select('name, closing_balance, parent_group, updated_at')
          .eq('company_id', config.id)
          .or('parent_group.ilike.%cash%,parent_group.ilike.%bank%');

        if (ledgers) {
          for (const l of ledgers) {
            const pg = (l.parent_group || '').toLowerCase();
            const bal = Math.abs(l.closing_balance || 0);

            if (isHope) {
              if (pg.includes('cash')) result.hopeCash += bal;
              else if (pg.includes('bank')) result.hopeBank += bal;
            } else if (isAyushman) {
              if (pg.includes('cash')) result.ayushmanCash += bal;
              else if (pg.includes('bank')) result.ayushmanBank += bal;
            }

            // Track latest sync time
            if (l.updated_at) {
              if (!result.lastSyncAt || l.updated_at > result.lastSyncAt) {
                result.lastSyncAt = l.updated_at;
              }
            }
          }
        }
      }

      return result;
    },
    refetchInterval: 60000, // refresh every minute
  });
};

// Fetch today's cash collections from voucher entries
export const useTodayCashCollections = (date: string) => {
  return useQuery({
    queryKey: ['today-cash-collections', date],
    queryFn: async () => {
      // Get Cash in Hand account
      const { data: cashAccount } = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('account_name', 'Cash in Hand')
        .maybeSingle();

      if (!cashAccount) return 0;

      // Sum debit entries to Cash in Hand for today (receipts)
      const { data: entries } = await supabase
        .from('voucher_entries')
        .select(`
          debit_amount,
          voucher:vouchers!inner (voucher_date, status)
        `)
        .eq('account_id', cashAccount.id) as any;

      if (!entries) return 0;

      // Filter for today's date and sum debits (cash received)
      const todayTotal = entries
        .filter((e: any) => e.voucher?.voucher_date === date && e.voucher?.status !== 'cancelled')
        .reduce((sum: number, e: any) => sum + (e.debit_amount || 0), 0);

      return todayTotal;
    },
  });
};

// Payment history query (date range)
export const usePaymentHistory = (fromDate: string, toDate: string, hospital: string = 'hope') => {
  return useQuery({
    queryKey: ['payment-history', fromDate, toDate, hospital],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('daily_payment_schedule')
        .select('*')
        .eq('hospital_name', hospital)
        .gte('schedule_date', fromDate)
        .lte('schedule_date', toDate)
        .order('schedule_date', { ascending: false })
        .order('days_overdue', { ascending: false });

      if (error) throw error;
      return (data || []) as ScheduleEntry[];
    },
    enabled: !!fromDate && !!toDate,
  });
};
