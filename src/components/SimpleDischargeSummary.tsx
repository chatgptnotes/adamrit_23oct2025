import React from 'react';

interface SimpleDischargeSummaryProps {
  patientData: {
    // Basic Information
    name?: string;
    patientId?: string;
    primaryCareProvider?: string;
    registrationId?: string;
    sex?: string;
    age?: string;
    tariff?: string;
    mobileNo?: string;
    address?: string;
    admissionDate?: string;
    dischargeDate?: string;
    dischargeReason?: string;

    // Diagnosis
    diagnosis?: string;
    secondaryDiagnosis?: string;

    // Clinical Information
    chiefComplaints?: string;
    historyOfPresentIllness?: string;
    pastMedicalHistory?: string;
    allergies?: string;
    physicalExamination?: string;
    clinicalSummary?: string;

    // Vital Signs
    vitalSigns?: Array<string>;

    // Investigations
    labInvestigations?: Array<{
      name: string;
      result: string;
      status?: string;
    }>;
    radiologyInvestigations?: Array<{
      name: string;
      findings: string;
      status?: string;
    }>;
    otherInvestigations?: Array<string>;

    // Treatment & Procedures
    intraOperativeFindings?: string;
    treatmentCourse?: Array<string>;
    procedures?: Array<string>;

    // Medications
    medications?: Array<{
      name: string;
      strength: string;
      route: string;
      dosage: string;
      days: string;
    }>;

    // Discharge Information
    dischargeCondition?: Array<string>;
    caseSummary?: string;
    advice?: string;
    dietInstructions?: string;
    activityRestrictions?: string;
    woundCare?: string;
    warningSymptoms?: Array<string>;

    // Follow-up
    followUpDate?: string;
    reviewOn?: string;
    residentOnDischarge?: string;
    doctorName?: string;
    doctorSpecialty?: string;
    emergencyContact?: string;
  };
}

