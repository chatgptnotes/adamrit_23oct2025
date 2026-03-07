// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, MessageSquare, Clock, User, PhoneCall, CheckCircle, XCircle, PhoneMissed, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const OUR_DOCTOR_PHONE = '+916260800477';
const OUR_DOCTOR_NAME = 'Our Doctor';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  initiated:  { label: 'Initiated',    color: 'text-blue-600 bg-blue-50',   icon: Phone },
  answered:   { label: 'Answered',     color: 'text-green-600 bg-green-50', icon: CheckCircle },
  not_answered:{ label: 'Not Answered',color: 'text-red-600 bg-red-50',     icon: PhoneMissed },
  failed:     { label: 'Failed',       color: 'text-gray-600 bg-gray-50',   icon: XCircle },
};

export default function ConferenceCallPage() {
  const { user } = useAuth();
  const [masterDoctors, setMasterDoctors] = useState<any[]>([]);
  const [selectedRefId, setSelectedRefId] = useState('');
  const [refDoctor, setRefDoctor] = useState<{ name: string; mobile: string; specialization?: string } | null>(null);
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    (supabase as any)
      .from('master_data')
      .select('id, full_name, mobile, specialization')
      .in('person_type', ['referring_doctor', 'both'])
      .eq('is_active', true)
      .order('full_name')
      .then(({ data }: any) => setMasterDoctors(data || []));
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLogsLoading(true);
    const { data } = await (supabase as any)
      .from('conference_call_logs')
      .select('*')
      .order('called_at', { ascending: false })
      .limit(50);
    setCallLogs(data || []);
    setLogsLoading(false);
  };

  const handleRefSelect = (id: string) => {
    setSelectedRefId(id);
    const doc = masterDoctors.find((d: any) => d.id === id);
    if (doc) setRefDoctor({ name: doc.full_name, mobile: doc.mobile || '', specialization: doc.specialization });
  };

  const handleCall = async () => {
    if (!refDoctor?.mobile) return;
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/twilio-conference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referringDoctorName: refDoctor.name,
          referringDoctorPhone: refDoctor.mobile,
          ourDoctorName: OUR_DOCTOR_NAME,
          ourDoctorPhone: OUR_DOCTOR_PHONE,
          delayMinutes,
        }),
      });
      const data = await res.json();

      // Save log to DB
      await (supabase as any).from('conference_call_logs').insert({
        referring_doctor_name: refDoctor.name,
        referring_doctor_phone: refDoctor.mobile,
        our_doctor_name: OUR_DOCTOR_NAME,
        our_doctor_phone: OUR_DOCTOR_PHONE,
        delay_minutes: delayMinutes,
        status: data.success ? 'initiated' : 'failed',
        initiated_by: user?.email || user?.username || 'unknown',
        whatsapp_notified: data.whatsappNotified || false,
        twilio_call_sid: data.callSid || null,
        notes: data.success ? data.message : (data.error || 'Failed'),
      });

      setResult(data.success
        ? { success: true, message: data.message, whatsappNotified: data.whatsappNotified }
        : { error: data.error || 'Failed to initiate call' }
      );
      fetchLogs();
    } catch (err: any) {
      await (supabase as any).from('conference_call_logs').insert({
        referring_doctor_name: refDoctor.name,
        referring_doctor_phone: refDoctor.mobile,
        our_doctor_name: OUR_DOCTOR_NAME,
        our_doctor_phone: OUR_DOCTOR_PHONE,
        delay_minutes: delayMinutes,
        status: 'failed',
        initiated_by: user?.email || 'unknown',
        notes: err.message || 'Network error',
      });
      setResult({ error: err.message || 'Network error' });
      fetchLogs();
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    await (supabase as any).from('conference_call_logs').update({ status }).eq('id', id);
    fetchLogs();
    setUpdatingId(null);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Call Form */}
        <Card className="shadow-lg h-fit">
          <CardHeader className="bg-blue-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-xl">
              <PhoneCall className="w-6 h-6" />
              Conference Call
            </CardTitle>
            <p className="text-blue-100 text-sm mt-1">Connect referring doctor with our doctor</p>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            {/* Our Doctor - fixed */}
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-500 font-semibold mb-2">OUR DOCTOR (Fixed)</p>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-gray-700">{OUR_DOCTOR_NAME}</span>
                <span className="text-green-600 font-mono text-sm ml-auto">{OUR_DOCTOR_PHONE}</span>
              </div>
            </div>

            {/* Referring Doctor */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Referring Doctor
              </Label>
              <Select value={selectedRefId} onValueChange={handleRefSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select referring doctor" />
                </SelectTrigger>
                <SelectContent>
                  {masterDoctors.length === 0 && (
                    <SelectItem value="none" disabled>No doctors found</SelectItem>
                  )}
                  {masterDoctors.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.full_name}{d.specialization ? ` — ${d.specialization}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {refDoctor && (
                <div className="text-xs bg-gray-50 rounded-lg p-2 text-gray-600 border border-gray-100">
                  <span className="font-semibold">{refDoctor.name}</span>
                  {refDoctor.specialization && <span className="text-gray-400"> | {refDoctor.specialization}</span>}
                  <br />
                  Phone: <span className={refDoctor.mobile ? 'text-green-600 font-semibold' : 'text-red-500'}>
                    {refDoctor.mobile || 'No number — add in master data'}
                  </span>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="space-y-1">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Schedule
              </Label>
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

            {/* WhatsApp notice */}
            <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 rounded-lg p-3">
              <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>WhatsApp notification will be sent to {OUR_DOCTOR_PHONE}{delayMinutes > 0 ? ` now (call in ${delayMinutes} min)` : ' before connecting'}.</span>
            </div>

            {/* Result */}
            {result && (
              <div className={`rounded-lg p-4 text-sm ${result.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {result.success ? (
                  <><p className="font-bold">Call Initiated</p><p className="mt-1">{result.message}</p></>
                ) : <p>{result.error}</p>}
              </div>
            )}

            <Button
              onClick={handleCall}
              disabled={isLoading || !refDoctor?.mobile}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold"
            >
              <Phone className="w-5 h-5 mr-2" />
              {isLoading ? 'Connecting...' : delayMinutes > 0 ? `Notify & Call in ${delayMinutes} min` : 'Notify & Call Now'}
            </Button>
          </CardContent>
        </Card>

        {/* Call Logs */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-gray-800">Call History</CardTitle>
              <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {logsLoading ? (
              <p className="text-center text-gray-400 py-8 text-sm">Loading...</p>
            ) : callLogs.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No calls yet</p>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
                {callLogs.map((log: any) => {
                  const sc = STATUS_CONFIG[log.status] || STATUS_CONFIG.initiated;
                  const Icon = sc.icon;
                  return (
                    <div key={log.id} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate">{log.referring_doctor_name}</p>
                          <p className="text-xs text-gray-500 font-mono">{log.referring_doctor_phone}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatTime(log.called_at)}{log.delay_minutes > 0 ? ` · ${log.delay_minutes}min delay` : ''}</p>
                          {log.initiated_by && <p className="text-xs text-gray-400">By: {log.initiated_by}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${sc.color}`}>
                            <Icon className="w-3 h-3" />{sc.label}
                          </span>
                          {/* Update status buttons */}
                          {log.status === 'initiated' && (
                            <div className="flex gap-1 mt-1">
                              <button
                                onClick={() => updateStatus(log.id, 'answered')}
                                disabled={updatingId === log.id}
                                className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 hover:bg-green-200"
                              >Answered</button>
                              <button
                                onClick={() => updateStatus(log.id, 'not_answered')}
                                disabled={updatingId === log.id}
                                className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 hover:bg-red-200"
                              >Not Answered</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
