import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope, TestTube, Camera, ChevronDown, ChevronUp, Search, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

// DATA SOURCE: referees → visits (today) → patients → lab_results + radiology_orders

interface VisitWithPatient {
  id: string;
  created_at: string;
  visit_type: string;
  status: string;
  patients: { id: string; name: string; age: number | null; gender: string | null; mobile: string | null } | null;
}

interface LabResult {
  id: string;
  test_name: string;
  result_value: string | null;
  unit: string | null;
  reference_range: string | null;
  is_abnormal: boolean | null;
  result_status: string | null;
  created_at: string;
}

interface RadiologyOrder {
  id: string;
  test_name: string;
  status: string;
  created_at: string;
}

function PatientRecords({ patientId, visitId }: { patientId: string; visitId: string }) {
  // DATA SOURCE: lab_results for this patient
  const { data: labResults = [], isLoading: labLoading } = useQuery({
    queryKey: ['doctor-lab', patientId],
    queryFn: async () => {
      const { data } = await supabase
        .from('lab_results')
        .select('id, test_name, result_value, unit, reference_range, is_abnormal, result_status, created_at')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data || []) as LabResult[];
    },
    staleTime: 60000,
  });

  // DATA SOURCE: radiology_orders for this visit
  const { data: radioOrders = [], isLoading: radioLoading } = useQuery({
    queryKey: ['doctor-radiology', visitId],
    queryFn: async () => {
      const { data } = await supabase
        .from('radiology_orders')
        .select('id, test_name, status, created_at')
        .eq('visit_id', visitId)
        .order('created_at', { ascending: false })
        .limit(20);
      return (data || []) as RadiologyOrder[];
    },
    staleTime: 60000,
  });

  const abnormal = labResults.filter(r => r.is_abnormal);

  return (
    <div className="grid md:grid-cols-2 gap-4 mt-3">
      {/* Lab Results */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
          <TestTube className="w-3.5 h-3.5" /> Pathology
          {labResults.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{labResults.length}</Badge>}
          {abnormal.length > 0 && <Badge className="ml-1 text-xs bg-red-100 text-red-700">{abnormal.length} abnormal</Badge>}
        </h4>
        {labLoading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : labResults.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No lab results</p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {labResults.map(r => (
              <div key={r.id} className={`flex items-center justify-between px-2 py-1 rounded text-xs ${r.is_abnormal ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                <div className="flex-1 min-w-0">
                  <span className={`font-medium truncate ${r.is_abnormal ? 'text-red-700' : ''}`}>{r.test_name}</span>
                  {r.reference_range && (
                    <span className="text-muted-foreground ml-1">({r.reference_range})</span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className={`font-semibold ${r.is_abnormal ? 'text-red-700' : 'text-green-700'}`}>
                    {r.result_value || '—'}
                  </span>
                  {r.unit && <span className="text-muted-foreground">{r.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Radiology Orders */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
          <Camera className="w-3.5 h-3.5" /> Radiology
          {radioOrders.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{radioOrders.length}</Badge>}
        </h4>
        {radioLoading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : radioOrders.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No radiology orders</p>
        ) : (
          <div className="space-y-1">
            {radioOrders.map(r => (
              <div key={r.id} className="flex items-center justify-between px-2 py-1 rounded bg-gray-50 text-xs">
                <span className="font-medium">{r.test_name}</span>
                <Badge variant="outline" className="text-xs capitalize">{r.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PatientCard({ visit }: { visit: VisitWithPatient }) {
  const [expanded, setExpanded] = useState(false);
  const patient = visit.patients;
  if (!patient) return null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold text-sm">{patient.name}</div>
              <div className="text-xs text-muted-foreground">
                {patient.age ? `${patient.age}y` : '—'} · {patient.gender || '—'} · {patient.mobile || 'No mobile'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs capitalize">{visit.visit_type || 'OPD'}</Badge>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>

        {expanded && patient.id && (
          <PatientRecords patientId={patient.id} visitId={visit.id} />
        )}
      </CardContent>
    </Card>
  );
}

export default function DoctorView() {
  const [selectedRefereeId, setSelectedRefereeId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [search, setSearch] = useState('');

  // DATA SOURCE: referees table
  const { data: referees = [] } = useQuery({
    queryKey: ['referees-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('referees')
        .select('id, name, specialty')
        .order('name');
      return (data || []).filter((r: any) => r.name && r.name.toUpperCase() !== 'DIRECT');
    },
    staleTime: 120000,
  });

  // DATA SOURCE: visits for selected doctor on selected date
  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['doctor-visits-opd', selectedRefereeId, date],
    queryFn: async () => {
      if (!selectedRefereeId) return [];
      const dayStart = `${date}T00:00:00`;
      const dayEnd = `${date}T23:59:59`;
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id, created_at, visit_type, status,
          patients (id, name, age, gender, mobile)
        `)
        .eq('referee_id', selectedRefereeId)
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as VisitWithPatient[];
    },
    enabled: !!selectedRefereeId,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const selectedReferee = referees.find((r: any) => r.id === selectedRefereeId) as any;

  const filtered = visits.filter(v =>
    !search || v.patients?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-blue-600" /> Doctor View
        </h1>
        <p className="text-sm text-muted-foreground">Patient list with integrated pathology & radiology — single screen</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={selectedRefereeId} onValueChange={setSelectedRefereeId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select doctor / referee…" />
          </SelectTrigger>
          <SelectContent>
            {referees.map((r: any) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}{r.specialty ? ` — ${r.specialty}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40" />
        </div>
        {visits.length > 0 && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search patient…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 w-48"
            />
          </div>
        )}
      </div>

      {/* Doctor info */}
      {selectedReferee && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Stethoscope className="w-4 h-4" />
          <span className="font-medium text-foreground">{selectedReferee.name}</span>
          {selectedReferee.specialty && <span>· {selectedReferee.specialty}</span>}
          <span>· {filtered.length} patient{filtered.length !== 1 ? 's' : ''} on {format(new Date(date), 'dd MMM yyyy')}</span>
        </div>
      )}

      {/* Patient list */}
      {!selectedRefereeId ? (
        <div className="text-center py-16 text-muted-foreground">
          <Stethoscope className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Select a doctor to view their patient list</p>
          <p className="text-sm mt-1">Lab results and radiology will load on click</p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No patients found for this doctor on {format(new Date(date), 'dd MMM yyyy')}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => <PatientCard key={v.id} visit={v} />)}
        </div>
      )}
    </div>
  );
}
