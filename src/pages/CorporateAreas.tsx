import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X, MapPin, Calendar, User } from 'lucide-react';

const db = supabase as any;

const CATEGORY_COLORS: Record<string, string> = {
  government: 'bg-blue-100 text-blue-800',
  tpa: 'bg-orange-100 text-orange-800',
  insurance: 'bg-green-100 text-green-800',
};
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-gray-100 text-gray-800',
};

const CorporateAreas: React.FC = () => {
  const { corporateId } = useParams<{ corporateId: string }>();
  const navigate = useNavigate();
  const [corporate, setCorporate] = useState<any>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ area_name: '', district: '', state: 'Maharashtra' });

  const fetchData = async () => {
    setLoading(true);
    const [{ data: corp }, { data: areaData }] = await Promise.all([
      db.from('corporate_master').select('id, name, category').eq('id', corporateId).single(),
      db.from('corporate_areas').select('*').eq('corporate_id', corporateId).order('area_name'),
    ]);
    setCorporate(corp);
    setAreas(areaData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [corporateId]);

  const handleAdd = async () => {
    if (!form.area_name.trim()) return;
    const { error } = await db.from('corporate_areas').insert({ ...form, corporate_id: corporateId });
    if (error) { toast.error('Failed to add area'); return; }
    toast.success('Area added');
    setForm({ area_name: '', district: '', state: 'Maharashtra' }); setShowAdd(false);
    fetchData();
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading...</div>;
  if (!corporate) return <div className="flex items-center justify-center min-h-screen text-gray-500">Corporate not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/corporate-master')} className="p-2 rounded-lg hover:bg-gray-200"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{corporate.name}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${CATEGORY_COLORS[corporate.category] || 'bg-gray-100 text-gray-800'}`}>{corporate.category}</span>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Area
          </button>
        </div>

        {/* Add Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Add Area</h2>
                <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                <input value={form.area_name} onChange={e => setForm({ ...form, area_name: e.target.value })} placeholder="Area Name *" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm" />
                <input value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} placeholder="District" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm" />
                <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="State" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm" />
                <button onClick={handleAdd} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm">Add Area</button>
              </div>
            </div>
          </div>
        )}

        {/* Area Cards */}
        {areas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No areas added yet. Click "Add Area" to start.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map(a => (
              <div key={a.id} onClick={() => navigate(`/corporate-master/${corporateId}/area/${a.id}`)}
                className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-semibold text-gray-900">{a.area_name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-800'}`}>{a.status}</span>
                </div>
                {a.district && <div className="flex items-center gap-1 text-xs text-gray-500 mb-2"><MapPin className="w-3 h-3" />{a.district}</div>}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between"><span>Hospitals</span><span className="font-medium text-gray-700">{a.hospital_count || 0}</span></div>
                  {a.liaising_person && <div className="flex items-center gap-1"><User className="w-3 h-3" />{a.liaising_person}</div>}
                  {a.next_followup_date && (
                    <div className={`flex items-center gap-1 ${a.next_followup_date < today ? 'text-red-600 font-medium' : ''}`}>
                      <Calendar className="w-3 h-3" />Follow-up: {a.next_followup_date}
                    </div>
                  )}
                  {a.last_visit_date && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />Last visit: {a.last_visit_date}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CorporateAreas;
