
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useFinalBillData } from '@/hooks/useFinalBillData';

interface FinalBillTabProps {
  patient: any;
  visits?: any[];
  billItems?: any[];
  visitId?: string;
  onEditItem?: (item: any) => void;
  onDeleteItem?: (item: any) => void;
  onAddItem?: () => void;
  isEditing?: boolean;
}

const isRadiologyItem = (description: string): boolean => {
  if (!description) return false;
  const radiologyKeywords = ['mri', 'ct', 'usg', 'x-ray', 'scan', 'ultrasound', 'radiology'];
  return radiologyKeywords.some(keyword => description.toLowerCase().includes(keyword));
};

const FinalBillTab: React.FC<FinalBillTabProps> = ({
  patient,
  visits,
  billItems: propBillItems,
  visitId = '',
  onEditItem,
  onDeleteItem,
  onAddItem,
  isEditing = false
}) => {
  const { billData } = useFinalBillData(visitId);

  // Fetch visit data for admission date
  const { data: visitData } = useQuery({
    queryKey: ['visit-data', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('visit_id', visitId)
        .maybeSingle();

      if (error) return null;
      return data;
    },
    enabled: !!visitId,
  });

  // Fetch radiology orders for this patient
  const { data: radiologyOrders = [] } = useQuery({
    queryKey: ['radiology-orders', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];

      const { data, error } = await supabase
        .from('radiology_orders')
        .select('*')
        .eq('patient_id', patient.id);

      if (error) throw error;

      return (data || []).filter(o => o.ordering_department === 'IPD');
    },
    enabled: !!patient?.id,
  });

  // Compute bill items reactively from both data sources
  const billItems = useMemo(() => {
    // 1. Start with saved DB items
    const dbItems = (billData?.line_items || []).map(item => ({
      id: item.id,
      srNo: item.sr_no,
      description: item.item_description,
      code: item.cghs_nabh_code || '',
      rate: item.cghs_nabh_rate || 0,
      qty: item.qty || 1,
      amount: item.amount || 0,
      type: item.item_type || 'standard',
    }));

    // 2. Convert radiology orders to bill items
    const radiologyItems = (radiologyOrders || [])
      .map(order => {
        const notes = order.notes || '';
        const typeMatch = notes.match(/Type:\s*([^.]+)/);
        const procMatch = notes.match(/Procedure:\s*([^.]+)/);
        const scanType = typeMatch ? typeMatch[1].trim() : '';
        const procedure = procMatch ? procMatch[1].trim() : 'Scan';
        const description = scanType ? `${scanType} – ${procedure}` : procedure;

        return {
          id: `radiology-${order.id}`,
          srNo: '',
          description,
          code: '',
          rate: order.estimated_cost || 0,
          qty: 1,
          amount: order.estimated_cost || 0,
          type: 'standard',
        };
      })
      .filter(item => !dbItems.some(db =>
        db.description.toLowerCase().includes(item.description.toLowerCase())
      ));

    return [...dbItems, ...radiologyItems];
  }, [billData, radiologyOrders]);

  const admissionDate = visitData?.date_of_admission
    ? format(new Date(visitData.date_of_admission), 'dd/MM/yyyy')
    : 'Not available';


  return (
    <div className="w-full bg-white p-6 border border-gray-300">
      {/* Complete Financial Summary UI - Above FINAL BILL */}
      <div className="mb-8 bg-white border border-gray-300 rounded-lg p-4 no-print">
        {/* Date Input and Start Package Button */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Date:</label>
            <input 
              type="date" 
              className="border border-gray-300 rounded px-3 py-1 text-sm"
              defaultValue={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm">
            Start Package
          </button>
        </div>

        {/* Financial Summary Table */}
        <div className="overflow-x-auto no-print">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-blue-100">
                <th className="border border-gray-300 p-2 text-center font-bold">Advance Payment</th>
                <th className="border border-gray-300 p-2 text-center font-bold">Clinical Services</th>
                <th className="border border-gray-300 p-2 text-center font-bold">Laboratory Services</th>
                <th className="border border-gray-300 p-2 text-center font-bold">Radiology</th>
                <th className="border border-gray-300 p-2 text-center font-bold">Pharmacy</th>
                <th className="border border-gray-300 p-2 text-center font-bold">Implant</th>
                <th className="border border-gray-300 p-2 text-center font-bold">Blood</th>
                <th className="border border-gray-300 p-2 text-center font-bold">Surgery</th>
                <th className="border border-gray-300 p-2 text-center font-bold">Mandatory services</th>
                <th className="border border-gray-300 p-2 text-center font-bold">Physiotherapy</th>
                <th className="border border-gray-300 p-2 text-center font-bold">Consultation</th>
                <th className="border border-gray-300 p-2 text-center font-bold">Surgery for Internal Report and Yojnas</th>
                <th className="border border-gray-300 p-2 text-center font-bold">Implant Cost</th>
                <th className="border border-gray-300 p-2 text-center font-bold">Private</th>
                <th className="border border-gray-300 p-2 text-center font-bold">Accommodation charges</th>
                <th className="border border-gray-300 p-2 text-center font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center">11276</td>
                <td className="border border-gray-300 p-2 text-center">6565</td>
                <td className="border border-gray-300 p-2 text-center font-semibold text-blue-700">
                  {billItems?.filter(item => isRadiologyItem(item.description || item.item_description || '')).reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString('en-IN') || '0'}
                </td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center">6100</td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center">10000</td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center">16200</td>
                <td className="border border-gray-300 p-2 text-center font-bold">78141</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center">2256</td>
                <td className="border border-gray-300 p-2 text-center">1315</td>
                <td className="border border-gray-300 p-2 text-center">200</td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center font-bold">3771</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-2 text-center">29000</td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center font-bold">29000</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center font-bold"></td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center">9020</td>
                <td className="border border-gray-300 p-2 text-center">5250</td>
                <td className="border border-gray-300 p-2 text-center">27800</td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center">6100</td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center">10000</td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center"></td>
                <td className="border border-gray-300 p-2 text-center">16200</td>
                <td className="border border-gray-300 p-2 text-center font-bold">45370</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Row Labels */}
        <div className="grid grid-cols-5 gap-4 mt-2 text-sm font-medium">
          <div className="text-center">Total Amount</div>
          <div className="text-center">Discount</div>
          <div className="text-center">Amount Paid</div>
          <div className="text-center">Refunded Amount</div>
          <div className="text-center">Balance</div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            Advance Payment
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            Invoice
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            Corporate Bill
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            Final Payment
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            P2 Form
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            Detailed Invoice
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-2xl font-bold mb-2 py-2 border-b border-gray-300">
          FINAL BILL
        </div>
        <div className="text-xl font-bold mb-2 py-2 border-b border-gray-300">
          ESIC
        </div>
        <div className="text-lg font-bold py-2">
          CLAIM ID - CLAIM-2025-1701
        </div>
      </div>

      {/* Patient Information */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div className="space-y-2 text-sm">
          <div><strong>BILL NO:</strong> BL340-2096</div>
          <div><strong>REGISTRATION NO:</strong> {/* Set to null/empty */}</div>
          <div><strong>NAME OF PATIENT:</strong> {patient?.name || 'N/A'}</div>
          <div><strong>AGE:</strong> {patient?.age || 'N/A'} YEARS</div>
          <div><strong>SEX:</strong> {patient?.gender || 'N/A'}</div>
          <div><strong>NAME OF ESIC BENEFICIARY:</strong> {patient?.name || 'N/A'}</div>
          <div><strong>RELATION WITH ESIC EMPLOYEE:</strong> SELF</div>
          <div><strong>RANK:</strong> Sep (RETD)</div>
          <div><strong>SERVICE NO:</strong> 12312807F</div>
          <div><strong>CATEGORY:</strong> <span className="bg-green-200 px-2 py-1 rounded text-xs">GENERAL</span></div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="text-right"><strong>DATE:</strong> {format(new Date(), 'dd/MM/yyyy')}</div>
          <div className="mt-8">
            <div><strong>DIAGNOSIS</strong></div>
            <div className="border border-gray-300 p-3 h-16 bg-gray-50 text-sm">
              {patient?.primaryDiagnosis || 'Abdominal Injury - Penetrating'}
            </div>
          </div>
          <div className="mt-4"><strong>DATE OF ADMISSION:</strong> {admissionDate}</div>
          <div><strong>DATE OF DISCHARGE:</strong> {patient?.dischargeDate ? format(new Date(patient.dischargeDate), 'dd/MM/yyyy') : 'Not discharged'}</div>
        </div>
      </div>

      {/* Items Table */}
      <div className="border border-gray-300 mb-6">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left font-bold w-16">SR NO</th>
              <th className="border border-gray-300 p-2 text-left font-bold">ITEM</th>
              <th className="border border-gray-300 p-2 text-left font-bold w-24">ESIC NABH CODE No.</th>
              <th className="border border-gray-300 p-2 text-left font-bold w-24">ESIC NABH RATE</th>
              <th className="border border-gray-300 p-2 text-left font-bold w-16">QTY</th>
              <th className="border border-gray-300 p-2 text-left font-bold w-24">AMOUNT</th>
              <th className="border border-gray-300 p-2 text-left font-bold w-20">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {billItems && billItems.length > 0 ? (
              billItems.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="border border-gray-300 p-2 text-center">{idx + 1})</td>
                  <td className="border border-gray-300 p-2">
                    <div className="font-medium">{item.description || item.item_description || 'Item'}</div>
                  </td>
                  <td className="border border-gray-300 p-2 text-center">{item.code || item.cghs_nabh_code || '—'}</td>
                  <td className="border border-gray-300 p-2 text-center">₹{(item.rate || item.cghs_nabh_rate || 0).toLocaleString('en-IN')}</td>
                  <td className="border border-gray-300 p-2 text-center">{item.qty || 1}</td>
                  <td className="border border-gray-300 p-2 text-center">₹{(item.amount || 0).toLocaleString('en-IN')}</td>
                  <td className="border border-gray-300 p-2 text-center"></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="border border-gray-300 p-4 text-center text-gray-500">
                  No bill items. Create or edit the bill to add items.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Total Section */}
      {(() => {
        const totalAmount = billItems?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
        const discount = 0;
        const netAmount = totalAmount - discount;
        return (
          <div className="flex justify-end mb-6">
            <div className="w-64">
              <div className="border border-gray-300 p-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Total Amount:</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Discount:</span>
                  <span>₹{discount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Net Amount:</span>
                  <span>₹{netAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Signature Section */}
      <div className="grid grid-cols-5 gap-4 text-center text-sm">
        <div>
          <div className="border-t-2 border-black pt-2 mt-8">
            <div className="font-medium">Bill Manager</div>
          </div>
        </div>
        <div>
          <div className="border-t-2 border-black pt-2 mt-8">
            <div className="font-medium">Cashier</div>
          </div>
        </div>
        <div>
          <div className="border-t-2 border-black pt-2 mt-8">
            <div className="font-medium">Patient/Attender Sign</div>
          </div>
        </div>
        <div>
          <div className="border-t-2 border-black pt-2 mt-8">
            <div className="font-medium">Med Supdt</div>
          </div>
        </div>
        <div>
          <div className="border-t-2 border-black pt-2 mt-8">
            <div className="font-medium">Authorised Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalBillTab;
