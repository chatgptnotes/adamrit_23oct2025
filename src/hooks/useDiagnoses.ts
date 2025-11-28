
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Diagnosis } from '@/types/patient';

export const useDiagnoses = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: diagnoses = [], isLoading: diagnosesLoading } = useQuery({
    queryKey: ['diagnoses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnoses')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching diagnoses:', error);
        throw error;
      }
      
      return data as Diagnosis[];
    }
  });

  const addDiagnosisMutation = useMutation({
    mutationFn: async (params: { name: string, description?: string }) => {
      console.log('Adding diagnosis with params:', params);
      const { data, error } = await supabase
        .from('diagnoses')
        .insert({ 
          name: params.name, 
          description: params.description || null 
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding diagnosis:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnoses'] });
      toast({
        title: "Success",
        description: "Diagnosis category added successfully",
      });
    },
    onError: (error) => {
      console.error('Add diagnosis error:', error);
      toast({
        title: "Error",
        description: "Failed to add diagnosis category",
        variant: "destructive"
      });
    }
  });

  return {
    diagnoses,
    isLoading: diagnosesLoading,
    addDiagnosis: addDiagnosisMutation.mutate,
    isAddingDiagnosis: addDiagnosisMutation.isPending
  };
};
