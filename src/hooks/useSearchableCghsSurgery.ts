
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Helper: check if patient is Maharashtra Yojana (MJPJY / Ayushman Bharat MH)
const isMaharashtraYojana = (corp: string) => {
  const c = (corp || '').toLowerCase().trim();
  return c.includes('yojana') || c.includes('mjpjy') || c.includes('ayushman') ||
    c.includes('mahatma jyotiba') || c.includes('pmjay') || c.includes('ab-pmjay') ||
    c.includes('ab pmjay') || c.includes('maharashtra yojana');
};

export const useSearchableCghsSurgery = (patientCorporate?: string) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: surgeries = [], isLoading } = useQuery({
    queryKey: ['cghs-surgery', searchTerm, patientCorporate],
    queryFn: async () => {
      const corporate = (patientCorporate || '').toLowerCase().trim();
      const isYojana = isMaharashtraYojana(corporate);

      // For Maharashtra Yojana patients, search from yojana_mh_procedures
      if (isYojana) {
        let query = supabase
          .from('yojana_mh_procedures')
          .select('id, procedure_code, procedure_name, package_name, specialty, tier3_rate, level_of_care, los, medical_or_surgical')
          .order('procedure_name');

        if (searchTerm) {
          query = query.or(`procedure_name.ilike.%${searchTerm}%,package_name.ilike.%${searchTerm}%,procedure_code.ilike.%${searchTerm}%,specialty.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        if (error) {
          console.error('Error fetching Yojana procedures:', error);
          throw error;
        }

        return (data || []).map(proc => ({
          id: proc.id,
          name: proc.procedure_name || proc.package_name || '',
          code: proc.procedure_code || '',
          category: proc.specialty || '',
          description: `${proc.package_name || ''} | LOS: ${proc.los || 'N/A'} | ${proc.level_of_care || ''}`,
          private: proc.tier3_rate || 0,
          NABH_NABL_Rate: proc.tier3_rate || 0,
          selectedRate: proc.tier3_rate || 0,
          rateSource: 'yojana_mh_tier3',
          is_yojana: true
        }));
      }

      // Standard CGHS surgery search
      let query = supabase
        .from('cghs_surgery')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching CGHS surgeries:', error);
        throw error;
      }

      // Apply corporate-based rate selection
      const usesBhopaliRate =
        corporate.includes('mp police') ||
        corporate.includes('ordnance factory') ||
        corporate.includes('ordnance factory itarsi');

      const surgeriesWithSelectedRate = data?.map(surgery => {
        let selectedRate = surgery.private || surgery.NABH_NABL_Rate || 0;
        let rateSource = 'private/nabh_nabl';

        if (usesBhopaliRate && surgery.bhopal_nabh_rate && surgery.bhopal_nabh_rate > 0) {
          selectedRate = surgery.bhopal_nabh_rate;
          rateSource = 'bhopal_nabh';
        }

        return {
          ...surgery,
          selectedRate,
          NABH_NABL_Rate: selectedRate,
          rateSource
        };
      }) || [];

      return surgeriesWithSelectedRate;
    }
  });

  return {
    surgeries,
    isLoading,
    searchTerm,
    setSearchTerm
  };
};
