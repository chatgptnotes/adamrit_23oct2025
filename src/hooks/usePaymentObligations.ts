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
      toast.success('Obligation updated');
    },
    onError: (err: any) => {
      toast.error('Failed to update: ' + err.message);
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
    toggleActive,
  };
};
