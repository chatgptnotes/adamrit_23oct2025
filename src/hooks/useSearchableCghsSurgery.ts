
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSearchableCghsSurgery = (patientCorporate?: string) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: surgeries = [], isLoading } = useQuery({
    queryKey: ['cghs-surgery', searchTerm, patientCorporate],
    queryFn: async () => {
      console.log('🔍 Fetching CGHS surgeries:', {
        searchTerm,
        patientCorporate: patientCorporate || 'NOT SET'
      });

      let query = supabase
        .from('cghs_surgery')
        .select('*')
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
      const corporate = (patientCorporate || '').toLowerCase().trim();
      const usesBhopaliRate =
        corporate.includes('mp police') ||
        corporate.includes('ordnance factory') ||
        corporate.includes('ordnance factory itarsi');

      const surgeriesWithSelectedRate = data?.map(surgery => {
        // Select appropriate rate based on corporate
        let selectedRate = surgery.private || surgery.NABH_NABL_Rate || 0;
        let rateSource = 'private/nabh_nabl';

        if (usesBhopaliRate && surgery.bhopal_nabh_rate && surgery.bhopal_nabh_rate > 0) {
          selectedRate = surgery.bhopal_nabh_rate;
          rateSource = 'bhopal_nabh';
        }

        console.log('🔍 Surgery rate mapping:', {
          surgeryName: surgery.name,
          patientCorporate: patientCorporate || 'NOT SET',
          corporateLower: corporate || 'EMPTY',
          usesBhopaliRate: usesBhopaliRate,
          bhopaliNABHRate: surgery.bhopal_nabh_rate,
          privateRate: surgery.private,
          nabhNablRate: surgery.NABH_NABL_Rate,
          selectedRate: selectedRate,
          rateSource: rateSource
        });

        return {
          ...surgery,
          selectedRate, // Add selected rate field
          NABH_NABL_Rate: selectedRate, // Override NABH_NABL_Rate with selected rate
          rateSource // Add rate source for debugging
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
