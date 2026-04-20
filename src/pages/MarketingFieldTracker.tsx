// DATA SOURCE: doctor_visits → marketing_user_id + visit_date = today

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Star, MapPin, Clock, CheckCircle, Plus, User } from 'lucide-react';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MarketingUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  is_active: boolean;
}

interface DoctorVisit {
  id: string;
  marketing_user_id: string;
  doctor_name: string;
  specialty: string | null;
  hospital_clinic_name: string | null;
  contact_number: string | null;
  address: string | null;
  visit_date: string;
  visit_time: string | null;
  visit_notes: string | null;
  outcome: string | null;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  latitude: number | null;
  longitude: number | null;
  check_in_at: string | null;
  check_out_at: string | null;
  feedback_rating: number | null;
  samples_referred: number | null;
  visit_photo_url: string | null;
  visit_type: string | null;
  created_at: string;
}

interface VisitFormState {
  doctor_name: string;
  specialty: string;
  hospital_clinic_name: string;
  contact_number: string;
  address: string;
  visit_type: string;
  outcome: string;
  feedback_rating: number;
  samples_referred: number;
  visit_notes: string;
  latitude: number | null;
  longitude: number | null;
  gps_captured: boolean;
  check_in_at: Date;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VISIT_TYPES = [
  { value: 'field', label: 'Field Visit' },
  { value: 'camp', label: 'Camp' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'follow_up', label: 'Follow-Up' },
];

const OUTCOMES = [
  { value: 'Positive', label: 'Positive' },
  { value: 'Neutral', label: 'Neutral' },
  { value: 'Negative', label: 'Negative' },
  { value: 'Follow-up Required', label: 'Follow-up Required' },
  { value: 'Not Available', label: 'Not Available' },
];

// Returns Tailwind color classes for each outcome badge
function outcomeColor(outcome: string | null): string {
  switch (outcome) {
    case 'Positive': return 'bg-green-100 text-green-800 border-green-200';
    case 'Negative': return 'bg-red-100 text-red-800 border-red-200';
    case 'Neutral': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Follow-up Required': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Not Available': return 'bg-gray-100 text-gray-600 border-gray-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

// Returns human-readable label for visit type
function visitTypeLabel(vt: string | null): string {
  return VISIT_TYPES.find(t => t.value === vt)?.label ?? (vt ?? '—');
}

// Returns today's date as YYYY-MM-DD string
function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Star rating row — clicking a star sets rating to that value */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="focus:outline-none"
          aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            size={24}
            className={n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  );
}

/** Read-only star display used in visit cards */
function StarDisplay({ value }: { value: number | null }) {
  const v = value ?? 0;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={14}
          className={n <= v ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
        />
      ))}
    </div>
  );
}

