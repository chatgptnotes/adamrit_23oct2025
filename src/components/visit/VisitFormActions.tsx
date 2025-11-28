
import React from 'react';
import { Button } from '@/components/ui/button';

interface VisitFormActionsProps {
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editMode?: boolean;
}

export const VisitFormActions: React.FC<VisitFormActionsProps> = ({
  isSubmitting,
  onCancel,
  onSubmit,
  editMode = false
}) => {
  return (
    <div className="flex justify-end gap-4 pt-6">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? (editMode ? 'Updating...' : 'Registering...')
          : (editMode ? 'Update Visit' : 'Register Visit')}
      </Button>
    </div>
  );
};
