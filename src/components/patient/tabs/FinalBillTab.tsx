
import React from 'react';
import { format } from 'date-fns';

interface FinalBillTabProps {
  patient: any;
  visits?: any[];
  billItems?: any[];
  onEditItem?: (item: any) => void;
  onDeleteItem?: (item: any) => void;
  onAddItem?: () => void;
  isEditing?: boolean;
}

const FinalBillTab: React.FC<FinalBillTabProps> = ({ 
  patient, 
  visits, 
  billItems, 
  onEditItem, 
  onDeleteItem, 
  onAddItem,
  isEditing = false 
}) => {
  const admissionDate = visits && visits.length > 0
    ? format(new Date(visits[0].visit_date), 'dd/MM/yyyy')
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
                <td className="border border-gray-300 p-2 text-center">28000</td>
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
            {/* Row 1 */}
            <tr>
              <td className="border border-gray-300 p-2 text-center">1)</td>
              <td className="border border-gray-300 p-2">
                <div className="font-medium">Pre-Surgical Consultation for Inpatients</div>
                <div className="text-xs text-gray-600">Dt.(04/03/2024 TO 09/03/2024)</div>
              </td>
              <td className="border border-gray-300 p-2 text-center">350</td>
              <td className="border border-gray-300 p-2 text-center">8</td>
              <td className="border border-gray-300 p-2 text-center">1</td>
              <td className="border border-gray-300 p-2 text-center">2800</td>
              <td className="border border-gray-300 p-2 text-center">
                <button className="text-red-500 hover:text-red-700">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </td>
            </tr>
            {/* Row 2 */}
            <tr>
              <td className="border border-gray-300 p-2 text-center">2)</td>
              <td className="border border-gray-300 p-2">
                <div className="font-medium">Surgical Package (7 Days)</div>
                <div className="text-xs text-gray-600">Dt.(10/03/2024 TO 16/03/2024)</div>
              </td>
              <td className="border border-gray-300 p-2 text-center">5000</td>
              <td className="border border-gray-300 p-2 text-center">1</td>
              <td className="border border-gray-300 p-2 text-center">1</td>
              <td className="border border-gray-300 p-2 text-center">5000</td>
              <td className="border border-gray-300 p-2 text-center">
                <button className="text-red-500 hover:text-red-700">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Total Section */}
      <div className="flex justify-end mb-6">
        <div className="w-64">
          <div className="border border-gray-300 p-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Total Amount:</span>
              <span>₹7,800</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Discount:</span>
              <span>₹0</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Net Amount:</span>
              <span>₹7,800</span>
            </div>
          </div>
        </div>
      </div>

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
