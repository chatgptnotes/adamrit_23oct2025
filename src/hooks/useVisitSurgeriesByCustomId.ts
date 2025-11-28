// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VisitSurgery } from '@/types/surgery';
import { safeArrayAccess } from '@/utils/arrayHelpers';

export const useVisitSurgeriesByCustomId = (customVisitId: string | undefined) => {
  return useQuery({
    queryKey: ['visit-surgeries-by-custom-id', customVisitId],
    queryFn: async () => {
      if (!customVisitId) return [];
      
      const { data, error } = await supabase
        .from('visit_surgeries')
        .select(`
          id,
          status,
          sanction_status,
          cghs_surgery(
            id,
            name,
            code,
            description,
            category
          ),
          visits!inner(visit_id)
        `)
        .eq('visits.visit_id', customVisitId);

      if (error) {
        console.error('Error fetching visit surgeries by custom ID:', error);
        throw error;
      }

      return (data || []).map(surgery => ({
        ...surgery,
        surgeryName: safeArrayAccess(surgery.cghs_surgery, 'name')
      }));
    },
    enabled: !!customVisitId
  });
};
