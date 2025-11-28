import { usePatientData } from '../hooks/usePatientData';

export function PatientTable() {
  const { data: patients, isLoading, error } = usePatientData();

  if (isLoading) return <div>Loading patients...</div>;
  if (error) return <div>Error loading patients!</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 border">Sr.No.</th>
            <th className="px-4 py-2 border">Patient Name</th>
            <th className="px-4 py-2 border">SST or Secondary Treatment</th>
            <th className="px-4 py-2 border">MRN</th>
            <th className="px-4 py-2 border">Patient ID</th>
            <th className="px-4 py-2 border">Age</th>
            <th className="px-4 py-2 border">Referral Original Yes/No</th>
            <th className="px-4 py-2 border">E-Pahachan Card Yes/No</th>
            <th className="px-4 py-2 border">Entitlement benefits Yes</th>
            <th className="px-4 py-2 border">Adhar Card Yes/No</th>
            <th className="px-4 py-2 border">Sex</th>
            <th className="px-4 py-2 border">Patient Type</th>
            <th className="px-4 py-2 border">Reff Dr. Name</th>
            <th className="px-4 py-2 border">Date Of Admission</th>
          </tr>
        </thead>
        <tbody>
          {patients?.map((patient) => (
            <tr key={patient.patientId} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">{patient.srNo}</td>
              <td className="px-4 py-2 border">{patient.patientName}</td>
              <td className="px-4 py-2 border">{patient.sstOrSecondaryTreatment}</td>
              <td className="px-4 py-2 border">{patient.mrn}</td>
              <td className="px-4 py-2 border">{patient.patientId}</td>
              <td className="px-4 py-2 border">{patient.age}</td>
              <td className="px-4 py-2 border">{patient.referralOriginalYesNo}</td>
              <td className="px-4 py-2 border">{patient.ePahachanCardYesNo}</td>
              <td className="px-4 py-2 border">{patient.entitlementBenefitsYes}</td>
              <td className="px-4 py-2 border">{patient.adharCardYesNo}</td>
              <td className="px-4 py-2 border">{patient.sex}</td>
              <td className="px-4 py-2 border">{patient.patientType}</td>
              <td className="px-4 py-2 border">{patient.reffDrName}</td>
              <td className="px-4 py-2 border">{patient.dateOfAdmission}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 