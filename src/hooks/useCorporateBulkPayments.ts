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
          corporate_bulk_payment_allocations (*, patients:patient_id (patients_id))
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
        allocations: (item.corporate_bulk_payment_allocations || []).map((alloc: any) => ({
          ...alloc,
          patients_id: alloc.patients_id || alloc.patients?.patients_id || null,
        })),
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

      // 3. Sync to bill_preparation for Bill Submission module
      for (const alloc of payload.allocations) {
        if (alloc.visit_id) {
          await supabase
            .from('bill_preparation' as any)
            .upsert({
              visit_id: alloc.visit_id,
              bill_amount: alloc.bill_amount || 0,
              received_amount: alloc.amount || 0,
              deduction_amount: alloc.deduction_amount || 0,
              tds_amount: alloc.tds_amount || 0,
            }, { onConflict: 'visit_id' });
        }
      }

      return headerData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-bulk-payments'] });
      queryClient.invalidateQueries({ queryKey: ['bill-submissions'] });
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

      // 4. Sync to bill_preparation for Bill Submission module
      for (const alloc of payload.allocations) {
        if (alloc.visit_id) {
          await supabase
            .from('bill_preparation' as any)
            .upsert({
              visit_id: alloc.visit_id,
              bill_amount: alloc.bill_amount || 0,
              received_amount: alloc.amount || 0,
              deduction_amount: alloc.deduction_amount || 0,
              tds_amount: alloc.tds_amount || 0,
            }, { onConflict: 'visit_id' });
        }
      }

      return payload.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-bulk-payments'] });
      queryClient.invalidateQueries({ queryKey: ['bill-submissions'] });
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
