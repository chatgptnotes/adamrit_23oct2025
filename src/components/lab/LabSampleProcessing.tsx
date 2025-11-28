import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  TestTube,
  Search,
  Save,
  FileText,
  Download,
  Calendar,
  User,
  Upload
} from 'lucide-react';

interface PatientSample {
  patientName: string;
  ageSex: string;
  type: string;
  refBy: string;
  sampleId: string;
  testDate: string;
  isAuthenticated: boolean;
}

interface TestInvestigation {
  id: string;
  name: string;
  observedValue: string;
  normalRange: string;
  units: string;
  comments?: string;
}

const LabSampleProcessing: React.FC = () => {
  const [sampleId, setSampleId] = useState('');
  const [currentSample, setCurrentSample] = useState<PatientSample | null>(null);
  const [investigations, setInvestigations] = useState<TestInvestigation[]>([]);
  const [searchMode, setSearchMode] = useState<'entry' | 'results'>('entry');

  // Sample data
  const samplePatientData: PatientSample = {
    patientName: 'Aaa Sss',
    ageSex: '0 Day / Female',
    type: 'IPD / PRIVATE',
    refBy: 'Vaibhav Banait MS (Gen.)',
    sampleId: '',
    testDate: '19/06/2025 10.24.17',
    isAuthenticated: false
  };

  const sampleInvestigations: TestInvestigation[] = [
    {
      id: '1',
      name: 'Blood Sugar Fasting',
      observedValue: '',
      normalRange: '65 - 110 mg/dl',
      units: 'mg/dl',
      comments: ''
    }
  ];

  const handleSampleSearch = () => {
    if (sampleId) {
      setCurrentSample({
        ...samplePatientData,
        sampleId: sampleId
      });
      setInvestigations(sampleInvestigations);
    }
  };

  const handleSaveResults = () => {
    console.log('Saving results:', { currentSample, investigations });
    // Here you would save to your database
  };

  const handlePreviewAndPrint = () => {
    console.log('Preview and print:', { currentSample, investigations });
    // Here you would generate and preview the report
  };

  const handleDownloadFiles = () => {
    console.log('Download files');
    // Here you would handle file downloads
  };

  const updateInvestigationValue = (id: string, field: string, value: string) => {
    setInvestigations(investigations.map(inv => 
      inv.id === id ? { ...inv, [field]: value } : inv
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TestTube className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Lab Sample Processing</h2>
            <p className="text-muted-foreground">Process laboratory samples and enter test results</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={searchMode === 'entry' ? 'default' : 'outline'}
            onClick={() => setSearchMode('entry')}
          >
            Sample Entry
          </Button>
          <Button
            variant={searchMode === 'results' ? 'default' : 'outline'}
            onClick={() => setSearchMode('results')}
          >
            Lab Results
          </Button>
        </div>
      </div>

      {/* Sample ID Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Lab Sample ID
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter Lab Sample ID"
                value={sampleId}
                onChange={(e) => setSampleId(e.target.value)}
              />
            </div>
            <Button onClick={handleSampleSearch} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Submit
            </Button>
            <Button variant="outline">
              Back
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patient Information */}
      {currentSample && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Patient Name:</span>
                <p>{currentSample.patientName}</p>
              </div>
              <div>
                <span className="font-medium">Age/Sex:</span>
                <p>{currentSample.ageSex}</p>
              </div>
              <div>
                <span className="font-medium">Type:</span>
                <p>{currentSample.type}</p>
              </div>
              <div>
                <span className="font-medium">Ref By:</span>
                <p>{currentSample.refBy}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{currentSample.testDate}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="authenticated"
                  checked={currentSample.isAuthenticated}
                  onCheckedChange={(checked) => setCurrentSample({
                    ...currentSample,
                    isAuthenticated: !!checked
                  })}
                />
                <Label htmlFor="authenticated" className="text-sm">Authenticated Result</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {currentSample && investigations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Investigation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>INVESTIGATION</TableHead>
                    <TableHead>OBSERVED VALUE</TableHead>
                    <TableHead>NORMAL RANGE</TableHead>
                    <TableHead>Comments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investigations.map((investigation) => (
                    <TableRow key={investigation.id}>
                      <TableCell className="font-medium">
                        {investigation.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            value={investigation.observedValue}
                            onChange={(e) => updateInvestigationValue(investigation.id, 'observedValue', e.target.value)}
                            className="w-32"
                            style={{ borderColor: '#ff0000' }}
                          />
                          <span className="text-sm text-muted-foreground">
                            {investigation.units}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {investigation.normalRange}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Checkbox />
                          <Input
                            value={investigation.comments || ''}
                            onChange={(e) => updateInvestigationValue(investigation.id, 'comments', e.target.value)}
                            className="w-32"
                            placeholder="Comments"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* File Upload */}
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Choose File</Label>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  No file chosen
                </Button>
                <Button variant="outline" size="sm">
                  Add more
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button onClick={handleSaveResults} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button variant="outline">
                Back
              </Button>
              <Button onClick={handlePreviewAndPrint} className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Preview & Print
              </Button>
              <Button onClick={handleDownloadFiles} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download Files
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LabSampleProcessing; 