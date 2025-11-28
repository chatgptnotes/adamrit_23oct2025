import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MedicalData {
  labs: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
  radiology: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
  medications: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
}

export const useMedicalData = () => {
  const fetchLabs = async () => {
    const { data, error } = await supabase
      .from('lab')
      .select('id, name, description')
      .order('name');
    
    if (error) throw error;
    return data;
  };

  const fetchRadiology = async () => {
    const { data, error } = await supabase
      .from('radiology')
      .select('id, name, description')
      .order('name');
    
    if (error) throw error;
    return data;
  };

  const fetchMedications = async () => {
    const { data, error } = await supabase
      .from('medication')
      .select('id, name, description')
      .order('name');
    
    if (error) throw error;
    return data;
  };

  const labsQuery = useQuery({
    queryKey: ['lab'],
    queryFn: fetchLabs
  });

  const radiologyQuery = useQuery({
    queryKey: ['radiology'],
    queryFn: fetchRadiology
  });

  const medicationsQuery = useQuery({
    queryKey: ['medication'],
    queryFn: fetchMedications
  });

  return {
    labs: labsQuery.data || [],
    radiology: radiologyQuery.data || [],
    medications: medicationsQuery.data || [],
    isLoading: labsQuery.isLoading || radiologyQuery.isLoading || medicationsQuery.isLoading,
    error: labsQuery.error || radiologyQuery.error || medicationsQuery.error
  };
}; 