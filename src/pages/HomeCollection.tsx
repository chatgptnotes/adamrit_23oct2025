import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, MapPin, Phone, Clock, CheckCircle, User, X, Barcode, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; color: string; next?: string }> = {
  pending:          { label: 'Pending',          color: 'bg-yellow-100 text-yellow-800', next: 'assigned' },
  assigned:         { label: 'Assigned',         color: 'bg-blue-100 text-blue-800',    next: 'en_route' },
  en_route:         { label: 'En Route',         color: 'bg-indigo-100 text-indigo-800', next: 'arrived' },
  arrived:          { label: 'Arrived',          color: 'bg-purple-100 text-purple-800', next: 'sample_collected' },
  sample_collected: { label: 'Collected',        color: 'bg-green-100 text-green-800',  next: 'delivered' },
  delivered:        { label: 'Delivered to Lab', color: 'bg-gray-100 text-gray-600' },
  cancelled:        { label: 'Cancelled',        color: 'bg-red-100 text-red-700' },
};

const TIME_SLOTS = ['6am-8am','8am-10am','10am-12pm','12pm-2pm','2pm-4pm','4pm-6pm'];

const LAB_TESTS = [
  'CBC','Blood Sugar Fasting','Blood Sugar PP','HbA1c','Lipid Profile',
  'Liver Function Test','Kidney Function Test','Thyroid Profile (TSH)',
  'Urine Routine','Serum Creatinine','Uric Acid','CRP','ESR','Vitamin D',
  'Vitamin B12','Iron Studies','Dengue NS1','Malaria Antigen','Widal Test',
  'Blood Culture','Urine Culture','HBsAg','Anti-HCV','HIV Combo',
];

interface NewRequest {
  patient_name: string;
  mobile: string;
  address: string;
  locality: string;
  preferred_date: string;
  preferred_time_slot: string;
  tests_requested: string[];
  special_instructions: string;
  collection_charges: string;
}

const emptyRequest = (): NewRequest => ({
  patient_name: '', mobile: '', address: '', locality: '',
  preferred_date: format(new Date(), 'yyyy-MM-dd'),
  preferred_time_slot: '8am-10am',
  tests_requested: [],
  special_instructions: '',
  collection_charges: '100',
});

