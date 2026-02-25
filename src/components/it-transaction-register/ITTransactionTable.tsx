import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';
import { ITTransaction } from '@/types/itTransaction';

interface ITTransactionTableProps {
  transactions: ITTransaction[];
  isLoading: boolean;
  onEdit: (transaction: ITTransaction) => void;
  onDelete: (id: string, voucherNo: string) => void;
}

const ITEMS_PER_PAGE = 20;

const ITTransactionTable: React.FC<ITTransactionTableProps> = ({
  transactions,
  isLoading,
  onEdit,
  onDelete,
}) => {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const paged = transactions.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const fmt = (n: number) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Transactions ({transactions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No transactions found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Voucher No</TableHead>
                    <TableHead>Patient ID</TableHead>
                    <TableHead>Admission ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Invoice</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Net Bill</TableHead>
                    <TableHead className="text-right">Cash</TableHead>
                    <TableHead className="text-right">Other Mode</TableHead>
                    <TableHead>Treatment Code</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((txn, idx) => (
                    <TableRow key={txn.id}>
                      <TableCell className="text-center">{page * ITEMS_PER_PAGE + idx + 1}</TableCell>
                      <TableCell>{formatDate(txn.transaction_date)}</TableCell>
                      <TableCell className="font-medium">{txn.voucher_no}</TableCell>
                      <TableCell>{txn.patient_id || '-'}</TableCell>
                      <TableCell>{txn.admission_id || '-'}</TableCell>
                      <TableCell>{txn.department}</TableCell>
                      <TableCell>{txn.transaction_type}</TableCell>
                      <TableCell className="text-right">Rs. {fmt(txn.invoice_amount)}</TableCell>
                      <TableCell className="text-right">Rs. {fmt(txn.discount_amount)}</TableCell>
                      <TableCell className="text-right font-medium">Rs. {fmt(txn.net_bill_amount)}</TableCell>
                      <TableCell className="text-right">Rs. {fmt(txn.cash_amount)}</TableCell>
                      <TableCell className="text-right">Rs. {fmt(txn.other_mode_amount)}</TableCell>
                      <TableCell>{txn.treatment_code || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-blue-500 hover:text-blue-700"
                            onClick={() => onEdit(txn)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            onClick={() => onDelete(txn.id, txn.voucher_no)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ITTransactionTable;
