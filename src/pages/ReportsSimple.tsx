import React, { useState, useEffect } from 'react';
import { supabaseClient as supabase } from "@/utils/supabase-client";

interface PatientData {
  patient_name: string;
  patient_id: string;
  date_of_admission: string;
  date_of_discharge: string;
}

export default function ReportsSimple() {
  const [patientData, setPatientData] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patient_data')
        .select('patient_name, patient_id, date_of_admission, date_of_discharge')
        .order('sr_no', { ascending: true });

      if (error) {
        console.error('Error fetching patient data:', error);
        return;
      }

      setPatientData(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = () => {
    // Create CSV content with headers
    const headers = ['Patient Name', 'Patient ID', 'Date of Admission', 'Date of Discharge'];
    const csvContent = [
      headers.join(','),
      ...patientData.map(row => [
        `"${row.patient_name || ''}"`,
        `"${row.patient_id || ''}"`,
        `"${row.date_of_admission || ''}"`,
        `"${row.date_of_discharge || ''}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `patient_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading patient data...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Patient Reports</h1>
        <button
          onClick={handleExportToExcel}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          📊 Export to Excel
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date of Admission
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date of Discharge
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {patientData.map((patient, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {patient.patient_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.patient_id || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.date_of_admission || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.date_of_discharge || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {patientData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No patient data found</div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        Total Records: {patientData.length}
      </div>
    </div>
  );
}