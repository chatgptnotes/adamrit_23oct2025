import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SearchableSelectOption } from '@/components/ui/searchable-select';

interface CorporateRecord {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface UseCorporateDataReturn {
  corporateOptions: SearchableSelectOption[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCorporateData = (): UseCorporateDataReturn => {
  const [corporateOptions, setCorporateOptions] = useState<SearchableSelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCorporateData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching ALL corporates from database...');

      // Fetch all corporate records from database
      const { data, error: fetchError } = await supabase
        .from('corporate')
        .select('id, name, description')
        .order('name', { ascending: true });

      console.log('📊 Database query result:', {
        data: data?.length,
        error: fetchError?.message,
        firstFew: data?.slice(0, 5)?.map(c => c.name)
      });

      if (fetchError) {
        console.error('Error fetching corporate data:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data && data.length > 0) {
        // Convert ALL database records to SearchableSelectOption format
        const corporateOptions: SearchableSelectOption[] = data.map((corp: CorporateRecord) => ({
          value: corp.name, // Use name as value for consistency with form handling
          label: corp.name
        }));

        setCorporateOptions(corporateOptions);
        console.log('✅ Loaded ALL corporate options from database:', corporateOptions.length, 'total');
        console.log('🏢 Corporate options:', corporateOptions.map(opt => opt.label).join(', '));
      } else {
        console.log('⚠️ No corporate records found in database');
        // Only use fallback if database is completely empty
        const fallbackOptions = [
          { value: "private", label: "Private" },
          { value: "esic", label: "ESIC" },
          { value: "cghs", label: "CGHS" },
          { value: "echs", label: "ECHS" },
          { value: "insurance", label: "Insurance" },
        ];
        setCorporateOptions(fallbackOptions);
        console.log('📋 Using fallback options:', fallbackOptions.length, 'total');
      }
    } catch (err) {
      console.error('Error in fetchCorporateData:', err);
      setError('Failed to load corporate options');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchCorporateData();

    // Set up real-time subscription for corporate table changes
    const corporateSubscription = supabase
      .channel('corporate-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'corporate'
        },
        (payload) => {
          console.log('🔄 Corporate table changed:', payload);
          // Refetch data when corporate table changes
          fetchCorporateData();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      corporateSubscription.unsubscribe();
    };
  }, []);

  return {
    corporateOptions,
    loading,
    error,
    refetch: fetchCorporateData
  };
};