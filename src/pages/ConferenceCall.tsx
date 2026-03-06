// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, MessageSquare, Clock, User, PhoneCall, History, RefreshCw } from 'lucide-react';

const db = supabase as any;

export default function ConferenceCallPage() {
  const { hospitalConfig } = useAuth();
  const [masterDoctors, setMasterDoctors] = useState([]);
  const [selectedRefId, setSelectedRefId] = useState('');
  const [refDoctor, setRefDoctor] = useState(null);
  const [ourDoctors, setOurDoctors] = useState([]);
  const [selectedOurId, setSelectedOurId] = useState('');
  const [ourDoctor, setOurDoctor] = useState(null);
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [patientName, setPatientName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    db.from('master_data').select('id, full_name, mobile, specialization')
      .in('person_type', ['referring_doctor', 'both']).eq('is_active', true).order('full_name')
      .then(({ data }) => setMasterDoctors(data || []));
  }, []);

  useEffect(() => {
    const t = hospitalConfig?.name?.toLowerCase?.() === 'ayushman' ? 'ayushman_consultants' : 'hope_consultants';
    db.from(t).select('id, name, specialty, phone').order('name').then(({ data }) => setOurDoctors(data || []));
  }, [hospitalConfig?.name]);

  const fetchLogs = async () => {
    setLogsLoading(true);
    const { data } = await db.from('call_logs').select('*').order('created_at', { ascending: false }).limit(20);
    setCallLogs(data || []); setLogsLoading(false);
  };
  useEffect(() => { fetchLogs(); }, []);

  const handleRefSelect = (id) => { setSelectedRefId(id); const d = masterDoctors.find(x => x.id === id); if (d) setRefDoctor(d); };
  const handleOurSelect = (id) => { setSelectedOurId(id); const d = ourDoctors.find(x => x.id === id); if (d) setOurDoctor(d); };
  const canCall = refDoctor?.mobile && ourDoctor?.phone;

  const handleCall = async () => {
    if (!canCall) return;
    setIsLoading(true); setResult(null);
    try {
      const res = await fetch('/api/twilio/conference', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName, referringDoctorName: refDoctor.full_name, referringDoctorPhone: refDoctor.mobile, ourDoctorName: ourDoctor.name, ourDoctorPhone: ourDoctor.phone, delayMinutes }),
      });
      const data = await res.json();
      if (data.success) { setResult({ success: true, message: data.message, whatsappNotified: data.whatsappNotified }); fetchLogs(); }
      else setResult({ error: data.error || 'Failed to initiate call' });
    } catch (err) { setResult({ error: err.message || 'Network error' }); }
    finally { setIsLoading(false); }
  };

  const fmt = (iso) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg"><PhoneCall className="w-6 h-6 text-blue-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conference Call</h1>
          <p className="text-sm text-gray-500">Connect our doctor with a referring doctor on a 3-way call</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Setup Call</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Patient Name (optional)</label>
              <Input placeholder="Enter patient name" value={patientName} onChange={e => setPatientName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><User className="w-4 h-4" /> Referring Doctor</label>
              <Select value={selectedRefId} onValueChange={handleRefSelect}>
                <SelectTrigger><SelectValue placeholder="Select referring doctor" /></SelectTrigger>
                <SelectContent>{masterDoctors.map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}{d.specialization ? ` — ${d.specialization}` : ''}</SelectItem>)}</SelectContent>
              </Select>
              {refDoctor && <div className="text-xs bg-gray-50 rounded p-2 border"><span className="font-medium">{refDoctor.full_name}</span><br />Phone: <span className={refDoctor.mobile ? 'text-green-600 font-medium' : 'text-red-500'}>{refDoctor.mobile || 'No number — update in Master Data'}</span></div>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><User className="w-4 h-4" /> Our Doctor</label>
              <Select value={selectedOurId} onValueChange={handleOurSelect}>
                <SelectTrigger><SelectValue placeholder="Select our doctor" /></SelectTrigger>
                <SelectContent>{ourDoctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}{d.specialty ? ` — ${d.specialty}` : ''}</SelectItem>)}</SelectContent>
              </Select>
              {ourDoctor && <div className="text-xs bg-gray-50 rounded p-2 border"><span className="font-medium">{ourDoctor.name}</span><br />Phone: <span className={ourDoctor.phone ? 'text-green-600 font-medium' : 'text-red-500'}>{ourDoctor.phone || 'No phone saved'}</span></div>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Schedule</label>
              <Select value={String(delayMinutes)} onValueChange={v => setDelayMinutes(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Call Now</SelectItem>
                  <SelectItem value="5">In 5 minutes</SelectItem>
                  <SelectItem value="10">In 10 minutes</SelectItem>
                  <SelectItem value="15">In 15 minutes</SelectItem>
                  <SelectItem value="30">In 30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {ourDoctor && <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 rounded p-2 border border-green-100"><MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>WhatsApp notification will be sent to Dr. {ourDoctor.name}{delayMinutes > 0 ? ` (call in ${delayMinutes} min)` : ' before connecting'}.</span></div>}
            {refDoctor && !refDoctor.mobile && <div className="text-xs text-red-600 bg-red-50 rounded p-2 border border-red-100">Referring doctor has no phone. Update in Master Data first.</div>}
            {result && <div className={`rounded p-3 text-sm border ${result.success ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{result.success ? <><p className="font-semibold">Call Initiated</p><p>{result.message}</p></> : <p>{result.error}</p>}</div>}
            <Button onClick={handleCall} disabled={isLoading || !canCall} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11">
              {isLoading ? <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Connecting...</span> : <span className="flex items-center gap-2"><Phone className="w-4 h-4" />{delayMinutes > 0 ? `Notify & Call in ${delayMinutes} min` : 'Notify & Call Now'}</span>}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center justify-between"><span className="flex items-center gap-2"><History className="w-5 h-5 text-gray-500" /> Recent Calls</span><button onClick={fetchLogs} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Refresh</button></CardTitle></CardHeader>
          <CardContent>
            {logsLoading ? <div className="text-sm text-gray-400 text-center py-8">Loading...</div> : callLogs.length === 0 ? <div className="text-sm text-gray-400 text-center py-8">No calls made yet</div> : (
              <div className="space-y-3 overflow-y-auto max-h-[460px]">
                {callLogs.map(log => (
                  <div key={log.id} className="border rounded p-3 text-sm space-y-1 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{log.patient_name || 'Unknown Patient'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.status === 'completed' ? 'bg-green-100 text-green-700' : log.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{log.status || 'initiated'}</span>
                    </div>
                    <div className="text-gray-500 text-xs">Ref: {log.referring_doctor_name || '-'} | Our: {log.our_doctor_name || '-'}</div>
                    <div className="text-gray-400 text-xs">{log.created_at ? fmt(log.created_at) : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
