import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSearchableRadiology = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: radiology = [], isLoading } = useQuery({
    queryKey: ['radiology', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('radiology')
        .select('id, name, category, description, private, NABH_NABL_Rate, Non_NABH_NABL_Rate, bhopal_nabh, bhopal_non_nabh, created_at, updated_at')
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      console.log('Radiology search query result:', { data, error, searchTerm });
      
      if (error) {
        console.error('Error fetching radiology studies:', error);
        throw error;
      }
      
      return data;
    }
  });

  return {
    radiology,
    isLoading,
    searchTerm,
    setSearchTerm
  };
};