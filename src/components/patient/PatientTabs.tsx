
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InvestigationsTab from './tabs/InvestigationsTab';
import MedicationsTab from './tabs/MedicationsTab';
import FinalBillTab from './tabs/FinalBillTab';
import { EditableFinalBillTab } from './tabs/EditableFinalBillTab';

interface PatientTabsProps {
  patient: any;
  visitId?: string;
}

const PatientTabs = ({ patient, visitId }: PatientTabsProps) => {
  return (
    <Tabs defaultValue="investigations" className="space-y-4 no-print">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="investigations">Investigations</TabsTrigger>
        <TabsTrigger value="medications">Medications</TabsTrigger>
        <TabsTrigger value="billing">View Bill</TabsTrigger>
        <TabsTrigger value="edit-billing">Edit Bill</TabsTrigger>
      </TabsList>

      <TabsContent value="investigations" className="space-y-4">
        <InvestigationsTab patient={patient} visitId={visitId} />
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
