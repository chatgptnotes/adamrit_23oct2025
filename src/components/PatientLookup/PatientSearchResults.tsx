
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Patient } from './types/patientLookup';

interface PatientSearchResultsProps {
  patients: Patient[];
  onPatientSelect: (patient: Patient) => void;
  generateMockMobile: (patientId: string) => string;
}

export const PatientSearchResults: React.FC<PatientSearchResultsProps> = ({
  patients,
  onPatientSelect,
  generateMockMobile
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatPatientId = (patient: Patient) => {
    return patient.patients_id || 'Not assigned';
  };

  if (patients.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-green-600">
          Found {patients.length} Existing Patient{patients.length > 1 ? 's' : ''}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          These patients are already registered. Select one to proceed with visit registration.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {patients.map((patient) => (
            <div key={patient.patients_id || patient.id} className="border rounded-lg p-4 hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{patient.name}</h3>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {formatPatientId(patient)}
                    </Badge>
                    <Badge variant="secondary">
                      Registered
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Mobile:</span> {generateMockMobile(patient.patients_id || patient.id)}
                    </div>
                    <div>
                      <span className="font-medium">Diagnosis:</span> {patient.primary_diagnosis}
                    </div>
                    <div>
                      <span className="font-medium">Registration:</span> {formatDate(patient.created_at)}
                    </div>
                    <div>
                      <span className="font-medium">Last Admission:</span> {formatDate(patient.admission_date)}
                    </div>
                  </div>

                  {(patient.surgeon || patient.consultant) && (
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {patient.surgeon && (
                        <div>
                          <span className="font-medium">Surgeon:</span> {patient.surgeon}
                        </div>
                      )}
                      {patient.consultant && (
                        <div>
                          <span className="font-medium">Consultant:</span> {patient.consultant}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button 
                  onClick={() => onPatientSelect(patient)}
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                >
                  Select Patient
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
