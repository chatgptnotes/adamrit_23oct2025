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
import { Building2, Plus, Phone, MapPin, Clock, X, FileText, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';

// DATA SOURCE: b2b_partners → home_collection_requests (filtered by b2b_partner_id)

const STATUS_COLORS: Record<string, string> = {
  pending:          'bg-yellow-100 text-yellow-800',
  assigned:         'bg-blue-100 text-blue-800',
  en_route:         'bg-indigo-100 text-indigo-800',
  arrived:          'bg-purple-100 text-purple-800',
  sample_collected: 'bg-green-100 text-green-800',
  delivered:        'bg-gray-100 text-gray-600',
  cancelled:        'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', assigned: 'Assigned', en_route: 'En Route',
  arrived: 'Arrived', sample_collected: 'Collected', delivered: 'Delivered', cancelled: 'Cancelled',
};

const LAB_TESTS = [
  'CBC','Blood Sugar Fasting','Blood Sugar PP','HbA1c','Lipid Profile',
  'Liver Function Test','Kidney Function Test','Thyroid Profile (TSH)',
  'Urine Routine','Serum Creatinine','Uric Acid','CRP','ESR','Vitamin D',
  'Vitamin B12','Iron Studies','Dengue NS1','Malaria Antigen','Widal Test',
];

const TIME_SLOTS = ['6am-8am','8am-10am','10am-12pm','12pm-2pm','2pm-4pm','4pm-6pm'];

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
  collection_charges: '0',
});

