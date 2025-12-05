import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EnhancedLabResultsForm from '@/components/lab/EnhancedLabResultsForm';
import DatabaseStatus from '@/components/lab/DatabaseStatus';

const LabResultsEntryDemo: React.FC = () => {
  const samplePatient = {
    name: "Diya",
    age: 66,
    gender: "Female" as const,
    type: "OPD / BSNL",
    refBy: "Dr. Desai",
    labSampleId: "26b7bc2b-ae4d-4d9b-87ac-09a462333a3e",
    date: "28/08/2025"
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lab Results Entry System - Demo</span>
              <Badge variant="secondary">Demo Mode</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Sample Patient Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Patient:</span> {samplePatient.name}
                  </div>
                  <div>
                    <span className="font-medium">Age/Sex:</span> {samplePatient.age}Y {samplePatient.gender}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {samplePatient.type}
                  </div>
                  <div>
                    <span className="font-medium">Ref By:</span> {samplePatient.refBy}
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-sm font-medium text-green-800 mb-2">Demo Features</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Dynamic test loading from database</li>
                  <li>• Age/gender-specific normal ranges</li>
                  <li>• Real-time value validation</li>
                  <li>• File upload support</li>
                  <li>• Comprehensive test result entry</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <DatabaseStatus />

        <EnhancedLabResultsForm
          patient={samplePatient}
          onSave={(results) => console.log('Save results:', results)}
          onPreview={(results) => console.log('Preview report:', results)}
          onPrint={(results) => console.log('Print report:', results)}
          onDownload={(results) => console.log('Download files:', results)}
        />
      </div>
    </div>
  );
};

export default LabResultsEntryDemo;