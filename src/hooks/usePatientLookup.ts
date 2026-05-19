import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Patient, SearchCriteria } from '@/components/PatientLookup/types/patientLookup';

/** Deterministic mock mobile derived from a patient id (legacy demo behaviour). */
export function generateMockMobile(patientId: string): string {
  const hash = patientId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const phoneBase = (Math.abs(hash) % 9000000000) + 1000000000;
  return phoneBase.toString();
}

/**
 * Shared patient-search logic. Extracted verbatim from PatientLookupDialog so
 * the desktop dialog and the tablet patient picker run one query path.
 * The query is hospital-scoped (`hospital_name`) and kept in the query key.
 */
export function usePatientLookup() {
  const { hospitalConfig } = useAuth();
  const [criteria, setCriteria] = useState<SearchCriteria>({
    mobile: '',
    name: '',
    patientId: '',
  });
  const [hasSearched, setHasSearched] = useState(false);

  const { data: patients = [], isLoading, refetch } = useQuery({
    queryKey: [
      'patient-lookup',
      criteria.mobile,
      criteria.name,
      criteria.patientId,
      hospitalConfig.name,
    ],
    queryFn: async (): Promise<Patient[]> => {
      if (!criteria.mobile && !criteria.name && !criteria.patientId) {
        return [];
      }

      let query = supabase
        .from('patients')
        .select('*')
        .eq('hospital_name', hospitalConfig.name)
        .order('created_at', { ascending: false });

      if (criteria.name) {
        query = query.ilike('name', `%${criteria.name}%`);
      }
      if (criteria.patientId) {
        query = query.or(`patients_id.ilike.%${criteria.patientId}%`);
      }

      const { data, error } = await query.limit(10);
      if (error) {
        console.error('Error searching patients:', error);
        throw error;
      }

      if (criteria.mobile && data) {
        return data.filter((patient: any) => {
          const mockMobile = generateMockMobile(patient.patients_id || patient.id);
          return mockMobile.includes(criteria.mobile);
        }) as Patient[];
      }

      return (data || []) as Patient[];
    },
    enabled: false, // triggered manually via search()
  });

  const search = useCallback(() => {
    setHasSearched(true);
    refetch();
  }, [refetch]);

  const hasCriteria = !!(criteria.mobile || criteria.name || criteria.patientId);
  const showNoResults =
    hasSearched && patients.length === 0 && !isLoading && hasCriteria;

  return {
    criteria,
    setCriteria,
    patients,
    isLoading,
    hasSearched,
    hasCriteria,
    showNoResults,
    search,
    refetch,
  };
}
