import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, TestTube, Clock, Phone, User, FileText, CheckCircle, TrendingUp, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

// DATA SOURCE: patients (mobile lookup) → visits → lab_results + queue_tokens

interface Patient {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  mobile: string | null;
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

interface QueueToken {
  id: string;
  token_number: number;
  department: string;
  status: string;
  counter_name: string | null;
  called_at: string | null;
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  waiting: { label: 'Waiting',      color: 'bg-yellow-100 text-yellow-800' },
  called:  { label: 'Your Turn!',   color: 'bg-green-500 text-white animate-pulse' },
  serving: { label: 'Being Served', color: 'bg-green-100 text-green-800' },
  done:    { label: 'Done',         color: 'bg-gray-100 text-gray-500' },
  skipped: { label: 'Skipped',      color: 'bg-red-100 text-red-700' },
};

// Parse "low - high" from reference_range string
function parseRange(ref: string | null): { low: number; high: number } | null {
  if (!ref) return null;
  const m = ref.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
  if (!m) return null;
  return { low: parseFloat(m[1]), high: parseFloat(m[2]) };
}

function TrendChart({ results, unit, refRange }: {
  results: LabResult[];
  unit: string | null;
  refRange: string | null;
}) {
  const data = results
    .filter(r => r.result_value && !isNaN(parseFloat(r.result_value)))
    .map(r => ({
      date: format(new Date(r.created_at), 'dd MMM yy'),
      value: parseFloat(r.result_value!),
      abnormal: r.is_abnormal,
    }))
    .reverse();

  if (data.length < 2) return (
    <p className="text-xs text-muted-foreground py-4 text-center">Need at least 2 data points for trend</p>
  );

  const range = parseRange(refRange);
  const yMin = range ? Math.min(range.low * 0.85, Math.min(...data.map(d => d.value)) * 0.9) : undefined;
  const yMax = range ? Math.max(range.high * 1.15, Math.max(...data.map(d => d.value)) * 1.1) : undefined;

  return (
    <div className="h-36 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis domain={[yMin ?? 'auto', yMax ?? 'auto']} tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(v: number) => [`${v} ${unit || ''}`, 'Result']}
            labelStyle={{ fontSize: 11 }}
            contentStyle={{ fontSize: 11 }}
          />
          {range && (
            <>
              <ReferenceLine y={range.low} stroke="#22c55e" strokeDasharray="4 2" label={{ value: 'Min', fontSize: 9, fill: '#22c55e' }} />
              <ReferenceLine y={range.high} stroke="#22c55e" strokeDasharray="4 2" label={{ value: 'Max', fontSize: 9, fill: '#22c55e' }} />
            </>
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              return <circle key={cx} cx={cx} cy={cy} r={4}
                fill={payload.abnormal ? '#ef4444' : '#3b82f6'}
                stroke="white" strokeWidth={1.5} />;
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function PatientPortal() {
  const [mobileInput, setMobileInput] = useState('');
  const [searchMobile, setSearchMobile] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<'reports' | 'trends'>('reports');
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  const { data: patients = [], isLoading: lookupLoading } = useQuery({
    queryKey: ['portal-lookup', searchMobile],
    queryFn: async () => {
      if (!searchMobile || searchMobile.length < 5) return [];
      const { data } = await supabase
        .from('patients')
        .select('id, name, age, gender, mobile')
        .ilike('mobile', `%${searchMobile}%`)
        .limit(5);
      return (data || []) as Patient[];
    },
    enabled: searchMobile.length >= 5,
    staleTime: 30000,
  });

  // DATA SOURCE: lab_results for patient — fetch up to 200 for trend charts
  const { data: labResults = [], isLoading: labLoading } = useQuery({
    queryKey: ['portal-lab', selectedPatient?.id],
    queryFn: async () => {
      if (!selectedPatient) return [];
      const { data } = await supabase
        .from('lab_results')
        .select('id, test_name, result_value, unit, reference_range, is_abnormal, result_status, created_at')
        .eq('patient_id', selectedPatient.id)
        .not('result_value', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200);
      return (data || []) as LabResult[];
    },
    enabled: !!selectedPatient,
    staleTime: 60000,
  });

  const { data: queueTokens = [] } = useQuery({
    queryKey: ['portal-queue', selectedPatient?.id],
    queryFn: async () => {
      if (!selectedPatient) return [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('queue_tokens')
        .select('id, token_number, department, status, counter_name, called_at')
        .ilike('patient_name', `%${selectedPatient.name.split(' ')[0]}%`)
        .gte('created_at', today.toISOString())
        .not('status', 'in', '(done,skipped)')
        .limit(5);
      return (data || []) as QueueToken[];
    },
    enabled: !!selectedPatient,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  // Group by date for reports tab
  const byDate = labResults.slice(0, 60).reduce<Record<string, LabResult[]>>((acc, r) => {
    const key = format(new Date(r.created_at), 'dd MMM yyyy');
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  // Group by test_name for trends tab
  const byTest = labResults.reduce<Record<string, LabResult[]>>((acc, r) => {
    if (!acc[r.test_name]) acc[r.test_name] = [];
    acc[r.test_name].push(r);
    return acc;
  }, {});

  // Only show tests with numeric values & >1 data point for trend
  const trendableTests = Object.entries(byTest)
    .filter(([, results]) => {
      const numeric = results.filter(r => r.result_value && !isNaN(parseFloat(r.result_value)));
      return numeric.length >= 2;
    })
    .sort((a, b) => b[1].length - a[1].length);

  const handleSearch = () => setSearchMobile(mobileInput.trim());

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-3">
            <User className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Patient Self-Service</h1>
          <p className="text-sm text-muted-foreground mt-1">View reports, trends & queue status</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Enter your registered mobile number</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="10-digit mobile number"
                  value={mobileInput}
                  onChange={e => setMobileInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                  inputMode="numeric"
                />
              </div>
              <Button onClick={handleSearch} disabled={mobileInput.length < 5}>
                <Search className="w-4 h-4 mr-2" /> Search
              </Button>
            </div>

            {lookupLoading && <p className="text-sm text-muted-foreground mt-2">Searching…</p>}
            {patients.length > 0 && !selectedPatient && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">Select your name:</p>
                {patients.map(p => (
                  <button
                    key={p.id}
                    className="w-full text-left px-3 py-2 rounded-lg border hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    onClick={() => setSelectedPatient(p)}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {p.age ? `${p.age}y` : ''} {p.gender || ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {searchMobile.length >= 5 && patients.length === 0 && !lookupLoading && (
              <p className="text-sm text-orange-600 mt-2">No patient found with this mobile number.</p>
            )}
          </CardContent>
        </Card>

        {selectedPatient && (
          <>
            {/* Patient header */}
            <Card className="bg-blue-600 text-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{selectedPatient.name}</p>
                  <p className="text-blue-200 text-sm">
                    {selectedPatient.age ? `${selectedPatient.age}y` : ''} · {selectedPatient.gender || ''} · {selectedPatient.mobile}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-800 border-white/30 hover:bg-blue-700 hover:text-white"
                  onClick={() => { setSelectedPatient(null); setSearchMobile(''); setMobileInput(''); }}
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Change
                </Button>
              </CardContent>
            </Card>

            {/* Queue Status */}
            {queueTokens.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" /> Your Queue Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {queueTokens.map(t => {
                    const badge = STATUS_BADGE[t.status] || { label: t.status, color: 'bg-gray-100' };
                    return (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <div className="text-2xl font-black text-blue-600">
                            {t.department[0]}{t.token_number}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t.department}{t.counter_name ? ` · ${t.counter_name}` : ''}
                          </div>
                        </div>
                        <Badge className={`text-sm px-3 py-1 ${badge.color}`}>{badge.label}</Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Tab switcher */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={activeTab === 'reports' ? 'default' : 'outline'}
                onClick={() => setActiveTab('reports')}
                className="flex-1"
              >
                <TestTube className="w-3.5 h-3.5 mr-1.5" /> Reports
              </Button>
              <Button
                size="sm"
                variant={activeTab === 'trends' ? 'default' : 'outline'}
                onClick={() => setActiveTab('trends')}
                className="flex-1"
              >
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Trends
                {trendableTests.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-xs">{trendableTests.length}</Badge>
                )}
              </Button>
            </div>

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" /> Lab Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {labLoading ? (
                    <p className="text-sm text-muted-foreground">Loading reports…</p>
                  ) : Object.keys(byDate).length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No lab results found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(byDate).map(([date, results]) => (
                        <div key={date}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{date}</p>
                          <div className="space-y-1">
                            {results.map(r => (
                              <div
                                key={r.id}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${r.is_abnormal ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}
                              >
                                <div className="flex-1 min-w-0">
                                  <span className={`font-medium ${r.is_abnormal ? 'text-red-700' : ''}`}>{r.test_name}</span>
                                  {r.reference_range && (
                                    <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">({r.reference_range})</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-3">
                                  <span className={`font-bold ${r.is_abnormal ? 'text-red-700' : 'text-green-700'}`}>
                                    {r.result_value}
                                  </span>
                                  {r.unit && <span className="text-xs text-muted-foreground">{r.unit}</span>}
                                  {r.is_abnormal && <span className="text-red-500 text-xs">⚠</span>}
                                  {r.result_status === 'final' && !r.is_abnormal && (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Trends Tab */}
            {activeTab === 'trends' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" /> Parameter Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {labLoading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : trendableTests.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Not enough data for trend charts yet</p>
                      <p className="text-xs mt-1">At least 2 results per test are needed</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {trendableTests.map(([testName, results]) => {
                        const latest = results[0];
                        const isExpanded = expandedTest === testName;
                        const hasAbnormal = results.some(r => r.is_abnormal);
                        return (
                          <div key={testName} className={`border rounded-lg overflow-hidden ${hasAbnormal ? 'border-red-200' : 'border-gray-200'}`}>
                            <button
                              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                              onClick={() => setExpandedTest(isExpanded ? null : testName)}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {hasAbnormal && <span className="text-red-500 text-xs shrink-0">⚠</span>}
                                <span className="font-medium text-sm truncate">{testName}</span>
                                <Badge variant="outline" className="text-xs shrink-0">{results.length}x</Badge>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 ml-2">
                                <div className="text-right">
                                  <span className={`font-bold text-sm ${latest.is_abnormal ? 'text-red-600' : 'text-green-700'}`}>
                                    {latest.result_value}
                                  </span>
                                  {latest.unit && <span className="text-xs text-muted-foreground ml-1">{latest.unit}</span>}
                                </div>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="px-4 pb-4 border-t bg-gray-50">
                                {latest.reference_range && (
                                  <p className="text-xs text-muted-foreground mt-2">Reference: {latest.reference_range} {latest.unit || ''}</p>
                                )}
                                <TrendChart
                                  results={results}
                                  unit={latest.unit}
                                  refRange={latest.reference_range}
                                />
                                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                                  {results.slice(0, 6).map(r => (
                                    <div key={r.id} className={`text-xs rounded p-1 ${r.is_abnormal ? 'bg-red-100 text-red-700' : 'bg-white border'}`}>
                                      <div className="font-bold">{r.result_value}</div>
                                      <div className="text-muted-foreground">{format(new Date(r.created_at), 'dd MMM')}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <p className="text-center text-xs text-muted-foreground pb-4">
              For queries contact reception · Reports refresh automatically
            </p>
          </>
        )}
      </div>
    </div>
  );
}
