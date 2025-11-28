import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Calendar, FileText, DollarSign, User, Clock, CheckCircle, AlertCircle, Receipt, Link, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface BillPreparationData {
  id: string;
  visit_id: string;
  date_of_bill_preparation?: string;
  bill_amount?: number;
  expected_amount?: number;
  billing_executive?: string;
  reason_for_delay?: string;
  date_of_submission?: string;
  executive_who_submitted?: string;
  received_date?: string;
  received_amount?: number;
  deduction_amount?: number;
  reason_for_deduction?: string;
  bill_link_spreadsheet?: string;
  referral_letter?: string;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  insurance_person_no?: string;
}

const BillManagement: React.FC = () => {
  const { hospitalConfig } = useAuth();
  const navigate = useNavigate();
  const [billData, setBillData] = useState<BillPreparationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<BillPreparationData | null>(null);
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Handle print functionality
  const handlePrintAll = () => {
    // Check if billData exists
    if (!billData || billData.length === 0) {
      toast.error('No data available to print');
      return;
    }

    // Filter bills based on search term
    const filteredBillsForPrint = billData.filter(bill =>
      bill.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.insurance_person_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.visit_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.billing_executive?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate statistics for print
    const printStats = {
      totalBills: filteredBillsForPrint.length,
      pendingSubmission: filteredBillsForPrint.filter(b => !b.date_of_submission).length,
      submitted: filteredBillsForPrint.filter(b => b.date_of_submission && !b.received_date).length,
      received: filteredBillsForPrint.filter(b => b.received_date).length,
      totalExpected: filteredBillsForPrint.reduce((sum, b) => sum + (b.expected_amount || 0), 0),
      totalReceived: filteredBillsForPrint.reduce((sum, b) => sum + (b.received_amount || 0), 0),
      totalDeduction: filteredBillsForPrint.reduce((sum, b) => sum + (b.deduction_amount || 0), 0)
    };

    console.log('Printing data:', { filteredBillsForPrint, printStats });

    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill Management Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            line-height: 1.6;
          }
          h1 {
            text-align: center;
            color: #333;
            border-bottom: 3px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .report-date {
            text-align: center;
            color: #666;
            margin-bottom: 20px;
            font-size: 14px;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
          }
          .summary-item {
            text-align: center;
          }
          .summary-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          .summary-value {
            font-size: 20px;
            font-weight: bold;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
            color: #333;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .status-received {
            color: green;
            font-weight: bold;
          }
          .status-pending {
            color: orange;
            font-weight: bold;
          }
          .status-submitted {
            color: blue;
            font-weight: bold;
          }
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <h1>Bill Management Report</h1>
        <div class="report-date">Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>

        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Total Bills</div>
            <div class="summary-value">${printStats.totalBills}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Pending Submission</div>
            <div class="summary-value">${printStats.pendingSubmission}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Submitted</div>
            <div class="summary-value">${printStats.submitted}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Received</div>
            <div class="summary-value">${printStats.received}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Expected</div>
            <div class="summary-value">₹${printStats.totalExpected.toLocaleString()}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Received</div>
            <div class="summary-value">₹${printStats.totalReceived.toLocaleString()}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Deductions</div>
            <div class="summary-value">₹${printStats.totalDeduction.toLocaleString()}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Visit ID</th>
              <th>Patient Name</th>
              <th>Insurance No.</th>
              <th>Bill Prep Date</th>
              <th>Bill Amount</th>
              <th>Submission Date</th>
              <th>Received Amount</th>
              <th>Deduction</th>
              <th>Status</th>
              <th>Executive</th>
            </tr>
          </thead>
          <tbody>
            ${filteredBillsForPrint.map(bill => `
              <tr>
                <td>${bill.visit_id}</td>
                <td>${bill.patient_name || 'Unknown'}</td>
                <td>${bill.insurance_person_no || 'N/A'}</td>
                <td>${bill.date_of_bill_preparation ? format(new Date(bill.date_of_bill_preparation), 'dd/MM/yyyy') : 'Not prepared'}</td>
                <td>₹${(bill.bill_amount || 0).toLocaleString()}</td>
                <td>${bill.date_of_submission ? format(new Date(bill.date_of_submission), 'dd/MM/yyyy') : 'Not submitted'}</td>
                <td>₹${(bill.received_amount || 0).toLocaleString()}</td>
                <td>₹${(bill.deduction_amount || 0).toLocaleString()}</td>
                <td class="${bill.received_date ? 'status-received' : bill.date_of_submission ? 'status-submitted' : 'status-pending'}">
                  ${bill.received_date ? 'Received' : bill.date_of_submission ? 'Submitted' : 'Pending'}
                </td>
                <td>${bill.billing_executive || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handlePrint = (bill: BillPreparationData) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill Details - ${bill.visit_id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            line-height: 1.6;
          }
          h1 {
            text-align: center;
            color: #333;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            color: #555;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .label {
            font-weight: bold;
            color: #666;
            margin-bottom: 3px;
          }
          .value {
            color: #333;
            font-size: 15px;
          }
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <h1>Bill Details - ${bill.visit_id}</h1>

        <div class="section">
          <h2>Patient Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Patient Name</div>
              <div class="value">${bill.patient_name || 'Unknown'}</div>
            </div>
            <div class="info-item">
              <div class="label">Insurance Person No.</div>
              <div class="value">${bill.insurance_person_no || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Bill Preparation</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Date of Bill Preparation</div>
              <div class="value">${bill.date_of_bill_preparation ? format(new Date(bill.date_of_bill_preparation), 'dd/MM/yyyy') : 'Not set'}</div>
            </div>
            <div class="info-item">
              <div class="label">Bill Amount</div>
              <div class="value">₹${(bill.bill_amount || 0).toLocaleString()}</div>
            </div>
            <div class="info-item">
              <div class="label">Expected Amount</div>
              <div class="value">₹${(bill.expected_amount || 0).toLocaleString()}</div>
            </div>
            <div class="info-item">
              <div class="label">Billing Executive</div>
              <div class="value">${bill.billing_executive || 'Not assigned'}</div>
            </div>
            ${bill.reason_for_delay ? `
            <div class="info-item" style="grid-column: 1 / -1;">
              <div class="label">Reason for Delay</div>
              <div class="value">${bill.reason_for_delay}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="section">
          <h2>Bill Submission</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Date of Submission</div>
              <div class="value">${bill.date_of_submission ? format(new Date(bill.date_of_submission), 'dd/MM/yyyy') : 'Not submitted'}</div>
            </div>
            <div class="info-item">
              <div class="label">Executive Who Submitted</div>
              <div class="value">${bill.executive_who_submitted || 'Not submitted'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Received Amount</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Received Date</div>
              <div class="value">${bill.received_date ? format(new Date(bill.received_date), 'dd/MM/yyyy') : 'Not received'}</div>
            </div>
            <div class="info-item">
              <div class="label">Received Amount</div>
              <div class="value">₹${(bill.received_amount || 0).toLocaleString()}</div>
            </div>
            <div class="info-item">
              <div class="label">Deduction Amount</div>
              <div class="value">₹${(bill.deduction_amount || 0).toLocaleString()}</div>
            </div>
            ${bill.reason_for_deduction ? `
            <div class="info-item">
              <div class="label">Reason for Deduction</div>
              <div class="value">${bill.reason_for_deduction}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="section">
          <h2>Bill Link/Referral Letter</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Bill Link</div>
              <div class="value">${bill.bill_link_spreadsheet || 'No link available'}</div>
            </div>
            <div class="info-item">
              <div class="label">Referral Letter</div>
              <div class="value">${bill.referral_letter ? 'Document uploaded' : 'No document uploaded'}</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Fetch bill preparation data
  const fetchBillData = async () => {
    try {
      setLoading(true);

      // First, get bill preparation data
      let query = supabase
        .from('bill_preparation')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterDate) {
        query = query.gte('date_of_bill_preparation', filterDate)
                     .lte('date_of_bill_preparation', filterDate + 'T23:59:59');
      }

      const { data: billPrepData, error: billError } = await query;

      if (billError) {
        console.error('Error fetching bill preparation data:', billError);
        throw billError;
      }

      // If we have bill data, fetch patient information
      if (billPrepData && billPrepData.length > 0) {
        // Get unique visit IDs
        const visitIds = [...new Set(billPrepData.map(bill => bill.visit_id))];

        // Fetch visits with patient data - apply hospital filter
        let visitsQuery = supabase
          .from('visits')
          .select(`
            visit_id,
            patient_id,
            patients (
              name,
              insurance_person_no,
              hospital_name
            )
          `)
          .in('visit_id', visitIds);

        // Apply hospital filter if hospitalConfig exists
        if (hospitalConfig?.name) {
          visitsQuery = visitsQuery.eq('patients.hospital_name', hospitalConfig.name);
        }

        const { data: visitsData, error: visitsError } = await visitsQuery;

        if (visitsError) {
          console.error('Error fetching visits data:', visitsError);
          // Continue without patient data rather than failing completely
        }

        // Create a map for easy lookup
        const visitsMap = new Map();
        if (visitsData) {
          visitsData.forEach(visit => {
            visitsMap.set(visit.visit_id, visit);
          });
        }

        // Enrich bill data with patient information
        // Filter out bills that don't have matching patient data (due to hospital filter)
        const enrichedData = billPrepData.map(bill => {
          const visitData = visitsMap.get(bill.visit_id);
          // Only include bills that have matching patient data (i.e., belong to the current hospital)
          if (hospitalConfig?.name && !visitData) {
            return null; // This bill doesn't belong to the current hospital
          }
          return {
            ...bill,
            patient_name: visitData?.patients?.name || 'Unknown',
            insurance_person_no: visitData?.patients?.insurance_person_no || 'N/A'
          };
        }).filter(Boolean); // Remove null entries

        setBillData(enrichedData);
      } else {
        setBillData([]);
      }
    } catch (error) {
      console.error('Error fetching bill data:', error);
      toast.error('Failed to fetch bill data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillData();
  }, [filterDate, hospitalConfig?.name]);

  // Calculate statistics
  const stats = {
    totalBills: billData.length,
    pendingSubmission: billData.filter(b => !b.date_of_submission).length,
    submitted: billData.filter(b => b.date_of_submission && !b.received_date).length,
    received: billData.filter(b => b.received_date).length,
    totalExpected: billData.reduce((sum, b) => sum + (b.expected_amount || 0), 0),
    totalReceived: billData.reduce((sum, b) => sum + (b.received_amount || 0), 0),
    totalDeduction: billData.reduce((sum, b) => sum + (b.deduction_amount || 0), 0)
  };

  // Filter bills based on search term
  const filteredBills = billData.filter(bill =>
    bill.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.insurance_person_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.visit_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.billing_executive?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Receipt className="h-8 w-8" />
              Bill Management
            </h1>
            <p className="text-gray-600 mt-2">Manage and track all billing operations</p>
          </div>
          <Button
            onClick={handlePrintAll}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Printer className="h-4 w-4" />
            Print All Records
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBills}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Submission</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingSubmission}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.received}</div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalExpected.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{stats.totalReceived.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{stats.totalDeduction.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by patient name, insurance person no, visit ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filterDate">Filter by Date</Label>
              <Input
                id="filterDate"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchBillData}>Refresh</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bill Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredBills.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No bills found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visit ID</TableHead>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Insurance Person No.</TableHead>
                    <TableHead>Bill Preparation Date</TableHead>
                    <TableHead>Bill Amount</TableHead>
                    <TableHead>Bill Submission Date</TableHead>
                    <TableHead>Received Amount</TableHead>
                    <TableHead>Deduction Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Executive</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">{bill.visit_id}</TableCell>
                      <TableCell>{bill.patient_name || 'Unknown'}</TableCell>
                      <TableCell>{bill.insurance_person_no || 'N/A'}</TableCell>
                      <TableCell>
                        {bill.date_of_bill_preparation
                          ? format(new Date(bill.date_of_bill_preparation), 'dd/MM/yyyy')
                          : 'Not prepared'}
                      </TableCell>
                      <TableCell>₹{(bill.bill_amount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        {bill.date_of_submission
                          ? format(new Date(bill.date_of_submission), 'dd/MM/yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>₹{(bill.received_amount || 0).toLocaleString()}</TableCell>
                      <TableCell>₹{(bill.deduction_amount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        {bill.received_date ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Received
                          </span>
                        ) : bill.date_of_submission ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{bill.billing_executive || '-'}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedBill(bill)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Bill Details - {selectedBill.visit_id}</h2>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedBill(null)}
                >
                  ✕
                </Button>
              </div>

              {/* Patient Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Patient Name</Label>
                    <p className="font-medium">{selectedBill.patient_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label>Insurance Person No.</Label>
                    <p className="font-medium">{selectedBill.insurance_person_no || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Bill Preparation */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Bill Preparation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date of Bill Preparation</Label>
                    <p className="font-medium">
                      {selectedBill.date_of_bill_preparation
                        ? format(new Date(selectedBill.date_of_bill_preparation), 'dd/MM/yyyy')
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Label>Bill Amount</Label>
                    <p className="font-medium">₹{(selectedBill.bill_amount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Expected Amount</Label>
                    <p className="font-medium">₹{(selectedBill.expected_amount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Billing Executive</Label>
                    <p className="font-medium">{selectedBill.billing_executive || 'Not assigned'}</p>
                  </div>
                  {selectedBill.reason_for_delay && (
                    <div className="col-span-2">
                      <Label>Reason for Delay</Label>
                      <p className="font-medium">{selectedBill.reason_for_delay}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bill Submission */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Bill Submission</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date of Submission</Label>
                    <p className="font-medium">
                      {selectedBill.date_of_submission
                        ? format(new Date(selectedBill.date_of_submission), 'dd/MM/yyyy')
                        : 'Not submitted'}
                    </p>
                  </div>
                  <div>
                    <Label>Executive Who Submitted</Label>
                    <p className="font-medium">{selectedBill.executive_who_submitted || 'Not submitted'}</p>
                  </div>
                </div>
              </div>

              {/* Received Amount */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Received Amount</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Received Date</Label>
                    <p className="font-medium">
                      {selectedBill.received_date
                        ? format(new Date(selectedBill.received_date), 'dd/MM/yyyy')
                        : 'Not received'}
                    </p>
                  </div>
                  <div>
                    <Label>Received Amount</Label>
                    <p className="font-medium">₹{(selectedBill.received_amount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Deduction Amount</Label>
                    <p className="font-medium">₹{(selectedBill.deduction_amount || 0).toLocaleString()}</p>
                  </div>
                  {selectedBill.reason_for_deduction && (
                    <div>
                      <Label>Reason for Deduction</Label>
                      <p className="font-medium">{selectedBill.reason_for_deduction}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bill Link/Referral Letter */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Bill Link/Referral Letter</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Bill Link</Label>
                    {selectedBill.bill_link_spreadsheet ? (
                      <a
                        href={selectedBill.bill_link_spreadsheet}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Link className="h-4 w-4" />
                        View Spreadsheet
                      </a>
                    ) : (
                      <p className="text-gray-500">No link available</p>
                    )}
                  </div>
                  <div>
                    <Label>Referral Letter</Label>
                    {selectedBill.referral_letter ? (
                      <a
                        href={`${supabase.storage.from('patient-documents').getPublicUrl(selectedBill.referral_letter).data.publicUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        View Document
                      </a>
                    ) : (
                      <p className="text-gray-500">No document uploaded</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePrint(selectedBill)}
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedBill(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillManagement;