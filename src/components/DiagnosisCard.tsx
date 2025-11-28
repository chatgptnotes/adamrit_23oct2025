
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { PatientCard } from '@/components/PatientCard';
import { useState } from 'react';
import { diagnosisComplications } from '@/components/AddPatientDialog/diagnosisComplications';

interface Patient {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface DiagnosisCardProps {
  diagnosis: string;
  patients: Patient[];
  onAddPatient: () => void;
  onEditPatient: (patientId: string, updatedPatient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
  isUpdatingPatient: boolean;
  isDeletingPatient: boolean;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export const DiagnosisCard: React.FC<DiagnosisCardProps> = ({
  diagnosis,
  patients,
  onAddPatient,
  onEditPatient,
  onDeletePatient,
  isUpdatingPatient,
  isDeletingPatient,
  isExpanded = true,
  onToggleExpanded
}) => {
  const [showComplications, setShowComplications] = useState(false);

  // Get complications for this diagnosis
  const complications = diagnosisComplications[diagnosis] || [];

  const handleToggleExpanded = () => {
    if (onToggleExpanded) {
      onToggleExpanded();
    }
  };

  // Format category title for better display
  const formatSurgeryTitle = (title: string) => {
    // Check if any patient in this category is a sample model
    const sampleModelPatients = patients.filter(patient =>
      patient.name === 'ROSHANI BHISIKAR' ||
      patient.name === 'Deepak Paripagar' ||
      patient.name === 'Pawan Kurvekar' ||
      patient.name === 'Meet Bais' ||
      patient.name === 'Pratik Rakhunde' ||
      patient.name === 'Yugansh Masram' ||
      patient.name === 'MS.ASHWINI SHANKAR WAGHADE'
    );

    if (sampleModelPatients.length > 0) {
      const patientNames = sampleModelPatients.map(p => p.name).join(', ');
      return (
        <span className="font-bold text-blue-700">
          {title} <span className="text-red-500 font-normal">({patientNames}) sample model</span>
        </span>
      );
    }

    return <span className="font-bold text-blue-700">{title}</span>;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={handleToggleExpanded}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-xl text-primary">{formatSurgeryTitle(diagnosis)}</CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {patients.length} patients
            </Badge>
            {complications.length > 0 && (
              <Badge 
                variant="outline" 
                className="bg-orange-50 text-orange-700 border-orange-200 cursor-pointer hover:bg-orange-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowComplications(!showComplications);
                }}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {complications.length} complications
              </Badge>
            )}
          </div>
          {isExpanded ? 
            <ChevronUp className="h-5 w-5 text-muted-foreground" /> : 
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          }
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          
          {/* Complications Section */}
          {showComplications && complications.length > 0 && (
            <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Common Complications for {diagnosis}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {complications.map((complication, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-orange-700">
                    <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0"></div>
                    {complication}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {patients.map((patient) => (
              <PatientCard 
                key={patient.id} 
                patient={patient}
                onEdit={(updatedPatient) => onEditPatient(patient.id, updatedPatient)}
                onDelete={() => onDeletePatient(patient.id)}
              />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onAddPatient}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Patient to {diagnosis}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
