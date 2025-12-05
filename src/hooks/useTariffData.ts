import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TariffOption {
  label: string;
  value: string;
}

export const useTariffData = () => {
  const [tariffOptions, setTariffOptions] = useState<TariffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTariffData();
  }, []);

  const fetchTariffData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch unique service_group values from lab table
      const { data, error: fetchError } = await supabase
        .from('lab')
        .select('service_group')
        .not('service_group', 'is', null)
        .not('service_group', 'eq', '');

      if (fetchError) {
        throw fetchError;
      }

      // Extract unique service groups and create options
      const uniqueServices = [...new Set(
        data
          ?.map(item => item.service_group)
          .filter(Boolean)
          .map(name => name.trim())
          .filter(name => name.length > 0)
      )] as string[];

      // Convert to options format
      const options: TariffOption[] = uniqueServices
        .sort()
        .map(service => ({
          label: service,
          value: service
        }));

      // Add some default options if no data exists
      if (options.length === 0) {
        const defaultOptions = [
          'Laboratory Services',
          'Pathology Services', 
          'Biochemistry Services',
          'Hematology Services',
          'Microbiology Services',
          'Immunology Services',
          'Molecular Diagnostics',
          'Histopathology Services',
          'Cytology Services',
          'Blood Bank Services'
        ];

        defaultOptions.forEach(service => {
          options.push({
            label: service,
            value: service
          });
        });
      }

      setTariffOptions(options);
    } catch (err) {
      console.error('Error fetching service group data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch service group data');
      
      // Fallback to default options on error
      const fallbackOptions = [
        'Laboratory Services',
        'Pathology Services', 
        'Biochemistry Services',
        'Hematology Services',
        'Microbiology Services',
        'Immunology Services'
      ].map(service => ({
        label: service,
        value: service
      }));
      
      setTariffOptions(fallbackOptions);
    } finally {
      setLoading(false);
    }
  };

  const addNewTariff = async (newService: string) => {
    if (!newService.trim() || tariffOptions.some(option => option.value === newService.trim())) {
      return false;
    }

    const newOption = {
      label: newService.trim(),
      value: newService.trim()
    };

    setTariffOptions(prev => [...prev, newOption].sort((a, b) => a.label.localeCompare(b.label)));
    return true;
  };

  return {
    tariffOptions,
    loading,
    error,
    refreshTariffData: fetchTariffData,
    addNewTariff
  };
}; 