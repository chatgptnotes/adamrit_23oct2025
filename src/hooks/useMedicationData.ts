
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Medication {
  id: string;
  name: string;
  code?: string;
  dosage?: string;
  route?: string;
}

export function useMedicationData(searchQuery: string) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedications = async () => {
      if (!searchQuery.trim()) {
        setMedications([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: supabaseError } = await supabase
          .from('medication')
          .select('id, name, generic_name, dosage, category')
          .ilike('name', `%${searchQuery}%`)
          .order('name');

        if (supabaseError) {
          throw supabaseError;
        }

        const mappedData = (data || []).map(item => ({
          id: item.id,
          name: item.name,
          code: item.generic_name || undefined,
          dosage: item.dosage || undefined,
          route: item.category || undefined
        }));

        setMedications(mappedData);
      } catch (err) {
        console.error('Error fetching medications:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch medications');
        setMedications([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchMedications, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  return { medications, loading, error };
}
