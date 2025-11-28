import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/types/supabase';

type VisitLab = Database['public']['Tables']['visit_labs']['Insert'];
type VisitRadiology = Database['public']['Tables']['visit_radiology']['Insert'];
type VisitMedication = Database['public']['Tables']['visit_medications']['Insert'];

interface MedicalData {
  labs: Array<{ lab_id: string }>;
  radiology: Array<{ radiology_id: string }>;
  medications: Array<{ medication_id: string }>;
}

interface UpdateMedicalDataParams {
  visitId: string;
  medicalData: MedicalData;
}

export const useMedicalDataTransaction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ visitId, medicalData }: UpdateMedicalDataParams) => {
      try {
        // Start transaction
        const { error: beginError } = await supabase.rpc('begin_transaction');
        if (beginError) throw beginError;

        // Delete existing records
        const { error: deleteLabsError } = await supabase
          .from('visit_labs')
          .delete()
          .eq('visit_id', visitId);
        if (deleteLabsError) throw deleteLabsError;

        const { error: deleteRadiologyError } = await supabase
          .from('visit_radiology')
          .delete()
          .eq('visit_id', visitId);
        if (deleteRadiologyError) throw deleteRadiologyError;

        const { error: deleteMedicationsError } = await supabase
          .from('visit_medications')
          .delete()
          .eq('visit_id', visitId);
        if (deleteMedicationsError) throw deleteMedicationsError;

        // Insert new records
        if (medicalData.labs.length > 0) {
          const labEntries: VisitLab[] = medicalData.labs.map(lab => ({
            visit_id: visitId,
            lab_id: lab.lab_id,
            status: 'ordered',
            ordered_date: new Date().toISOString()
          }));

          const { error: insertLabsError } = await supabase
            .from('visit_labs')
            .insert(labEntries);
          if (insertLabsError) throw insertLabsError;
        }

        if (medicalData.radiology.length > 0) {
          const radiologyEntries: VisitRadiology[] = medicalData.radiology.map(rad => ({
            visit_id: visitId,
            radiology_id: rad.radiology_id,
            status: 'ordered',
            ordered_date: new Date().toISOString()
          }));

          const { error: insertRadiologyError } = await supabase
            .from('visit_radiology')
            .insert(radiologyEntries);
          if (insertRadiologyError) throw insertRadiologyError;
        }

        if (medicalData.medications.length > 0) {
          const medicationEntries: VisitMedication[] = medicalData.medications.map(med => ({
            visit_id: visitId,
            medication_id: med.medication_id,
            status: 'prescribed',
            prescribed_date: new Date().toISOString()
          }));

          const { error: insertMedicationsError } = await supabase
            .from('visit_medications')
            .insert(medicationEntries);
          if (insertMedicationsError) throw insertMedicationsError;
        }

        // Commit transaction
        const { error: commitError } = await supabase.rpc('commit_transaction');
        if (commitError) throw commitError;

        return { success: true };
      } catch (error) {
        // Rollback transaction on error
        await supabase.rpc('rollback_transaction');
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['visit'] });
      queryClient.invalidateQueries({ queryKey: ['medicalData'] });
      
      toast({
        title: "Success",
        description: "Medical data updated successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Error updating medical data:', error);
      toast({
        title: "Error",
        description: "Failed to update medical data. Please try again.",
        variant: "destructive"
      });
    }
  });
}; 