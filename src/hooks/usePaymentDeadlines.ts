import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PaymentDeadline {
  id: string;
  service_name: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  hospital_type: string;
  notes?: string;
  created_at: string;
}

/**
 * Payment deadlines for the current user's hospital, ordered by due_date asc.
 * Shared by the desktop Director page (editor) and the tablet Director view
 * (read-only summary).
 */
export function usePaymentDeadlines() {
  const { user } = useAuth();
  const hospitalType = user?.hospitalType;

  return useQuery({
    queryKey: ['paymentDeadlines', hospitalType],
    queryFn: async (): Promise<PaymentDeadline[]> => {
      if (!hospitalType) throw new Error('Hospital type not available');

      const { data, error } = await supabase
        .from('payment_deadlines')
        .select('*')
        .eq('hospital_type', hospitalType)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return (data || []) as PaymentDeadline[];
    },
    enabled: !!hospitalType,
  });
}
