import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { MapPin, Phone, Clock, CheckCircle, Navigation, Package, Barcode, RefreshCw, User, ChevronDown, ChevronUp, TestTube } from 'lucide-react';
import { format } from 'date-fns';

// DATA SOURCE: home_collection_requests → filtered by phlebotomist_name + preferred_date

const STATUS_CONFIG: Record<string, { label: string; color: string; next?: string; nextLabel?: string }> = {
  assigned:         { label: 'Assigned',  color: 'bg-blue-100 text-blue-800',    next: 'en_route',         nextLabel: 'Start Route' },
  en_route:         { label: 'En Route',  color: 'bg-indigo-100 text-indigo-800', next: 'arrived',         nextLabel: 'Mark Arrived' },
  arrived:          { label: 'Arrived',   color: 'bg-purple-100 text-purple-800', next: 'sample_collected', nextLabel: 'Sample Collected' },
  sample_collected: { label: 'Collected', color: 'bg-green-100 text-green-800',   next: 'delivered',       nextLabel: 'Mark Delivered' },
  delivered:        { label: 'Delivered', color: 'bg-gray-100 text-gray-600' },
  pending:          { label: 'Pending',   color: 'bg-yellow-100 text-yellow-800' },
  cancelled:        { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

const TIME_ORDER = ['6am-8am', '8am-10am', '10am-12pm', '12pm-2pm', '2pm-4pm', '4pm-6pm'];

// Tube type definitions with display color dots
// DATA SOURCE: vial_details jsonb column on home_collection_requests
const TUBE_TYPES: { name: string; dotColor: string; label: string }[] = [
  { name: 'EDTA',     dotColor: 'bg-purple-500',  label: 'EDTA (Purple)' },
  { name: 'Fluoride', dotColor: 'bg-gray-400',    label: 'Fluoride (Gray)' },
  { name: 'Heparin',  dotColor: 'bg-green-500',   label: 'Heparin (Green)' },
  { name: 'SST',      dotColor: 'bg-yellow-500',  label: 'SST (Gold)' },
  { name: 'Urine',    dotColor: 'bg-yellow-800',  label: 'Urine (Brown)' },
];

// Shape of vial state per tube type
interface VialEntry {
  checked: boolean;
  barcode: string;
}

// Per-assignment vial map: { assignmentId: { EDTA: {checked, barcode}, ... } }
type VialDataMap = Record<string, Record<string, VialEntry>>;

// Build a blank vial record for a single assignment
function buildDefaultVials(): Record<string, VialEntry> {
  return Object.fromEntries(
    TUBE_TYPES.map(t => [t.name, { checked: false, barcode: '' }])
  );
}

// Merge existing vial_details from DB with defaults (guards missing keys)
function mergeVialDetails(existing: unknown): Record<string, VialEntry> {
  const defaults = buildDefaultVials();
  if (!existing || typeof existing !== 'object') return defaults;
  const src = existing as Record<string, unknown>;
  return Object.fromEntries(
    TUBE_TYPES.map(t => {
      const entry = src[t.name];
      if (entry && typeof entry === 'object') {
        const e = entry as Record<string, unknown>;
        return [t.name, {
          checked: typeof e.checked === 'boolean' ? e.checked : false,
          barcode: typeof e.barcode === 'string' ? e.barcode : '',
        }];
      }
      return [t.name, defaults[t.name]];
    })
  );
}

export default function PhlebotomistDashboard() {
  const qc = useQueryClient();
  const [selectedName, setSelectedName] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [barcodeInputs, setBarcodeInputs] = useState<Record<string, string>>({});

  // Vial data: keyed by assignment id → tube name → { checked, barcode }
  // DATA SOURCE: vial_details jsonb → home_collection_requests
  const [vialData, setVialData] = useState<VialDataMap>({});

  // Tracks which assignment cards have the vials panel expanded
  const [vialsOpen, setVialsOpen] = useState<Record<string, boolean>>({});

  // Fetch distinct phlebotomist names assigned today or recently
  const { data: phlebotomists = [] } = useQuery({
    queryKey: ['phlebotomist-names'],
    queryFn: async () => {
      const { data } = await supabase
        .from('home_collection_requests')
        .select('phlebotomist_name')
        .not('phlebotomist_name', 'is', null)
        .order('phlebotomist_name');
      const unique = [...new Set((data || []).map(r => r.phlebotomist_name).filter(Boolean))];
      return unique as string[];
    },
    staleTime: 60000,
  });

  // Fetch this phlebotomist's assignments for the selected date
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['phlebotomist-assignments', selectedName, date],
    queryFn: async () => {
      if (!selectedName) return [];
      const { data, error } = await supabase
        .from('home_collection_requests')
        .select('*')
        .eq('phlebotomist_name', selectedName)
        .eq('preferred_date', date)
        .not('status', 'eq', 'cancelled')
        .order('preferred_time_slot');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedName,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  // Seed vialData from DB whenever assignments load or refresh
  // Only initialises entries that don't already exist in local state (avoids overwriting in-progress edits)
  useEffect(() => {
    if (!assignments.length) return;
    setVialData(prev => {
      const next = { ...prev };
      for (const a of assignments) {
        if (!next[a.id]) {
          // Populate from persisted vial_details if present
          next[a.id] = mergeVialDetails(a.vial_details);
        }
      }
      return next;
    });
  }, [assignments]);

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
      qc.invalidateQueries({ queryKey: ['phlebotomist-assignments'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveBarcodes = useMutation({
    mutationFn: async ({ id, barcodeStr }: { id: string; barcodeStr: string }) => {
      const barcodes = barcodeStr.split(',').map(b => b.trim()).filter(Boolean);
      if (!barcodes.length) throw new Error('Enter at least one barcode');
      const { error } = await supabase
        .from('home_collection_requests')
        .update({ barcodes })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      toast.success('Barcodes saved');
      setBarcodeInputs(prev => ({ ...prev, [id]: '' }));
      qc.invalidateQueries({ queryKey: ['phlebotomist-assignments'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Save vial_details jsonb for a single assignment
  // DATA SOURCE: supabase.from('home_collection_requests').update({ vial_details }) → vialData[id]
  const saveVials = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const details = vialData[id];
      if (!details) throw new Error('No vial data found for this assignment');
      const { error } = await supabase
        .from('home_collection_requests')
        .update({ vial_details: details })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      toast.success('Vials saved');
      // Re-fetch so the card reflects the persisted state
      qc.invalidateQueries({ queryKey: ['phlebotomist-assignments'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Update a single tube's checked or barcode field in local state
  function updateVialField(
    assignmentId: string,
    tubeName: string,
    field: 'checked' | 'barcode',
    value: boolean | string
  ) {
    setVialData(prev => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] || buildDefaultVials()),
        [tubeName]: {
          ...(prev[assignmentId]?.[tubeName] || { checked: false, barcode: '' }),
          [field]: value,
        },
      },
    }));
  }

  // Toggle the vials panel open/closed for a card
  function toggleVialsOpen(id: string) {
    setVialsOpen(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // Sort by time slot order
  const sorted = [...assignments].sort((a, b) =>
    TIME_ORDER.indexOf(a.preferred_time_slot) - TIME_ORDER.indexOf(b.preferred_time_slot)
  );

  const done = sorted.filter(r => ['sample_collected', 'delivered'].includes(r.status)).length;
  const pending = sorted.filter(r => ['assigned', 'en_route', 'arrived'].includes(r.status)).length;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-600" /> Phlebotomist Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">Mobile route & sample collection tracker</p>
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        <Select value={selectedName} onValueChange={setSelectedName}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select phlebotomist…" />
          </SelectTrigger>
          <SelectContent>
            {phlebotomists.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40" />
      </div>

      {/* Summary bar */}
      {selectedName && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center p-3">
            <div className="text-2xl font-bold text-blue-600">{sorted.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </Card>
          <Card className="text-center p-3">
            <div className="text-2xl font-bold text-green-600">{done}</div>
            <div className="text-xs text-muted-foreground">Collected</div>
          </Card>
          <Card className="text-center p-3">
            <div className="text-2xl font-bold text-orange-500">{pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </Card>
        </div>
      )}

      {/* Assignments */}
      {!selectedName ? (
        <div className="text-center py-12 text-muted-foreground">
          <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Select a phlebotomist to view assignments</p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading…</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No assignments for this date.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((r, idx) => {
            const cfg = STATUS_CONFIG[r.status];
            const isDone = ['sample_collected', 'delivered'].includes(r.status);
            const isVialsOpen = !!vialsOpen[r.id];
            const thisVials = vialData[r.id] || buildDefaultVials();

            // Count how many tubes are checked (for the collapsed label)
            const checkedCount = TUBE_TYPES.filter(t => thisVials[t.name]?.checked).length;

            return (
              <Card key={r.id} className={`transition-shadow ${isDone ? 'opacity-70' : 'hover:shadow-md'}`}>
                <CardContent className="p-4 space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{idx + 1}. {r.patient_name}</span>
                        <Badge className={`text-xs ${cfg?.color}`}>{cfg?.label}</Badge>
                        {r.preferred_time_slot && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />{r.preferred_time_slot}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />{r.mobile}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{r.request_number}</span>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-1 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                    <span>{r.locality ? `${r.locality}, ` : ''}{r.address}</span>
                  </div>

                  {/* Tests */}
                  <div className="flex flex-wrap gap-1">
                    {(r.tests_requested || []).map((t: string) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>

                  {/* Existing barcodes */}
                  {r.barcodes?.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-green-700">
                      <Barcode className="w-3.5 h-3.5" />
                      {r.barcodes.join(', ')}
                    </div>
                  )}

                  {/* Barcode entry — shown after arrived */}
                  {['arrived', 'sample_collected'].includes(r.status) && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Barcode(s) comma-separated"
                        value={barcodeInputs[r.id] || ''}
                        onChange={e => setBarcodeInputs(prev => ({ ...prev, [r.id]: e.target.value }))}
                        className="h-8 text-xs"
                      />
                      <Button size="sm" variant="outline" className="h-8 text-xs shrink-0"
                        onClick={() => saveBarcodes.mutate({ id: r.id, barcodeStr: barcodeInputs[r.id] || '' })}
                        disabled={saveBarcodes.isPending}>
                        <Barcode className="w-3 h-3 mr-1" /> Save
                      </Button>
                    </div>
                  )}

                  {/* ── Vials & Barcodes collapsible section ─────────────────────── */}
                  {/* Shown for ALL assignments regardless of status */}
                  <div className="border border-dashed border-gray-200 rounded-md overflow-hidden">
                    {/* Toggle header */}
                    <button
                      type="button"
                      onClick={() => toggleVialsOpen(r.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <TestTube className="w-3.5 h-3.5 text-purple-500" />
                        Vials &amp; Barcodes
                        {checkedCount > 0 && (
                          <span className="ml-1 bg-purple-100 text-purple-700 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                            {checkedCount}/{TUBE_TYPES.length}
                          </span>
                        )}
                      </span>
                      {isVialsOpen
                        ? <ChevronUp className="w-3.5 h-3.5" />
                        : <ChevronDown className="w-3.5 h-3.5" />
                      }
                    </button>

                    {/* Expandable body */}
                    {isVialsOpen && (
                      <div className="px-3 py-2 space-y-2 bg-white">
                        {TUBE_TYPES.map(tube => {
                          const entry = thisVials[tube.name] || { checked: false, barcode: '' };
                          return (
                            <div key={tube.name} className="flex items-center gap-2">
                              {/* Checkbox */}
                              <input
                                type="checkbox"
                                id={`vial-${r.id}-${tube.name}`}
                                checked={entry.checked}
                                onChange={e => updateVialField(r.id, tube.name, 'checked', e.target.checked)}
                                className="w-4 h-4 rounded accent-purple-600 shrink-0"
                              />
                              {/* Color dot */}
                              <span className={`w-3 h-3 rounded-full shrink-0 ${tube.dotColor}`} />
                              {/* Tube label */}
                              <label
                                htmlFor={`vial-${r.id}-${tube.name}`}
                                className="text-xs w-28 shrink-0 cursor-pointer select-none"
                              >
                                {tube.label}
                              </label>
                              {/* Barcode input */}
                              <Input
                                placeholder="Barcode"
                                value={entry.barcode}
                                onChange={e => updateVialField(r.id, tube.name, 'barcode', e.target.value)}
                                className="h-7 text-xs flex-1 min-w-0"
                                disabled={!entry.checked}
                              />
                            </div>
                          );
                        })}

                        {/* Save Vials button */}
                        {/* DATA SOURCE: supabase.from('home_collection_requests').update({ vial_details }) */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-8 text-xs mt-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                          onClick={() => saveVials.mutate({ id: r.id })}
                          disabled={saveVials.isPending}
                        >
                          <TestTube className="w-3 h-3 mr-1" />
                          {saveVials.isPending ? 'Saving…' : 'Save Vials'}
                        </Button>
                      </div>
                    )}
                  </div>
                  {/* ── end Vials section ────────────────────────────────────────── */}

                  {/* Action button */}
                  {cfg?.next && (
                    <Button size="sm" className="w-full h-9"
                      onClick={() => advanceStatus.mutate({ id: r.id, nextStatus: cfg.next! })}
                      disabled={advanceStatus.isPending}>
                      <RefreshCw className="w-3.5 h-3.5 mr-2" />
                      {cfg.nextLabel || cfg.next}
                    </Button>
                  )}

                  {/* Mark delivered shortcut from sample_collected */}
                  {r.status === 'sample_collected' && (
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs"
                      onClick={() => advanceStatus.mutate({ id: r.id, nextStatus: 'delivered' })}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-600" /> Mark Delivered to Lab
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
