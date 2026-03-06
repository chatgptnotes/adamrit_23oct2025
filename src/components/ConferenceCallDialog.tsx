// @ts-nocheck
'use client';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Phone, MessageSquare, Clock, User } from 'lucide-react';

// Fixed doctor number - constant, never changes
const OUR_DOCTOR_PHONE = '+916260800477';
const OUR_DOCTOR_NAME = 'Our Doctor';

interface ConferenceCallDialogProps {
  open: boolean;
  onClose: () => void;
  visitId?: string;
  patientName?: string;
  referringDoctorName?: string;
}

export const ConferenceCallDialog: React.FC<ConferenceCallDialogProps> = ({
  open,
  onClose,
  visitId,
  patientName,
  referringDoctorName = '',
}) => {
  const [masterDoctors, setMasterDoctors] = useState<any[]>([]);
  const [selectedRefId, setSelectedRefId] = useState('');
  const [refDoctor, setRefDoctor] = useState<{ name: string; mobile: string; specialization?: string } | null>(null);
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Fetch referring doctors from master_data
  useEffect(() => {
    if (!open) return;
    const fetchDoctors = async () => {
      const { data } = await supabase
        .from('master_data')
        .select('id, full_name, mobile, specialization')
        .in('person_type', ['referring_doctor', 'both'])
        .eq('is_active', true)
        .order('full_name');
      setMasterDoctors(data || []);

      // Auto-match from visit's referring doctor name
      if (referringDoctorName && data?.length) {
        const match = data.find(d =>
          d.full_name.toLowerCase().includes(referringDoctorName.toLowerCase()) ||
          referringDoctorName.toLowerCase().includes(d.full_name.toLowerCase())
        );
        if (match) {
          setSelectedRefId(match.id);
          setRefDoctor({ name: match.full_name, mobile: match.mobile || '', specialization: match.specialization });
        }
      }
    };
    fetchDoctors();
  }, [open, referringDoctorName]);

  const handleRefSelect = (id: string) => {
    setSelectedRefId(id);
    const doc = masterDoctors.find(d => d.id === id);
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
          visitId,
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

  const handleClose = () => {
    setResult(null);
    setSelectedRefId('');
    setRefDoctor(null);
    setDelayMinutes(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <Phone className="w-5 h-5" />
            Conference Call
          </DialogTitle>
        </DialogHeader>

        {patientName && (
          <div className="bg-blue-50 rounded-lg p-2 text-sm text-blue-700 font-medium">
            Patient: {patientName}
          </div>
        )}

        <div className="space-y-4">
          {/* Our Doctor - fixed, just display */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-xs text-gray-500 mb-1 font-medium">Our Doctor (Fixed)</p>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-gray-700">{OUR_DOCTOR_NAME}</span>
              <span className="text-green-600 font-mono">{OUR_DOCTOR_PHONE}</span>
            </div>
          </div>

          {/* Referring Doctor - from master_data */}
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
                  <SelectItem value="none" disabled>No doctors in master_data yet</SelectItem>
                )}
                {masterDoctors.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.full_name}{d.specialization ? ` — ${d.specialization}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {refDoctor && (
              <div className="text-xs bg-gray-50 rounded p-2 text-gray-600">
                <span className="font-medium">{refDoctor.name}</span>
                {refDoctor.specialization && <span> | {refDoctor.specialization}</span>}
                <br />
                Phone: <span className={refDoctor.mobile ? 'text-green-600 font-medium' : 'text-red-500'}>
                  {refDoctor.mobile || 'No number in master_data'}
                </span>
              </div>
            )}
            {!refDoctor?.mobile && refDoctor && (
              <p className="text-xs text-red-500">Add mobile number to master_data for this doctor before calling.</p>
            )}
          </div>

          {/* Delay */}
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
          <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 rounded p-2">
            <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              WhatsApp notification will be sent to {OUR_DOCTOR_PHONE}
              {delayMinutes > 0 ? ` now (call in ${delayMinutes} min)` : ' before connecting'}.
            </span>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-lg p-3 text-sm ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {result.success ? (
                <>
                  <p className="font-semibold">Call Initiated</p>
                  <p>{result.message}</p>
                  <p className="text-xs mt-1">WhatsApp: {result.whatsappNotified ? 'Sent' : 'Not sent'}</p>
                </>
              ) : (
                <p>{result.error}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleCall}
            disabled={isLoading || !refDoctor?.mobile}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Connecting...' : (
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {delayMinutes > 0 ? `Notify & Call in ${delayMinutes} min` : 'Notify & Call Now'}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
