import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PendingPrescription {
  id: string;
  prescription_number: string | null;
  doctor_name: string | null;
  prescription_date: string | null;
  created_at: string | null;
  patient_name: string;
}

interface UsePendingPrescriptionsResult {
  count: number;
  recent: PendingPrescription[];
  isLoading: boolean;
}

const COUNT_KEY = ['pending-prescriptions', 'count'] as const;
const RECENT_KEY = ['pending-prescriptions', 'recent'] as const;

export const usePendingPrescriptions = (): UsePendingPrescriptionsResult => {
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The pharmacy's actionable queue = prescriptions the doctor has APPROVED
  // (i.e. "sent to pharmacy", awaiting dispense). PENDING ones are still with
  // the doctor and must NOT alert the pharmacy.
  const countQuery = useQuery({
    queryKey: COUNT_KEY,
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from('prescriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'APPROVED');
      if (error) return 0;
      return count ?? 0;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const recentQuery = useQuery({
    queryKey: RECENT_KEY,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('prescriptions')
        .select('id, prescription_number, doctor_name, prescription_date, created_at, patients(name)')
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map((r: any) => ({
        id: r.id,
        prescription_number: r.prescription_number,
        doctor_name: r.doctor_name,
        prescription_date: r.prescription_date,
        created_at: r.created_at,
        patient_name: r.patients?.name || 'Unknown',
      })) as PendingPrescription[];
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  useEffect(() => {
    const channel = (supabase as any)
      .channel('prescription-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prescriptions' },
        (payload: any) => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['pending-prescriptions'] });
            // Alert the pharmacy the moment a doctor approves a prescription
            // (status flips to APPROVED = "sent to pharmacy"). We don't toast
            // on INSERT (still PENDING with the doctor) or on dispense/delete.
            if (
              payload?.eventType === 'UPDATE' &&
              payload?.new?.status === 'APPROVED' &&
              payload?.old?.status !== 'APPROVED'
            ) {
              const num = payload?.new?.prescription_number;
              toast.success(num ? `Prescription #${num} sent to pharmacy` : 'New prescription sent to pharmacy');
            }
          }, 500);
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    count: countQuery.data ?? 0,
    recent: recentQuery.data ?? [],
    isLoading: countQuery.isLoading || recentQuery.isLoading,
  };
};
