import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSearchableLab = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: labs = [], isLoading } = useQuery({
    queryKey: ['labs', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('lab')
        .select('*')
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      console.log('Lab search query result:', { data, error, searchTerm });
      
      if (error) {
        console.error('Error fetching lab tests:', error);
        throw error;
      }
      
      return data;
    }
  });

  return {
    labs,
    isLoading,
    searchTerm,
    setSearchTerm
  };
};