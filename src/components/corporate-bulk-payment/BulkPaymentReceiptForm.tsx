import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCorporateData } from '@/hooks/useCorporateData';
import { useCreateCorporateBulkPayment } from '@/hooks/useCorporateBulkPayments';
import { AllocationRow, CORPORATE_PAYMENT_MODES } from '@/types/corporateBulkPayment';
import PatientAllocationTable from './PatientAllocationTable';

interface BulkPaymentReceiptFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const BulkPaymentReceiptForm: React.FC<BulkPaymentReceiptFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { user, hospitalConfig } = useAuth();
  const { corporateOptions, loading: corporatesLoading } = useCorporateData();
  const createMutation = useCreateCorporateBulkPayment();

  const [corporateName, setCorporateName] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMode, setPaymentMode] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [narration, setNarration] = useState('');
  const [allocations, setAllocations] = useState<AllocationRow[]>([]);

  const totalAllocated = allocations.reduce(
    (sum, a) => sum + (parseFloat(a.amount) || 0),
    0
  );

  const handleSubmit = async () => {
    // Validation
    if (!corporateName) {
      toast.error('Please select a corporate');
      return;
    }
    if (!paymentDate) {
      toast.error('Please select a payment date');
      return;
    }
    if (!paymentMode) {
      toast.error('Please select a payment mode');
      return;
    }
    if (allocations.length === 0) {
      toast.error('Please add at least one patient allocation');
      return;
    }

    const validAllocations = allocations.filter(
      (a) => a.patient_name && parseFloat(a.amount) > 0
    );

    if (validAllocations.length === 0) {
      toast.error('Each allocation must have a patient and amount greater than 0');
      return;
    }

    // Find corporate_id from options
    const selectedCorporate = corporateOptions.find(
      (c) => c.value === corporateName
    );

    try {
      await createMutation.mutateAsync({
        header: {
          corporate_name: corporateName,
          corporate_id: null, // corporate table uses name-based matching
          payment_date: paymentDate,
          payment_mode: paymentMode,
          reference_number: referenceNumber || null,
          bank_name: bankName || null,
          total_amount: totalAllocated,
          narration: narration || null,
          hospital_name: hospitalConfig.name,
          created_by: user?.email || null,
        },
        allocations: validAllocations.map((a) => ({
          patient_id: a.patient_id || null,
          patient_name: a.patient_name,
          patients_id: a.patients_id || null,
          visit_id: a.visit_id || null,
          amount: parseFloat(a.amount),
          remarks: a.remarks || null,
        })),
      });

      toast.success('Corporate bulk payment receipt saved successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Error saving bulk payment:', error);
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`);
    }
  };

  const showBankField = paymentMode && paymentMode !== 'CASH' && paymentMode !== 'UPI';

  return (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      {/* Payment Header Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Corporate *</Label>
          <SearchableSelect
            options={corporateOptions}
            value={corporateName}
            onValueChange={setCorporateName}
            placeholder="Select corporate..."
            searchPlaceholder="Search corporates..."
          />
        </div>

        <div className="space-y-2">
          <Label>Payment Date *</Label>
          <Input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Payment Mode *</Label>
          <Select value={paymentMode} onValueChange={setPaymentMode}>
            <SelectTrigger>
              <SelectValue placeholder="Select mode..." />
            </SelectTrigger>
            <SelectContent>
              {CORPORATE_PAYMENT_MODES.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Reference / UTR Number</Label>
          <Input
            placeholder="Cheque no., UTR, transaction ref..."
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />
        </div>

        {showBankField && (
          <div className="space-y-2">
            <Label>Bank Name</Label>
            <Input
              placeholder="Bank name..."
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2 md:col-span-2">
          <Label>Narration / Remarks</Label>
          <Textarea
            placeholder="Optional narration..."
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {/* Patient Allocation */}
      <PatientAllocationTable
        allocations={allocations}
        onAllocationsChange={setAllocations}
      />

      {/* Total & Actions */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="text-lg font-semibold">
          Total Amount: Rs. {totalAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Saving...' : 'Save Receipt'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkPaymentReceiptForm;
