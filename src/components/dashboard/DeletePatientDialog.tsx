
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeletePatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient: { id: string; name: string } | null;
  onPatientDeleted: () => void;
}

export const DeletePatientDialog = ({ 
  isOpen, 
  onClose, 
  patient, 
  onPatientDeleted 
}: DeletePatientDialogProps) => {
  const { toast } = useToast();

  const confirmDeletePatient = async () => {
    if (!patient) return;

    try {
      // First, delete all related bills
      const { error: billsError } = await supabase
        .from('bills')
        .delete()
        .eq('patient_id', patient.id);

      if (billsError) {
        console.error('Error deleting patient bills:', billsError);
        toast({
          title: "Error",
          description: "Failed to delete patient bills",
          variant: "destructive"
        });
        return;
      }

      // Then delete all related visits and their associated data
      const { error: visitsError } = await supabase
        .from('visits')
        .delete()
        .eq('patient_id', patient.id);

      if (visitsError) {
        console.error('Error deleting patient visits:', visitsError);
        toast({
          title: "Error",
          description: "Failed to delete patient visits",
          variant: "destructive"
        });
        return;
      }

      // Finally, delete the patient
      const { error: patientError } = await supabase
        .from('patients')
        .delete()
        .eq('id', patient.id);

      if (patientError) {
        console.error('Error deleting patient:', patientError);
        toast({
          title: "Error",
          description: "Failed to delete patient",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Patient and all related data deleted successfully",
      });

      onPatientDeleted();
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive"
      });
    } finally {
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the patient
            "{patient?.name}" and all associated data including:
            <br />• All visits and medical records
            <br />• All bills and financial data
            <br />• All lab tests, radiology, and medications
            <br />• All diagnoses and treatment history
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDeletePatient}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
