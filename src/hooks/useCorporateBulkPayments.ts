import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CorporateBulkPayment } from '@/types/corporateBulkPayment';

interface BulkPaymentFilters {
  from_date?: string;
  to_date?: string;
  corporate_name?: string;
  hospital_name?: string;
}

export const useCorporateBulkPayments = (filters?: BulkPaymentFilters) => {
  return useQuery({
    queryKey: ['corporate-bulk-payments', filters],
    queryFn: async () => {
      let query = supabase
        .from('corporate_bulk_payments')
        .select(`
          *,
          corporate_bulk_payment_allocations (*)
        `)
        .order('payment_date', { ascending: false });

      if (filters?.from_date) {
        query = query.gte('payment_date', filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte('payment_date', filters.to_date);
      }
      if (filters?.corporate_name && filters.corporate_name !== 'all') {
        query = query.eq('corporate_name', filters.corporate_name);
      }
      if (filters?.hospital_name) {
        query = query.eq('hospital_name', filters.hospital_name);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        allocations: item.corporate_bulk_payment_allocations || [],
      })) as CorporateBulkPayment[];
    },
    staleTime: 30000,
  });
};

export const useCreateCorporateBulkPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      header: {
        corporate_id?: string | null;
        corporate_name: string;
        payment_date: string;
        payment_mode: string;
        reference_number?: string | null;
        bank_name?: string | null;
        total_amount: number;
        claim_amount?: number | null;
        narration?: string | null;
        hospital_name?: string | null;
        created_by?: string | null;
      };
      allocations: Array<{
        patient_id: string | null;
        patient_name: string;
        patients_id: string | null;
        visit_id: string | null;
        amount: number;
        bill_amount: number | null;
        deduction_amount: number | null;
        tds_amount: number | null;
        remarks: string | null;
      }>;
    }) => {
      // 1. Insert header
      const { data: headerData, error: headerError } = await supabase
        .from('corporate_bulk_payments')
        .insert(payload.header)
        .select()
        .single();

      if (headerError) throw headerError;

      // 2. Insert allocations
      const allocationsWithParent = payload.allocations.map(a => ({
        ...a,
        bulk_payment_id: (headerData as any).id,
      }));

      const { error: allocError } = await supabase
        .from('corporate_bulk_payment_allocations')
        .insert(allocationsWithParent);

      if (allocError) throw allocError;

      return headerData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-bulk-payments'] });
    },
  });
};

export const useUpdateCorporateBulkPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      header: {
        corporate_name: string;
        payment_date: string;
        payment_mode: string;
        reference_number?: string | null;
        bank_name?: string | null;
        total_amount: number;
        claim_amount?: number | null;
        narration?: string | null;
      };
      allocations: Array<{
        patient_id: string | null;
        patient_name: string;
        patients_id: string | null;
        visit_id: string | null;
        amount: number;
        bill_amount: number | null;
        deduction_amount: number | null;
        tds_amount: number | null;
        remarks: string | null;
      }>;
    }) => {
      // 1. Update header
      const { error: headerError } = await supabase
        .from('corporate_bulk_payments')
        .update(payload.header)
        .eq('id', payload.id);

      if (headerError) throw headerError;

      // 2. Delete existing allocations
      const { error: deleteError } = await supabase
        .from('corporate_bulk_payment_allocations')
        .delete()
        .eq('bulk_payment_id', payload.id);

      if (deleteError) throw deleteError;

      // 3. Re-insert allocations
      if (payload.allocations.length > 0) {
        const allocationsWithParent = payload.allocations.map(a => ({
          ...a,
          bulk_payment_id: payload.id,
        }));

        const { error: allocError } = await supabase
          .from('corporate_bulk_payment_allocations')
          .insert(allocationsWithParent);

        if (allocError) throw allocError;
      }

      return payload.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-bulk-payments'] });
    },
  });
};

export const useDeleteCorporateBulkPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('corporate_bulk_payments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-bulk-payments'] });
    },
  });
};
