
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Define proper TypeScript interfaces
interface Patient {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  blood_group?: string;
  allergies?: string;
  medical_history?: string;
  current_medications?: string;
  insurance_provider?: string;
  policy_number?: string;
  group_code?: string;
  relationship_with_employee?: string;
  employee_name?: string;
  employee_id?: string;
  employee_department?: string;
  employee_designation?: string;
  employee_phone?: string;
  employee_email?: string;
  employee_address?: string;
  employee_blood_group?: string;
  employee_allergies?: string;
  employee_medical_history?: string;
  employee_current_medications?: string;
  employee_insurance_provider?: string;
  employee_policy_number?: string;
  employee_group_code?: string;
  employee_relationship_with_patient?: string;
  created_at?: string;
  updated_at?: string;
}

interface AddPatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded?: (patient: Patient) => void;
}

export const AddPatientDialog: React.FC<AddPatientDialogProps> = ({
  isOpen,
  onClose,
  onPatientAdded
}) => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // For now, just close the dialog and notify
      toast({
        title: "Success",
        description: "Patient details added successfully!",
      });

      if (onPatientAdded) {
        onPatientAdded(selectedPatient);
      }
      
      onClose();

    } catch (error) {
      console.error("Error during form submission:", error);
      toast({
        title: "Error",
        description: "Failed to add patient details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
           <DialogTitle>Add Patient Details</DialogTitle> 
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center py-8">
            <p className="text-gray-600">
              Patient dialog functionality is being updated. Please use the main patient registration form.
            </p>
            <Button 
              onClick={onClose}
              className="mt-4"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