export default function SimpleDischargeSummary({ patientData }: SimpleDischargeSummaryProps) {
  const currentDate = new Date().toLocaleDateString('en-IN');
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Debug log to check data
  console.log('SimpleDischargeSummary received data:', patientData);

  return (
    <div className="discharge-summary-simple w-full bg-white p-4 print:p-2">
      {/* Header */}
      <div className="text-xs mb-2 flex justify-between print:text-[9px] print:mb-1">
        <span>{currentDate}, {currentTime} PM</span>
      </div>

      {/* Centered Discharge Summary Heading */}
      <div className="text-center mb-4 print:mb-3">
        <h1 className="text-xl font-bold print:text-[18px] print:font-bold">DISCHARGE SUMMARY</h1>
      </div>

      {/* Patient Details - Two Column Layout */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4 text-sm print:text-[11px] print:gap-x-6 print:gap-y-1 print:mb-3">
        <div className="space-y-3 print:space-y-2">
          <div className="flex">
            <span className="font-semibold w-40 print:w-36">Name</span>
            <span>: {patientData.name || 'test2'}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-40 print:w-36">Primary Care Provider</span>
            <span>: {patientData.primaryCareProvider || 'Dr. Unknown'}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-40 print:w-36">Sex / Age</span>
            <span>: {patientData.sex || 'female'} / {patientData.age || '11 Year'}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-40 print:w-36">Tariff</span>
            <span>: {patientData.tariff || 'Private'}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-40 print:w-36">Admission Date</span>
            <span>: {patientData.admissionDate || '9/22/2025'}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-40 print:w-36">Discharge Reason</span>
            <span>: {patientData.dischargeReason || 'Recovered'}</span>
          </div>
        </div>
        <div className="space-y-3 print:space-y-2">
          <div className="flex">
            <span className="font-semibold w-36 print:w-32">Patient ID</span>
            <span>: {patientData.patientId || 'UHAY25I22001'}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-36 print:w-32">Registration ID</span>
            <span>: {patientData.registrationId || 'IH25I22001'}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-36 print:w-32">Mobile No</span>
            <span>: {patientData.mobileNo || 'N/A'}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-36 print:w-32">Address</span>
            <span>: {patientData.address || 'N/A'}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-36 print:w-32">Discharge Date</span>
            <span>: {patientData.dischargeDate || '9/27/2025'}</span>
          </div>
        </div>
      </div>

      {/* Horizontal Line */}
      <hr className="border-black mb-2 print:mb-1" />

      {/* Present Condition */}
      <div className="mb-2 print:mb-1">
        <h2 className="text-sm font-bold print:text-[12pt] print:font-bold">Present Condition</h2>
        <div className="text-sm print:text-[10px]">
          <span className="font-semibold">Primary Diagnosis:</span> {patientData.diagnosis || 'Acute Cholecystitis'}
        </div>
        {patientData.secondaryDiagnosis && (
          <div className="text-sm print:text-[10px] mt-1">
            <span className="font-semibold">Secondary Diagnosis:</span> {patientData.secondaryDiagnosis}
          </div>
        )}
      </div>

      {/* Chief Complaints & History */}
      {(patientData.chiefComplaints || patientData.historyOfPresentIllness) && (
        <div className="mb-2 print:mb-1">
          <h2 className="text-sm font-bold print:text-[12pt] print:font-bold">Clinical History</h2>
          {patientData.chiefComplaints && (
            <div className="text-sm print:text-[10px] mb-1">
              <span className="font-semibold">Chief Complaints:</span> {patientData.chiefComplaints}
            </div>
          )}
          {patientData.historyOfPresentIllness && (
            <div className="text-sm print:text-[10px]">
              <span className="font-semibold">History of Present Illness:</span> {patientData.historyOfPresentIllness}
            </div>
          )}
        </div>
      )}

      {/* Vital Signs */}
      {patientData.vitalSigns && patientData.vitalSigns.length > 0 && (
        <div className="mb-2 print:mb-1">
          <h2 className="text-sm font-bold print:text-[12pt] print:font-bold">Vital Signs at Admission</h2>
          <ul className="list-disc pl-5 text-sm print:text-[10px]">
            {patientData.vitalSigns.map((vital, index) => (
              <li key={index}>{vital}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Laboratory Investigations */}
      {patientData.labInvestigations && patientData.labInvestigations.length > 0 && (
        <div className="mb-2 print:mb-1">
          <h2 className="text-sm font-bold print:text-[12pt] print:font-bold">Laboratory Investigations</h2>
          <div className="text-sm print:text-[10px]">
            {patientData.labInvestigations.map((lab, index) => (
              <div key={index} className="mb-1">
                • {lab.name}: {lab.result} {lab.status && `(${lab.status})`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Radiology Investigations */}
      {patientData.radiologyInvestigations && patientData.radiologyInvestigations.length > 0 && (
        <div className="mb-2 print:mb-1">
          <h2 className="text-sm font-bold print:text-[12pt] print:font-bold">Radiology Investigations</h2>
          <table className="w-full border border-black text-sm print:text-[9px] mb-2">
            <thead>
              <tr className="border-b border-black bg-gray-100 print:bg-gray-50">
                <th className="border-r border-black p-1 text-left print:p-1">Investigation</th>
                <th className="border-r border-black p-1 text-left print:p-1">Findings</th>
                <th className="p-1 text-left print:p-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {patientData.radiologyInvestigations.map((rad, index) => (
                <tr key={index} className="border-b border-black">
                  <td className="border-r border-black p-1 print:p-1">{rad.name}</td>
                  <td className="border-r border-black p-1 print:p-1">{rad.findings}</td>
                  <td className="p-1 print:p-1">{rad.status || 'Completed'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Treatment Course */}
      {patientData.treatmentCourse && patientData.treatmentCourse.length > 0 && (
        <div className="mb-2 print:mb-1">
          <h2 className="text-sm font-bold print:text-[12pt] print:font-bold">Treatment Course in Hospital</h2>
          <ul className="list-disc pl-5 text-sm print:text-[10px]">
            {patientData.treatmentCourse.map((treatment, index) => (
              <li key={index}>{treatment}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Intraoperative Findings */}
      {patientData.intraOperativeFindings && (
        <div className="mb-2 print:mb-1">
          <h2 className="text-sm font-bold print:text-[12pt] print:font-bold">Intraoperative Findings</h2>
          <p className="text-sm print:text-[10px]">{patientData.intraOperativeFindings}</p>
        </div>
      )}

      {/* Discharge Condition */}
      {patientData.dischargeCondition && patientData.dischargeCondition.length > 0 && (
        <div className="mb-2 print:mb-1">
          <h2 className="text-sm font-bold print:text-[12pt] print:font-bold">Discharge Condition</h2>
          <ul className="list-disc pl-5 text-sm print:text-[10px]">
            {patientData.dischargeCondition.map((condition, index) => (
              <li key={index}>{condition}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Medications Table */}
      <div className="mb-2 print:mb-1">
        <h2 className="text-sm font-bold print:text-[12pt] print:font-bold">Medications on Discharge:</h2>
        <table className="w-full border border-black text-sm print:text-[9px]">
          <thead>
            <tr className="border-b border-black">
              <th className="border-r border-black p-1 text-left print:p-1">Name</th>
              <th className="border-r border-black p-1 text-left print:p-1">Strength</th>
              <th className="border-r border-black p-1 text-left print:p-1">Route</th>
              <th className="border-r border-black p-1 text-left print:p-1">Dosage</th>
              <th className="p-1 text-left print:p-1">Number of Days to be taken</th>
            </tr>
          </thead>
          <tbody>
            {patientData.medications && patientData.medications.length > 0 ? (
              patientData.medications.map((med, index) => (
                <tr key={index} className="border-b border-black">
                  <td className="border-r border-black p-1 print:p-1">{med.name}</td>
                  <td className="border-r border-black p-1 print:p-1">{med.strength}</td>
                  <td className="border-r border-black p-1 print:p-1">{med.route}</td>
                  <td className="border-r border-black p-1 print:p-1">{med.dosage}</td>
                  <td className="p-1 print:p-1">{med.days}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-1 text-center italic print:p-1">
                  As per prescription provided separately
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Case Summary */}
      <div className="mb-2 print:mb-1">
        <h2 className="text-sm font-bold print:text-[12pt] print:font-bold">Case Summary:</h2>
        <p className="text-sm print:text-[10px]">{patientData.caseSummary || 'The patient was admitted with complaints of hernia as.'}</p>
      </div>

      {/* Horizontal Line */}
      <hr className="border-black mb-2 print:mb-1" />

      {/* ADVICE Section */}
      <div className="mb-3 print:mb-2">
        <h2 className="text-base font-bold mb-1 print:text-[12pt] print:font-bold print:mb-0">ADVICE</h2>
        <div className="text-sm mb-1 print:text-[10px] print:mb-0">
          <span className="italic">Advice:</span>
          <br />
          {patientData.advice || 'Follow up after 7 days/SOS'}
        </div>

        {/* Review Table */}
        <table className="w-full border border-black text-sm mt-1 print:text-[9px] print:mt-0">
          <thead>
            <tr className="border-b border-black">
              <th className="border-r border-black p-1 text-left print:p-1">Review on</th>
              <th className="p-1 text-left print:p-1">{patientData.reviewOn || '29/09/2025'}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-r border-black p-1 print:p-1">Resident On Discharge</td>
              <td className="p-1 print:p-1">{patientData.residentOnDischarge || 'Sachin Galbhardie'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Doctor Signature */}
      <div className="text-right mt-2 mb-2 text-sm print:mt-1 print:mb-1 print:text-[10px]">
        <p className="font-semibold">{patientData.doctorName || 'Dr. Dr. Nikhil Khodragade'} ({patientData.doctorSpecialty || 'Gastroenterologist'})</p>
      </div>

      {/* Horizontal Line */}
      <hr className="border-black mb-2 print:mb-1" />

      {/* Footer Note */}
      <div className="text-center text-xs mt-2 print:mt-1 print:text-[9px]">
        <p className="font-semibold">
          Note: URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7. PLEASE
          CONTACT: {patientData.emergencyContact || '7630974816, 9373111709'}.
        </p>
      </div>

      {/* Page Number - Will show on each printed page */}
      <div className="text-right text-xs mt-4 print:mt-8 print:text-[11px]">
        <span className="print:hidden">Page 1</span>
      </div>

      {/* Print-specific styles for this component */}
      <style>{`
        @media print {
          .discharge-summary-simple {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15px !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            page-break-before: auto !important;
            page-break-after: auto !important;
            overflow: visible !important;
            height: auto !important;
          }

          .discharge-summary-simple h1 {
            font-size: 18px !important;
            font-weight: bold !important;
            text-align: center !important;
            margin-bottom: 12px !important;
            padding-bottom: 8px !important;
            page-break-after: avoid !important;
          }

          .discharge-summary-simple h2 {
            font-size: 14px !important;
            margin-bottom: 8px !important;
            margin-top: 10px !important;
            page-break-after: avoid !important;
          }

          .discharge-summary-simple table {
            font-size: 11px !important;
            width: 100% !important;
            margin: 10px 0 !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }

          .discharge-summary-simple th,
          .discharge-summary-simple td {
            padding: 6px !important;
            line-height: 1.3 !important;
            font-size: 11px !important;
            page-break-inside: avoid !important;
          }

          .discharge-summary-simple thead {
            display: table-header-group !important;
          }

          .discharge-summary-simple tbody {
            display: table-row-group !important;
          }

          .discharge-summary-simple .text-sm {
            font-size: 12px !important;
          }

          .discharge-summary-simple .text-xs {
            font-size: 11px !important;
          }

          .discharge-summary-simple hr {
            margin: 10px 0 !important;
            border-width: 1px !important;
            page-break-after: avoid !important;
          }

          /* Ensure grids work properly */
          .discharge-summary-simple .grid {
            display: grid !important;
            gap: 8px !important;
          }

          .discharge-summary-simple .flex {
            display: flex !important;
          }

          /* Normal spacing for readability */
          .discharge-summary-simple > div {
            margin-bottom: 10px !important;
          }

          /* Restore normal section margins */
          .discharge-summary-simple .mb-4 { margin-bottom: 16px !important; }
          .discharge-summary-simple .mb-3 { margin-bottom: 12px !important; }
          .discharge-summary-simple .mb-2 { margin-bottom: 8px !important; }
          .discharge-summary-simple .mb-1 { margin-bottom: 4px !important; }
          .discharge-summary-simple .mt-4 { margin-top: 16px !important; }
          .discharge-summary-simple .mt-3 { margin-top: 12px !important; }
          .discharge-summary-simple .mt-2 { margin-top: 8px !important; }
          .discharge-summary-simple .mt-1 { margin-top: 4px !important; }

          /* Page settings for multi-page */
          @page {
            size: A4 portrait !important;
            margin: 0.75in 0.5in !important;
          }

          @page:first {
            margin-top: 0.5in !important;
          }

          /* Avoid breaking inside important sections */
          .discharge-summary-simple section,
          .discharge-summary-simple .patient-details,
          .discharge-summary-simple .present-condition {
            page-break-inside: avoid !important;
          }

          /* Force page break for very long content */
          .discharge-summary-simple .page-break-before {
            page-break-before: always !important;
          }

          /* Footer should stay at bottom of last page */
          .discharge-summary-simple .footer-note {
            margin-top: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}