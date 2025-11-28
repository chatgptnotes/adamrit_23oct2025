
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ExaminationContent = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600">Vital Signs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">BP (mmHg)</label>
              <Input placeholder="120/80" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Pulse (bpm)</label>
              <Input placeholder="72" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Temp (°C)</label>
              <Input placeholder="37.0" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">RR (/min)</label>
              <Input placeholder="16" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600">Physical Examination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">General Appearance</label>
            <Textarea 
              placeholder="Patient appears well, alert and oriented..."
              className="min-h-20"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Head & Neck</label>
            <Textarea 
              placeholder="Head: normocephalic, atraumatic..."
              className="min-h-20"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Cardiovascular</label>
            <Textarea 
              placeholder="Heart rate regular, no murmurs..."
              className="min-h-20"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Respiratory</label>
            <Textarea 
              placeholder="Lungs clear to auscultation bilaterally..."
              className="min-h-20"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Abdomen</label>
            <Textarea 
              placeholder="Soft, non-tender, non-distended..."
              className="min-h-20"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Neurological</label>
            <Textarea 
              placeholder="Alert and oriented x3, cranial nerves intact..."
              className="min-h-20"
            />
          </div>
          
          <div className="flex gap-2">
            <Button>Save Examination</Button>
            <Button variant="outline">Add Template</Button>
            <Button variant="outline">Print</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600">Assessment & Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Clinical Assessment</label>
            <Textarea 
              placeholder="Based on history and examination findings..."
              className="min-h-20"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Treatment Plan</label>
            <Textarea 
              placeholder="1. Continue current medications\n2. Schedule follow-up\n3. Additional investigations..."
              className="min-h-24"
            />
          </div>
          
          <div className="flex gap-2">
            <Button>Save Assessment</Button>
            <Button variant="outline">Generate Report</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExaminationContent;
