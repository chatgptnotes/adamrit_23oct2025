import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, FlaskConical } from 'lucide-react';

interface LabTrendChartProps {
  patientId: string;
}

interface LabPoint {
  date: string;
  value: number;
  visitId: string;
  isAbnormal: boolean;
  unit: string;
  referenceRange: string;
}

interface TestHistory {
  testName: string;
  category: string;
  unit: string;
  referenceRange: string;
  points: LabPoint[];
}

// Parse reference range like "70-100" or "<200" or ">5" into low/high numbers
function parseReferenceRange(range: string): { low?: number; high?: number } {
  if (!range) return {};
  const between = range.match(/^(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)$/);
  if (between) return { low: parseFloat(between[1]), high: parseFloat(between[2]) };
  const lessThan = range.match(/^<\s*(\d+\.?\d*)$/);
  if (lessThan) return { high: parseFloat(lessThan[1]) };
  const greaterThan = range.match(/^>\s*(\d+\.?\d*)$/);
  if (greaterThan) return { low: parseFloat(greaterThan[1]) };
  return {};
}

const COLORS = ['#2563eb','#16a34a','#dc2626','#d97706','#7c3aed','#0891b2','#be185d','#65a30d'];

export default function LabTrendChart({ patientId }: LabTrendChartProps) {
  const [selectedTest, setSelectedTest] = useState<string>('all');

  // Fetch all lab results for this patient across all visits
  // DATA SOURCE: visits → lab_results via visit_id → grouped by test_name
  const { data: testHistories = [], isLoading } = useQuery({
    queryKey: ['lab-trends', patientId],
    queryFn: async (): Promise<TestHistory[]> => {
      // Step 1: get all visit IDs for this patient
      const { data: visits, error: visitsErr } = await supabase
        .from('visits')
        .select('id, visit_date')
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: true });
      if (visitsErr) throw visitsErr;
      if (!visits?.length) return [];

      const visitIds = visits.map(v => v.id);
      const visitDateMap = Object.fromEntries(visits.map(v => [v.id, v.visit_date]));

      // Step 2: get lab results for those visits
      const { data: results, error: resultsErr } = await supabase
        .from('lab_results')
        .select('visit_id, test_name, test_category, result_value, result_unit, reference_range, is_abnormal, created_at')
        .in('visit_id', visitIds)
        .order('created_at', { ascending: true });
      if (resultsErr) throw resultsErr;
      if (!results?.length) return [];

      // Step 3: group by test_name, keep only numeric results
      const map = new Map<string, TestHistory>();
      for (const r of results) {
        const numVal = parseFloat(r.result_value);
        if (isNaN(numVal)) continue; // skip non-numeric (e.g. "Positive", "Normal")

        const date = visitDateMap[r.visit_id] || r.created_at;
        const key = r.test_name;
        if (!map.has(key)) {
          map.set(key, {
            testName: r.test_name,
            category: r.test_category || 'General',
            unit: r.result_unit || '',
            referenceRange: r.reference_range || '',
            points: [],
          });
        }
        map.get(key)!.points.push({
          date: format(new Date(date), 'dd/MM/yy'),
          value: numVal,
          visitId: r.visit_id,
          isAbnormal: r.is_abnormal || false,
          unit: r.result_unit || '',
          referenceRange: r.reference_range || '',
        });
      }

      return Array.from(map.values()).filter(t => t.points.length >= 2); // only show tests with history
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!patientId,
  });

  const visibleTests = selectedTest === 'all' ? testHistories : testHistories.filter(t => t.testName === selectedTest);

  const getTrend = (points: LabPoint[]) => {
    if (points.length < 2) return 'stable';
    const last = points[points.length - 1].value;
    const prev = points[points.length - 2].value;
    const pct = ((last - prev) / Math.abs(prev)) * 100;
    if (pct > 5) return 'up';
    if (pct < -5) return 'down';
    return 'stable';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        <FlaskConical className="w-5 h-5 mr-2 animate-pulse" />
        Loading lab history…
      </div>
    );
  }

  if (!testHistories.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FlaskConical className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">No lab history with numeric results found for this patient.</p>
          <p className="text-xs mt-1">Results need at least 2 entries to show a trend.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Lab Parameter Trends</h3>
          <p className="text-xs text-muted-foreground">{testHistories.length} tests with history across all visits</p>
        </div>
        <Select value={selectedTest} onValueChange={setSelectedTest}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filter test" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tests</SelectItem>
            {testHistories.map(t => (
              <SelectItem key={t.testName} value={t.testName}>{t.testName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {testHistories.map(t => {
          const trend = getTrend(t.points);
          const last = t.points[t.points.length - 1];
          return (
            <Badge
              key={t.testName}
              variant={last.isAbnormal ? 'destructive' : 'secondary'}
              className="cursor-pointer text-xs"
              onClick={() => setSelectedTest(t.testName === selectedTest ? 'all' : t.testName)}
            >
              {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
              {trend === 'stable' && <Minus className="w-3 h-3 mr-1" />}
              {t.testName}: {last.value} {t.unit}
            </Badge>
          );
        })}
      </div>

      {/* Charts */}
      {visibleTests.map((test, idx) => {
        const { low, high } = parseReferenceRange(test.referenceRange);
        const trend = getTrend(test.points);
        const last = test.points[test.points.length - 1];
        const color = COLORS[idx % COLORS.length];

        return (
          <Card key={test.testName}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {test.testName}
                  {test.unit && <span className="text-muted-foreground font-normal ml-1">({test.unit})</span>}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {test.referenceRange && <span>Ref: {test.referenceRange}</span>}
                  <Badge variant={last.isAbnormal ? 'destructive' : 'outline'} className="text-xs">
                    {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                    {trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                    {trend === 'stable' && <Minus className="w-3 h-3 mr-1" />}
                    Latest: {last.value} {test.unit}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={test.points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={50}
                    domain={['auto', 'auto']} />
                  <Tooltip
                    formatter={(val: number) => [`${val} ${test.unit}`, test.testName]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  {low !== undefined && (
                    <ReferenceLine y={low} stroke="#f59e0b" strokeDasharray="4 2"
                      label={{ value: 'Low', position: 'insideTopLeft', fontSize: 10, fill: '#f59e0b' }} />
                  )}
                  {high !== undefined && (
                    <ReferenceLine y={high} stroke="#ef4444" strokeDasharray="4 2"
                      label={{ value: 'High', position: 'insideTopLeft', fontSize: 10, fill: '#ef4444' }} />
                  )}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      return (
                        <circle
                          key={`dot-${payload.date}`}
                          cx={cx} cy={cy} r={4}
                          fill={payload.isAbnormal ? '#dc2626' : color}
                          stroke="white" strokeWidth={1.5}
                        />
                      );
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
