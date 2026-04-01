import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PaymentObligation {
  id: string;
  party_name: string;
  category: 'fixed' | 'variable';
  sub_category: string | null;
  default_daily_amount: number;
  priority: number;
  chart_of_accounts_id: string | null;
  is_active: boolean;
  notes: string | null;
  hospital_name: string;
  payee_name: string | null; // specific payee e.g. "Dr Pramod Gandhi" for rent
  payee_search_table: string | null; // e.g. hope_consultants, staff_members
  created_at: string;
  updated_at: string;
}

export type NewObligation = Omit<PaymentObligation, 'id' | 'created_at' | 'updated_at'>;

export const usePaymentObligations = (hospital: string = 'hope') => {
  const queryClient = useQueryClient();

  const obligations = useQuery({
    queryKey: ['payment-obligations', hospital],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('payment_obligations')
        .select('*')
        .eq('hospital_name', hospital)
        .order('priority', { ascending: true });
      if (error) throw error;
      return (data || []) as PaymentObligation[];
    },
  });

  const createObligation = useMutation({
    mutationFn: async (obligation: Partial<NewObligation>) => {
      const { data, error } = await (supabase as any)
        .from('payment_obligations')
        .insert({
          party_name: obligation.party_name,
          category: obligation.category || 'variable',
          sub_category: obligation.sub_category || 'other',
          default_daily_amount: obligation.default_daily_amount || 0,
          priority: obligation.priority || 10,
          chart_of_accounts_id: obligation.chart_of_accounts_id || null,
          is_active: true,
          notes: obligation.notes || null,
          hospital_name: obligation.hospital_name || hospital,
          payee_name: obligation.payee_name || null,
          payee_search_table: obligation.payee_search_table || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-obligations'] });
      toast.success('Obligation added successfully');
    },
    onError: (err: any) => {
      toast.error('Failed to add obligation: ' + err.message);
    },
  });

  const updateObligation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentObligation> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('payment_obligations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-obligations'] });
      queryClient.invalidateQueries({ queryKey: ['daily-payment-schedule'] });
      toast.success('Obligation updated');
    },
    onError: (err: any) => {
      toast.error('Failed to update: ' + err.message);
    },
  });

  const deleteObligation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('payment_obligations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-obligations'] });
      toast.success('Obligation deleted');
    },
    onError: (err: any) => {
      toast.error('Failed to delete: ' + err.message);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from('payment_obligations')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-obligations'] });
      toast.success('Status updated');
    },
    onError: (err: any) => {
      toast.error('Failed to toggle: ' + err.message);
    },
  });

  return {
    obligations: obligations.data || [],
    isLoading: obligations.isLoading,
    error: obligations.error,
    createObligation,
    updateObligation,
    deleteObligation,
    toggleActive,
  };
};

// Search consultants/surgeons/anaesthetists/staff for sub-payment payee
export const usePayeeSearch = (searchTable: string, searchTerm: string) => {
  return useQuery({
    queryKey: ['payee-search', searchTable, searchTerm],
    queryFn: async () => {
      if (!searchTable || !searchTerm || searchTerm.length < 2) return [];

      const { data, error } = await (supabase as any)
        .from(searchTable)
        .select('id, name, specialty, department')
        .ilike('name', `%${searchTerm}%`)
        .limit(20);

      if (error) {
        console.error('Payee search error:', error);
        return [];
      }
      return (data || []) as { id: string; name: string; specialty?: string; department?: string }[];
    },
    enabled: !!searchTable && searchTerm.length >= 2,
  });
};
