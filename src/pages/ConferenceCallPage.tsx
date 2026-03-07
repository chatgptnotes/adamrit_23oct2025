// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, MessageSquare, Clock, User, PhoneCall } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const OUR_DOCTOR_PHONE = '+916260800477';
const OUR_DOCTOR_NAME = 'Our Doctor';

export default function ConferenceCallPage() {
  const [masterDoctors, setMasterDoctors] = useState<any[]>([]);
  const [selectedRefId, setSelectedRefId] = useState('');
  const [refDoctor, setRefDoctor] = useState<{ name: string; mobile: string; specialization?: string } | null>(null);
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [patientName, setPatientName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    (supabase as any)
      .from('master_data')
      .select('id, full_name, mobile, specialization')
      .in('person_type', ['referring_doctor', 'both'])
      .eq('is_active', true)
      .order('full_name')
      .then(({ data }: any) => setMasterDoctors(data || []));
  }, []);

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
          patientName,
          referringDoctorName: refDoctor.name,
          referringDoctorPhone: refDoctor.mobile,
          ourDoctorName: OUR_DOCTOR_NAME,
          ourDoctorPhone: OUR_DOCTOR_PHONE,
          delayMinutes,
        }),
      });
      const data = await res.json();
      setResult(data.success
        ? { success: true, message: data.message, whatsappNotified: data.whatsappNotified }
        : { error: data.error || 'Failed to initiate call' }
      );
    } catch (err: any) {
      setResult({ error: err.message || 'Network error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
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
                  <SelectItem value="none" disabled>No doctors found in master data</SelectItem>
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

          {/* Schedule Delay */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Schedule
            </Label>
            <Select value={String(delayMinutes)} onValueChange={v => setDelayMinutes(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
            <span>
              WhatsApp notification will be sent to {OUR_DOCTOR_PHONE}
              {delayMinutes > 0 ? ` now (call in ${delayMinutes} min)` : ' before connecting'}.
            </span>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-lg p-4 text-sm ${result.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {result.success ? (
                <>
                  <p className="font-bold text-base">Call Initiated</p>
                  <p className="mt-1">{result.message}</p>
                  <p className="text-xs mt-2 text-green-600">WhatsApp: {result.whatsappNotified ? 'Sent' : 'Not sent'}</p>
                </>
              ) : (
                <p>{result.error}</p>
              )}
            </div>
          )}

          {/* Call Button */}
          <Button
            onClick={handleCall}
            disabled={isLoading || !refDoctor?.mobile}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">Connecting...</span>
            ) : (
              <span className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                {delayMinutes > 0 ? `Notify & Call in ${delayMinutes} min` : 'Notify & Call Now'}
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
