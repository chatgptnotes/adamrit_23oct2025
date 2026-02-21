import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, X } from 'lucide-react';
import { AllocationRow } from '@/types/corporateBulkPayment';
import InlinePatientSearch from './InlinePatientSearch';

interface PatientAllocationTableProps {
  allocations: AllocationRow[];
  onAllocationsChange: (allocations: AllocationRow[]) => void;
}

const PatientAllocationTable: React.FC<PatientAllocationTableProps> = ({
  allocations,
  onAllocationsChange,
}) => {
  const addRow = () => {
    const newRow: AllocationRow = {
      temp_id: crypto.randomUUID(),
      patient_id: '',
      patient_name: '',
      patients_id: '',
      visit_id: '',
      amount: '',
      bill_amount: '',
      deduction_amount: '',
      tds_amount: '',
      remarks: '',
    };
    onAllocationsChange([...allocations, newRow]);
  };

  const removeRow = (temp_id: string) => {
    onAllocationsChange(allocations.filter((a) => a.temp_id !== temp_id));
  };

  const updateRow = (temp_id: string, field: keyof AllocationRow, value: string) => {
    onAllocationsChange(
      allocations.map((a) =>
        a.temp_id === temp_id ? { ...a, [field]: value } : a
      )
    );
  };

  const handlePatientSelect = async (
    temp_id: string,
    patient: { id: string; name: string; patients_id: string | null }
  ) => {
    // Fetch latest visit_id
    let latestVisitId = '';
    let billAmount = '';
    let receivedAmount = '';
    let deductionAmount = '';

    const { data: visitData } = await supabase
      .from('visits')
      .select('visit_id')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (visitData?.visit_id) {
      latestVisitId = visitData.visit_id;

      // Fetch bill data from bill_preparation using visit_id
      const { data: billData } = await supabase
        .from('bill_preparation' as any)
        .select('bill_amount, received_amount, deduction_amount')
        .eq('visit_id', latestVisitId)
        .single();

      if (billData) {
        billAmount = String((billData as any).bill_amount || '');
        receivedAmount = String((billData as any).received_amount || '');
        deductionAmount = String((billData as any).deduction_amount || '');
      }
    }

    onAllocationsChange(
      allocations.map((a) =>
        a.temp_id === temp_id
          ? {
              ...a,
              patient_id: patient.id,
              patient_name: patient.name,
              patients_id: patient.patients_id || '',
              visit_id: latestVisitId,
              bill_amount: billAmount,
              amount: receivedAmount,
              deduction_amount: deductionAmount,
            }
          : a
      )
    );
  };

  const clearPatient = (temp_id: string) => {
    onAllocationsChange(
      allocations.map((a) =>
        a.temp_id === temp_id
          ? { ...a, patient_id: '', patient_name: '', patients_id: '' }
          : a
      )
    );
  };

  const totalAllocated = allocations.reduce(
    (sum, a) => sum + (parseFloat(a.amount) || 0),
    0
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Patient-wise Allocation</h4>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-4 w-4 mr-1" />
          Add Patient
        </Button>
      </div>

      {allocations.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-sm border rounded-md">
          No patients added. Click "Add Patient" to start allocating.
        </div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead className="min-w-[200px]">Patient Name</TableHead>
                <TableHead className="min-w-[130px]">Patient ID</TableHead>
                <TableHead className="min-w-[130px]">Visit ID</TableHead>
                <TableHead className="min-w-[130px]">Bill Amount</TableHead>
                <TableHead className="min-w-[130px]">Received Amt</TableHead>
                <TableHead className="min-w-[130px]">Deduction</TableHead>
                <TableHead className="min-w-[120px]">TDS</TableHead>
                <TableHead className="min-w-[160px]">Remarks</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map((row, index) => (
                <TableRow key={row.temp_id}>
                  <TableCell className="text-center text-sm">{index + 1}</TableCell>
                  <TableCell>
                    {row.patient_name ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium truncate">{row.patient_name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 shrink-0"
                          onClick={() => clearPatient(row.temp_id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <InlinePatientSearch
                        onSelect={(patient) =>
                          handlePatientSelect(row.temp_id, patient)
                        }
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {row.patients_id || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Visit ID"
                      value={row.visit_id}
                      onChange={(e) =>
                        updateRow(row.temp_id, 'visit_id', e.target.value)
                      }
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={row.bill_amount}
                      onChange={(e) =>
                        updateRow(row.temp_id, 'bill_amount', e.target.value)
                      }
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={row.amount}
                      onChange={(e) =>
                        updateRow(row.temp_id, 'amount', e.target.value)
                      }
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={row.deduction_amount}
                      onChange={(e) =>
                        updateRow(row.temp_id, 'deduction_amount', e.target.value)
                      }
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={row.tds_amount}
                      onChange={(e) =>
                        updateRow(row.temp_id, 'tds_amount', e.target.value)
                      }
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Remarks"
                      value={row.remarks}
                      onChange={(e) =>
                        updateRow(row.temp_id, 'remarks', e.target.value)
                      }
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                      onClick={() => removeRow(row.temp_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end px-4 py-2 bg-gray-50 border-t">
            <span className="text-sm font-medium">
              Total Allocated: Rs. {totalAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAllocationTable;
