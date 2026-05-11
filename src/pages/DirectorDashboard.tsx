import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Wallet, Edit2, Trash2, Plus, CheckCircle, AlertTriangle, Calendar, ArrowRight, DollarSign } from 'lucide-react';

const DIRECTOR_EMAILS = ['cmd@hopehospital.com', 'finance@hopehospital.com'];

interface PaymentDeadline {
  id: string;
  service_name: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  hospital_type: string;
  notes?: string;
  created_at: string;
}

interface DeadlineFormData {
  service_name: string;
  amount: string;
  due_date: string;
  notes: string;
}

const isOverdue = (dueDate: string, status: 'pending' | 'paid' | 'overdue'): boolean => {
  if (status === 'paid') return false;
  return new Date(dueDate) < new Date() && status === 'pending';
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
};

export default function DirectorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const initialFormData: DeadlineFormData = { service_name: '', amount: '', due_date: '', notes: '' };
  const [formData, setFormData] = useState<DeadlineFormData>(initialFormData);

  // Access guard via effect (not during render)
  useEffect(() => {
    if (!user || !DIRECTOR_EMAILS.includes(user.email.toLowerCase())) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Fetch payment deadlines
  const { data: deadlines = [], isLoading, error } = useQuery({
    queryKey: ['paymentDeadlines', user?.hospitalType],
    queryFn: async () => {
      if (!user?.hospitalType) throw new Error('Hospital type not available');

      const { data, error } = await supabase
        .from('payment_deadlines')
        .select('*')
        .eq('hospital_type', user.hospitalType)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as PaymentDeadline[];
    },
    enabled: !!user?.hospitalType,
  });

  // Sort and filter: pending/overdue first, then paid (show first 3)
  const sortedDeadlines = useMemo(() => {
    const active = deadlines.filter(d => d.status !== 'paid');
    const paid = deadlines.filter(d => d.status === 'paid');
    return [...active, ...paid].slice(0, 3);
  }, [deadlines]);

  // Summary for the alert banner: overdue + due within 7 days
  const alertSummary = useMemo(() => {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const overdue = deadlines.filter(d =>
      d.status !== 'paid' && new Date(d.due_date) < now
    );
    const dueSoon = deadlines.filter(d => {
      if (d.status === 'paid') return false;
      const due = new Date(d.due_date);
      return due >= now && due <= in7Days;
    });
    const total = [...overdue, ...dueSoon].reduce((sum, d) => sum + Number(d.amount), 0);
    return { overdueCount: overdue.length, dueSoonCount: dueSoon.length, total };
  }, [deadlines]);

  const addMutation = useMutation({
    mutationFn: async (data: DeadlineFormData) => {
      if (!user?.hospitalType) throw new Error('Hospital type not available');

      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount <= 0) throw new Error('Amount must be a positive number');

      const { error } = await supabase.from('payment_deadlines').insert([{
        service_name: data.service_name,
        amount,
        due_date: data.due_date,
        status: 'pending' as const,
        hospital_type: user.hospitalType,
        notes: data.notes || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentDeadlines'] });
      toast.success('Payment deadline added');
      setIsAddDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (err) => {
      console.error('Add deadline failed:', getErrorMessage(err));
      toast.error('Failed to add deadline. Please try again.');
    },
  });

  const editMutation = useMutation({
    mutationFn: async (data: DeadlineFormData) => {
      if (!user?.hospitalType) throw new Error('Hospital type not available');

      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount <= 0) throw new Error('Amount must be a positive number');

      const { error } = await supabase
        .from('payment_deadlines')
        .update({
          service_name: data.service_name,
          amount,
          due_date: data.due_date,
          notes: data.notes || null,
        })
        .eq('id', editingId)
        .eq('hospital_type', user.hospitalType);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentDeadlines'] });
      toast.success('Payment deadline updated');
      setEditingId(null);
      setIsAddDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (err) => {
      console.error('Update failed:', getErrorMessage(err));
      toast.error('Failed to update deadline. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.hospitalType) throw new Error('Hospital type not available');

      const { error } = await supabase
        .from('payment_deadlines')
        .delete()
        .eq('id', id)
        .eq('hospital_type', user.hospitalType);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentDeadlines'] });
      setShowDeleteConfirm(null);
      toast.success('Payment deadline deleted');
    },
    onError: (err) => {
      console.error('Delete failed:', getErrorMessage(err));
      toast.error('Failed to delete deadline. Please try again.');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: 'pending' | 'paid' | 'overdue' }) => {
      if (!user?.hospitalType) throw new Error('Hospital type not available');

      const { error } = await supabase
        .from('payment_deadlines')
        .update({ status: newStatus })
        .eq('id', id)
        .eq('hospital_type', user.hospitalType);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentDeadlines'] });
      toast.success('Status updated');
    },
    onError: (err) => {
      console.error('Status update failed:', getErrorMessage(err));
      toast.error('Failed to update status. Please try again.');
    },
  });

  const handleSubmit = async () => {
    if (!formData.service_name || !formData.amount || !formData.due_date) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (editingId) {
      await editMutation.mutateAsync(formData);
    } else {
      await addMutation.mutateAsync(formData);
    }
  };

  const handleEdit = (deadline: PaymentDeadline) => {
    setEditingId(deadline.id);
    setFormData({
      service_name: deadline.service_name,
      amount: deadline.amount.toString(),
      due_date: deadline.due_date,
      notes: deadline.notes ?? '',
    });
    setIsAddDialogOpen(true);
  };

  const handleCancel = () => {
    setIsAddDialogOpen(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const getStatusBadge = (deadline: PaymentDeadline) => {
    const overdue = isOverdue(deadline.due_date, deadline.status);
    if (deadline.status === 'paid') {
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    }
    if (overdue) {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Due</Badge>;
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Director Dashboard</h1>
        <p className="text-sm text-gray-600">{user?.email}</p>
      </div>

      {(alertSummary.overdueCount > 0 || alertSummary.dueSoonCount > 0) && (
        <div
          role="alert"
          className={`relative rounded-lg border-2 p-5 shadow-lg ${
            alertSummary.overdueCount > 0
              ? 'border-red-600 bg-gradient-to-r from-red-50 to-red-100 animate-pulse'
              : 'border-amber-500 bg-gradient-to-r from-amber-50 to-amber-100'
          }`}
        >
          <div className="flex items-start gap-4">
            <AlertTriangle
              className={`h-10 w-10 flex-shrink-0 ${
                alertSummary.overdueCount > 0 ? 'text-red-600' : 'text-amber-600'
              }`}
            />
            <div className="flex-1">
              <h2
                className={`text-xl font-bold tracking-tight ${
                  alertSummary.overdueCount > 0 ? 'text-red-800' : 'text-amber-800'
                }`}
              >
                {alertSummary.overdueCount + alertSummary.dueSoonCount} PAYMENT
                {alertSummary.overdueCount + alertSummary.dueSoonCount === 1 ? '' : 'S'} NEED YOUR ATTENTION
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-base">
                {alertSummary.overdueCount > 0 && (
                  <span className="font-semibold text-red-700">
                    ⚠️ {alertSummary.overdueCount} OVERDUE
                  </span>
                )}
                {alertSummary.dueSoonCount > 0 && (
                  <span className="font-semibold text-amber-700">
                    ⏰ {alertSummary.dueSoonCount} due in next 7 days
                  </span>
                )}
                <span className="font-bold text-gray-900">
                  Total: ₹{alertSummary.total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <Button
              variant={alertSummary.overdueCount > 0 ? 'destructive' : 'default'}
              className="gap-1 self-center"
              onClick={() => {
                const el = document.getElementById('payment-deadlines-table');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Payment Deadlines Section */}
      <Card id="payment-deadlines-table" className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-600" />
            <CardTitle>Payment Deadlines</CardTitle>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingId(null);
              setFormData(initialFormData);
              setIsAddDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Deadline
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" role="status" aria-label="Loading payment deadlines" />
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded text-red-700 text-sm">
              Failed to load payment deadlines. Please refresh the page.
            </div>
          ) : sortedDeadlines.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No payment deadlines. Click "Add Deadline" to get started.</p>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Service</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDeadlines.map((deadline) => (
                    <TableRow key={deadline.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{deadline.service_name}</TableCell>
                      <TableCell className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        {deadline.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        {new Date(deadline.due_date).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell>{getStatusBadge(deadline)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {deadline.status !== 'paid' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Mark as paid"
                            onClick={() => toggleStatusMutation.mutate({ id: deadline.id, newStatus: 'paid' })}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Mark as pending"
                            onClick={() => toggleStatusMutation.mutate({ id: deadline.id, newStatus: 'pending' })}
                          >
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Edit deadline"
                          onClick={() => handleEdit(deadline)}
                        >
                          <Edit2 className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Delete deadline"
                          onClick={() => setShowDeleteConfirm(deadline.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              Payment Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">Manage daily payment allocation and distribution</p>
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate('/daily-payment-allocation')}>
              View Details <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-orange-600" />
              IPD Approvals & Discounts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">Approve bills and manage IPD discounts</p>
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate('/bill-approvals')}>
              View Details <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment Deadline?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">This action cannot be undone. Are you sure you want to delete this payment deadline?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteConfirm && deleteMutation.mutate(showDeleteConfirm)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Payment Deadline' : 'Add Payment Deadline'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="service_name">Service Name</Label>
              <Input
                id="service_name"
                placeholder="e.g. EMI, Electricity Bill, TDS"
                value={formData.service_name}
                maxLength={100}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Additional notes"
                value={formData.notes}
                maxLength={500}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={addMutation.isPending || editMutation.isPending}
            >
              {editingId ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
