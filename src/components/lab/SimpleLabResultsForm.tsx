import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileUp, Save, Eye, Printer, Download, ArrowLeft, Plus, List } from 'lucide-react';

interface Patient {
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  type: string;
  refBy: string;
  labSampleId: string;
  date: string;
}

interface SubTest {
  name: string;
  normalRange: string;
  observedValue: string;
  comments: string;
  abnormal: boolean;
  file?: File;
}

interface SimpleLabResultsFormProps {
  patient: Patient;
  onSave: (results: any) => void;
  onPreview: (results: any) => void;
  onPrint: (results: any) => void;
  onDownload: (results: any) => void;
}

// Static test configuration - exactly matching your reference image
const TEST_CONFIG = {
  'yyy': {
    name: 'yyy',
    subTests: [
      {
        name: 'RR',
        normalRange: '16.8-20 g/dl'
      },
      {
        name: 'RRR',
        normalRange: '16-20 g/dl'
      }
    ]
  },
  'Kidney Function Test': {
    name: 'Kidney Function Test',
    subTests: [
      {
        name: 'Blood Urea',
        normalRange: '8.0-26.0 mg/dL'
      },
      {
        name: 'Creatinine',
        normalRange: '0.8-1.4 mg/dL'
      },
      {
        name: 'Sr. Sodium',
        normalRange: '136.0-146.0 mmol/L'
      },
      {
        name: 'Sr. Potassium',
        normalRange: '3.5-5.1 mmol/L'
      }
    ]
  }
};

