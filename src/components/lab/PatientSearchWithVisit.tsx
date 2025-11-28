
import React, { useState } from 'react';
import { Search, User, Calendar, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Patient {
  id: string;
  name: string;
  patients_id: string;
  age?: number;
  gender?: string;
  phone?: string;
}

interface Visit {
  id: string;
  visit_id: string;
  visit_date: string;
  visit_type: string;
  status: string;
  appointment_with: string;
  reason_for_visit: string;
}

interface PatientWithVisits extends Patient {
  visits: Visit[];
}

interface PatientSearchWithVisitProps {
  onPatientSelect?: (patient: Patient, visit?: Visit) => void;
  allowVisitSelection?: boolean;
}

const PatientSearchWithVisit: React.FC<PatientSearchWithVisitProps> = ({
  onPatientSelect,
  allowVisitSelection = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patient-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,patients_id.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(10);

      if (patientsError) {
        console.error('Error fetching patients:', patientsError);
        return [];
      }

      if (!patientsData) return [];

      // Fetch visits for each patient
      const patientsWithVisits: PatientWithVisits[] = await Promise.all(
        patientsData.map(async (patient) => {
          const { data: visitsData, error: visitsError } = await supabase
            .from('visits')
            .select('*')
            .eq('patient_id', patient.id)
            .order('visit_date', { ascending: false })
            .limit(5);

          if (visitsError) {
            console.error('Error fetching visits for patient:', patient.id, visitsError);
            return { ...patient, visits: [] };
          }

          return { ...patient, visits: visitsData || [] };
        })
      );

      return patientsWithVisits;
    },
    enabled: searchTerm.length >= 2
  });

  const handlePatientSelect = (patient: Patient, visit?: Visit) => {
    setSelectedPatient(patient);
    if (onPatientSelect) {
      onPatientSelect(patient, visit);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search patients by name, ID, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading && searchTerm.length >= 2 && (
        <div className="text-center py-4">
          <p className="text-muted-foreground">Searching patients...</p>
        </div>
      )}

      <div className="space-y-3">
        {patients.map((patientData) => {
          if (!patientData) return null;
          
          return (
            <Card key={patientData.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{patientData.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        ID: {patientData.patients_id} • Age: {patientData.age || 'N/A'} • Gender: {patientData.gender || 'N/A'}
                      </p>
                      {patientData.phone && (
                        <p className="text-sm text-muted-foreground">Phone: {patientData.phone}</p>
                      )}
                    </div>
                  </div>
                  {!allowVisitSelection && (
                    <Button 
                      size="sm" 
                      onClick={() => handlePatientSelect(patientData)}
                    >
                      Select Patient
                    </Button>
                  )}
                </div>
              </CardHeader>

              {allowVisitSelection && (
                <CardContent>
                  {patientData.visits && patientData.visits.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Recent Visits
                      </h4>
                      <div className="space-y-2">
                        {patientData.visits.map((visit) => (
                          <div 
                            key={visit.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{visit.visit_id}</Badge>
                                <Badge variant={visit.status === 'completed' ? 'default' : 'secondary'}>
                                  {visit.status}
                                </Badge>
                              </div>
                              <p className="text-sm">
                                <span className="font-medium">Date:</span> {new Date(visit.visit_date).toLocaleDateString()}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Type:</span> {visit.visit_type}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Doctor:</span> {visit.appointment_with}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {visit.reason_for_visit}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handlePatientSelect(patientData, visit)}
                            >
                              Select Visit
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No visits found for this patient</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => handlePatientSelect(patientData)}
                      >
                        Select Patient Only
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {searchTerm.length >= 2 && patients.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">No patients found</h3>
          <p className="text-sm text-muted-foreground">
            Try searching with a different name, ID, or phone number
          </p>
        </div>
      )}

      {searchTerm.length < 2 && (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">Search for patients</h3>
          <p className="text-sm text-muted-foreground">
            Enter at least 2 characters to search for patients
          </p>
        </div>
      )}
    </div>
  );
};

export default PatientSearchWithVisit;
