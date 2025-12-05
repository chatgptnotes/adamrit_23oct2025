
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PatientSearchForm } from './PatientSearchForm';
import { PatientSearchResults } from './PatientSearchResults';
import { NoResultsSection } from './NoResultsSection';
import { PatientRegistrationForm } from '@/components/PatientRegistrationForm';
import { PatientLookupProps, Patient, SearchCriteria } from './types/patientLookup';

export const PatientLookupDialog: React.FC<PatientLookupProps> = ({
  isOpen,
  onClose,
  onPatientSelected,
  onNewPatientRegistration
}) => {
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    mobile: '',
    name: '',
    patientId: ''
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const { toast } = useToast();
  const { hospitalConfig } = useAuth();

  // Generate mock mobile number from patient ID for demonstration
  const generateMockMobile = (patientId: string) => {
    const hash = patientId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const phoneBase = Math.abs(hash) % 9000000000 + 1000000000;
    return phoneBase.toString();
  };

  const { data: patients = [], isLoading, refetch } = useQuery({
    queryKey: ['patient-lookup', searchCriteria.mobile, searchCriteria.name, searchCriteria.patientId, hospitalConfig.name],
    queryFn: async () => {
      if (!searchCriteria.mobile && !searchCriteria.name && !searchCriteria.patientId) {
        return [];
      }

      let query = supabase
        .from('patients')
        .select('*')
        .eq('hospital_name', hospitalConfig.name)
        .order('created_at', { ascending: false });

      // Search by name
      if (searchCriteria.name) {
        query = query.ilike('name', `%${searchCriteria.name}%`);
      }

      // Search by patients_id instead of id
      if (searchCriteria.patientId) {
        query = query.or(`patients_id.ilike.%${searchCriteria.patientId}%`);
      }

      const { data, error } = await query.limit(10);

      if (error) {
        console.error('Error searching patients:', error);
        throw error;
      }

      // Filter by mock mobile number if provided
      if (searchCriteria.mobile && data) {
        return data.filter(patient => {
          const mockMobile = generateMockMobile(patient.patients_id || patient.id);
          return mockMobile.includes(searchCriteria.mobile);
        });
      }

      return data || [];
    },
    enabled: false // We'll trigger this manually
  });

  const handleSearch = () => {
    if (!searchCriteria.mobile && !searchCriteria.name && !searchCriteria.patientId) {
      toast({
        title: "Search Required",
        description: "Please enter at least one search criteria",
        variant: "destructive"
      });
      return;
    }
    setHasSearched(true);
    refetch();
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

  const showNoResults = hasSearched && patients.length === 0 && !isLoading && (searchCriteria.mobile || searchCriteria.name || searchCriteria.patientId);

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
            searchCriteria={searchCriteria}
            onSearchChange={setSearchCriteria}
            onSearch={handleSearch}
            isLoading={isLoading}
          />

          <PatientSearchResults
            patients={patients}
            onPatientSelect={handlePatientSelect}
            generateMockMobile={generateMockMobile}
          />

          {showNoResults && (
            <NoResultsSection
              searchCriteria={searchCriteria}
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
