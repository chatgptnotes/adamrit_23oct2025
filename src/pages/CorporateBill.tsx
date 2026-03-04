import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/utils/supabase-client';
import { format } from 'date-fns';

interface BillItem {
  srNo: number;
  item: string;
  procedure: string;
  rate: number;
  qty: number;
  amount: number;
}

const CorporateBill = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const [loading, setLoading] = useState(true);
  const [patientInfo, setPatientInfo] = useState<any>({});
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (visitId) fetchBillData();
  }, [visitId]);

  const fetchBillData = async () => {
    try {
      setLoading(true);
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitId || '');
      let visit: any = null;

      if (isUUID) {
        const { data } = await supabase.from('visits').select('*, patients(*)').eq('id', visitId).single();
        visit = data;
      } else {
        const { data } = await supabase.from('visits').select('*, patients(*)').eq('visit_id', visitId).single();
        visit = data;
      }

      if (!visit) { setLoading(false); return; }

      const patient = visit.patients;
      const actualVisitId = visit.visit_id || visitId;

      const { data: surgeryOrders } = await supabase.from('visit_surgeries').select('*, cghs_surgery:surgery_id(*)').eq('visit_id', actualVisitId);
      const { data: labOrders } = await supabase.from('visit_labs').select('*, lab:lab_id(name, CGHS_code, private, "NABH_rates_in_rupee")').eq('visit_id', actualVisitId);
      const { data: radiologyOrders } = await supabase.from('visit_radiology').select('*, radiology:radiology_id(name, cost)').eq('visit_id', actualVisitId);
      const { data: clinicalServices } = await supabase.from('visit_clinical_services').select('*').eq('visit_id', actualVisitId);
      const { data: accommodationOrders } = await supabase.from('visit_accommodations').select('*, accommodation:accommodation_id(room_type, rate_per_day)').eq('visit_id', actualVisitId);
      const { data: implantOrders } = await supabase.from('visit_implants').select('*').eq('visit_id', actualVisitId);
      const { data: anesthetistOrders } = await supabase.from('visit_anesthetist').select('*').eq('visit_id', actualVisitId);

      setPatientInfo({
        patientName: patient?.name || 'N/A',
        ageSex: `${patient?.age || 'N/A'}Y / ${patient?.gender || 'N/A'}`,
        address: patient?.address || 'N/A',
        dateOfRegistration: patient?.created_at ? format(new Date(patient.created_at), 'dd-MM-yyyy') : 'N/A',
        dateOfDischarge: visit.discharge_date ? format(new Date(visit.discharge_date), 'dd-MM-yyyy') : 'N/A',
        dateOfInvoice: format(new Date(), 'dd-MM-yyyy'),
        invoiceNo: `BILL-${actualVisitId}`,
        registrationNo: actualVisitId || 'N/A',
        category: patient?.corporate || 'Private',
        primaryConsultant: visit.appointment_with || 'N/A',
      });
      setDiagnosis(visit.diagnosis || '');

      const items: BillItem[] = [];
      let srNo = 1;

      (surgeryOrders || []).forEach((order: any) => {
        const rate = order.rate && order.rate > 0 ? Number(order.rate) : parseFloat(String(order.cghs_surgery?.NABH_NABL_Rate || '0').replace(/[^\d.]/g, '')) || 0;
        items.push({ srNo: srNo++, item: 'SURGERY', procedure: order.cghs_surgery?.procedure_name || order.surgery_name || 'Surgery', rate, qty: 1, amount: rate });
      });

      (labOrders || []).forEach((order: any) => {
        const rate = order.cost || order.unit_rate || order.lab?.private || 0;
        items.push({ srNo: srNo++, item: 'LABORATORY', procedure: order.lab?.name || 'Lab Test', rate, qty: 1, amount: rate });
      });

      (radiologyOrders || []).forEach((order: any) => {
        const rate = parseFloat(order.cost) || parseFloat(order.unit_rate) || 0;
        items.push({ srNo: srNo++, item: 'RADIOLOGY', procedure: order.radiology?.name || 'Radiology', rate, qty: order.quantity || 1, amount: rate * (order.quantity || 1) });
      });

      (clinicalServices || []).forEach((service: any) => {
        const amount = parseFloat(service.amount) || parseFloat(service.rate_used) || 0;
        items.push({ srNo: srNo++, item: 'CLINICAL SERVICE', procedure: service.service_name || 'Clinical Service', rate: amount, qty: 1, amount });
      });

      (accommodationOrders || []).forEach((order: any) => {
        const rate = order.accommodation?.rate_per_day || 0;
        const start = new Date(order.start_date);
        const end = new Date(order.end_date || new Date());
        const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        items.push({ srNo: srNo++, item: 'ROOM CHARGES', procedure: order.accommodation?.room_type || 'Room', rate, qty: days, amount: rate * days });
      });

      (implantOrders || []).forEach((implant: any) => {
        const amount = parseFloat(implant.amount) || (implant.quantity * parseFloat(implant.rate)) || 0;
        items.push({ srNo: srNo++, item: 'IMPLANT', procedure: implant.implant_name || 'Implant', rate: parseFloat(implant.rate) || 0, qty: implant.quantity || 1, amount });
      });

      (anesthetistOrders || []).forEach((order: any) => {
        const rate = parseFloat(order.rate) || parseFloat(order.amount) || 0;
        items.push({ srNo: srNo++, item: 'ANESTHETIST', procedure: order.procedure_name || 'Anesthesia', rate, qty: 1, amount: rate });
      });

      while (items.length < 5) {
        items.push({ srNo: srNo++, item: '', procedure: '', rate: 0, qty: 0, amount: 0 });
      }

      setBillItems(items);
      setTotalAmount(items.reduce((sum, i) => sum + i.amount, 0));
    } catch (error) {
      console.error('Error fetching bill data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('lab_breakup').upsert({
        visit_id: visitId,
        patient_name: patientInfo.patientName,
        registration_no: patientInfo.registrationNo,
        corporate_name: patientInfo.category,
        hospital_name: 'Hope Hospital Nagpur',
        items: billItems.filter(i => i.item !== ''),
        total_amount: totalAmount,
        cghs_total: totalAmount,
        status: 'saved'
      }, { onConflict: 'visit_id' });
      if (error) throw error;
      alert('Yojna Bill saved successfully!');
    } catch (err: any) {
      alert('Error saving: ' + err.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading Yojna Bill...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="print:hidden mb-4 flex gap-3 items-center bg-gray-800 text-white p-3 rounded-lg">
        <button onClick={() => window.print()} className="px-4 py-2 bg-green-500 rounded font-bold hover:bg-green-600">Print</button>
        <button onClick={handleSave} className="px-4 py-2 bg-blue-500 rounded font-bold hover:bg-blue-600">Save to Database</button>
        <button onClick={() => window.history.back()} className="px-4 py-2 bg-red-500 rounded font-bold hover:bg-red-600">Back</button>
        <span className="text-sm text-gray-300 ml-2">Click any field to edit before printing</span>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none print:m-0">
        <div className="p-6 print:p-4" style={{ fontFamily: 'Arial, sans-serif' }}>

          <div className="text-center border-b-2 border-black pb-2 mb-0">
            <h1 className="text-xl font-bold tracking-wide">FINAL BILL</h1>
          </div>

          <table className="w-full text-sm border-collapse">
            <tbody>
              {[
                ['Name Of Patient', patientInfo.patientName],
                ['Age/Sex', patientInfo.ageSex],
                ['Address', patientInfo.address],
                ['Date Of Registration', patientInfo.dateOfRegistration],
                ['Date Of Discharge', patientInfo.dateOfDischarge],
                ['Date Of Invoice', patientInfo.dateOfInvoice],
                ['Invoice No.', patientInfo.invoiceNo],
                ['Registration No.', patientInfo.registrationNo],
                ['Category', patientInfo.category],
                ['Primary Consultant', patientInfo.primaryConsultant],
              ].map(([label, value], idx) => (
                <tr key={idx}>
                  <td className="py-1 font-semibold w-[200px] border border-gray-300 px-2 bg-green-50">{label}</td>
                  <td className="py-1 w-[10px] border border-gray-300 text-center">:</td>
                  <td className="py-1 border border-gray-300 px-2 font-medium" contentEditable suppressContentEditableWarning>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border border-gray-300 border-t-0 flex text-sm">
            <div className="font-semibold px-2 py-1 w-[200px] bg-green-50 border-r border-gray-300">Diagnosis</div>
            <div className="px-2 py-1 flex-1 italic" contentEditable suppressContentEditableWarning>{diagnosis || 'N/A'}</div>
          </div>

          <table className="w-full text-sm border-collapse mt-0">
            <thead>
              <tr className="bg-green-50">
                <th className="border border-gray-400 px-2 py-2 text-center w-[60px]">Sr. No.</th>
                <th className="border border-gray-400 px-2 py-2 text-center w-[100px]">Item</th>
                <th className="border border-gray-400 px-2 py-2 text-center">Procedure</th>
                <th className="border border-gray-400 px-2 py-2 text-center w-[80px]">Rate</th>
                <th className="border border-gray-400 px-2 py-2 text-center w-[50px]">Qty.</th>
                <th className="border border-gray-400 px-2 py-2 text-center w-[90px]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {billItems.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-400 px-2 py-2 text-center">{item.item ? item.srNo : ''}</td>
                  <td className="border border-gray-400 px-2 py-2 text-center font-medium" contentEditable suppressContentEditableWarning>{item.item}</td>
                  <td className="border border-gray-400 px-2 py-2 text-center text-xs" contentEditable suppressContentEditableWarning>{item.procedure}</td>
                  <td className="border border-gray-400 px-2 py-2 text-center" contentEditable suppressContentEditableWarning>{item.rate || ''}</td>
                  <td className="border border-gray-400 px-2 py-2 text-center" contentEditable suppressContentEditableWarning>{item.qty || ''}</td>
                  <td className="border border-gray-400 px-2 py-2 text-center font-bold" contentEditable suppressContentEditableWarning>{item.amount || ''}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="border border-gray-400 px-2 py-2 text-center" colSpan={5}>Total</td>
                <td className="border border-gray-400 px-2 py-2 text-center">{totalAmount}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 text-sm space-y-1">
            <div className="flex">
              <span className="font-semibold w-[200px]">Hospital Service Tax No.</span>
              <span className="w-[10px] text-center">:</span>
              <span className="ml-2 font-medium" contentEditable suppressContentEditableWarning>ABUPK3997PSD001</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-[200px]">Hospitals PAN</span>
              <span className="w-[10px] text-center">:</span>
              <span className="ml-2 font-medium" contentEditable suppressContentEditableWarning>AAECD9144P</span>
            </div>
          </div>

          <div className="mt-16 text-right text-sm">
            <p className="font-bold">Hope Hospital</p>
            <p className="font-semibold">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateBill;
