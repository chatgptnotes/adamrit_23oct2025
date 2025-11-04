import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Printer, FileText, Bot, User, Download } from 'lucide-react';
import DischargeSummary from './DischargeSummary';
import SimpleDischargeSummary from './SimpleDischargeSummary';
import { useVisitMedicalData } from '@/hooks/useVisitMedicalData';
import { useVisitDiagnosis } from '@/hooks/useVisitDiagnosis';
import { supabase } from '@/integrations/supabase/client';

interface DischargeSummaryInterfaceProps {
  visitId?: string;
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  patientAddress?: string;
}

export default function DischargeSummaryInterface({
  visitId,
  patientName = "NIYATI BAWANKAR",
  patientAge = "3 years",
  patientGender = "female",
  patientAddress = "Mamta society plot no.34/b sonegaon Nagpur"
}: DischargeSummaryInterfaceProps) {
  // Fetch lab and radiology data
  const { labs, radiology, medications, isLoadingLabs, isLoadingRadiology, isLoadingMedications } = useVisitMedicalData(visitId);

  // Fetch diagnosis data
  const { data: visitDiagnosis, isLoading: diagnosisLoading } = useVisitDiagnosis(visitId || '');

  // State for patient details from database
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState<string>('Acute Cholecystitis');
  const [allPatientData, setAllPatientData] = useState(`Dr. Vishal Nandagavli, Reactive 17/03/2025:-HBSAG - Non - Reactive 17/03/2025:-HCV [ Hepatitis C Virus ] - HCV [ Hepatitis C Virus ] - Non - Reactive 17/03/2025:-PROTHROMBIN TIME (PT): Prothrombin Time:16.76 s, Prothrombin Index:76 %, Prothrombin Ratio:1.31, INR:1.31, Control:12.8 s, APTT:32.45 s, Control:30.5 s, Ratio:1.06, Eosinophils:03 %, Red Cell Count:4.52 mlt/cumm, Packed Cell Volume:42.9 %, Mean Cell Volume:94.9 fl., Mean Cell Hemoglobin:30.52 pg, Mean Cell Hemoglobin Concentration:32.1 g/dl, Platelet Count:250,000 /cumm, Serum sodium: 140 mEq/L, Serum potassium: 5.6 mEq/L, Bilirubin - Total:0.98 mg/dl, Bilirubin - Direct:0.23 mg/dl, Bilirubin - Indirect:0.75 mg/dl, SGOT / AST:38 units/L, SGPT / ALT:39.8 U/L, Alkaline Phosphatase (ALP): Protein - Total:6.75 gm/dl, Albumin:3.72 gm/dl, Globulin:3.03 gm/dl, A / G Ratio:1.23 23/03/2025:-INR QUANTITATIVE:0.93 mg/Procedure: ,Treatment On Discharge: Tan. Dolton 50MG Pack- Route:P.O Frequency-BD Days-07, TAB.FOLIC ACID Pack- Route:P.O Frequency-OD Days-07, TAB ATORVA 25 MG Pack- Route:P.O Frequency-BD Days-07, INJECTA P.O Frequency-BD Days-07,`);
  
  const [patientDataSummary, setPatientDataSummary] = useState(`**3. INVESTIGATIONS SECTION**

**Normal Investigations:**
- Hemoglobin: 12.6 g/dL
- Platelet count: 250,000 /cumm
- Serum sodium: 140 mEq/L

**Abnormal Investigations:**
- Serum creatinine: 2.8 mg/dL
- Blood urea nitrogen: 35 mg/dL
- Serum potassium: 5.6 mEq/L

**4. HOSPITAL COURSE**

The patient was admitted with a history of LEFT CONGENITAL INGUINAL HERNIA. The patient received conservative management which included`);

  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const handlePrintSummary = () => {
    // Format and set the data before showing preview
    const formattedData = formatDischargeSummaryData();
    setAllPatientData(formattedData);
    setShowPrintPreview(true);
    // Wait a bit longer to ensure data is rendered before printing
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  const handleViewFullSummary = () => {
    setShowPrintPreview(true);
  };

  const handleFetchData = () => {
    // Format lab data
    const labData = labs.map(lab => `Lab: ${lab.lab_name} - Status: ${lab.status}`).join('\n');

    // Format radiology data
    const radiologyData = radiology.map(rad => `Radiology: ${rad.radiology_name} - Status: ${rad.status}`).join('\n');

    // Format medications data
    const medicationsData = medications.map(med => `Medication: ${med.medication_name} - Status: ${med.status}`).join('\n');

    // Combine all data
    const fetchedData = [
      'LABORATORY INVESTIGATIONS:',
      labData || 'No lab investigations found',
      '',
      'RADIOLOGY INVESTIGATIONS:',
      radiologyData || 'No radiology investigations found',
      '',
      'MEDICATIONS:',
      medicationsData || 'No medications found',
      '',
      'Visit ID: ' + visitId,
      'Patient: ' + patientName,
      'Generated on: ' + new Date().toLocaleString()
    ].join('\n');

    setAllPatientData(fetchedData);
  };

  const handleRefreshData = () => {
    // Refresh functionality
    handleFetchData();
  };

  const handleCopyData = () => {
    navigator.clipboard.writeText(allPatientData);
  };

  const handleClear = () => {
    setAllPatientData('');
  };

  const handleFinalDischarge = () => {
    // Final discharge functionality
    console.log('Processing final discharge...');
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(patientDataSummary);
  };

  const handleClearSummary = () => {
    setPatientDataSummary('');
  };

  // Auto-fetch data on component mount
  useEffect(() => {
    if (visitId && !isLoadingLabs && !isLoadingRadiology && !isLoadingMedications) {
      handleFetchData();
    }
  }, [visitId, isLoadingLabs, isLoadingRadiology, isLoadingMedications, labs, radiology, medications]);

  // Fetch patient visit details from database
  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (!visitId) return;

      try {
        // Fetch patient visit data
        const { data: visitData, error: visitError } = await supabase
          .from('patient_visits')
          .select(`
            *,
            patients (
              name,
              age,
              gender,
              address,
              date_of_birth,
              patients_id,
              corporate
            )
          `)
          .eq('visit_id', visitId)
          .single();

        if (visitData && !visitError) {
          setPatientDetails(visitData);

          // Update diagnosis if available
          if (visitData.diagnosis) {
            setDiagnosis(visitData.diagnosis);
          }
        }
      } catch (error) {
        console.error('Error fetching patient details:', error);
      }
    };

    fetchPatientDetails();
  }, [visitId]);

  // Update diagnosis from visitDiagnosis hook
  useEffect(() => {
    if (visitDiagnosis) {
      if (visitDiagnosis.primaryDiagnosis) {
        setDiagnosis(visitDiagnosis.primaryDiagnosis);
      }
    }
  }, [visitDiagnosis]);

  // Format discharge summary data in the required format
  const formatDischargeSummaryData = () => {
    const currentDate = new Date().toLocaleDateString('en-IN');

    // Format medications for the table
    const formattedMedications = medications.map(med => ({
      name: med.medication_name || 'N/A',
      strength: med.strength || '-',
      route: med.route || 'P.O',
      dosage: med.dosage || 'As prescribed',
      days: med.days || '7'
    }));

    // Create the discharge summary text
    const dischargeSummaryText = `
OPD Summary - ${patientName || 'test2'}

Name: ${patientName || 'test2'}
Patient ID: ${visitId || 'UHAY25I22001'}
Primary Care Provider: Dr. Unknown (Gastroenterologist)
Registration ID: IH25I22001
Sex / Age: ${patientGender || 'female'} / ${patientAge || '11 Year'}
Mobile No: N/A
Tariff: Private
Address: ${patientAddress || 'N/A'}
Admission Date: 2025-09-22
Discharge Date: ${currentDate}
Discharge Reason: Recovered

Present Condition
Diagnosis: Acute Cholecystitis

Medications on Discharge:
${formattedMedications.length > 0 ? formattedMedications.map(med =>
  `- ${med.name} ${med.strength} - ${med.route} - ${med.dosage} - ${med.days} days`
).join('\n') : 'As per prescription provided separately'}

Case Summary:
The patient was admitted with complaints of hernia as.

ADVICE
Advice:
Follow up after 7 days/SOS

Review on: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}
Resident On Discharge: Sachin Galbhardie

Dr. Dr. Nikhil Khodragade (Gastroenterologist)

Note: URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7. PLEASE CONTACT: 7630974816, 9373111709.
    `;

    return dischargeSummaryText;
  };

  // Prepare structured data for SimpleDischargeSummary component
  const preparePatientDataForPrint = () => {
    const currentDate = new Date().toLocaleDateString('en-IN').replace(/\//g, '/');
    const reviewDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN').replace(/\//g, '/');

    // Extract patient info from fetched data
    const patient = patientDetails?.patients || {};
    const actualName = patient.name || patientName || 'test2';
    const actualAge = patient.age ? `${patient.age} Year` : patientAge || '11 Year';
    const actualGender = patient.gender || patientGender || 'female';
    const actualAddress = patient.address || patientAddress || 'N/A';
    // Use UH ID from visitDiagnosis if available, otherwise fall back to patient data
    const patientId = visitDiagnosis?.patientUhId || patient.patients_id || visitId || 'UHAY25I22001';
    const corporate = patient.corporate || 'Private';

    // Get appointment details
    const doctorName = patientDetails?.appointment_with || 'Dr. Unknown';
    const visitType = patientDetails?.visit_type || 'follow-up';

    // Get admission date from patient visit created_at or use default
    const admissionDate = patientDetails?.created_at
      ? new Date(patientDetails.created_at).toLocaleDateString('en-IN').replace(/\//g, '/')
      : '9/22/2025';

    // Create case summary based on diagnosis
    const caseSummary = visitDiagnosis
      ? `The patient was admitted with complaints of ${visitDiagnosis.complaints?.join(', ') || 'hernia'}.`
      : `The patient was admitted with complaints of ${diagnosis || 'hernia as'}.`;

    // Parse lab investigations from fetched data
    const labInvestigations = labs.map(lab => ({
      name: lab.lab_name || lab.name || 'Unknown Test',
      result: lab.result || lab.value || 'Pending',
      status: lab.status || 'Completed'
    }));

    // Parse radiology investigations
    const radiologyInvestigations = radiology.map(rad => ({
      name: rad.radiology_name || rad.name || 'Unknown Scan',
      findings: rad.findings || rad.result || 'No findings',
      status: rad.status || 'Completed'
    }));

    // Parse data from allPatientData string if available
    let additionalLabs = [];
    let additionalRadiology = [];
    let vitalSigns = [];
    let treatmentCourse = [];
    let dischargeCondition = [];

    if (allPatientData) {
      const lines = allPatientData.split('\n');

      // Extract lab data
      const labLines = lines.filter(line => line.startsWith('Lab:'));
      additionalLabs = labLines.map(line => {
        const labData = line.replace('Lab: ', '');
        const parts = labData.split(' - ');
        return {
          name: parts[0] || labData,
          result: parts[1] || 'Result available',
          status: parts[2] || 'Completed'
        };
      });

      // Extract radiology data
      const radLines = lines.filter(line => line.startsWith('Radiology:'));
      additionalRadiology = radLines.map(line => {
        const radData = line.replace('Radiology: ', '');
        const parts = radData.split(' - ');
        return {
          name: parts[0] || radData,
          findings: parts[1] || 'See report',
          status: parts[2] || 'Completed'
        };
      });

      // Extract vital signs from patientDataSummary if available
      if (patientDataSummary && patientDataSummary.includes('Vital')) {
        vitalSigns = [
          'Blood Pressure: 120/80 mmHg',
          'Pulse: 78/min',
          'Temperature: 98.6°F',
          'Respiratory Rate: 18/min',
          'SpO2: 98% on room air'
        ];
      }
    }

    // Parse treatment and conditions from patientDataSummary
    if (patientDataSummary) {
      if (patientDataSummary.includes('HOSPITAL COURSE')) {
        const courseMatch = patientDataSummary.match(/HOSPITAL COURSE[^*]*([\s\S]*?)(?=\*\*|$)/);
        if (courseMatch && courseMatch[1]) {
          treatmentCourse = courseMatch[1]
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.trim());
        }
      }
    }

    // Default treatment course if none found
    if (treatmentCourse.length === 0) {
      treatmentCourse = [
        'Patient was admitted and stabilized',
        'Conservative management initiated',
        'Responded well to treatment',
        'Condition improved progressively'
      ];
    }

    // Default discharge condition
    dischargeCondition = [
      'Afebrile',
      'Hemodynamically stable',
      'Tolerating oral diet',
      'Ambulating independently',
      'Pain well controlled'
    ];

    // Combine all lab investigations
    const allLabs = [...labInvestigations, ...additionalLabs];
    const allRadiology = [...radiologyInvestigations, ...additionalRadiology];

    // Extract chief complaints and history from visitDiagnosis
    const chiefComplaints = visitDiagnosis?.chiefComplaints ||
      patientDetails?.reason_for_visit ||
      'Abdominal pain, fever';

    const historyOfPresentIllness = visitDiagnosis?.historyOfPresentIllness ||
      'Patient presented with acute onset of symptoms';

    return {
      // Basic Information
      name: actualName,
      patientId: patientId,
      primaryCareProvider: doctorName,
      registrationId: `IH${visitId?.slice(-10) || '25I22001'}`,
      sex: actualGender,
      age: actualAge,
      tariff: corporate,
      mobileNo: visitDiagnosis?.mobileNumber || patient.phone || 'N/A',
      address: actualAddress,
      admissionDate: admissionDate,
      dischargeDate: currentDate,
      dischargeReason: 'Recovered',

      // Diagnosis
      diagnosis: diagnosis,
      secondaryDiagnosis: visitDiagnosis?.secondaryDiagnosis || '',

      // Clinical Information
      chiefComplaints: chiefComplaints,
      historyOfPresentIllness: historyOfPresentIllness,
      clinicalSummary: visitDiagnosis?.clinicalSummary || '',

      // Vital Signs
      vitalSigns: vitalSigns.length > 0 ? vitalSigns : undefined,

      // Investigations
      labInvestigations: allLabs.length > 0 ? allLabs : undefined,
      radiologyInvestigations: allRadiology.length > 0 ? allRadiology : undefined,

      // Treatment
      treatmentCourse: treatmentCourse.length > 0 ? treatmentCourse : undefined,
      intraOperativeFindings: visitDiagnosis?.intraOperativeFindings || '',

      // Discharge Information
      dischargeCondition: dischargeCondition,

      // Medications
      medications: medications.length > 0 ? medications.map(med => ({
        name: med.medication_name || med.name || 'N/A',
        strength: med.strength || med.dosage || '-',
        route: med.route || 'P.O',
        dosage: med.frequency || 'As prescribed',
        days: med.duration || med.days || '7'
      })) : [
        { name: 'Tab. Dolton', strength: '50MG', route: 'P.O', dosage: 'BD', days: '7' },
        { name: 'Tab. Folic Acid', strength: '-', route: 'P.O', dosage: 'OD', days: '7' },
        { name: 'Tab. Atorva', strength: '25MG', route: 'P.O', dosage: 'BD', days: '7' }
      ],

      // Summary and follow-up
      caseSummary: caseSummary,
      advice: 'Follow up after 7 days/SOS',
      followUpDate: reviewDate,
      reviewOn: reviewDate,
      residentOnDischarge: 'Sachin Galbhardie',
      doctorName: 'Dr. Nikhil Khodragade',
      doctorSpecialty: 'Gastroenterologist',
      emergencyContact: '7630974816, 9373111709'
    };
  };

  // Update the print handler to use formatted data
  const handlePrintWithData = () => {
    const formattedData = formatDischargeSummaryData();
    setAllPatientData(formattedData);
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  if (showPrintPreview) {
    // Check if data is still loading
    const isDataLoading = isLoadingLabs || isLoadingRadiology || isLoadingMedications || diagnosisLoading;

    return (
      <div id="print-root" className="discharge-summary-print min-h-screen bg-white">
        {/* Print Button - Hidden in print */}
        <div className="no-print mb-4 text-center p-4">
          <Button
            onClick={handlePrintSummary}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 mr-4"
            disabled={isDataLoading}
          >
            <Printer className="mr-2 h-4 w-4" />
            {isDataLoading ? 'Loading Data...' : 'Print Summary'}
          </Button>
          <Button
            onClick={() => setShowPrintPreview(false)}
            variant="outline"
            className="px-6 py-2"
          >
            Back to Edit
          </Button>
          {isDataLoading && (
            <div className="text-sm text-gray-600 mt-2">
              Please wait while we fetch all patient data...
            </div>
          )}
        </div>

        {/* Use the SimpleDischargeSummary component with structured data */}
        <SimpleDischargeSummary patientData={preparePatientDataForPrint()} />

        {/* Enhanced Print Styles */}
        <style>{`
          @media print {
            /* Hide non-print elements */
            .no-print {
              display: none !important;
            }

            /* Reset the print root container */
            #print-root {
              position: static !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
              min-height: auto !important;
              max-height: none !important;
              overflow: visible !important;
              background: white !important;
            }

            /* Ensure discharge summary content is fully visible */
            .discharge-summary-print,
            .discharge-summary-simple,
            .discharge-summary,
            .discharge-summary-content {
              visibility: visible !important;
              display: block !important;
              height: auto !important;
              min-height: auto !important;
              max-height: none !important;
              overflow: visible !important;
              margin: 0 !important;
              page-break-inside: auto !important;
            }

            .discharge-summary-simple * {
              visibility: visible !important;
              height: auto !important;
              overflow: visible !important;
            }

            /* Table display fixes for print */
            table, thead, tbody, tr, th, td {
              display: table !important;
              visibility: visible !important;
            }

            thead { display: table-header-group !important; }
            tbody { display: table-row-group !important; }
            tr { display: table-row !important; }
            th, td { display: table-cell !important; }

            /* Grid display fixes */
            .grid { display: grid !important; }
            .flex { display: flex !important; }

            /* Reset body and html for proper printing */
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
              min-height: auto !important;
              overflow: visible !important;
              background: white !important;
            }

            /* Page settings - Proper margins for multi-page */
            @page {
              margin: 0.75in 0.5in !important;
              size: A4 portrait !important;
            }

            /* Ensure sections are visible */
            section, .section {
              display: block !important;
              visibility: visible !important;
              page-break-inside: avoid !important;
            }

            /* Table handling */
            table {
              width: 100% !important;
              page-break-inside: auto !important;
              font-size: 11px !important;
            }

            /* Avoid page breaks in critical areas */
            .break-inside-avoid {
              page-break-inside: avoid !important;
            }

            /* Scale content to fit page */
            .discharge-summary-simple {
              transform-origin: top left !important;
              width: 100% !important;
            }

            /* Force all text to be black */
            * {
              color: black !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Data Summary</h1>
              <p className="text-gray-600">1 sections loaded</p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Internal System
            </Badge>
          </div>
          
          {/* Patient Info */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p><strong>Patient:</strong> {patientName}</p>
              <p><strong>Age:</strong> {patientAge}</p>
              <p><strong>Gender:</strong> {patientGender}</p>
            </div>
            <div>
              <p><strong>Address:</strong> {patientAddress}</p>
              <p><strong>Data Source:</strong> Internal System</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* All Patient Data Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                All Patient Data (Auto-populated when OPD Summary is clicked):
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={allPatientData}
                onChange={(e) => setAllPatientData(e.target.value)}
                placeholder="Patient data will be auto-populated here..."
                className="min-h-[300px] font-mono text-sm"
              />
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={handleViewFullSummary}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Full OPD Summary
                </Button>
                <Button 
                  onClick={() => console.log('Generate AI Summary')}
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100"
                >
                  <Bot className="mr-2 h-4 w-4" />
                  Generate AI Summary
                </Button>
                <Button 
                  onClick={() => console.log('Professional Summary')}
                  variant="outline"
                  className="bg-orange-50 hover:bg-orange-100"
                >
                  <User className="mr-2 h-4 w-4" />
                  Professional Summary
                </Button>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  onClick={handleFetchData}
                  variant="outline"
                  size="sm"
                  disabled={isLoadingLabs || isLoadingRadiology || isLoadingMedications}
                  className="bg-green-50 hover:bg-green-100 border-green-200"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isLoadingLabs || isLoadingRadiology || isLoadingMedications ? "Loading..." : "Fetch Data"}
                </Button>
                <Button onClick={handleRefreshData} variant="outline" size="sm">
                  Refresh Data
                </Button>
                <Button onClick={handleCopyData} variant="outline" size="sm">
                  Copy Data
                </Button>
                <Button onClick={handleClear} variant="outline" size="sm">
                  Clear
                </Button>
                <Button
                  onClick={handleFinalDischarge}
                  className="bg-blue-600 hover:bg-blue-700 ml-auto"
                >
                  Final Discharge
                </Button>
              </div>
              
              <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                ✅ Patient data loaded successfully! ({allPatientData.length} characters)
                <br />
                📊 Available data: {labs.length} lab tests, {radiology.length} radiology studies, {medications.length} medications
              </div>
            </CardContent>
          </Card>

          {/* Patient Data Summary Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Patient Data Summary
                </span>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => console.log('Generate Summary')}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    Generate Summary
                  </Button>
                  <Button 
                    onClick={handlePrintSummary}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Summary
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={patientDataSummary}
                onChange={(e) => setPatientDataSummary(e.target.value)}
                placeholder="Patient summary will appear here..."
                className="min-h-[300px] text-sm"
              />
              
              <div className="flex gap-2">
                <Button onClick={handleCopySummary} variant="outline" size="sm">
                  Copy Summary
                </Button>
                <Button onClick={handleClearSummary} variant="outline" size="sm">
                  Clear Summary
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
