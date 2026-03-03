import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, Search, Plus, X, Save } from 'lucide-react';

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

interface Corporate {
  id: string;
  name: string;
  category: string;
  status: string;
  total_claims_submitted: number;
  total_claims_approved: number;
  total_amount_pending: number;
  area_count?: number;
}

const CorporateMaster: React.FC = () => {
  const navigate = useNavigate();
  const [corporates, setCorporates] = useState<Corporate[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('government');

  const fetchCorporates = async () => {
    setLoading(true);
    const { data, error } = await db.from('corporate_master').select('id, name, category, status, total_claims_submitted, total_claims_approved, total_amount_pending').order('name');
    if (error) { toast.error('Failed to load corporates'); setLoading(false); return; }

    // Get area counts
    const { data: areas } = await db.from('corporate_areas').select('corporate_id');
    const countMap: Record<string, number> = {};
    (areas || []).forEach((a: any) => { countMap[a.corporate_id] = (countMap[a.corporate_id] || 0) + 1; });

    setCorporates((data || []).map((c: any) => ({ ...c, area_count: countMap[c.id] || 0 })));
    setLoading(false);
  };

  useEffect(() => { fetchCorporates(); }, []);

  const filtered = corporates.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || c.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const { error } = await db.from('corporate_master').insert({ name: newName.trim(), category: newCategory });
    if (error) { toast.error('Failed to add'); return; }
    toast.success('Corporate added');
    setNewName(''); setShowAdd(false);
    fetchCorporates();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Corporate Master</h1>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Corporate
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search corporates..." className="w-full pl-10 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm" />
          </div>
          <div className="flex gap-2">
            {['all', 'government', 'tpa', 'insurance'].map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-2 rounded-lg text-sm font-medium capitalize ${categoryFilter === cat ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Add Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Add Corporate</h2>
                <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Corporate Name" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm" />
                <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm">
                  <option value="government">Government</option>
                  <option value="tpa">TPA</option>
                  <option value="insurance">Insurance</option>
                </select>
                <button onClick={handleAdd} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm">Add Corporate</button>
              </div>
            </div>
          </div>
        )}

        {/* Cards */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No corporates found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => (
              <div key={c.id} onClick={() => navigate(`/corporate-master/${c.id}`)}
                className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 leading-tight">{c.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${CATEGORY_COLORS[c.category] || 'bg-gray-100 text-gray-800'}`}>{c.category}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-800'}`}>{c.status}</span>
                  <span className="text-xs text-gray-500">{c.area_count} area{c.area_count !== 1 ? 's' : ''}</span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between"><span>Claims Submitted</span><span className="font-medium text-gray-700">{c.total_claims_submitted}</span></div>
                  <div className="flex justify-between"><span>Claims Approved</span><span className="font-medium text-gray-700">{c.total_claims_approved}</span></div>
                  <div className="flex justify-between"><span>Amount Pending</span><span className="font-medium text-gray-700">₹{(c.total_amount_pending || 0).toLocaleString('en-IN')}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CorporateMaster;
