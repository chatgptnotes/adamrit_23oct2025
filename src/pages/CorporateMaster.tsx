import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2, Plus, Edit, Trash2, Search, X, Users, CalendarDays,
  MapPin, Phone, Mail, UserCheck, Clock, DollarSign, Save, ChevronRight
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// Types
interface Corporate {
  id: string;
  name: string;
  category: string;
  short_name: string | null;
  areas: string | null;
  hospital_locations: string | null;
  contact_persons: any[];
  meeting_history: any[];
  visit_route: string | null;
  added_to_openclaw: boolean;
  openclaw_reminder_active: boolean;
  liaising_since: string | null;
  liaising_person: string | null;
  next_followup_date: string | null;
  renewal_date: string | null;
  followup_frequency: string;
  status: string;
  empanelment_date: string | null;
  notes: string | null;
  total_claims_submitted: number;
  total_claims_approved: number;
  total_amount_pending: number;
  hospital: string;
  created_at: string;
  updated_at: string;
}

interface Contact {
  id: string;
  corporate_id: string;
  name: string;
  designation: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
}

interface Meeting {
  id: string;
  corporate_id: string;
  meeting_date: string;
  person_met: string | null;
  location: string | null;
  conversation: string | null;
  action_taken: string | null;
  action_requested: string | null;
  follow_up_needed: boolean;
  follow_up_date: string | null;
  created_by: string | null;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  government: 'bg-blue-100 text-blue-800',
  tpa: 'bg-purple-100 text-purple-800',
  insurance: 'bg-green-100 text-green-800',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-gray-100 text-gray-800',
};

const emptyForm = (): Partial<Corporate> => ({
  name: '', category: 'government', short_name: '', areas: '', hospital_locations: '',
  visit_route: '', liaising_person: '', followup_frequency: 'monthly', status: 'active',
  notes: '', hospital: 'Hope Hospital', total_claims_submitted: 0, total_claims_approved: 0,
  total_amount_pending: 0, added_to_openclaw: false, openclaw_reminder_active: false,
});

