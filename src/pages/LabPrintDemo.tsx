import React from 'react';
import LabReportPrintFormat from '@/components/lab/LabReportPrintFormat';

const LabPrintDemo: React.FC = () => {
  // Sample lab test data
  const sampleTests = [
    {
      name: "CRP QUANTITATIVE",
      observedValue: "34 mg/L",
      normalRange: "- Up to 6.0 mg/L",
      description: "CRP is an acute phase reactant which is used in inflammatory disorders for monitoring course and effect of therapy. It is most useful as an indicator of activity in Rheumatoid arthritis, Rheumatic fever, tissue injury or necrosis and infections. As compared to ESR, CRP shows an earlier rise in inflammatory disorders which begins in 4-6 hrs, the intensity of the rise being higher than ESR and the recovery being earlier than ESR. Unlike ESR, CRP levels are not influenced by hematologic conditions like Anemia, Polycythemia etc."
    },
    {
      name: "BLOOD GLUCOSE FASTING",
      observedValue: "95 mg/dL",
      normalRange: "70 - 110 mg/dL",
      description: "Fasting blood glucose is used to diagnose diabetes mellitus and monitor glucose control in diabetic patients. Elevated levels may indicate diabetes, while low levels may suggest hypoglycemia."
    },
    {
      name: "HEMOGLOBIN",
      observedValue: "12.5 g/dL",
      normalRange: "12.0 - 16.0 g/dL (Female), 14.0 - 18.0 g/dL (Male)",
      description: "Hemoglobin is the protein in red blood cells that carries oxygen. Low levels may indicate anemia, while high levels may suggest polycythemia or dehydration."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <LabReportPrintFormat
        patientName="Rajesh Kumar"
        patientAge="45"
        patientGender="Male"
        patientId="P12345"
        reportDate={new Date().toLocaleDateString('en-IN')}
        reportType="Report on BIOCHEMISTRY"
        doctorName="DR. ARUN AGRE"
        doctorQualification="MD (PATHOLOGY)"
        tests={sampleTests}
      />
    </div>
  );
};

export default LabPrintDemo; 