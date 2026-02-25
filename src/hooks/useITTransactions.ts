import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ITTransaction } from '@/types/itTransaction';

interface ITTransactionFilters {
  from_date?: string;
  to_date?: string;
  department?: string;
  transaction_type?: string;
  patient_id?: string;
  hospital_name?: string;
}

export const useITTransactions = (filters?: ITTransactionFilters) => {
  return useQuery({
    queryKey: ['it-transactions', filters],
    queryFn: async () => {
      let query = (supabase
        .from as any)('it_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (filters?.hospital_name) query = query.eq('hospital_name', filters.hospital_name);
      if (filters?.from_date) query = query.gte('transaction_date', filters.from_date);
      if (filters?.to_date) query = query.lte('transaction_date', filters.to_date);
      if (filters?.department) query = query.eq('department', filters.department);
      if (filters?.transaction_type) query = query.eq('transaction_type', filters.transaction_type);
      if (filters?.patient_id) query = query.ilike('patient_id', `%${filters.patient_id}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ITTransaction[];
    },
    staleTime: 30000,
  });
};

export const useCreateITTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<ITTransaction, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase
        .from as any)('it_transactions')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['it-transactions'] });
    },
  });
};

export const useUpdateITTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<ITTransaction> & { id: string }) => {
      const { error } = await (supabase
        .from as any)('it_transactions')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['it-transactions'] });
    },
  });
};

export const useDeleteITTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from as any)('it_transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['it-transactions'] });
    },
  });
};
