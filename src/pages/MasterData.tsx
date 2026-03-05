// @ts-nocheck
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Phone, Plus, Search, UserPlus, Stethoscope, Users, Edit, Trash2, CheckCircle, XCircle, PhoneCall } from 'lucide-react';

const db = supabase as any;

const CATEGORY_COLOR: Record<string, string> = {
  referring_doctor: 'bg-blue-100 text-blue-700',
  relationship_manager: 'bg-purple-100 text-purple-700',
  both: 'bg-green-100 text-green-700',
};

const EMPTY = { person_type: 'referring_doctor', full_name: '', mobile: '', alternate_mobile: '', email: '', specialization: '', hospital: '', designation: '', city: '', notes: '', is_active: true };

export default function MasterData() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [callingId, setCallingId] = useState(null);
  const [callStatus, setCallStatus] = useState({});
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: persons = [], isLoading } = useQuery({
    queryKey: ['master_data'],
    queryFn: async () => {
      const { data, error } = await db.from('master_data').select('*').order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: callLogs = [] } = useQuery({
    queryKey: ['call_logs'],
    queryFn: async () => {
      const { data } = await db.from('call_logs').select('*').order('initiated_at', { ascending: false }).limit(100);
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (d) => { const { error } = await db.from('master_data').insert([d]); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master_data'] }); setIsAddOpen(false); setForm(EMPTY); toast({ title: 'Person added' }); },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...d }) => { const { error } = await db.from('master_data').update(d).eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master_data'] }); setIsEditOpen(false); toast({ title: 'Updated' }); },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => { const { error } = await db.from('master_data').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master_data'] }),
  });

  const handleCall = async (person) => {
    const mobile = person.mobile || person.alternate_mobile;
    if (!mobile) { toast({ title: 'No mobile number', variant: 'destructive' }); return; }
    setCallingId(person.id);
    setCallStatus(p => ({ ...p, [person.id]: 'calling' }));
    try {
      const res = await fetch('/api/twilio-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: mobile, person_id: person.id, person_name: person.full_name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCallStatus(p => ({ ...p, [person.id]: 'done' }));
      toast({ title: `Calling ${person.full_name}`, description: `Dialing ${mobile}` });
      qc.invalidateQueries({ queryKey: ['call_logs'] });
    } catch (e) {
      setCallStatus(p => ({ ...p, [person.id]: 'failed' }));
      toast({ title: 'Call failed', description: e.message, variant: 'destructive' });
    } finally {
      setCallingId(null);
    }
  };

  const filtered = persons.filter(p => {
    const matchTab = tab === 'all' || p.person_type === tab;
    const q = search.toLowerCase();
    const matchSearch = !search || p.full_name?.toLowerCase().includes(q) || p.mobile?.includes(search) || p.hospital?.toLowerCase().includes(q);
    return matchTab && matchSearch && p.is_active;
  });

  const FormFields = ({ f, setF }) => (
    <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
      <div className="col-span-2">
        <label className="text-xs font-medium text-gray-600 block mb-1">Type *</label>
        <Select value={f.person_type} onValueChange={v => setF(p => ({ ...p, person_type: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="referring_doctor">Referring Doctor</SelectItem>
            <SelectItem value="relationship_manager">Relationship Manager</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {[['full_name','Full Name *','col-span-2'],['mobile','Mobile',''],['alternate_mobile','Alternate Mobile',''],['email','Email','col-span-2'],['specialization','Specialization',''],['hospital','Hospital / Clinic',''],['designation','Designation',''],['city','City',''],['notes','Notes','col-span-2']].map(([key,label,cls]) => (
        <div key={key} className={cls}>
          <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
          <Input value={f[key]||''} onChange={e => setF(p => ({...p,[key]:e.target.value}))} placeholder={label} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-blue-600"/>Master Data</h1>
          <p className="text-sm text-gray-500 mt-1">Referring Doctors and Relationship Managers — Twilio call integration</p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setIsAddOpen(true); }} className="gap-2"><UserPlus className="h-4 w-4"/>Add Person</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b">
        {[['all','All'], ['referring_doctor','Doctors'], ['relationship_manager','Rel. Managers'], ['call_logs','Call Logs']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab===key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label} {key !== 'call_logs' && <span className="ml-1 text-xs text-gray-400">({key==='all'?persons.length:persons.filter(p=>p.person_type===key).length})</span>}
          </button>
        ))}
      </div>

      {tab !== 'call_logs' && (
        <>
          <div className="relative w-80 mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/>
            <Input className="pl-9" placeholder="Search name, mobile, hospital..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading && <p className="text-gray-400 col-span-3">Loading...</p>}
            {!isLoading && filtered.length === 0 && <p className="text-gray-400 col-span-3 text-center py-12">No records found. Click Add Person to get started.</p>}
            {filtered.map(person => (
              <Card key={person.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{person.full_name}</CardTitle>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${CATEGORY_COLOR[person.person_type]||'bg-gray-100 text-gray-600'}`}>
                        {person.person_type === 'referring_doctor' ? 'Referring Doctor' : person.person_type === 'relationship_manager' ? 'Rel. Manager' : 'Both'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100" onClick={() => { setSelected(person); setForm({...person}); setIsEditOpen(true); }}>
                        <Edit className="h-3.5 w-3.5 text-gray-500"/>
                      </button>
                      <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-red-50" onClick={() => deleteMutation.mutate(person.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-400"/>
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {person.specialization && <p className="text-sm text-gray-600 flex items-center gap-1.5"><Stethoscope className="h-3.5 w-3.5 text-blue-400"/>{person.specialization}</p>}
                  {person.hospital && <p className="text-sm text-gray-500">{person.hospital}</p>}
                  {person.city && <p className="text-xs text-gray-400">{person.city}</p>}
                  {person.mobile && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-gray-700">{person.mobile}</span>
                      {callStatus[person.id] === 'done' && <CheckCircle className="h-3.5 w-3.5 text-green-500"/>}
                      {callStatus[person.id] === 'failed' && <XCircle className="h-3.5 w-3.5 text-red-500"/>}
                    </div>
                  )}
                  <Button className="w-full mt-2 gap-2" size="sm"
                    disabled={callingId === person.id || !person.mobile}
                    onClick={() => handleCall(person)}
                    variant={callStatus[person.id] === 'done' ? 'outline' : 'default'}>
                    <Phone className="h-3.5 w-3.5"/>
                    {callingId === person.id ? 'Calling...' : callStatus[person.id] === 'done' ? 'Called' : 'Call Now'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'call_logs' && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Person','Phone','Status','Type','Time (IST)'].map(h => <th key={h} className="text-left px-4 py-2 font-medium text-gray-600">{h}</th>)}</tr>
            </thead>
            <tbody>
              {callLogs.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No calls yet</td></tr>}
              {callLogs.map(log => (
                <tr key={log.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{log.person_name||'—'}</td>
                  <td className="px-4 py-2 font-mono text-gray-600">{log.phone_number}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${log.call_status==='queued'?'bg-blue-100 text-blue-700':log.call_status==='completed'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>
                      {log.call_status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500">{log.call_type}</td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{new Date(log.initiated_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Add Person</DialogTitle></DialogHeader>
          <FormFields f={form} setF={setForm}/>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate(form)} disabled={!form.full_name || addMutation.isPending}>{addMutation.isPending?'Saving...':'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Edit — {selected?.full_name}</DialogTitle></DialogHeader>
          <FormFields f={form} setF={setForm}/>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate({ id: selected?.id, ...form })} disabled={updateMutation.isPending}>{updateMutation.isPending?'Saving...':'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
