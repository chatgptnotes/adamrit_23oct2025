
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Plus } from 'lucide-react';
import { SearchCriteria } from './types/patientLookup';

interface NoResultsSectionProps {
  searchCriteria: SearchCriteria;
  onNewPatientRegistration?: () => void;
}

export const NoResultsSection: React.FC<NoResultsSectionProps> = ({
  searchCriteria,
  onNewPatientRegistration
}) => {
  return (
    <Card className="border-dashed">
      <CardContent className="text-center py-8">
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-orange-600">No Existing Patient Found</h3>
          <p className="text-muted-foreground">
            This appears to be a new patient. You can proceed with new patient registration.
          </p>
          <div className="text-sm text-muted-foreground bg-orange-50 p-3 rounded-lg">
            <strong>Searched for:</strong>
            {searchCriteria.mobile && <span className="block">Mobile: {searchCriteria.mobile}</span>}
            {searchCriteria.name && <span className="block">Name: {searchCriteria.name}</span>}
            {searchCriteria.patientId && <span className="block">Patient ID: {searchCriteria.patientId}</span>}
          </div>
          {onNewPatientRegistration && (
            <Button 
              onClick={onNewPatientRegistration}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Register New Patient
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
