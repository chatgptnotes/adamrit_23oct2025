
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSearchableHopeSurgery = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: surgeries = [], isLoading, error } = useQuery({
    queryKey: ['hope-surgeons', searchTerm],
    queryFn: async () => {
      
      let query = supabase
        .from('hope_surgeons')
        .select('*')
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,specialty.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching Hope surgeons:', error);
        throw error;
      }
      
      return data;
    }
  });

  return {
    surgeries,
    isLoading,
    error,
    searchTerm,
    setSearchTerm
  };
};
