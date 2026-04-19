import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Target, Award, Users, Calendar, MapPin } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// DATA SOURCE: marketing_users + doctor_visits + marketing_camps → incentive calculation

// Incentive slab: % achievement of monthly visit target (100 visits/month)
// 0–59%: No incentive
// 60–79%: ₹2,000
// 80–99%: ₹5,000
// 100%+: ₹10,000 + ₹100 per visit above 100
const VISIT_TARGET = 100;
const CAMP_TARGET = 4;

function calcIncentive(visits: number, camps: number): number {
  const visitPct = visits / VISIT_TARGET;
  let base = 0;
  if (visitPct >= 1.0) base = 10000 + (visits - VISIT_TARGET) * 100;
  else if (visitPct >= 0.8) base = 5000;
  else if (visitPct >= 0.6) base = 2000;
  const campBonus = Math.min(camps, CAMP_TARGET) * 500;
  return base + campBonus;
}

function AchievementBar({ value, target, color }: { value: number; target: number; color: string }) {
  const pct = Math.min((value / target) * 100, 100);
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function MarketingIncentives() {
  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0);

  const targetMonth = subMonths(now, monthOffset);
  const monthStart = format(startOfMonth(targetMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(targetMonth), 'yyyy-MM-dd');
  const monthLabel = format(targetMonth, 'MMMM yyyy');

  // DATA SOURCE: marketing_users
  const { data: staff = [] } = useQuery({
    queryKey: ['marketing-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_users')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  // DATA SOURCE: doctor_visits for the selected month
  const { data: visits = [] } = useQuery({
    queryKey: ['doctor-visits', monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctor_visits')
        .select('marketing_user_id, id, outcome')
        .gte('visit_date', monthStart)
        .lte('visit_date', monthEnd);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  // DATA SOURCE: marketing_camps for the selected month
  const { data: camps = [] } = useQuery({
    queryKey: ['marketing-camps', monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_camps')
        .select('marketing_user_id, id')
        .gte('camp_date', monthStart)
        .lte('camp_date', monthEnd);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  // Aggregate per staff
  const statsMap = staff.map((s: any) => {
    const myVisits = visits.filter((v: any) => v.marketing_user_id === s.id);
    const myCamps = camps.filter((c: any) => c.marketing_user_id === s.id);
    const positiveVisits = myVisits.filter((v: any) => v.outcome === 'Positive').length;
    const incentive = calcIncentive(myVisits.length, myCamps.length);
    const visitPct = Math.round((myVisits.length / VISIT_TARGET) * 100);
    const campPct = Math.round((myCamps.length / CAMP_TARGET) * 100);
    return {
      ...s,
      visitCount: myVisits.length,
      campCount: myCamps.length,
      positiveVisits,
      incentive,
      visitPct,
      campPct,
    };
  }).sort((a: any, b: any) => b.visitCount - a.visitCount);

  const totalVisits = visits.length;
  const totalCamps = camps.length;
  const totalIncentives = statsMap.reduce((sum: number, s: any) => sum + s.incentive, 0);
  const topPerformer = statsMap[0];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" /> Marketing Incentives
          </h1>
          <p className="text-sm text-muted-foreground">Monthly performance & incentive tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={String(monthOffset)} onValueChange={v => setMonthOffset(parseInt(v))}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5].map(offset => (
                <SelectItem key={offset} value={String(offset)}>
                  {format(subMonths(now, offset), 'MMMM yyyy')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Active Executives</span>
          </div>
          <div className="text-2xl font-bold">{staff.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-indigo-500" />
            <span className="text-xs text-muted-foreground">Total Visits</span>
          </div>
          <div className="text-2xl font-bold text-indigo-600">{totalVisits}</div>
          <div className="text-xs text-muted-foreground">Target: {staff.length * VISIT_TARGET}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-muted-foreground">Camps Conducted</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{totalCamps}</div>
          <div className="text-xs text-muted-foreground">Target: {staff.length * CAMP_TARGET}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Total Incentives</span>
          </div>
          <div className="text-2xl font-bold text-green-600">₹{totalIncentives.toLocaleString('en-IN')}</div>
        </Card>
      </div>

      {/* Slab reference */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-blue-700 mb-2">INCENTIVE SLAB — {monthLabel}</p>
          <div className="flex flex-wrap gap-4 text-xs text-blue-800">
            <span>0–59% visits → No incentive</span>
            <span>60–79% → ₹2,000 + ₹500/camp</span>
            <span>80–99% → ₹5,000 + ₹500/camp</span>
            <span>100%+ → ₹10,000 + ₹100/extra visit + ₹500/camp</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">Visit target: {VISIT_TARGET}/month · Camp target: {CAMP_TARGET}/month</p>
        </CardContent>
      </Card>

      {/* Staff cards */}
      {staff.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No marketing staff found. Add staff in the Marketing module.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {statsMap.map((s: any) => {
            const visitColor = s.visitPct >= 100 ? 'bg-green-500' : s.visitPct >= 80 ? 'bg-blue-500' : s.visitPct >= 60 ? 'bg-yellow-500' : 'bg-red-400';
            const campColor = s.campPct >= 100 ? 'bg-green-500' : s.campPct >= 75 ? 'bg-blue-500' : 'bg-yellow-500';
            const incentiveTier = s.visitPct >= 100 ? '🥇 Target Achieved' : s.visitPct >= 80 ? '🥈 Good' : s.visitPct >= 60 ? '🥉 Partial' : '— Below threshold';
            return (
              <Card key={s.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{s.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{s.designation}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">₹{s.incentive.toLocaleString('en-IN')}</div>
                      <div className="text-xs text-muted-foreground">incentive</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Doctor Visits */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Doctor Visits
                      </span>
                      <span className="font-semibold">{s.visitCount} / {VISIT_TARGET}
                        <span className="text-muted-foreground ml-1">({s.visitPct}%)</span>
                      </span>
                    </div>
                    <AchievementBar value={s.visitCount} target={VISIT_TARGET} color={visitColor} />
                  </div>

                  {/* Camps */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Target className="w-3 h-3" /> Camps
                      </span>
                      <span className="font-semibold">{s.campCount} / {CAMP_TARGET}
                        <span className="text-muted-foreground ml-1">({s.campPct}%)</span>
                      </span>
                    </div>
                    <AchievementBar value={s.campCount} target={CAMP_TARGET} color={campColor} />
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{incentiveTier}</Badge>
                    {s.positiveVisits > 0 && (
                      <span className="text-xs text-green-600">{s.positiveVisits} positive outcomes</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Top performer highlight */}
      {topPerformer && topPerformer.visitCount > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 flex items-center gap-4">
            <Award className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-800">Top Performer — {monthLabel}</p>
              <p className="text-lg font-bold">{topPerformer.name}
                <span className="text-sm font-normal text-green-600 ml-2">
                  {topPerformer.visitCount} visits · ₹{topPerformer.incentive.toLocaleString('en-IN')} incentive
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
