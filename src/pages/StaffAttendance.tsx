import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserCheck, LogIn, LogOut, Clock, Calendar, Users, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// DATA SOURCE: staff_attendance table — daily check-in / check-out + monthly summary

const DEPARTMENTS = ['Phlebotomy', 'Lab', 'Radiology', 'Reception', 'Marketing', 'Pharmacy', 'Accounts', 'IT', 'General'];
const SHIFTS = ['Morning', 'Afternoon', 'Night', 'Full Day'];

const today = format(new Date(), 'yyyy-MM-dd');

export default function StaffAttendance() {
  const qc = useQueryClient();
  const [viewDate, setViewDate] = useState(today);
  const [monthOffset, setMonthOffset] = useState(0);
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('General');
  const [newShift, setNewShift] = useState('Morning');
  const [showAdd, setShowAdd] = useState(false);

  // DATA SOURCE: staff_attendance for viewDate
  const { data: dayRecords = [], isLoading } = useQuery({
    queryKey: ['attendance-day', viewDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('work_date', viewDate)
        .order('employee_name');
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  // DATA SOURCE: staff_attendance for selected month
  const now = new Date();
  const targetMonth = subMonths(now, monthOffset);
  const monthStart = format(startOfMonth(targetMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(targetMonth), 'yyyy-MM-dd');

  const { data: monthRecords = [] } = useQuery({
    queryKey: ['attendance-month', monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_attendance')
        .select('*')
        .gte('work_date', monthStart)
        .lte('work_date', monthEnd)
        .order('work_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === 'monthly',
    staleTime: 60000,
  });

  const checkIn = useMutation({
    mutationFn: async ({ name, dept, shift }: { name: string; dept: string; shift: string }) => {
      const { error } = await supabase.from('staff_attendance').upsert({
        employee_name: name,
        department: dept,
        shift_type: shift,
        work_date: viewDate,
        check_in_at: new Date().toISOString(),
        status: 'present',
      }, { onConflict: 'employee_name,work_date' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Checked in');
      setShowAdd(false);
      setNewName('');
      qc.invalidateQueries({ queryKey: ['attendance-day'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const checkOut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff_attendance')
        .update({ check_out_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Checked out');
      qc.invalidateQueries({ queryKey: ['attendance-day'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const presentCount = dayRecords.filter((r: any) => r.check_in_at).length;
  const checkedOut = dayRecords.filter((r: any) => r.check_out_at).length;
  const stillIn = presentCount - checkedOut;

  // Monthly summary: group by employee
  const monthSummary = monthRecords.reduce<Record<string, { days: number; totalMin: number }>>((acc, r: any) => {
    if (!acc[r.employee_name]) acc[r.employee_name] = { days: 0, totalMin: 0 };
    acc[r.employee_name].days += 1;
    acc[r.employee_name].totalMin += r.duration_minutes || 0;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600" /> Staff Attendance
          </h1>
          <p className="text-sm text-muted-foreground">Daily check-in / check-out tracker</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('daily')}
          >Daily</Button>
          <Button
            variant={activeTab === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('monthly')}
          >Monthly</Button>
        </div>
      </div>

      {/* Daily View */}
      {activeTab === 'daily' && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <Input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} className="w-40" />
            <Button onClick={() => setShowAdd(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add / Check In
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{presentCount}</div>
              <div className="text-xs text-muted-foreground">Present</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{checkedOut}</div>
              <div className="text-xs text-muted-foreground">Checked Out</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold text-orange-500">{stillIn}</div>
              <div className="text-xs text-muted-foreground">Still In</div>
            </Card>
          </div>

          {/* Add / Check-in form */}
          {showAdd && (
            <Card className="border-blue-200">
              <CardContent className="p-4 space-y-3">
                <p className="font-medium text-sm">Check In Employee</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
                    <Input
                      autoFocus
                      placeholder="Employee name"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && newName.trim() && checkIn.mutate({ name: newName.trim(), dept: newDept, shift: newShift })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Department</label>
                    <Select value={newDept} onValueChange={setNewDept}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Shift</label>
                    <Select value={newShift} onValueChange={setNewShift}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
                  <Button size="sm"
                    disabled={!newName.trim() || checkIn.isPending}
                    onClick={() => checkIn.mutate({ name: newName.trim(), dept: newDept, shift: newShift })}>
                    <LogIn className="w-3.5 h-3.5 mr-1" />
                    {checkIn.isPending ? 'Saving…' : 'Check In'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attendance list */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading…</div>
          ) : dayRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No attendance records for {format(new Date(viewDate), 'dd MMM yyyy')}.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dayRecords.map((r: any) => (
                <Card key={r.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{r.employee_name}</span>
                        <Badge variant="outline" className="text-xs">{r.department}</Badge>
                        <Badge variant="secondary" className="text-xs">{r.shift_type}</Badge>
                        {!r.check_out_at && r.check_in_at && (
                          <Badge className="text-xs bg-green-100 text-green-800">In Office</Badge>
                        )}
                        {r.check_out_at && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {r.duration_minutes ? `${Math.floor(r.duration_minutes / 60)}h ${r.duration_minutes % 60}m` : 'Done'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        {r.check_in_at && (
                          <span className="flex items-center gap-1">
                            <LogIn className="w-3 h-3 text-green-600" />
                            {format(new Date(r.check_in_at), 'hh:mm a')}
                          </span>
                        )}
                        {r.check_out_at && (
                          <span className="flex items-center gap-1">
                            <LogOut className="w-3 h-3 text-red-500" />
                            {format(new Date(r.check_out_at), 'hh:mm a')}
                          </span>
                        )}
                      </div>
                    </div>
                    {r.check_in_at && !r.check_out_at && viewDate === today && (
                      <Button size="sm" variant="outline" className="h-8 text-xs shrink-0"
                        onClick={() => checkOut.mutate(r.id)}
                        disabled={checkOut.isPending}>
                        <LogOut className="w-3 h-3 mr-1" /> Check Out
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Monthly View */}
      {activeTab === 'monthly' && (
        <>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={String(monthOffset)} onValueChange={v => setMonthOffset(parseInt(v))}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3].map(o => (
                  <SelectItem key={o} value={String(o)}>
                    {format(subMonths(now, o), 'MMMM yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {Object.keys(monthSummary).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No attendance records for {format(targetMonth, 'MMMM yyyy')}.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(monthSummary)
                .sort(([, a], [, b]) => b.days - a.days)
                .map(([name, stats]) => {
                  const avgHours = stats.days > 0 ? (stats.totalMin / stats.days / 60).toFixed(1) : '0';
                  return (
                    <Card key={name}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{name}</p>
                          <p className="text-xs text-muted-foreground">Avg {avgHours} hrs/day</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{stats.days}</div>
                          <div className="text-xs text-muted-foreground">days present</div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
