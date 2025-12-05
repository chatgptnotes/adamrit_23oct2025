
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Patient, Diagnosis } from '@/types/patient';
import { useAuth } from '@/contexts/AuthContext';

export const usePatientOperations = (diagnoses: Diagnosis[]) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hospitalConfig } = useAuth();

  const addPatientMutation = useMutation({
    mutationFn: async ({ diagnosisName, patient }: { diagnosisName: string, patient: Patient }) => {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          patients_id: patient.patients_id || null,
          insurance_person_no: patient.insurance_person_no || null,
          hospital_name: hospitalConfig.name
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding patient:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', hospitalConfig.name] });
      toast({
        title: "Success",
        description: "Patient added successfully",
      });
    },
    onError: (error) => {
      console.error('Add patient error:', error);
      toast({
        title: "Error",
        description: "Failed to add patient",
        variant: "destructive"
      });
    }
  });

  const updatePatientMutation = useMutation({
    mutationFn: async ({ patientId, updatedData }: { patientId: string, updatedData: Partial<Patient> }) => {
      console.log('Updating patient with data:', updatedData);
      
      // Only update core patient identification fields
      // All medical data is now managed via visits and junction tables
      const { data, error } = await supabase
        .from('patients')
        .update({
          name: updatedData.name,
          patients_id: updatedData.patients_id,
          insurance_person_no: updatedData.insurance_person_no || null
          // Removed all medical fields - they are managed in visits/junction tables:
          // - primary_diagnosis, complications, surgery (managed per visit)
          // - surgeon, consultant, hope_surgeon, hope_consultants (junction tables)
          // - admission_date, surgery_date, discharge_date (visits table)
        })
        .eq('id', patientId)
        .select()
        .single();

      if (error) {
        console.error('Error updating patient:', error);
        throw error;
      }

      console.log('Updated patient data:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', hospitalConfig.name] });
      toast({
        title: "Success",
        description: "Patient updated successfully",
      });
    },
    onError: (error) => {
      console.error('Update patient error:', error);
      toast({
        title: "Error",
        description: "Failed to update patient",
        variant: "destructive"
      });
    }
  });

  const deletePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);

      if (error) {
        console.error('Error deleting patient:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', hospitalConfig.name] });
      toast({
        title: "Success",
        description: "Patient deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete patient error:', error);
      toast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive"
      });
    }
  });

  return {
    addPatient: addPatientMutation.mutate,
    updatePatient: updatePatientMutation.mutate,
    deletePatient: deletePatientMutation.mutate,
    isAddingPatient: addPatientMutation.isPending,
    isUpdatingPatient: updatePatientMutation.isPending,
    isDeletingPatient: deletePatientMutation.isPending
  };
};
