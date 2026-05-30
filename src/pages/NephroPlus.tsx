import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, Plus, Pencil, Trash2 } from 'lucide-react';
import { PAYER_LABELS, type DialysisRateRow } from '@/lib/nephroplus/revenue-share';
import { SessionDialog } from '@/components/nephroplus/SessionDialog';
import { SettlementTab } from '@/components/nephroplus/SettlementTab';
import { RatesTab } from '@/components/nephroplus/RatesTab';
import { MonthlySettlement } from '@/components/nephroplus/MonthlySettlement';
import { ImportFromRecords } from '@/components/nephroplus/ImportFromRecords';
import { ByPatientTab } from '@/components/nephroplus/ByPatientTab';
import { INR, type DialysisSession, type SessionPrefill } from '@/components/nephroplus/types';

function firstOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NephroPlus() {
  const { user, hospitalConfig } = useAuth();
  const { toast } = useToast();
  const hospitalName = hospitalConfig?.name ?? 'hope';
  const createdBy = user?.email ?? null;

  const [rateConfig, setRateConfig] = useState<DialysisRateRow[]>([]);
  const [sessions, setSessions] = useState<DialysisSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(firstOfMonth());
  const [toDate, setToDate] = useState(todayStr());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DialysisSession | null>(null);
  const [prefill, setPrefill] = useState<SessionPrefill | null>(null);
  const [existingVisitIds, setExistingVisitIds] = useState<Set<string>>(new Set());
  const [reloadKey, setReloadKey] = useState(0);

  const categoryLabels = useMemo(() => {
    const map: Record<string, string> = {};
    rateConfig.forEach((r) => { map[r.service_category] = r.label; });
    return map;
  }, [rateConfig]);

  const loadRates = useCallback(async () => {
    const { data, error } = await supabase
      .from('dialysis_rate_config')
      .select('*')
      .eq('hospital_name', hospitalName)
      .order('sort_order', { ascending: true });
    if (error) {
      toast({ title: 'Failed to load rates', description: error.message, variant: 'destructive' });
      return;
    }
    setRateConfig((data ?? []) as unknown as DialysisRateRow[]);
  }, [hospitalName, toast]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dialysis_sessions')
      .select('*')
      .eq('hospital_name', hospitalName)
      .gte('session_date', fromDate)
      .lte('session_date', toDate)
      .order('session_date', { ascending: false });
    setLoading(false);
    if (error) {
      toast({ title: 'Failed to load sessions', description: error.message, variant: 'destructive' });
      return;
    }
    setSessions((data ?? []) as unknown as DialysisSession[]);
  }, [hospitalName, fromDate, toDate, toast]);

  const loadExistingVisitIds = useCallback(async () => {
    const { data } = await supabase
      .from('dialysis_sessions')
      .select('visit_id')
      .eq('hospital_name', hospitalName)
      .not('visit_id', 'is', null);
    const ids = new Set<string>();
    (data ?? []).forEach((r: Record<string, unknown>) => {
      if (r.visit_id) ids.add(r.visit_id as string);
    });
    setExistingVisitIds(ids);
  }, [hospitalName]);

  useEffect(() => { loadRates(); }, [loadRates]);
  useEffect(() => { loadSessions(); }, [loadSessions]);
  useEffect(() => { loadExistingVisitIds(); }, [loadExistingVisitIds]);

  // Government payers are excluded from the money summary (NephroPlus payable view).
  const totals = useMemo(
    () =>
      sessions
        .filter((s) => s.payer_type !== 'govt')
        .reduce(
          (acc, s) => ({
            charged: acc.charged + (Number(s.charged_price) || 0),
            hope: acc.hope + (Number(s.hope_share) || 0),
            nephroplus: acc.nephroplus + (Number(s.nephroplus_share) || 0),
          }),
          { charged: 0, hope: 0, nephroplus: 0 }
        ),
    [sessions]
  );

  const refresh = useCallback(() => {
    loadSessions();
    loadExistingVisitIds();
    setReloadKey((k) => k + 1);
  }, [loadSessions, loadExistingVisitIds]);

  const openAdd = () => { setEditing(null); setPrefill(null); setDialogOpen(true); };
  const openEdit = (s: DialysisSession) => { setPrefill(null); setEditing(s); setDialogOpen(true); };
  const openFromRecord = (p: SessionPrefill) => { setEditing(null); setPrefill(p); setDialogOpen(true); };

  const handleDelete = async (s: DialysisSession) => {
    if (!window.confirm(`Delete dialysis session for ${s.patient_name}?`)) return;
    const { error } = await supabase.from('dialysis_sessions').delete().eq('id', s.id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Session deleted' });
    refresh();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Activity className="h-7 w-7 text-rose-600" />
          <div>
            <h1 className="text-2xl font-bold">NephroPlus Dialysis</h1>
            <p className="text-sm text-muted-foreground">
              Hope &harr; NephroPlus revenue share · Supplemental Agreement (eff. 09-Dec-2024)
            </p>
          </div>
        </div>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Add session</Button>
      </div>

      {/* 3-month payable-to-NephroPlus settlement (printable) */}
      <MonthlySettlement hospitalName={hospitalName} reloadKey={reloadKey} />

      {/* Date filter */}
      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <Label>From</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-44" />
        </div>
        <div>
          <Label>To</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-44" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <SummaryCard title="Sessions" value={String(sessions.length)} />
        <SummaryCard title="Total Charged" value={INR.format(totals.charged)} />
        <SummaryCard title="Hope Entitlement" value={INR.format(totals.hope)} accent="text-rose-600" />
        <SummaryCard title="NephroPlus Share" value={INR.format(totals.nephroplus)} accent="text-blue-600" />
      </div>

      <Tabs defaultValue="patient">
        <TabsList>
          <TabsTrigger value="patient">By Patient</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="records">From Records</TabsTrigger>
          <TabsTrigger value="settlement">Settlement</TabsTrigger>
          <TabsTrigger value="rates">Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="patient" className="mt-4">
          <ByPatientTab hospitalName={hospitalName} onRecord={openFromRecord} refreshKey={reloadKey} />
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Charged</TableHead>
                  <TableHead className="text-right">Hope</TableHead>
                  <TableHead className="text-right">NephroPlus</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">Loading…</TableCell></TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">No dialysis sessions in this range.</TableCell></TableRow>
                ) : (
                  sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.session_date}</TableCell>
                      <TableCell className="font-medium">{s.patient_name}</TableCell>
                      <TableCell><Badge variant="outline">{s.encounter_type}</Badge></TableCell>
                      <TableCell className="text-xs">{PAYER_LABELS[s.payer_type]}</TableCell>
                      <TableCell className="text-xs">{categoryLabels[s.service_category] ?? s.service_category}</TableCell>
                      <TableCell className="text-right">{INR.format(Number(s.charged_price) || 0)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {INR.format(Number(s.hope_share) || 0)}
                        {s.rate_pct_applied !== null && <span className="text-xs text-muted-foreground"> ({s.rate_pct_applied}%)</span>}
                      </TableCell>
                      <TableCell className="text-right">{INR.format(Number(s.nephroplus_share) || 0)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          <ImportFromRecords
            existingVisitIds={existingVisitIds}
            onRecord={openFromRecord}
            refreshKey={reloadKey}
          />
        </TabsContent>

        <TabsContent value="settlement" className="mt-4">
          <SettlementTab sessions={sessions} />
        </TabsContent>

        <TabsContent value="rates" className="mt-4">
          <RatesTab rateConfig={rateConfig} onChanged={loadRates} />
        </TabsContent>
      </Tabs>

      <SessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rateConfig={rateConfig}
        hospitalName={hospitalName}
        createdBy={createdBy}
        session={editing}
        prefill={prefill}
        onSaved={refresh}
      />
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  accent?: string;
}

function SummaryCard({ title, value, accent }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${accent ?? ''}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
