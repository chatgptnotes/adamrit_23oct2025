import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

interface LabTest {
  name: string;
  observedValue: string;
  normalRange?: string;
  unit?: string;
  description?: string;
  testType?: 'quantitative' | 'qualitative'; // New: Test type
}

interface LabReportPrintFormatProps {
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  patientId?: string;
  reportDate?: string;
  reportType?: string;
  doctorName?: string;
  doctorQualification?: string;
  tests?: LabTest[];
}

// Preset Test Templates
export const SEROLOGY_TESTS: LabTest[] = [
  {
    name: "HIV I & II",
    observedValue: "Non - Reactive",
    testType: "qualitative"
  },
  {
    name: "HCV [ Hepatitis C virus ]",
    observedValue: "Non - Reactive",
    testType: "qualitative"
  },
  {
    name: "HBsAg",
    observedValue: "Non - Reactive",
    testType: "qualitative"
  }
];

const LabReportPrintFormat: React.FC<LabReportPrintFormatProps> = ({
  patientName = "John Doe",
  patientAge = "45",
  patientGender = "Male",
  patientId = "P001",
  reportDate = new Date().toLocaleDateString(),
  reportType = "Report on SEROLOGY",
  doctorName = "DR. ARUN AGRE",
  doctorQualification = "MD (PATHOLOGY)",
  tests = SEROLOGY_TESTS
}) => {
  
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Convert to PDF functionality
    console.log('Downloading report as PDF...');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Print Controls */}
      <div className="flex justify-end gap-2 mb-4 print:hidden">
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Report
        </Button>
        <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Report Content */}
      <div className="bg-white shadow-lg print:shadow-none print:bg-white">
        <Card className="border-0 print:border-0">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold underline mb-4 uppercase">{reportType}</h1>
            </div>

            {/* Patient Info - Could be added if needed */}
            <div className="mb-8">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Patient Name:</strong> {patientName}
                </div>
                <div>
                  <strong>Patient ID:</strong> {patientId}
                </div>
                <div>
                  <strong>Age/Gender:</strong> {patientAge}/{patientGender}
                </div>
                <div>
                  <strong>Report Date:</strong> {reportDate}
                </div>
              </div>
            </div>

            {/* Table Header */}
            <div className="border-t-2 border-b-2 border-black">
              <div className="grid grid-cols-3 py-3 font-bold text-center">
                <div className="border-r border-black">INVESTIGATION</div>
                <div className="border-r border-black text-left pl-4">OBSERVED VALUE</div>
                <div className="text-left pl-4">NORMAL RANGE</div>
              </div>
            </div>

            {/* Test Results */}
            {tests.map((test, index) => (
              <div key={index} className="border-b border-gray-300 py-3">
                {/* Qualitative Test Format (Simple - Second Screenshot Style) */}
                {test.testType === 'qualitative' ? (
                  <div>
                    <div className="grid grid-cols-3 items-center">
                       {/* Test Name */}
                       <div className="font-bold text-base pl-4">{test.name}</div>
                       
                       {/* Result - Centered having rounded border */}
                       <div className="flex justify-center">
                         <div className="font-bold border-2 border-black rounded-full px-8 py-1 text-sm inline-block">
                          : {test.observedValue}
                         </div>
                       </div>
                       
                       {/* Empty third column for alignment with header */}
                       <div></div>
                    </div>
                  </div>
                ) : (
                  /* Quantitative Test Format (Detailed Table Style) */
                  <div>
                    <div className="font-bold text-base mb-2">{test.name}</div>
                    <div className="grid grid-cols-3 items-center py-2">
                      <div className="italic text-sm pl-4">{test.name}</div>
                      <div className="text-center font-bold">
                        {test.observedValue}
                        {test.unit && test.unit.toLowerCase() !== 'unit' && ` ${test.unit}`}
                      </div>
                      <div className="text-center">{test.normalRange}</div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {test.description && (
                  <div className="pt-2 pb-2">
                    <div className="flex">
                      <div className="w-24 font-bold text-sm pl-4">Method</div>
                      <p className="text-sm leading-relaxed flex-1 whitespace-pre-line">
                        {test.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Comments Section (if needed) */}
                {test.testType === 'qualitative' && (
                  <div className="pl-4 pt-2">
                    {/* <div className="text-xs text-gray-600">Comments</div> */}
                  </div>
                )}
              </div>
            ))}

            {/* Footer with Doctor Signature */}
            <div className="mt-16 flex justify-end pr-16">
              <div className="text-center">
                {/* Signature Space */}
                <div className="mb-4">
                  <div className="w-48 h-16 border-b border-gray-400 mb-2 flex items-end justify-center">
                    <span className="text-2xl font-cursive">Dr. Signature</span>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-bold">{doctorName}</div>
                  <div>{doctorQualification}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:border-0 {
            border: none !important;
          }
          
          .print\\:bg-white {
            background: white !important;
          }
          
          @page {
            margin: 1in;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
};

export default LabReportPrintFormat; 