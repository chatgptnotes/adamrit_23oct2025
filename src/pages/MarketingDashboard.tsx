import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Camera, Send, Save, Edit2, Users, TrendingUp, Building2, Percent, IndianRupee, ClipboardList, CalendarCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const db = supabase as any;

const inr = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

interface DayStats {
  id?: string;
  date: string;
  doctors_contacted: number;
  admissions: number;
  discharges: number;
  occupancy_percent: number;
  revenue: number;
  plan_for_today: string;
  notes: string;
}

const emptyStats: DayStats = {
  date: new Date().toISOString().split('T')[0],
  doctors_contacted: 0, admissions: 0, discharges: 0,
  occupancy_percent: 0, revenue: 0, plan_for_today: '', notes: ''
};

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  photos?: string[];
  extracted?: any;
  saved?: boolean;
}

export default function MarketingDashboard() {
  const { toast } = useToast();
  const [today, setToday] = useState<DayStats>(emptyStats);
  const [monthRows, setMonthRows] = useState<any[]>([]);
  const [yearRows, setYearRows] = useState<any[]>([]);
  const [yesterdayRow, setYesterdayRow] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<DayStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatPhotos, setChatPhotos] = useState<File[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const yearStart = `${now.getFullYear()}-01-01`;
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

  const fetchData = async () => {
    setLoading(true);
    const [todayRes, monthRes, yearRes, yestRes] = await Promise.all([
      db.from('marketing_daily_stats').select('*').eq('date', todayStr).maybeSingle(),
      db.from('marketing_daily_stats').select('*').gte('date', monthStart).lte('date', todayStr),
      db.from('marketing_daily_stats').select('revenue').gte('date', yearStart).lte('date', todayStr),
      db.from('marketing_daily_stats').select('*').eq('date', yesterday).maybeSingle(),
    ]);
    if (todayRes.data) { setToday(todayRes.data); setForm(todayRes.data); }
    else { setToday(emptyStats); setForm(emptyStats); }
    setMonthRows(monthRes.data || []);
    setYearRows(yearRes.data || []);
    setYesterdayRow(yestRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const monthSum = (key: string) => monthRows.reduce((s: number, r: any) => s + (Number(r[key]) || 0), 0);
  const monthAvg = (key: string) => monthRows.length ? monthSum(key) / monthRows.length : 0;
  const yearSum = (key: string) => yearRows.reduce((s: number, r: any) => s + (Number(r[key]) || 0), 0);

  const saveStats = async () => {
    const payload = { ...form, date: todayStr };
    delete (payload as any).id;
    if (today.id) {
      await db.from('marketing_daily_stats').update(payload).eq('id', today.id);
    } else {
      await db.from('marketing_daily_stats').insert(payload);
    }
    toast({ title: 'Stats saved!' });
    setShowModal(false);
    fetchData();
  };

  // Photo upload
  const uploadPhotos = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const name = `marketing/${Date.now()}_${file.name}`;
      const { error } = await db.storage.from('corporate-photos').upload(name, file, { upsert: true });
      if (!error) {
        const { data } = db.storage.from('corporate-photos').getPublicUrl(name);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const sendChat = async () => {
    if (!chatInput.trim() && chatPhotos.length === 0) return;
    setChatLoading(true);
    let photoUrls: string[] = [];
    if (chatPhotos.length > 0) {
      photoUrls = await uploadPhotos(chatPhotos);
    }
    const userMsg: ChatMessage = { role: 'user', text: chatInput, photos: photoUrls };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatPhotos([]);

    try {
      const res = await fetch('/api/ai-field-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput, photos: photoUrls })
      });
      const extracted = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: '', extracted }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Failed to process. Try again.' }]);
    }
    setChatLoading(false);
  };

  const saveToMaster = async (idx: number) => {
    const msg = messages[idx];
    if (!msg.extracted) return;
    const e = msg.extracted;

    // Upsert contact
    const { data: existing } = await db.from('corporate_area_contacts')
      .select('id')
      .ilike('name', e.contactName || '')
      .maybeSingle();

    let contactId = existing?.id;
    if (!contactId && e.contactName) {
      const { data: newC } = await db.from('corporate_area_contacts').insert({
        name: e.contactName,
        designation: e.designation,
        organization: e.organization,
        area: e.area,
        location: e.location,
      }).select('id').single();
      contactId = newC?.id;
    }

    // Create meeting
    if (contactId) {
      await db.from('corporate_area_meetings').insert({
        contact_id: contactId,
        meeting_date: e.meetingDate || todayStr,
        conversation: e.conversation,
        action_items: e.actionItems,
        follow_up_date: e.followUpDate,
        follow_up_needed: e.followUpNeeded,
        photos: msg.photos || [],
      });
    }

    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, saved: true } : m));
    toast({ title: 'Saved to Corporate Master!' });
  };

  const StatCard = ({ icon: Icon, label, value, color = 'blue' }: { icon: any; label: string; value: string | number; color?: string }) => (
    <Card className="bg-white border border-gray-100 shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4 text-${color}-500`} />
          <span className="text-xs text-gray-500 truncate">{label}</span>
        </div>
        <div className="text-lg font-bold text-gray-900">{value}</div>
      </CardContent>
    </Card>
  );

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">📊 Marketing Dashboard</h1>
        <Button size="sm" onClick={() => { setForm(today.id ? today : emptyStats); setShowModal(true); }}>
          {today.id ? 'Edit Stats' : 'Update Stats'}
        </Button>
      </div>

      {/* Top: 6 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Users} label="Doctors Today" value={today.doctors_contacted} color="blue" />
        <StatCard icon={Users} label="Doctors Month" value={monthSum('doctors_contacted')} color="indigo" />
        <StatCard icon={TrendingUp} label="Admissions Yest." value={yesterdayRow?.admissions || 0} color="green" />
        <StatCard icon={TrendingUp} label="Admissions Month" value={monthSum('admissions')} color="emerald" />
        <StatCard icon={Percent} label="Occupancy Today" value={`${today.occupancy_percent}%`} color="orange" />
        <StatCard icon={Percent} label="Avg Occ. Month" value={`${monthAvg('occupancy_percent').toFixed(0)}%`} color="amber" />
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={IndianRupee} label="Revenue Today" value={inr(today.revenue)} color="green" />
        <StatCard icon={IndianRupee} label="Revenue Month" value={inr(monthSum('revenue'))} color="emerald" />
        <StatCard icon={IndianRupee} label="Revenue Year" value={inr(yearSum('revenue'))} color="teal" />
      </div>

      {/* Activity cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={Building2} label="Discharges Yest." value={yesterdayRow?.discharges || 0} color="purple" />
        <StatCard icon={Building2} label="Discharges Month" value={monthSum('discharges')} color="violet" />
        <Card className="bg-white border border-gray-100 shadow-sm col-span-2 md:col-span-1">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-gray-500">Today's Plan</span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-3">{today.plan_for_today || 'No plan set'}</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Field Assistant Chat */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-6">
        <div className="p-3 bg-blue-600 text-white font-semibold flex items-center gap-2">
          🤖 AI Field Assistant
          <span className="text-xs text-blue-200 ml-auto">Snap photos & chat about your visits</span>
        </div>
        <div className="h-80 overflow-y-auto p-3 space-y-3 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-12">
              Tell me about your field visit today...<br />
              You can attach photos too! 📸
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}>
                {msg.text && <p className="text-sm">{msg.text}</p>}
                {msg.photos && msg.photos.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {msg.photos.map((url, i) => (
                      <img key={i} src={url} className="h-20 w-20 object-cover rounded" alt="" />
                    ))}
                  </div>
                )}
                {msg.extracted && (
                  <div className="mt-2 space-y-2">
                    <div className="bg-blue-50 rounded-lg p-3 text-sm space-y-1">
                      {msg.extracted.contactName && <p><strong>Contact:</strong> {msg.extracted.contactName}</p>}
                      {msg.extracted.designation && <p><strong>Designation:</strong> {msg.extracted.designation}</p>}
                      {msg.extracted.organization && <p><strong>Organization:</strong> {msg.extracted.organization}</p>}
                      {msg.extracted.area && <p><strong>Area:</strong> {msg.extracted.area}</p>}
                      {msg.extracted.location && <p><strong>Location:</strong> {msg.extracted.location}</p>}
                      {msg.extracted.conversation && <p><strong>Notes:</strong> {msg.extracted.conversation}</p>}
                      {msg.extracted.actionItems && <p><strong>Action Items:</strong> {msg.extracted.actionItems}</p>}
                      {msg.extracted.followUpDate && <p><strong>Follow-up:</strong> {msg.extracted.followUpDate}</p>}
                    </div>
                    {!msg.saved ? (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => saveToMaster(idx)}>
                          <Save className="h-3 w-3 mr-1" /> Save to Corporate Master
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-green-600 font-medium">✅ Saved to Corporate Master</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="p-3 border-t border-gray-200 bg-white">
          {chatPhotos.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {chatPhotos.map((f, i) => (
                <div key={i} className="relative">
                  <img src={URL.createObjectURL(f)} className="h-12 w-12 object-cover rounded" alt="" />
                  <button className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center"
                    onClick={() => setChatPhotos(prev => prev.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input type="file" accept="image/*" capture="environment" multiple ref={fileInputRef} className="hidden"
              onChange={e => { if (e.target.files) setChatPhotos(prev => [...prev, ...Array.from(e.target.files!)]); }} />
            <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
              <Camera className="h-4 w-4" />
            </Button>
            <Input placeholder="Describe your visit..." value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }} />
            <Button onClick={sendChat} disabled={chatLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Update Stats Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Daily Stats</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Doctors Contacted</Label>
              <Input type="number" value={form.doctors_contacted} onChange={e => setForm({ ...form, doctors_contacted: +e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Admissions</Label>
              <Input type="number" value={form.admissions} onChange={e => setForm({ ...form, admissions: +e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Discharges</Label>
              <Input type="number" value={form.discharges} onChange={e => setForm({ ...form, discharges: +e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Occupancy %</Label>
              <Input type="number" value={form.occupancy_percent} onChange={e => setForm({ ...form, occupancy_percent: +e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Revenue ₹</Label>
              <Input type="number" value={form.revenue} onChange={e => setForm({ ...form, revenue: +e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Plan for Today</Label>
            <Textarea value={form.plan_for_today} onChange={e => setForm({ ...form, plan_for_today: e.target.value })} rows={3} />
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
          <DialogFooter>
            <Button onClick={saveStats}>Save Stats</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
