import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Camera, Send, Save, Edit2, Users, TrendingUp, Building2, Percent, IndianRupee, ClipboardList, CalendarCheck, Mic, MicOff, ImagePlus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
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
  const [isRecording, setIsRecording] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Speech recognition setup
  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({ title: 'Speech recognition not supported', description: 'Please use Chrome or Edge browser', variant: 'destructive' });
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN';

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += text + ' ';
        } else {
          interimTranscript += text;
        }
      }
      setChatInput(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

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
      const todayDate = new Date().toISOString().split('T')[0];
      const prompt = `Extract visit info as JSON. Summarize conversation professionally (2-3 sentences max).

Input: "${chatInput}"${photoUrls.length ? ` [${photoUrls.length} photos]` : ''}

Known corporates: WCL, ESIC, CGHS, ECHS, Central Railway, SECR, MPKAY, PM-JAY, MP Police

Return JSON only:
{
  "corporate": "organization name or null",
  "area": "city/area name or null", 
  "contactName": "person name or null",
  "designation": "role or null",
  "conversation": "professional summary of discussion",
  "actionItems": "action points or null",
  "followUpDate": "YYYY-MM-DD or null",
  "followUpNeeded": false,
  "marketingStaff": "staff name or null",
  "meetingDate": "${todayDate}"
}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        })
      });
      
      const data = await res.json();
      console.log('Gemini response:', data);
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('Raw text:', text);
      
      // Clean up JSON if needed
      text = text.trim();
      if (text.startsWith('```json')) text = text.slice(7);
      if (text.startsWith('```')) text = text.slice(3);
      if (text.endsWith('```')) text = text.slice(0, -3);
      text = text.trim();
      
      let extracted = JSON.parse(text);
      // Handle if Gemini returns an array instead of object
      if (Array.isArray(extracted)) {
        extracted = extracted[0];
      }
      // Auto-set marketing staff from logged-in user
      if (!extracted.marketingStaff && user?.username) {
        extracted.marketingStaff = user.username;
      }
      console.log('Extracted:', extracted);
      setMessages(prev => [...prev, { role: 'assistant', text: '', extracted }]);
    } catch (err) {
      console.error('AI Error:', err);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Failed to process. Try again.' }]);
    }
    setChatLoading(false);
  };

  const saveToMaster = async (idx: number) => {
    const msg = messages[idx];
    if (!msg.extracted) return;
    const e = msg.extracted;
    
    // Get photos from the user message (previous message)
    const userMsg = messages[idx - 1];
    const photos = userMsg?.photos || [];

    try {
      // Step 1: Find or create Corporate (e.g., WCL)
      let corporateId = null;
      if (e.corporate) {
        // Try to find existing corporate with fuzzy match
        const { data: existingCorps } = await db.from('corporate_master')
          .select('id, name')
          .or(`name.ilike.%${e.corporate}%,name.ilike.${e.corporate}%`);
        
        if (existingCorps && existingCorps.length > 0) {
          // Use the first match
          corporateId = existingCorps[0].id;
          console.log('Found existing corporate:', existingCorps[0].name);
        } else {
          const { data: newCorp } = await db.from('corporate_master')
            .insert({ name: e.corporate, category: 'government' })
            .select('id')
            .single();
          corporateId = newCorp?.id;
          console.log('Created new corporate:', e.corporate);
        }
      }

      // Step 2: Find or create Area under Corporate (e.g., Chandrapur under WCL)
      let areaId = null;
      if (e.area && corporateId) {
        // Fuzzy match for area name
        const { data: existingAreas } = await db.from('corporate_areas')
          .select('id, area_name')
          .eq('corporate_id', corporateId)
          .or(`area_name.ilike.%${e.area}%,area_name.ilike.${e.area}%`);
        
        if (existingAreas && existingAreas.length > 0) {
          areaId = existingAreas[0].id;
          console.log('Found existing area:', existingAreas[0].area_name);
        } else {
          const { data: newArea } = await db.from('corporate_areas')
            .insert({ 
              corporate_id: corporateId, 
              area_name: e.area,
              status: 'active'
            })
            .select('id')
            .single();
          areaId = newArea?.id;
          console.log('Created new area:', e.area);
        }
      }

      // Step 3: Find or create Contact under Area (e.g., Dr. Sharma)
      let contactId = null;
      if (e.contactName && areaId) {
        const { data: existingContact } = await db.from('corporate_area_contacts')
          .select('id')
          .eq('area_id', areaId)
          .ilike('name', e.contactName)
          .maybeSingle();
        
        if (existingContact) {
          contactId = existingContact.id;
        } else {
          const { data: newContact } = await db.from('corporate_area_contacts')
            .insert({
              area_id: areaId,
              name: e.contactName,
              designation: e.designation || null,
              photos: photos,
            })
            .select('id')
            .single();
          contactId = newContact?.id;
        }
      }

      // Step 4: Create Meeting record under Area
      if (areaId) {
        const { error: meetingError } = await db.from('corporate_area_meetings').insert({
          area_id: areaId,
          meeting_date: e.meetingDate || todayStr,
          person_met: e.contactName || null,
          location: e.area || null,
          conversation: e.conversation || null,
          action_requested: e.actionItems || null,
          follow_up_date: e.followUpDate || null,
          follow_up_needed: e.followUpNeeded || false,
          photos: photos,
          marketing_staff: e.marketingStaff || null,
        });
        
        if (meetingError) {
          console.error('Meeting save error:', meetingError);
          throw meetingError;
        }
      }

      setMessages(prev => prev.map((m, i) => i === idx ? { ...m, saved: true } : m));
      toast({ 
        title: 'Saved to Corporate Master!',
        description: `${e.corporate || 'Unknown'} → ${e.area || 'Unknown'} → ${e.contactName || 'Meeting recorded'}`
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Failed to save', description: 'Please try again', variant: 'destructive' });
    }
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
                      {/* Hierarchy: Corporate → Area */}
                      {(msg.extracted.corporate || msg.extracted.area) && (
                        <p className="text-blue-700 font-medium">
                          🏢 {msg.extracted.corporate || 'Unknown'} → 📍 {msg.extracted.area || 'Unknown'}
                        </p>
                      )}
                      {msg.extracted.contactName && <p><strong>👤 Contact:</strong> {msg.extracted.contactName}</p>}
                      {msg.extracted.designation && <p><strong>💼 Designation:</strong> {msg.extracted.designation}</p>}
                      {msg.extracted.marketingStaff && <p><strong>🧑‍💼 Visited by:</strong> {msg.extracted.marketingStaff}</p>}
                      {msg.extracted.conversation && <p><strong>💬 Notes:</strong> {msg.extracted.conversation}</p>}
                      {msg.extracted.actionItems && <p><strong>✅ Action Items:</strong> {msg.extracted.actionItems}</p>}
                      {msg.extracted.followUpDate && <p><strong>📅 Follow-up:</strong> {msg.extracted.followUpDate}</p>}
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
            {/* Hidden file inputs */}
            <input type="file" accept="image/*" capture="environment" multiple ref={cameraInputRef} className="hidden"
              onChange={e => { if (e.target.files) setChatPhotos(prev => [...prev, ...Array.from(e.target.files!)]); }} />
            <input type="file" accept="image/*" multiple ref={fileInputRef} className="hidden"
              onChange={e => { if (e.target.files) setChatPhotos(prev => [...prev, ...Array.from(e.target.files!)]); }} />
            
            {/* Camera/Gallery Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Camera className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => cameraInputRef.current?.click()}>
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Choose from Gallery
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant={isRecording ? "destructive" : "outline"} 
              size="icon" 
              onClick={toggleRecording}
              className={isRecording ? "animate-pulse" : ""}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
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

      {/* Sales Book Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">📖 Hope Hospital Sales Book</h2>
          <a href="/hope-sales-book.pdf" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1">
            📥 Download Full PDF (38 pages)
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[1,2,3,4,5].map(i => (
            <a key={i} href="/hope-sales-book.pdf" target="_blank" rel="noopener noreferrer" className="group">
              <img src={`/salesbook-page-${i}.png`} alt={`Sales Book Page ${i}`} className="w-full rounded-lg border border-gray-200 shadow-sm group-hover:shadow-md group-hover:ring-2 ring-blue-400 transition" />
              <p className="text-xs text-gray-500 text-center mt-1">Page {i}</p>
            </a>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">Click any page or download button to view the complete 38-page sales book</p>
      </div>
    </div>
  );
}
