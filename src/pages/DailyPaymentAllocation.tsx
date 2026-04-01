import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Wallet, Building2, IndianRupee, TrendingUp, TrendingDown,
  Clock, CheckCircle, AlertTriangle, Plus, Edit2, ToggleLeft,
  ToggleRight, Banknote, Calendar, RefreshCw
} from 'lucide-react';
import {
  useDailyPaymentSchedule,
  useTallyBalances,
  useTodayCashCollections,
  usePaymentHistory,
  type ScheduleEntry,
} from '@/hooks/useDailyPaymentAllocation';
import { usePaymentObligations, type PaymentObligation } from '@/hooks/usePaymentObligations';

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const getAgingColor = (days: number) => {
  if (days === 0) return 'bg-green-100 text-green-800';
  if (days <= 3) return 'bg-yellow-100 text-yellow-800';
  if (days <= 7) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};

const getAgingBorder = (days: number) => {
  if (days === 0) return 'border-l-green-500';
  if (days <= 3) return 'border-l-yellow-500';
  if (days <= 7) return 'border-l-orange-500';
  return 'border-l-red-500';
};

const today = new Date().toISOString().split('T')[0];

const DailyPaymentAllocation = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'super_admin';

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedHospital, setSelectedHospital] = useState('hope');
  const [activeTab, setActiveTab] = useState('allocation');

  // Pay dialog state
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payingEntry, setPayingEntry] = useState<ScheduleEntry | null>(null);
  const [payAmount, setPayAmount] = useState('');

  // Add obligation dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newObligation, setNewObligation] = useState({
    party_name: '', category: 'variable' as 'fixed' | 'variable',
    sub_category: 'other', default_daily_amount: '',
    priority: '10', notes: '',
  });

  // History date range
  const [historyFrom, setHistoryFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [historyTo, setHistoryTo] = useState(today);

  // Queries
  const { schedule, isLoading, markPaid, refetch } = useDailyPaymentSchedule(selectedDate, selectedHospital);
  const { data: tallyBalances } = useTallyBalances();
  const { data: cashCollections = 0 } = useTodayCashCollections(selectedDate);
  const { obligations, createObligation, toggleActive } = usePaymentObligations(selectedHospital);
  const { data: history = [] } = usePaymentHistory(historyFrom, historyTo, selectedHospital);

  // Calculations
  const totalDue = schedule.reduce((s, e) => s + (e.daily_amount + e.carryforward_amount), 0);
  const totalPaid = schedule.reduce((s, e) => s + e.paid_amount, 0);
  const totalAvailable = cashCollections + (tallyBalances?.hopeCash || 0) + (tallyBalances?.hopeBank || 0);
  const surplus = totalAvailable - totalDue;
  const coveragePercent = totalDue > 0 ? Math.min(Math.round((totalAvailable / totalDue) * 100), 100) : 100;

  // Tally stale check (>24h)
  const tallyStale = tallyBalances?.lastSyncAt
    ? (Date.now() - new Date(tallyBalances.lastSyncAt).getTime()) > 24 * 60 * 60 * 1000
    : true;

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can access the Payment Allocation dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePay = (entry: ScheduleEntry) => {
    setPayingEntry(entry);
    setPayAmount(String(entry.daily_amount + entry.carryforward_amount - entry.paid_amount));
    setPayDialogOpen(true);
  };

  const confirmPay = () => {
    if (!payingEntry || !payAmount) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    markPaid.mutate({
      scheduleId: payingEntry.id,
      amount,
      userId: user?.username || 'admin',
    });
    setPayDialogOpen(false);
  };

  const handleAddObligation = () => {
    if (!newObligation.party_name || !newObligation.default_daily_amount) {
      toast.error('Party name and daily amount are required');
      return;
    }
    createObligation.mutate({
      party_name: newObligation.party_name,
      category: newObligation.category,
      sub_category: newObligation.sub_category,
      default_daily_amount: parseFloat(newObligation.default_daily_amount),
      priority: parseInt(newObligation.priority) || 10,
      notes: newObligation.notes || null,
      hospital_name: selectedHospital,
    });
    setAddDialogOpen(false);
    setNewObligation({ party_name: '', category: 'variable', sub_category: 'other', default_daily_amount: '', priority: '10', notes: '' });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Payment Allocation</h1>
          <p className="text-sm text-muted-foreground">Manage daily payment obligations and track fund availability</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-44"
          />
          <Select value={selectedHospital} onValueChange={setSelectedHospital}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hope">Hope Hospital</SelectItem>
              <SelectItem value="ayushman">Ayushman Hospital</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Banknote className="h-4 w-4" />
              Today's Cash Collections
            </div>
            <p className="text-2xl font-bold text-green-700">{formatINR(cashCollections)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Building2 className="h-4 w-4" />
              Hope Bank Balance
              {tallyStale && <Badge variant="outline" className="text-xs text-orange-600">Stale</Badge>}
            </div>
            <p className="text-2xl font-bold text-blue-700">{formatINR(tallyBalances?.hopeBank || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Cash: {formatINR(tallyBalances?.hopeCash || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Building2 className="h-4 w-4" />
              Ayushman Bank Balance
              {tallyStale && <Badge variant="outline" className="text-xs text-orange-600">Stale</Badge>}
            </div>
            <p className="text-2xl font-bold text-purple-700">{formatINR(tallyBalances?.ayushmanBank || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Cash: {formatINR(tallyBalances?.ayushmanCash || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              {surplus >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {surplus >= 0 ? 'Surplus' : 'Deficit'}
            </div>
            <p className={`text-2xl font-bold ${surplus >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatINR(Math.abs(surplus))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Total Due: {formatINR(totalDue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Coverage Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Obligations Coverage</span>
            <span className="text-sm font-bold">{coveragePercent}%</span>
          </div>
          <Progress value={coveragePercent} className="h-3" />
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>Paid: {formatINR(totalPaid)}</span>
            <span>Remaining: {formatINR(totalDue - totalPaid)}</span>
          </div>
        </CardContent>
      </Card>

      {tallyStale && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <span className="text-sm text-orange-800">
            Tally data may be stale.
            {tallyBalances?.lastSyncAt
              ? ` Last synced: ${new Date(tallyBalances.lastSyncAt).toLocaleString('en-IN')}`
              : ' No sync data available.'}
          </span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="allocation">
            Today's Allocation
            {schedule.filter(s => s.status === 'pending').length > 0 && (
              <Badge className="ml-2 bg-red-500">{schedule.filter(s => s.status === 'pending').length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="master">Obligations Master</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        {/* TAB 1: Today's Allocation */}
        <TabsContent value="allocation" className="mt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading schedule...</div>
          ) : schedule.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No obligations scheduled for {selectedDate}. Add obligations in the Master tab first.
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead className="text-right">Daily Amount</TableHead>
                    <TableHead className="text-right">Carry Forward</TableHead>
                    <TableHead className="text-right">Total Due</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-center">Aging</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((entry, idx) => (
                    <TableRow key={entry.id} className={`border-l-4 ${getAgingBorder(entry.days_overdue)}`}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{entry.party_name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{entry.category}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatINR(entry.daily_amount)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.carryforward_amount > 0
                          ? <span className="text-red-600">{formatINR(entry.carryforward_amount)}</span>
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatINR(entry.daily_amount + entry.carryforward_amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.paid_amount > 0 ? <span className="text-green-600">{formatINR(entry.paid_amount)}</span> : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${getAgingColor(entry.days_overdue)} font-mono`}>
                          {entry.days_overdue}d
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entry.status === 'paid' && (
                          <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>
                        )}
                        {entry.status === 'partial' && (
                          <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Partial</Badge>
                        )}
                        {entry.status === 'pending' && (
                          <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                        )}
                        {entry.status === 'carried_forward' && (
                          <Badge className="bg-orange-100 text-orange-800">Carried</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.status !== 'paid' && (
                          <Button size="sm" onClick={() => handlePay(entry)} className="bg-green-600 hover:bg-green-700">
                            <IndianRupee className="h-3 w-3 mr-1" /> Pay
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals row */}
                  <TableRow className="bg-gray-50 font-bold">
                    <TableCell colSpan={2}>TOTAL</TableCell>
                    <TableCell className="text-right font-mono">{formatINR(schedule.reduce((s, e) => s + e.daily_amount, 0))}</TableCell>
                    <TableCell className="text-right font-mono text-red-600">{formatINR(schedule.reduce((s, e) => s + e.carryforward_amount, 0))}</TableCell>
                    <TableCell className="text-right font-mono">{formatINR(totalDue)}</TableCell>
                    <TableCell className="text-right font-mono text-green-600">{formatINR(totalPaid)}</TableCell>
                    <TableCell colSpan={3}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* TAB 2: Obligations Master */}
        <TabsContent value="master" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Payment Obligations</h3>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Obligation
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Party Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Sub-Category</TableHead>
                  <TableHead className="text-right">Daily Amount</TableHead>
                  <TableHead className="text-center">Priority</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obligations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No obligations configured. Click "Add Obligation" to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  obligations.map((ob: PaymentObligation) => (
                    <TableRow key={ob.id} className={ob.is_active ? '' : 'opacity-50'}>
                      <TableCell className="font-medium">{ob.party_name}</TableCell>
                      <TableCell>
                        <Badge variant={ob.category === 'fixed' ? 'default' : 'outline'} className="capitalize">
                          {ob.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{ob.sub_category || '-'}</TableCell>
                      <TableCell className="text-right font-mono">{formatINR(ob.default_daily_amount)}</TableCell>
                      <TableCell className="text-center">{ob.priority}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive.mutate({ id: ob.id, is_active: !ob.is_active })}
                        >
                          {ob.is_active
                            ? <ToggleRight className="h-5 w-5 text-green-600" />
                            : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                        </Button>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{ob.notes || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* TAB 3: Payment History */}
        <TabsContent value="history" className="mt-4 space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" value={historyFrom} onChange={(e) => setHistoryFrom(e.target.value)} className="w-40" />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" value={historyTo} onChange={(e) => setHistoryTo(e.target.value)} className="w-40" />
            </div>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead className="text-right">Daily</TableHead>
                  <TableHead className="text-right">Carry Fwd</TableHead>
                  <TableHead className="text-right">Total Due</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-center">Aging</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No payment history for selected date range.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((entry: ScheduleEntry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.schedule_date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell className="font-medium">{entry.party_name}</TableCell>
                      <TableCell className="text-right font-mono">{formatINR(entry.daily_amount)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.carryforward_amount > 0 ? formatINR(entry.carryforward_amount) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatINR(entry.daily_amount + entry.carryforward_amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.paid_amount > 0 ? <span className="text-green-600">{formatINR(entry.paid_amount)}</span> : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${getAgingColor(entry.days_overdue)} font-mono`}>{entry.days_overdue}d</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          entry.status === 'paid' ? 'bg-green-100 text-green-800' :
                          entry.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          entry.status === 'carried_forward' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {entry.status === 'carried_forward' ? 'Carried' : entry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pay Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {payingEntry && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Party:</span>
                  <span className="font-semibold">{payingEntry.party_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Due:</span>
                  <span className="font-semibold">{formatINR(payingEntry.daily_amount + payingEntry.carryforward_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Already Paid:</span>
                  <span>{formatINR(payingEntry.paid_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance:</span>
                  <span className="font-bold text-red-600">
                    {formatINR(payingEntry.daily_amount + payingEntry.carryforward_amount - payingEntry.paid_amount)}
                  </span>
                </div>
                {payingEntry.days_overdue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Overdue:</span>
                    <Badge className={getAgingColor(payingEntry.days_overdue)}>{payingEntry.days_overdue} days</Badge>
                  </div>
                )}
              </div>
              <div>
                <Label>Payment Amount (Rs.)</Label>
                <Input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="mt-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                A payment voucher will be automatically created in the accounting system.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmPay} disabled={markPaid.isPending} className="bg-green-600 hover:bg-green-700">
              {markPaid.isPending ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Obligation Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Obligation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Party Name *</Label>
              <Input
                value={newObligation.party_name}
                onChange={(e) => setNewObligation({ ...newObligation, party_name: e.target.value })}
                placeholder="e.g., NefroPlus, Rent, Vendor name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={newObligation.category} onValueChange={(v: 'fixed' | 'variable') => setNewObligation({ ...newObligation, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="variable">Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sub-Category</Label>
                <Select value={newObligation.sub_category} onValueChange={(v) => setNewObligation({ ...newObligation, sub_category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="dialysis">Dialysis</SelectItem>
                    <SelectItem value="electricity">Electricity</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                    <SelectItem value="rmo">RMO</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Daily Amount (Rs.) *</Label>
                <Input
                  type="number"
                  value={newObligation.default_daily_amount}
                  onChange={(e) => setNewObligation({ ...newObligation, default_daily_amount: e.target.value })}
                  placeholder="50000"
                />
              </div>
              <div>
                <Label>Priority (lower = higher)</Label>
                <Input
                  type="number"
                  value={newObligation.priority}
                  onChange={(e) => setNewObligation({ ...newObligation, priority: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={newObligation.notes}
                onChange={(e) => setNewObligation({ ...newObligation, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddObligation} disabled={createObligation.isPending}>
              {createObligation.isPending ? 'Adding...' : 'Add Obligation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyPaymentAllocation;
