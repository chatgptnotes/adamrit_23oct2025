import { useState } from 'react';
import { IndianRupee } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PaymentReceivedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (amount: number, date: string) => void;
  patientName: string;
}

export function PaymentReceivedDialog({
  open,
  onOpenChange,
  onConfirm,
  patientName,
}: PaymentReceivedDialogProps) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleConfirm = () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;
    onConfirm(numAmount, date);
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Payment Received</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-600">
            Record payment for <span className="font-medium">{patientName}</span>
          </p>
          <div className="space-y-2">
            <Label htmlFor="amount">Received Amount</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="amount"
                type="number"
                placeholder="0"
                className="pl-9"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="received-date">Received Date</Label>
            <Input
              id="received-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!amount || Number(amount) <= 0}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
