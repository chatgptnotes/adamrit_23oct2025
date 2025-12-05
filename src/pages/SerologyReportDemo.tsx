import React from 'react';
import LabReportPrintFormat, { SEROLOGY_TESTS } from '@/components/lab/LabReportPrintFormat';

const SerologyReportDemo: React.FC = () => {
  return (
    <LabReportPrintFormat
      patientName="Yashwant Indurkar"
      patientAge="77"
      patientGender="Male"
      patientId="IPD/UNIVERSAL SOMPO GENERAL INSURANCE CO. LTD."
      reportDate="10/10/2025 16:39:41"
      reportType="Report on SEROLOGY"
      doctorName="Dr. Afzal Sheikh"
      doctorQualification="MD (Medicine)"
      tests={SEROLOGY_TESTS}
    />
  );
};

export default SerologyReportDemo;
