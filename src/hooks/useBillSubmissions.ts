import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BillSubmissionInput {
  visit_id: string;
  corporate?: string;
  bill_amount?: number;
  executive_who_submitted?: string;
  date_of_submission?: string;
  expected_payment_date?: string;
  received_amount?: number;
  deduction_amount?: number;
  tds_amount?: number;
  received_date?: string;
}

// Fetch all bill submissions with patient info via join, filtered by hospital
export const useBillSubmissions = (hospitalName?: string) => {
  return useQuery({
    queryKey: ['bill-submissions', hospitalName],
    queryFn: async () => {
      let query = supabase
        .from('bill_preparation' as any)
        .select(`
          id,
          visit_id,
          corporate,
          bill_amount,
          executive_who_submitted,
          date_of_submission,
          expected_payment_date,
          received_amount,
          deduction_amount,
          tds_amount,
          received_date,
          created_at,
          visits!inner!visit_id(
            admission_date,
            discharge_date,
            patients!inner(name, corporate, hospital_name)
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by hospital if provided
      if (hospitalName) {
        query = query.eq('visits.patients.hospital_name', hospitalName);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map data to include patient_name and dates from join
      return (data || []).map((item: any) => ({
        ...item,
        patient_name: item.visits?.patients?.name || '',
        patient_corporate: item.visits?.patients?.corporate || '',
        admission_date: item.visits?.admission_date || '',
        discharge_date: item.visits?.discharge_date || '',
      }));
    },
  });
};

// Create bill submission (uses upsert to update existing record if visit_id exists)
export const useCreateBillSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BillSubmissionInput) => {
      const { data: result, error } = await supabase
        .from('bill_preparation' as any)
        .upsert({
          visit_id: data.visit_id,
          corporate: data.corporate || null,
          bill_amount: data.bill_amount || 0,
          executive_who_submitted: data.executive_who_submitted || null,
          date_of_submission: data.date_of_submission || null,
          expected_payment_date: data.expected_payment_date || null,
          received_amount: data.received_amount || null,
          deduction_amount: data.deduction_amount || null,
          tds_amount: data.tds_amount || null,
          received_date: data.received_date || null,
        }, {
          onConflict: 'visit_id'
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-submissions'] });
      toast.success('Bill submission saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save bill submission: ' + error.message);
    },
  });
};

// Update bill submission
export const useUpdateBillSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: BillSubmissionInput & { id: string }) => {
      const { data: result, error } = await supabase
        .from('bill_preparation' as any)
        .update({
          visit_id: data.visit_id,
          corporate: data.corporate || null,
          bill_amount: data.bill_amount || 0,
          executive_who_submitted: data.executive_who_submitted || null,
          date_of_submission: data.date_of_submission || null,
          expected_payment_date: data.expected_payment_date || null,
          received_amount: data.received_amount || null,
          deduction_amount: data.deduction_amount || null,
          tds_amount: data.tds_amount || null,
          received_date: data.received_date || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-submissions'] });
      toast.success('Bill submission updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update bill submission: ' + error.message);
    },
  });
};

// Delete bill submission
export const useDeleteBillSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bill_preparation' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-submissions'] });
      toast.success('Bill submission deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete bill submission: ' + error.message);
    },
  });
};