/** Single visit card shown in the today's visits list */
function VisitCard({ visit }: { visit: DoctorVisit }) {
  const checkInTime = visit.check_in_at
    ? format(new Date(visit.check_in_at), 'hh:mm a')
    : '—';

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardContent className="p-4 space-y-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-gray-900 leading-tight">{visit.doctor_name}</p>
            {visit.specialty && (
              <p className="text-xs text-gray-500">{visit.specialty}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {visit.visit_type && (
              <Badge variant="outline" className="text-xs px-2 py-0">
                {visitTypeLabel(visit.visit_type)}
              </Badge>
            )}
            {visit.outcome && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${outcomeColor(visit.outcome)}`}>
                {visit.outcome}
              </span>
            )}
          </div>
        </div>

        {/* Hospital */}
        {visit.hospital_clinic_name && (
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <MapPin size={12} className="text-gray-400 shrink-0" />
            {visit.hospital_clinic_name}
          </p>
        )}

        {/* Check-in time & stars row */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={12} />
            Checked in at {checkInTime}
          </p>
          <StarDisplay value={visit.feedback_rating} />
        </div>

        {/* Samples referred */}
        {(visit.samples_referred ?? 0) > 0 && (
          <p className="text-xs text-indigo-600 font-medium">
            Samples referred: {visit.samples_referred}
          </p>
        )}

        {/* Notes excerpt */}
        {visit.visit_notes && (
          <p className="text-xs text-gray-500 line-clamp-2 bg-gray-50 rounded p-2">
            {visit.visit_notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const db = supabase as unknown as {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: unknown) => {
        order: (col: string, opts?: Record<string, unknown>) => Promise<{ data: unknown[]; error: unknown }>;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    insert: (row: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
    [key: string]: unknown;
  };
};

/** Creates a fresh empty form state with check_in_at = now */
function freshForm(): VisitFormState {
  return {
    doctor_name: '',
    specialty: '',
    hospital_clinic_name: '',
    contact_number: '',
    address: '',
    visit_type: 'field',
    outcome: 'Neutral',
    feedback_rating: 0,
    samples_referred: 0,
    visit_notes: '',
    latitude: null,
    longitude: null,
    gps_captured: false,
    check_in_at: new Date(),
  };
}

export default function MarketingFieldTracker() {
  // Selected marketing exec — stored in local state only
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [form, setForm] = useState<VisitFormState>(freshForm);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);

  const queryClient = useQueryClient();
  const today = todayIso();

  // ── Fetch all active marketing users ────────────────────────────────────────
  // DATA SOURCE: GET marketing_users → is_active = true → name, id
  const { data: marketingUsers = [], isLoading: usersLoading } = useQuery<MarketingUser[]>({
    queryKey: ['marketing_users'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown as typeof db)
        .from('marketing_users')
        .select('id, name, email, phone, designation, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (error) throw new Error(String(error));
      return (data ?? []) as MarketingUser[];
    },
    staleTime: 60000,
  });

  // ── Fetch today's visits for the selected exec ───────────────────────────────
  // DATA SOURCE: doctor_visits → marketing_user_id + visit_date = today
  const { data: todaysVisits = [], isLoading: visitsLoading } = useQuery<DoctorVisit[]>({
    queryKey: ['doctor_visits_today', selectedUserId, today],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const { data, error } = await (supabase as unknown as typeof db)
        .from('doctor_visits')
        .select('*')
        .eq('marketing_user_id', selectedUserId)
        .eq('visit_date', today)
        .order('check_in_at', { ascending: false });
      if (error) throw new Error(String(error));
      return (data ?? []) as DoctorVisit[];
    },
    enabled: !!selectedUserId,
    staleTime: 60000,
  });

  // ── Insert a new visit ───────────────────────────────────────────────────────
  const { mutate: logVisit, isPending: isSubmitting } = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { error } = await (supabase as unknown as typeof db)
        .from('doctor_visits')
        .insert(payload);
      if (error) throw new Error(String(error));
    },
    onSuccess: () => {
      toast.success('Visit logged successfully');
      setForm(freshForm());
      queryClient.invalidateQueries({ queryKey: ['doctor_visits_today', selectedUserId, today] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to log visit: ${err.message}`);
    },
  });

  // Reset check-in time whenever the form is reopened / exec changes
  useEffect(() => {
    setForm(prev => ({ ...prev, check_in_at: new Date() }));
  }, [selectedUserId]);

  // ── GPS capture ──────────────────────────────────────────────────────────────
  function captureGps() {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          gps_captured: true,
        }));
        setGpsLoading(false);
        toast.success('GPS location captured');
      },
      err => {
        toast.error(`GPS error: ${err.message}`);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ── Form submit ──────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error('Please select a marketing executive first');
      return;
    }
    if (!form.doctor_name.trim()) {
      toast.error('Doctor name is required');
      return;
    }

    const payload: Record<string, unknown> = {
      marketing_user_id: selectedUserId,
      doctor_name: form.doctor_name.trim(),
      specialty: form.specialty.trim() || null,
      hospital_clinic_name: form.hospital_clinic_name.trim() || null,
      contact_number: form.contact_number.trim() || null,
      address: form.address.trim() || null,
      visit_date: today,
      visit_time: format(form.check_in_at, 'HH:mm:ss'),
      visit_type: form.visit_type || null,
      outcome: form.outcome || null,
      feedback_rating: form.feedback_rating > 0 ? form.feedback_rating : null,
      samples_referred: form.samples_referred,
      visit_notes: form.visit_notes.trim() || null,
      latitude: form.latitude,
      longitude: form.longitude,
      check_in_at: form.check_in_at.toISOString(),
    };

    logVisit(payload);
  }

  // ── Field updater helpers ────────────────────────────────────────────────────
  function setField<K extends keyof VisitFormState>(key: K, value: VisitFormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  // ── Derived values ───────────────────────────────────────────────────────────
  const selectedUser = marketingUsers.find(u => u.id === selectedUserId);
  const visitCount = todaysVisits.length;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MapPin size={20} className="text-indigo-600" />
              Field Tracker
            </h1>
            <div className="text-right">
              <p className="text-xs text-gray-500">{format(new Date(), 'EEE, d MMM yyyy')}</p>
              {selectedUserId && (
                <p className="text-xs font-semibold text-indigo-600">
                  {visitCount} visit{visitCount !== 1 ? 's' : ''} today
                </p>
              )}
            </div>
          </div>

          {/* Exec selector */}
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400 shrink-0" />
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={usersLoading}
            >
              <SelectTrigger className="flex-1 text-sm">
                <SelectValue placeholder={usersLoading ? 'Loading executives…' : 'Select marketing executive'} />
              </SelectTrigger>
              <SelectContent>
                {marketingUsers.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    <span className="font-medium">{u.name}</span>
                    {u.designation && (
                      <span className="text-gray-400 ml-1 text-xs">— {u.designation}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Guard: no exec selected */}
        {!selectedUserId && (
          <Card className="border-dashed border-2 border-indigo-200 bg-indigo-50">
            <CardContent className="py-10 text-center text-indigo-600 font-medium">
              Please select a marketing executive to continue
            </CardContent>
          </Card>
        )}

        {selectedUserId && (
          <>
            {/* ── New Visit Form ── */}
            <Card className="shadow-md border-indigo-100">
              <CardHeader
                className="pb-2 cursor-pointer select-none"
                onClick={() => setShowForm(f => !f)}
              >
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Plus size={18} className="text-indigo-600" />
                    Log New Visit
                  </span>
                  <span className="text-xs text-gray-400 font-normal">
                    {showForm ? 'collapse ▲' : 'expand ▼'}
                  </span>
                </CardTitle>
              </CardHeader>

              {showForm && (
                <CardContent>
                  {/* Check-in time indicator */}
                  <div className="flex items-center gap-1.5 text-sm text-indigo-600 mb-4 font-medium">
                    <Clock size={15} />
                    Checked in at {format(form.check_in_at, 'hh:mm a')}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Doctor Name */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">
                        Doctor Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={form.doctor_name}
                        onChange={e => setField('doctor_name', e.target.value)}
                        placeholder="Dr. Firstname Lastname"
                        required
                      />
                    </div>

                    {/* Specialty */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Specialty</label>
                      <Input
                        value={form.specialty}
                        onChange={e => setField('specialty', e.target.value)}
                        placeholder="e.g. Cardiologist, Orthopaedic…"
                      />
                    </div>

                    {/* Hospital / Clinic */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Hospital / Clinic</label>
                      <Input
                        value={form.hospital_clinic_name}
                        onChange={e => setField('hospital_clinic_name', e.target.value)}
                        placeholder="Hospital or clinic name"
                      />
                    </div>

                    {/* Contact Number */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Contact Number</label>
                      <Input
                        value={form.contact_number}
                        onChange={e => setField('contact_number', e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        type="tel"
                        inputMode="tel"
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Address</label>
                      <Textarea
                        value={form.address}
                        onChange={e => setField('address', e.target.value)}
                        placeholder="Street, area, city…"
                        rows={2}
                        className="resize-none"
                      />
                    </div>

                    {/* Visit Type + Outcome (two-column on wider screens) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Visit Type</label>
                        <Select
                          value={form.visit_type}
                          onValueChange={v => setField('visit_type', v)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VISIT_TYPES.map(vt => (
                              <SelectItem key={vt.value} value={vt.value}>
                                {vt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Outcome</label>
                        <Select
                          value={form.outcome}
                          onValueChange={v => setField('outcome', v)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OUTCOMES.map(o => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Feedback Rating */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Feedback Rating</label>
                      <StarRating
                        value={form.feedback_rating}
                        onChange={v => setField('feedback_rating', v)}
                      />
                    </div>

                    {/* Samples Referred */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Samples Referred</label>
                      <Input
                        value={form.samples_referred}
                        onChange={e => setField('samples_referred', parseInt(e.target.value) || 0)}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className="w-32"
                      />
                    </div>

                    {/* Visit Notes */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Visit Notes</label>
                      <Textarea
                        value={form.visit_notes}
                        onChange={e => setField('visit_notes', e.target.value)}
                        placeholder="What was discussed? Any commitments made?"
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    {/* GPS Button */}
                    <div>
                      {form.gps_captured ? (
                        <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                          <CheckCircle size={16} />
                          GPS Captured ✓
                          <span className="text-gray-400 text-xs font-normal">
                            ({form.latitude?.toFixed(5)}, {form.longitude?.toFixed(5)})
                          </span>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={captureGps}
                          disabled={gpsLoading}
                          className="flex items-center gap-2"
                        >
                          <MapPin size={15} />
                          {gpsLoading ? 'Getting location…' : 'Get GPS Location'}
                        </Button>
                      )}
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    >
                      {isSubmitting ? 'Logging visit…' : 'Log Visit'}
                    </Button>
                  </form>
                </CardContent>
              )}
            </Card>

            {/* ── Today's Visits List ── */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                <Clock size={14} />
                Today's Visits
                {!visitsLoading && (
                  <span className="bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 text-xs font-bold ml-auto normal-case">
                    {visitCount}
                  </span>
                )}
              </h2>

              {visitsLoading && (
                <div className="text-center py-8 text-gray-400 text-sm">Loading visits…</div>
              )}

              {!visitsLoading && todaysVisits.length === 0 && (
                <Card className="border-dashed border-2 border-gray-200 bg-white">
                  <CardContent className="py-8 text-center text-gray-400 text-sm">
                    No visits logged today yet.
                    <br />
                    Use the form above to log your first visit.
                  </CardContent>
                </Card>
              )}

              {todaysVisits.map(visit => (
                <VisitCard key={visit.id} visit={visit} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
