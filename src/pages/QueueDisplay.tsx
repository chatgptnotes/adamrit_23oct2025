import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// Full-screen TV display for waiting area
// URL: /queue-display?dept=OPD  OR  /queue-display (shows all departments)

interface Token {
  id: string;
  token_number: number;
  department: string;
  patient_name: string;
  status: string;
  called_at: string | null;
  counter_name: string | null;
}

const DEPT_COLORS: Record<string, string> = {
  OPD: '#2563eb', Lab: '#16a34a', Radiology: '#7c3aed', USG: '#0891b2',
  CT: '#be185d', MRI: '#d97706', 'X-Ray': '#65a30d', ECG: '#dc2626',
  Pharmacy: '#059669', Billing: '#6366f1', Physiotherapy: '#f59e0b',
  BMD: '#0284c7', MAMO: '#9333ea',
};

export default function QueueDisplay() {
  const [searchParams] = useSearchParams();
  const filterDept = searchParams.get('dept');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [time, setTime] = useState(new Date());

  const fetchTokens = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let q = supabase
      .from('queue_tokens')
      .select('id, token_number, department, patient_name, status, called_at, counter_name')
      .in('status', ['waiting', 'called', 'serving'])
      .gte('created_at', today.toISOString())
      .order('token_number', { ascending: true });

    if (filterDept) q = q.eq('department', filterDept);

    const { data } = await q;
    setTokens(data || []);
  };

  useEffect(() => {
    fetchTokens();

    // Real-time subscription
    const channel = supabase
      .channel('queue-display-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_tokens' }, () => {
        fetchTokens();
      })
      .subscribe();

    // Clock
    const clockTimer = setInterval(() => setTime(new Date()), 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(clockTimer);
    };
  }, [filterDept]);

  // Group by department
  const byDept = tokens.reduce<Record<string, Token[]>>((acc, t) => {
    if (!acc[t.department]) acc[t.department] = [];
    acc[t.department].push(t);
    return acc;
  }, {});

  const departments = Object.keys(byDept);

  // Now serving = called or serving status
  const nowServing = tokens.filter(t => ['called', 'serving'].includes(t.status));
  const waiting = tokens.filter(t => t.status === 'waiting');

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div className="bg-blue-900 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-wide">
            {filterDept ? `${filterDept} Queue` : 'Patient Queue — All Departments'}
          </h1>
          <p className="text-blue-300 text-sm mt-0.5">Hope Hospital · Nagpur</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-mono font-bold text-white">{format(time, 'hh:mm:ss a')}</div>
          <div className="text-blue-300 text-sm">{format(time, 'EEEE, dd MMMM yyyy')}</div>
        </div>
      </div>

      {/* Now Serving — prominent section */}
      {nowServing.length > 0 && (
        <div className="bg-green-800 px-8 py-5">
          <p className="text-green-300 text-sm font-semibold uppercase tracking-widest mb-3">Now Serving</p>
          <div className="flex flex-wrap gap-4">
            {nowServing.map(t => (
              <div key={t.id}
                className="bg-green-600 rounded-xl px-6 py-4 flex items-center gap-4 shadow-lg"
                style={{ borderLeft: `6px solid ${DEPT_COLORS[t.department] || '#16a34a'}` }}>
                <div className="text-5xl font-black text-white leading-none">
                  {t.department[0]}{t.token_number}
                </div>
                <div>
                  <div className="text-white font-semibold text-lg">{t.patient_name}</div>
                  <div className="text-green-200 text-sm">{t.department} · {t.counter_name || 'Counter 1'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waiting list by department */}
      <div className="flex-1 p-8">
        {departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <div className="text-6xl mb-4">✓</div>
            <div className="text-2xl font-light">No patients waiting</div>
          </div>
        ) : (
          <div className={`grid gap-6 ${departments.length === 1 ? 'grid-cols-1' : departments.length <= 3 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
            {departments.map(dept => {
              const deptTokens = byDept[dept];
              const deptWaiting = deptTokens.filter(t => t.status === 'waiting');
              const color = DEPT_COLORS[dept] || '#6366f1';
              return (
                <div key={dept} className="bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
                  {/* Dept header */}
                  <div className="px-5 py-3 flex items-center justify-between"
                    style={{ backgroundColor: color }}>
                    <span className="text-white font-bold text-lg">{dept}</span>
                    <span className="bg-white bg-opacity-20 text-white text-sm font-semibold px-3 py-1 rounded-full">
                      {deptWaiting.length} waiting
                    </span>
                  </div>
                  {/* Token list */}
                  <div className="px-4 py-3 space-y-2 max-h-64 overflow-hidden">
                    {deptWaiting.length === 0 ? (
                      <p className="text-gray-500 text-center py-3 text-sm">All done</p>
                    ) : (
                      deptWaiting.slice(0, 8).map((t, idx) => (
                        <div key={t.id}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 ${idx === 0 ? 'bg-gray-700' : 'bg-gray-800'}`}>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-black" style={{ color: idx === 0 ? 'white' : '#9ca3af' }}>
                              {dept[0]}{t.token_number}
                            </span>
                            <span className={`text-sm ${idx === 0 ? 'text-white font-medium' : 'text-gray-400'}`}>
                              {t.patient_name}
                            </span>
                          </div>
                          {idx === 0 && (
                            <span className="text-xs text-yellow-400 font-semibold animate-pulse">NEXT</span>
                          )}
                        </div>
                      ))
                    )}
                    {deptWaiting.length > 8 && (
                      <p className="text-gray-500 text-xs text-center">+{deptWaiting.length - 8} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 px-8 py-3 flex items-center justify-between text-gray-500 text-sm border-t border-gray-800">
        <span>Total waiting: {waiting.length} · Now serving: {nowServing.length}</span>
        <span>Updates automatically · Hope Hospital Management System</span>
      </div>
    </div>
  );
}
