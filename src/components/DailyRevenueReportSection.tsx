import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Edit2, Eye, Plus, Printer, Trash2, Users, Save } from 'lucide-react';

interface VisitRow {
  id: string;
  visit_id: string;
  visit_date: string;
  appointment_with: string | null;
  package_amount: string | null;
  patient_type: string | null;
  created_at: string;
  patients: { id: string; name: string; hospital_name: string | null; relationship_manager: string | null } | null;
  relationship_managers: { id: string; name: string; code: string | null } | null;
}

interface OverrideRow {
  id: string;
  entry_date: string;
  visit_id: string | null;
  patient_name: string;
  department: string | null;
  rm_name: string | null;
  cost: number;
  cut: number;
  hospital_type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

type CostSource = 'override' | 'advance' | 'final_pay' | 'package' | 'none';

interface DisplayRow {
  key: string;
  visitId: string | null;
  overrideId: string | null;
  patient_name: string;
  department: string;
  rm_name: string;
  hospital: string;
  cost: number;
  cut: number;
  cutIsSuggested: boolean; // true when cut was computed from default %, not saved
  cost_source: CostSource;
  isManual: boolean;
}

const COST_SOURCE_LABEL: Record<CostSource, string> = {
  override: 'man',
  advance: 'adv',
  final_pay: 'final',
  package: 'pkg',
  none: '',
};

interface ManualFormData {
  patient_name: string;
  department: string;
  rm_name: string;
  cost: string;
  cut: string;
  notes: string;
}

const initialManual: ManualFormData = {
  patient_name: '',
  department: '',
  rm_name: '',
  cost: '',
  cut: '',
  notes: '',
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
};

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const formatINR = (n: number): string => n.toLocaleString('en-IN');

const toNumber = (v: unknown): number => {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return isNaN(n) ? 0 : n;
};

export function DailyRevenueReportSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reportDate, setReportDate] = useState<string>(todayIso());
  const [editingCutId, setEditingCutId] = useState<string | null>(null);
  const [draftCut, setDraftCut] = useState<string>('');
  const [draftCost, setDraftCost] = useState<string>('');
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [manualEditId, setManualEditId] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState<ManualFormData>(initialManual);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Default cut % applied to rows without a saved cut. Persists in localStorage.
  const [detailsRow, setDetailsRow] = useState<DisplayRow | null>(null);
  const [onlyWithRm, setOnlyWithRm] = useState<boolean>(false);

  const [defaultCutPercent, setDefaultCutPercent] = useState<number>(() => {
    if (typeof window === 'undefined') return 25;
    const stored = window.localStorage.getItem('dailyRevenue.defaultCutPercent');
    const n = stored ? parseFloat(stored) : NaN;
    return isNaN(n) || n < 0 || n > 100 ? 25 : n;
  });
  const updateDefaultCutPercent = (raw: string) => {
    const n = parseFloat(raw);
    const safe = isNaN(n) || n < 0 ? 0 : n > 100 ? 100 : n;
    setDefaultCutPercent(safe);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dailyRevenue.defaultCutPercent', String(safe));
    }
  };

  const hospitalType = user?.hospitalType ?? '';

  // Director sees patients from BOTH hospitals on one screen — no hospital_name filter.
  const visitsQuery = useQuery({
    queryKey: ['dailyRevenueVisits', reportDate],
    queryFn: async (): Promise<VisitRow[]> => {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          visit_id,
          visit_date,
          appointment_with,
          package_amount,
          patient_type,
          created_at,
          patients!inner ( id, name, hospital_name, relationship_manager ),
          relationship_managers ( id, name, code )
        `)
        .eq('visit_date', reportDate)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as VisitRow[];
    },
  });

  // Sum advance payments per visit_id (text) so we can use them as the cost
  // when the package_amount field on the visit is empty.
  const visitIds: string[] = useMemo(
    () => (visitsQuery.data ?? []).map((v) => v.visit_id).filter(Boolean),
    [visitsQuery.data],
  );

  const advanceQuery = useQuery({
    queryKey: ['dailyRevenueAdvance', visitIds.join(',')],
    queryFn: async (): Promise<Record<string, number>> => {
      if (visitIds.length === 0) return {};
      const { data, error } = await supabase
        .from('advance_payment' as never)
        .select('visit_id, advance_amount, returned_amount, status')
        .in('visit_id', visitIds);
      if (error) throw error;
      const sums: Record<string, number> = {};
      for (const r of (data ?? []) as unknown as Array<{
        visit_id: string;
        advance_amount: number | string | null;
        returned_amount: number | string | null;
        status: string | null;
      }>) {
        if (r.status === 'CANCELLED') continue;
        const net = toNumber(r.advance_amount) - toNumber(r.returned_amount);
        sums[r.visit_id] = (sums[r.visit_id] ?? 0) + net;
      }
      return sums;
    },
    enabled: visitIds.length > 0,
  });

  const finalPayQuery = useQuery({
    queryKey: ['dailyRevenueFinalPay', visitIds.join(',')],
    queryFn: async (): Promise<Record<string, number>> => {
      if (visitIds.length === 0) return {};
      const { data, error } = await supabase
        .from('final_payments' as never)
        .select('visit_id, amount')
        .in('visit_id', visitIds);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const r of (data ?? []) as unknown as Array<{
        visit_id: string;
        amount: number | string | null;
      }>) {
        map[r.visit_id] = (map[r.visit_id] ?? 0) + toNumber(r.amount);
      }
      return map;
    },
    enabled: visitIds.length > 0,
  });

  // Director sees overrides from BOTH hospitals on one screen.
  const overridesQuery = useQuery({
    queryKey: ['dailyRevenueOverrides', reportDate],
    queryFn: async (): Promise<OverrideRow[]> => {
      const { data, error } = await supabase
        .from('daily_revenue_entries' as never)
        .select('*')
        .eq('entry_date', reportDate)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as OverrideRow[];
    },
  });

  const rows: DisplayRow[] = useMemo(() => {
    const visits = visitsQuery.data ?? [];
    const overrides = overridesQuery.data ?? [];
    const advanceMap = advanceQuery.data ?? {};
    const finalPayMap = finalPayQuery.data ?? {};

    const overrideByVisit = new Map<string, OverrideRow>();
    for (const o of overrides) {
      if (o.visit_id) overrideByVisit.set(o.visit_id, o);
    }

    const visitRows: DisplayRow[] = visits.map((v) => {
      const o = overrideByVisit.get(v.id);

      // Priority: manual override > advance > bill prep > final pay > visits.package_amount.
      // visit_id (text, e.g. "IH25F27004") is the lookup key for billing tables.
      let cost = 0;
      let cost_source: CostSource = 'none';
      if (o && Number(o.cost) > 0) {
        cost = Number(o.cost);
        cost_source = 'override';
      } else if ((advanceMap[v.visit_id] ?? 0) > 0) {
        cost = advanceMap[v.visit_id];
        cost_source = 'advance';
      } else if ((finalPayMap[v.visit_id] ?? 0) > 0) {
        cost = finalPayMap[v.visit_id];
        cost_source = 'final_pay';
      } else if (toNumber(v.package_amount) > 0) {
        cost = toNumber(v.package_amount);
        cost_source = 'package';
      }

      const savedCut = o ? Number(o.cut) : 0;
      const hasSavedCut = Boolean(o) && savedCut > 0;
      const suggestedCut = Math.round((cost * defaultCutPercent) / 100);
      return {
        key: `visit-${v.id}`,
        visitId: v.id,
        overrideId: o?.id ?? null,
        patient_name: v.patients?.name ?? '—',
        department: v.appointment_with ?? '',
        rm_name: v.relationship_managers?.name ?? v.patients?.relationship_manager ?? '',
        hospital: v.patients?.hospital_name ?? '',
        cost,
        cut: hasSavedCut ? savedCut : suggestedCut,
        cutIsSuggested: !hasSavedCut && suggestedCut > 0,
        cost_source,
        isManual: false,
      };
    });

    const manualRows: DisplayRow[] = overrides
      .filter((o) => !o.visit_id)
      .map((o) => ({
        key: `manual-${o.id}`,
        visitId: null,
        overrideId: o.id,
        patient_name: o.patient_name,
        department: o.department ?? '',
        rm_name: o.rm_name ?? '',
        hospital: o.hospital_type ?? '',
        cost: Number(o.cost),
        cut: Number(o.cut),
        cutIsSuggested: false,
        cost_source: 'override' as const,
        isManual: true,
      }));

    const all = [...visitRows, ...manualRows];
    return onlyWithRm ? all.filter((r) => r.rm_name && r.rm_name.trim() !== '') : all;
  }, [visitsQuery.data, overridesQuery.data, advanceQuery.data, finalPayQuery.data, defaultCutPercent, onlyWithRm]);

  const totals = useMemo(
    () => rows.reduce((acc, r) => ({ cost: acc.cost + r.cost, cut: acc.cut + r.cut }), { cost: 0, cut: 0 }),
    [rows],
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['dailyRevenueOverrides'] });
  };

  const saveCutMutation = useMutation({
    mutationFn: async (row: DisplayRow) => {
      const cost = parseFloat(draftCost || '0');
      const cut = parseFloat(draftCut || '0');
      if (isNaN(cost) || cost < 0) throw new Error('Cost must be ≥ 0');
      if (isNaN(cut) || cut < 0) throw new Error('Cut must be ≥ 0');

      // Override row is tagged with the visit's hospital, not the editor's.
      const rowHospital = row.hospital || hospitalType || 'hope';

      if (row.overrideId) {
        const { error } = await supabase
          .from('daily_revenue_entries' as never)
          .update({
            cost,
            cut,
            updated_at: new Date().toISOString(),
          } as never)
          .eq('id', row.overrideId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('daily_revenue_entries' as never).insert([
          {
            entry_date: reportDate,
            visit_id: row.visitId,
            patient_name: row.patient_name,
            department: row.department || null,
            rm_name: row.rm_name || null,
            cost,
            cut,
            hospital_type: rowHospital,
          } as never,
        ]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success('Saved');
      setEditingCutId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const addManualMutation = useMutation({
    mutationFn: async (data: ManualFormData) => {
      if (!data.patient_name.trim()) throw new Error('Patient name is required');
      const cost = parseFloat(data.cost || '0');
      const cut = parseFloat(data.cut || '0');
      if (isNaN(cost) || cost < 0) throw new Error('Cost must be ≥ 0');
      if (isNaN(cut) || cut < 0) throw new Error('Cut must be ≥ 0');
      const { error } = await supabase.from('daily_revenue_entries' as never).insert([
        {
          entry_date: reportDate,
          patient_name: data.patient_name.trim(),
          department: data.department.trim() || null,
          rm_name: data.rm_name.trim() || null,
          cost,
          cut,
          hospital_type: hospitalType || 'hope',
          notes: data.notes.trim() || null,
        } as never,
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Entry added');
      setIsManualDialogOpen(false);
      setManualForm(initialManual);
      setManualEditId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateManualMutation = useMutation({
    mutationFn: async (data: ManualFormData) => {
      if (!manualEditId) throw new Error('No row selected');
      const cost = parseFloat(data.cost || '0');
      const cut = parseFloat(data.cut || '0');
      const { error } = await supabase
        .from('daily_revenue_entries' as never)
        .update({
          patient_name: data.patient_name.trim(),
          department: data.department.trim() || null,
          rm_name: data.rm_name.trim() || null,
          cost,
          cut,
          notes: data.notes.trim() || null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', manualEditId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Updated');
      setIsManualDialogOpen(false);
      setManualForm(initialManual);
      setManualEditId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('daily_revenue_entries' as never)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Deleted');
      setDeleteId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openInlineEdit = (row: DisplayRow) => {
    setEditingCutId(row.key);
    setDraftCost(String(row.cost));
    setDraftCut(String(row.cut));
  };

  const openManualAdd = () => {
    setManualEditId(null);
    setManualForm(initialManual);
    setIsManualDialogOpen(true);
  };

  const openManualEdit = (row: DisplayRow) => {
    if (!row.overrideId) return;
    setManualEditId(row.overrideId);
    setManualForm({
      patient_name: row.patient_name,
      department: row.department,
      rm_name: row.rm_name,
      cost: String(row.cost),
      cut: String(row.cut),
      notes: '',
    });
    setIsManualDialogOpen(true);
  };

  const submitManual = () => {
    if (manualEditId) updateManualMutation.mutate(manualForm);
    else addManualMutation.mutate(manualForm);
  };

  const isLoading = visitsQuery.isLoading || overridesQuery.isLoading;
  const error = visitsQuery.error ?? overridesQuery.error;

  return (
    <Card id="daily-revenue-report" className="border-l-4 border-l-emerald-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-600" />
          <CardTitle>Daily Revenue Report — Patient List & RM Cuts</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-sm select-none cursor-pointer">
            <input
              type="checkbox"
              checked={onlyWithRm}
              onChange={(e) => setOnlyWithRm(e.target.checked)}
              className="h-4 w-4"
            />
            Only with RM
          </label>
          <Label htmlFor="default_cut_pct" className="text-sm">Default Cut %</Label>
          <Input
            id="default_cut_pct"
            type="number"
            min="0"
            max="100"
            step="1"
            value={defaultCutPercent}
            onChange={(e) => updateDefaultCutPercent(e.target.value)}
            className="w-20"
            title="Auto-suggested cut as a % of cost for rows that haven't been saved yet"
          />
          <Label htmlFor="daily_report_date" className="text-sm">Date</Label>
          <Input
            id="daily_report_date"
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="w-44"
          />
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={openManualAdd}>
            <Plus className="h-4 w-4" /> Add Manual
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" role="status" aria-label="Loading daily revenue report" />
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded text-red-700 text-sm">
            Failed to load report.
            <div className="text-xs mt-1 opacity-70">{getErrorMessage(error)}</div>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No visits on {new Date(reportDate).toLocaleDateString('en-IN')}.</p>
            <p className="text-sm">Use "Add Manual" for entries not in the visits system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>RM Manager</TableHead>
                  <TableHead className="text-right">Cost (Rs)</TableHead>
                  <TableHead className="text-right">Cut (Rs)</TableHead>
                  <TableHead className="text-right print:hidden">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, idx) => {
                  const editing = editingCutId === r.key;
                  return (
                    <TableRow key={r.key} className="hover:bg-gray-50">
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">
                        {r.patient_name}
                        {r.isManual && <span className="ml-2 text-xs text-gray-500">(manual)</span>}
                      </TableCell>
                      <TableCell>
                        {r.hospital ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium uppercase ${
                              r.hospital.toLowerCase().includes('ayushman')
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {r.hospital}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{r.department || '—'}</TableCell>
                      <TableCell>{r.rm_name}</TableCell>
                      <TableCell className="text-right">
                        {editing ? (
                          <Input
                            type="number"
                            min="0"
                            value={draftCost}
                            onChange={(e) => setDraftCost(e.target.value)}
                            className="h-8 w-24 ml-auto text-right"
                          />
                        ) : (
                          <span className="inline-flex items-baseline gap-1 justify-end">
                            <span>Rs {formatINR(r.cost)}</span>
                            {r.cost_source !== 'none' && (
                              <span
                                className="text-[10px] uppercase tracking-wide text-gray-400 print:hidden"
                                title={`Cost source: ${r.cost_source}`}
                              >
                                {COST_SOURCE_LABEL[r.cost_source]}
                              </span>
                            )}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editing ? (
                          <Input
                            type="number"
                            min="0"
                            value={draftCut}
                            onChange={(e) => setDraftCut(e.target.value)}
                            className="h-8 w-24 ml-auto text-right"
                          />
                        ) : (
                          <span
                            className={r.cutIsSuggested ? 'italic text-gray-500' : ''}
                            title={r.cutIsSuggested ? `Suggested @ ${defaultCutPercent}% — click edit to save the actual value` : undefined}
                          >
                            Rs {formatINR(r.cut)}
                            {r.cutIsSuggested && (
                              <span className="ml-1 text-[10px] uppercase tracking-wide text-gray-400 print:hidden">sug</span>
                            )}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1 print:hidden">
                        {editing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label="Save"
                              disabled={saveCutMutation.isPending}
                              onClick={() => saveCutMutation.mutate(r)}
                            >
                              <Save className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" aria-label="Cancel" onClick={() => setEditingCutId(null)}>
                              <span className="text-xs">Cancel</span>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="sm" aria-label="View patient details" onClick={() => setDetailsRow(r)}>
                              <Eye className="h-4 w-4 text-emerald-600" />
                            </Button>
                            <Button variant="ghost" size="sm" aria-label="Edit cost/cut" onClick={() => openInlineEdit(r)}>
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            {r.isManual && r.overrideId && (
                              <>
                                <Button variant="ghost" size="sm" aria-label="Full edit" onClick={() => openManualEdit(r)}>
                                  <span className="text-xs text-gray-600">Edit</span>
                                </Button>
                                <Button variant="ghost" size="sm" aria-label="Delete" onClick={() => setDeleteId(r.overrideId!)}>
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-gray-100 font-bold border-t-2">
                  <TableCell colSpan={5} className="text-right">Grand Total</TableCell>
                  <TableCell className="text-right">Rs {formatINR(totals.cost)}</TableCell>
                  <TableCell className="text-right">Rs {formatINR(totals.cut)}</TableCell>
                  <TableCell className="print:hidden" />
                </TableRow>
              </TableBody>
            </Table>
            <p className="text-xs text-gray-500 mt-3 print:hidden">
              Visits pulled live from the system for the selected date. Cost is auto-filled from:
              advance payment <span className="text-gray-400">(adv)</span> →
              final payment <span className="text-gray-400">(final)</span> →
              visit package <span className="text-gray-400">(pkg)</span>. Cut is auto-suggested at the Default Cut % above
              <span className="text-gray-400"> (sug)</span> — click the edit icon to save the actual cost/cut
              <span className="text-gray-400"> (man)</span>. Saved values persist on every refresh.
            </p>
          </div>
        )}
      </CardContent>

      {/* Manual Add/Edit Dialog */}
      <Dialog open={isManualDialogOpen} onOpenChange={(open) => { if (!open) { setIsManualDialogOpen(false); setManualEditId(null); setManualForm(initialManual); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{manualEditId ? 'Edit Manual Entry' : 'Add Manual Entry'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="m_patient_name">Patient Name *</Label>
              <Input id="m_patient_name" value={manualForm.patient_name} maxLength={150}
                onChange={(e) => setManualForm({ ...manualForm, patient_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="m_department">Department</Label>
                <Input id="m_department" placeholder="ENT, Derma, Gastro..." value={manualForm.department} maxLength={50}
                  onChange={(e) => setManualForm({ ...manualForm, department: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="m_rm">RM Manager</Label>
                <Input id="m_rm" placeholder="Lakesh, AB, VBR..." value={manualForm.rm_name} maxLength={100}
                  onChange={(e) => setManualForm({ ...manualForm, rm_name: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="m_cost">Cost (₹)</Label>
                <Input id="m_cost" type="number" min="0" step="0.01" value={manualForm.cost}
                  onChange={(e) => setManualForm({ ...manualForm, cost: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="m_cut">Cut (₹)</Label>
                <Input id="m_cut" type="number" min="0" step="0.01" value={manualForm.cut}
                  onChange={(e) => setManualForm({ ...manualForm, cut: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="m_notes">Notes (Optional)</Label>
              <Input id="m_notes" value={manualForm.notes} maxLength={500}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsManualDialogOpen(false); setManualEditId(null); setManualForm(initialManual); }}>Cancel</Button>
            <Button onClick={submitManual} disabled={addManualMutation.isPending || updateManualMutation.isPending}>
              {manualEditId ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient details dialog */}
      <PatientDetailsDialog
        row={detailsRow}
        reportDate={reportDate}
        onClose={() => setDetailsRow(null)}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this entry?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface PatientDetailsDialogProps {
  row: DisplayRow | null;
  reportDate: string;
  onClose: () => void;
}

interface FullPatientInfo {
  patient: Record<string, unknown> | null;
  visit: Record<string, unknown> | null;
  advances: Array<Record<string, unknown>>;
  finals: Array<Record<string, unknown>>;
}

function PatientDetailsDialog({ row, reportDate, onClose }: PatientDetailsDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['patientDetailsDialog', row?.visitId, row?.overrideId],
    queryFn: async (): Promise<FullPatientInfo> => {
      const result: FullPatientInfo = { patient: null, visit: null, advances: [], finals: [] };
      if (!row?.visitId) return result;

      const { data: v } = await supabase
        .from('visits')
        .select('id, visit_id, visit_date, appointment_with, package_amount, patient_type, status, billing_executive, admission_date, discharge_date, claim_id, reason_for_visit, patient_id')
        .eq('id', row.visitId)
        .maybeSingle();
      if (v) {
        result.visit = v as Record<string, unknown>;
        const patientId = (v as { patient_id?: string }).patient_id;
        if (patientId) {
          const { data: p } = await supabase
            .from('patients')
            .select('id, name, patients_id, age, gender, date_of_birth, phone, email, address, city_town, state, hospital_name, relationship_manager, corporate, insurance_person_no, blood_group, emergency_contact_name, emergency_contact_mobile')
            .eq('id', patientId)
            .maybeSingle();
          if (p) result.patient = p as Record<string, unknown>;
        }
        const visitIdText = (v as { visit_id?: string }).visit_id;
        if (visitIdText) {
          const [adv, fin] = await Promise.all([
            supabase.from('advance_payment' as never).select('*').eq('visit_id', visitIdText),
            supabase.from('final_payments' as never).select('*').eq('visit_id', visitIdText),
          ]);
          result.advances = (adv.data ?? []) as Array<Record<string, unknown>>;
          result.finals = (fin.data ?? []) as Array<Record<string, unknown>>;
        }
      }
      return result;
    },
    enabled: !!row,
  });

  const fmt = (v: unknown): string => {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    return String(v);
  };

  const fmtMoney = (v: unknown): string => {
    if (v === null || v === undefined || v === '') return '—';
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    if (isNaN(n)) return '—';
    return `Rs ${n.toLocaleString('en-IN')}`;
  };

  return (
    <Dialog open={!!row} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Patient Details — {row?.patient_name ?? ''}</DialogTitle>
        </DialogHeader>

        {!row ? null : isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading patient details...</div>
        ) : (
          <div className="space-y-6 text-sm">
            {/* Summary (from the row) */}
            <section>
              <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Report Summary</h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-1">
                <div><dt className="inline text-gray-500">Date: </dt><dd className="inline">{new Date(reportDate).toLocaleDateString('en-IN')}</dd></div>
                <div><dt className="inline text-gray-500">Hospital: </dt><dd className="inline">{row.hospital || '—'}</dd></div>
                <div><dt className="inline text-gray-500">Department: </dt><dd className="inline">{row.department || '—'}</dd></div>
                <div><dt className="inline text-gray-500">RM Manager: </dt><dd className="inline">{row.rm_name || '—'}</dd></div>
                <div><dt className="inline text-gray-500">Cost: </dt><dd className="inline font-medium">Rs {row.cost.toLocaleString('en-IN')}</dd></div>
                <div><dt className="inline text-gray-500">Cut: </dt><dd className="inline font-medium">Rs {row.cut.toLocaleString('en-IN')}{row.cutIsSuggested && <span className="ml-1 text-xs text-gray-400">(suggested)</span>}</dd></div>
                <div><dt className="inline text-gray-500">Cost source: </dt><dd className="inline">{COST_SOURCE_LABEL[row.cost_source] || '—'}</dd></div>
                <div><dt className="inline text-gray-500">Entry type: </dt><dd className="inline">{row.isManual ? 'Manual' : 'From visits'}</dd></div>
              </dl>
            </section>

            {/* Patient master */}
            {data?.patient && (
              <section>
                <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Patient Master</h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <div><dt className="inline text-gray-500">UHID: </dt><dd className="inline">{fmt(data.patient.patients_id)}</dd></div>
                  <div><dt className="inline text-gray-500">Name: </dt><dd className="inline">{fmt(data.patient.name)}</dd></div>
                  <div><dt className="inline text-gray-500">Age: </dt><dd className="inline">{fmt(data.patient.age)}</dd></div>
                  <div><dt className="inline text-gray-500">Gender: </dt><dd className="inline">{fmt(data.patient.gender)}</dd></div>
                  <div><dt className="inline text-gray-500">Phone: </dt><dd className="inline">{fmt(data.patient.phone)}</dd></div>
                  <div><dt className="inline text-gray-500">Blood Group: </dt><dd className="inline">{fmt(data.patient.blood_group)}</dd></div>
                  <div className="col-span-2"><dt className="inline text-gray-500">Address: </dt><dd className="inline">{fmt(data.patient.address)}{data.patient.city_town ? `, ${fmt(data.patient.city_town)}` : ''}{data.patient.state ? `, ${fmt(data.patient.state)}` : ''}</dd></div>
                  <div><dt className="inline text-gray-500">Hospital: </dt><dd className="inline">{fmt(data.patient.hospital_name)}</dd></div>
                  <div><dt className="inline text-gray-500">RM (patient master): </dt><dd className="inline">{fmt(data.patient.relationship_manager)}</dd></div>
                  <div><dt className="inline text-gray-500">Corporate: </dt><dd className="inline">{fmt(data.patient.corporate)}</dd></div>
                  <div><dt className="inline text-gray-500">Insurance #: </dt><dd className="inline">{fmt(data.patient.insurance_person_no)}</dd></div>
                  <div><dt className="inline text-gray-500">Emergency: </dt><dd className="inline">{fmt(data.patient.emergency_contact_name)} {data.patient.emergency_contact_mobile ? `(${fmt(data.patient.emergency_contact_mobile)})` : ''}</dd></div>
                </dl>
              </section>
            )}

            {/* Visit info */}
            {data?.visit && (
              <section>
                <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Visit</h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <div><dt className="inline text-gray-500">Visit ID: </dt><dd className="inline font-mono">{fmt(data.visit.visit_id)}</dd></div>
                  <div><dt className="inline text-gray-500">Visit Date: </dt><dd className="inline">{fmt(data.visit.visit_date)}</dd></div>
                  <div><dt className="inline text-gray-500">Type: </dt><dd className="inline">{fmt(data.visit.patient_type)}</dd></div>
                  <div><dt className="inline text-gray-500">Status: </dt><dd className="inline">{fmt(data.visit.status)}</dd></div>
                  <div><dt className="inline text-gray-500">Doctor / Dept: </dt><dd className="inline">{fmt(data.visit.appointment_with)}</dd></div>
                  <div><dt className="inline text-gray-500">Billing Executive: </dt><dd className="inline">{fmt(data.visit.billing_executive)}</dd></div>
                  <div><dt className="inline text-gray-500">Admission: </dt><dd className="inline">{fmt(data.visit.admission_date)}</dd></div>
                  <div><dt className="inline text-gray-500">Discharge: </dt><dd className="inline">{fmt(data.visit.discharge_date)}</dd></div>
                  <div><dt className="inline text-gray-500">Claim ID: </dt><dd className="inline">{fmt(data.visit.claim_id)}</dd></div>
                  <div><dt className="inline text-gray-500">Package Amt: </dt><dd className="inline">{fmtMoney(data.visit.package_amount)}</dd></div>
                  {data.visit.reason_for_visit ? (
                    <div className="col-span-2"><dt className="inline text-gray-500">Reason: </dt><dd className="inline">{fmt(data.visit.reason_for_visit)}</dd></div>
                  ) : null}
                </dl>
              </section>
            )}

            {/* Advance payments */}
            {data?.advances && data.advances.length > 0 && (
              <section>
                <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Advance Payments ({data.advances.length})</h3>
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-1">Date</th>
                      <th className="text-left p-1">Mode</th>
                      <th className="text-right p-1">Amount</th>
                      <th className="text-right p-1">Returned</th>
                      <th className="text-left p-1">Status</th>
                      <th className="text-left p-1">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.advances.map((a, i) => (
                      <tr key={String(a.id ?? i)} className="border-t">
                        <td className="p-1">{fmt(a.payment_date)}</td>
                        <td className="p-1">{fmt(a.payment_mode)}</td>
                        <td className="p-1 text-right">{fmtMoney(a.advance_amount)}</td>
                        <td className="p-1 text-right">{fmtMoney(a.returned_amount)}</td>
                        <td className="p-1">{fmt(a.status)}</td>
                        <td className="p-1">{fmt(a.reference_number)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {/* Final payments */}
            {data?.finals && data.finals.length > 0 && (
              <section>
                <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Final Payments ({data.finals.length})</h3>
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-1">Mode</th>
                      <th className="text-right p-1">Amount</th>
                      <th className="text-left p-1">Reason</th>
                      <th className="text-left p-1">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.finals.map((f, i) => (
                      <tr key={String(f.id ?? i)} className="border-t">
                        <td className="p-1">{fmt(f.mode_of_payment)}</td>
                        <td className="p-1 text-right">{fmtMoney(f.amount)}</td>
                        <td className="p-1">{fmt(f.reason_of_discharge)}</td>
                        <td className="p-1">{fmt(f.payment_remark)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {row.isManual && (
              <section className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-800 text-xs">
                This is a manual entry not linked to any visit in the system. The patient master and visit sections are not available.
              </section>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DailyRevenueReportSection;