const SimpleLabResultsForm: React.FC<SimpleLabResultsFormProps> = ({
  patient,
  onSave,
  onPreview,
  onPrint,
  onDownload
}) => {
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [subTests, setSubTests] = useState<SubTest[]>([]);
  const [authenticatedResult, setAuthenticatedResult] = useState(false);
  const [showEntryMode, setShowEntryMode] = useState(false);

  const availableTests = Object.keys(TEST_CONFIG);

  const handleTestSelection = (testName: string) => {
    setSelectedTest(testName);
    const testConfig = TEST_CONFIG[testName as keyof typeof TEST_CONFIG];
    if (testConfig) {
      const initialSubTests: SubTest[] = testConfig.subTests.map(subTest => ({
        name: subTest.name,
        normalRange: subTest.normalRange,
        observedValue: '',
        comments: '',
        abnormal: false
      }));
      setSubTests(initialSubTests);
    }
  };

  const handleQuickTestSelection = (testName: string) => {
    handleTestSelection(testName);
    setShowEntryMode(false);
  };

  const handleValueChange = (index: number, value: string) => {
    const updatedSubTests = [...subTests];
    updatedSubTests[index].observedValue = value;
    setSubTests(updatedSubTests);
  };

  const handleCommentsChange = (index: number, comments: string) => {
    const updatedSubTests = [...subTests];
    updatedSubTests[index].comments = comments;
    setSubTests(updatedSubTests);
  };

  const handleAbnormalChange = (index: number, abnormal: boolean) => {
    const updatedSubTests = [...subTests];
    updatedSubTests[index].abnormal = abnormal;
    setSubTests(updatedSubTests);
  };

  const handleNormalRangeChange = (index: number, normalRange: string) => {
    const updatedSubTests = [...subTests];
    updatedSubTests[index].normalRange = normalRange;
    setSubTests(updatedSubTests);
  };

  const handleFileChange = (index: number, file: File | undefined) => {
    const updatedSubTests = [...subTests];
    updatedSubTests[index].file = file;
    setSubTests(updatedSubTests);
  };

  const addMoreTests = () => {
    setSelectedTest('');
    setSubTests([]);
  };

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Lab Results Entry Form</span>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Patient Information */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Patient Name:</span> {patient.name}
            </div>
            <div>
              <span className="font-medium">Age/Sex:</span> {patient.age}Y {patient.gender}
            </div>
            <div>
              <span className="font-medium">Type:</span> {patient.type}
            </div>
            <div>
              <span className="font-medium">Ref By:</span> {patient.refBy}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mt-2">
            <div>
              <span className="font-medium">Lab Sample ID:</span> {patient.labSampleId}
            </div>
            <div>
              <span className="font-medium">Date:</span> {patient.date}
            </div>
          </div>
        </div>

        {/* Lab Results Entry */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">15/9/2025 12:37:23 pm</span>
              <Badge variant="outline">Lab Results</Badge>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="authenticated"
                  checked={authenticatedResult}
                  onCheckedChange={setAuthenticatedResult}
                />
                <label htmlFor="authenticated" className="text-sm">Authenticated Result</label>
              </div>
            </div>
          </div>

          {/* Test Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Select Test</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEntryMode(!showEntryMode)}
                className="flex items-center space-x-2"
              >
                <List className="h-4 w-4" />
                <span>Entry Mode</span>
              </Button>
            </div>

            {showEntryMode ? (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-800 mb-3">Quick Test Selection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {availableTests.map((test) => (
                    <Button
                      key={test}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickTestSelection(test)}
                      className="justify-start text-left h-auto p-3 hover:bg-blue-100"
                    >
                      <div>
                        <div className="font-medium text-sm">{test}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Click to select and view sub-tests
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <Select value={selectedTest} onValueChange={handleTestSelection}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Choose a test" />
                </SelectTrigger>
                <SelectContent>
                  {availableTests.map((test) => (
                    <SelectItem key={test} value={test}>{test}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Results Table */}
          {selectedTest && subTests.length > 0 && (
            <div className="space-y-4">
              {/* Table Headers */}
              <div className="grid grid-cols-3 gap-4 font-medium text-sm text-gray-700 border-b pb-3">
                <div>INVESTIGATION</div>
                <div>OBSERVED VALUE</div>
                <div>NORMAL RANGE</div>
              </div>


              {/* Sub-tests */}
              {subTests.map((subTest, index) => (
                <div key={index} className="border-l-2 border-blue-300 pl-4">
                  <div className="grid grid-cols-3 gap-4 items-start mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                        <span className="font-medium">{subTest.name}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Input
                          type="text"
                          placeholder="Enter value"
                          value={subTest.observedValue}
                          onChange={(e) => handleValueChange(index, e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <Input
                        type="text"
                        placeholder="Enter normal range"
                        value={subTest.normalRange}
                        onChange={(e) => handleNormalRangeChange(index, e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Comments and file upload row */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div></div>
                    <div className="col-span-2">
                      <Textarea
                        placeholder="Comments..."
                        value={subTest.comments}
                        onChange={(e) => handleCommentsChange(index, e.target.value)}
                        className="mb-2 min-h-[60px]"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`abnormal-${index}`}
                              checked={subTest.abnormal}
                              onCheckedChange={(checked) => handleAbnormalChange(index, checked as boolean)}
                            />
                            <label htmlFor={`abnormal-${index}`} className="text-sm">Mark as Abnormal</label>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            id={`file-${index}`}
                            className="hidden"
                            onChange={(e) => handleFileChange(index, e.target.files?.[0])}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`file-${index}`)?.click()}
                            className="text-xs"
                          >
                            Choose File
                          </Button>
                          {subTest.file ? (
                            <span className="text-xs text-green-600">{subTest.file.name}</span>
                          ) : (
                            <span className="text-xs text-gray-500">No file chosen</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          )}

          {/* Action Buttons */}
          {subTests.length > 0 && (
            <div className="flex justify-center space-x-4 pt-6 border-t">
              <Button onClick={() => onSave(subTests)} className="px-6">
                <Save className="h-4 w-4 mr-2" />
                Save Results
              </Button>
              <Button variant="outline" onClick={() => onPreview(subTests)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview Report
              </Button>
              <Button variant="outline" onClick={() => window.history.back()} className="px-6">
                Back
              </Button>
              <Button variant="outline" onClick={() => onPrint(subTests)}>
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
              <Button variant="outline" onClick={() => onDownload(subTests)}>
                <Download className="h-4 w-4 mr-2" />
                Download Files
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleLabResultsForm;