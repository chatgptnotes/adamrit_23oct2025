
import React from 'react';
import { Button } from '@/components/ui/button';

interface FormActionsProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({
  formData,
  onInputChange,
  isSubmitting,
  onCancel
}) => {
  return (
    <>
      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save And Next'}
        </Button>
      </div>
    </>
  );
};
