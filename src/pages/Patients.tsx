
// @ts-nocheck

import { useState } from 'react';
import { usePatients } from '@/hooks/usePatients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users } from 'lucide-react';
import { AddPatientDialog } from '@/components/AddPatientDialog';

const Patients = () => {
  const { patients, diagnoses, isLoading, addPatient } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Flatten patients from all diagnoses for the table view
  const allPatients = Object.entries(patients).flatMap(([diagnosis, patientList]) =>
    Array.isArray(patientList) ? patientList.map(patient => ({ ...patient, diagnosis })) : []
  );

  const filteredPatients = allPatients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.primary_diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.surgeon?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.consultant?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const diagnosisNames = diagnoses.map(d => d.name);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading patients...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary">
              Patients Master List
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            View and manage all patient records
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </div>

        <div className="grid gap-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xl">{patient.name}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline">{patient.diagnosis}</Badge>
                    <Badge variant="secondary">{patient.primary_diagnosis}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  {patient.surgeon && (
                    <div>
                      <span className="font-semibold">Surgeon:</span> {patient.surgeon}
                    </div>
                  )}
                  {patient.consultant && (
                    <div>
                      <span className="font-semibold">Consultant:</span> {patient.consultant}
                    </div>
                  )}
                  {patient.admission_date && (
                    <div>
                      <span className="font-semibold">Admission:</span> {new Date(patient.admission_date).toLocaleDateString()}
                    </div>
                  )}
                  {patient.surgery_date && (
                    <div>
                      <span className="font-semibold">Surgery:</span> {new Date(patient.surgery_date).toLocaleDateString()}
                    </div>
                  )}
                  {patient.discharge_date && (
                    <div>
                      <span className="font-semibold">Discharge:</span> {new Date(patient.discharge_date).toLocaleDateString()}
                    </div>
                  )}
                  {patient.complications && patient.complications !== 'None' && (
                    <div className="col-span-full">
                      <span className="font-semibold">Complications:</span> {patient.complications}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              {searchTerm ? 'No patients found matching your search.' : 'No patients available.'}
            </p>
          </div>
        )}

        <AddPatientDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAddPatient={(diagnosis: string, patient: any) => 
            addPatient({ diagnosisName: diagnosis, patient })
          }
          diagnoses={diagnosisNames}
        />
      </div>
    </div>
  );
};

export default Patients;
