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
  ToggleRight, Banknote, Calendar, RefreshCw, Save, PenLine
} from 'lucide-react';
import {
  useDailyPaymentSchedule,
  useFundAccounts,
  useTodayCashCollections,
  usePaymentHistory,
  type ScheduleEntry,
  type BankAccount,
} from '@/hooks/useDailyPaymentAllocation';
import { usePaymentObligations, usePayeeSearch, type PaymentObligation } from '@/hooks/usePaymentObligations';

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

  // Add/Edit obligation dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingObligationId, setEditingObligationId] = useState<string | null>(null);
  const [newObligation, setNewObligation] = useState({
    party_name: '', category: 'variable' as 'fixed' | 'variable',
    sub_category: 'other', default_daily_amount: '',
    priority: '10', notes: '', payee_name: '', payee_search_table: '',
  });

  // Payee search for sub-payments (consultant, RMO, staff)
  const [payeeSearchTerm, setPayeeSearchTerm] = useState('');
  const [selectedPayeeName, setSelectedPayeeName] = useState('');

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Add manual account dialog
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '', type: 'bank' as 'bank' | 'cash', hospital: 'hope', balance: '', notes: '',
  });

  // Editable actual balances (local state before save)
  const [editingBalances, setEditingBalances] = useState<Record<string, { balance: string; notes: string }>>({});
  const [editingCashCollection, setEditingCashCollection] = useState<string | null>(null);
  const [actualCashCollection, setActualCashCollection] = useState('');

  // History date range
  const [historyFrom, setHistoryFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [historyTo, setHistoryTo] = useState(today);

  // Queries
  const { schedule, isLoading, markPaid, refetch } = useDailyPaymentSchedule(selectedDate, selectedHospital);
  const { funds, refetch: refetchFunds, saveActualBalance, addManualAccount } = useFundAccounts(selectedDate);
  const { data: cashCollections = 0 } = useTodayCashCollections(selectedDate);
  const { obligations, createObligation, updateObligation, deleteObligation, toggleActive } = usePaymentObligations(selectedHospital);

  // Determine which table to search for sub-payment payee
  const payingSubCategory = payingEntry
    ? obligations.find(o => o.id === payingEntry.obligation_id)?.sub_category || ''
    : '';
  const payeeTable = payingSubCategory === 'consultant' || payingSubCategory === 'rmo'
    ? (selectedHospital === 'hope' ? 'hope_consultants' : 'ayushman_consultants')
    : payingSubCategory === 'salary'
    ? 'staff_members'
    : '';
  const { data: payeeResults = [] } = usePayeeSearch(payeeTable, payeeSearchTerm);
  const { data: history = [] } = usePaymentHistory(historyFrom, historyTo, selectedHospital);

  // Use actual cash if manually entered, else system value
  const effectiveCash = actualCashCollection !== '' ? parseFloat(actualCashCollection) || 0 : cashCollections;

  // Calculations
  const totalDue = schedule.reduce((s, e) => s + (e.daily_amount + e.carryforward_amount), 0);
  const totalPaid = schedule.reduce((s, e) => s + e.paid_amount, 0);
  const totalAvailable = effectiveCash + funds.totalActual;
  const surplus = totalAvailable - totalDue;
  const coveragePercent = totalDue > 0 ? Math.min(Math.round((totalAvailable / totalDue) * 100), 100) : 100;

  // Tally stale check
  const tallyStale = funds.lastSyncAt
    ? (Date.now() - new Date(funds.lastSyncAt).getTime()) > 24 * 60 * 60 * 1000
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
    setPayeeSearchTerm('');
    setSelectedPayeeName('');
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
    const payload = {
      party_name: newObligation.party_name,
      category: newObligation.category,
      sub_category: newObligation.sub_category,
      default_daily_amount: parseFloat(newObligation.default_daily_amount),
      priority: parseInt(newObligation.priority) || 10,
      notes: newObligation.notes || null,
      hospital_name: selectedHospital,
      payee_name: newObligation.payee_name || null,
      payee_search_table: newObligation.payee_search_table || null,
    };
    if (editingObligationId) {
      updateObligation.mutate({ id: editingObligationId, ...payload });
    } else {
      createObligation.mutate(payload);
    }
    setAddDialogOpen(false);
    setEditingObligationId(null);
    setNewObligation({ party_name: '', category: 'variable', sub_category: 'other', default_daily_amount: '', priority: '10', notes: '', payee_name: '', payee_search_table: '' });
  };

  const handleEditObligation = (ob: PaymentObligation) => {
    setEditingObligationId(ob.id);
    setNewObligation({
      party_name: ob.party_name,
      category: ob.category,
      sub_category: ob.sub_category || 'other',
      default_daily_amount: String(ob.default_daily_amount),
      priority: String(ob.priority),
      notes: ob.notes || '',
      payee_name: ob.payee_name || '',
      payee_search_table: ob.payee_search_table || '',
    });
    setAddDialogOpen(true);
  };

  const handleDeleteObligation = (id: string) => {
    deleteObligation.mutate(id);
    setDeleteConfirmId(null);
  };

  const startEditBalance = (acc: BankAccount) => {
    setEditingBalances(prev => ({
      ...prev,
      [acc.id]: {
        balance: acc.actual_balance !== null ? String(acc.actual_balance) : String(acc.ledger_balance),
        notes: acc.notes || '',
      },
    }));
  };

  const saveBalance = (acc: BankAccount) => {
    const edit = editingBalances[acc.id];
    if (!edit) return;
    const bal = parseFloat(edit.balance);
    if (isNaN(bal)) {
      toast.error('Enter a valid amount');
      return;
    }
    saveActualBalance.mutate({
      accountRefId: acc.id,
      accountName: acc.name,
      accountType: acc.type,
      hospital: acc.hospital,
      actualBalance: bal,
      notes: edit.notes,
    });
    setEditingBalances(prev => {
      const next = { ...prev };
      delete next[acc.id];
      return next;
    });
  };

  const handleAddAccount = () => {
    if (!newAccount.name || !newAccount.balance) {
      toast.error('Account name and balance are required');
      return;
    }
    addManualAccount.mutate({
      accountName: newAccount.name,
      accountType: newAccount.type,
      hospital: newAccount.hospital,
      actualBalance: parseFloat(newAccount.balance) || 0,
      notes: newAccount.notes,
    });
    setAddAccountOpen(false);
    setNewAccount({ name: '', type: 'bank', hospital: 'hope', balance: '', notes: '' });
  };

  const handleRefreshAll = () => {
    refetch();
    refetchFunds();
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
          <Button variant="outline" size="icon" onClick={handleRefreshAll} title="Reload all data">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ──── AVAILABLE FUNDS SECTION ──── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5" /> Available Funds
              {tallyStale && (
                <Badge variant="outline" className="text-xs text-orange-600 ml-2">
                  {funds.lastSyncAt
                    ? `Tally synced: ${new Date(funds.lastSyncAt).toLocaleDateString('en-IN')}`
                    : 'No Tally sync'}
                </Badge>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setAddAccountOpen(true)}>
              <Plus className="h-3 w-3 mr-1" /> Add Account
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Cash Collections Row */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-green-700" />
                <span className="font-medium text-green-900">Today's Cash Collections</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-green-700">As per System</p>
                  <p className="font-mono font-bold text-green-800">{formatINR(cashCollections)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-700">Actual Amount</p>
                  {editingCashCollection !== null ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={actualCashCollection}
                        onChange={(e) => setActualCashCollection(e.target.value)}
                        className="w-28 h-8 text-right font-mono"
                        placeholder={String(cashCollections)}
                      />
                      <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingCashCollection(null)}>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-blue-800">
                        {actualCashCollection !== '' ? formatINR(parseFloat(actualCashCollection) || 0) : formatINR(cashCollections)}
                      </span>
                      <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => setEditingCashCollection('editing')}>
                        <PenLine className="h-3 w-3 text-gray-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bank/Cash Accounts Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Hospital</TableHead>
                <TableHead className="text-right">As per Ledger</TableHead>
                <TableHead className="text-right">Actual Balance</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-center w-20">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funds.accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No bank/cash accounts found. Sync Tally or add accounts manually.
                  </TableCell>
                </TableRow>
              ) : (
                funds.accounts.map((acc) => {
                  const isEditing = !!editingBalances[acc.id];
                  return (
                    <TableRow key={acc.id}>
                      <TableCell>
                        <div className="font-medium">{acc.name}</div>
                        {acc.last_synced && (
                          <div className="text-xs text-muted-foreground">
                            Synced: {new Date(acc.last_synced).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={acc.type === 'bank' ? 'default' : 'outline'} className="capitalize">
                          {acc.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center capitalize">{acc.hospital}</TableCell>
                      <TableCell className="text-right font-mono text-gray-600">
                        {formatINR(acc.ledger_balance)}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editingBalances[acc.id].balance}
                            onChange={(e) => setEditingBalances(prev => ({
                              ...prev,
                              [acc.id]: { ...prev[acc.id], balance: e.target.value },
                            }))}
                            className="w-32 h-8 text-right font-mono ml-auto"
                          />
                        ) : (
                          <span className={`font-mono font-bold ${acc.actual_balance !== null ? 'text-blue-700' : 'text-gray-400'}`}>
                            {acc.actual_balance !== null ? formatINR(acc.actual_balance) : '—'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingBalances[acc.id].notes}
                            onChange={(e) => setEditingBalances(prev => ({
                              ...prev,
                              [acc.id]: { ...prev[acc.id], notes: e.target.value },
                            }))}
                            className="h-8 text-sm"
                            placeholder="Add notes..."
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">{acc.notes || '—'}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <Button size="sm" variant="ghost" onClick={() => saveBalance(acc)}>
                            <Save className="h-4 w-4 text-green-600" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => startEditBalance(acc)}>
                            <PenLine className="h-4 w-4 text-gray-500" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              {/* Totals */}
              <TableRow className="bg-gray-50 font-bold">
                <TableCell colSpan={3}>TOTAL (All Accounts)</TableCell>
                <TableCell className="text-right font-mono">{formatINR(funds.totalLedger)}</TableCell>
                <TableCell className="text-right font-mono text-blue-700">{formatINR(funds.totalActual)}</TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Row: Total Available vs Total Due */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Available (Cash + Banks)</div>
            <p className="text-2xl font-bold text-green-700">{formatINR(totalAvailable)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Obligations Due</div>
            <p className="text-2xl font-bold text-red-700">{formatINR(totalDue)}</p>
            <p className="text-xs text-muted-foreground mt-1">Paid: {formatINR(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              {surplus >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {surplus >= 0 ? 'Surplus' : 'Deficit'}
            </div>
            <p className={`text-2xl font-bold ${surplus >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatINR(Math.abs(surplus))}
            </p>
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
            <Button onClick={() => { setEditingObligationId(null); setNewObligation({ party_name: '', category: 'variable', sub_category: 'other', default_daily_amount: '', priority: '10', notes: '', payee_name: '', payee_search_table: '' }); setAddDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Obligation
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Party Name</TableHead>
                  <TableHead>Payee</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Daily Amount</TableHead>
                  <TableHead className="text-center">Priority</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obligations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No obligations configured. Click "Add Obligation" to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  obligations.map((ob: PaymentObligation) => (
                    <TableRow key={ob.id} className={ob.is_active ? '' : 'opacity-50'}>
                      <TableCell>
                        <div className="font-medium">{ob.party_name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{ob.sub_category || '-'}</div>
                      </TableCell>
                      <TableCell>
                        {ob.payee_name ? (
                          <span className="text-sm">{ob.payee_name}</span>
                        ) : ob.payee_search_table ? (
                          <Badge variant="outline" className="text-xs">Search from master</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ob.category === 'fixed' ? 'default' : 'outline'} className="capitalize">
                          {ob.category}
                        </Badge>
                      </TableCell>
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
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{ob.notes || '-'}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditObligation(ob)} title="Edit">
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </Button>
                          {deleteConfirmId === ob.id ? (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteObligation(ob.id)} className="text-red-600 text-xs">Yes</Button>
                              <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)} className="text-xs">No</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(ob.id)} title="Delete">
                              <span className="text-red-500 text-sm">x</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
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
              {/* Payee search for consultant/staff/RMO sub-payments */}
              {payeeTable && (
                <div>
                  <Label>Pay To (search {payingSubCategory === 'consultant' ? 'consultant' : payingSubCategory === 'rmo' ? 'RMO/doctor' : 'staff'} by name)</Label>
                  <Input
                    value={payeeSearchTerm}
                    onChange={(e) => { setPayeeSearchTerm(e.target.value); setSelectedPayeeName(''); }}
                    placeholder="Type name to search..."
                    className="mt-1"
                  />
                  {payeeResults.length > 0 && !selectedPayeeName && (
                    <div className="border rounded-md mt-1 max-h-40 overflow-y-auto bg-white shadow-sm">
                      {payeeResults.map((p: any) => (
                        <div
                          key={p.id}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                          onClick={() => { setSelectedPayeeName(p.name); setPayeeSearchTerm(p.name); }}
                        >
                          <span className="font-medium">{p.name}</span>
                          {p.specialty && <span className="text-muted-foreground ml-2">({p.specialty})</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedPayeeName && (
                    <p className="text-xs text-green-700 mt-1">Paying: {selectedPayeeName}</p>
                  )}
                </div>
              )}

              {/* Fixed payee (like rent → Dr Pramod Gandhi) */}
              {!payeeTable && payingEntry && (
                (() => {
                  const ob = obligations.find(o => o.id === payingEntry.obligation_id);
                  return ob?.payee_name ? (
                    <div className="bg-blue-50 rounded p-2 text-sm">
                      <span className="text-muted-foreground">Paying to: </span>
                      <span className="font-semibold">{ob.payee_name}</span>
                    </div>
                  ) : null;
                })()
              )}

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
                {selectedPayeeName && ` Voucher narration: "Payment to ${selectedPayeeName}"`}
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

      {/* Add/Edit Obligation Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) setEditingObligationId(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingObligationId ? 'Edit' : 'Add'} Payment Obligation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Obligation Name *</Label>
              <Input
                value={newObligation.party_name}
                onChange={(e) => setNewObligation({ ...newObligation, party_name: e.target.value })}
                placeholder="e.g., Rent, NephroPlus, Staff Salary"
              />
            </div>
            <div>
              <Label>Payee Name (who gets paid)</Label>
              <Input
                value={newObligation.payee_name}
                onChange={(e) => setNewObligation({ ...newObligation, payee_name: e.target.value })}
                placeholder="e.g., Dr Pramod Gandhi (for rent)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                For fixed payees like rent. Leave blank if payee is selected at payment time.
              </p>
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
              <Label>Payee Search Table</Label>
              <Select value={newObligation.payee_search_table || 'none'} onValueChange={(v) => setNewObligation({ ...newObligation, payee_search_table: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="None (manual entry)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (manual / fixed payee)</SelectItem>
                  <SelectItem value="hope_consultants">Hope Consultants</SelectItem>
                  <SelectItem value="ayushman_consultants">Ayushman Consultants</SelectItem>
                  <SelectItem value="hope_anaesthetists">Hope Anaesthetists</SelectItem>
                  <SelectItem value="ayushman_anaesthetists">Ayushman Anaesthetists</SelectItem>
                  <SelectItem value="staff_members">Staff Members</SelectItem>
                  <SelectItem value="hope_surgeons">Hope Surgeons</SelectItem>
                  <SelectItem value="ayushman_surgeons">Ayushman Surgeons</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                When paying, user can search this table to pick the specific person.
              </p>
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
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); setEditingObligationId(null); }}>Cancel</Button>
            <Button onClick={handleAddObligation} disabled={createObligation.isPending || updateObligation.isPending}>
              {editingObligationId ? 'Save Changes' : 'Add Obligation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Manual Account Dialog */}
      <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bank / Cash Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Account Name *</Label>
              <Input
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                placeholder="e.g., Canara Bank Current A/c, SBI Savings"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={newAccount.type} onValueChange={(v: 'bank' | 'cash') => setNewAccount({ ...newAccount, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank Account</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hospital</Label>
                <Select value={newAccount.hospital} onValueChange={(v) => setNewAccount({ ...newAccount, hospital: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hope">Hope Hospital</SelectItem>
                    <SelectItem value="ayushman">Ayushman Hospital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Current Balance (Rs.) *</Label>
              <Input
                type="number"
                value={newAccount.balance}
                onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
                placeholder="Enter actual balance"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={newAccount.notes}
                onChange={(e) => setNewAccount({ ...newAccount, notes: e.target.value })}
                placeholder="Account number, branch, or other details"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAccountOpen(false)}>Cancel</Button>
            <Button onClick={handleAddAccount} disabled={addManualAccount.isPending}>
              {addManualAccount.isPending ? 'Adding...' : 'Add Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyPaymentAllocation;
