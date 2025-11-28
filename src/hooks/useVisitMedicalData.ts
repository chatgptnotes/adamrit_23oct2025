
// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VisitLab {
  id: string;
  lab_name: string;
  status: string;
}

interface VisitRadiology {
  id: string;
  radiology_name: string;
  status: string;
}

interface VisitMedication {
  id: string;
  medication_name: string;
  medication_type: string;
  status: string;
}

export const useVisitMedicalData = (customVisitId: string | undefined) => {
  const labsQuery = useQuery({
    queryKey: ['visit-labs-custom', customVisitId],
    queryFn: async (): Promise<VisitLab[]> => {
      if (!customVisitId) return [];

      // Fetch labs using the TEXT visit_id directly (as per schema)
      const { data, error } = await supabase
        .from('visit_labs')
        .select(`
          id,
          status,
          ordered_date,
          collected_date,
          completed_date,
          result_value,
          lab:lab_id (
            name
          )
        `)
        .eq('visit_id', customVisitId);

      if (error) {
        console.error('Error fetching visit labs:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        lab_name: (item.lab && typeof item.lab === 'object' && 'name' in item.lab) ? item.lab.name as string : 'Unknown Lab',
        status: item.status
      }));
    },
    enabled: !!customVisitId,
  });

  const radiologyQuery = useQuery({
    queryKey: ['visit-radiology-custom', customVisitId],
    queryFn: async (): Promise<VisitRadiology[]> => {
      if (!customVisitId) return [];

      // Fetch radiology using the TEXT visit_id directly (as per schema)
      const { data, error } = await supabase
        .from('visit_radiology')
        .select(`
          id,
          status,
          ordered_date,
          scheduled_date,
          completed_date,
          findings,
          impression,
          radiology:radiology_id (
            name
          )
        `)
        .eq('visit_id', customVisitId);

      if (error) {
        console.error('Error fetching visit radiology:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        radiology_name: (item.radiology && typeof item.radiology === 'object' && 'name' in item.radiology) ? item.radiology.name as string : 'Unknown Radiology',
        status: item.status
      }));
    },
    enabled: !!customVisitId,
  });

  const medicationsQuery = useQuery({
    queryKey: ['visit-medications-custom', customVisitId],
    queryFn: async (): Promise<VisitMedication[]> => {
      if (!customVisitId) return [];

      // Fetch medications using the TEXT visit_id directly (as per schema)
      const { data, error } = await supabase
        .from('visit_medications')
        .select(`
          id,
          status,
          medication_type,
          dosage,
          frequency,
          duration,
          prescribed_date,
          start_date,
          end_date,
          medication:medication_id (
            name
          )
        `)
        .eq('visit_id', customVisitId);

      if (error) {
        console.error('Error fetching visit medications:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        medication_name: (item.medication && typeof item.medication === 'object' && 'name' in item.medication) ? item.medication.name as string : 'Unknown Medication',
        medication_type: item.medication_type,
        status: item.status
      }));
    },
    enabled: !!customVisitId,
  });

  return {
    labs: labsQuery.data || [],
    radiology: radiologyQuery.data || [],
    medications: medicationsQuery.data || [],
    isLoadingLabs: labsQuery.isLoading,
    isLoadingRadiology: radiologyQuery.isLoading,
    isLoadingMedications: medicationsQuery.isLoading,
  };
};
