import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee, FileText, Banknote, CreditCard, Receipt } from 'lucide-react';
import { ITTransaction } from '@/types/itTransaction';

interface ITTransactionSummaryProps {
  transactions: ITTransaction[];
}

const ITTransactionSummary: React.FC<ITTransactionSummaryProps> = ({ transactions }) => {
  const totalCount = transactions.length;
  const totalInvoice = transactions.reduce((sum, t) => sum + Number(t.invoice_amount || 0), 0);
  const totalNet = transactions.reduce((sum, t) => sum + Number(t.net_bill_amount || 0), 0);
  const totalCash = transactions.reduce((sum, t) => sum + Number(t.cash_amount || 0), 0);
  const totalOther = transactions.reduce((sum, t) => sum + Number(t.other_mode_amount || 0), 0);

  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const cards = [
    { label: 'Total Transactions', value: totalCount.toString(), icon: FileText, color: 'blue' },
    { label: 'Total Invoice', value: `Rs. ${fmt(totalInvoice)}`, icon: Receipt, color: 'purple' },
    { label: 'Total Net Bill', value: `Rs. ${fmt(totalNet)}`, icon: IndianRupee, color: 'green' },
    { label: 'Total Cash', value: `Rs. ${fmt(totalCash)}`, icon: Banknote, color: 'amber' },
    { label: 'Total Other Mode', value: `Rs. ${fmt(totalOther)}`, icon: CreditCard, color: 'cyan' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className={`p-2 bg-${c.color}-100 rounded-lg`}>
              <c.icon className={`h-5 w-5 text-${c.color}-600`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className="text-lg font-bold">{c.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ITTransactionSummary;
