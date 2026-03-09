import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, MapPin, Route, Users, Calendar, DollarSign, Bell, Plus, Trash2, Edit, Save, X, Phone, Mail, Building2, Camera } from 'lucide-react';

const db = supabase as any;

const STATUS_OPTIONS = ['active', 'expired', 'pending', 'suspended'];
const FREQ_OPTIONS = ['monthly', 'quarterly', 'half-yearly', 'yearly'];
const STATUS_COLORS: Record<string, string> = { active: 'bg-green-100 text-green-800', expired: 'bg-red-100 text-red-800', pending: 'bg-yellow-100 text-yellow-800', suspended: 'bg-gray-100 text-gray-800' };

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ icon, title, children, action }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2"><span className="text-blue-600">{icon}</span><h2 className="text-lg font-bold text-gray-900">{title}</h2></div>
      {action}
    </div>
    {children}
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div><label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>{children}</div>
);

const CorporateAreaDetail: React.FC = () => {
  const { corporateId, areaId } = useParams<{ corporateId: string; areaId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'superadmin' || user?.role === 'super_admin' || user?.role === 'admin';
  const [corporate, setCorporate] = useState<any>(null);
  const [area, setArea] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editOverview, setEditOverview] = useState(false);
  const [editRoute, setEditRoute] = useState(false);
  const [editFollowup, setEditFollowup] = useState(false);
  const [editFinancials, setEditFinancials] = useState(false);
  const [overviewForm, setOverviewForm] = useState<any>({});
  const [routeForm, setRouteForm] = useState<any>({});
  const [followupForm, setFollowupForm] = useState<any>({});
  const [financialForm, setFinancialForm] = useState<any>({});

  // Contact add
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactForm, setContactForm] = useState<any>({ name: '', designation: '', phone: '', email: '', is_primary: false, notes: '', photo_url: '', photos: [] as string[] });
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  // Meeting add
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ meeting_date: '', person_met: '', location: '', conversation: '', action_taken: '', action_requested: '', follow_up_needed: false, follow_up_date: '' });

  const fetchAll = async () => {
    setLoading(true);
    let contactQuery = db.from('corporate_area_contacts').select('*').eq('area_id', areaId);
    let meetingQuery = db.from('corporate_area_meetings').select('*').eq('area_id', areaId);
    // Non-admin users only see their own contacts and meetings
    if (!isAdmin && user?.email) {
      contactQuery = contactQuery.eq('created_by', user.email);
      meetingQuery = meetingQuery.eq('created_by', user.email);
    }
    const [{ data: corp }, { data: areaData }, { data: contactData }, { data: meetingData }] = await Promise.all([
      db.from('corporate_master').select('id, name, category').eq('id', corporateId).single(),
      db.from('corporate_areas').select('*').eq('id', areaId).single(),
      contactQuery.order('is_primary', { ascending: false }),
      meetingQuery.order('meeting_date', { ascending: false }),
    ]);
    setCorporate(corp);
    setArea(areaData);
    if (areaData) {
      setOverviewForm({ area_name: areaData.area_name, district: areaData.district, state: areaData.state, status: areaData.status, hospitals: areaData.hospitals, hospital_count: areaData.hospital_count, notes: areaData.notes, dispensaries: areaData.dispensaries, empanelled_hospitals: areaData.empanelled_hospitals, key_mines: areaData.key_mines, csr_programs: areaData.csr_programs, pharmacy_info: areaData.pharmacy_info, tertiary_referrals: areaData.tertiary_referrals, employee_count: areaData.employee_count, dependent_count: areaData.dependent_count, bed_count: areaData.bed_count, specialties_available: areaData.specialties_available, ambulance_available: areaData.ambulance_available, emergency_services: areaData.emergency_services });
      setRouteForm({ visit_route: areaData.visit_route, distance_km: areaData.distance_km, travel_time: areaData.travel_time, last_visit_date: areaData.last_visit_date, google_maps_link: areaData.google_maps_link });
      setFollowupForm({ next_followup_date: areaData.next_followup_date, renewal_date: areaData.renewal_date, followup_frequency: areaData.followup_frequency, liaising_person: areaData.liaising_person, liaising_since: areaData.liaising_since, added_to_openclaw: areaData.added_to_openclaw });
      setFinancialForm({ total_claims_submitted: areaData.total_claims_submitted, total_claims_approved: areaData.total_claims_approved, total_amount_pending: areaData.total_amount_pending });
    }
    setContacts(contactData || []);
    setMeetings(meetingData || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [areaId]);

  const saveSection = async (fields: any) => {
    const { error } = await db.from('corporate_areas').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', areaId);
    if (error) { toast.error('Save failed'); return false; }
    toast.success('Saved');
    fetchAll();
    return true;
  };

  const deleteArea = async () => {
    if (!confirm('Delete this area and all its contacts/meetings?')) return;
    await db.from('corporate_areas').delete().eq('id', areaId);
    toast.success('Area deleted');
    navigate(`/corporate-master/${corporateId}`);
  };

  // Contact CRUD
  const addContact = async () => {
    if (!contactForm.name.trim()) return;
    if (editingContactId) {
      await db.from('corporate_area_contacts').update(contactForm).eq('id', editingContactId);
      setEditingContactId(null);
    } else {
      await db.from('corporate_area_contacts').insert({ ...contactForm, area_id: areaId, created_by: user?.email || null });
    }
    toast.success('Contact saved');
    setContactForm({ name: '', designation: '', phone: '', email: '', is_primary: false, notes: '', dietary_preference: 'vegetarian', drinks_alcohol: 'no', personal_habits: '', gratification_type: '', gratification_details: '', family_details: '', birthday: '', anniversary: '', interests: '', photo_url: '', photos: [] });
    setShowAddContact(false);
    fetchAll();
  };

  const deleteContact = async (id: string) => {
    await db.from('corporate_area_contacts').delete().eq('id', id);
    toast.success('Contact deleted');
    fetchAll();
  };

  const startEditContact = (c: any) => {
    setContactForm({ name: c.name, designation: c.designation || '', phone: c.phone || '', email: c.email || '', is_primary: c.is_primary, notes: c.notes || '', dietary_preference: c.dietary_preference || 'vegetarian', drinks_alcohol: c.drinks_alcohol || 'no', personal_habits: c.personal_habits || '', gratification_type: c.gratification_type || '', gratification_details: c.gratification_details || '', family_details: c.family_details || '', birthday: c.birthday || '', anniversary: c.anniversary || '', interests: c.interests || '', photo_url: c.photo_url || '', photos: c.photos || [] });
    setEditingContactId(c.id);
    setShowAddContact(true);
  };

  // Meeting CRUD
  const addMeeting = async () => {
    if (!meetingForm.meeting_date) return;
    await db.from('corporate_area_meetings').insert({ ...meetingForm, area_id: areaId, follow_up_date: meetingForm.follow_up_date || null, created_by: user?.email || null });
    toast.success('Meeting added');
    setMeetingForm({ meeting_date: '', person_met: '', location: '', conversation: '', action_taken: '', action_requested: '', follow_up_needed: false, follow_up_date: '' });
    setShowAddMeeting(false);
    fetchAll();
  };

  const deleteMeeting = async (id: string) => {
    await db.from('corporate_area_meetings').delete().eq('id', id);
    toast.success('Meeting deleted');
    fetchAll();
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `contacts/profile-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await db.storage.from('corporate-photos').upload(path, file);
    if (error) { toast.error('Upload failed'); return; }
    const { data: { publicUrl } } = db.storage.from('corporate-photos').getPublicUrl(path);
    setContactForm({ ...contactForm, photo_url: publicUrl });
    toast.success('Photo uploaded!');
  };

  const handleMultiPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const urls: string[] = [...(contactForm.photos || [])];
    for (const file of files) {
      const path = `contacts/photos-${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`;
      const { error } = await db.storage.from('corporate-photos').upload(path, file);
      if (!error) {
        const { data: { publicUrl } } = db.storage.from('corporate-photos').getPublicUrl(path);
        urls.push(publicUrl);
      }
    }
    setContactForm({ ...contactForm, photos: urls });
    toast.success(`${files.length} photo(s) uploaded!`);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading...</div>;
  if (!area || !corporate) return <div className="flex items-center justify-center min-h-screen text-gray-500">Not found</div>;

  const inp = "w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm";
  const btn = "bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Hero Banner Section */}
        <div className="relative mb-6 rounded-xl overflow-hidden">
          <div className="h-48 md:h-64 bg-gradient-to-r from-blue-600 to-blue-800 relative">
            {area.banner_photo ? (
              <img src={area.banner_photo} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 text-lg">📷 Click to add banner photo</div>
            )}
            <label className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-700 px-3 py-1.5 rounded-lg text-sm cursor-pointer flex items-center gap-1 shadow">
              📷 Change Banner
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const path = `areas/${areaId}/banner-${Date.now()}.${file.name.split('.').pop()}`;
                const { error } = await db.storage.from('corporate-photos').upload(path, file);
                if (error) { toast.error('Upload failed'); return; }
                const { data: { publicUrl } } = db.storage.from('corporate-photos').getPublicUrl(path);
                await db.from('corporate_areas').update({ banner_photo: publicUrl }).eq('id', areaId);
                toast.success('Banner updated!');
                fetchAll();
              }} />
            </label>
            {/* Back button overlay */}
            <button onClick={() => navigate(`/corporate-master/${corporateId}`)} className="absolute top-3 left-3 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg shadow"><ArrowLeft className="w-5 h-5" /></button>
            {/* Delete button overlay */}
            <button onClick={deleteArea} className="absolute top-3 right-44 bg-white/90 hover:bg-white text-red-500 p-2 rounded-lg shadow"><Trash2 className="w-4 h-4" /></button>
          </div>
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg">
                {area.profile_photo ? (
                  <img src={area.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">🏥</div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow hover:bg-blue-700">
                📷
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const path = `areas/${areaId}/profile-${Date.now()}.${file.name.split('.').pop()}`;
                  const { error } = await db.storage.from('corporate-photos').upload(path, file);
                  if (error) { toast.error('Upload failed'); return; }
                  const { data: { publicUrl } } = db.storage.from('corporate-photos').getPublicUrl(path);
                  await db.from('corporate_areas').update({ profile_photo: publicUrl }).eq('id', areaId);
                  toast.success('Profile photo updated!');
                  fetchAll();
                }} />
              </label>
            </div>
          </div>
        </div>
        <div className="h-14 flex items-end pl-36 md:pl-44 pb-1">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{area.area_name}</h1>
            <div className="text-xs text-gray-500">{corporate.name} · <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[area.status] || ''}`}>{area.status}</span></div>
          </div>
        </div>

        {/* Section 1: Overview */}
        <Section icon={<Building2 className="w-5 h-5" />} title="Area Overview" action={
          !editOverview ? <button onClick={() => setEditOverview(true)} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Edit className="w-3 h-3" />Edit</button> : null
        }>
          {editOverview ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Area Name"><input value={overviewForm.area_name || ''} onChange={e => setOverviewForm({ ...overviewForm, area_name: e.target.value })} className={inp} /></Field>
              <Field label="District"><input value={overviewForm.district || ''} onChange={e => setOverviewForm({ ...overviewForm, district: e.target.value })} className={inp} /></Field>
              <Field label="State"><input value={overviewForm.state || ''} onChange={e => setOverviewForm({ ...overviewForm, state: e.target.value })} className={inp} /></Field>
              <Field label="Status">
                <select value={overviewForm.status || 'active'} onChange={e => setOverviewForm({ ...overviewForm, status: e.target.value })} className={inp}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Hospitals"><input value={overviewForm.hospitals || ''} onChange={e => setOverviewForm({ ...overviewForm, hospitals: e.target.value })} className={inp} /></Field>
              <Field label="Hospital Count"><input type="number" value={overviewForm.hospital_count || 0} onChange={e => setOverviewForm({ ...overviewForm, hospital_count: parseInt(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="Bed Count"><input type="number" value={overviewForm.bed_count || 0} onChange={e => setOverviewForm({ ...overviewForm, bed_count: parseInt(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="Specialties Available"><input value={overviewForm.specialties_available || ''} onChange={e => setOverviewForm({ ...overviewForm, specialties_available: e.target.value })} className={inp} placeholder="e.g. Ortho, General Surgery, Medicine" /></Field>
              <div className="md:col-span-2"><Field label="Dispensaries"><textarea value={overviewForm.dispensaries || ''} onChange={e => setOverviewForm({ ...overviewForm, dispensaries: e.target.value })} className={inp} rows={2} placeholder="List of dispensaries in this area" /></Field></div>
              <div className="md:col-span-2"><Field label="Empanelled Super-Specialty Hospitals"><textarea value={overviewForm.empanelled_hospitals || ''} onChange={e => setOverviewForm({ ...overviewForm, empanelled_hospitals: e.target.value })} className={inp} rows={2} placeholder="Hospitals this area refers patients to" /></Field></div>
              <div className="md:col-span-2"><Field label="Tertiary Care Referrals"><textarea value={overviewForm.tertiary_referrals || ''} onChange={e => setOverviewForm({ ...overviewForm, tertiary_referrals: e.target.value })} className={inp} rows={2} placeholder="Where patients go for specialized treatment" /></Field></div>
              <div className="md:col-span-2"><Field label="Key Mines / Collieries / Facilities"><textarea value={overviewForm.key_mines || ''} onChange={e => setOverviewForm({ ...overviewForm, key_mines: e.target.value })} className={inp} rows={2} placeholder="Mining operations, factories, units served by this area" /></Field></div>
              <div className="md:col-span-2"><Field label="Pharmacy / AMRIT Info"><input value={overviewForm.pharmacy_info || ''} onChange={e => setOverviewForm({ ...overviewForm, pharmacy_info: e.target.value })} className={inp} placeholder="AMRIT Pharmacy, Jan Aushadhi, etc." /></Field></div>
              <div className="md:col-span-2"><Field label="CSR Programs"><input value={overviewForm.csr_programs || ''} onChange={e => setOverviewForm({ ...overviewForm, csr_programs: e.target.value })} className={inp} placeholder="e.g. SUSHRUTA — sickle cell screening" /></Field></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field label="Employee Count"><input type="number" value={overviewForm.employee_count || 0} onChange={e => setOverviewForm({ ...overviewForm, employee_count: parseInt(e.target.value) || 0 })} className={inp} /></Field>
                <Field label="Dependent Count"><input type="number" value={overviewForm.dependent_count || 0} onChange={e => setOverviewForm({ ...overviewForm, dependent_count: parseInt(e.target.value) || 0 })} className={inp} /></Field>
                <div className="flex items-center gap-2 pt-5"><input type="checkbox" checked={overviewForm.ambulance_available || false} onChange={e => setOverviewForm({ ...overviewForm, ambulance_available: e.target.checked })} /><span className="text-sm text-gray-700">🚑 Ambulance Available</span></div>
                <div className="flex items-center gap-2 pt-5"><input type="checkbox" checked={overviewForm.emergency_services || false} onChange={e => setOverviewForm({ ...overviewForm, emergency_services: e.target.checked })} /><span className="text-sm text-gray-700">🆘 Emergency Services</span></div>
              </div>
              <div className="md:col-span-2"><Field label="Notes"><textarea value={overviewForm.notes || ''} onChange={e => setOverviewForm({ ...overviewForm, notes: e.target.value })} className={inp} rows={3} /></Field></div>
              <div className="md:col-span-2 flex gap-2">
                <button onClick={async () => { if (await saveSection(overviewForm)) setEditOverview(false); }} className={btn}><Save className="w-4 h-4 inline mr-1" />Save</button>
                <button onClick={() => setEditOverview(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">District:</span> <span className="text-gray-900">{area.district || '—'}</span></div>
              <div><span className="text-gray-500">State:</span> <span className="text-gray-900">{area.state || '—'}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[area.status] || ''}`}>{area.status}</span></div>
              <div><span className="text-gray-500">Hospitals:</span> <span className="text-gray-900">{area.hospitals || '—'}</span></div>
              <div><span className="text-gray-500">Hospital Count:</span> <span className="text-gray-900">{area.hospital_count || 0}</span> {area.bed_count > 0 && <span className="text-gray-500 ml-2">| Beds: {area.bed_count}</span>}</div>
              {area.dispensaries && <div className="md:col-span-2"><span className="text-gray-500">🏥 Dispensaries:</span> <span className="text-gray-900">{area.dispensaries}</span></div>}
              {area.empanelled_hospitals && <div className="md:col-span-2"><span className="text-gray-500">⭐ Empanelled Super-Specialty:</span> <span className="text-gray-900">{area.empanelled_hospitals}</span></div>}
              {area.tertiary_referrals && <div className="md:col-span-2"><span className="text-gray-500">🔬 Tertiary Referrals:</span> <span className="text-gray-900">{area.tertiary_referrals}</span></div>}
              {area.key_mines && <div className="md:col-span-2"><span className="text-gray-500">⛏️ Key Mines/Facilities:</span> <span className="text-gray-900">{area.key_mines}</span></div>}
              {area.specialties_available && <div className="md:col-span-2"><span className="text-gray-500">🩺 Specialties:</span> <span className="text-gray-900">{area.specialties_available}</span></div>}
              {area.pharmacy_info && <div className="md:col-span-2"><span className="text-gray-500">💊 Pharmacy:</span> <span className="text-gray-900">{area.pharmacy_info}</span></div>}
              {area.csr_programs && <div className="md:col-span-2"><span className="text-gray-500">🤝 CSR Programs:</span> <span className="text-gray-900">{area.csr_programs}</span></div>}
              <div className="flex flex-wrap gap-3">
                {(area.employee_count > 0 || area.dependent_count > 0) && <div><span className="text-gray-500">👥 Employees:</span> <span className="text-gray-900 font-medium">{area.employee_count || 0}</span> {area.dependent_count > 0 && <span className="text-gray-500">| Dependents: {area.dependent_count}</span>}</div>}
                {area.ambulance_available && <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">🚑 Ambulance</span>}
                {area.emergency_services && <span className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded-full border border-orange-200">🆘 Emergency</span>}
              </div>
              {area.notes && <div className="md:col-span-2"><span className="text-gray-500">📝 Notes:</span> <span className="text-gray-900">{area.notes}</span></div>}
            </div>
          )}
        </Section>

        {/* Section 2: Visit Route */}
        <Section icon={<Route className="w-5 h-5" />} title="Visit Route & Travel" action={
          !editRoute ? <button onClick={() => setEditRoute(true)} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Edit className="w-3 h-3" />Edit</button> : null
        }>
          {editRoute ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2"><Field label="Visit Route"><input value={routeForm.visit_route || ''} onChange={e => setRouteForm({ ...routeForm, visit_route: e.target.value })} placeholder="e.g. Nagpur → Wardha → Chandrapur" className={inp} /></Field></div>
              <Field label="Distance (km)"><input type="number" value={routeForm.distance_km || ''} onChange={e => setRouteForm({ ...routeForm, distance_km: e.target.value })} className={inp} /></Field>
              <Field label="Travel Time"><input value={routeForm.travel_time || ''} onChange={e => setRouteForm({ ...routeForm, travel_time: e.target.value })} placeholder="e.g. 3 hours" className={inp} /></Field>
              <Field label="Last Visit Date"><input type="date" value={routeForm.last_visit_date || ''} onChange={e => setRouteForm({ ...routeForm, last_visit_date: e.target.value })} className={inp} /></Field>
              <div className="md:col-span-2"><Field label="Google Maps Link"><input value={routeForm.google_maps_link || ''} onChange={e => setRouteForm({ ...routeForm, google_maps_link: e.target.value })} placeholder="Paste Google Maps link here" className={inp} /></Field></div>
              <div className="md:col-span-2 flex gap-2">
                <button onClick={async () => { if (await saveSection(routeForm)) setEditRoute(false); }} className={btn}><Save className="w-4 h-4 inline mr-1" />Save</button>
                <button onClick={() => setEditRoute(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="md:col-span-2"><span className="text-gray-500">Route:</span> <span className="text-gray-900">{area.visit_route || '—'}</span></div>
              <div><span className="text-gray-500">Distance:</span> <span className="text-gray-900">{area.distance_km ? `${area.distance_km} km` : '—'}</span></div>
              <div><span className="text-gray-500">Travel Time:</span> <span className="text-gray-900">{area.travel_time || '—'}</span></div>
              {area.google_maps_link && <div className="md:col-span-2"><span className="text-gray-500">📍 Location:</span> <a href={area.google_maps_link} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:text-blue-800 underline">Open in Google Maps ↗</a></div>}
              <div><span className="text-gray-500">Last Visit:</span> <span className="text-gray-900">{area.last_visit_date || '—'}</span></div>
            </div>
          )}
        </Section>

        {/* Section 3: Contacts */}
        <Section icon={<Users className="w-5 h-5" />} title="Contacts / Referees" action={
          <button onClick={() => { setEditingContactId(null); setContactForm({ name: '', designation: '', phone: '', email: '', is_primary: false, notes: '', dietary_preference: 'vegetarian', drinks_alcohol: 'no', personal_habits: '', gratification_type: '', gratification_details: '', family_details: '', birthday: '', anniversary: '', interests: '', photo_url: '', photos: [] }); setShowAddContact(true); }} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />Add Contact</button>
        }>
          {showAddContact && (
            <div className="border border-blue-200 rounded-lg p-3 mb-4 bg-blue-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Name *" className={inp} />
                <input value={contactForm.designation} onChange={e => setContactForm({ ...contactForm, designation: e.target.value })} placeholder="Designation" className={inp} />
                <input value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })} placeholder="Phone" className={inp} />
                <input value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} placeholder="Email" className={inp} />
                <div className="flex items-center gap-2"><input type="checkbox" checked={contactForm.is_primary} onChange={e => setContactForm({ ...contactForm, is_primary: e.target.checked })} /><span className="text-sm text-gray-700">Primary Contact</span></div>
              </div>

              {/* Personal Preferences */}
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">🎯 Personal Preferences & Gratification</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div><label className="text-xs text-gray-500">Dietary Preference</label><select value={contactForm.dietary_preference || 'vegetarian'} onChange={e => setContactForm({ ...contactForm, dietary_preference: e.target.value })} className={inp}><option value="vegetarian">🥬 Vegetarian</option><option value="non-vegetarian">🍗 Non-Vegetarian</option><option value="eggetarian">🥚 Eggetarian</option><option value="vegan">🌱 Vegan</option><option value="jain">🙏 Jain</option><option value="unknown">❓ Unknown</option></select></div>
                  <div><label className="text-xs text-gray-500">Drinks Alcohol</label><select value={contactForm.drinks_alcohol || 'no'} onChange={e => setContactForm({ ...contactForm, drinks_alcohol: e.target.value })} className={inp}><option value="no">🚫 No</option><option value="occasionally">🍷 Occasionally</option><option value="socially">🥂 Socially</option><option value="regularly">🍺 Regularly</option><option value="unknown">❓ Unknown</option></select></div>
                  <div><label className="text-xs text-gray-500">Gratification Type</label><select value={contactForm.gratification_type || ''} onChange={e => setContactForm({ ...contactForm, gratification_type: e.target.value })} className={inp}><option value="">-- Select --</option><option value="monetary">💰 Monetary</option><option value="gifts_in_kind">🎁 Gifts in Kind</option><option value="family_outing">👨‍👩‍👧‍👦 Family Outing</option><option value="dinner">🍽️ Dinner / Party</option><option value="travel">✈️ Travel / Trip</option><option value="festival_gifts">🎊 Festival Gifts</option><option value="professional_favor">🤝 Professional Favor</option><option value="none">🚫 None / Unknown</option></select></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div><label className="text-xs text-gray-500">Gratification Details</label><textarea value={contactForm.gratification_details || ''} onChange={e => setContactForm({ ...contactForm, gratification_details: e.target.value })} placeholder="What specifically do they prefer? E.g. 'Prefers whisky brands, likes family trips to Goa, wants son's school admission help'" className={inp} rows={2} /></div>
                  <div><label className="text-xs text-gray-500">Personal Habits & Interests</label><textarea value={contactForm.personal_habits || ''} onChange={e => setContactForm({ ...contactForm, personal_habits: e.target.value })} placeholder="E.g. 'Morning walker, temple-goer, cricket fan, plays golf on weekends'" className={inp} rows={2} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div><label className="text-xs text-gray-500">Family Details</label><textarea value={contactForm.family_details || ''} onChange={e => setContactForm({ ...contactForm, family_details: e.target.value })} placeholder="E.g. 'Wife: Sunita (teacher), Son: 10th class, Daughter: married'" className={inp} rows={2} /></div>
                  <div><label className="text-xs text-gray-500">Other Interests / Notes</label><textarea value={contactForm.interests || ''} onChange={e => setContactForm({ ...contactForm, interests: e.target.value })} placeholder="E.g. 'Interested in Ayurveda, likes sweets from Haldiram, supports BJP'" className={inp} rows={2} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div><label className="text-xs text-gray-500">Birthday</label><input type="date" value={contactForm.birthday || ''} onChange={e => setContactForm({ ...contactForm, birthday: e.target.value })} className={inp} /></div>
                  <div><label className="text-xs text-gray-500">Anniversary</label><input type="date" value={contactForm.anniversary || ''} onChange={e => setContactForm({ ...contactForm, anniversary: e.target.value })} className={inp} /></div>
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="md:col-span-2 border-t border-gray-200 pt-3 mt-1">
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">📸 Photos</p>
                <div className="flex gap-3">
                  <label className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm cursor-pointer hover:bg-blue-100 border border-blue-200 flex items-center gap-1">
                    👤 Profile Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoUpload} />
                  </label>
                  <label className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm cursor-pointer hover:bg-green-100 border border-green-200 flex items-center gap-1">
                    📷 Add Photos
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleMultiPhotoUpload} />
                  </label>
                </div>
                {contactForm.photo_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={contactForm.photo_url} className="w-12 h-12 rounded-full object-cover" />
                    <button onClick={() => setContactForm({...contactForm, photo_url: ''})} className="text-xs text-red-500">Remove</button>
                  </div>
                )}
                {contactForm.photos && contactForm.photos.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {contactForm.photos.map((url: string, i: number) => (
                      <div key={i} className="relative">
                        <img src={url} className="w-14 h-14 rounded-lg object-cover" />
                        <button onClick={() => {
                          const newPhotos = [...contactForm.photos];
                          newPhotos.splice(i, 1);
                          setContactForm({...contactForm, photos: newPhotos});
                        }} className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <button onClick={addContact} className={btn}>{editingContactId ? 'Update' : 'Add'}</button>
                <button onClick={() => { setShowAddContact(false); setEditingContactId(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              </div>
            </div>
          )}
          {contacts.length === 0 ? <p className="text-sm text-gray-500">No contacts added yet.</p> : (
            <div className="space-y-3">
              {contacts.map(c => (
                <div key={c.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                        {c.photo_url ? <img src={c.photo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">👤</div>}
                      </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{c.name}</span>
                        {c.is_primary && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Primary</span>}
                      </div>
                      {c.designation && <p className="text-sm text-gray-500">{c.designation}</p>}
                    </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditContact(c)} className="text-blue-500 hover:text-blue-700"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => deleteContact(c.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm">
                    {c.phone && <a href={`tel:${c.phone}`} className="text-blue-600 hover:underline flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</a>}
                    {c.email && <a href={`mailto:${c.email}`} className="text-blue-600 hover:underline flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</a>}
                  </div>
                  {/* Personal Preferences Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {c.dietary_preference && c.dietary_preference !== 'unknown' && <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">{c.dietary_preference === 'vegetarian' ? '🥬 Veg' : c.dietary_preference === 'non-vegetarian' ? '🍗 Non-Veg' : c.dietary_preference === 'eggetarian' ? '🥚 Egg' : c.dietary_preference === 'jain' ? '🙏 Jain' : '🌱 Vegan'}</span>}
                    {c.drinks_alcohol && c.drinks_alcohol !== 'no' && c.drinks_alcohol !== 'unknown' && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">{c.drinks_alcohol === 'occasionally' ? '🍷 Occasional Drinker' : c.drinks_alcohol === 'socially' ? '🥂 Social Drinker' : '🍺 Regular Drinker'}</span>}
                    {c.gratification_type && c.gratification_type !== 'none' && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{c.gratification_type === 'monetary' ? '💰 Monetary' : c.gratification_type === 'gifts_in_kind' ? '🎁 Gifts' : c.gratification_type === 'family_outing' ? '👨‍👩‍👧‍👦 Family Outing' : c.gratification_type === 'dinner' ? '🍽️ Dinner/Party' : c.gratification_type === 'travel' ? '✈️ Travel' : c.gratification_type === 'festival_gifts' ? '🎊 Festival Gifts' : '🤝 Professional'}</span>}
                    {c.birthday && <span className="text-xs px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">🎂 {new Date(c.birthday).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                    {c.anniversary && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">💍 {new Date(c.anniversary).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                  </div>
                  {(c.gratification_details || c.personal_habits || c.family_details) && (
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                      {c.gratification_details && <p>🎯 <strong>What they want:</strong> {c.gratification_details}</p>}
                      {c.personal_habits && <p>🧑 <strong>Habits:</strong> {c.personal_habits}</p>}
                      {c.family_details && <p>👨‍👩‍👧 <strong>Family:</strong> {c.family_details}</p>}
                      {c.interests && <p>⭐ <strong>Interests:</strong> {c.interests}</p>}
                    </div>
                  )}
                  {c.photos && c.photos.length > 0 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                      {c.photos.map((url: string, i: number) => (
                        <img key={i} src={url} className="w-16 h-16 rounded-lg object-cover shrink-0 cursor-pointer hover:ring-2 ring-blue-500" onClick={() => window.open(url, '_blank')} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Section 4: Meeting History */}
        <Section icon={<Calendar className="w-5 h-5" />} title="Meeting History" action={
          <button onClick={() => setShowAddMeeting(true)} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />Add Meeting</button>
        }>
          {showAddMeeting && (
            <div className="border border-blue-200 rounded-lg p-3 mb-4 bg-blue-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Date *"><input type="date" value={meetingForm.meeting_date} onChange={e => setMeetingForm({ ...meetingForm, meeting_date: e.target.value })} className={inp} /></Field>
                <Field label="Person Met"><input value={meetingForm.person_met} onChange={e => setMeetingForm({ ...meetingForm, person_met: e.target.value })} className={inp} /></Field>
                <Field label="Location"><input value={meetingForm.location} onChange={e => setMeetingForm({ ...meetingForm, location: e.target.value })} className={inp} /></Field>
                <Field label="Follow-up Date"><input type="date" value={meetingForm.follow_up_date} onChange={e => setMeetingForm({ ...meetingForm, follow_up_date: e.target.value })} className={inp} /></Field>
                <div className="md:col-span-2"><Field label="Conversation"><textarea value={meetingForm.conversation} onChange={e => setMeetingForm({ ...meetingForm, conversation: e.target.value })} className={inp} rows={2} /></Field></div>
                <Field label="Action Taken"><input value={meetingForm.action_taken} onChange={e => setMeetingForm({ ...meetingForm, action_taken: e.target.value })} className={inp} /></Field>
                <Field label="Action Requested"><input value={meetingForm.action_requested} onChange={e => setMeetingForm({ ...meetingForm, action_requested: e.target.value })} className={inp} /></Field>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={addMeeting} className={btn}>Add Meeting</button>
                <button onClick={() => setShowAddMeeting(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              </div>
            </div>
          )}
          {meetings.length === 0 ? <p className="text-sm text-gray-500">No meetings recorded yet.</p> : (
            <div className="space-y-3">
              {meetings.map(m => (
                <div key={m.id} className="border border-gray-100 rounded-lg p-3 relative">
                  <button onClick={() => deleteMeeting(m.id)} className="absolute top-3 right-3 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 text-sm">{m.meeting_date}</span>
                    {m.person_met && <span className="text-gray-600 text-sm">— {m.person_met}</span>}
                  </div>
                  {m.marketing_staff && <div className="text-xs text-purple-600 mb-1">🧑‍💼 Visited by: <strong>{m.marketing_staff}</strong></div>}
                  {m.location && <div className="text-xs text-gray-500 mb-1"><MapPin className="w-3 h-3 inline mr-1" />{m.location}</div>}
                  {m.conversation && <p className="text-sm text-gray-700 mb-2">{m.conversation}</p>}
                  {/* Meeting Photos */}
                  {m.photos && m.photos.length > 0 && (
                    <div className="flex gap-2 mt-2 mb-2 overflow-x-auto pb-1">
                      {m.photos.map((url: string, i: number) => (
                        <img 
                          key={i} 
                          src={url} 
                          className="w-20 h-20 rounded-lg object-cover shrink-0 cursor-pointer hover:ring-2 ring-blue-500 transition-all" 
                          onClick={() => window.open(url, '_blank')} 
                          alt={`Meeting photo ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {m.marketing_staff && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">🧑‍💼 {m.marketing_staff}</span>}
                    {m.action_taken && <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">✓ {m.action_taken}</span>}
                    {m.action_requested && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">→ {m.action_requested}</span>}
                    {m.follow_up_date && <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded">📅 Follow-up: {m.follow_up_date}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Section 5: Follow-up & Reminders */}
        <Section icon={<Bell className="w-5 h-5" />} title="Follow-up & Reminders" action={
          !editFollowup ? <button onClick={() => setEditFollowup(true)} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Edit className="w-3 h-3" />Edit</button> : null
        }>
          {editFollowup ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Next Follow-up Date"><input type="date" value={followupForm.next_followup_date || ''} onChange={e => setFollowupForm({ ...followupForm, next_followup_date: e.target.value })} className={inp} /></Field>
              <Field label="Renewal Date"><input type="date" value={followupForm.renewal_date || ''} onChange={e => setFollowupForm({ ...followupForm, renewal_date: e.target.value })} className={inp} /></Field>
              <Field label="Follow-up Frequency">
                <select value={followupForm.followup_frequency || 'monthly'} onChange={e => setFollowupForm({ ...followupForm, followup_frequency: e.target.value })} className={inp}>
                  {FREQ_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Liaising Person"><input value={followupForm.liaising_person || ''} onChange={e => setFollowupForm({ ...followupForm, liaising_person: e.target.value })} className={inp} /></Field>
              <Field label="Liaising Since"><input type="date" value={followupForm.liaising_since || ''} onChange={e => setFollowupForm({ ...followupForm, liaising_since: e.target.value })} className={inp} /></Field>
              <div className="flex items-center gap-2 self-end pb-2">
                <input type="checkbox" checked={followupForm.added_to_openclaw || false} onChange={e => setFollowupForm({ ...followupForm, added_to_openclaw: e.target.checked })} />
                <span className="text-sm text-gray-700">Added to OpenClaw</span>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button onClick={async () => { if (await saveSection(followupForm)) setEditFollowup(false); }} className={btn}><Save className="w-4 h-4 inline mr-1" />Save</button>
                <button onClick={() => setEditFollowup(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Next Follow-up:</span> <span className={`${area.next_followup_date && area.next_followup_date < new Date().toISOString().split('T')[0] ? 'text-red-600 font-medium' : 'text-gray-900'}`}>{area.next_followup_date || '—'}</span></div>
              <div><span className="text-gray-500">Renewal Date:</span> <span className="text-gray-900">{area.renewal_date || '—'}</span></div>
              <div><span className="text-gray-500">Frequency:</span> <span className="text-gray-900 capitalize">{area.followup_frequency || '—'}</span></div>
              <div><span className="text-gray-500">Liaising Person:</span> <span className="text-gray-900">{area.liaising_person || '—'}</span></div>
              <div><span className="text-gray-500">Liaising Since:</span> <span className="text-gray-900">{area.liaising_since || '—'}</span></div>
              <div><span className="text-gray-500">Added to OpenClaw:</span> <span className="text-gray-900">{area.added_to_openclaw ? '✅ Yes' : '❌ No'}</span></div>
            </div>
          )}
        </Section>

        {/* Section 6: Financials */}
        <Section icon={<DollarSign className="w-5 h-5" />} title="Financials" action={
          !editFinancials ? <button onClick={() => setEditFinancials(true)} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Edit className="w-3 h-3" />Edit</button> : null
        }>
          {editFinancials ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Claims Submitted"><input type="number" value={financialForm.total_claims_submitted || 0} onChange={e => setFinancialForm({ ...financialForm, total_claims_submitted: parseInt(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="Claims Approved"><input type="number" value={financialForm.total_claims_approved || 0} onChange={e => setFinancialForm({ ...financialForm, total_claims_approved: parseInt(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="Amount Pending (₹)"><input type="number" value={financialForm.total_amount_pending || 0} onChange={e => setFinancialForm({ ...financialForm, total_amount_pending: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
              <div className="md:col-span-3 flex gap-2">
                <button onClick={async () => { if (await saveSection(financialForm)) setEditFinancials(false); }} className={btn}><Save className="w-4 h-4 inline mr-1" />Save</button>
                <button onClick={() => setEditFinancials(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-gray-500 text-xs">Claims Submitted</div><div className="text-xl font-bold text-gray-900">{area.total_claims_submitted || 0}</div></div>
              <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-gray-500 text-xs">Claims Approved</div><div className="text-xl font-bold text-gray-900">{area.total_claims_approved || 0}</div></div>
              <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-gray-500 text-xs">Amount Pending</div><div className="text-xl font-bold text-gray-900">₹{(area.total_amount_pending || 0).toLocaleString('en-IN')}</div></div>
            </div>
          )}
        </Section>
        {/* Section 7: Photo Gallery */}
        <Section icon={<Camera className="w-5 h-5" />} title="Photo Gallery">
          <label className="inline-flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm cursor-pointer hover:bg-blue-100 border border-blue-200 mb-3">
            📷 Upload Photos
            <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              const currentGallery = area.gallery || [];
              const newUrls = [...currentGallery];
              for (const file of files) {
                const path = `areas/${areaId}/gallery-${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`;
                const { error } = await db.storage.from('corporate-photos').upload(path, file);
                if (!error) {
                  const { data: { publicUrl } } = db.storage.from('corporate-photos').getPublicUrl(path);
                  newUrls.push(publicUrl);
                }
              }
              await db.from('corporate_areas').update({ gallery: newUrls }).eq('id', areaId);
              toast.success('Photos uploaded!');
              fetchAll();
            }} />
          </label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {(area.gallery || []).map((url: string, i: number) => (
              <div key={i} className="relative group">
                <img src={url} className="w-full h-24 rounded-lg object-cover cursor-pointer" onClick={() => window.open(url, '_blank')} />
                <button onClick={async () => {
                  const newGallery = [...(area.gallery || [])];
                  newGallery.splice(i, 1);
                  await db.from('corporate_areas').update({ gallery: newGallery }).eq('id', areaId);
                  toast.success('Photo removed');
                  fetchAll();
                }} className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs hidden group-hover:flex items-center justify-center">×</button>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
};

export default CorporateAreaDetail;
