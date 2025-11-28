
import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const initialRow = {
  name: '',
  route: '',
  dose: '',
  times: ['', '', '', ''],
  column1: '',
  column2: '',
  administered: false,
};

interface TreatmentSheetFormProps {
  visitId?: string;
  onClose?: () => void;
}

export const TreatmentSheetForm: React.FC<TreatmentSheetFormProps> = ({ visitId, onClose }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [specialInstruction, setSpecialInstruction] = useState('');
  const [diet, setDiet] = useState('');
  const [consultant, setConsultant] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [date, setDate] = useState('');
  const [intensiveCare, setIntensiveCare] = useState('');
  const [rows, setRows] = useState([{ ...initialRow }]);
  const [fluid, setFluid] = useState('');
  const [rate, setRate] = useState('');
  const [otherInstruction, setOtherInstruction] = useState('');
  const [doctor, setDoctor] = useState('');
  const [signDate, setSignDate] = useState('');

  // Fetch patient and visit data
  useEffect(() => {
    if (visitId) {
      fetchTreatmentSheetData();
    } else {
      setLoading(false);
    }
  }, [visitId]);

  const fetchTreatmentSheetData = async () => {
    try {
      setLoading(true);

      // Fetch visit data with patient info
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select(`
          *,
          patient:patient_id (
            name,
            patients_id,
            date_of_birth,
            gender
          )
        `)
        .eq('visit_id', visitId)
        .single();

      if (visitError) throw visitError;

      if (visitData) {
        // Set patient info
        setPatientName(visitData.patient?.name || '');
        setRegNo(visitData.patient?.patients_id || '');
        setAdmissionDate(visitData.admission_date || visitData.created_at?.split('T')[0] || '');
        setConsultant(visitData.appointment_with || '');
        setDate(new Date().toISOString().split('T')[0]);

        // Fetch diagnosis from visit notes or other fields
        setDiagnosis(visitData.diagnosis || visitData.chief_complaint || '');
        setSpecialInstruction(visitData.special_instructions || '');
        setIntensiveCare(visitData.intensive_care_notes || '');
      }

      // Fetch medications for this visit
      const { data: medications, error: medError } = await supabase
        .from('visit_medications')
        .select(`
          *,
          medication:medication_id (
            name,
            generic_name,
            strength,
            dosage_form
          )
        `)
        .eq('visit_id', visitData.id)
        .eq('status', 'dispensed');

      if (!medError && medications && medications.length > 0) {
        const medicineRows = medications.map(med => ({
          name: `${med.medication?.name || ''} ${med.medication?.strength || ''}`,
          route: med.route || '',
          dose: med.dosage || '',
          times: ['', '', '', ''],
          column1: med.frequency || '',
          column2: med.duration || '',
          administered: false
        }));
        setRows(medicineRows);
      }

    } catch (error: any) {
      console.error('Error fetching treatment sheet data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load treatment sheet data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRowChange = (idx: number, field: string, value: any) => {
    setRows(rows => rows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const handleTimeChange = (idx: number, tIdx: number, value: string) => {
    setRows(rows => rows.map((row, i) => i === idx ? { ...row, times: row.times.map((t, j) => j === tIdx ? value : t) } : row));
  };

  const addRow = () => setRows([...rows, { ...initialRow }]);
  const removeRow = (idx: number) => setRows(rows => rows.filter((_, i) => i !== idx));

  return (
    <div className="bg-white p-6 rounded shadow max-w-4xl mx-auto relative">
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading treatment sheet...</p>
        </div>
      ) : (
        <>
      {/* Print Button Top Right */}
      <button
        className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-2 rounded shadow print:hidden flex items-center gap-2"
        onClick={() => window.print()}
        title="Print Treatment Sheet"
      >
        <Printer className="h-5 w-5" /> Print
      </button>
      {/* Print-specific styles for compact, bordered printout */}
      <style>{`
        @media print {
          body {
            background: white !important;
          }
          .print-compact-table, .print-compact-table th, .print-compact-table td {
            border: 1.5px solid black !important;
            border-collapse: collapse !important;
            font-size: 12px !important;
            padding: 2px 6px !important;
            background: white !important;
          }
          .print-compact-table th {
            font-weight: bold !important;
            text-align: center !important;
            text-decoration: underline;
          }
          .print-compact-table {
            width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .print-compact-header {
            font-size: 22px !important;
            font-weight: bold !important;
            text-align: center !important;
            text-decoration: underline;
            margin-bottom: 8px !important;
          }
          .print-compact-label {
            font-weight: bold !important;
          }
          .print-compact-row {
            page-break-inside: avoid !important;
          }
          .print-compact-section {
            margin-bottom: 2px !important;
            padding: 0 !important;
          }
          #print-patient-info-table {
            display: table !important;
            margin-bottom: 8px !important;
          }
          .print-hidden-print { display: none !important; }
          .print-compact-time { width: 40px !important; min-width: 0 !important; font-size: 12px !important; padding: 2px 0 !important; margin: 0 1px !important; border: 1px solid black !important; }
        }
      `}</style>
      <div className="text-2xl font-bold text-center mb-4 print-compact-header">TREATMENT SHEET</div>
      {/* Patient Info Section - compact table for print */}
      <div className="mb-4 print:hidden">
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div>
            <label className="font-semibold">Name Of The Patient :</label>
            <input className="border px-2 py-1 rounded w-full" value={patientName} onChange={e => setPatientName(e.target.value)} />
          </div>
          <div>
            <label className="font-semibold">Reg. No.:</label>
            <input className="border px-2 py-1 rounded w-full" value={regNo} onChange={e => setRegNo(e.target.value)} />
          </div>
          <div>
            <label className="font-semibold">Date of Admission:</label>
            <input type="date" className="border px-2 py-1 rounded w-full" value={admissionDate} onChange={e => setAdmissionDate(e.target.value)} />
          </div>
          <div>
            <label className="font-semibold">Special Instruction:</label>
            <input className="border px-2 py-1 rounded w-full" value={specialInstruction} onChange={e => setSpecialInstruction(e.target.value)} />
          </div>
          <div>
            <label className="font-semibold">Diet:</label>
            <input className="border px-2 py-1 rounded w-full" value={diet} onChange={e => setDiet(e.target.value)} />
          </div>
          <div>
            <label className="font-semibold">Consultant:</label>
            <input className="border px-2 py-1 rounded w-full" value={consultant} onChange={e => setConsultant(e.target.value)} />
          </div>
          <div>
            <label className="font-semibold">Diagnosis:</label>
            <input className="border px-2 py-1 rounded w-full" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
          </div>
          <div>
            <label className="font-semibold">Date:</label>
            <input type="date" className="border px-2 py-1 rounded w-full" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="font-semibold">Intensive care services:</label>
            <textarea className="border px-2 py-1 rounded w-full" value={intensiveCare} onChange={e => setIntensiveCare(e.target.value)} />
          </div>
        </div>
      </div>
      {/* Print-only compact patient info table */}
      <table className="w-full mb-2 print-compact-table" style={{ display: 'none' }} id="print-patient-info-table">
        <tbody>
          <tr>
            <td className="print-compact-label">Name Of The Patient :</td>
            <td>{patientName || '_________'}</td>
            <td className="print-compact-label">Reg. No.:</td>
            <td>{regNo || '_________'}</td>
          </tr>
          <tr>
            <td className="print-compact-label">Date of Admission:</td>
            <td>{admissionDate || '_________'}</td>
            <td className="print-compact-label">Special Instruction:</td>
            <td>{specialInstruction || '_________'}</td>
          </tr>
          <tr>
            <td className="print-compact-label">Diet:</td>
            <td>{diet || '_________'}</td>
            <td className="print-compact-label">Consultant:</td>
            <td>{consultant || '_________'}</td>
          </tr>
          <tr>
            <td className="print-compact-label">Diagnosis:</td>
            <td colSpan={3}>{diagnosis || '_________'}</td>
          </tr>
          <tr>
            <td className="print-compact-label">Date:</td>
            <td>{date || '_________'}</td>
            <td className="print-compact-label">&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
          <tr>
            <td className="print-compact-label" colSpan={1}>Intensive care services:</td>
            <td colSpan={3}>{intensiveCare || '_________'}</td>
          </tr>
        </tbody>
      </table>
      <div className="overflow-x-auto mb-2">
        <table className="min-w-full border border-gray-200 print-compact-table">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-2 py-1">Sr.No</th>
              <th className="px-2 py-1">Name of Medicine</th>
              <th className="px-2 py-1">Route</th>
              <th className="px-2 py-1">Dose</th>
              <th className="px-2 py-1">Time - Nurses Signature</th>
              <th className="px-2 py-1">Column 1</th>
              <th className="px-2 py-1">Column 2</th>
              <th className="px-2 py-1">Medication Administered</th>
              <th className="px-2 py-1 print:hidden">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td className="px-2 py-1 text-center">{idx + 1}</td>
                <td className="px-2 py-1"><input className="border px-2 py-1 rounded w-full" value={row.name} onChange={e => handleRowChange(idx, 'name', e.target.value)} /></td>
                <td className="px-2 py-1"><input className="border px-2 py-1 rounded w-full" value={row.route} onChange={e => handleRowChange(idx, 'route', e.target.value)} /></td>
                <td className="px-2 py-1"><input className="border px-2 py-1 rounded w-full" value={row.dose} onChange={e => handleRowChange(idx, 'dose', e.target.value)} /></td>
                <td className="px-2 py-1 text-center">
                  <div className="flex flex-row gap-1 justify-center items-center">
                    {row.times.map((time, tIdx) => (
                      <input key={tIdx} className="w-14 text-center border rounded px-1 py-1 print-compact-time" value={time} onChange={e => handleTimeChange(idx, tIdx, e.target.value)} placeholder={tIdx === 0 ? '6 AM' : tIdx === 1 ? '2 PM' : tIdx === 2 ? '6 PM' : '10 PM'} />
                    ))}
                  </div>
                </td>
                <td className="px-2 py-1"><input className="border px-2 py-1 rounded w-full" value={row.column1} onChange={e => handleRowChange(idx, 'column1', e.target.value)} /></td>
                <td className="px-2 py-1"><input className="border px-2 py-1 rounded w-full" value={row.column2} onChange={e => handleRowChange(idx, 'column2', e.target.value)} /></td>
                <td className="px-2 py-1 text-center">
                  <input type="checkbox" checked={row.administered} onChange={e => handleRowChange(idx, 'administered', e.target.checked)} />
                </td>
                <td className="px-2 py-1 text-center print:hidden">
                  <button className="text-red-500 font-bold" onClick={() => removeRow(idx)} title="Remove Row">✖</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="mt-2 bg-blue-500 text-white px-4 py-1 rounded print:hidden" onClick={addRow}>Add Row</button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-2">
        <div>
          <label className="font-semibold">Fluid</label>
          <input className="border px-2 py-1 rounded w-full" value={fluid} onChange={e => setFluid(e.target.value)} />
        </div>
        <div>
          <label className="font-semibold">Rate</label>
          <input className="border px-2 py-1 rounded w-full" value={rate} onChange={e => setRate(e.target.value)} />
        </div>
        <div>
          <label className="font-semibold">Other Instruction</label>
          <input className="border px-2 py-1 rounded w-full" value={otherInstruction} onChange={e => setOtherInstruction(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-4">
        <div className="flex-1">
          <label className="font-semibold">Signature/Name of Doctor :</label>
          <input className="border px-2 py-1 rounded w-full" value={doctor} onChange={e => setDoctor(e.target.value)} />
        </div>
        <div>
          <label className="font-semibold">Date/Time:</label>
          <input className="border px-2 py-1 rounded" value={signDate} onChange={e => setSignDate(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 mt-6 print:hidden">
        {onClose && (
          <button className="bg-gray-400 text-white px-4 py-2 rounded" onClick={onClose}>Close</button>
        )}
      </div>
      </>
      )}
    </div>
  );
};

export default TreatmentSheetForm;
