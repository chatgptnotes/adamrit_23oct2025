
import React from 'react';
import { Button } from '@/components/ui/button';
import { Patient } from './types';

interface FormActionsProps {
  selectedPatient: Patient | null;
  diagnosis: string;
  isCreating: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({
  selectedPatient,
  diagnosis,
  isCreating,
  onCancel,
  onSubmit
}) => {
  return (
    <div className="flex justify-end gap-2 pt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button 
        type="button"
        onClick={onSubmit}
        disabled={!selectedPatient || !diagnosis || isCreating}
      >
        {isCreating ? 'Saving...' : 'Add Patient Bill Details'}
      </Button>
    </div>
  );
};
