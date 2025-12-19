import React, { useState, useEffect } from 'react';
import TreatmentSheetForm from './TreatmentSheetForm';
import TreatmentSheetPrintView from './TreatmentSheetPrintView';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Printer, Eye, Download, Search, Calendar, ChevronLeft, ChevronRight, Receipt, X, Pencil, Copy, Trash2, User, RotateCcw, Wallet, Pill } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Interface for grouping sales by patient
interface PatientGroup {
  patient_id: string;
  patient_name: string;
  total_amount: number;
  total_discount: number;
  total_paid: number;
  latest_date: string;
  bill_count: number;
  bills: any[];
}

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
  const [searchParams] = useSearchParams();
  const { hospitalConfig } = useAuth();

  // Get saleId from URL params (for returning from Edit Sale Bill)
  const urlSaleId = searchParams.get('saleId');

  // Patient search state
  const [patientResults, setPatientResults] = useState<{name: string, patients_id: string}[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Table data state
  const [tableData, setTableData] = useState<any[]>([]);

  // Patient groups state (grouped by patient)
  const [patientGroups, setPatientGroups] = useState<PatientGroup[]>([]);

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

  // View Bill Modal state
  const [viewBillModal, setViewBillModal] = useState<any>(null);
  const [viewBillItems, setViewBillItems] = useState<any[]>([]);

  // Selected bills for printing prescriptions
  const [selectedBills, setSelectedBills] = useState<number[]>([]);

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

  // Fetch all sales on component mount and group by patient
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

        // Group sales by patient
        const grouped: { [key: string]: PatientGroup } = {};
        data.forEach((sale: any) => {
          const key = sale.patient_id || 'walk-in';
          if (!grouped[key]) {
            grouped[key] = {
              patient_id: sale.patient_id || 'walk-in',
              patient_name: sale.patient_name || 'Walk-in',
              total_amount: 0,
              total_discount: 0,
              total_paid: 0,
              latest_date: sale.sale_date,
              bill_count: 0,
              bills: []
            };
          }
          grouped[key].bills.push(sale);
          grouped[key].total_amount += sale.total_amount || 0;
          grouped[key].total_discount += sale.discount || 0;
          grouped[key].total_paid += sale.total_amount || 0;
          grouped[key].bill_count += 1;
          // Update latest_date if this sale is more recent
          if (sale.sale_date && sale.sale_date > grouped[key].latest_date) {
            grouped[key].latest_date = sale.sale_date;
          }
        });

        // Convert to array and sort by latest_date
        const groupedArray = Object.values(grouped).sort((a, b) =>
          new Date(b.latest_date).getTime() - new Date(a.latest_date).getTime()
        );
        setPatientGroups(groupedArray);
      } else {
        setTableData([]);
        setPatientGroups([]);
      }
    };
    fetchAllSales();
  }, [hospitalConfig?.name]);

  // Auto-open sidebar when returning from Edit Sale Bill with saleId in URL
  useEffect(() => {
    if (urlSaleId && tableData.length > 0) {
      const sale = tableData.find((s: any) => s.sale_id?.toString() === urlSaleId);
      if (sale) {
        setSelectedPatient(sale);
        setPanelType('sales');
        setShowSidePanel(true);
      }
    }
  }, [urlSaleId, tableData]);

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

    // Format the date/time
    const billDate = sale.sale_date ? new Date(sale.sale_date) : new Date();
    const formattedDate = `${billDate.getDate().toString().padStart(2, '0')}/${(billDate.getMonth() + 1).toString().padStart(2, '0')}/${billDate.getFullYear()} ${billDate.getHours().toString().padStart(2, '0')}:${billDate.getMinutes().toString().padStart(2, '0')}:${billDate.getSeconds().toString().padStart(2, '0')}`;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Bill - ${sale.bill_number || 'SB-' + sale.sale_id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            font-size: 12px;
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
          }
          .header-image {
            width: 100%;
            max-width: 100%;
            height: auto;
            margin-bottom: 5px;
          }
          .bill-title {
            text-align: center;
            color: #cc0000;
            font-size: 16px;
            font-weight: bold;
            margin: 15px 0;
            border-bottom: 2px solid #333;
            padding: 8px 0;
          }
          .bill-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ccc;
          }
          .bill-info-left, .bill-info-right {
            width: 48%;
          }
          .bill-info-row {
            display: flex;
            margin-bottom: 4px;
          }
          .bill-info-label {
            font-weight: bold;
            width: 100px;
          }
          .bill-info-value {
            flex: 1;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11px;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #999;
            padding: 6px 8px;
            text-align: left;
          }
          .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            font-size: 10px;
          }
          .items-table td.amount,
          .items-table th.amount {
            text-align: right;
          }
          .items-table td.center,
          .items-table th.center {
            text-align: center;
          }
          .total-section {
            text-align: right;
            margin: 15px 0;
            font-size: 14px;
            font-weight: bold;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            padding-top: 10px;
          }
          .signature-box {
            width: 45%;
          }
          .signature-line {
            border-top: 1px solid #000;
            padding-top: 5px;
            font-size: 11px;
          }
          .footer-info {
            margin-top: 30px;
            font-size: 9px;
            color: #666;
          }
          @media print {
            body {
              padding: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <img src="/pharmacy_header.png" alt="Hope Pharmacy Header" class="header-image" />
        </div>

        <div class="bill-title">Sales Bill</div>

        <div class="bill-info">
          <div class="bill-info-left">
            <div class="bill-info-row">
              <span class="bill-info-label">Bill No:</span>
              <span class="bill-info-value">${sale.bill_number || 'SB-' + sale.sale_id}</span>
            </div>
            <div class="bill-info-row">
              <span class="bill-info-label">Date:</span>
              <span class="bill-info-value">${formattedDate}</span>
            </div>
            <div class="bill-info-row">
              <span class="bill-info-label">Patient:</span>
              <span class="bill-info-value">${sale.patient_name || '-'}</span>
            </div>
            <div class="bill-info-row">
              <span class="bill-info-label">Prescribed by:</span>
              <span class="bill-info-value">${sale.doctor_name || '-'}</span>
            </div>
          </div>
          <div class="bill-info-right">
            <div class="bill-info-row">
              <span class="bill-info-label">Payment:</span>
              <span class="bill-info-value">${sale.payment_method || 'Cash'}</span>
            </div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 40%">Item Name</th>
              <th class="center" style="width: 8%">Pkg</th>
              <th class="center" style="width: 15%">Batch No.</th>
              <th class="center" style="width: 12%">Exp Date</th>
              <th class="center" style="width: 8%">Qty</th>
              <th class="amount" style="width: 17%">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.medication_name || item.medicine_name || '-'}</td>
                <td class="center">${item.pack_size || '1'}</td>
                <td class="center">${item.batch_number || 'N/A'}</td>
                <td class="center">${item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('en-IN') : 'N/A'}</td>
                <td class="center">${item.quantity}</td>
                <td class="amount">${parseFloat(String(item.total_price || item.total_amount || (item.unit_price * item.quantity) || 0)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          Total: Rs ${parseFloat(String(sale.total_amount || 0)).toFixed(2)}
        </div>

        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line">Patient Signature</div>
          </div>
          <div class="signature-box" style="text-align: right;">
            <div class="signature-line">Pharmacist Signature</div>
          </div>
        </div>

        <div class="footer-info">
          <div>GST No. 27ACLPV4078L1ZQ</div>
          <div>D.L. No. 20-NAG/136/2009, 21-NAG/136/2009</div>
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

  // Print selected bills as prescriptions (2-up format)
  const printSelectedPrescriptions = async () => {
    if (selectedBills.length === 0) return;

    // Get the selected bills data
    const selectedBillsData = selectedPatient?.bills?.filter((bill: any) =>
      selectedBills.includes(bill.sale_id)
    ) || [];

    if (selectedBillsData.length === 0) return;

    // Fetch items for all selected bills
    const billsWithItems: any[] = [];
    for (const bill of selectedBillsData) {
      const { data, error } = await supabase
        .from('pharmacy_sale_items')
        .select('*')
        .eq('sale_id', bill.sale_id);

      if (!error && data) {
        billsWithItems.push({ ...bill, items: data });
      }
    }

    const printWindow = window.open('', '', 'width=1000,height=800');
    if (!printWindow) return;

    // Generate prescriptions - one per selected bill
    const prescriptions: string[] = [];

    for (const bill of billsWithItems) {
      const billDate = bill.sale_date ? new Date(bill.sale_date) : new Date();
      const formattedDate = `${billDate.getDate().toString().padStart(2, '0')}/${(billDate.getMonth() + 1).toString().padStart(2, '0')}/${billDate.getFullYear()}`;

      const prescriptionHTML = `
        <div class="prescription">
          <div class="header-section">
            <div class="logo-row">
              <img src="/left_logo.jpeg" alt="NABH" class="left-logo" />
              <div class="title">Prescription</div>
              <img src="/right_logo.jpeg" alt="Hope Hospitals" class="right-logo" />
            </div>
            <div class="patient-info">
              <div class="info-row">
                <span class="label">Patient Name :</span>
                <span class="value">${bill.patient_name || '-'}</span>
              </div>
              <div class="info-row">
                <span class="label">Registration Number :</span>
                <span class="value">${bill.patient_id || '-'}</span>
              </div>
            </div>
          </div>
          <div class="rx-section">
            <div class="rx-header">
              <span class="rx">Rx</span>
              <span class="date">Date : ${formattedDate}</span>
            </div>
            <div class="medicines-list">
              ${bill.items.map((item: any) => `
                <div class="medicine-row">
                  <span class="medicine-name">${item.medication_name || item.medicine_name || '-'}</span>
                  <span class="medicine-qty">${item.quantity}</span>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="doctor-signature">
            <div class="signature-line"></div>
            <span>${bill.doctor_name || 'Dr. Afzal Sheikh (MD Medicine)'}</span>
          </div>
        </div>
      `;
      prescriptions.push(prescriptionHTML);
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescriptions</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 10px;
          }
          .prescriptions-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .prescription {
            padding: 15px;
            page-break-inside: avoid;
            min-height: 400px;
            display: flex;
            flex-direction: column;
          }
          .header-section {
            padding-bottom: 8px;
            border-bottom: 1px solid #000;
            margin-bottom: 0;
          }
          .logo-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
          }
          .left-logo {
            width: 55px;
            height: auto;
          }
          .right-logo {
            width: 85px;
            height: auto;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            color: #c00;
            text-decoration: underline;
          }
          .patient-info {
            margin-top: 5px;
          }
          .info-row {
            display: flex;
            margin-bottom: 2px;
            font-size: 12px;
          }
          .info-row .label {
            font-weight: bold;
            width: 150px;
          }
          .info-row .value {
            flex: 1;
          }
          .rx-section {
            flex: 1;
            padding: 0;
          }
          .rx-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #000;
          }
          .rx {
            font-size: 13px;
            font-weight: normal;
            padding-left: 15px;
          }
          .date {
            font-size: 12px;
            text-align: right;
          }
          .medicines-list {
            padding: 8px 0 8px 40px;
          }
          .medicine-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            font-size: 12px;
          }
          .medicine-name {
            flex: 1;
          }
          .medicine-qty {
            width: 50px;
            text-align: right;
          }
          .doctor-signature {
            margin-top: auto;
            padding-top: 15px;
            font-size: 12px;
            font-weight: bold;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin-bottom: 8px;
          }
          @media print {
            body {
              padding: 0;
            }
            .prescriptions-container {
              gap: 10px;
            }
            .prescription {
              border: 1px solid #000;
            }
          }
          .print-btn {
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 10px 20px;
            background: #007bff;
            color: white;
            border: none;
            cursor: pointer;
            font-size: 14px;
          }
          @media print {
            .print-btn {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">Print</button>
        <div class="prescriptions-container">
          ${prescriptions.join('')}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  // View Bill Modal handler
  const handleViewBillModal = async (bill: any) => {
    const { data, error } = await supabase
      .from('pharmacy_sale_items')
      .select('*')
      .eq('sale_id', bill.sale_id);

    if (!error && data) {
      setViewBillItems(data);
    } else {
      setViewBillItems([]);
    }
    setViewBillModal(bill);
  };

  // Delete Bill handler
  const handleDeleteBill = async (bill: any) => {
    if (!confirm('Are you sure you want to delete this bill? This action cannot be undone.')) return;

    // Delete sale items first
    const { error: itemsError } = await supabase
      .from('pharmacy_sale_items')
      .delete()
      .eq('sale_id', bill.sale_id);

    if (itemsError) {
      console.error('Error deleting sale items:', itemsError);
      alert('Error deleting bill items');
      return;
    }

    // Delete the sale
    const { error: saleError } = await supabase
      .from('pharmacy_sales')
      .delete()
      .eq('sale_id', bill.sale_id);

    if (saleError) {
      console.error('Error deleting sale:', saleError);
      alert('Error deleting bill');
      return;
    }

    // Update state - remove from selectedPatient.bills
    if (selectedPatient) {
      setSelectedPatient((prev: any) => ({
        ...prev,
        bills: prev.bills.filter((b: any) => b.sale_id !== bill.sale_id)
      }));
    }

    // Update patientGroups state
    setPatientGroups(prev => prev.map(group => ({
      ...group,
      bills: group.bills.filter(b => b.sale_id !== bill.sale_id),
      bill_count: group.bills.filter(b => b.sale_id !== bill.sale_id).length,
      total_amount: group.bills.filter(b => b.sale_id !== bill.sale_id).reduce((sum, b) => sum + (b.total_amount || 0), 0),
      total_paid: group.bills.filter(b => b.sale_id !== bill.sale_id).reduce((sum, b) => sum + (b.total_amount || 0), 0),
      total_discount: group.bills.filter(b => b.sale_id !== bill.sale_id).reduce((sum, b) => sum + (b.discount || 0), 0)
    })).filter(group => group.bills.length > 0));

    // Update tableData
    setTableData(prev => prev.filter(s => s.sale_id !== bill.sale_id));

    alert('Bill deleted successfully');
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
                <p className="text-gray-500 text-sm">Total Patients</p>
                <p className="text-2xl font-bold text-cyan-600">{patientGroups.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-gray-500 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-cyan-600">₹{patientGroups.reduce((sum, group) => sum + (group.total_amount || 0), 0).toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-gray-500 text-sm">Total Bills</p>
                <p className="text-2xl font-bold text-cyan-600">{tableData.length}</p>
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

        {/* Table Card - Grouped by Patient */}
        <Card className="shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-cyan-600 text-white">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Patient</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Paid</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Discount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patientGroups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No sales records found</p>
                    </td>
                  </tr>
                ) : (
                  patientGroups.map((group, idx) => (
                    <tr
                      key={group.patient_id || idx}
                      className={`bg-white hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedPatient?.patient_id === group.patient_id ? 'bg-cyan-50' : ''
                      }`}
                      onClick={() => {
                        setSelectedPatient(group);
                        setPanelType('sales');
                        setShowSidePanel(true);
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{group.patient_name}</div>
                        <div className="text-xs text-gray-500">{group.patient_id}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">₹{group.total_amount?.toFixed(2) ?? '0.00'}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">₹{group.total_paid?.toFixed(2) ?? '0.00'}</td>
                      <td className="px-4 py-3 text-right text-gray-600">₹{group.total_discount?.toFixed(2) ?? '0.00'}</td>
                      <td className="px-4 py-3 text-gray-600">{group.latest_date ? new Date(group.latest_date).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient(group);
                              setPanelType('sales');
                              setShowSidePanel(true);
                            }}
                            className="h-8 w-8 p-0 hover:bg-cyan-100 hover:text-cyan-600"
                            title="View All Bills"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Use latest bill for payment details
                              const latestBill = group.bills[0];
                              setSelectedPatient({ ...latestBill, patient_name: group.patient_name });
                              setPanelType('payment');
                              setShowSidePanel(true);
                            }}
                            className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                            title="Money Collected"
                          >
                            <Wallet className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Use latest bill for items
                              const latestBill = group.bills[0];
                              handleOpenPanel(latestBill, 'items');
                            }}
                            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                            title="Sale Details"
                          >
                            <Receipt className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Use latest bill for medications
                              const latestBill = group.bills[0];
                              handleOpenPanel(latestBill, 'medications');
                            }}
                            className="h-8 w-8 p-0 hover:bg-purple-100 hover:text-purple-600"
                            title="Medication Details"
                          >
                            <Pill className="h-4 w-4" />
                          </Button>
                          {group.bills[0]?.visit_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTreatmentSheet(group.bills[0].visit_id);
                              }}
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
              {patientGroups.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td className="px-4 py-3 font-semibold text-gray-700">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">
                      ₹{patientGroups.reduce((sum, group) => sum + (group.total_amount || 0), 0).toFixed(2)}
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination */}
          {patientGroups.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{patientGroups.length}</span> patients
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

      {/* Right Side Panel - Shows all bills for selected patient */}
      {showSidePanel && selectedPatient && (
        <div className="w-1/2 bg-gray-100 shadow-lg overflow-y-auto border-l border-gray-200">
          <div className="p-2">
            {/* Patient Header with Print Icon */}
            <div className="flex justify-between items-center px-4 py-3 bg-gray-200 border-b mb-2">
              <span className="font-medium text-gray-800">Patient Name : {selectedPatient.patient_name || 'Walk-in'}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-300"
                  title="Print All"
                >
                  <Printer className="h-4 w-4 text-gray-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowSidePanel(false); setPanelType(null); setSelectedPatient(null); }}
                  className="h-8 w-8 p-0 hover:bg-gray-300"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </Button>
              </div>
            </div>

            {/* Sales Bill Table - only show for sales panel */}
            {panelType === 'sales' && (
            <>
            <div className="bg-cyan-700 py-2 px-4 text-center">
              <span className="text-sm font-semibold text-white">Sales Bill</span>
            </div>

            <div className="overflow-x-auto bg-white">
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
                  {/* Show all bills for this patient */}
                  {selectedPatient.bills && selectedPatient.bills.length > 0 ? (
                    selectedPatient.bills.map((bill: any, idx: number) => (
                      <tr key={bill.sale_id || idx} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-2 py-2 text-gray-800">SB-{bill.sale_id}</td>
                        <td className="px-2 py-2 text-gray-600">{bill.payment_method || 'Cash'}</td>
                        <td className="px-2 py-2 text-gray-600">{bill.sale_date ? new Date(bill.sale_date).toLocaleDateString('en-IN') : '-'}</td>
                        <td className="px-2 py-2 text-right text-gray-800">{(bill.subtotal || bill.total_amount || 0).toFixed(2)}</td>
                        <td className="px-2 py-2 text-right text-gray-800">{(bill.total_amount || 0).toFixed(2)}</td>
                        <td className="px-2 py-2 text-right text-gray-600">{(bill.discount || 0).toFixed(2)}</td>
                        <td className="px-2 py-2 text-right font-medium text-gray-800">{(bill.total_amount || 0).toFixed(2)}</td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            {/* 1. Edit */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/pharmacy/edit-sale/${bill.sale_id}`)}
                              className="h-6 w-6 p-0 hover:bg-cyan-100 hover:text-cyan-600"
                              title="Edit"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            {/* 2. View Sales - Modal */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewBillModal(bill)}
                              className="h-6 w-6 p-0 hover:bg-cyan-100 hover:text-cyan-600"
                              title="View"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {/* 3. Print */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrintBill(bill)}
                              className="h-6 w-6 p-0 hover:bg-cyan-100 hover:text-cyan-600"
                              title="Print"
                            >
                              <Printer className="h-3 w-3" />
                            </Button>
                            {/* 4. Delete */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBill(bill)}
                              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-1 py-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                            checked={selectedBills.includes(bill.sale_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBills([...selectedBills, bill.sale_id]);
                              } else {
                                setSelectedBills(selectedBills.filter(id => id !== bill.sale_id));
                              }
                            }}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-4 py-4 text-center text-gray-500">No bills found</td>
                    </tr>
                  )}
                  {/* Total Row */}
                  {selectedPatient.bills && selectedPatient.bills.length > 0 && (
                    <tr className="bg-gray-100 font-semibold border-t">
                      <td colSpan={3} className="px-2 py-2 text-right text-gray-700">Total :</td>
                      <td className="px-2 py-2 text-right text-gray-800">
                        {selectedPatient.bills.reduce((sum: number, b: any) => sum + (b.subtotal || b.total_amount || 0), 0).toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right text-gray-800">
                        {selectedPatient.bills.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0).toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right text-gray-600">
                        {selectedPatient.bills.reduce((sum: number, b: any) => sum + (b.discount || 0), 0).toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right font-bold text-gray-800">
                        {selectedPatient.bills.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0).toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-center" colSpan={2}>
                        <Button
                          size="sm"
                          className="bg-gray-700 hover:bg-gray-800 text-xs"
                          onClick={printSelectedPrescriptions}
                          disabled={selectedBills.length === 0}
                        >
                          <Printer className="h-3 w-3 mr-1" />
                          Print Prescription {selectedBills.length > 0 && `(${selectedBills.length})`}
                        </Button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </>
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
          </div>
        </div>
      )}

      {/* View Bill Modal */}
      <Dialog open={!!viewBillModal} onOpenChange={(open) => !open && setViewBillModal(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bill Details - SB-{viewBillModal?.sale_id}</DialogTitle>
          </DialogHeader>
          {viewBillModal && (
            <div className="space-y-4">
              {/* Bill Header Info */}
              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Patient Name</p>
                  <p className="font-medium">{viewBillModal.patient_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Patient ID</p>
                  <p className="font-medium">{viewBillModal.patient_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bill Date</p>
                  <p className="font-medium">{viewBillModal.sale_date ? new Date(viewBillModal.sale_date).toLocaleDateString('en-IN') : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium">{viewBillModal.payment_method || 'Cash'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Doctor</p>
                  <p className="font-medium">{viewBillModal.doctor_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bill Number</p>
                  <p className="font-medium">{viewBillModal.bill_number || `SB-${viewBillModal.sale_id}`}</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-semibold mb-2">Items</h4>
                <table className="w-full text-sm border">
                  <thead className="bg-cyan-600 text-white">
                    <tr>
                      <th className="px-3 py-2 text-left">Item Name</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-center">Batch</th>
                      <th className="px-3 py-2 text-right">MRP</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewBillItems.length > 0 ? viewBillItems.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div className="font-medium">{item.medication_name}</div>
                          {item.generic_name && <div className="text-xs text-gray-500">{item.generic_name}</div>}
                        </td>
                        <td className="px-3 py-2 text-center">{item.quantity}</td>
                        <td className="px-3 py-2 text-center">{item.batch_number || '-'}</td>
                        <td className="px-3 py-2 text-right">{(item.mrp || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">{(item.unit_price || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">{(item.total_amount || (item.unit_price * item.quantity) || 0).toFixed(2)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-center text-gray-500">No items found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-end gap-8">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Subtotal</p>
                    <p className="font-medium">{viewBillItems.reduce((sum: number, item: any) => sum + (item.total_amount || ((item.unit_price || 0) * (item.quantity || 0))), 0).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Discount</p>
                    <p className="font-medium">{(viewBillModal.discount || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-bold text-lg text-cyan-600">{(viewBillItems.reduce((sum: number, item: any) => sum + (item.total_amount || ((item.unit_price || 0) * (item.quantity || 0))), 0) - (viewBillModal.discount || 0)).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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