
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

  const confirmDeactivatePatient = async () => {
    if (!patient) return;

    try {
      const { error } = await supabase
        .from('patients')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', patient.id);

      if (error) {
        console.error('Error deactivating patient:', error);
        toast({
          title: "Error",
          description: "Failed to deactivate patient",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `Patient "${patient.name}" has been marked as inactive`,
      });

      onPatientDeleted();
    } catch (error) {
      console.error('Error deactivating patient:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate patient",
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
          <AlertDialogTitle>Mark Patient as Inactive?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark patient "{patient?.name}" as inactive. The patient record
            and all associated data (visits, bills, lab tests, medications) will be
            preserved for audit purposes but the patient will no longer appear in
            active lists.
            <br /><br />
            <strong>Note:</strong> Patient registrations cannot be deleted to maintain
            a complete audit trail.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDeactivatePatient}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Mark Inactive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
