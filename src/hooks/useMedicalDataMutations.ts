import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useMedicalDataMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addLabsMutation = useMutation({
    mutationFn: async ({ visitId, labIds }: { visitId: string; labIds: string[] }) => {
      const labEntries = labIds.map(labId => ({
        visit_id: visitId,
        lab_id: labId,
        status: 'ordered',
        ordered_date: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('visit_labs')
        .insert(labEntries)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { visitId }) => {
      queryClient.invalidateQueries({ queryKey: ['visit-labs-custom', visitId] });
      toast({
        title: "Success",
        description: "Lab tests added successfully",
      });
    },
    onError: (error) => {
      console.error('Error adding labs:', error);
      toast({
        title: "Error",
        description: "Failed to add lab tests",
        variant: "destructive"
      });
    }
  });

  const addRadiologyMutation = useMutation({
    mutationFn: async ({ visitId, radiologyIds }: { visitId: string; radiologyIds: string[] }) => {
      const radiologyEntries = radiologyIds.map(radiologyId => ({
        visit_id: visitId,
        radiology_id: radiologyId,
        status: 'ordered',
        ordered_date: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('visit_radiology')
        .insert(radiologyEntries)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { visitId }) => {
      queryClient.invalidateQueries({ queryKey: ['visit-radiology-custom', visitId] });
      toast({
        title: "Success",
        description: "Radiology studies added successfully",
      });
    },
    onError: (error) => {
      console.error('Error adding radiology:', error);
      toast({
        title: "Error",
        description: "Failed to add radiology studies",
        variant: "destructive"
      });
    }
  });

  const addMedicationsMutation = useMutation({
    mutationFn: async ({ 
      visitId, 
      medications 
    }: { 
      visitId: string; 
      medications: Array<{
        medication_id: string;
        medication_type: string;
        dosage?: string;
        frequency?: string;
        duration?: string;
        route?: string;
      }>;
    }) => {
      const medicationEntries = medications.map(med => ({
        visit_id: visitId,
        ...med,
        status: 'prescribed',
        prescribed_date: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('visit_medications')
        .insert(medicationEntries)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { visitId }) => {
      queryClient.invalidateQueries({ queryKey: ['visit-medications-custom', visitId] });
      toast({
        title: "Success",
        description: "Medications added successfully",
      });
    },
    onError: (error) => {
      console.error('Error adding medications:', error);
      toast({
        title: "Error",
        description: "Failed to add medications",
        variant: "destructive"
      });
    }
  });

  const updateLabStatusMutation = useMutation({
    mutationFn: async ({ 
      visitLabId, 
      status, 
      resultValue, 
      normalRange, 
      notes 
    }: {
      visitLabId: string;
      status: string;
      resultValue?: string;
      normalRange?: string;
      notes?: string;
    }) => {
      const updateData: any = { status };
      
      if (status === 'collected') {
        updateData.collected_date = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_date = new Date().toISOString();
        if (resultValue) updateData.result_value = resultValue;
        if (normalRange) updateData.normal_range = normalRange;
        if (notes) updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('visit_labs')
        .update(updateData)
        .eq('id', visitLabId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-labs-custom'] });
      toast({
        title: "Success",
        description: "Lab status updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating lab status:', error);
      toast({
        title: "Error",
        description: "Failed to update lab status",
        variant: "destructive"
      });
    }
  });

  const updateRadiologyStatusMutation = useMutation({
    mutationFn: async ({ 
      visitRadiologyId, 
      status, 
      findings, 
      impression, 
      notes 
    }: {
      visitRadiologyId: string;
      status: string;
      findings?: string;
      impression?: string;
      notes?: string;
    }) => {
      const updateData: any = { status };
      
      if (status === 'scheduled') {
        updateData.scheduled_date = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_date = new Date().toISOString();
        if (findings) updateData.findings = findings;
        if (impression) updateData.impression = impression;
        if (notes) updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('visit_radiology')
        .update(updateData)
        .eq('id', visitRadiologyId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-radiology-custom'] });
      toast({
        title: "Success",
        description: "Radiology status updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating radiology status:', error);
      toast({
        title: "Error",
        description: "Failed to update radiology status",
        variant: "destructive"
      });
    }
  });

  return {
    addLabs: addLabsMutation.mutate,
    addRadiology: addRadiologyMutation.mutate,
    addMedications: addMedicationsMutation.mutate,
    updateLabStatus: updateLabStatusMutation.mutate,
    updateRadiologyStatus: updateRadiologyStatusMutation.mutate,
    isAddingLabs: addLabsMutation.isPending,
    isAddingRadiology: addRadiologyMutation.isPending,
    isAddingMedications: addMedicationsMutation.isPending,
  };
};