
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const HistoryContent = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600">Patient History</CardTitle>
          <p className="text-sm text-muted-foreground">Medical history and background information</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Chief Complaint</label>
            <Textarea 
              placeholder="Enter patient's chief complaint..."
              className="min-h-20"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">History of Present Illness</label>
            <Textarea 
              placeholder="Enter history of present illness..."
              className="min-h-24"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Past Medical History</label>
            <Textarea 
              placeholder="Enter past medical history..."
              className="min-h-20"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Family History</label>
            <Textarea 
              placeholder="Enter family history..."
              className="min-h-20"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Social History</label>
            <Textarea 
              placeholder="Enter social history..."
              className="min-h-20"
            />
          </div>
          
          <div className="flex gap-2">
            <Button>Save History</Button>
            <Button variant="outline">Add Template</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600">Previous Visits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Visit - 09/06/2025</span>
                <Badge variant="outline">OPD</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Regular checkup and consultation</p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Visit - 05/06/2025</span>
                <Badge variant="outline">Emergency</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Emergency consultation for abdominal pain</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoryContent;
