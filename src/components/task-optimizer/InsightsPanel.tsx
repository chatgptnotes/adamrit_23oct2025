import { useQuery } from '@tanstack/react-query';
import { Loader2, ListTodo, Wand2, CheckCircle2, Clock } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { SuggestionType, ActionStatus, TaskSuggestion } from '@/lib/optimizeTasks';
import { fetchTaskActions, type TaskAction } from '@/lib/taskOptimizerActions';
import { STATUS_META } from './suggestionMeta';

interface LogRow {
  id: string;
  designation: string;
  ai_suggestions: TaskSuggestion[] | null;
}

// Colours reused from the badge palette so charts match the rest of the tab.
const TYPE_COLOR: Record<SuggestionType, string> = {
  automate: '#2563eb',
  reduce: '#d97706',
  delegate: '#9333ea',
  keep: '#6b7280',
};
const STATUS_COLOR: Record<ActionStatus, string> = {
  suggested: '#94a3b8',
  in_progress: '#2563eb',
  done: '#059669',
  dismissed: '#9ca3af',
};
const TYPE_LABEL: Record<SuggestionType, string> = {
  automate: 'Automate',
  reduce: 'Reduce',
  delegate: 'Delegate',
  keep: 'Keep',
};

const WORKING_DAYS_PER_WEEK = 5;

interface Insights {
  totalSuggestions: number;
  automatablePct: number;
  actioned: number;
  pending: number;
  weeklyHoursSaved: number;
  byDepartment: Array<{ department: string; automate: number; total: number }>;
  byType: Array<{ name: string; value: number; type: SuggestionType }>;
  byStatus: Array<{ name: string; value: number; status: ActionStatus }>;
}

function computeInsights(logs: LogRow[], actions: TaskAction[]): Insights {
  const actionByKey = new Map<string, TaskAction>();
  for (const a of actions) actionByKey.set(`${a.log_id}|${a.task_text}`, a);

  const typeCounts: Record<SuggestionType, number> = { automate: 0, reduce: 0, delegate: 0, keep: 0 };
  const statusCounts: Record<ActionStatus, number> = { suggested: 0, in_progress: 0, done: 0, dismissed: 0 };
  const deptMap = new Map<string, { automate: number; total: number }>();

  let totalSuggestions = 0;
  let dailyMinsSaved = 0;

  for (const log of logs) {
    const suggestions = log.ai_suggestions ?? [];
    for (const s of suggestions) {
      totalSuggestions += 1;
      typeCounts[s.type] += 1;

      const dept = log.designation || 'Unknown';
      const d = deptMap.get(dept) ?? { automate: 0, total: 0 };
      d.total += 1;
      if (s.type === 'automate') d.automate += 1;
      deptMap.set(dept, d);

      // "keep" tasks aren't actionable, so they don't enter the status funnel.
      if (s.type === 'keep') continue;
      const action = actionByKey.get(`${log.id}|${s.task}`);
      const status: ActionStatus = action?.status ?? 'suggested';
      statusCounts[status] += 1;
      if (status === 'done' && action?.time_saved_mins) {
        dailyMinsSaved += action.time_saved_mins;
      }
    }
  }

  const actionable = statusCounts.suggested + statusCounts.in_progress + statusCounts.done + statusCounts.dismissed;
  const actioned = statusCounts.in_progress + statusCounts.done;

  const byDepartment = Array.from(deptMap.entries())
    .map(([department, v]) => ({ department, automate: v.automate, total: v.total }))
    .sort((a, b) => b.automate - a.automate);

  const byType = (Object.keys(typeCounts) as SuggestionType[])
    .map(type => ({ name: TYPE_LABEL[type], value: typeCounts[type], type }))
    .filter(d => d.value > 0);

  const byStatus = (Object.keys(statusCounts) as ActionStatus[])
    .map(status => ({ name: STATUS_META[status].label, value: statusCounts[status], status }));

  return {
    totalSuggestions,
    automatablePct: totalSuggestions === 0 ? 0 : Math.round((typeCounts.automate / totalSuggestions) * 100),
    actioned,
    pending: actionable - actioned - statusCounts.dismissed,
    weeklyHoursSaved: Math.round(((dailyMinsSaved * WORKING_DAYS_PER_WEEK) / 60) * 10) / 10,
    byDepartment,
    byType,
    byStatus,
  };
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof ListTodo;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold leading-none">{value}</p>
          {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const InsightsPanel = () => {
  const { hospitalType } = useAuth();

  const { data: logs, isLoading: logsLoading, error: logsError } = useQuery({
    queryKey: ['task-optimizer-logs', hospitalType],
    queryFn: async (): Promise<LogRow[]> => {
      let query = supabase
        .from('task_optimizer_logs')
        .select('id, designation, ai_suggestions')
        .order('created_at', { ascending: false })
        .limit(500);
      if (hospitalType) query = query.eq('hospital_type', hospitalType);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as LogRow[];
    },
  });

  const { data: actions } = useQuery({
    queryKey: ['task-optimizer-actions', hospitalType],
    queryFn: () => fetchTaskActions(hospitalType ?? null),
  });

  if (logsLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading insights…
      </div>
    );
  }

  if (logsError) {
    return <p className="py-8 text-sm text-destructive">Could not load insights.</p>;
  }

  const rows = logs ?? [];
  if (rows.length === 0) {
    return <p className="py-8 text-sm text-muted-foreground">No data yet. Add submissions to see insights.</p>;
  }

  const insights = computeInsights(rows, actions ?? []);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={ListTodo} label="Tasks analysed" value={String(insights.totalSuggestions)} />
        <KpiCard icon={Wand2} label="Automatable" value={`${insights.automatablePct}%`} hint="of all tasks" />
        <KpiCard
          icon={CheckCircle2}
          label="Actioned"
          value={String(insights.actioned)}
          hint={`${insights.pending} still pending`}
        />
        <KpiCard
          icon={Clock}
          label="Time saved"
          value={`${insights.weeklyHoursSaved} h`}
          hint="per week (from done)"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Automation candidates by department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={insights.byDepartment} layout="vertical" margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} fontSize={12} />
                <YAxis type="category" dataKey="department" width={140} fontSize={11} />
                <Tooltip />
                <Bar dataKey="automate" name="Automatable tasks" fill={TYPE_COLOR.automate} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suggestion mix</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={insights.byType}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {insights.byType.map(d => (
                    <Cell key={d.type} fill={TYPE_COLOR[d.type]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Action funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={insights.byStatus} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" name="Suggestions" radius={[4, 4, 0, 0]}>
                  {insights.byStatus.map(d => (
                    <Cell key={d.status} fill={STATUS_COLOR[d.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InsightsPanel;
