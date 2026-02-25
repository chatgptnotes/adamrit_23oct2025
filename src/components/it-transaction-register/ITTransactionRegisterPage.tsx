import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollText, Plus, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useITTransactions, useDeleteITTransaction } from '@/hooks/useITTransactions';
import { ITTransaction } from '@/types/itTransaction';
import ITTransactionFilters from './ITTransactionFilters';
import ITTransactionSummary from './ITTransactionSummary';
import ITTransactionTable from './ITTransactionTable';
import ITTransactionFormDialog from './ITTransactionFormDialog';
import ITTransactionReports from './ITTransactionReports';

const ITTransactionRegisterPage: React.FC = () => {
  const { hospitalConfig } = useAuth();
  const deleteMutation = useDeleteITTransaction();

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [department, setDepartment] = useState('all');
  const [transactionType, setTransactionType] = useState('all');
  const [patientId, setPatientId] = useState('');

  // Dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ITTransaction | null>(null);

  const { data: transactions = [], isLoading } = useITTransactions({
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
    department: department !== 'all' ? department : undefined,
    transaction_type: transactionType !== 'all' ? transactionType : undefined,
    patient_id: patientId || undefined,
    hospital_name: hospitalConfig.name,
  });

  const handleEdit = (txn: ITTransaction) => {
    setEditingTransaction(txn);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, voucherNo: string) => {
    if (!confirm(`Delete transaction ${voucherNo}?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(`Transaction ${voucherNo} deleted`);
    } catch (error: any) {
      toast.error(`Failed to delete: ${error.message}`);
    }
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setDepartment('all');
    setTransactionType('all');
    setPatientId('');
  };

  const formatDateDDMMYYYY = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const handleExcelExport = () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const data: any[][] = [];
    data.push(['IT Transaction Register']);
    data.push([`Hospital: ${hospitalConfig.fullName || hospitalConfig.name}`]);
    if (fromDate || toDate) {
      data.push([`Period: ${fromDate ? formatDateDDMMYYYY(fromDate) : 'Start'} to ${toDate ? formatDateDDMMYYYY(toDate) : 'End'}`]);
    }
    data.push([]);

    // Header row matching IT department format
    data.push([
      'Transaction Date', 'Patient ID (UHID)', 'Admission ID',
      'Voucher No', 'Invoice Amount', 'Discount Amount',
      'Net Bill Amount', 'Cash Amount', 'Other Mode Amount',
      'Transaction Type', 'Department', 'Treatment Code',
    ]);

    // Data rows
    let totalInvoice = 0, totalDiscount = 0, totalNet = 0, totalCash = 0, totalOther = 0;
    transactions.forEach((txn) => {
      const inv = Number(txn.invoice_amount || 0);
      const disc = Number(txn.discount_amount || 0);
      const net = Number(txn.net_bill_amount || 0);
      const cash = Number(txn.cash_amount || 0);
      const other = Number(txn.other_mode_amount || 0);
      totalInvoice += inv;
      totalDiscount += disc;
      totalNet += net;
      totalCash += cash;
      totalOther += other;

      data.push([
        formatDateDDMMYYYY(txn.transaction_date),
        txn.patient_id || '',
        txn.admission_id || '',
        txn.voucher_no,
        inv,
        disc,
        net,
        cash,
        other,
        txn.transaction_type,
        txn.department,
        txn.treatment_code || '',
      ]);
    });

    // Totals row
    data.push([]);
    data.push([
      '', '', '', 'TOTALS',
      totalInvoice, totalDiscount, totalNet, totalCash, totalOther,
      '', '', '',
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'IT Register');

    const fileName = `IT_Transaction_Register_${fromDate || 'all'}_to_${toDate || 'all'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success('Excel exported successfully');
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScrollText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">IT Transaction Register</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExcelExport}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={() => { setEditingTransaction(null); setIsFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ITTransactionFilters
        fromDate={fromDate}
        toDate={toDate}
        department={department}
        transactionType={transactionType}
        patientId={patientId}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onDepartmentChange={setDepartment}
        onTransactionTypeChange={setTransactionType}
        onPatientIdChange={setPatientId}
        onClear={handleClearFilters}
      />

      {/* Summary Cards */}
      <ITTransactionSummary transactions={transactions} />

      {/* Tabs: Transactions | Reports */}
      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="mt-4">
          <ITTransactionTable
            transactions={transactions}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <ITTransactionReports transactions={transactions} />
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <ITTransactionFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingTransaction(null);
        }}
        editData={editingTransaction}
      />
    </div>
  );
};

export default ITTransactionRegisterPage;
