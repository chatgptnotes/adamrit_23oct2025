import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileUp, Save, Eye, Printer, Download, ArrowLeft, Plus, List } from 'lucide-react';
import { useLabTestConfig, TestResult } from '@/hooks/useLabTestConfig';

interface Patient {
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  type: string;
  refBy: string;
  labSampleId: string;
  date: string;
}

interface EnhancedLabResultsFormProps {
  patient: Patient;
  onSave: (results: TestResult[]) => void;
  onPreview: (results: TestResult[]) => void;
  onPrint: (results: TestResult[]) => void;
  onDownload: (results: TestResult[]) => void;
}

const EnhancedLabResultsForm: React.FC<EnhancedLabResultsFormProps> = ({
  patient,
  onSave,
  onPreview,
  onPrint,
  onDownload
}) => {
  const {
    availableTests,
    subTests,
    loadingTests,
    loadingSubTests,
    fetchSubTestsForTest,
    getNormalRange,
    isAbnormalValue,
    debugTestData
  } = useLabTestConfig();

  const [selectedTest, setSelectedTest] = useState<string>('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [authenticatedResult, setAuthenticatedResult] = useState(false);
  const [showEntryMode, setShowEntryMode] = useState(false);

  useEffect(() => {
    if (selectedTest) {
      console.log('Selected test changed to:', selectedTest);
      fetchSubTestsForTest(selectedTest);
      debugTestData(selectedTest);
    }
  }, [selectedTest, fetchSubTestsForTest, debugTestData]);

  useEffect(() => {
    console.log('SubTests updated:', subTests);
    const results: TestResult[] = [];

    subTests.forEach(subTest => {
      // Add parent sub-test
      results.push({
        subTestId: subTest.id,
        subTestName: subTest.sub_test_name,
        observedValue: '',
        normalRange: `Consult reference values ${subTest.unit}`,
        status: '',
        comments: '',
        abnormal: false
      });

      // Add nested sub-tests if they exist
      if (subTest.nested_sub_tests && subTest.nested_sub_tests.length > 0) {
        console.log(`  📦 Adding ${subTest.nested_sub_tests.length} nested sub-tests for ${subTest.sub_test_name}`);
        subTest.nested_sub_tests.forEach((nested, idx) => {
          results.push({
            subTestId: `${subTest.id}_nested_${idx}`,
            subTestName: `  ${nested.name}`, // Indent nested sub-tests
            observedValue: '',
            normalRange: nested.normal_ranges && nested.normal_ranges.length > 0
              ? `${nested.normal_ranges[0].min_value} - ${nested.normal_ranges[0].max_value} ${nested.unit}`
              : `Consult reference values ${nested.unit}`,
            status: '',
            comments: '',
            abnormal: false
          });
        });
      }
    });

    console.log('Generated test results with nested:', results);
    setTestResults(results);
  }, [subTests, patient.age, patient.gender]);

  const handleValueChange = (index: number, value: string) => {
    const updatedResults = [...testResults];
    updatedResults[index].observedValue = value;

    const subTest = subTests[index];
    if (subTest) {
      const status = isAbnormalValue(value, subTest, patient.age, patient.gender);
      updatedResults[index].status = status;
    }

    setTestResults(updatedResults);
  };

  const handleCommentsChange = (index: number, comments: string) => {
    const updatedResults = [...testResults];
    updatedResults[index].comments = comments;
    setTestResults(updatedResults);
  };

  const handleAbnormalChange = (index: number, abnormal: boolean) => {
    const updatedResults = [...testResults];
    updatedResults[index].abnormal = abnormal;
    setTestResults(updatedResults);
  };

  const handleFileChange = (index: number, file: File | undefined) => {
    const updatedResults = [...testResults];
    updatedResults[index].file = file;
    setTestResults(updatedResults);
  };

  const handleNormalRangeChange = (index: number, normalRange: string) => {
    const updatedResults = [...testResults];
    updatedResults[index].normalRange = normalRange;
    setTestResults(updatedResults);
  };

  const addMoreTests = () => {
    setSelectedTest('');
    setTestResults([]);
  };

  const handleQuickTestSelection = (testName: string) => {
    setSelectedTest(testName);
    setShowEntryMode(false);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'low':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
              <span className="text-sm font-medium">9/13/2025 4:18:09 PM</span>
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
              <Select value={selectedTest} onValueChange={setSelectedTest} disabled={loadingTests}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder={loadingTests ? "Loading tests..." : "Choose a test"} />
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
          {selectedTest && (
            <div className="space-y-4">
              {loadingSubTests ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading sub-tests for {selectedTest}...
                </div>
              ) : subTests.length === 0 ? (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="text-yellow-800">
                    <strong>No sub-tests found for "{selectedTest}"</strong>
                    <p className="text-sm mt-1">
                      Please ensure the lab_test_config table has data for this test.
                      Check the browser console for debugging information.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Table Headers */}
                  <div className="grid grid-cols-3 gap-4 font-medium text-sm text-gray-700 border-b pb-3">
                    <div>INVESTIGATION</div>
                    <div>OBSERVED VALUE</div>
                    <div>NORMAL RANGE</div>
                  </div>

                  {/* Main Test Header */}
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div>
                        <span className="font-semibold text-blue-600">Main Test</span>
                        <br />
                        <span className="font-medium">{selectedTest}</span>
                      </div>
                      <div className="text-center text-gray-500 italic">
                        - Test Group Header -
                      </div>
                      <div className="text-center text-gray-500 italic">
                        - See Sub Tests -
                      </div>
                    </div>
                  </div>

                  {/* Sub-tests */}
                  {testResults.map((result, index) => (
                    <div key={result.subTestId} className="border-l-2 border-blue-300 pl-4">
                      <div className="grid grid-cols-3 gap-4 items-start mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                            <span className="font-medium">{result.subTestName}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Input
                              type="text"
                              placeholder="Enter value"
                              value={result.observedValue}
                              onChange={(e) => handleValueChange(index, e.target.value)}
                              className="w-full"
                            />
                            {result.status && (
                              <Badge className={getStatusBadgeColor(result.status)} variant="outline">
                                {result.status.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <Input
                            type="text"
                            placeholder="Enter normal range"
                            value={result.normalRange}
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
                            value={result.comments}
                            onChange={(e) => handleCommentsChange(index, e.target.value)}
                            className="mb-2 min-h-[60px]"
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`abnormal-${index}`}
                                  checked={result.abnormal}
                                  onCheckedChange={(checked) => handleAbnormalChange(index, checked as boolean)}
                                />
                                <label htmlFor={`abnormal-${index}`} className="text-sm">Abnormal</label>
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
                              {result.file ? (
                                <span className="text-xs text-green-600">{result.file.name}</span>
                              ) : (
                                <span className="text-xs text-gray-500">No file chosen</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add More Button */}
                  <div className="flex justify-center pt-4 border-t">
                    <Button variant="outline" onClick={addMoreTests} className="bg-orange-600 text-white hover:bg-orange-700">
                      Add more
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {testResults.length > 0 && (
            <div className="flex justify-center space-x-4 pt-6 border-t">
              <Button onClick={() => onSave(testResults)} className="px-6">
                <Save className="h-4 w-4 mr-2" />
                Save Results
              </Button>
              <Button variant="outline" onClick={() => onPreview(testResults)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview Report
              </Button>
              <Button variant="outline" onClick={() => onPrint(testResults)}>
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
              <Button variant="outline" onClick={() => onDownload(testResults)}>
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

export default EnhancedLabResultsForm;