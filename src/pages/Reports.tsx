
import React, { useState, useEffect } from 'react';

interface PatientData {
  patient_name: string;
  patient_id: string;
  date_of_admission: string;
  date_of_discharge: string;
}

export default function Reports() {
  const [patientData, setPatientData] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      // Direct fetch to avoid Supabase client issues
      const response = await fetch(
        `https://xvkxccqaopbnkvwgyfjv.supabase.co/rest/v1/patient_data?select=patient_name,patient_id,date_of_admission,date_of_discharge&order=sr_no.asc`,
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPatientData(data || []);
      } else {
        console.error('Error fetching data:', response.statusText);
      }
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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading patient data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Commenting out the entire Patient Reports content */}
        {/* <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Patient Reports</h1>
          <button
            onClick={handleExportToExcel}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to Excel
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
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
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
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
          </div>

          {patientData.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No patient data found</div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow">
          <div>
            Total Records: <span className="font-semibold text-gray-900">{patientData.length}</span>
          </div>
            Last Updated: <span className="font-semibold text-gray-900">{new Date().toLocaleString()}</span>
          </div>
        </div> */}

        {/* Display a placeholder message instead of the patient reports table */}
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-400 mb-2">Patient Reports</h2>
            <p className="text-gray-500">This section has been temporarily disabled</p>
          </div>
        </div>
      </div>
    </div>
  );
}
