
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InvestigationsTab from './tabs/InvestigationsTab';
import MedicationsTab from './tabs/MedicationsTab';
import FinalBillTab from './tabs/FinalBillTab';
import { EditableFinalBillTab } from './tabs/EditableFinalBillTab';
import LabTrendChart from '@/components/lab/LabTrendChart';

interface PatientTabsProps {
  patient: any;
  visitId?: string;
}

const PatientTabs = ({ patient, visitId }: PatientTabsProps) => {
  return (
    <Tabs defaultValue="investigations" className="space-y-4 no-print">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="investigations">Investigations</TabsTrigger>
        <TabsTrigger value="trends">Lab Trends</TabsTrigger>
        <TabsTrigger value="medications">Medications</TabsTrigger>
        <TabsTrigger value="billing">View Bill</TabsTrigger>
        <TabsTrigger value="edit-billing">Edit Bill</TabsTrigger>
      </TabsList>

      <TabsContent value="investigations" className="space-y-4">
        <InvestigationsTab patient={patient} visitId={visitId} />
      </TabsContent>

      <TabsContent value="trends" className="space-y-4">
        {patient?.id
          ? <LabTrendChart patientId={patient.id} />
          : <p className="text-sm text-muted-foreground">No patient selected.</p>
        }
      </TabsContent>

      <TabsContent value="medications" className="space-y-4">
        <MedicationsTab patient={patient} visitId={visitId} />
      </TabsContent>

      <TabsContent value="billing" className="space-y-4">
        <FinalBillTab patient={patient} />
      </TabsContent>

      <TabsContent value="edit-billing" className="space-y-4">
        <EditableFinalBillTab patient={patient} visitId={visitId || ''} />
      </TabsContent>
    </Tabs>
  );
};

export default PatientTabs;
