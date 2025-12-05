import React, { useState } from 'react';
import { Printer, Eye, Edit, FileText, Trash2, Download } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const salesBills = [
  { billNo: 'SB-0553', mode: 'Credit', date: '17/04/2024', amt: 2071, paid: 0, disc: 0, netAmt: 2071 },
  { billNo: 'SB-0544', mode: 'Credit', date: '17/04/2024', amt: 258, paid: 0, disc: 0, netAmt: 258 },
  { billNo: 'SB-0578', mode: 'Credit', date: '17/04/2024', amt: 29, paid: 0, disc: 0, netAmt: 29 },
  { billNo: 'SB-0521', mode: 'Credit', date: '17/04/2024', amt: 435, paid: 0, disc: 0, netAmt: 435 },
  { billNo: 'SB-0493', mode: 'Credit', date: '16/04/2024', amt: 362, paid: 0, disc: 0, netAmt: 362 },
  { billNo: 'SB-0481', mode: 'Credit', date: '16/04/2024', amt: 307, paid: 0, disc: 0, netAmt: 307 },
];
const salesReturns = [
  { billNo: 'SR-1379', date: '17/04/2024', totalAmt: 125, returnAmt: 125, discount: 0 },
];

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const DaywiseBills: React.FC = () => {
  const query = useQuery();
  const patientId = query.get('id') || 'IH23D13024';
  const patientName = 'Ramkrishna Bagri'; // Dummy for now

  // Checkbox state for Sales Bill
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const allBillsSelected = selectedBills.length === salesBills.length && salesBills.length > 0;
  const toggleBill = (billNo: string) => {
    setSelectedBills(selected =>
      selected.includes(billNo)
        ? selected.filter(b => b !== billNo)
        : [...selected, billNo]
    );
  };
  const toggleAllBills = () => {
    if (allBillsSelected) setSelectedBills([]);
    else setSelectedBills(salesBills.map(b => b.billNo));
  };

  // Checkbox state for Sales Return
  const [selectedReturns, setSelectedReturns] = useState<string[]>([]);
  const allReturnsSelected = selectedReturns.length === salesReturns.length && salesReturns.length > 0;
  const toggleReturn = (billNo: string) => {
    setSelectedReturns(selected =>
      selected.includes(billNo)
        ? selected.filter(b => b !== billNo)
        : [...selected, billNo]
    );
  };
  const toggleAllReturns = () => {
    if (allReturnsSelected) setSelectedReturns([]);
    else setSelectedReturns(salesReturns.map(b => b.billNo));
  };

  // Only show prescriptions for selected bills
  const selectedPrescriptions = salesBills
    .filter(bill => selectedBills.includes(bill.billNo))
    .map((bill, idx) => ({
      patientName: 'Pratibha Deogade',
      regNo: bill.billNo,
      date: bill.date,
      rx: [
        { name: 'PANTOPRAZOLE-40MG+DOMPERIDONE-30 MG CAP', qty: 10 },
        { name: 'PYRIDOXINE HCL,NIACINAMIDE,CYANCOBALAMIN,FOLIC ACID,ZINC,SODIUM SELENATE TAB', qty: 7 },
        { name: 'Domperidone (10mg) + Ranitidine (150mg)', qty: 6 },
        { name: 'CEFIXIME (200MG)', qty: 6 },
        { name: 'DICLOFENAC', qty: 1 },
      ],
      doctor: 'B K Murali, MS (Orth.)',
    }));

  // Print handler for prescription
  const handlePrescriptionPrint = () => {
    window.print();
  };

  // Group prescriptions in pairs for 2 per page
  const prescriptionPairs = [];
  for (let i = 0; i < selectedPrescriptions.length; i += 2) {
    prescriptionPairs.push(selectedPrescriptions.slice(i, i + 2));
  }

  const openPrintWindow = (bill) => {
    // Create a new window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;
    // Simple bill HTML (customize as needed)
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Bill - ${bill.billNo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .bill-header { font-size: 20px; font-weight: bold; margin-bottom: 20px; }
            .bill-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .bill-table th, .bill-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            .bill-table th { background: #f0f0f0; }
            .total { font-size: 18px; font-weight: bold; text-align: right; }
          </style>
        </head>
        <body>
          <div class="bill-header">Pharmacy Bill</div>
          <div><b>Bill No:</b> ${bill.billNo}</div>
          <div><b>Date:</b> ${bill.date}</div>
          <div><b>Mode:</b> ${bill.mode}</div>
          <table class="bill-table">
            <tr><th>Amount</th><th>Paid</th><th>Discount</th><th>Net Amount</th></tr>
            <tr>
              <td>${bill.amt.toFixed(2)}</td>
              <td>${bill.paid.toFixed(2)}</td>
              <td>${bill.disc.toFixed(2)}</td>
              <td>${bill.netAmt.toFixed(2)}</td>
            </tr>
          </table>
          <div class="total">Total: Rs ${bill.netAmt.toFixed(2)}</div>
          <script>window.onload = function() { window.print(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white rounded shadow p-2 border print:p-2 print:shadow-none print:border-black min-h-screen">
      {/* Normal content (hidden in print) */}
      <div className="print:hidden">
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold text-lg">Patient Name : <span className="text-blue-700">{patientName}</span></div>
          <button className="bg-blue-500 text-white px-3 py-1 rounded print:hidden flex items-center gap-2" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</button>
        </div>
        <div className="mb-2 text-sm text-gray-600">Patient ID: <span className="font-mono">{patientId}</span></div>
        {/* Sales Bill Table */}
        <div className="rounded border mb-4 overflow-x-auto print:overflow-visible">
          <div className="bg-gray-200 font-semibold text-center py-1 border-b">Sales Bill</div>
          <table className="w-full text-sm print-compact-table">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1 print:hidden">
                  <input type="checkbox" className="print:hidden" checked={allBillsSelected} onChange={toggleAllBills} />
                </th>
                <th className="border px-2 py-1">Bill No.</th>
                <th className="border px-2 py-1">Mode</th>
                <th className="border px-2 py-1">Date</th>
                <th className="border px-2 py-1">Amt.</th>
                <th className="border px-2 py-1">Paid</th>
                <th className="border px-2 py-1">Disc</th>
                <th className="border px-2 py-1">Net Amt</th>
                <th className="border px-2 py-1 print:hidden">Action</th>
              </tr>
            </thead>
            <tbody>
              {salesBills.map((bill, idx) => (
                <tr key={bill.billNo} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-2 py-1 text-center print:hidden">
                    <input type="checkbox" className="print:hidden" checked={selectedBills.includes(bill.billNo)} onChange={() => toggleBill(bill.billNo)} />
                  </td>
                  <td className="border px-2 py-1 font-mono">{bill.billNo}</td>
                  <td className="border px-2 py-1">{bill.mode}</td>
                  <td className="border px-2 py-1">{bill.date}</td>
                  <td className="border px-2 py-1 text-right">{bill.amt.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-right">{bill.paid.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-right">{bill.disc.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-right">{bill.netAmt.toFixed(2)}</td>
                  <td className="border px-2 py-1 flex gap-1 justify-center print:hidden">
                    <button title="View"><Eye className="h-4 w-4 text-blue-600" /></button>
                    <button title="Edit"><Edit className="h-4 w-4 text-green-600" /></button>
                    <button title="Download"><Download className="h-4 w-4 text-indigo-600" /></button>
                    <button title="Print" onClick={() => openPrintWindow(bill)}><Printer className="h-4 w-4 text-gray-700" /></button>
                    <button title="Delete"><Trash2 className="h-4 w-4 text-red-600" /></button>
                  </td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className="font-bold bg-gray-200">
                <td className="border px-2 py-1 text-right print:hidden" colSpan={4}>Total :</td>
                <td className="border px-2 py-1 text-right">{salesBills.reduce((sum, b) => sum + b.amt, 0).toFixed(2)}</td>
                <td className="border px-2 py-1 text-right">{salesBills.reduce((sum, b) => sum + b.paid, 0).toFixed(2)}</td>
                <td className="border px-2 py-1 text-right">{salesBills.reduce((sum, b) => sum + b.disc, 0).toFixed(2)}</td>
                <td className="border px-2 py-1 text-right">{salesBills.reduce((sum, b) => sum + b.netAmt, 0).toFixed(2)}</td>
                <td className="border px-2 py-1 print:hidden">
                  <button title="Print Prescription" onClick={handlePrescriptionPrint} className="text-gray-700 hover:text-black">
                    <Printer className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Sales Return Table */}
        <div className="rounded border mb-2 overflow-x-auto print:overflow-visible">
          <div className="bg-gray-200 font-semibold text-center py-1 border-b">Sales Return</div>
          <table className="w-full text-sm print-compact-table">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Bill No.</th>
                <th className="border px-2 py-1">Date</th>
                <th className="border px-2 py-1">Total Amt</th>
                <th className="border px-2 py-1">Return Amt</th>
                <th className="border px-2 py-1">Discount(Rs)</th>
                <th className="border px-2 py-1 print:hidden">Action</th>
              </tr>
            </thead>
            <tbody>
              {salesReturns.map((ret, idx) => (
                <tr key={ret.billNo} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-2 py-1 font-mono">{ret.billNo}</td>
                  <td className="border px-2 py-1">{ret.date}</td>
                  <td className="border px-2 py-1 text-right">{ret.totalAmt.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-right">{ret.returnAmt.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-right">{ret.discount.toFixed(2)}</td>
                  <td className="border px-2 py-1 flex gap-1 justify-center print:hidden">
                    <button title="View"><Eye className="h-4 w-4 text-blue-600" /></button>
                    <button title="Edit"><Edit className="h-4 w-4 text-green-600" /></button>
                    <button title="Download"><Download className="h-4 w-4 text-indigo-600" /></button>
                    <button title="Print"><Printer className="h-4 w-4 text-gray-700" /></button>
                    <button title="Delete"><Trash2 className="h-4 w-4 text-red-600" /></button>
                  </td>
                </tr>
              ))}
              <tr className="font-bold bg-gray-100">
                <td className="border px-2 py-1 text-right print:hidden" colSpan={2}>Total :</td>
                <td className="border px-2 py-1 text-right">{salesReturns.reduce((sum, r) => sum + r.totalAmt, 0).toFixed(2)}</td>
                <td className="border px-2 py-1 text-right">{salesReturns.reduce((sum, r) => sum + r.returnAmt, 0).toFixed(2)}</td>
                <td className="border px-2 py-1 text-right">{salesReturns.reduce((sum, r) => sum + r.discount, 0).toFixed(2)}</td>
                <td className="border px-2 py-1 print:hidden"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* Prescription Print Layout (hidden on screen, visible in print) */}
      <div className="hidden print:block">
        {prescriptionPairs.map((pair, pageIdx) => (
          <div key={pageIdx} className="flex flex-row justify-between w-full print:gap-8 print:px-8 print:mb-0 print:break-after-page" style={{ pageBreakAfter: 'always' }}>
            {pair.map((presc, idx) => (
              <div key={idx} className="w-1/2 px-4 print:px-4" style={{ minWidth: '350px', maxWidth: '420px' }}>
                <div className="flex items-center justify-between mb-2">
                  <img src="/NABH-LOGO.png" alt="NABH" className="h-12" />
                  <div className="text-xl font-bold underline mx-2">Prescription</div>
                  <img src="/hope_logo.png" alt="Hope Hospitals" className="h-10" />
                </div>
                <div className="flex justify-between mb-1">
                  <div>
                    <div>Patient Name : <b>{presc.patientName}</b></div>
                    <div>Registration Number : <b>{presc.regNo}</b></div>
                  </div>
                  <div>Date : <b>{presc.date}</b></div>
                </div>
                <hr className="my-1 border-black" />
                <div className="mb-1 mt-2 font-semibold">Rx</div>
                <table className="w-full text-sm mb-2">
                  <tbody>
                    {presc.rx.map((med, i) => (
                      <tr key={i}>
                        <td className="align-top pr-2">{med.name}</td>
                        <td className="text-right pl-2">{med.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-8 font-bold border-t border-black pt-2 text-base">{presc.doctor}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <style>{`
        @media print {
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
          .print\:block { display: block !important; }
          .print\:gap-8 { gap: 2rem !important; }
          .print\:px-8 { padding-left: 2rem !important; padding-right: 2rem !important; }
          .print\:px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
          .print\:hidden { display: none !important; }
          .print\:break-after-page { break-after: page !important; page-break-after: always !important; }
        }
      `}</style>
    </div>
  );
};

export default DaywiseBills;