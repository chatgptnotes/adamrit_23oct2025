
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

interface Patient {
  name: string;
  primaryDiagnosis: string;
  complications: string;
  surgery: string;
  labs: string;
  radiology: string;
  labsRadiology: string;
  antibiotics: string;
  otherMedications: string;
  surgeon: string;
  consultant: string;
}

interface PatientReportProps {
  patientData: Record<string, Patient[]>;
}

export const PatientReport: React.FC<PatientReportProps> = ({ patientData }) => {
  const generateCSVReport = () => {
    // CSV header
    const headers = [
      'Diagnosis Category',
      'Patient Name',
      'Primary Diagnosis',
      'Complications',
      'Surgery/Procedure',
      'Labs',
      'Radiology',
      'Main Antibiotics',
      'Other Medications',
      'Operating Surgeon',
      'Consultant Physician'
    ];

    // Convert patient data to CSV rows
    const rows: string[][] = [headers];
    
    Object.entries(patientData).forEach(([diagnosis, patients]) => {
      patients.forEach(patient => {
        const row = [
          diagnosis,
          patient.name,
          patient.primaryDiagnosis,
          patient.complications,
          patient.surgery,
          patient.labs,
          patient.radiology,
          patient.antibiotics,
          patient.otherMedications,
          patient.surgeon,
          patient.consultant
        ];
        rows.push(row);
      });
    });

    // Convert to CSV string
    const csvContent = rows.map(row => 
      row.map(field => `"${field.replace(/"/g, '""')}"`)
    ).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ESIC_Patient_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPatients = Object.values(patientData).reduce((sum, patients) => sum + patients.length, 0);
  const totalDiagnoses = Object.keys(patientData).length;

  return (
    <div className="flex gap-2">
      <Button onClick={generateCSVReport} variant="outline">
        <FileDown className="h-4 w-4 mr-2" />
        Download CSV Report
      </Button>
    </div>
  );
};
