// Direct Sales Bill Component
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Calendar, Trash2, Printer, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BatchInfo {
  id: string;
  batch_number: string;
  expiry_date: string;
  current_stock: number;
  mrp: number;
  selling_price: number;
  medicine_id: string;
}

interface MedicineRow {
  id: string;
  itemCode: string;
  itemName: string;
  medicineId: string;  // UUID of selected medicine
  quantity: string;
  quantityUnit: string;
  pack: string;
  batchNo: string;
  batchInventoryId: string;  // UUID of selected batch
  availableBatches: BatchInfo[];  // Available batches for this medicine
  stock: string;
  expiryDate: string;
  mrp: string;
  price: string;
  amount: string;
  quantityError: string;  // Validation error message
}

interface CompletedBill {
  billNumber: string;
  billDate: string;
  patientName: string;
  totalAmount: number;
  paymentMode: string;
  medicines: MedicineRow[];
}

const DirectSaleBill: React.FC = () => {
  const { toast } = useToast();
  const { hospitalConfig } = useAuth();
  const [forHopeEmployee, setForHopeEmployee] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [showDoctorResults, setShowDoctorResults] = useState(false);
  const [doctorSuggestions, setDoctorSuggestions] = useState<Array<{name: string}>>([]);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [totalAmount, setTotalAmount] = useState('Rs');
  const [netAmount, setNetAmount] = useState('Rs');
  const [completedBill, setCompletedBill] = useState<CompletedBill | null>(null);
  const [medicationSuggestions, setMedicationSuggestions] = useState<{[key: string]: Array<{
    id: string;
    name: string;
    generic_name?: string;
    category?: string;
    // Batch info
    batch_id?: string;
    batch_number?: string;
    current_stock?: number;
    expiry_date?: string;
    mrp?: number;
    selling_price?: number;
  }>}>({});
  const [showMedicationResults, setShowMedicationResults] = useState<{[key: string]: boolean}>({});
  const [dropdownPosition, setDropdownPosition] = useState<{[key: string]: {top: number, left: number, width: number}}>({});
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  const [medicines, setMedicines] = useState<MedicineRow[]>([
    {
      id: '1',
      itemCode: '',
      itemName: '',
      medicineId: '',
      quantity: '',
      quantityUnit: 'MSU',
      pack: '',
      batchNo: '',
      batchInventoryId: '',
      availableBatches: [],
      stock: '',
      expiryDate: '',
      mrp: '',
      price: '',
      amount: '',
      quantityError: ''
    }
  ]);

  const addNewRow = () => {
    const newRow: MedicineRow = {
      id: Date.now().toString(),
      itemCode: '',
      itemName: '',
      medicineId: '',
      quantity: '',
      quantityUnit: 'MSU',
      pack: '',
      batchNo: '',
      batchInventoryId: '',
      availableBatches: [],
      stock: '',
      expiryDate: '',
      mrp: '',
      price: '',
      amount: '',
      quantityError: ''
    };
    setMedicines([...medicines, newRow]);
  };

  const removeRow = (id: string) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter(m => m.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof MedicineRow, value: string) => {
    setMedicines(medicines.map(m => {
      if (m.id === id) {
        const updated = { ...m, [field]: value };

        // Calculate amount when quantity or price changes
        if (field === 'quantity' || field === 'price') {
          const qty = parseFloat(field === 'quantity' ? value : updated.quantity) || 0;
          const price = parseFloat(field === 'price' ? value : updated.price) || 0;
          updated.amount = (qty * price).toFixed(2);
        }

        return updated;
      }
      return m;
    }));
  };

  // Fetch medication names from medicine_master with batch inventory info
  const searchMedications = async (searchTerm: string, medicineId: string) => {
    if (searchTerm.length < 2) {
      setMedicationSuggestions(prev => ({ ...prev, [medicineId]: [] }));
      return;
    }

    try {
      console.log('🔍 Searching medications for:', searchTerm, 'medicineId:', medicineId);

      // First get medicines matching the search term
      const { data: medicines, error: medError } = await supabase
        .from('medicine_master')
        .select('id, medicine_name, generic_name, type')
        .eq('is_deleted', false)
        .ilike('medicine_name', `%${searchTerm}%`)
        .limit(10);

      if (medError) {
        console.error('❌ Error searching medications:', medError);
        throw medError;
      }

      if (!medicines || medicines.length === 0) {
        setMedicationSuggestions(prev => ({ ...prev, [medicineId]: [] }));
        return;
      }

      // Get batch inventory for these medicines
      const medicineIds = medicines.map(m => m.id);
      const { data: batches, error: batchError } = await supabase
        .from('medicine_batch_inventory')
        .select('id, medicine_id, batch_number, expiry_date, current_stock, mrp, selling_price')
        .in('medicine_id', medicineIds)
        .eq('is_active', true)
        .eq('is_expired', false)
        .gt('current_stock', 0)
        .order('expiry_date', { ascending: true });

      if (batchError) {
        console.error('❌ Error fetching batches:', batchError);
      }

      // Create dropdown items - one per batch (so user can see stock for each batch)
      const mappedData: Array<{
        id: string;
        name: string;
        generic_name?: string;
        category?: string;
        batch_id?: string;
        batch_number?: string;
        current_stock?: number;
        expiry_date?: string;
        mrp?: number;
        selling_price?: number;
      }> = [];

      medicines.forEach(med => {
        const medBatches = batches?.filter(b => b.medicine_id === med.id) || [];

        if (medBatches.length > 0) {
          // Add one entry per batch
          medBatches.forEach(batch => {
            mappedData.push({
              id: med.id,
              name: med.medicine_name,
              generic_name: med.generic_name,
              category: med.type,
              batch_id: batch.id,
              batch_number: batch.batch_number,
              current_stock: batch.current_stock,
              expiry_date: batch.expiry_date,
              mrp: batch.mrp,
              selling_price: batch.selling_price
            });
          });
        } else {
          // No stock available - show medicine but indicate no stock
          mappedData.push({
            id: med.id,
            name: med.medicine_name,
            generic_name: med.generic_name,
            category: med.type,
            current_stock: 0
          });
        }
      });

      console.log('✅ Medication search results with batches:', mappedData);
      setMedicationSuggestions(prev => ({ ...prev, [medicineId]: mappedData }));

      if (mappedData.length > 0) {
        setShowMedicationResults(prev => ({ ...prev, [medicineId]: true }));
      }
    } catch (error: any) {
      console.error('❌ Error searching medications:', error);
      toast({
        title: "Error",
        description: "Failed to search medications",
        variant: "destructive"
      });
    }
  };

  // Fetch available batches for a selected medicine from batch inventory
  const fetchBatchesForMedicine = async (medicineId: string, rowId: string) => {
    try {
      console.log('🔍 Fetching batches for medicine:', medicineId);
      const { data, error } = await supabase
        .from('medicine_batch_inventory')
        .select('id, medicine_id, batch_number, expiry_date, current_stock, mrp, selling_price')
        .eq('medicine_id', medicineId)
        .eq('is_active', true)
        .eq('is_expired', false)
        .gt('current_stock', 0)
        .order('expiry_date', { ascending: true }); // FEFO - First Expiry First Out

      if (error) {
        console.error('❌ Error fetching batches:', error);
        throw error;
      }

      console.log('✅ Available batches:', data);

      // Update the medicine row with available batches
      setMedicines(prev => prev.map(m => {
        if (m.id === rowId) {
          return {
            ...m,
            availableBatches: data || []
          };
        }
        return m;
      }));

      if (!data || data.length === 0) {
        toast({
          title: "No Stock",
          description: "No available stock found for this medicine",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Error fetching batches:', error);
    }
  };

  // Handle batch selection - auto-populate fields
  const handleBatchSelection = (rowId: string, batchId: string) => {
    setMedicines(prev => prev.map(m => {
      if (m.id === rowId) {
        const selectedBatch = m.availableBatches.find(b => b.id === batchId);
        if (selectedBatch) {
          return {
            ...m,
            batchNo: selectedBatch.batch_number,
            batchInventoryId: batchId,
            stock: selectedBatch.current_stock.toString(),
            expiryDate: selectedBatch.expiry_date,
            mrp: selectedBatch.mrp?.toString() || '',
            price: selectedBatch.selling_price?.toString() || selectedBatch.mrp?.toString() || '',
            quantityError: '' // Clear any previous error
          };
        }
      }
      return m;
    }));
  };

  // Validate quantity against available stock
  const validateQuantity = (rowId: string, quantity: string) => {
    setMedicines(prev => prev.map(m => {
      if (m.id === rowId) {
        const qty = parseFloat(quantity) || 0;
        const stock = parseFloat(m.stock) || 0;
        let error = '';

        if (qty > stock && stock > 0) {
          error = `Exceeds stock (${stock})`;
        } else if (qty <= 0 && quantity !== '') {
          error = 'Invalid quantity';
        }

        return { ...m, quantityError: error };
      }
      return m;
    }));
  };

  // Fetch doctor names from ayushman_consultants table
  const searchDoctors = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setDoctorSuggestions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ayushman_consultants')
        .select('name')
        .ilike('name', `%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      // Remove duplicates based on name
      const uniqueDoctors = data?.reduce((acc: Array<{name: string}>, curr: any) => {
        if (curr.name && !acc.some(d => d.name === curr.name)) {
          acc.push({ name: curr.name });
        }
        return acc;
      }, []) || [];

      setDoctorSuggestions(uniqueDoctors);
    } catch (error: any) {
      console.error('Error searching doctors:', error);
    }
  };

  // Handle doctor name search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (doctorSearchTerm) {
        searchDoctors(doctorSearchTerm);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [doctorSearchTerm]);

  // Calculate totals whenever medicines change
  React.useEffect(() => {
    const total = medicines.reduce((sum, med) => {
      return sum + (parseFloat(med.amount) || 0);
    }, 0);
    setTotalAmount(`Rs ${total.toFixed(2)}`);
    setNetAmount(`Rs ${total.toFixed(2)}`);
  }, [medicines]);

  const handleSubmit = async () => {
    // Validate required fields
    if (!patientName) {
      toast({
        title: "Error",
        description: "Please enter patient name",
        variant: "destructive"
      });
      return;
    }

    if (!doctorName) {
      toast({
        title: "Error",
        description: "Please enter doctor name",
        variant: "destructive"
      });
      return;
    }

    const hasValidMedicine = medicines.some(m => m.itemName && m.quantity);
    if (!hasValidMedicine) {
      toast({
        title: "Error",
        description: "Please add at least one medicine",
        variant: "destructive"
      });
      return;
    }

    // Validate batch selection for all medicines with quantity
    const medicinesWithQuantity = medicines.filter(m => m.itemName && m.quantity);
    const missingBatch = medicinesWithQuantity.find(m => !m.batchInventoryId);
    if (missingBatch) {
      toast({
        title: "Error",
        description: `Please select a batch for ${missingBatch.itemName}`,
        variant: "destructive"
      });
      return;
    }

    // Validate no quantity errors
    const hasQuantityError = medicinesWithQuantity.some(m => m.quantityError);
    if (hasQuantityError) {
      toast({
        title: "Error",
        description: "Please fix quantity errors before submitting",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Generate bill number (format: DSB-YYYY-NNNN)
      const year = new Date().getFullYear();
      const { data: lastBill } = await supabase
        .from('direct_sale_bills')
        .select('bill_number')
        .like('bill_number', `DSB-${year}-%`)
        .order('bill_number', { ascending: false })
        .limit(1);

      let billNumber = `DSB-${year}-0001`;
      if (lastBill && lastBill.length > 0) {
        const lastNumber = parseInt(lastBill[0].bill_number.split('-')[2]);
        billNumber = `DSB-${year}-${String(lastNumber + 1).padStart(4, '0')}`;
      }

      // Calculate total from medicines
      const total = medicines.reduce((sum, med) => sum + (parseFloat(med.amount) || 0), 0);

      // Insert one row per medicine (combined bill + item data)
      const validMedicines = medicines.filter(m => m.itemName && m.quantity);
      const billRows = validMedicines.map(med => ({
        bill_number: billNumber,
        is_hope_employee: forHopeEmployee,
        patient_name: patientName,
        date_of_birth: dateOfBirth || null,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        address: address || null,
        doctor_name: doctorName,
        payment_mode: paymentMode,
        total_amount: total,
        net_amount: total,
        item_code: med.itemCode || null,
        item_name: med.itemName,
        quantity: parseFloat(med.quantity),
        quantity_unit: med.quantityUnit,
        pack: med.pack || null,
        batch_no: med.batchNo || null,
        stock: med.stock || null,
        expiry_date: med.expiryDate || null,
        mrp: med.mrp ? parseFloat(med.mrp) : null,
        price: parseFloat(med.price),
        amount: parseFloat(med.amount),
        created_by: user?.email || 'system'
      }));

      const { error: insertError } = await supabase
        .from('direct_sale_bills')
        .insert(billRows);

      if (insertError) throw insertError;

      // Deduct stock from batch inventory for each medicine
      console.log('📦 Deducting stock for sold medicines...');
      for (const med of validMedicines) {
        if (med.batchInventoryId) {
          // Get current stock
          const { data: batchData, error: fetchError } = await supabase
            .from('medicine_batch_inventory')
            .select('current_stock, sold_quantity')
            .eq('id', med.batchInventoryId)
            .single();

          if (fetchError) {
            console.error('Error fetching batch:', fetchError);
            continue;
          }

          const soldQty = parseFloat(med.quantity) || 0;
          const newStock = (batchData.current_stock || 0) - soldQty;
          const newSoldQty = (batchData.sold_quantity || 0) + soldQty;

          // Update batch inventory
          const { error: updateError } = await supabase
            .from('medicine_batch_inventory')
            .update({
              current_stock: newStock,
              sold_quantity: newSoldQty,
              updated_at: new Date().toISOString()
            })
            .eq('id', med.batchInventoryId);

          if (updateError) {
            console.error('Error updating stock:', updateError);
          } else {
            console.log(`✅ Stock deducted for ${med.itemName}: ${soldQty} units (New stock: ${newStock})`);
          }

          // Log stock movement
          await supabase
            .from('batch_stock_movements')
            .insert({
              batch_id: med.batchInventoryId,
              movement_type: 'OUT',
              quantity_before: batchData.current_stock,
              quantity_changed: soldQty,
              quantity_after: newStock,
              reference_type: 'DIRECT_SALE',
              reference_id: billNumber,
              reason: `Direct sale to ${patientName}`,
              performed_by: user?.id || null
            });
        }
      }

      // Set completed bill for dialog
      setCompletedBill({
        billNumber: billNumber,
        billDate: new Date().toISOString(),
        patientName: patientName,
        totalAmount: total,
        paymentMode: paymentMode,
        medicines: validMedicines
      });

      toast({
        title: "Success",
        description: `Direct sale bill ${billNumber} created successfully. Stock has been updated.`
      });

      // Reset form
      setForHopeEmployee(false);
      setPatientName('');
      setDateOfBirth('');
      setAge('');
      setGender('');
      setAddress('');
      setDoctorName('');
      setPaymentMode('Cash');
      setMedicines([{
        id: '1',
        itemCode: '',
        itemName: '',
        medicineId: '',
        quantity: '',
        quantityUnit: 'MSU',
        pack: '',
        batchNo: '',
        batchInventoryId: '',
        availableBatches: [],
        stock: '',
        expiryDate: '',
        mrp: '',
        price: '',
        amount: '',
        quantityError: ''
      }]);

    } catch (error: any) {
      console.error('Error saving direct sale bill:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create direct sale bill",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    // Navigate back
    window.history.back();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);

  const printReceipt = () => {
    if (!completedBill) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const billDate = new Date(completedBill.billDate);
    const formattedDate = `${billDate.getDate().toString().padStart(2, '0')}/${(billDate.getMonth() + 1).toString().padStart(2, '0')}/${billDate.getFullYear()} ${billDate.getHours().toString().padStart(2, '0')}:${billDate.getMinutes().toString().padStart(2, '0')}:${billDate.getSeconds().toString().padStart(2, '0')}`;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Bill - ${completedBill.billNumber}</title>
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
            border-top: 1px solid #ccc;
            border-bottom: 1px solid #ccc;
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
              <span class="bill-info-value">${completedBill.billNumber}</span>
            </div>
            <div class="bill-info-row">
              <span class="bill-info-label">Date:</span>
              <span class="bill-info-value">${formattedDate}</span>
            </div>
            <div class="bill-info-row">
              <span class="bill-info-label">Patient:</span>
              <span class="bill-info-value">${completedBill.patientName}</span>
            </div>
            <div class="bill-info-row">
              <span class="bill-info-label">Prescribed by:</span>
              <span class="bill-info-value">${doctorName || '-'}</span>
            </div>
          </div>
          <div class="bill-info-right">
            <div class="bill-info-row">
              <span class="bill-info-label">Payment:</span>
              <span class="bill-info-value">${completedBill.paymentMode}</span>
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
            ${completedBill.medicines.map(item => `
              <tr>
                <td>${item.itemName}</td>
                <td class="center">${item.pack || '1'}</td>
                <td class="center">${item.batchNo || 'N/A'}</td>
                <td class="center">${item.expiryDate || 'N/A'}</td>
                <td class="center">${item.quantity}</td>
                <td class="amount">${parseFloat(item.amount || '0').toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          Total: Rs ${completedBill.totalAmount.toFixed(2)}
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

  return (
    <div className="space-y-6 p-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-bold text-blue-600">Direct Sales Bill</h1>
        <Button onClick={handleBack} variant="default" className="bg-blue-600">
          Back
        </Button>
      </div>

      {/* Patient Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={forHopeEmployee}
            onCheckedChange={(checked) => setForHopeEmployee(checked as boolean)}
            id="hopeEmployee"
          />
          <label htmlFor="hopeEmployee" className="text-sm font-medium">
            For Hope Employee
          </label>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">
              Name<span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter patient name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Date of Birth:</label>
            <div className="relative">
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Age:</label>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Age"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Gender:</label>
            <select
              className="w-full p-2 border rounded"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Address:</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address"
            />
          </div>
          <div className="relative">
            <label className="text-sm font-medium">
              Doctor Name:<span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Type To Search"
              value={doctorSearchTerm || doctorName}
              onChange={(e) => {
                setDoctorSearchTerm(e.target.value);
                setDoctorName(e.target.value);
                setShowDoctorResults(true);
              }}
              onFocus={() => {
                if (doctorSearchTerm && doctorSuggestions.length > 0) {
                  setShowDoctorResults(true);
                }
              }}
              onBlur={() => setTimeout(() => setShowDoctorResults(false), 200)}
            />
            {showDoctorResults && doctorSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {doctorSuggestions.map((doctor, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => {
                      setDoctorName(doctor.name);
                      setDoctorSearchTerm('');
                      setShowDoctorResults(false);
                    }}
                  >
                    <div className="font-medium text-gray-900">{doctor.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Medicine Table */}
      <div className="border rounded">
        <div className="bg-gray-100 p-2">
          <p className="text-sm text-red-500">(MSU = Minimum Saleable Unit)</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-600">
              <TableRow>
                <TableHead className="text-white">
                  Item Name<span className="text-red-500">*</span>
                </TableHead>
                <TableHead className="text-white">
                  Quantity<span className="text-red-500">*</span>
                </TableHead>
                <TableHead className="text-white">Pack</TableHead>
                <TableHead className="text-white">
                  Batch No.<span className="text-red-500">*</span>
                </TableHead>
                <TableHead className="text-white">Stock Available</TableHead>
                <TableHead className="text-white">
                  Expiry Date<span className="text-red-500">*</span>
                </TableHead>
                <TableHead className="text-white">
                  MRP<span className="text-red-500">*</span>
                </TableHead>
                <TableHead className="text-white">
                  Price<span className="text-red-500">*</span>
                </TableHead>
                <TableHead className="text-white">Amount</TableHead>
                <TableHead className="text-white">#</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicines.map((medicine) => (
                <TableRow key={medicine.id}>
                  <TableCell>
                    <Input
                      ref={(el) => inputRefs.current[medicine.id] = el}
                      className="w-48"
                      placeholder="Type To Search"
                      value={medicine.itemName}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateRow(medicine.id, 'itemName', value);
                        if (value.length >= 2) {
                          searchMedications(value, medicine.id);
                          // Calculate position for dropdown (below the input)
                          const inputEl = inputRefs.current[medicine.id];
                          if (inputEl) {
                            const rect = inputEl.getBoundingClientRect();
                            setDropdownPosition(prev => ({
                              ...prev,
                              [medicine.id]: {
                                top: rect.bottom + window.scrollY + 2,
                                left: rect.left + window.scrollX,
                                width: rect.width
                              }
                            }));
                          }
                          setShowMedicationResults(prev => ({ ...prev, [medicine.id]: true }));
                        } else {
                          setShowMedicationResults(prev => ({ ...prev, [medicine.id]: false }));
                          setMedicationSuggestions(prev => ({ ...prev, [medicine.id]: [] }));
                        }
                      }}
                      onFocus={() => {
                        if (medicine.itemName.length >= 2) {
                          searchMedications(medicine.itemName, medicine.id);
                          // Calculate position for dropdown (below the input)
                          const inputEl = inputRefs.current[medicine.id];
                          if (inputEl) {
                            const rect = inputEl.getBoundingClientRect();
                            setDropdownPosition(prev => ({
                              ...prev,
                              [medicine.id]: {
                                top: rect.bottom + window.scrollY + 2,
                                left: rect.left + window.scrollX,
                                width: rect.width
                              }
                            }));
                          }
                          setShowMedicationResults(prev => ({ ...prev, [medicine.id]: true }));
                        }
                      }}
                      onBlur={() => setTimeout(() => {
                        setShowMedicationResults(prev => ({ ...prev, [medicine.id]: false }));
                      }, 300)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Input
                          className={`w-20 ${medicine.quantityError ? 'border-red-500 bg-red-50' : ''}`}
                          type="number"
                          value={medicine.quantity}
                          onChange={(e) => {
                            updateRow(medicine.id, 'quantity', e.target.value);
                            validateQuantity(medicine.id, e.target.value);
                          }}
                          min="1"
                          max={medicine.stock || undefined}
                        />
                        <select
                          className="p-1 border rounded text-sm"
                          value={medicine.quantityUnit}
                          onChange={(e) => updateRow(medicine.id, 'quantityUnit', e.target.value)}
                        >
                          <option value="MSU">MSU</option>
                          <option value="Pack">Pack</option>
                        </select>
                      </div>
                      {medicine.quantityError && (
                        <span className="text-xs text-red-500">{medicine.quantityError}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-24"
                      value={medicine.pack}
                      onChange={(e) => updateRow(medicine.id, 'pack', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <select
                      className={`w-40 p-2 border rounded text-sm ${medicine.availableBatches.length === 0 ? 'bg-gray-100' : ''}`}
                      value={medicine.batchInventoryId}
                      onChange={(e) => handleBatchSelection(medicine.id, e.target.value)}
                      disabled={medicine.availableBatches.length === 0}
                    >
                      <option value="">{medicine.medicineId ? (medicine.availableBatches.length > 0 ? 'Select Batch' : 'No Stock') : 'Select Medicine First'}</option>
                      {medicine.availableBatches.map((batch) => {
                        const expiryDate = new Date(batch.expiry_date);
                        const today = new Date();
                        const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        const isNearExpiry = daysToExpiry <= 30;

                        return (
                          <option
                            key={batch.id}
                            value={batch.id}
                            className={isNearExpiry ? 'text-orange-600' : ''}
                          >
                            {batch.batch_number} | Qty: {batch.current_stock} | Exp: {batch.expiry_date}
                          </option>
                        );
                      })}
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-20 bg-gray-50"
                      value={medicine.stock}
                      readOnly
                      placeholder="-"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-28 bg-gray-50"
                      type="date"
                      value={medicine.expiryDate}
                      readOnly
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-20 bg-gray-50"
                      type="number"
                      value={medicine.mrp}
                      readOnly
                      placeholder="-"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-24"
                      type="number"
                      value={medicine.price}
                      onChange={(e) => updateRow(medicine.id, 'price', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-24"
                      value={medicine.amount}
                      readOnly
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeRow(medicine.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-4">
          <Button onClick={addNewRow} variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
            Add More
          </Button>
        </div>
      </div>

      {/* Payment and Total */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <label className="text-sm font-medium">
            Payment Mode:<span className="text-red-500">*</span>
          </label>
          <select
            className="w-48 p-2 border rounded"
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
          >
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
            <option value="Insurance">Insurance</option>
          </select>
        </div>
        <div className="text-right space-y-2">
          <div>
            <span className="font-medium">Total Amt :</span>
            <span className="ml-2">{totalAmount}</span>
          </div>
          <div>
            <span className="font-medium">Net Amt :</span>
            <span className="ml-2">{netAmount}</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Submit
        </Button>
      </div>

      {/* Success Dialog with Print */}
      <Dialog open={!!completedBill} onOpenChange={() => setCompletedBill(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              Bill Created Successfully!
            </DialogTitle>
          </DialogHeader>
          {completedBill && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{completedBill.billNumber}</div>
                <div className="text-muted-foreground">
                  {new Date(completedBill.billDate).toLocaleString()}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Patient Name:</span>
                  <span className="font-medium">{completedBill.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-bold">{formatCurrency(completedBill.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span>{completedBill.paymentMode}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={printReceipt}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setCompletedBill(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Fixed positioned dropdowns - rendered outside card to pop over content */}
      {medicines.map((medicine) => (
        showMedicationResults[medicine.id] &&
        medicationSuggestions[medicine.id]?.length > 0 &&
        dropdownPosition[medicine.id] && (
          <div
            key={`dropdown-${medicine.id}`}
            style={{
              position: 'fixed',
              top: `${dropdownPosition[medicine.id].top}px`,
              left: `${dropdownPosition[medicine.id].left}px`,
              width: `${Math.max(dropdownPosition[medicine.id].width, 450)}px`,
              zIndex: 99999
            }}
            className="bg-white border border-gray-300 rounded-md shadow-lg max-h-72 overflow-y-auto"
          >
            {medicationSuggestions[medicine.id].map((medication, idx) => {
              const hasStock = medication.current_stock && medication.current_stock > 0;
              const isExpiringSoon = medication.expiry_date &&
                new Date(medication.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

              return (
                <div
                  key={`${medication.id}-${medication.batch_id || idx}`}
                  className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                    hasStock ? 'hover:bg-green-50' : 'hover:bg-gray-50 opacity-60'
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (!hasStock) {
                      toast({
                        title: "No Stock",
                        description: "This medicine has no available stock",
                        variant: "destructive"
                      });
                      return;
                    }
                    // Update medicine row with all info including batch
                    setMedicines(prev => prev.map(m => {
                      if (m.id === medicine.id) {
                        const price = medication.selling_price || medication.mrp || 0;
                        const qty = parseFloat(m.quantity) || 0;
                        const amount = qty > 0 ? (qty * price).toFixed(2) : '';
                        return {
                          ...m,
                          itemName: medication.name,
                          medicineId: medication.id,
                          batchNo: medication.batch_number || '',
                          batchInventoryId: medication.batch_id || '',
                          availableBatches: [],
                          stock: medication.current_stock?.toString() || '',
                          expiryDate: medication.expiry_date || '',
                          mrp: medication.mrp?.toString() || '',
                          price: price.toString(),
                          amount: amount,
                          quantityError: ''
                        };
                      }
                      return m;
                    }));
                    setShowMedicationResults(prev => ({ ...prev, [medicine.id]: false }));
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-gray-900">{medication.name}</div>
                    {hasStock ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                        Stock: {medication.current_stock}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                        No Stock
                      </span>
                    )}
                  </div>
                  {medication.batch_number && (
                    <div className="flex gap-3 text-sm mt-1">
                      <span className="text-blue-600 font-medium">Batch: {medication.batch_number}</span>
                      {medication.expiry_date && (
                        <span className={isExpiringSoon ? 'text-orange-600' : 'text-gray-600'}>
                          Exp: {medication.expiry_date}
                        </span>
                      )}
                      {medication.mrp && (
                        <span className="text-gray-600">MRP: ₹{medication.mrp}</span>
                      )}
                    </div>
                  )}
                  {medication.generic_name && (
                    <div className="text-xs text-gray-500 mt-1">{medication.generic_name}</div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ))}
    </div>
  );
};

export default DirectSaleBill;
