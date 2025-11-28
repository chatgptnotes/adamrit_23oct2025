import React, { useState, useEffect } from 'react';
import TreatmentSheetForm from './TreatmentSheetForm';
import TreatmentSheetPrintView from './TreatmentSheetPrintView';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const dummyData = [
  {
    name: 'Shankar Patel',
    id: 'IH23D13024',
    tariff: 'Private',
    total: 0,
    paid: 0,
    discount: 0,
    refund: 0,
    return: 0,
    bal: 0,
  },
  {
    name: 'Amit Sharma',
    id: 'IH23D13025',
    tariff: 'ESIC',
    total: 1000,
    paid: 800,
    discount: 50,
    refund: 0,
    return: 0,
    bal: 150,
  },
  {
    name: 'Priya Singh',
    id: 'IH23D13026',
    tariff: 'Private',
    total: 500,
    paid: 500,
    discount: 0,
    refund: 0,
    return: 0,
    bal: 0,
  },
  {
    name: 'Rahul Verma',
    id: 'IH23D13027',
    tariff: 'ESIC',
    total: 200,
    paid: 100,
    discount: 20,
    refund: 0,
    return: 0,
    bal: 80,
  },
];

export const SalesDetails: React.FC = () => {
  const [billNo, setBillNo] = useState('');
  const [patientName, setPatientName] = useState('');
  const [allEncounter, setAllEncounter] = useState(false);
  const [date, setDate] = useState('');
  const navigate = useNavigate();
  const { hospitalConfig } = useAuth();

  // Patient search state
  const [patientResults, setPatientResults] = useState<{name: string, patients_id: string}[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Table data state
  const [tableData, setTableData] = useState<any[]>([]);

  // Selected patient for viewing bills
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSales, setPatientSales] = useState<any[]>([]);
  const [patientReturns, setPatientReturns] = useState<any[]>([]);
  const [showSidePanel, setShowSidePanel] = useState(false);

  // Treatment Sheet dialog
  const [showTreatmentSheet, setShowTreatmentSheet] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  // Fetch patients as user types
  useEffect(() => {
    const fetchPatients = async () => {
      if (patientName.length < 2) {
        setPatientResults([]);
        setShowDropdown(false);
        return;
      }
      setIsLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('name, patients_id')
        .or(`name.ilike.%${patientName}%,patients_id.ilike.%${patientName}%`)
        .limit(10);
      if (!error && data) {
        setPatientResults(data);
        setShowDropdown(true);
      } else {
        setPatientResults([]);
        setShowDropdown(false);
      }
      setIsLoading(false);
    };
    fetchPatients();
  }, [patientName]);

  const handleSelectPatient = (patient: {name: string, patients_id: string}) => {
    setPatientName(`${patient.name} (${patient.patients_id})`);
    setShowDropdown(false);
  };

  // Don't fetch sales data on mount - only on search
  // useEffect(() => {
  //   const fetchSales = async () => {
  //     const { data, error } = await supabase
  //       .from('pharmacy_sales')
  //       .select('*')
  //       .order('sale_date', { ascending: false });
  //     if (!error && data) {
  //       setTableData(data);
  //     } else {
  //       setTableData([]);
  //     }
  //   };
  //   fetchSales();
  // }, []);

  // Search handler for patient or bill
  const handlePatientSearch = async () => {
    if (!patientName.trim() && !billNo.trim() && !date) {
      // If no search criteria, show empty table
      setTableData([]);
      return;
    }
    let query = supabase.from('pharmacy_sales').select('*');

    // Filter by hospital
    if (hospitalConfig?.name) {
      query = query.eq('hospital_name', hospitalConfig.name);
    }

    if (patientName.trim()) {
      // Extract patient ID from format "Name (ID)" if present
      const match = patientName.match(/\(([^)]+)\)/);
      if (match) {
        query = query.eq('patient_id', match[1]);
      } else {
        query = query.ilike('patient_name', `%${patientName.trim()}%`);
      }
    }

    if (billNo.trim()) {
      query = query.eq('sale_id', parseInt(billNo.trim()));
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query = query.gte('sale_date', startDate.toISOString()).lte('sale_date', endDate.toISOString());
    }

    const { data, error } = await query.order('sale_date', { ascending: false });
    setTableData(!error && data ? data : []);
  };

  const totalBalance = dummyData.reduce((sum, row) => sum + row.bal, 0);

  // Fetch all bills for a patient
  const handleViewPatientBills = async (row: any) => {
    setSelectedPatient(row);
    setShowSidePanel(true);

    // Fetch all sales for this patient (with hospital filter)
    let salesQuery = supabase
      .from('pharmacy_sales')
      .select('*')
      .eq('patient_id', row.patient_id);

    // Filter by hospital
    if (hospitalConfig?.name) {
      salesQuery = salesQuery.eq('hospital_name', hospitalConfig.name);
    }

    const { data: salesData, error: salesError } = await salesQuery.order('sale_date', { ascending: false });

    if (!salesError && salesData) {
      setPatientSales(salesData);
    } else {
      setPatientSales([]);
    }

    // Fetch returns (if you have a returns table - placeholder for now)
    // const { data: returnsData } = await supabase
    //   .from('pharmacy_returns')
    //   .select('*')
    //   .eq('patient_id', row.patient_id);
    // setPatientReturns(returnsData || []);
    setPatientReturns([]); // Empty for now
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);

  const printBill = (sale: any, items: any[]) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pharmacy Bill</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0;
            font-size: 12px;
          }
          .bill-info {
            margin: 20px 0;
          }
          .bill-info table {
            width: 100%;
          }
          .bill-info td {
            padding: 5px 0;
          }
          .bill-info td:first-child {
            font-weight: bold;
            width: 150px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          .items-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .items-table td:last-child,
          .items-table th:last-child {
            text-align: right;
          }
          .totals {
            margin-top: 20px;
            float: right;
            width: 300px;
          }
          .totals table {
            width: 100%;
          }
          .totals td {
            padding: 5px 0;
          }
          .totals td:first-child {
            text-align: left;
          }
          .totals td:last-child {
            text-align: right;
          }
          .totals .grand-total {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 10px;
          }
          .footer {
            clear: both;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #000;
            text-align: center;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${hospitalConfig?.name || 'Hospital Pharmacy'}</h1>
          <p>${hospitalConfig?.address || 'Hospital Address'}</p>
          <p>Phone: ${hospitalConfig?.phone || 'N/A'} | Email: ${hospitalConfig?.email || 'N/A'}</p>
        </div>

        <div class="bill-info">
          <table>
            <tr>
              <td>Bill Number:</td>
              <td>${sale.sale_id}</td>
            </tr>
            <tr>
              <td>Date & Time:</td>
              <td>${sale.sale_date ? new Date(sale.sale_date).toLocaleString() : ''}</td>
            </tr>
            ${sale.patient_name ? `
            <tr>
              <td>Patient Name:</td>
              <td>${sale.patient_name}</td>
            </tr>
            ` : ''}
            ${sale.patient_id ? `
            <tr>
              <td>Patient ID:</td>
              <td>${sale.patient_id}</td>
            </tr>
            ` : ''}
            <tr>
              <td>Payment Method:</td>
              <td>${sale.payment_method || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Medicine Name</th>
              <th>Batch</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Disc</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>
                  <strong>${item.medication_name || item.medicine_name}</strong><br>
                  <small>${item.generic_name || ''} ${item.strength ? '- ' + item.strength : ''}</small>
                </td>
                <td>${item.batch_number || 'N/A'}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unit_price || 0)}</td>
                <td>${item.discount_percentage > 0 ? item.discount_percentage + '%' : '-'}</td>
                <td>${formatCurrency(item.total_amount || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td>Subtotal:</td>
              <td>${formatCurrency(sale.subtotal || 0)}</td>
            </tr>
            <tr>
              <td>Discount:</td>
              <td>-${formatCurrency(sale.discount || 0)}</td>
            </tr>
            <tr>
              <td>Tax (GST):</td>
              <td>${formatCurrency(sale.tax_gst || 0)}</td>
            </tr>
            <tr class="grand-total">
              <td>TOTAL:</td>
              <td>${formatCurrency(sale.total_amount || 0)}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>For any queries, please contact the pharmacy</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  const handlePrintBill = async (sale: any) => {
    const { data, error } = await supabase
      .from('pharmacy_sale_items')
      .select('*')
      .eq('sale_id', sale.sale_id);

    if (!error && data) {
      printBill(sale, data);
    }
  };

  const handleOpenTreatmentSheet = (visitId: string) => {
    setSelectedVisitId(visitId);
    setShowTreatmentSheet(true);
  };

  return (
    <div className="p-4 flex gap-4">
      {/* Left Side - Patient List */}
      <div className={showSidePanel ? "w-1/2" : "w-full"}>
        {/* Sales Details Title */}
        <div className="text-lg font-bold text-cyan-700 mb-2">Sales Details</div>
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-2 rounded mb-2">
        <label className="font-semibold">Bill No.</label>
        <input
          className="border px-2 py-1 rounded min-w-[180px]"
          placeholder="Type To Search"
          value={billNo}
          onChange={e => setBillNo(e.target.value)}
        />
        <label className="font-semibold ml-4">Patient Name/ID</label>
        <div className="relative min-w-[180px]">
        <input
            className="border px-2 py-1 rounded w-full"
          placeholder="Type To Search"
          value={patientName}
          onChange={e => setPatientName(e.target.value)}
            onFocus={() => { if (patientResults.length > 0) setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          />
          {showDropdown && (
            <div className="absolute z-10 bg-white border rounded w-full max-h-48 overflow-y-auto shadow">
              {isLoading && <div className="p-2 text-gray-500">Loading...</div>}
              {!isLoading && patientResults.length === 0 && <div className="p-2 text-gray-500">No results</div>}
              {!isLoading && patientResults.map((p) => (
                <div
                  key={p.patients_id}
                  className="p-2 hover:bg-blue-100 cursor-pointer"
                  onMouseDown={() => handleSelectPatient(p)}
                >
                  <span className="font-semibold">{p.name}</span> <span className="text-xs text-gray-500">({p.patients_id})</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <label className="flex items-center ml-4">
          <input
            type="checkbox"
            className="mr-1"
            checked={allEncounter}
            onChange={e => setAllEncounter(e.target.checked)}
          />
          All Encounter
        </label>
        <label className="font-semibold ml-4">Date</label>
        <input
          type="date"
          className="border px-2 py-1 rounded"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-1 rounded ml-2" onClick={handlePatientSearch}>Search</button>
        <button className="bg-blue-500 text-white px-4 py-1 rounded ml-2">Back</button>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead>
            <tr className="bg-gray-400 text-white">
              <th className="px-2 py-1 text-left">Bill No.</th>
              <th className="px-2 py-1 text-left">Patient Name/ID</th>
              <th className="px-2 py-1 text-left">Total</th>
              <th className="px-2 py-1 text-left">Paid</th>
              <th className="px-2 py-1 text-left">Discount</th>
              <th className="px-2 py-1 text-left">Date</th>
              <th className="px-2 py-1 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => (
              <tr key={row.sale_id || idx} className="bg-gray-200 border-b">
                <td className="px-2 py-1">{row.sale_id}</td>
                <td className="px-2 py-1">
                  <div className="font-semibold">{row.patient_name}</div>
                  <div className="text-xs text-gray-700">{row.patient_id}</div>
                </td>
                <td className="px-2 py-1">{row.total_amount?.toFixed(2) ?? '0.00'}</td>
                <td className="px-2 py-1">{row.total_amount?.toFixed(2) ?? '0.00'}</td>
                <td className="px-2 py-1">{row.discount?.toFixed(2) ?? '0.00'}</td>
                <td className="px-2 py-1">{row.sale_date ? new Date(row.sale_date).toLocaleDateString() : ''}</td>
                <td className="px-2 py-1 flex gap-1">
                  <span title="View Bills" className="cursor-pointer text-blue-600" onClick={() => handleViewPatientBills(row)}>👁️</span>
                  <span title="Print Bill" className="cursor-pointer" onClick={() => handlePrintBill(row)}>🖨️</span>
                  <span title="Download Bill" className="cursor-pointer" onClick={() => handlePrintBill(row)}>⬇️</span>
                  {row.visit_id && (
                    <span title="Treatment Sheet" className="cursor-pointer text-green-600" onClick={() => handleOpenTreatmentSheet(row.visit_id)}>📋</span>
                  )}
                </td>
              </tr>
            ))}
            {/* Total Balance Amount row */}
            <tr className="bg-white">
              <td colSpan={6} className="px-2 py-1 font-semibold text-right">Total Balance Amount:</td>
              <td className="px-2 py-1 font-semibold">{tableData.reduce((sum, row) => sum + (row.total_amount || 0), 0).toFixed(2)}</td>
            </tr>
            {/* Pagination row */}
            <tr className="bg-gray-300">
              <td colSpan={7} className="px-2 py-1 text-center">
                <span className="mx-2">◀ Previous</span>
                <span className="mx-2">Next ▶</span>
                <span className="mx-2">1 of 1</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>

      {/* Right Side Panel for Patient Bills */}
      {showSidePanel && selectedPatient && (
        <div className="w-1/2 bg-white shadow-lg overflow-y-auto border-l-2 border-gray-300">
          <div className="p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <div>
                <h2 className="text-lg font-bold text-gray-700">Patient Name: {selectedPatient.patient_name}</h2>
                <p className="text-sm text-gray-500">{selectedPatient.patient_id}</p>
              </div>
              <button
                onClick={() => setShowSidePanel(false)}
                className="text-2xl font-bold text-gray-600 hover:text-gray-800"
              >
                ×
              </button>
            </div>

            {/* Sales Bill Section */}
            <div className="mb-6">
              <h3 className="text-md font-bold text-gray-700 mb-2 bg-gray-100 p-2">Sales Bill</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-400 text-white">
                      <th className="px-2 py-1 text-left border">Bill No.</th>
                      <th className="px-2 py-1 text-left border">Mode</th>
                      <th className="px-2 py-1 text-left border">Date</th>
                      <th className="px-2 py-1 text-left border">Amt.</th>
                      <th className="px-2 py-1 text-left border">Paid</th>
                      <th className="px-2 py-1 text-left border">Disc</th>
                      <th className="px-2 py-1 text-left border">Net Amt</th>
                      <th className="px-2 py-1 text-left border">Action</th>
                      <th className="px-2 py-1 border"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientSales.map((sale, idx) => (
                      <tr key={idx} className="bg-gray-100 border-b hover:bg-gray-200">
                        <td className="px-2 py-1 border">{sale.sale_id}</td>
                        <td className="px-2 py-1 border">{sale.payment_method || 'Cash'}</td>
                        <td className="px-2 py-1 border">{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : ''}</td>
                        <td className="px-2 py-1 border">{sale.subtotal?.toFixed(2) || '0.00'}</td>
                        <td className="px-2 py-1 border">{sale.total_amount?.toFixed(2) || '0.00'}</td>
                        <td className="px-2 py-1 border">{sale.discount?.toFixed(2) || '0.00'}</td>
                        <td className="px-2 py-1 border">{sale.total_amount?.toFixed(2) || '0.00'}</td>
                        <td className="px-2 py-1 border flex gap-1">
                          <span title="Edit" className="cursor-pointer" onClick={() => navigate(`/pharmacy/edit-sale/${sale.sale_id}`)}>✏️</span>
                          <span title="View" className="cursor-pointer">👁️</span>
                          <span title="Copy" className="cursor-pointer">📋</span>
                          <span title="Print" className="cursor-pointer" onClick={() => handlePrintBill(sale)}>🖨️</span>
                          {sale.visit_id && (
                            <span title="Treatment Sheet" className="cursor-pointer text-green-600" onClick={() => handleOpenTreatmentSheet(sale.visit_id)}>📄</span>
                          )}
                        </td>
                        <td className="px-2 py-1 border">
                          <input type="checkbox" />
                        </td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-white font-semibold">
                      <td colSpan={3} className="px-2 py-1 text-right border">Total :</td>
                      <td className="px-2 py-1 border">{patientSales.reduce((sum, s) => sum + (s.subtotal || 0), 0).toFixed(2)}</td>
                      <td className="px-2 py-1 border">{patientSales.reduce((sum, s) => sum + (s.total_amount || 0), 0).toFixed(2)}</td>
                      <td className="px-2 py-1 border">{patientSales.reduce((sum, s) => sum + (s.discount || 0), 0).toFixed(2)}</td>
                      <td className="px-2 py-1 border">{patientSales.reduce((sum, s) => sum + (s.total_amount || 0), 0).toFixed(2)}</td>
                      <td className="px-2 py-1 border"></td>
                      <td className="px-2 py-1 border">
                        <span title="Print All" className="cursor-pointer">🖨️</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sales Return Section */}
            <div className="mb-6">
              <h3 className="text-md font-bold text-gray-700 mb-2 bg-gray-100 p-2">Sales Return</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-400 text-white">
                      <th className="px-2 py-1 text-left border">Bill No.</th>
                      <th className="px-2 py-1 text-left border">Date</th>
                      <th className="px-2 py-1 text-left border">Total Amt</th>
                      <th className="px-2 py-1 text-left border">Return Amt</th>
                      <th className="px-2 py-1 text-left border">Discount(Rs)</th>
                      <th className="px-2 py-1 text-left border">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientReturns.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-2 py-1 text-center text-gray-500 border">No returns found</td>
                      </tr>
                    ) : (
                      patientReturns.map((ret, idx) => (
                        <tr key={idx} className="bg-gray-100 border-b hover:bg-gray-200">
                          <td className="px-2 py-1 border">{ret.return_id}</td>
                          <td className="px-2 py-1 border">{ret.return_date}</td>
                          <td className="px-2 py-1 border">{ret.total_amount}</td>
                          <td className="px-2 py-1 border">{ret.return_amount}</td>
                          <td className="px-2 py-1 border">{ret.discount}</td>
                          <td className="px-2 py-1 border flex gap-1">
                            <span title="Copy" className="cursor-pointer">📋</span>
                            <span title="Print" className="cursor-pointer">🖨️</span>
                            <span title="Delete" className="cursor-pointer">🗑️</span>
                          </td>
                        </tr>
                      ))
                    )}
                    {/* Total Row */}
                    {patientReturns.length > 0 && (
                      <tr className="bg-white font-semibold">
                        <td colSpan={2} className="px-2 py-1 text-right border">Total :</td>
                        <td className="px-2 py-1 border">{patientReturns.reduce((sum, r) => sum + (r.total_amount || 0), 0).toFixed(2)}</td>
                        <td className="px-2 py-1 border">{patientReturns.reduce((sum, r) => sum + (r.return_amount || 0), 0).toFixed(2)}</td>
                        <td className="px-2 py-1 border">{patientReturns.reduce((sum, r) => sum + (r.discount || 0), 0).toFixed(2)}</td>
                        <td className="px-2 py-1 border"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Treatment Sheet Dialog */}
      <Dialog open={showTreatmentSheet} onOpenChange={setShowTreatmentSheet}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Treatment Sheet</span>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedVisitId && (
            <TreatmentSheetPrintView visitId={selectedVisitId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesDetails; 