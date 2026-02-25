import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ITTransaction, IT_TRANSACTION_TYPES, IT_DEPARTMENTS } from '@/types/itTransaction';
import { useCreateITTransaction, useUpdateITTransaction } from '@/hooks/useITTransactions';

interface ITTransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData: ITTransaction | null;
}

const ITTransactionFormDialog: React.FC<ITTransactionFormDialogProps> = ({
  open,
  onOpenChange,
  editData,
}) => {
  const { hospitalConfig, user } = useAuth();
  const createMutation = useCreateITTransaction();
  const updateMutation = useUpdateITTransaction();

  const [form, setForm] = useState({
    transaction_date: '',
    patient_id: '',
    admission_id: '',
    voucher_no: '',
    invoice_amount: 0,
    discount_amount: 0,
    net_bill_amount: 0,
    cash_amount: 0,
    other_mode_amount: 0,
    transaction_type: '',
    department: '',
    treatment_code: '',
    remarks: '',
  });

  useEffect(() => {
    if (editData) {
      setForm({
        transaction_date: editData.transaction_date || '',
        patient_id: editData.patient_id || '',
        admission_id: editData.admission_id || '',
        voucher_no: editData.voucher_no || '',
        invoice_amount: Number(editData.invoice_amount) || 0,
        discount_amount: Number(editData.discount_amount) || 0,
        net_bill_amount: Number(editData.net_bill_amount) || 0,
        cash_amount: Number(editData.cash_amount) || 0,
        other_mode_amount: Number(editData.other_mode_amount) || 0,
        transaction_type: editData.transaction_type || '',
        department: editData.department || '',
        treatment_code: editData.treatment_code || '',
        remarks: editData.remarks || '',
      });
    } else {
      setForm({
        transaction_date: new Date().toISOString().split('T')[0],
        patient_id: '',
        admission_id: '',
        voucher_no: '',
        invoice_amount: 0,
        discount_amount: 0,
        net_bill_amount: 0,
        cash_amount: 0,
        other_mode_amount: 0,
        transaction_type: '',
        department: '',
        treatment_code: '',
        remarks: '',
      });
    }
  }, [editData, open]);

  // Auto-compute net_bill_amount
  useEffect(() => {
    const net = Number(form.invoice_amount || 0) - Number(form.discount_amount || 0);
    setForm((prev) => ({ ...prev, net_bill_amount: Math.max(0, net) }));
  }, [form.invoice_amount, form.discount_amount]);

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.transaction_date || !form.voucher_no || !form.transaction_type || !form.department) {
      toast.error('Please fill all required fields (Date, Voucher No, Transaction Type, Department)');
      return;
    }

    try {
      if (editData) {
        await updateMutation.mutateAsync({
          id: editData.id,
          transaction_date: form.transaction_date,
          patient_id: form.patient_id || null,
          admission_id: form.admission_id || null,
          voucher_no: form.voucher_no,
          invoice_amount: Number(form.invoice_amount),
          discount_amount: Number(form.discount_amount),
          net_bill_amount: Number(form.net_bill_amount),
          cash_amount: Number(form.cash_amount),
          other_mode_amount: Number(form.other_mode_amount),
          transaction_type: form.transaction_type,
          department: form.department,
          treatment_code: form.treatment_code || null,
          remarks: form.remarks || null,
        });
        toast.success('Transaction updated successfully');
      } else {
        await createMutation.mutateAsync({
          transaction_date: form.transaction_date,
          patient_id: form.patient_id || null,
          admission_id: form.admission_id || null,
          voucher_no: form.voucher_no,
          invoice_amount: Number(form.invoice_amount),
          discount_amount: Number(form.discount_amount),
          net_bill_amount: Number(form.net_bill_amount),
          cash_amount: Number(form.cash_amount),
          other_mode_amount: Number(form.other_mode_amount),
          transaction_type: form.transaction_type,
          department: form.department,
          treatment_code: form.treatment_code || null,
          hospital_name: hospitalConfig.name,
          remarks: form.remarks || null,
          created_by: user?.email || null,
        });
        toast.success('Transaction added successfully');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Check if cash + other != net_bill
  const paymentMismatch =
    form.net_bill_amount > 0 &&
    (Number(form.cash_amount) + Number(form.other_mode_amount)) !== form.net_bill_amount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Row 1 */}
          <div className="space-y-1">
            <Label className="text-sm">Transaction Date *</Label>
            <Input
              type="date"
              value={form.transaction_date}
              onChange={(e) => handleChange('transaction_date', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Patient ID (UHID)</Label>
            <Input
              placeholder="Enter UHID"
              value={form.patient_id}
              onChange={(e) => handleChange('patient_id', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Admission ID</Label>
            <Input
              placeholder="Enter Admission ID"
              value={form.admission_id}
              onChange={(e) => handleChange('admission_id', e.target.value)}
            />
          </div>

          {/* Row 2 */}
          <div className="space-y-1">
            <Label className="text-sm">Voucher No *</Label>
            <Input
              placeholder="Enter Voucher No"
              value={form.voucher_no}
              onChange={(e) => handleChange('voucher_no', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Department *</Label>
            <Select value={form.department} onValueChange={(v) => handleChange('department', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {IT_DEPARTMENTS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Transaction Type *</Label>
            <Select value={form.transaction_type} onValueChange={(v) => handleChange('transaction_type', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                {IT_TRANSACTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 3 - Amounts */}
          <div className="space-y-1">
            <Label className="text-sm">Invoice Amount</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.invoice_amount}
              onChange={(e) => handleChange('invoice_amount', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Discount Amount</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.discount_amount}
              onChange={(e) => handleChange('discount_amount', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Net Bill Amount</Label>
            <Input
              type="number"
              value={form.net_bill_amount}
              disabled
              className="bg-gray-100 font-medium"
            />
          </div>

          {/* Row 4 - Payment */}
          <div className="space-y-1">
            <Label className="text-sm">Cash Amount</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.cash_amount}
              onChange={(e) => handleChange('cash_amount', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Other Mode Amount</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.other_mode_amount}
              onChange={(e) => handleChange('other_mode_amount', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Treatment Code</Label>
            <Input
              placeholder="Enter treatment code"
              value={form.treatment_code}
              onChange={(e) => handleChange('treatment_code', e.target.value)}
            />
          </div>

          {/* Row 5 - Remarks */}
          <div className="md:col-span-3 space-y-1">
            <Label className="text-sm">Remarks</Label>
            <Textarea
              placeholder="Optional notes..."
              value={form.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {paymentMismatch && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
            Warning: Cash ({form.cash_amount}) + Other Mode ({form.other_mode_amount}) = {Number(form.cash_amount) + Number(form.other_mode_amount)} does not match Net Bill ({form.net_bill_amount})
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : editData ? 'Update' : 'Add Transaction'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ITTransactionFormDialog;