const CorporateMaster: React.FC = () => {
  const [corporates, setCorporates] = useState<Corporate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedCorporate, setSelectedCorporate] = useState<Corporate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCorporate, setEditingCorporate] = useState<Partial<Corporate> | null>(null);
  const [formData, setFormData] = useState<Partial<Corporate>>(emptyForm());
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [contactForm, setContactForm] = useState<Partial<Contact>>({ name: '', designation: '', phone: '', email: '', is_primary: false, notes: '' });
  const [meetingForm, setMeetingForm] = useState<Partial<Meeting>>({ meeting_date: '', person_met: '', location: '', conversation: '', action_taken: '', action_requested: '', follow_up_needed: false, follow_up_date: '' });
  const [showContactForm, setShowContactForm] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const fetchCorporates = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase.from('corporate_master' as any).select('*').order('name') as any);
      if (error) throw error;
      setCorporates((data || []) as Corporate[]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load corporates');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchContacts = async (corporateId: string) => {
    const { data, error } = await (supabase.from('corporate_master_contacts' as any).select('*').eq('corporate_id', corporateId).order('is_primary', { ascending: false }) as any);
    if (!error) setContacts((data || []) as Contact[]);
  };

  const fetchMeetings = async (corporateId: string) => {
    const { data, error } = await (supabase.from('corporate_master_meetings' as any).select('*').eq('corporate_id', corporateId).order('meeting_date', { ascending: false }) as any);
    if (!error) setMeetings((data || []) as Meeting[]);
  };

  useEffect(() => { fetchCorporates(); }, [fetchCorporates]);

  useEffect(() => {
    if (selectedCorporate) {
      fetchContacts(selectedCorporate.id);
      fetchMeetings(selectedCorporate.id);
    }
  }, [selectedCorporate]);

  const filtered = corporates.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.short_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleSave = async () => {
    if (!formData.name) { toast.error('Name is required'); return; }
    try {
      const payload = { ...formData, updated_at: new Date().toISOString() };
      delete (payload as any).id; delete (payload as any).created_at;
      // Clean empty strings to null for date fields
      ['liaising_since', 'next_followup_date', 'renewal_date', 'empanelment_date'].forEach(f => {
        if (!(payload as any)[f]) (payload as any)[f] = null;
      });

      if (editingCorporate?.id) {
        const { error } = await (supabase.from('corporate_master' as any).update(payload).eq('id', editingCorporate.id) as any);
        if (error) throw error;
        toast.success('Corporate updated');
      } else {
        const { error } = await (supabase.from('corporate_master' as any).insert(payload) as any);
        if (error) throw error;
        toast.success('Corporate created');
      }
      setIsFormOpen(false);
      setEditingCorporate(null);
      setFormData(emptyForm());
      fetchCorporates();
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this corporate?')) return;
    const { error } = await (supabase.from('corporate_master' as any).delete().eq('id', id) as any);
    if (error) { toast.error('Delete failed'); return; }
    toast.success('Deleted');
    if (selectedCorporate?.id === id) setSelectedCorporate(null);
    fetchCorporates();
  };

  const handleSaveContact = async () => {
    if (!contactForm.name || !selectedCorporate) return;
    try {
      if (editingContact) {
        const { error } = await (supabase.from('corporate_master_contacts' as any).update({
          name: contactForm.name, designation: contactForm.designation || null,
          phone: contactForm.phone || null, email: contactForm.email || null,
          is_primary: contactForm.is_primary || false, notes: contactForm.notes || null,
        }).eq('id', editingContact.id) as any);
        if (error) throw error;
        toast.success('Contact updated');
      } else {
        const { error } = await (supabase.from('corporate_master_contacts' as any).insert({
          corporate_id: selectedCorporate.id, name: contactForm.name,
          designation: contactForm.designation || null, phone: contactForm.phone || null,
          email: contactForm.email || null, is_primary: contactForm.is_primary || false,
          notes: contactForm.notes || null,
        }) as any);
        if (error) throw error;
        toast.success('Contact added');
      }
      setShowContactForm(false);
      setEditingContact(null);
      setContactForm({ name: '', designation: '', phone: '', email: '', is_primary: false, notes: '' });
      fetchContacts(selectedCorporate.id);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteContact = async (id: string) => {
    if (!selectedCorporate) return;
    const { error } = await (supabase.from('corporate_master_contacts' as any).delete().eq('id', id) as any);
    if (!error) { toast.success('Contact deleted'); fetchContacts(selectedCorporate.id); }
  };

  const handleSaveMeeting = async () => {
    if (!meetingForm.meeting_date || !selectedCorporate) return;
    try {
      const { error } = await (supabase.from('corporate_master_meetings' as any).insert({
        corporate_id: selectedCorporate.id, meeting_date: meetingForm.meeting_date,
        person_met: meetingForm.person_met || null, location: meetingForm.location || null,
        conversation: meetingForm.conversation || null, action_taken: meetingForm.action_taken || null,
        action_requested: meetingForm.action_requested || null,
        follow_up_needed: meetingForm.follow_up_needed || false,
        follow_up_date: meetingForm.follow_up_date || null,
      }) as any);
      if (error) throw error;
      toast.success('Meeting added');
      setShowMeetingForm(false);
      setMeetingForm({ meeting_date: '', person_met: '', location: '', conversation: '', action_taken: '', action_requested: '', follow_up_needed: false, follow_up_date: '' });
      fetchMeetings(selectedCorporate.id);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!selectedCorporate) return;
    const { error } = await (supabase.from('corporate_master_meetings' as any).delete().eq('id', id) as any);
    if (!error) { toast.success('Meeting deleted'); fetchMeetings(selectedCorporate.id); }
  };

  const handleSaveFollowup = async () => {
    if (!selectedCorporate) return;
    const { error } = await (supabase.from('corporate_master' as any).update({
      next_followup_date: formData.next_followup_date || null,
      renewal_date: formData.renewal_date || null,
      followup_frequency: formData.followup_frequency,
      openclaw_reminder_active: formData.openclaw_reminder_active,
      updated_at: new Date().toISOString(),
    }).eq('id', selectedCorporate.id) as any);
    if (!error) {
      toast.success('Follow-up settings saved');
      fetchCorporates();
      // Update selected corporate locally
      setSelectedCorporate(prev => prev ? { ...prev, next_followup_date: formData.next_followup_date || null, renewal_date: formData.renewal_date || null, followup_frequency: formData.followup_frequency || 'monthly', openclaw_reminder_active: formData.openclaw_reminder_active || false } : null);
    }
  };

  const handleSaveFinancials = async () => {
    if (!selectedCorporate) return;
    const { error } = await (supabase.from('corporate_master' as any).update({
      total_claims_submitted: formData.total_claims_submitted || 0,
      total_claims_approved: formData.total_claims_approved || 0,
      total_amount_pending: formData.total_amount_pending || 0,
      updated_at: new Date().toISOString(),
    }).eq('id', selectedCorporate.id) as any);
    if (!error) { toast.success('Financials saved'); fetchCorporates(); }
  };

  const openEdit = (corp: Corporate) => {
    setEditingCorporate(corp);
    setFormData({ ...corp });
    setIsFormOpen(true);
  };

  const openAdd = () => {
    setEditingCorporate(null);
    setFormData(emptyForm());
    setIsFormOpen(true);
  };

  const selectCorporate = (corp: Corporate) => {
    setSelectedCorporate(corp);
    setFormData({ ...corp });
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Corporate Master</h1>
          <Badge variant="outline" className="ml-2">{filtered.length} corporates</Badge>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Corporate</Button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search corporates..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="government">Government</SelectItem>
            <SelectItem value="tpa">TPA</SelectItem>
            <SelectItem value="insurance">Insurance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4">
        {/* List */}
        <div className={`${selectedCorporate ? 'w-1/3' : 'w-full'} transition-all`}>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No corporates found</div>
          ) : (
            <div className="space-y-2 max-h-[75vh] overflow-y-auto">
              {filtered.map(corp => (
                <Card key={corp.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${selectedCorporate?.id === corp.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => selectCorporate(corp)}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm truncate">{corp.name}</span>
                          <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          <Badge className={`text-xs ${CATEGORY_COLORS[corp.category] || ''}`}>{corp.category}</Badge>
                          <Badge className={`text-xs ${STATUS_COLORS[corp.status] || ''}`}>{corp.status}</Badge>
                        </div>
                        {corp.areas && <p className="text-xs text-gray-500 truncate"><MapPin className="inline h-3 w-3 mr-1" />{corp.areas}</p>}
                        <div className="flex gap-3 text-xs text-gray-500 mt-1">
                          {corp.next_followup_date && <span><CalendarDays className="inline h-3 w-3 mr-1" />Follow-up: {corp.next_followup_date}</span>}
                          {corp.liaising_since && <span><Clock className="inline h-3 w-3 mr-1" />Since: {corp.liaising_since}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); openEdit(corp); }}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); handleDelete(corp.id); }}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedCorporate && (
          <div className="w-2/3">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedCorporate.name}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge className={CATEGORY_COLORS[selectedCorporate.category]}>{selectedCorporate.category}</Badge>
                      <Badge className={STATUS_COLORS[selectedCorporate.status]}>{selectedCorporate.status}</Badge>
                      {selectedCorporate.hospital && <Badge variant="outline">{selectedCorporate.hospital}</Badge>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCorporate(null)}><X className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    <TabsTrigger value="meetings">Meetings</TabsTrigger>
                    <TabsTrigger value="followups">Follow-ups</TabsTrigger>
                    <TabsTrigger value="financials">Financials</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-3 mt-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><Label className="text-gray-500">Short Name</Label><p>{selectedCorporate.short_name || '—'}</p></div>
                      <div><Label className="text-gray-500">Category</Label><p className="capitalize">{selectedCorporate.category}</p></div>
                      <div><Label className="text-gray-500">Status</Label><p className="capitalize">{selectedCorporate.status}</p></div>
                      <div><Label className="text-gray-500">Hospital</Label><p>{selectedCorporate.hospital}</p></div>
                      <div><Label className="text-gray-500">Areas</Label><p>{selectedCorporate.areas || '—'}</p></div>
                      <div><Label className="text-gray-500">Hospital Locations</Label><p>{selectedCorporate.hospital_locations || '—'}</p></div>
                      <div><Label className="text-gray-500">Visit Route</Label><p>{selectedCorporate.visit_route || '—'}</p></div>
                      <div><Label className="text-gray-500">Liaising Since</Label><p>{selectedCorporate.liaising_since || '—'}</p></div>
                      <div><Label className="text-gray-500">Liaising Person</Label><p>{selectedCorporate.liaising_person || '—'}</p></div>
                      <div><Label className="text-gray-500">Empanelment Date</Label><p>{selectedCorporate.empanelment_date || '—'}</p></div>
                      <div><Label className="text-gray-500">Renewal Date</Label><p>{selectedCorporate.renewal_date || '—'}</p></div>
                      <div><Label className="text-gray-500">OpenClaw</Label><p>{selectedCorporate.added_to_openclaw ? '✅ Added' : '❌ Not Added'}</p></div>
                    </div>
                    {selectedCorporate.notes && <div><Label className="text-gray-500">Notes</Label><p className="text-sm mt-1 bg-gray-50 p-2 rounded">{selectedCorporate.notes}</p></div>}
                  </TabsContent>

                  {/* Contacts Tab */}
                  <TabsContent value="contacts" className="mt-3">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-sm flex items-center gap-1"><Users className="h-4 w-4" />Contact Persons ({contacts.length})</h3>
                      <Button size="sm" onClick={() => { setShowContactForm(true); setEditingContact(null); setContactForm({ name: '', designation: '', phone: '', email: '', is_primary: false, notes: '' }); }}><Plus className="h-3 w-3 mr-1" />Add</Button>
                    </div>
                    {showContactForm && (
                      <Card className="mb-3">
                        <CardContent className="p-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div><Label>Name *</Label><Input value={contactForm.name || ''} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} /></div>
                            <div><Label>Designation</Label><Input value={contactForm.designation || ''} onChange={e => setContactForm(p => ({ ...p, designation: e.target.value }))} /></div>
                            <div><Label>Phone</Label><Input value={contactForm.phone || ''} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} /></div>
                            <div><Label>Email</Label><Input value={contactForm.email || ''} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} /></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={contactForm.is_primary || false} onChange={e => setContactForm(p => ({ ...p, is_primary: e.target.checked }))} />
                            <Label>Primary Contact</Label>
                          </div>
                          <div><Label>Notes</Label><Input value={contactForm.notes || ''} onChange={e => setContactForm(p => ({ ...p, notes: e.target.value }))} /></div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveContact}><Save className="h-3 w-3 mr-1" />Save</Button>
                            <Button size="sm" variant="outline" onClick={() => { setShowContactForm(false); setEditingContact(null); }}>Cancel</Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead><TableHead>Designation</TableHead>
                          <TableHead>Phone</TableHead><TableHead>Email</TableHead>
                          <TableHead>Primary</TableHead><TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contacts.map(c => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell>{c.designation || '—'}</TableCell>
                            <TableCell>{c.phone ? <a href={`tel:${c.phone}`} className="text-blue-600">{c.phone}</a> : '—'}</TableCell>
                            <TableCell>{c.email ? <a href={`mailto:${c.email}`} className="text-blue-600">{c.email}</a> : '—'}</TableCell>
                            <TableCell>{c.is_primary ? <UserCheck className="h-4 w-4 text-green-600" /> : ''}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => {
                                  setEditingContact(c);
                                  setContactForm({ name: c.name, designation: c.designation, phone: c.phone, email: c.email, is_primary: c.is_primary, notes: c.notes });
                                  setShowContactForm(true);
                                }}><Edit className="h-3 w-3" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteContact(c.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {contacts.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-gray-400">No contacts yet</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  {/* Meetings Tab */}
                  <TabsContent value="meetings" className="mt-3">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-sm flex items-center gap-1"><CalendarDays className="h-4 w-4" />Meeting History ({meetings.length})</h3>
                      <Button size="sm" onClick={() => setShowMeetingForm(true)}><Plus className="h-3 w-3 mr-1" />Add Meeting</Button>
                    </div>
                    {showMeetingForm && (
                      <Card className="mb-3">
                        <CardContent className="p-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div><Label>Date *</Label><Input type="date" value={meetingForm.meeting_date || ''} onChange={e => setMeetingForm(p => ({ ...p, meeting_date: e.target.value }))} /></div>
                            <div><Label>Person Met</Label><Input value={meetingForm.person_met || ''} onChange={e => setMeetingForm(p => ({ ...p, person_met: e.target.value }))} /></div>
                            <div><Label>Location</Label><Input value={meetingForm.location || ''} onChange={e => setMeetingForm(p => ({ ...p, location: e.target.value }))} /></div>
                            <div><Label>Follow-up Date</Label><Input type="date" value={meetingForm.follow_up_date || ''} onChange={e => setMeetingForm(p => ({ ...p, follow_up_date: e.target.value }))} /></div>
                          </div>
                          <div><Label>Conversation</Label><Textarea value={meetingForm.conversation || ''} onChange={e => setMeetingForm(p => ({ ...p, conversation: e.target.value }))} rows={2} /></div>
                          <div className="grid grid-cols-2 gap-2">
                            <div><Label>Action Taken</Label><Input value={meetingForm.action_taken || ''} onChange={e => setMeetingForm(p => ({ ...p, action_taken: e.target.value }))} /></div>
                            <div><Label>Action Requested</Label><Input value={meetingForm.action_requested || ''} onChange={e => setMeetingForm(p => ({ ...p, action_requested: e.target.value }))} /></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={meetingForm.follow_up_needed || false} onChange={e => setMeetingForm(p => ({ ...p, follow_up_needed: e.target.checked }))} />
                            <Label>Follow-up Needed</Label>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveMeeting}><Save className="h-3 w-3 mr-1" />Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setShowMeetingForm(false)}>Cancel</Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {meetings.map(m => (
                        <Card key={m.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline">{m.meeting_date}</Badge>
                                  {m.person_met && <span className="text-sm font-medium">{m.person_met}</span>}
                                  {m.location && <span className="text-xs text-gray-500"><MapPin className="inline h-3 w-3" /> {m.location}</span>}
                                </div>
                                {m.conversation && <p className="text-sm text-gray-700 mb-1">{m.conversation}</p>}
                                {m.action_taken && <p className="text-xs text-green-700">✅ Action: {m.action_taken}</p>}
                                {m.action_requested && <p className="text-xs text-orange-700">📋 Requested: {m.action_requested}</p>}
                                {m.follow_up_needed && m.follow_up_date && <p className="text-xs text-blue-700">📅 Follow-up: {m.follow_up_date}</p>}
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteMeeting(m.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {meetings.length === 0 && <p className="text-center text-gray-400 py-4">No meetings recorded</p>}
                    </div>
                  </TabsContent>

                  {/* Follow-ups Tab */}
                  <TabsContent value="followups" className="mt-3 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Next Follow-up Date</Label>
                        <Input type="date" value={formData.next_followup_date || ''} onChange={e => setFormData(p => ({ ...p, next_followup_date: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Renewal Date</Label>
                        <Input type="date" value={formData.renewal_date || ''} onChange={e => setFormData(p => ({ ...p, renewal_date: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Follow-up Frequency</Label>
                        <Select value={formData.followup_frequency || 'monthly'} onValueChange={v => setFormData(p => ({ ...p, followup_frequency: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="half-yearly">Half-yearly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={formData.openclaw_reminder_active || false} onChange={e => setFormData(p => ({ ...p, openclaw_reminder_active: e.target.checked }))} />
                          <Label>Reminder Active</Label>
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleSaveFollowup}><Save className="h-4 w-4 mr-1" />Save Follow-up Settings</Button>
                  </TabsContent>

                  {/* Financials Tab */}
                  <TabsContent value="financials" className="mt-3 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-gray-500">Claims Submitted</p>
                          <Input type="number" className="text-center text-xl font-bold mt-1" value={formData.total_claims_submitted || 0} onChange={e => setFormData(p => ({ ...p, total_claims_submitted: Number(e.target.value) }))} />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-gray-500">Claims Approved</p>
                          <Input type="number" className="text-center text-xl font-bold mt-1" value={formData.total_claims_approved || 0} onChange={e => setFormData(p => ({ ...p, total_claims_approved: Number(e.target.value) }))} />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-gray-500">Amount Pending (₹)</p>
                          <Input type="number" className="text-center text-xl font-bold mt-1" value={formData.total_amount_pending || 0} onChange={e => setFormData(p => ({ ...p, total_amount_pending: Number(e.target.value) }))} />
                        </CardContent>
                      </Card>
                    </div>
                    <Button onClick={handleSaveFinancials}><Save className="h-4 w-4 mr-1" />Save Financials</Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCorporate?.id ? 'Edit Corporate' : 'Add Corporate'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name *</Label><Input value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Short Name</Label><Input value={formData.short_name || ''} onChange={e => setFormData(p => ({ ...p, short_name: e.target.value }))} /></div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category || 'government'} onValueChange={v => setFormData(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="tpa">TPA</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status || 'active'} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Hospital</Label><Input value={formData.hospital || 'Hope Hospital'} onChange={e => setFormData(p => ({ ...p, hospital: e.target.value }))} /></div>
              <div><Label>Empanelment Date</Label><Input type="date" value={formData.empanelment_date || ''} onChange={e => setFormData(p => ({ ...p, empanelment_date: e.target.value }))} /></div>
            </div>
            <div><Label>Areas</Label><Input value={formData.areas || ''} onChange={e => setFormData(p => ({ ...p, areas: e.target.value }))} placeholder="Geographic coverage areas" /></div>
            <div><Label>Hospital Locations</Label><Input value={formData.hospital_locations || ''} onChange={e => setFormData(p => ({ ...p, hospital_locations: e.target.value }))} /></div>
            <div><Label>Visit Route</Label><Input value={formData.visit_route || ''} onChange={e => setFormData(p => ({ ...p, visit_route: e.target.value }))} placeholder="e.g. Ballarpur → Chandrapur → Nagpur" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Liaising Since</Label><Input type="date" value={formData.liaising_since || ''} onChange={e => setFormData(p => ({ ...p, liaising_since: e.target.value }))} /></div>
              <div><Label>Liaising Person</Label><Input value={formData.liaising_person || ''} onChange={e => setFormData(p => ({ ...p, liaising_person: e.target.value }))} /></div>
              <div><Label>Next Follow-up</Label><Input type="date" value={formData.next_followup_date || ''} onChange={e => setFormData(p => ({ ...p, next_followup_date: e.target.value }))} /></div>
              <div><Label>Renewal Date</Label><Input type="date" value={formData.renewal_date || ''} onChange={e => setFormData(p => ({ ...p, renewal_date: e.target.value }))} /></div>
              <div>
                <Label>Follow-up Frequency</Label>
                <Select value={formData.followup_frequency || 'monthly'} onValueChange={v => setFormData(p => ({ ...p, followup_frequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="half-yearly">Half-yearly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2"><input type="checkbox" checked={formData.added_to_openclaw || false} onChange={e => setFormData(p => ({ ...p, added_to_openclaw: e.target.checked }))} />Added to OpenClaw</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={formData.openclaw_reminder_active || false} onChange={e => setFormData(p => ({ ...p, openclaw_reminder_active: e.target.checked }))} />Reminder Active</label>
            </div>
            <div><Label>Notes</Label><Textarea value={formData.notes || ''} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={3} /></div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave}><Save className="h-4 w-4 mr-1" />{editingCorporate?.id ? 'Update' : 'Create'}</Button>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CorporateMaster;
