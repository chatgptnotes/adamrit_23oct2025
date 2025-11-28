
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, Plus, Printer, Edit } from 'lucide-react';

const Prescriptions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Empty prescriptions array
  const prescriptions: any[] = [];

  // Sales Bill Data
  const salesData = {
    patientName: 'Lila Ganvir',
    patientId: 'IH25F05013',
    billDetails: [
      {
        billNo: 'SB-28466',
        mode: 'Credit',
        date: '06/06/2025',
        amount: 194.00,
        paid: 0.00,
        discount: 0.00,
        netAmount: 194.00,
        prescriptionData: [
          { medicine: 'HEPARIN', quantity: 1 },
          { medicine: 'SURGICAL PRODUCT', quantity: 1 },
          { medicine: 'Inj SODIUM CHLORIDE(0.9%W/V)100ML I.V', quantity: 1 }
        ]
      },
      {
        billNo: 'SB-28331',
        mode: 'Credit',
        date: '05/06/2025',
        amount: 854.00,
        paid: 0.00,
        discount: 0.00,
        netAmount: 854.00,
        prescriptionData: [
          { medicine: 'NICORNADIL (5MG)', quantity: 2 },
          { medicine: 'BISOPROLOL-2.5 MG TAB', quantity: 1 },
          { medicine: 'ATORVASTINE-40MG TAB', quantity: 2 },
          { medicine: 'Torasemide (20mg)', quantity: 2 }
        ]
      },
      {
        billNo: 'SB-28200',
        mode: 'Credit',
        date: '04/06/2025',
        amount: 450.00,
        paid: 0.00,
        discount: 0.00,
        netAmount: 450.00,
        prescriptionData: [
          { medicine: 'METFORMIN 500mg', quantity: 2 },
          { medicine: 'LISINOPRIL 10mg', quantity: 1 },
          { medicine: 'VITAMIN D3', quantity: 1 }
        ]
      },
      {
        billNo: 'SB-28100',
        mode: 'Credit',
        date: '03/06/2025',
        amount: 320.00,
        paid: 0.00,
        discount: 0.00,
        netAmount: 320.00,
        prescriptionData: [
          { medicine: 'AMOXICILLIN 500mg', quantity: 2 },
          { medicine: 'PARACETAMOL 500mg', quantity: 1 },
          { medicine: 'COUGH SYRUP', quantity: 1 }
        ]
      }
    ]
  };

  const filteredPrescriptions = prescriptions.filter(prescription =>
    prescription.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.doctor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = salesData.billDetails.reduce((sum, bill) => sum + bill.netAmount, 0);

  const handleNewPrescription = () => {
    console.log('Creating new prescription');
  };

  const handlePrint = (prescriptionId?: number) => {
    console.log('Printing prescription:', prescriptionId);
    window.print();
  };

  const handleEdit = (prescriptionId: number) => {
    console.log('Editing prescription:', prescriptionId);
  };

  const handleRowSelect = (index: number) => {
    setSelectedRows(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleGeneratePrescription = () => {
    if (selectedRows.length > 0) {
      setIsModalOpen(true);
    } else {
      alert('Please select at least one row');
    }
  };

  const handleMoneyCollected = () => {
    console.log('Money collected functionality');
  };

  const handleClosePrescriptionModal = () => {
    setIsModalOpen(false);
  };

  const handlePrintPrescription = () => {
    // Hide all other elements and show only prescription content for printing
    const originalContent = document.body.innerHTML;
    const prescriptionContent = document.getElementById('prescription-content');
    
    if (prescriptionContent) {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Prescription Print</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 0; 
                  padding: 20px;
                }
                .prescription-container {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-bottom: 20px;
                }
                .prescription-item {
                  border: 1px solid #333;
                  padding: 15px;
                  break-inside: avoid;
                }
                .prescription-header {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 10px;
                }
                .logo-placeholder {
                  height: 48px;
                  width: auto;
                  background-color: #e5e7eb;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                }
                .prescription-title {
                  text-align: center;
                  font-weight: bold;
                  font-size: 14px;
                  margin-bottom: 10px;
                }
                .patient-info {
                  margin-bottom: 10px;
                  font-size: 12px;
                }
                .rx-header {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 10px;
                  font-size: 12px;
                }
                .medicine-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 10px;
                  font-size: 12px;
                }
                .medicine-table td {
                  border: 1px solid #333;
                  padding: 4px 8px;
                }
                .doctor-signature {
                  margin-top: 20px;
                  border-top: 1px solid #333;
                  padding-top: 5px;
                  font-size: 12px;
                }
                @media print {
                  .prescription-container {
                    grid-template-columns: 1fr 1fr;
                  }
                  body { margin: 0; padding: 10px; }
                }
              </style>
            </head>
            <body>
              ${prescriptionContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Prescriptions</h1>
          </div>
          <Button onClick={handleNewPrescription} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Prescription
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by patient name, ID, or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Prescriptions</p>
                  <p className="text-2xl font-bold">{prescriptions.length}</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Prescriptions</p>
                  <p className="text-2xl font-bold">
                    {prescriptions.filter(p => p.status === 'Active').length}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Prescriptions</p>
                  <p className="text-2xl font-bold">
                    {prescriptions.filter(p => p.status === 'Completed').length}
                  </p>
                </div>
                <Badge className="bg-gray-100 text-gray-800">Completed</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Bill Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Sales Bill</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrint()}
                  className="flex items-center gap-1"
                >
                  <Printer className="h-3 w-3" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGeneratePrescription}
                  className="flex items-center gap-1 text-green-600 hover:text-green-800"
                >
                  <FileText className="h-3 w-3" />
                  Generate Prescription
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMoneyCollected}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  Money Collected
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm">Patient Name: {salesData.patientName}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-300 px-2 py-1 w-10">
                      <input 
                        type="checkbox" 
                        onChange={(e) => {
                          setSelectedRows(
                            e.target.checked 
                              ? salesData.billDetails.map((_, index) => index) 
                              : []
                          );
                        }}
                        checked={selectedRows.length === salesData.billDetails.length}
                      />
                    </th>
                    <th className="border border-gray-300 px-2 py-1">Bill No.</th>
                    <th className="border border-gray-300 px-2 py-1">Mode</th>
                    <th className="border border-gray-300 px-2 py-1">Date</th>
                    <th className="border border-gray-300 px-2 py-1">Amt.</th>
                    <th className="border border-gray-300 px-2 py-1">Paid</th>
                    <th className="border border-gray-300 px-2 py-1">Disc</th>
                    <th className="border border-gray-300 px-2 py-1">Net Amt</th>
                    <th className="border border-gray-300 px-2 py-1">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.billDetails.map((bill, index) => (
                    <tr key={index} className="border">
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedRows.includes(index)}
                          onChange={() => handleRowSelect(index)}
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{bill.billNo}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{bill.mode}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{bill.date}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{bill.amount.toFixed(2)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{bill.paid.toFixed(2)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{bill.discount.toFixed(2)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{bill.netAmount.toFixed(2)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="View">
                            👁️
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Print">
                            🖨️
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={4} className="border border-gray-300 px-2 py-1 text-center">Total:</td>
                    <td className="border border-gray-300 px-2 py-1 text-right">{totalAmount.toFixed(2)}</td>
                    <td className="border border-gray-300 px-2 py-1 text-right">0.00</td>
                    <td className="border border-gray-300 px-2 py-1 text-right">0.00</td>
                    <td className="border border-gray-300 px-2 py-1 text-right">{totalAmount.toFixed(2)}</td>
                    <td className="border border-gray-300 px-2 py-1"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Prescriptions List - Now shows empty state */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">All Prescriptions</h2>
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No prescriptions found</h3>
              <p className="text-muted-foreground">
                Get started by creating your first prescription.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Prescription Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-4 rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Prescription</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintPrescription}
                    className="flex items-center gap-1"
                  >
                    <Printer className="h-3 w-3" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClosePrescriptionModal}
                    className="text-red-600 hover:text-red-900"
                  >
                    ✖️
                  </Button>
                </div>
              </div>

              {/* Prescription Content for Printing */}
              <div id="prescription-content">
                <div className="prescription-container">
                  {/* Create rows with two prescriptions each */}
                  {Array.from({ length: Math.ceil(selectedRows.length / 2) }).map((_, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-2 gap-4 mb-4">
                      {[0, 1].map((colIndex) => {
                        const selectedIndex = selectedRows[rowIndex * 2 + colIndex];
                        if (selectedIndex === undefined) return null;
                        
                        const bill = salesData.billDetails[selectedIndex];
                        return (
                          <div key={bill.billNo} className="prescription-item border border-gray-300 p-2">
                            <div className="prescription-header flex justify-between mb-2">
                              <div className="logo-placeholder h-12 w-auto bg-gray-200 flex items-center justify-center text-xs">
                                NABH Logo
                              </div>
                              <div className="logo-placeholder h-12 w-auto bg-gray-200 flex items-center justify-center text-xs">
                                Hope Logo
                              </div>
                            </div>

                            <div className="prescription-title text-center mb-2">
                              <h2 className="font-bold text-sm">Prescription</h2>
                            </div>

                            <div className="patient-info mb-2">
                              <p className="text-xs"><strong>Patient Name:</strong> {salesData.patientName}</p>
                              <p className="text-xs"><strong>Registration Number:</strong> {salesData.patientId}</p>
                            </div>

                            <div className="rx-header flex justify-between mb-2">
                              <p className="text-xs">Rx</p>
                              <p className="text-xs">Date: {bill.date}</p>
                            </div>

                            <table className="medicine-table w-full text-xs border-collapse mb-2">
                              <tbody>
                                {bill.prescriptionData.map((item, index) => (
                                  <tr key={index}>
                                    <td className="border border-gray-300 px-1 py-0.5">{item.medicine}</td>
                                    <td className="border border-gray-300 px-1 py-0.5 text-center">{item.quantity}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            <div className="doctor-signature mt-4 border-t pt-1">
                              <p className="text-xs">Rajshree Mane(Nephrology)</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Prescriptions;
