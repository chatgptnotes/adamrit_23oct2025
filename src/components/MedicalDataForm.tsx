import { useState } from 'react';
import { useMedicalData } from '@/hooks/useMedicalData';
import { useMedicalDataTransaction } from '@/hooks/useMedicalDataTransaction';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface MedicalDataFormProps {
  visitId: string;
  initialData?: {
    labs: Array<{ lab_id: string }>;
    radiology: Array<{ radiology_id: string }>;
    medications: Array<{ medication_id: string }>;
  };
}

export const MedicalDataForm = ({ visitId, initialData }: MedicalDataFormProps) => {
  const { labs, radiology, medications, isLoading, error } = useMedicalData();
  const { mutate: updateMedicalData, isPending } = useMedicalDataTransaction();
  const { toast } = useToast();

  const [selectedLabs, setSelectedLabs] = useState<Array<{ lab_id: string }>>(
    initialData?.labs || []
  );
  const [selectedRadiology, setSelectedRadiology] = useState<Array<{ radiology_id: string }>>(
    initialData?.radiology || []
  );
  const [selectedMedications, setSelectedMedications] = useState<Array<{ medication_id: string }>>(
    initialData?.medications || []
  );

  if (isLoading) {
    return <div>Loading medical data...</div>;
  }

  if (error) {
    return <div>Error loading medical data: {error.message}</div>;
  }

  const handleLabChange = (labId: string, checked: boolean) => {
    if (checked) {
      setSelectedLabs([...selectedLabs, { lab_id: labId }]);
    } else {
      setSelectedLabs(selectedLabs.filter(lab => lab.lab_id !== labId));
    }
  };

  const handleRadiologyChange = (radiologyId: string, checked: boolean) => {
    if (checked) {
      setSelectedRadiology([...selectedRadiology, { radiology_id: radiologyId }]);
    } else {
      setSelectedRadiology(selectedRadiology.filter(rad => rad.radiology_id !== radiologyId));
    }
  };

  const handleMedicationChange = (medicationId: string, checked: boolean) => {
    if (checked) {
      setSelectedMedications([...selectedMedications, { medication_id: medicationId }]);
    } else {
      setSelectedMedications(selectedMedications.filter(med => med.medication_id !== medicationId));
    }
  };

  const handleSubmit = () => {
    updateMedicalData(
      {
        visitId,
        medicalData: {
          labs: selectedLabs,
          radiology: selectedRadiology,
          medications: selectedMedications
        }
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Medical data updated successfully"
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "Failed to update medical data. Please try again.",
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="labs">
        <TabsList>
          <TabsTrigger value="labs">Labs</TabsTrigger>
          <TabsTrigger value="radiology">Radiology</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
        </TabsList>

        <TabsContent value="labs" className="space-y-4">
          {(labs as any[]).map((lab: any) => (
            <div key={lab.id} className="flex items-center space-x-2">
              <Checkbox
                id={`lab-${lab.id}`}
                checked={selectedLabs.some(l => l.lab_id === lab.id)}
                onCheckedChange={(checked) => handleLabChange(lab.id, checked as boolean)}
              />
              <Label htmlFor={`lab-${lab.id}`}>{lab.name}</Label>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="radiology" className="space-y-4">
          {(radiology as any[]).map((rad: any) => (
            <div key={rad.id} className="flex items-center space-x-2">
              <Checkbox
                id={`radiology-${rad.id}`}
                checked={selectedRadiology.some(r => r.radiology_id === rad.id)}
                onCheckedChange={(checked) => handleRadiologyChange(rad.id, checked as boolean)}
              />
              <Label htmlFor={`radiology-${rad.id}`}>{rad.name}</Label>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="medications" className="space-y-4">
          {(medications as any[]).map((med: any) => (
            <div key={med.id} className="flex items-center space-x-2">
              <Checkbox
                id={`medication-${med.id}`}
                checked={selectedMedications.some(m => m.medication_id === med.id)}
                onCheckedChange={(checked) => handleMedicationChange(med.id, checked as boolean)}
              />
              <Label htmlFor={`medication-${med.id}`}>{med.name}</Label>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <Button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full"
      >
        {isPending ? 'Saving...' : 'Save Medical Data'}
      </Button>
    </div>
  );
}; 