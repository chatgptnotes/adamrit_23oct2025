import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// DATA SOURCE: queue_tokens → all departments → today's date, live TV display

const DEPARTMENTS = [
  'OPD', 'Lab', 'Radiology', 'USG', 'CT', 'MRI',
  'X-Ray', 'ECG', 'Pharmacy', 'Billing', 'Physiotherapy', 'BMD', 'MAMO'
];

const DEPT_COLORS: Record<string, string> = {
  OPD:          'from-blue-600 to-blue-800',
  Lab:          'from-green-600 to-green-800',
  Radiology:    'from-purple-600 to-purple-800',
  USG:          'from-indigo-600 to-indigo-800',
  CT:           'from-rose-600 to-rose-800',
  MRI:          'from-pink-600 to-pink-800',
  'X-Ray':      'from-orange-500 to-orange-700',
  ECG:          'from-red-600 to-red-800',
  Pharmacy:     'from-teal-600 to-teal-800',
  Billing:      'from-yellow-600 to-yellow-800',
  Physiotherapy:'from-cyan-600 to-cyan-800',
  BMD:          'from-violet-600 to-violet-800',
  MAMO:         'from-fuchsia-600 to-fuchsia-800',
};

export default function QueueTV() {
  const [now, setNow] = useState(new Date());

  // Clock tick every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // DATA SOURCE: all queue_tokens for today, all depts
  const { data: tokens = [] } = useQuery({
    queryKey: ['queue-tv-all'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('queue_tokens')
        .select('department, token_number, patient_name, status, counter_name, called_at')
        .gte('created_at', today.toISOString())
        .order('token_number', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 8000,
    staleTime: 4000,
  });

  // Build per-department stats
  const deptStats = DEPARTMENTS.map(dept => {
    const deptTokens = tokens.filter((t: any) => t.department === dept);
    const waiting = deptTokens.filter((t: any) => t.status === 'waiting');
    const called = deptTokens.filter((t: any) => t.status === 'called');
    const serving = deptTokens.filter((t: any) => t.status === 'serving');
    const active = [...called, ...serving];
    const currentToken = active.length > 0
      ? active.sort((a: any, b: any) => (b.called_at || '').localeCompare(a.called_at || ''))[0]
      : null;
    return { dept, waiting: waiting.length, active: active.length, current: currentToken, total: deptTokens.length };
  }).filter(d => d.total > 0);

  const activeDepts = deptStats.filter(d => d.total > 0);
  const displayDepts = activeDepts.length > 0 ? activeDepts : DEPARTMENTS.slice(0, 8).map(dept => ({
    dept, waiting: 0, active: 0, current: null, total: 0
  }));

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-xl font-black">Q</span>
          </div>
          <div>
            <p className="text-lg font-bold leading-none">Queue Display</p>
            <p className="text-xs text-gray-400 mt-0.5">Live · Updates every 8 seconds</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-mono font-bold tabular-nums text-blue-400">
            {format(now, 'hh:mm:ss a')}
          </p>
          <p className="text-xs text-gray-400">{format(now, 'EEEE, dd MMMM yyyy')}</p>
        </div>
      </div>

      {/* Department grid */}
      <div className="flex-1 p-6 grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${Math.min(displayDepts.length, 4)}, 1fr)`,
          gridAutoRows: displayDepts.length <= 4 ? '1fr' : 'auto',
        }}
      >
        {displayDepts.map(({ dept, waiting, active, current }) => {
          const color = DEPT_COLORS[dept] || 'from-gray-600 to-gray-800';
          const tokenDisplay = current
            ? `${dept[0]}${current.token_number}`
            : '—';

          return (
            <div
              key={dept}
              className={`rounded-2xl bg-gradient-to-br ${color} p-6 flex flex-col justify-between shadow-xl`}
            >
              {/* Dept name */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold tracking-wide uppercase opacity-90">{dept}</span>
                {waiting > 0 && (
                  <span className="bg-white/20 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
                    {waiting} waiting
                  </span>
                )}
              </div>

              {/* Current token — large display */}
              <div className="my-4 text-center">
                <div className={`text-7xl font-black tabular-nums leading-none ${current ? 'animate-pulse' : 'opacity-30'}`}>
                  {tokenDisplay}
                </div>
                {current && (
                  <p className="text-sm opacity-80 mt-2 truncate">
                    {current.patient_name}
                  </p>
                )}
                {!current && (
                  <p className="text-sm opacity-50 mt-2">No active token</p>
                )}
              </div>

              {/* Counter info */}
              <div className="flex items-center justify-between text-sm">
                {current?.counter_name ? (
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">
                    {current.counter_name}
                  </span>
                ) : <span />}
                {active > 1 && (
                  <span className="text-xs opacity-70">+{active - 1} serving</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer ticker */}
      <div className="bg-blue-700 px-8 py-2 text-sm font-medium shrink-0 flex items-center gap-2">
        <span className="animate-pulse text-blue-200">●</span>
        <span>Please proceed to the indicated counter when your token is called · Carry your registration slip</span>
      </div>
    </div>
  );
}
