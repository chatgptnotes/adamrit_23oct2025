import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ITTransaction } from '@/types/itTransaction';

interface ITTransactionReportsProps {
  transactions: ITTransaction[];
}

const ITTransactionReports: React.FC<ITTransactionReportsProps> = ({ transactions }) => {
  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Department-wise summary
  const deptSummary = useMemo(() => {
    const map: Record<string, { count: number; invoice: number; discount: number; net: number; cash: number; other: number }> = {};
    transactions.forEach((t) => {
      if (!map[t.department]) {
        map[t.department] = { count: 0, invoice: 0, discount: 0, net: 0, cash: 0, other: 0 };
      }
      const d = map[t.department];
      d.count += 1;
      d.invoice += Number(t.invoice_amount || 0);
      d.discount += Number(t.discount_amount || 0);
      d.net += Number(t.net_bill_amount || 0);
      d.cash += Number(t.cash_amount || 0);
      d.other += Number(t.other_mode_amount || 0);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [transactions]);

  // Date-wise summary
  const dateSummary = useMemo(() => {
    const map: Record<string, { count: number; invoice: number; net: number; cash: number; other: number }> = {};
    transactions.forEach((t) => {
      const date = t.transaction_date;
      if (!map[date]) {
        map[date] = { count: 0, invoice: 0, net: 0, cash: 0, other: 0 };
      }
      const d = map[date];
      d.count += 1;
      d.invoice += Number(t.invoice_amount || 0);
      d.net += Number(t.net_bill_amount || 0);
      d.cash += Number(t.cash_amount || 0);
      d.other += Number(t.other_mode_amount || 0);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions]);

  if (transactions.length === 0) {
    return <div className="text-center py-8 text-gray-500">No data available for reports.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Department-wise Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Department-wise Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Total Invoice</TableHead>
                  <TableHead className="text-right">Total Discount</TableHead>
                  <TableHead className="text-right">Total Net Bill</TableHead>
                  <TableHead className="text-right">Total Cash</TableHead>
                  <TableHead className="text-right">Total Other Mode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deptSummary.map(([dept, data]) => (
                  <TableRow key={dept}>
                    <TableCell className="font-medium">{dept}</TableCell>
                    <TableCell className="text-right">{data.count}</TableCell>
                    <TableCell className="text-right">Rs. {fmt(data.invoice)}</TableCell>
                    <TableCell className="text-right">Rs. {fmt(data.discount)}</TableCell>
                    <TableCell className="text-right font-medium">Rs. {fmt(data.net)}</TableCell>
                    <TableCell className="text-right">Rs. {fmt(data.cash)}</TableCell>
                    <TableCell className="text-right">Rs. {fmt(data.other)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{deptSummary.reduce((s, [, d]) => s + d.count, 0)}</TableCell>
                  <TableCell className="text-right">Rs. {fmt(deptSummary.reduce((s, [, d]) => s + d.invoice, 0))}</TableCell>
                  <TableCell className="text-right">Rs. {fmt(deptSummary.reduce((s, [, d]) => s + d.discount, 0))}</TableCell>
                  <TableCell className="text-right">Rs. {fmt(deptSummary.reduce((s, [, d]) => s + d.net, 0))}</TableCell>
                  <TableCell className="text-right">Rs. {fmt(deptSummary.reduce((s, [, d]) => s + d.cash, 0))}</TableCell>
                  <TableCell className="text-right">Rs. {fmt(deptSummary.reduce((s, [, d]) => s + d.other, 0))}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Date-wise Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Date-wise Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Total Invoice</TableHead>
                  <TableHead className="text-right">Total Net Bill</TableHead>
                  <TableHead className="text-right">Total Cash</TableHead>
                  <TableHead className="text-right">Total Other Mode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dateSummary.map(([date, data]) => (
                  <TableRow key={date}>
                    <TableCell className="font-medium">{formatDate(date)}</TableCell>
                    <TableCell className="text-right">{data.count}</TableCell>
                    <TableCell className="text-right">Rs. {fmt(data.invoice)}</TableCell>
                    <TableCell className="text-right font-medium">Rs. {fmt(data.net)}</TableCell>
                    <TableCell className="text-right">Rs. {fmt(data.cash)}</TableCell>
                    <TableCell className="text-right">Rs. {fmt(data.other)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{dateSummary.reduce((s, [, d]) => s + d.count, 0)}</TableCell>
                  <TableCell className="text-right">Rs. {fmt(dateSummary.reduce((s, [, d]) => s + d.invoice, 0))}</TableCell>
                  <TableCell className="text-right">Rs. {fmt(dateSummary.reduce((s, [, d]) => s + d.net, 0))}</TableCell>
                  <TableCell className="text-right">Rs. {fmt(dateSummary.reduce((s, [, d]) => s + d.cash, 0))}</TableCell>
                  <TableCell className="text-right">Rs. {fmt(dateSummary.reduce((s, [, d]) => s + d.other, 0))}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ITTransactionReports;
