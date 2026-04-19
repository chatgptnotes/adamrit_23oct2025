import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, CheckCircle, Phone, SkipForward, Tv, Clock } from 'lucide-react';
import { format } from 'date-fns';

const DEPARTMENTS = [
  'OPD', 'Lab', 'Radiology', 'USG', 'CT', 'MRI', 'X-Ray',
  'ECG', 'Pharmacy', 'Billing', 'Physiotherapy', 'BMD', 'MAMO'
];

const STATUS_COLORS: Record<string, string> = {
  waiting: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  called: 'bg-blue-100 text-blue-800 border-blue-200',
  serving: 'bg-green-100 text-green-800 border-green-200',
  done: 'bg-gray-100 text-gray-500 border-gray-200',
  skipped: 'bg-red-100 text-red-700 border-red-200',
};

export default function QueueManagement() {
  const qc = useQueryClient();
  const [dept, setDept] = useState('OPD');
  const [patientName, setPatientName] = useState('');
  const [mobile, setMobile] = useState('');
  const [counter, setCounter] = useState('Counter 1');

  // DATA SOURCE: queue_tokens → filtered by department + today's date
  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ['queue-tokens', dept],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('queue_tokens')
        .select('*')
        .eq('department', dept)
        .gte('created_at', today.toISOString())
        .order('token_number', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const issueToken = useMutation({
    mutationFn: async () => {
      if (!patientName.trim()) throw new Error('Patient name required');
      // Get next token number for today
      const { data: nextData, error: nextErr } = await supabase
        .rpc('next_queue_token', { dept });
      if (nextErr) throw nextErr;

      const { error } = await supabase.from('queue_tokens').insert({
        token_number: nextData,
        department: dept,
        patient_name: patientName.trim(),
        mobile: mobile.trim() || null,
        status: 'waiting',
        counter_name: counter,
      });
      if (error) throw error;
      return nextData;
    },
    onSuccess: (tokenNum) => {
      toast.success(`Token ${dept}-${tokenNum} issued`);
      setPatientName('');
      setMobile('');
      qc.invalidateQueries({ queryKey: ['queue-tokens', dept] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, string | null> = { status };
      if (status === 'called') updates.called_at = new Date().toISOString();
      if (status === 'serving') updates.served_at = new Date().toISOString();
      const { error } = await supabase.from('queue_tokens').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue-tokens', dept] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const waiting = tokens.filter(t => t.status === 'waiting');
  const active = tokens.filter(t => ['called', 'serving'].includes(t.status));
  const done = tokens.filter(t => ['done', 'skipped'].includes(t.status));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Queue Management</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), 'EEEE, dd MMMM yyyy')} · {tokens.length} tokens today
          </p>
        </div>
        <Button variant="outline" onClick={() => window.open('/queue-display?dept=' + dept, '_blank')}>
          <Tv className="w-4 h-4 mr-2" />
          TV Display
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Issue Token */}
        <Card>
          <CardHeader><CardTitle className="text-base">Issue New Token</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Department</label>
              <Select value={dept} onValueChange={setDept}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Patient Name *</label>
              <Input
                placeholder="Enter patient name"
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && issueToken.mutate()}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Mobile (optional)</label>
              <Input
                placeholder="10-digit mobile"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Counter</label>
              <Select value={counter} onValueChange={setCounter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Counter 1', 'Counter 2', 'Counter 3', 'Room 1', 'Room 2'].map(c =>
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => issueToken.mutate()}
              disabled={issueToken.isPending || !patientName.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              {issueToken.isPending ? 'Issuing…' : 'Issue Token'}
            </Button>
          </CardContent>
        </Card>

        {/* Waiting Queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Waiting</CardTitle>
              <Badge variant="secondary">{waiting.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {waiting.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No patients waiting</p>
            )}
            {waiting.map(t => (
              <div key={t.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-blue-600">{dept[0]}{t.token_number}</span>
                    <span className="text-sm font-medium">{t.patient_name}</span>
                  </div>
                  {t.mobile && <p className="text-xs text-muted-foreground">{t.mobile}</p>}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(t.created_at), 'hh:mm a')}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs"
                    onClick={() => updateStatus.mutate({ id: t.id, status: 'called' })}>
                    <Phone className="w-3 h-3 mr-1" /> Call
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground"
                    onClick={() => updateStatus.mutate({ id: t.id, status: 'skipped' })}>
                    <SkipForward className="w-3 h-3 mr-1" /> Skip
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active / Done */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Now Serving</CardTitle>
                <Badge className="bg-green-100 text-green-800">{active.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {active.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">None active</p>
              )}
              {active.map(t => (
                <div key={t.id} className="flex items-center justify-between p-2 border rounded-lg bg-green-50">
                  <div>
                    <span className="font-bold text-lg text-green-700">{dept[0]}{t.token_number}</span>
                    <span className="text-sm font-medium ml-2">{t.patient_name}</span>
                    <Badge className={`ml-2 text-xs ${STATUS_COLORS[t.status]}`}>{t.status}</Badge>
                  </div>
                  <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
                    onClick={() => updateStatus.mutate({ id: t.id, status: 'done' })}>
                    <CheckCircle className="w-3 h-3 mr-1" /> Done
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-muted-foreground">Completed Today</CardTitle>
                <Badge variant="outline">{done.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="max-h-40 overflow-y-auto space-y-1">
              {done.map(t => (
                <div key={t.id} className="flex items-center justify-between text-sm text-muted-foreground px-1">
                  <span className="font-medium">{dept[0]}{t.token_number} — {t.patient_name}</span>
                  <Badge variant="outline" className="text-xs">{t.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
