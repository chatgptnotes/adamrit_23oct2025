import React, { useState, useEffect } from 'react';
import TreatmentSheetForm from './TreatmentSheetForm';
import TreatmentSheetPrintView from './TreatmentSheetPrintView';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Printer, Eye, Download, Search, Calendar, ChevronLeft, ChevronRight, Receipt, X, Pencil, Copy, Trash2, User, RotateCcw, Wallet, Pill } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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

  // Panel type for different views
  const [panelType, setPanelType] = useState<'sales' | 'payment' | 'items' | 'medications' | null>(null);
  const [saleItems, setSaleItems] = useState<any[]>([]);

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

  // Fetch all sales on component mount
  useEffect(() => {
    const fetchAllSales = async () => {
      let query = supabase
        .from('pharmacy_sales')
        .select('*')
        .order('sale_date', { ascending: false });

      // Filter by hospital if configured
      if (hospitalConfig?.name) {
        query = query.eq('hospital_name', hospitalConfig.name);
      }

      const { data, error } = await query;
      if (!error && data) {
        setTableData(data);
      } else {
        setTableData([]);
      }
    };
    fetchAllSales();
  }, [hospitalConfig?.name]);

  // Search handler for patient or bill
  const handlePatientSearch = async () => {
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

  // Open side panel with specific content type
  const handleOpenPanel = async (row: any, type: 'sales' | 'payment' | 'items' | 'medications') => {
    setSelectedPatient(row);
    setPanelType(type);
    setShowSidePanel(true);

    // Fetch sale items if needed for items or medications view
    if (type === 'items' || type === 'medications') {
      const { data, error } = await supabase
        .from('pharmacy_sale_items')
        .select('*')
        .eq('sale_id', row.sale_id);

      if (!error && data) {
        setSaleItems(data);
      } else {
        setSaleItems([]);
      }
    }
  };

  return (
    <div className="p-6 flex gap-6 bg-gray-50 min-h-screen">
      {/* Left Side - Sales List */}
      <div className={showSidePanel ? "w-1/2" : "w-full"}>
        {/* Header with Title and Stats */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Receipt className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Sales History</h1>
              <p className="text-sm text-gray-500">View and manage pharmacy sales records</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-gray-500 text-sm">Total Sales</p>
                <p className="text-2xl font-bold text-cyan-600">{tableData.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-gray-500 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-cyan-600">₹{tableData.reduce((sum, row) => sum + (row.total_amount || 0), 0).toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-gray-500 text-sm">Avg. Bill Value</p>
                <p className="text-2xl font-bold text-cyan-600">₹{tableData.length > 0 ? (tableData.reduce((sum, row) => sum + (row.total_amount || 0), 0) / tableData.length).toFixed(2) : '0.00'}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search/Filter Card */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              {/* Bill No */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bill No.</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-9"
                    placeholder="Search bill..."
                    value={billNo}
                    onChange={e => setBillNo(e.target.value)}
                  />
                </div>
              </div>

              {/* Patient Name/ID */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name/ID</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-9"
                    placeholder="Search patient..."
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    onFocus={() => { if (patientResults.length > 0) setShowDropdown(true); }}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  />
                  {showDropdown && (
                    <div className="absolute z-10 bg-white border rounded-lg w-full max-h-48 overflow-y-auto shadow-lg mt-1">
                      {isLoading && <div className="p-3 text-gray-500">Loading...</div>}
                      {!isLoading && patientResults.length === 0 && <div className="p-3 text-gray-500">No results</div>}
                      {!isLoading && patientResults.map((p) => (
                        <div
                          key={p.patients_id}
                          className="p-3 hover:bg-cyan-50 cursor-pointer border-b last:border-0"
                          onMouseDown={() => handleSelectPatient(p)}
                        >
                          <span className="font-medium text-gray-800">{p.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({p.patients_id})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Date */}
              <div className="min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    className="pl-9"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
              </div>

              {/* All Encounter Checkbox */}
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500"
                  checked={allEncounter}
                  onChange={e => setAllEncounter(e.target.checked)}
                />
                All Encounters
              </label>

              {/* Buttons */}
              <Button onClick={handlePatientSearch} className="bg-cyan-600 hover:bg-cyan-700">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table Card */}
        <Card className="shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-cyan-600 text-white">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Bill No.</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Patient</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Paid</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Discount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No sales records found</p>
                    </td>
                  </tr>
                ) : (
                  tableData.map((row, idx) => (
                    <tr key={row.sale_id || idx} className="bg-white hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-cyan-600">#{row.sale_id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{row.patient_name || 'Walk-in'}</div>
                        <div className="text-xs text-gray-500">{row.patient_id || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">₹{row.total_amount?.toFixed(2) ?? '0.00'}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">₹{row.total_amount?.toFixed(2) ?? '0.00'}</td>
                      <td className="px-4 py-3 text-right text-gray-600">₹{row.discount?.toFixed(2) ?? '0.00'}</td>
                      <td className="px-4 py-3 text-gray-600">{row.sale_date ? new Date(row.sale_date).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPanel(row, 'sales')}
                            className="h-8 w-8 p-0 hover:bg-cyan-100 hover:text-cyan-600"
                            title="View Sales"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPanel(row, 'payment')}
                            className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                            title="Money Collected"
                          >
                            <Wallet className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPanel(row, 'items')}
                            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                            title="Sale Details"
                          >
                            <Receipt className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPanel(row, 'medications')}
                            className="h-8 w-8 p-0 hover:bg-purple-100 hover:text-purple-600"
                            title="Medication Details"
                          >
                            <Pill className="h-4 w-4" />
                          </Button>
                          {row.visit_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenTreatmentSheet(row.visit_id)}
                              className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-600"
                              title="Treatment Sheet"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {tableData.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td colSpan={2} className="px-4 py-3 font-semibold text-gray-700">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">
                      ₹{tableData.reduce((sum, row) => sum + (row.total_amount || 0), 0).toFixed(2)}
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination */}
          {tableData.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{tableData.length}</span> records
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600 px-2">Page 1 of 1</span>
                <Button variant="outline" size="sm" disabled>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Right Side Panel - Different content based on panelType */}
      {showSidePanel && selectedPatient && (
        <div className="w-1/2 bg-gray-50 shadow-lg overflow-y-auto border-l border-gray-200">
          <div className="p-4">
            {/* Header */}
            <Card className="mb-4 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      panelType === 'sales' ? 'bg-cyan-100' :
                      panelType === 'payment' ? 'bg-green-100' :
                      panelType === 'items' ? 'bg-blue-100' :
                      'bg-purple-100'
                    }`}>
                      {panelType === 'sales' && <Eye className="h-5 w-5 text-cyan-600" />}
                      {panelType === 'payment' && <Wallet className="h-5 w-5 text-green-600" />}
                      {panelType === 'items' && <Receipt className="h-5 w-5 text-blue-600" />}
                      {panelType === 'medications' && <Pill className="h-5 w-5 text-purple-600" />}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        {panelType === 'sales' && 'View Sales'}
                        {panelType === 'payment' && 'Money Collected'}
                        {panelType === 'items' && 'Sale Details'}
                        {panelType === 'medications' && 'Medication Details'}
                      </h2>
                      <p className="text-sm text-gray-500">Bill #{selectedPatient.sale_id} - {selectedPatient.patient_name || 'Walk-in'}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowSidePanel(false); setPanelType(null); }}
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* View Sales Panel - Table Format */}
            {panelType === 'sales' && (
              <Card className="mb-4 border-0 shadow-sm">
                {/* Patient Header with Print Icon */}
                <div className="flex justify-between items-center px-4 py-3 bg-gray-100 border-b">
                  <span className="font-medium text-gray-800">Patient Name : {selectedPatient.patient_name || 'Walk-in'}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePrintBill(selectedPatient)}
                    className="h-8 w-8 p-0 hover:bg-gray-200"
                    title="Print"
                  >
                    <Printer className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>

                {/* Sales Bill Table */}
                <CardHeader className="py-2 px-4 bg-cyan-700">
                  <CardTitle className="text-sm font-semibold text-white text-center">
                    Sales Bill
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-cyan-600 text-white">
                          <th className="px-2 py-2 text-left text-xs font-semibold">Bill No.</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold">Mode</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold">Date</th>
                          <th className="px-2 py-2 text-right text-xs font-semibold">Amt.</th>
                          <th className="px-2 py-2 text-right text-xs font-semibold">Paid</th>
                          <th className="px-2 py-2 text-right text-xs font-semibold">Disc</th>
                          <th className="px-2 py-2 text-right text-xs font-semibold">Net Amt</th>
                          <th className="px-2 py-2 text-center text-xs font-semibold">Action</th>
                          <th className="px-1 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white border-b hover:bg-gray-50">
                          <td className="px-2 py-2 text-gray-800">SB-{selectedPatient.sale_id}</td>
                          <td className="px-2 py-2 text-gray-600">{selectedPatient.payment_method || 'Cash'}</td>
                          <td className="px-2 py-2 text-gray-600">{selectedPatient.sale_date ? new Date(selectedPatient.sale_date).toLocaleDateString() : '-'}</td>
                          <td className="px-2 py-2 text-right text-gray-800">{selectedPatient.subtotal?.toFixed(2) || '0.00'}</td>
                          <td className="px-2 py-2 text-right text-gray-800">{selectedPatient.total_amount?.toFixed(2) || '0.00'}</td>
                          <td className="px-2 py-2 text-right text-gray-600">{selectedPatient.discount?.toFixed(2) || '0.00'}</td>
                          <td className="px-2 py-2 text-right font-medium text-gray-800">{selectedPatient.total_amount?.toFixed(2) || '0.00'}</td>
                          <td className="px-2 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/pharmacy/edit-sale/${selectedPatient.sale_id}`)}
                                className="h-6 w-6 p-0 hover:bg-cyan-100 hover:text-cyan-600"
                                title="Edit"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-cyan-100 hover:text-cyan-600"
                                title="View"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-cyan-100 hover:text-cyan-600"
                                title="Copy"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrintBill(selectedPatient)}
                                className="h-6 w-6 p-0 hover:bg-cyan-100 hover:text-cyan-600"
                                title="Print"
                              >
                                <Printer className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="px-1 py-2">
                            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                          </td>
                        </tr>
                        {/* Total Row */}
                        <tr className="bg-gray-100 font-semibold border-t">
                          <td colSpan={3} className="px-2 py-2 text-right text-gray-700">Total :</td>
                          <td className="px-2 py-2 text-right text-gray-800">{selectedPatient.subtotal?.toFixed(2) || '0.00'}</td>
                          <td className="px-2 py-2 text-right text-gray-800">{selectedPatient.total_amount?.toFixed(2) || '0.00'}</td>
                          <td className="px-2 py-2 text-right text-gray-600">{selectedPatient.discount?.toFixed(2) || '0.00'}</td>
                          <td className="px-2 py-2 text-right font-bold text-gray-800">{selectedPatient.total_amount?.toFixed(2) || '0.00'}</td>
                          <td className="px-2 py-2"></td>
                          <td className="px-1 py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrintBill(selectedPatient)}
                              className="h-6 w-6 p-0 hover:bg-cyan-100 hover:text-cyan-600"
                              title="Print All"
                            >
                              <Printer className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Money Collected Panel */}
            {panelType === 'payment' && (
              <Card className="mb-4 border-0 shadow-sm">
                <CardHeader className="py-3 px-4 bg-green-600 rounded-t-lg">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-green-600">Amount Collected</p>
                      <p className="text-3xl font-bold text-green-700">₹{selectedPatient.total_amount?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Payment Method</p>
                        <p className="text-lg font-semibold text-gray-800">{selectedPatient.payment_method || 'CASH'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Payment Status</p>
                        <p className="text-lg font-semibold text-green-600">Paid</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Bill Amount</p>
                        <p className="text-lg font-semibold text-gray-800">₹{selectedPatient.subtotal?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Discount Given</p>
                        <p className="text-lg font-semibold text-red-600">₹{selectedPatient.discount?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Transaction Date & Time</p>
                      <p className="text-lg font-semibold text-gray-800">{selectedPatient.sale_date ? new Date(selectedPatient.sale_date).toLocaleString() : '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sale Details (Items) Panel */}
            {panelType === 'items' && (
              <Card className="mb-4 border-0 shadow-sm">
                <CardHeader className="py-3 px-4 bg-blue-600 rounded-t-lg">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Itemized Sale Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 border-b">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">#</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Item</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Qty</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Rate</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Disc%</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {saleItems.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-4 text-center text-gray-500">No items found</td>
                          </tr>
                        ) : (
                          saleItems.map((item, idx) => (
                            <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                              <td className="px-3 py-2">
                                <div className="font-medium text-gray-800">{item.medication_name || item.medicine_name}</div>
                                <div className="text-xs text-gray-500">Batch: {item.batch_number || '-'}</div>
                              </td>
                              <td className="px-3 py-2 text-right text-gray-800">{item.quantity}</td>
                              <td className="px-3 py-2 text-right text-gray-800">₹{item.unit_price?.toFixed(2) || '0.00'}</td>
                              <td className="px-3 py-2 text-right text-gray-600">{item.discount_percentage || 0}%</td>
                              <td className="px-3 py-2 text-right font-medium text-gray-800">₹{item.total_amount?.toFixed(2) || '0.00'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {saleItems.length > 0 && (
                        <tfoot>
                          <tr className="bg-blue-50 font-semibold">
                            <td colSpan={5} className="px-3 py-2 text-right text-gray-700">Total:</td>
                            <td className="px-3 py-2 text-right text-blue-700">₹{saleItems.reduce((sum, item) => sum + (item.total_amount || 0), 0).toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Medication Details Panel */}
            {panelType === 'medications' && (
              <Card className="mb-4 border-0 shadow-sm">
                <CardHeader className="py-3 px-4 bg-purple-600 rounded-t-lg">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    Medications Dispensed
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {saleItems.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No medications found</p>
                  ) : (
                    <div className="space-y-3">
                      {saleItems.map((item, idx) => (
                        <div key={idx} className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-purple-900">{item.medication_name || item.medicine_name}</h4>
                              <p className="text-sm text-purple-700">{item.generic_name || ''}</p>
                            </div>
                            <span className="bg-purple-200 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              Qty: {item.quantity}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-purple-600">Batch:</span>
                              <span className="ml-1 font-medium text-purple-800">{item.batch_number || '-'}</span>
                            </div>
                            <div>
                              <span className="text-purple-600">Expiry:</span>
                              <span className="ml-1 font-medium text-purple-800">{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}</span>
                            </div>
                            <div>
                              <span className="text-purple-600">Price:</span>
                              <span className="ml-1 font-medium text-purple-800">₹{item.unit_price?.toFixed(2) || '0.00'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Print Button */}
            <div className="flex justify-end">
              <Button onClick={() => handlePrintBill(selectedPatient)} className="bg-gray-700 hover:bg-gray-800">
                <Printer className="h-4 w-4 mr-2" />
                Print Bill
              </Button>
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