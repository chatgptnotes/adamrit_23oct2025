
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PatientSearchForm } from './PatientSearchForm';
import { PatientSearchResults } from './PatientSearchResults';
import { NoResultsSection } from './NoResultsSection';
import { PatientRegistrationForm } from '@/components/PatientRegistrationForm';
import { PatientLookupProps, Patient } from './types/patientLookup';
import { usePatientLookup } from '@/hooks/usePatientLookup';

export const PatientLookupDialog: React.FC<PatientLookupProps> = ({
  isOpen,
  onClose,
  onPatientSelected,
  onNewPatientRegistration
}) => {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const { toast } = useToast();

  // Shared search logic — same query path as the tablet patient picker.
  const {
    criteria,
    setCriteria,
    patients,
    isLoading,
    hasCriteria,
    showNoResults,
    search,
  } = usePatientLookup();

  const handleSearch = () => {
    if (!hasCriteria) {
      toast({
        title: "Search Required",
        description: "Please enter at least one search criteria",
        variant: "destructive"
      });
      return;
    }
    search();
  };

  const handlePatientSelect = (patient: Patient) => {
    if (onPatientSelected) {
      // Pass patient with proper ID structure
      const patientWithProperIds = {
        ...patient,
        id: patient.id, // Keep UUID for internal references
        patients_id: patient.patients_id // Use text ID for display
      };
      onPatientSelected(patientWithProperIds);
    }
    toast({
      title: "Patient Selected",
      description: `Selected patient: ${patient.name} (${patient.patients_id})`,
    });
    onClose();
  };

  const handleNewPatientRegistration = () => {
    setShowRegistrationForm(true);
  };

  const handleRegistrationClose = () => {
    setShowRegistrationForm(false);
    onClose();
    if (onNewPatientRegistration) {
      onNewPatientRegistration();
    }
    toast({
      title: "Registration Complete",
      description: "New patient has been registered successfully",
    });
  };

  if (showRegistrationForm) {
    return (
      <PatientRegistrationForm
        isOpen={true}
        onClose={handleRegistrationClose}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Patient Lookup - Check Previous Registration
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Search for existing patients by mobile number, name, or patient ID to avoid duplicate registrations
          </p>
        </DialogHeader>

        <div className="space-y-6">
          <PatientSearchForm
            searchCriteria={criteria}
            onSearchChange={setCriteria}
            onSearch={handleSearch}
            isLoading={isLoading}
          />

          <PatientSearchResults
            patients={patients}
            onPatientSelect={handlePatientSelect}
          />

          {showNoResults && (
            <NoResultsSection
              searchCriteria={criteria}
              onNewPatientRegistration={handleNewPatientRegistration}
            />
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
