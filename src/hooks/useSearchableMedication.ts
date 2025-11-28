import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSearchableMedication = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: medications = [], isLoading } = useQuery({
    queryKey: ['medications', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('medication')
        .select('*')
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      console.log('Medication search query result:', { data, error, searchTerm });
      
      if (error) {
        console.error('Error fetching medications:', error);
        throw error;
      }
      
      return data;
    }
  });

  return {
    medications,
    isLoading,
    searchTerm,
    setSearchTerm
  };
};