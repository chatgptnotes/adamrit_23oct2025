
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface DischargeInfoProps {
  patient: any;
  formatDate: (dateString: string) => string;
}

const DischargeInfo = ({ patient, formatDate }: DischargeInfoProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-red-600" />
            <span className="text-sm text-muted-foreground">Discharge</span>
          </div>
          <p className="font-medium">
            {patient?.discharge_date ? formatDate(patient.discharge_date) : 'Not discharged'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DischargeInfo;
