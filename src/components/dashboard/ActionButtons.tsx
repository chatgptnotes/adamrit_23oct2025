
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';

interface ActionButtonsProps {
  onNewPatientClick: () => void;
  onPatientLookupClick: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onNewPatientClick,
  onPatientLookupClick
}) => {
  return (
    <div className="flex gap-4 mb-6">
      <Button 
        onClick={onNewPatientClick}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Plus className="h-4 w-4 mr-2" />
        Register New Patient
      </Button>
      
      <Button 
        onClick={onPatientLookupClick}
        variant="outline"
        className="border-primary text-primary hover:bg-primary/10 animate-pulse"
      >
        <Search className="h-4 w-4 mr-2" />
        Patient Lookup
      </Button>
    </div>
  );
};
