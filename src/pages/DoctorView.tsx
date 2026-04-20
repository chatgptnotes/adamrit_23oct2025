import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope, TestTube, Camera, Pill, ChevronDown, ChevronUp, Search, User, Calendar, Printer, Home } from 'lucide-react';
import { format } from 'date-fns';

// DATA SOURCE: referees → visits (selected date) → patients → lab_results + radiology_orders + medications

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

interface Medication {
  id: string;
  test_name: string | null;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  created_at: string;
}

// Sub-component: renders lab, radiology, and medications for a single patient visit
function PatientRecords({ patientId, visitId }: { patientId: string; visitId: string }) {
  const [activeTab, setActiveTab] = useState<'lab' | 'radiology' | 'medications'>('lab');

  // DATA SOURCE: lab_results → patient_id → LabResult[]
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

  // DATA SOURCE: radiology_orders → visit_id → RadiologyOrder[]
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

  // DATA SOURCE: medications → visit_id → Medication[]
  const { data: medications = [], isLoading: medLoading } = useQuery({
    queryKey: ['doctor-medications', visitId],
    queryFn: async () => {
      const { data } = await supabase
        .from('medications')
        .select('id, test_name, dosage, frequency, duration, instructions, created_at')
        .eq('visit_id', visitId)
        .order('created_at', { ascending: false })
        .limit(30);
      return (data || []) as Medication[];
    },
    staleTime: 60000,
  });

  const abnormal = labResults.filter(r => r.is_abnormal);

  const tabs: { key: 'lab' | 'radiology' | 'medications'; label: string; icon: React.ReactNode; count: number }[] = [
    {
      key: 'lab',
      label: 'Pathology',
      icon: <TestTube className="w-3.5 h-3.5" />,
      count: labResults.length,
    },
    {
      key: 'radiology',
      label: 'Radiology',
      icon: <Camera className="w-3.5 h-3.5" />,
      count: radioOrders.length,
    },
    {
      key: 'medications',
      label: 'Medications',
      icon: <Pill className="w-3.5 h-3.5" />,
      count: medications.length,
    },
  ];

  return (
    <div className="mt-3">
      {/* Tab bar */}
      <div className="flex gap-1 border-b mb-3">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-700 bg-blue-50'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <Badge variant="secondary" className="ml-0.5 text-[10px] px-1 h-4">
                {tab.count}
              </Badge>
            )}
            {tab.key === 'lab' && abnormal.length > 0 && (
              <Badge className="ml-0.5 text-[10px] px-1 h-4 bg-red-100 text-red-700 border-0">
                {abnormal.length}!
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Lab Results panel */}
      {activeTab === 'lab' && (
        <>
          {labLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : labResults.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No lab results</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {labResults.map(r => (
                <div
                  key={r.id}
                  className={`flex items-center justify-between px-2 py-1 rounded text-xs ${
                    r.is_abnormal ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span className={`font-medium truncate ${r.is_abnormal ? 'text-red-700' : ''}`}>
                      {r.test_name}
                    </span>
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
        </>
      )}

      {/* Radiology Orders panel */}
      {activeTab === 'radiology' && (
        <>
          {radioLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : radioOrders.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No radiology orders</p>
          ) : (
            <div className="space-y-1">
              {radioOrders.map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-2 py-1 rounded bg-gray-50 text-xs"
                >
                  <span className="font-medium">{r.test_name}</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Medications panel */}
      {activeTab === 'medications' && (
        <>
          {medLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : medications.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No medications recorded for this visit</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {medications.map((m, idx) => (
                <div key={m.id} className="px-2 py-1.5 rounded bg-purple-50 border border-purple-100 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-purple-800">{idx + 1}. {m.test_name || '—'}</span>
                      <span className="text-muted-foreground ml-2">
                        {[m.dosage, m.frequency, m.duration ? `× ${m.duration}` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </div>
                  </div>
                  {m.instructions && (
                    <p className="text-muted-foreground mt-0.5 italic">{m.instructions}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Sub-component: single patient card with expand/collapse and action buttons
function PatientCard({ visit }: { visit: VisitWithPatient }) {
  const [expanded, setExpanded] = useState(false);
  const patient = visit.patients;
  if (!patient) return null;

  // Fetch medications at card level so print can access them
  // DATA SOURCE: medications → visit_id → Medication[] (used for print prescription)
  const { data: medications = [] } = useQuery<Medication[]>({
    queryKey: ['doctor-medications', visit.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('medications')
        .select('id, test_name, dosage, frequency, duration, instructions, created_at')
        .eq('visit_id', visit.id)
        .order('created_at', { ascending: false })
        .limit(30);
      return (data || []) as Medication[];
    },
    staleTime: 60000,
    // Only fetch when the card is expanded (data will already be cached)
    enabled: expanded,
  });

  // Opens a printable prescription in a new window
  const printPrescription = () => {
    const win = window.open('', '_blank');
    win?.document.write(`
      <html><head><title>Prescription</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 24px; border-bottom: 2px solid #000; padding-bottom: 8px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .patient { background: #f5f5f5; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background: #eee; }
        .footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 10px; }
        @media print { button { display: none; } }
      </style></head>
      <body>
      <div class="header">
        <div><h1>Hope Hospital</h1><p>Dr. Prescription</p></div>
        <div><p>Date: ${format(new Date(), 'dd/MM/yyyy')}</p></div>
      </div>
      <div class="patient">
        <strong>Patient:</strong> ${patient.name || 'N/A'} &nbsp;
        <strong>Age:</strong> ${patient.age || 'N/A'} &nbsp;
        <strong>Gender:</strong> ${patient.gender || 'N/A'}
      </div>
      <h3>Medications</h3>
      <table>
        <tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr>
        ${medications.map((m, i) => `<tr><td>${i + 1}</td><td>${m.test_name || ''}</td><td>${m.dosage || ''}</td><td>${m.frequency || ''}</td><td>${m.duration || ''}</td><td>${m.instructions || ''}</td></tr>`).join('')}
      </table>
      <div class="footer">
        <p>Doctor's Signature: _______________________</p>
      </div>
      <button onclick="window.print()">Print</button>
      </body></html>
    `);
    win?.document.close();
    win?.focus();
    setTimeout(() => win?.print(), 500);
  };

  // Navigates to home-collection booking with patient pre-filled
  const bookHomeCollection = () => {
    window.location.href =
      '/home-collection?patient_name=' +
      encodeURIComponent(patient.name) +
      '&mobile=' +
      encodeURIComponent(patient.mobile || '');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Patient header row — click to expand */}
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

        {/* Action buttons — always visible */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2 gap-1"
            onClick={e => { e.stopPropagation(); printPrescription(); }}
          >
            <Printer className="w-3.5 h-3.5" />
            Print Prescription
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2 gap-1 text-green-700 border-green-300 hover:bg-green-50"
            onClick={e => { e.stopPropagation(); bookHomeCollection(); }}
          >
            <Home className="w-3.5 h-3.5" />
            Book Home Collection
          </Button>
        </div>

        {/* Expanded: tabbed records */}
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

  // DATA SOURCE: referees table → referee list for selector
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

  // DATA SOURCE: visits → referee_id + date range → VisitWithPatient[]
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
        <p className="text-sm text-muted-foreground">
          Patient list with integrated pathology, radiology &amp; medications — single screen
        </p>
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
          <Input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-40"
          />
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

      {/* Doctor info strip */}
      {selectedReferee && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Stethoscope className="w-4 h-4" />
          <span className="font-medium text-foreground">{selectedReferee.name}</span>
          {selectedReferee.specialty && <span>· {selectedReferee.specialty}</span>}
          <span>
            · {filtered.length} patient{filtered.length !== 1 ? 's' : ''} on{' '}
            {format(new Date(date), 'dd MMM yyyy')}
          </span>
        </div>
      )}

      {/* Patient list */}
      {!selectedRefereeId ? (
        <div className="text-center py-16 text-muted-foreground">
          <Stethoscope className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Select a doctor to view their patient list</p>
          <p className="text-sm mt-1">Lab results, radiology and medications will load on click</p>
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
