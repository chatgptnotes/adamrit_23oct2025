// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VisitSurgery, SanctionStatus, isValidSanctionStatus } from '@/types/surgery';
import { safeArrayAccess } from '@/utils/arrayHelpers';

export const useVisitSurgeries = (visitId: string | undefined) => {
  return useQuery({
    queryKey: ['visit-surgeries', visitId],
    queryFn: async () => {
      if (!visitId) return [];
      
      const { data, error } = await supabase
        .from('visit_surgeries')
        .select(`
          id,
          status,
          sanction_status,
          implant,
          anaesthetist_name,
          anaesthesia_type,
          cghs_surgery(
            id,
            name,
            code,
            description,
            category
          )
        `)
        .eq('visit_id', visitId);

      if (error) {
        console.error('Error fetching visit surgeries:', error);
        throw error;
      }

      return (data || []).map(surgery => ({
        ...surgery,
        surgeryName: safeArrayAccess(surgery.cghs_surgery, 'name')
      }));
    },
    enabled: !!visitId
  });
};

export const useUpdateSurgeryStatus = () => {
  return async (surgeryId: string, sanctionStatus: SanctionStatus) => {
    // Validate the sanction status
    if (!isValidSanctionStatus(sanctionStatus)) {
      throw new Error(`Invalid sanction status: ${sanctionStatus}`);
    }

    const { error } = await supabase
      .from('visit_surgeries')
      .update({
        sanction_status: sanctionStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', surgeryId);

    if (error) {
      console.error('Error updating surgery status:', error);
      throw error;
    }
  };
};

export const useUpdateSurgeryDetails = () => {
  return async (surgeryId: string, details: { implant?: string; anaesthetist_name?: string; anaesthesia_type?: string }) => {
    const { error } = await supabase
      .from('visit_surgeries')
      .update({
        ...details,
        updated_at: new Date().toISOString()
      })
      .eq('id', surgeryId);

    if (error) {
      console.error('Error updating surgery details:', error);
      throw error;
    }
  };
};
