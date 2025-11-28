
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface PatientHeaderProps {
  patient: any;
  patientId: string | null;
  calculateAge: (admissionDate: string) => string;
  visits: any[];
}

const PatientHeader = ({ patient, patientId, calculateAge, visits }: PatientHeaderProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const visitId = searchParams.get('visit');
  
  // Debug logging to see what we have
  console.log('Patient data in header:', patient);
  console.log('Patient ID from URL:', patientId);
  console.log('Visit ID from URL:', visitId);
  console.log('Patient patients_id field:', patient?.patients_id);
  console.log('Patient object keys:', patient ? Object.keys(patient) : 'No patient');
  
  // Determine what to display for UID - only show patients_id
  const displayPatientId = patient?.patients_id || 'Not assigned';
  
  console.log('Final displayPatientId:', displayPatientId);
  
  // Get current visit data for Bunch No. and Sr. no
  const getCurrentVisit = () => {
    if (visitId && visits.length > 0) {
      return visits.find(visit => visit.visit_id === visitId) || visits[0];
    }
    return visits.length > 0 ? visits[0] : null;
  };

  const currentVisit = getCurrentVisit();
  
  // Format age and gender display
  const getAgeGenderDisplay = () => {
    const age = patient?.age ? `${patient.age} years` : 'Unknown';
    const gender = patient?.gender || 'Unknown';
    return `${age}, ${gender}`;
  };
  
  return (
    <div className="flex items-center gap-4 no-print">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="h-10 w-10 p-0"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-2xl font-bold text-blue-600">
            {patient?.name?.charAt(0)?.toUpperCase() || 'P'}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              IPD - {patient?.name || 'Unknown Patient'}
              {visitId && (
                <span className="text-base font-medium text-blue-600 ml-3 bg-blue-50 px-2 py-1 rounded">
                  Visit ID: {visitId}
                </span>
              )}
            </h1>
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          </div>
          <p className="text-muted-foreground">
            UID: {displayPatientId} | Visit ID: {currentVisit?.visit_id || 'Not assigned'}
          </p>
          <div className="flex items-center gap-6 mt-2">
            <div className="bg-blue-50 px-3 py-1 rounded">
              <span className="text-sm font-semibold text-blue-800">Sr No:</span>
              <span className="ml-2 text-sm text-blue-700">{currentVisit?.sr_no || 'Not assigned'}</span>
            </div>
            <div className="bg-green-50 px-3 py-1 rounded">
              <span className="text-sm font-semibold text-green-800">Bunch No:</span>
              <span className="ml-2 text-sm text-green-700">{currentVisit?.bunch_no || 'Not assigned'}</span>
            </div>
          </div>
          <p className="text-muted-foreground">
            {getAgeGenderDisplay()}
          </p>
          {patient?.phone && (
            <p className="text-sm text-muted-foreground">
              Phone: {patient.phone}
            </p>
          )}
          {patient?.date_of_birth && (
            <p className="text-sm text-muted-foreground">
              DOB: {new Date(patient.date_of_birth).toLocaleDateString('en-GB')}
            </p>
          )}
          {patient?.insurance_person_no && (
            <p className="text-sm text-muted-foreground">
              Insurance No: {patient.insurance_person_no}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientHeader;