export default function HomeCollection() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [form, setForm] = useState<NewRequest>(emptyRequest());
  const [testSearch, setTestSearch] = useState('');

  // DATA SOURCE: home_collection_requests → filtered by date + status
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['home-collections', filterDate, filterStatus],
    queryFn: async () => {
      let q = supabase
        .from('home_collection_requests')
        .select('*')
        .eq('preferred_date', filterDate)
        .order('created_at', { ascending: false });
      if (filterStatus !== 'all') q = q.eq('status', filterStatus);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const createRequest = useMutation({
    mutationFn: async () => {
      if (!form.patient_name || !form.mobile || !form.address) throw new Error('Name, mobile, and address are required');
      if (!form.tests_requested.length) throw new Error('Select at least one test');
      const { error } = await supabase.from('home_collection_requests').insert({
        ...form,
        collection_charges: parseFloat(form.collection_charges) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Home collection request created');
      setForm(emptyRequest());
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['home-collections'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const advanceStatus = useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: string }) => {
      const updates: Record<string, string> = { status: nextStatus };
      const now = new Date().toISOString();
      if (nextStatus === 'en_route') updates.en_route_at = now;
      if (nextStatus === 'arrived') updates.arrived_at = now;
      if (nextStatus === 'sample_collected') updates.collected_at = now;
      if (nextStatus === 'delivered') updates.delivered_at = now;
      const { error } = await supabase.from('home_collection_requests').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['home-collections'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleTest = (test: string) => {
    setForm(f => ({
      ...f,
      tests_requested: f.tests_requested.includes(test)
        ? f.tests_requested.filter(t => t !== test)
        : [...f.tests_requested, test],
    }));
  };

  const filteredTests = LAB_TESTS.filter(t => t.toLowerCase().includes(testSearch.toLowerCase()));

  const counts = Object.keys(STATUS_CONFIG).reduce<Record<string, number>>((acc, s) => {
    acc[s] = requests.filter(r => r.status === s).length;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Home Collection</h1>
          <p className="text-sm text-muted-foreground">{requests.length} requests for {format(new Date(filterDate), 'dd MMM yyyy')}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Request
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-40" />
        <div className="flex gap-2 flex-wrap">
          {['all', ...Object.keys(STATUS_CONFIG)].map(s => (
            <Button key={s} size="sm"
              variant={filterStatus === s ? 'default' : 'outline'}
              onClick={() => setFilterStatus(s)}
              className="h-8 text-xs">
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label}
              {s !== 'all' && counts[s] > 0 && <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-xs">{counts[s]}</Badge>}
            </Button>
          ))}
        </div>
      </div>

      {/* New request form */}
      {showForm && (
        <Card className="border-blue-200 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">New Home Collection Request</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Patient Name *</label>
                <Input value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Mobile *</label>
                <Input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
                <Input type="date" value={form.preferred_date} onChange={e => setForm(f => ({ ...f, preferred_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Time Slot</label>
                <Select value={form.preferred_time_slot} onValueChange={v => setForm(f => ({ ...f, preferred_time_slot: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIME_SLOTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Address *</label>
                <Textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Locality</label>
                <Input value={form.locality} onChange={e => setForm(f => ({ ...f, locality: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Collection Charges (₹)</label>
                <Input value={form.collection_charges} onChange={e => setForm(f => ({ ...f, collection_charges: e.target.value }))} />
              </div>
            </div>
            {/* Test selection */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Tests Requested * ({form.tests_requested.length} selected)
              </label>
              <Input placeholder="Search tests…" value={testSearch} onChange={e => setTestSearch(e.target.value)} className="mb-2" />
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {filteredTests.map(t => (
                  <Badge key={t} variant={form.tests_requested.includes(t) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs" onClick={() => toggleTest(t)}>
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Special Instructions</label>
              <Textarea value={form.special_instructions} onChange={e => setForm(f => ({ ...f, special_instructions: e.target.value }))} rows={2} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => createRequest.mutate()} disabled={createRequest.isPending}>
                {createRequest.isPending ? 'Creating…' : 'Create Request'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request list */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No home collection requests for this date.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => {
            const cfg = STATUS_CONFIG[r.status];
            const nextStatus = cfg?.next;
            return (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{r.patient_name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{r.request_number}</span>
                        <Badge className={`text-xs ${cfg?.color}`}>{cfg?.label}</Badge>
                        {r.preferred_time_slot && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />{r.preferred_time_slot}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />{r.mobile}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {r.locality ? `${r.locality}, ` : ''}{r.address.slice(0, 50)}{r.address.length > 50 ? '…' : ''}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(r.tests_requested || []).map((t: string) => (
                          <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                      {r.barcodes?.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-green-700">
                          <Barcode className="w-3.5 h-3.5" />
                          Barcodes: {r.barcodes.join(', ')}
                        </div>
                      )}
                      {r.phlebotomist_name && (
                        <div className="text-xs text-blue-700 flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />Assigned to: {r.phlebotomist_name}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {r.collection_charges > 0 && (
                        <span className="text-sm font-semibold">₹{r.collection_charges}</span>
                      )}
                      {nextStatus && (
                        <Button size="sm" className="h-8 text-xs"
                          onClick={() => advanceStatus.mutate({ id: r.id, nextStatus })}
                          disabled={advanceStatus.isPending}>
                          <RefreshCw className="w-3 h-3 mr-1" />
                          {STATUS_CONFIG[nextStatus]?.label}
                        </Button>
                      )}
                      {r.status === 'sample_collected' && (
                        <Button size="sm" variant="outline" className="h-8 text-xs"
                          onClick={() => advanceStatus.mutate({ id: r.id, nextStatus: 'delivered' })}>
                          <CheckCircle className="w-3 h-3 mr-1" />Mark Delivered
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
