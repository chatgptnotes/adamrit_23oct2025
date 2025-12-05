// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Edit3 } from 'lucide-react';
import { useFinalBillData } from '@/hooks/useFinalBillData';

interface EditableFinalBillTabProps {
  patient: any;
  visitId: string;
}

interface BillItem {
  id: string;
  srNo: string;
  description: string;
  code: string;
  rate: number;
  qty: number;
  amount: number;
  type: 'standard' | 'surgical';
}

interface PatientInfo {
  billNo: string;
  claimId: string;
  registrationNo: string;
  name: string;
  age: string;
  sex: string;
  contactNo: string;
  address: string;
  beneficiaryName: string;
  relation: string;
  rank: string;
  serviceNo: string;
  category: string;
  diagnosis: string;
  dateOfAdmission: string;
  dateOfDischarge: string;
  billDate: string;
}

const relationOptions = ['SELF', 'SPOUSE', 'FATHER', 'MOTHER', 'SON', 'DAUGHTER', 'BROTHER', 'SISTER'];
const categoryOptions = ['GENERAL', 'OBC', 'SC', 'ST'];
const sexOptions = ['Male', 'Female', 'Other'];

export const EditableFinalBillTab: React.FC<EditableFinalBillTabProps> = ({ patient, visitId }) => {
  const queryClient = useQueryClient();
  const { billData, isLoading, saveBill, isSaving } = useFinalBillData(visitId);
  
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    billNo: '',
    claimId: '',
    registrationNo: '',
    name: '',
    age: '',
    sex: '',
    contactNo: '',
    address: '',
    beneficiaryName: '',
    relation: 'SELF',
    rank: '',
    serviceNo: '',
    category: 'GENERAL',
    diagnosis: '',
    dateOfAdmission: '',
    dateOfDischarge: '',
    billDate: new Date().toISOString().split('T')[0],
  });

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch patient data when component mounts
  const { data: patientData } = useQuery({
    queryKey: ['patient-data', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return null;
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patient.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching patient:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!patient?.id,
  });

  // Fetch visit data for admission/discharge dates
  const { data: visitData } = useQuery({
    queryKey: ['visit-data', visitId],
    queryFn: async () => {
      if (!visitId) return null;
      
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('visit_id', visitId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching visit:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!visitId,
  });

  // Initialize patient info when data is loaded
  useEffect(() => {
    if (patientData) {
      setPatientInfo(prev => ({
        ...prev,
        billNo: billData?.bill_no || `BL24D-${Date.now()}`,
        claimId: billData?.claim_id || `CLAIM-${Date.now()}`,
        registrationNo: patientData.registration_number || '',
        name: patientData.name || '',
        age: patientData.age?.toString() || '',
        sex: patientData.sex || '',
        contactNo: patientData.contact_no || '',
        address: patientData.address || '',
        beneficiaryName: patientData.beneficiary_name || patientData.name || '',
        relation: patientData.relation || 'SELF',
        rank: patientData.rank || '',
        serviceNo: patientData.service_no || '',
        category: patientData.category || 'GENERAL',
        diagnosis: patientData.diagnosis || '',
        dateOfAdmission: visitData?.date_of_admission ? format(new Date(visitData.date_of_admission), 'yyyy-MM-dd') : '',
        dateOfDischarge: visitData?.date_of_discharge ? format(new Date(visitData.date_of_discharge), 'yyyy-MM-dd') : '',
        billDate: billData?.date || new Date().toISOString().split('T')[0],
      }));
    }
  }, [patientData, visitData, billData]);

  // Initialize bill items when bill data is loaded
  useEffect(() => {
    if (billData?.line_items) {
      const items = billData.line_items.map(item => ({
        id: item.id,
        srNo: item.sr_no,
        description: item.item_description,
        code: item.cghs_nabh_code || '',
        rate: item.cghs_nabh_rate || 0,
        qty: item.qty || 1,
        amount: item.amount || 0,
        type: item.item_type || 'standard',
      }));
      setBillItems(items);
    }
  }, [billData]);

  const addNewItem = () => {
    const newItem: BillItem = {
      id: `new-${Date.now()}`,
      srNo: (billItems.length + 1).toString(),
      description: '',
      code: '',
      rate: 0,
      qty: 1,
      amount: 0,
      type: 'standard',
    };
    setBillItems([...billItems, newItem]);
  };

  const removeItem = (id: string) => {
    setBillItems(billItems.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof BillItem, value: any) => {
    setBillItems(items => 
      items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Auto-calculate amount when rate or qty changes
          if (field === 'rate' || field === 'qty') {
            updatedItem.amount = updatedItem.rate * updatedItem.qty;
          }
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  const calculateTotalAmount = () => {
    return billItems.reduce((total, item) => total + (item.amount || 0), 0);
  };

  const handleSave = async () => {
    try {
      const totalAmount = calculateTotalAmount();
      
      const billDataToSave = {
        patient_id: patient.id,
        bill_no: patientInfo.billNo,
        claim_id: patientInfo.claimId,
        date: patientInfo.billDate,
        category: patientInfo.category,
        total_amount: totalAmount,
        sections: [],
        line_items: billItems.map((item, index) => ({
          srNo: item.srNo,
          description: item.description,
          code: item.code,
          rate: item.rate,
          qty: item.qty,
          amount: item.amount,
          type: item.type,
        })),
      };

      await saveBill(billDataToSave);
      
      toast.success(`✅ Bill saved successfully! Total: ₹${totalAmount.toLocaleString('en-IN')}`);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error saving bill:', error);
      toast.error('Failed to save bill. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading bill data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Top Controls - Date and Start Package */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Please select date:</label>
          <input 
            type="date" 
            className="border border-gray-300 rounded px-3 py-1 text-sm"
            defaultValue={format(new Date(), 'yyyy-MM-dd')}
          />
        </div>
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
          Start Package
        </button>
      </div>

      {/* Financial Summary Table - Above Header */}
      <div className="mb-6">
        <div className="overflow-x-auto">
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
      </div>

      {/* Action Buttons Section - Above Header */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
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

      {/* Header with Edit Toggle */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Final Bill - {isEditing ? 'Edit Mode' : 'View Mode'}</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "destructive" : "default"}
            className="flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            {isEditing ? 'Cancel Edit' : 'Edit Bill'}
          </Button>
          
          {isEditing && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Bill'}
            </Button>
          )}
        </div>
      </div>

      {/* Patient Information Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>Bill No.</Label>
            <Input
              value={patientInfo.billNo}
              onChange={(e) => setPatientInfo(prev => ({ ...prev, billNo: e.target.value }))}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>Claim ID</Label>
            <Input
              value={patientInfo.claimId}
              onChange={(e) => setPatientInfo(prev => ({ ...prev, claimId: e.target.value }))}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>Registration No.</Label>
            <Input
              value={patientInfo.registrationNo}
              onChange={(e) => setPatientInfo(prev => ({ ...prev, registrationNo: e.target.value }))}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>Patient Name</Label>
            <Input
              value={patientInfo.name}
              onChange={(e) => setPatientInfo(prev => ({ ...prev, name: e.target.value }))}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>Age</Label>
            <Input
              value={patientInfo.age}
              onChange={(e) => setPatientInfo(prev => ({ ...prev, age: e.target.value }))}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>Sex</Label>
            {isEditing ? (
              <Select value={patientInfo.sex} onValueChange={(value) => setPatientInfo(prev => ({ ...prev, sex: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sexOptions.map(sex => (
                    <SelectItem key={sex} value={sex}>{sex}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={patientInfo.sex} disabled className="mt-1" />
            )}
          </div>
          
          <div>
            <Label>Contact No.</Label>
            <Input
              value={patientInfo.contactNo}
              onChange={(e) => setPatientInfo(prev => ({ ...prev, contactNo: e.target.value }))}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>Relation</Label>
            {isEditing ? (
              <Select value={patientInfo.relation} onValueChange={(value) => setPatientInfo(prev => ({ ...prev, relation: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {relationOptions.map(relation => (
                    <SelectItem key={relation} value={relation}>{relation}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={patientInfo.relation} disabled className="mt-1" />
            )}
          </div>
          
          <div>
            <Label>Category</Label>
            {isEditing ? (
              <Select value={patientInfo.category} onValueChange={(value) => setPatientInfo(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={patientInfo.category} disabled className="mt-1" />
            )}
          </div>
          
          <div className="col-span-full">
            <Label>Address</Label>
            <Textarea
              value={patientInfo.address}
              onChange={(e) => setPatientInfo(prev => ({ ...prev, address: e.target.value }))}
              disabled={!isEditing}
              className="mt-1"
              rows={2}
            />
          </div>
          
          <div className="col-span-full">
            <Label>Diagnosis</Label>
            <Textarea
              value={patientInfo.diagnosis}
              onChange={(e) => setPatientInfo(prev => ({ ...prev, diagnosis: e.target.value }))}
              disabled={!isEditing}
              className="mt-1"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bill Items Section */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bill Items</CardTitle>
          {isEditing && (
            <Button onClick={addNewItem} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SR NO</TableHead>
                <TableHead>ITEM</TableHead>
                <TableHead>CODE</TableHead>
                <TableHead>RATE</TableHead>
                <TableHead>QTY</TableHead>
                <TableHead>AMOUNT</TableHead>
                {isEditing && <TableHead>ACTIONS</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {billItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Input
                      value={item.srNo}
                      onChange={(e) => updateItem(item.id, 'srNo', e.target.value)}
                      disabled={!isEditing}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      disabled={!isEditing}
                      className="min-w-[200px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.code}
                      onChange={(e) => updateItem(item.id, 'code', e.target.value)}
                      disabled={!isEditing}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      disabled={!isEditing}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                      disabled={!isEditing}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">₹{item.amount.toLocaleString('en-IN')}</div>
                  </TableCell>
                  {isEditing && (
                    <TableCell>
                      <Button
                        onClick={() => removeItem(item.id)}
                        variant="destructive"
                        size="sm"
                        className="w-8 h-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Total Amount */}
      <div className="bg-black text-white p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold">TOTAL BILL AMOUNT</span>
          <span className="text-xl font-bold">₹{calculateTotalAmount().toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Footer Information */}
      <div className="text-sm text-gray-600 space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Bill Date:</strong> {patientInfo.billDate ? format(new Date(patientInfo.billDate), 'dd/MM/yyyy') : 'N/A'}
          </div>
          <div>
            <strong>Admission Date:</strong> {patientInfo.dateOfAdmission ? format(new Date(patientInfo.dateOfAdmission), 'dd/MM/yyyy') : 'N/A'}
          </div>
          <div>
            <strong>Discharge Date:</strong> {patientInfo.dateOfDischarge ? format(new Date(patientInfo.dateOfDischarge), 'dd/MM/yyyy') : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};