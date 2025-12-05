// Direct Sale Bills View Component
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Search, Eye, Printer, FileText, Edit, Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DirectSaleBill {
  bill_number: string;
  bill_date: string;
  patient_name: string;
  doctor_name: string;
  payment_mode: string;
  total_amount: number;
  net_amount: number;
  discount_amount: number;
  is_hope_employee: boolean;
  created_at: string;
}

interface PatientGroup {
  patient_name: string;
  total_amount: number;
  bills: DirectSaleBill[];
}

const DirectSaleView: React.FC = () => {
  const { toast } = useToast();
  const { hospitalConfig } = useAuth();
  const [bills, setBills] = useState<DirectSaleBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [patientGroups, setPatientGroups] = useState<PatientGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<PatientGroup[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientGroup | null>(null);

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    // Filter patient groups based on search term
    if (searchTerm) {
      const filtered = patientGroups.filter(group =>
        group.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups(patientGroups);
    }
  }, [searchTerm, patientGroups]);

  const fetchBills = async () => {
    try {
      setLoading(true);

      // Get all bills
      const { data, error } = await supabase
        .from('direct_sale_bills')
        .select('bill_number, bill_date, patient_name, doctor_name, payment_mode, total_amount, net_amount, discount_amount, is_hope_employee, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by bill_number to get unique bills
      const uniqueBills: { [key: string]: DirectSaleBill } = {};
      data?.forEach(bill => {
        if (!uniqueBills[bill.bill_number]) {
          uniqueBills[bill.bill_number] = bill;
        }
      });

      const billsArray = Object.values(uniqueBills);
      setBills(billsArray);

      // Group bills by patient name
      const grouped: { [key: string]: PatientGroup } = {};
      billsArray.forEach(bill => {
        if (!grouped[bill.patient_name]) {
          grouped[bill.patient_name] = {
            patient_name: bill.patient_name,
            total_amount: 0,
            bills: []
          };
        }
        grouped[bill.patient_name].bills.push(bill);
        grouped[bill.patient_name].total_amount += bill.total_amount;
      });

      const groups = Object.values(grouped);
      setPatientGroups(groups);
      setFilteredGroups(groups);
    } catch (error: any) {
      console.error('Error fetching bills:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch direct sale bills',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewBill = async (billNumber: string) => {
    try {
      // Fetch all items for this bill
      const { data, error } = await supabase
        .from('direct_sale_bills')
        .select('*')
        .eq('bill_number', billNumber);

      if (error) throw error;

      if (data && data.length > 0) {
        // Generate print view
        printBillDetails(data);
      }
    } catch (error: any) {
      console.error('Error fetching bill details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch bill details',
        variant: 'destructive'
      });
    }
  };

  const printBillDetails = (billData: any[]) => {
    const firstRow = billData[0];
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Direct Sale Bill - ${firstRow.bill_number}</title>
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
          <p>Direct Sales Bill</p>
          <p>${hospitalConfig?.address || ''}</p>
        </div>

        <div class="bill-info">
          <table>
            <tr>
              <td>Bill Number:</td>
              <td>${firstRow.bill_number}</td>
            </tr>
            <tr>
              <td>Date & Time:</td>
              <td>${new Date(firstRow.bill_date).toLocaleString()}</td>
            </tr>
            <tr>
              <td>Patient Name:</td>
              <td>${firstRow.patient_name}</td>
            </tr>
            <tr>
              <td>Doctor Name:</td>
              <td>${firstRow.doctor_name || 'N/A'}</td>
            </tr>
            <tr>
              <td>Payment Mode:</td>
              <td>${firstRow.payment_mode}</td>
            </tr>
            ${firstRow.is_hope_employee ? '<tr><td colspan="2"><strong>FOR HOPE EMPLOYEE</strong></td></tr>' : ''}
          </table>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Batch No.</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${billData.map(item => `
              <tr>
                <td>${item.item_name}</td>
                <td>${item.batch_no || 'N/A'}</td>
                <td>${item.quantity} ${item.quantity_unit}</td>
                <td>${formatCurrency(item.price || 0)}</td>
                <td>${formatCurrency(item.amount || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr class="grand-total">
              <td>TOTAL:</td>
              <td>${formatCurrency(firstRow.total_amount)}</td>
            </tr>
            <tr>
              <td>Payment Mode:</td>
              <td>${firstRow.payment_mode}</td>
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

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Direct Sale Bills
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Button onClick={fetchBills} variant="outline">
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Split View: Patient List + Bill Details */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left: Patient List */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Patients</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No patients found' : 'No bills found'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient Name</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGroups.map((group) => (
                        <TableRow
                          key={group.patient_name}
                          className={selectedPatient?.patient_name === group.patient_name ? 'bg-blue-50' : ''}
                        >
                          <TableCell className="font-medium">{group.patient_name}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(group.total_amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant={selectedPatient?.patient_name === group.patient_name ? 'default' : 'outline'}
                              onClick={() => setSelectedPatient(group)}
                            >
                              <Eye className="h-4 w-4" />
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
        </div>

        {/* Right: Bill Details for Selected Patient */}
        <div className="col-span-8">
          {selectedPatient ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Patient Name: {selectedPatient.patient_name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedPatient(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bill No.</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amt.(Rs)</TableHead>
                        <TableHead className="text-right">Paid(Rs)</TableHead>
                        <TableHead className="text-right">Discount</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPatient.bills.map((bill) => (
                        <TableRow key={bill.bill_number}>
                          <TableCell className="font-medium">{bill.bill_number}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs">
                              {bill.payment_mode}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(bill.bill_date)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(bill.total_amount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(bill.net_amount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(bill.discount_amount || 0)}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewBill(bill.bill_number)}
                                className="h-8 w-8 p-0"
                                title="Print"
                              >
                                <Printer className="h-4 w-4 text-gray-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title="Download"
                              >
                                <Download className="h-4 w-4 text-green-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16">
                <div className="text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a patient to view their bills</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectSaleView;
