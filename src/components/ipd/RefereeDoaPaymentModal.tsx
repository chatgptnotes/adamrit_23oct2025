import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface RefereeDoaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit: {
    id: string;
    visit_id: string;
    patients?: {
      name: string;
    };
    referral_payment_status?: string | null;
  };
  onUpdate?: () => void;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  referral_payment_status: string | null;
  created_at: string;
}

export const RefereeDoaPaymentModal: React.FC<RefereeDoaPaymentModalProps> = ({
  isOpen,
  onClose,
  visit,
  onUpdate
}) => {
  const queryClient = useQueryClient();
  const [newAmount, setNewAmount] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [referralPaymentStatus, setReferralPaymentStatus] = useState('');

  // Fetch payments for this visit
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['referee-doa-payments', visit.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referee_doa_payments')
        .select('*')
        .eq('visit_id', visit.id)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }
      return data as Payment[];
    },
    enabled: isOpen && !!visit.id
  });

  // Calculate total
  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Add payment mutation
  const addPaymentMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(newAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Insert payment into referee_doa_payments
      const { error } = await supabase
        .from('referee_doa_payments')
        .insert({
          visit_id: visit.id,
          amount: amount,
          notes: newNotes.trim() || null,
          referral_payment_status: referralPaymentStatus || null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referee-doa-payments', visit.id] });
      queryClient.invalidateQueries({ queryKey: ['ipd-visits'] });
      setNewAmount('');
      setNewNotes('');
      setReferralPaymentStatus('');
      toast({
        title: 'Payment Added',
        description: `Payment of ₹${newAmount} added successfully`
      });
      onUpdate?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add payment',
        variant: 'destructive'
      });
    }
  });

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('referee_doa_payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referee-doa-payments', visit.id] });
      queryClient.invalidateQueries({ queryKey: ['ipd-visits'] });
      toast({
        title: 'Payment Deleted',
        description: 'Payment has been removed'
      });
      onUpdate?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete payment',
        variant: 'destructive'
      });
    }
  });

  const handleAddPayment = () => {
    if (!newAmount || parseFloat(newAmount) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive'
      });
      return;
    }
    addPaymentMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Referee DOA Payments</DialogTitle>
          <div className="text-sm text-muted-foreground">
            Patient: <span className="font-medium">{visit.patients?.name || 'N/A'}</span>
            {' | '}
            Visit: <span className="font-medium">{visit.visit_id}</span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment History */}
          <div>
            <h4 className="font-medium mb-2">Payment History</h4>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No payments recorded yet
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Referral Payment</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-sm">
                          {format(new Date(payment.payment_date), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{Number(payment.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payment.notes || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {payment.referral_payment_status || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deletePaymentMutation.mutate(payment.id)}
                            disabled={deletePaymentMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Total */}
            {payments.length > 0 && (
              <div className="flex justify-end mt-2">
                <div className="text-sm">
                  Total: <span className="font-bold text-green-600">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Add New Payment */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Add New Payment</h4>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="amount" className="text-xs">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="notes" className="text-xs">Notes (optional)</Label>
                <Input
                  id="notes"
                  placeholder="Add notes"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-3">
              <Label htmlFor="referralPayment" className="text-xs">Referral Payment</Label>
              <Select value={referralPaymentStatus} onValueChange={setReferralPaymentStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spot paid">Spot paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Direct">Direct</SelectItem>
                  <SelectItem value="Backing paid">Backing paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddPayment}
              disabled={addPaymentMutation.isPending || !newAmount}
              className="mt-3 w-full"
            >
              {addPaymentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RefereeDoaPaymentModal;