export default function B2BPortal() {
  const qc = useQueryClient();
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewRequest>(emptyRequest());
  const [testSearch, setTestSearch] = useState('');
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [newPartner, setNewPartner] = useState({ name: '', type: 'aggregator', partner_code: '', contact_name: '', contact_phone: '', contact_email: '' });

  // DATA SOURCE: b2b_partners table
  const { data: partners = [] } = useQuery({
    queryKey: ['b2b-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('b2b_partners')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  const selectedPartner = partners.find((p: any) => p.id === selectedPartnerId);

  // DATA SOURCE: home_collection_requests filtered by b2b_partner_id
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['b2b-requests', selectedPartnerId, filterStatus, filterDate],
    queryFn: async () => {
      if (!selectedPartnerId) return [];
      let q = supabase
        .from('home_collection_requests')
        .select('*')
        .eq('b2b_partner_id', selectedPartnerId)
        .order('created_at', { ascending: false });
      if (filterStatus !== 'all') q = q.eq('status', filterStatus);
      if (filterDate) q = q.eq('preferred_date', filterDate);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedPartnerId,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const createPartner = useMutation({
    mutationFn: async () => {
      if (!newPartner.name || !newPartner.partner_code) throw new Error('Name and partner code required');
      const { error } = await supabase.from('b2b_partners').insert(newPartner);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Partner added');
      setShowPartnerForm(false);
      setNewPartner({ name: '', type: 'aggregator', partner_code: '', contact_name: '', contact_phone: '', contact_email: '' });
      qc.invalidateQueries({ queryKey: ['b2b-partners'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createRequest = useMutation({
    mutationFn: async () => {
      if (!form.patient_name || !form.mobile || !form.address) throw new Error('Name, mobile, address required');
      if (!form.tests_requested.length) throw new Error('Select at least one test');
      if (!selectedPartnerId) throw new Error('Select a partner first');
      const { error } = await supabase.from('home_collection_requests').insert({
        ...form,
        collection_charges: parseFloat(form.collection_charges) || 0,
        b2b_partner_id: selectedPartnerId,
        b2b_partner_code: selectedPartner?.partner_code,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Request submitted');
      setForm(emptyRequest());
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['b2b-requests'] });
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

  const totalCharges = requests.reduce((sum: number, r: any) => sum + (r.collection_charges || 0), 0);
  const collected = requests.filter((r: any) => ['sample_collected', 'delivered'].includes(r.status)).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" /> B2B Partner Portal
          </h1>
          <p className="text-sm text-muted-foreground">Aggregators, TPAs & franchise partners</p>
        </div>
        <Button variant="outline" onClick={() => setShowPartnerForm(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Partner
        </Button>
      </div>

      {/* Add Partner Form */}
      {showPartnerForm && (
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">New Partner</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowPartnerForm(false)}><X className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Partner Name *</label>
                <Input value={newPartner.name} onChange={e => setNewPartner(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Partner Code * (unique ID)</label>
                <Input value={newPartner.partner_code} onChange={e => setNewPartner(p => ({ ...p, partner_code: e.target.value.toUpperCase() }))} placeholder="e.g. TATA1MG" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                <Select value={newPartner.type} onValueChange={v => setNewPartner(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['aggregator', 'tpa', 'corporate', 'franchise'].map(t => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Contact Name</label>
                <Input value={newPartner.contact_name} onChange={e => setNewPartner(p => ({ ...p, contact_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
                <Input value={newPartner.contact_phone} onChange={e => setNewPartner(p => ({ ...p, contact_phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                <Input type="email" value={newPartner.contact_email} onChange={e => setNewPartner(p => ({ ...p, contact_email: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowPartnerForm(false)}>Cancel</Button>
              <Button onClick={() => createPartner.mutate()} disabled={createPartner.isPending}>
                {createPartner.isPending ? 'Saving…' : 'Add Partner'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partner selector + filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select partner…" />
          </SelectTrigger>
          <SelectContent>
            {partners.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                <span className="font-mono text-xs text-blue-600 mr-2">{p.partner_code}</span>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedPartnerId && (
          <>
            <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-40" placeholder="All dates" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Request
            </Button>
          </>
        )}
      </div>

      {/* Partner summary card */}
      {selectedPartner && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Partner</div>
            <div className="font-semibold">{selectedPartner.name}</div>
            <div className="text-xs text-blue-600 font-mono">{selectedPartner.partner_code}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Type</div>
            <div className="font-semibold capitalize">{selectedPartner.type}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Requests Shown</div>
            <div className="text-2xl font-bold text-blue-600">{requests.length}</div>
            <div className="text-xs text-muted-foreground">{collected} collected</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Total Charges</div>
            <div className="text-xl font-bold">₹{totalCharges.toLocaleString('en-IN')}</div>
          </Card>
        </div>
      )}

      {/* New Request Form */}
      {showForm && (
        <Card className="border-blue-200 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">New Request — {selectedPartner?.name}</CardTitle>
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
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Tests * ({form.tests_requested.length} selected)
              </label>
              <Input placeholder="Search tests…" value={testSearch} onChange={e => setTestSearch(e.target.value)} className="mb-2" />
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
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
                {createRequest.isPending ? 'Submitting…' : 'Submit Request'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request list */}
      {!selectedPartnerId ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Select a partner to view their requests.</p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No requests found for this partner.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((r: any) => (
            <Card key={r.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{r.patient_name}</span>
                      <span className="text-xs font-mono text-muted-foreground">{r.request_number}</span>
                      <Badge className={`text-xs ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</Badge>
                      {r.preferred_time_slot && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />{r.preferred_time_slot}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.mobile}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {r.locality ? `${r.locality}, ` : ''}{r.address?.slice(0, 40)}{r.address?.length > 40 ? '…' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(r.tests_requested || []).map((t: string) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(r.preferred_date), 'dd MMM yyyy')}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {r.collection_charges > 0 && (
                      <span className="text-sm font-semibold flex items-center gap-0.5">
                        <IndianRupee className="w-3.5 h-3.5" />{r.collection_charges}
                      </span>
                    )}
                    {['sample_collected', 'delivered'].includes(r.status) && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <FileText className="w-3 h-3 mr-1" /> Report Ready
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
