import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Plus, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Type definition for a voucher type record
interface VoucherType {
  id: string;
  voucher_type_code: string;
  voucher_type_name: string;
  voucher_category: string;
  prefix: string;
  current_number: number;
  is_active: boolean;
}

// Type definition for a chart of accounts record used in the dropdown
interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
}

// A single ledger entry row in the voucher form
interface EntryRow {
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  narration: string;
}

/**
 * Generates the voucher number from a voucher type's prefix and next sequence number.
 * The number is zero-padded to 4 digits. Example: "REC0005"
 */
const generateVoucherNumber = (prefix: string, nextNum: number): string => {
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
};

const VoucherEntry: React.FC = () => {
  const queryClient = useQueryClient();

  // Form state
  const [selectedVoucherType, setSelectedVoucherType] = useState('');
  const [voucherDate, setVoucherDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [referenceNumber, setReferenceNumber] = useState('');
  const [referenceDate, setReferenceDate] = useState('');
  const [narration, setNarration] = useState('');
  const [patientId, setPatientId] = useState('');
  const [entries, setEntries] = useState<EntryRow[]>([
    { account_id: '', debit_amount: 0, credit_amount: 0, narration: '' },
    { account_id: '', debit_amount: 0, credit_amount: 0, narration: '' },
  ]);
  const [saving, setSaving] = useState(false);

  // ------ Fetch active voucher types ------
  const { data: voucherTypes = [] } = useQuery({
    queryKey: ['voucher_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voucher_types')
        .select('*')
        .eq('is_active', true)
        .order('voucher_type_name');

      if (error) throw error;
      return (data || []) as VoucherType[];
    },
  });

  // ------ Fetch active chart of accounts for the entry dropdowns ------
  const { data: accounts = [] } = useQuery({
    queryKey: ['chart_of_accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name, account_type')
        .eq('is_active', true)
        .order('account_code');

      if (error) throw error;
      return (data || []) as Account[];
    },
  });

  // ------ Derive the auto-generated voucher number ------
  const selectedType = useMemo(
    () => voucherTypes.find((vt) => vt.id === selectedVoucherType),
    [voucherTypes, selectedVoucherType]
  );

  const voucherNumber = useMemo(() => {
    if (!selectedType) return '';
    const nextNum = (selectedType.current_number || 0) + 1;
    return generateVoucherNumber(selectedType.prefix || '', nextNum);
  }, [selectedType]);

  // ------ Computed totals ------
  const totalDebit = useMemo(
    () => entries.reduce((sum, e) => sum + (e.debit_amount || 0), 0),
    [entries]
  );

  const totalCredit = useMemo(
    () => entries.reduce((sum, e) => sum + (e.credit_amount || 0), 0),
    [entries]
  );

  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;

  // ------ Entry row handlers ------
  const updateEntry = (index: number, field: keyof EntryRow, value: string | number) => {
    setEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addRow = () => {
    setEntries((prev) => [
      ...prev,
      { account_id: '', debit_amount: 0, credit_amount: 0, narration: '' },
    ]);
  };

  const removeRow = (index: number) => {
    // Don't allow removing if only 2 rows left
    if (entries.length <= 2) {
      toast.error('At least 2 entry rows are required.');
      return;
    }
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  // ------ Clear / reset the entire form ------
  const handleClear = () => {
    setSelectedVoucherType('');
    setVoucherDate(format(new Date(), 'yyyy-MM-dd'));
    setReferenceNumber('');
    setReferenceDate('');
    setNarration('');
    setPatientId('');
    setEntries([
      { account_id: '', debit_amount: 0, credit_amount: 0, narration: '' },
      { account_id: '', debit_amount: 0, credit_amount: 0, narration: '' },
    ]);
  };

  // ------ Save voucher (draft or posted) ------
  const saveVoucher = async (status: 'draft' | 'posted') => {
    // Validate voucher type selection
    if (!selectedVoucherType) {
      toast.error('Select a voucher type.');
      return;
    }

    // Filter entries that have an account selected
    const validEntries = entries.filter((e) => e.account_id);
    if (validEntries.length < 2) {
      toast.error('At least 2 entries with accounts are required.');
      return;
    }

    const debitSum = validEntries.reduce((s, e) => s + (e.debit_amount || 0), 0);
    const creditSum = validEntries.reduce((s, e) => s + (e.credit_amount || 0), 0);

    if (debitSum <= 0) {
      toast.error('Total debit amount must be greater than zero.');
      return;
    }

    // Posting requires balanced entries
    if (status === 'posted' && Math.abs(debitSum - creditSum) > 0.01) {
      toast.error('Debit and Credit must be equal to post the voucher.');
      return;
    }

    setSaving(true);

    try {
      const voucherType = voucherTypes.find((vt) => vt.id === selectedVoucherType);
      const nextNum = (voucherType?.current_number || 0) + 1;
      const generatedNumber = generateVoucherNumber(voucherType?.prefix || '', nextNum);

      // 1. Insert the voucher header
      const { data: voucher, error: vErr } = await supabase
        .from('vouchers')
        .insert({
          voucher_number: generatedNumber,
          voucher_type_id: selectedVoucherType,
          voucher_date: voucherDate,
          reference_number: referenceNumber || '',
          reference_date: referenceDate || '',
          narration: narration || '',
          total_amount: debitSum,
          patient_id: patientId || null,
          status,
          created_by: 'system',
        })
        .select()
        .single();

      if (vErr) {
        toast.error('Failed to create voucher: ' + vErr.message);
        throw vErr;
      }

      // 2. Insert all entry rows
      const entryRows = validEntries.map((e, i) => ({
        voucher_id: voucher.id,
        account_id: e.account_id,
        debit_amount: e.debit_amount || 0,
        credit_amount: e.credit_amount || 0,
        narration: e.narration || '',
        entry_order: i + 1,
      }));

      const { error: eErr } = await supabase.from('voucher_entries').insert(entryRows);
      if (eErr) {
        toast.error('Failed to save entries: ' + eErr.message);
        throw eErr;
      }

      // 3. Increment the current_number on the voucher type
      await supabase
        .from('voucher_types')
        .update({ current_number: nextNum })
        .eq('id', selectedVoucherType);

      toast.success(`Voucher ${generatedNumber} saved as ${status}.`);

      // Invalidate relevant queries and reset the form
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucher_types'] });
      handleClear();
    } catch {
      // Error toasts are already shown above
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-800">Voucher Entry</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ----- Form Header Fields ----- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Voucher Type */}
          <div className="space-y-1.5">
            <Label>Voucher Type</Label>
            <Select value={selectedVoucherType} onValueChange={setSelectedVoucherType}>
              <SelectTrigger>
                <SelectValue placeholder="Select voucher type" />
              </SelectTrigger>
              <SelectContent>
                {voucherTypes.map((vt) => (
                  <SelectItem key={vt.id} value={vt.id}>
                    {vt.voucher_type_name} ({vt.voucher_category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Voucher Number (auto-generated, read-only) */}
          <div className="space-y-1.5">
            <Label>Voucher Number</Label>
            <Input value={voucherNumber} readOnly className="bg-gray-50" />
          </div>

          {/* Voucher Date */}
          <div className="space-y-1.5">
            <Label htmlFor="voucher_date">Voucher Date</Label>
            <Input
              id="voucher_date"
              type="date"
              value={voucherDate}
              onChange={(e) => setVoucherDate(e.target.value)}
            />
          </div>

          {/* Reference Number */}
          <div className="space-y-1.5">
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Optional"
            />
          </div>

          {/* Reference Date */}
          <div className="space-y-1.5">
            <Label htmlFor="reference_date">Reference Date</Label>
            <Input
              id="reference_date"
              type="date"
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        {/* ----- Ledger Entries Table ----- */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Ledger Entries</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead className="min-w-[200px]">Account</TableHead>
                  <TableHead className="w-36 text-right">Debit (&#8377;)</TableHead>
                  <TableHead className="w-36 text-right">Credit (&#8377;)</TableHead>
                  <TableHead className="min-w-[150px]">Narration</TableHead>
                  <TableHead className="w-16 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow key={index}>
                    {/* Row number */}
                    <TableCell className="text-center text-gray-400 text-sm">
                      {index + 1}
                    </TableCell>

                    {/* Account select */}
                    <TableCell>
                      <Select
                        value={entry.account_id || 'none'}
                        onValueChange={(val) =>
                          updateEntry(index, 'account_id', val === 'none' ? '' : val)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" disabled>
                            Select account
                          </SelectItem>
                          {accounts.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.account_code} - {a.account_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Debit amount */}
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={entry.debit_amount || ''}
                        onChange={(e) =>
                          updateEntry(index, 'debit_amount', parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                        className="text-right"
                      />
                    </TableCell>

                    {/* Credit amount */}
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={entry.credit_amount || ''}
                        onChange={(e) =>
                          updateEntry(index, 'credit_amount', parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                        className="text-right"
                      />
                    </TableCell>

                    {/* Row-level narration */}
                    <TableCell>
                      <Input
                        value={entry.narration}
                        onChange={(e) => updateEntry(index, 'narration', e.target.value)}
                        placeholder="Entry narration"
                      />
                    </TableCell>

                    {/* Remove row */}
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeRow(index)}
                        disabled={entries.length <= 2}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Add row button */}
          <Button variant="outline" size="sm" onClick={addRow} className="mt-3">
            <Plus className="h-4 w-4 mr-1" />
            Add Row
          </Button>
        </div>

        {/* ----- Totals Footer ----- */}
        <div className="flex items-center justify-end gap-8 p-3 bg-gray-50 rounded-lg border">
          <div className="text-sm">
            <span className="text-gray-500">Total Debit:</span>{' '}
            <span className="font-bold text-blue-700">
              &#8377;{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Total Credit:</span>{' '}
            <span className="font-bold text-blue-700">
              &#8377;{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-sm">
            {isBalanced ? (
              <span className="font-semibold text-green-600">Balanced</span>
            ) : (
              <span className="font-semibold text-red-600">
                Difference: &#8377;{difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>

        <Separator />

        {/* ----- Bottom Section: Narration + Patient ----- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="voucher_narration">Narration</Label>
            <textarea
              id="voucher_narration"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              rows={3}
              placeholder="Voucher-level narration"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="patient_id">Patient (optional)</Label>
            <Input
              id="patient_id"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="Enter patient ID"
            />
          </div>
        </div>

        {/* ----- Action Buttons ----- */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => saveVoucher('draft')}
            disabled={saving}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save as Draft
          </Button>
          <Button
            onClick={() => saveVoucher('posted')}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Post Voucher
          </Button>
          <Button variant="secondary" onClick={handleClear} disabled={saving}>
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoucherEntry;
