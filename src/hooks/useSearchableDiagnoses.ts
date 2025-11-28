
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSearchableDiagnoses = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: diagnoses = [], isLoading } = useQuery({
    queryKey: ['diagnoses', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('diagnoses')
        .select('*')
        .order('name');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching diagnoses:', error);
        throw error;
      }
      
      return data;
    }
  });

  return {
    diagnoses,
    isLoading,
    searchTerm,
    setSearchTerm
  };
};
