import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { MapPin, Phone, Clock, CheckCircle, Navigation, Package, Barcode, RefreshCw, User } from 'lucide-react';
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

export default function PhlebotomistDashboard() {
  const qc = useQueryClient();
  const [selectedName, setSelectedName] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [barcodeInputs, setBarcodeInputs] = useState<Record<string, string>>({});

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
