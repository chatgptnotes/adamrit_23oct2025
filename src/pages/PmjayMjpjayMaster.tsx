import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertCircle, Plus, Edit, Eye, Trash2, X, ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PmjayPackage {
  id: string;
  scheme: string;
  remark: string | null;
  diagnosis_code: string | null;
  diagnosis: string | null;
  treatment_code: string | null;
  treatment_plan: string | null;
  category: string | null;
  package_price: number | null;
  patient_name_example: string | null;
  is_active: boolean;
  created_at: string | null;
}

const EMPTY_CREATE = {
  scheme: 'PMJAY',
  remark: '',
  diagnosis_code: '',
  diagnosis: '',
  treatment_code: '',
  treatment_plan: '',
  category: '',
  package_price: '',
  patient_name_example: '',
};

const PmjayMjpjayMaster = () => {
  const { canEditMasters } = usePermissions();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchTerm   = searchParams.get('search') || '';
  const currentPage  = parseInt(searchParams.get('page') || '1');
  const itemsPerPage = parseInt(searchParams.get('perPage') || '10');

  const updateParams = (updates: Record<string, string | null>) => {
    const p = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (!v || (k === 'page' && v === '1') || (k === 'perPage' && v === '10')) p.delete(k);
      else p.set(k, v);
    });
    setSearchParams(p, { replace: true });
  };

  const setSearchTerm   = (v: string) => updateParams({ search: v, page: '1' });
  const setCurrentPage  = (v: number) => updateParams({ page: v.toString() });
  const setItemsPerPage = (v: number) => updateParams({ perPage: v.toString(), page: '1' });

  const [totalCount, setTotalCount]         = useState(0);
  const [showInactive, setShowInactive]     = useState(false);
  const [isCreating, setIsCreating]         = useState(false);
  const [viewingRecord, setViewingRecord]   = useState<PmjayPackage | null>(null);
  const [editingRecord, setEditingRecord]   = useState<PmjayPackage | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<PmjayPackage | null>(null);
  const [isDeleting, setIsDeleting]         = useState(false);
  const [createForm, setCreateForm]         = useState(EMPTY_CREATE);
  const [editForm, setEditForm]             = useState<Partial<PmjayPackage>>({});
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceInput, setPriceInput]         = useState('');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data: records = [], isLoading, error } = useQuery({
    queryKey: ['pmjay-mjpjay-packages', searchTerm, currentPage, itemsPerPage, showInactive],
    queryFn: async () => {
      const from = (currentPage - 1) * itemsPerPage;
      const to   = from + itemsPerPage - 1;

      let q = supabase.from('pmjay_mjpjay_packages').select('*', { count: 'exact' });
      if (!showInactive) q = q.eq('is_active', true);
      if (searchTerm.trim()) {
        const s = searchTerm.trim();
        q = q.or(`scheme.ilike.*${s}*,diagnosis_code.ilike.*${s}*,diagnosis.ilike.*${s}*,treatment_code.ilike.*${s}*,treatment_plan.ilike.*${s}*,category.ilike.*${s}*`);
      }
      q = q.order('created_at', { ascending: true }).range(from, to);

      const { data, error, count } = await q;
      if (error) throw error;
      setTotalCount(count || 0);
      return data as PmjayPackage[];
    },
  });

  // ── Create ─────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (form: typeof EMPTY_CREATE) => {
      const { error } = await supabase.from('pmjay_mjpjay_packages').insert({
        scheme:               form.scheme,
        remark:               form.remark || null,
        diagnosis_code:       form.diagnosis_code || null,
        diagnosis:            form.diagnosis || null,
        treatment_code:       form.treatment_code || null,
        treatment_plan:       form.treatment_plan || null,
        category:             form.category || null,
        package_price:        form.package_price ? Number(form.package_price) : null,
        patient_name_example: form.patient_name_example || null,
        is_active:            true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Record created successfully');
      queryClient.invalidateQueries({ queryKey: ['pmjay-mjpjay-packages'] });
      setIsCreating(false);
      setCreateForm(EMPTY_CREATE);
    },
    onError: (e: any) => toast.error('Failed to create: ' + e.message),
  });

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    const { error } = await supabase.from('pmjay_mjpjay_packages').update({
      scheme:               editForm.scheme,
      remark:               editForm.remark || null,
      diagnosis_code:       editForm.diagnosis_code || null,
      diagnosis:            editForm.diagnosis || null,
      treatment_code:       editForm.treatment_code || null,
      treatment_plan:       editForm.treatment_plan || null,
      category:             editForm.category || null,
      package_price:        editForm.package_price ?? null,
      patient_name_example: editForm.patient_name_example || null,
    }).eq('id', editingRecord.id);
    if (error) { toast.error('Failed to update: ' + error.message); return; }
    toast.success('Record updated');
    queryClient.invalidateQueries({ queryKey: ['pmjay-mjpjay-packages'] });
    setEditingRecord(null);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    const { error } = await supabase.from('pmjay_mjpjay_packages').delete().eq('id', deletingRecord.id);
    if (error) toast.error('Failed to delete'); else toast.success('Record deleted');
    queryClient.invalidateQueries({ queryKey: ['pmjay-mjpjay-packages'] });
    setDeletingRecord(null);
    setIsDeleting(false);
  };

  // ── Toggle active ──────────────────────────────────────────────────────────
  const handleToggleActive = async (rec: PmjayPackage) => {
    const { error } = await supabase.from('pmjay_mjpjay_packages').update({ is_active: !rec.is_active } as any).eq('id', rec.id);
    if (error) { toast.error('Failed to update status'); return; }
    toast.success(`Record ${!rec.is_active ? 'activated' : 'deactivated'}`);
    queryClient.invalidateQueries({ queryKey: ['pmjay-mjpjay-packages'] });
  };

  // ── Inline price save ──────────────────────────────────────────────────────
  const saveInlinePrice = async (id: string) => {
    const price = priceInput.trim() === '' ? null : Number(priceInput);
    const { error } = await supabase.from('pmjay_mjpjay_packages').update({ package_price: price } as any).eq('id', id);
    if (error) toast.error('Failed to save price');
    else { toast.success('Price saved'); queryClient.invalidateQueries({ queryKey: ['pmjay-mjpjay-packages'] }); }
    setEditingPriceId(null);
    setPriceInput('');
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    const { data, error } = await supabase.from('pmjay_mjpjay_packages').select('*').order('created_at');
    if (error) { toast.error('Export failed'); return; }
    const rows = (data || []).map((r, i) => ({
      'Sr No': i + 1,
      'Scheme': r.scheme,
      'Diagnosis Code': r.diagnosis_code || '',
      'Diagnosis': r.diagnosis || '',
      'Treatment Code': r.treatment_code || '',
      'Treatment Plan': r.treatment_plan || '',
      'Category': r.category || '',
      'Package Price': r.package_price || '',
      'Remark': r.remark || '',
      'Patient Example': r.patient_name_example || '',
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'PMJAY-MJPJAY');
    XLSX.writeFile(wb, `pmjay_mjpjay_master_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Exported ${rows.length} records`);
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb   = XLSX.read(data, { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
        const records = rows.filter(r => r['Scheme']).map(r => ({
          scheme:               r['Scheme'] || 'PMJAY',
          diagnosis_code:       r['Diagnosis Code'] || null,
          diagnosis:            r['Diagnosis'] || null,
          treatment_code:       r['Treatment Code'] || null,
          treatment_plan:       r['Treatment Plan'] || null,
          category:             r['Category'] || null,
          package_price:        r['Package Price'] ? Number(r['Package Price']) : null,
          remark:               r['Remark'] || null,
          patient_name_example: r['Patient Example'] || null,
          is_active:            true,
        }));
        const { error } = await supabase.from('pmjay_mjpjay_packages').insert(records);
        if (error) toast.error('Import failed: ' + error.message);
        else { toast.success(`Imported ${records.length} records`); queryClient.invalidateQueries({ queryKey: ['pmjay-mjpjay-packages'] }); }
      } catch { toast.error('Import failed — invalid file'); }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startItem  = (currentPage - 1) * itemsPerPage + 1;
  const endItem    = Math.min(currentPage * itemsPerPage, totalCount);
  const fmt        = (v: number | null | undefined) => v != null ? `₹${Number(v).toLocaleString('en-IN')}` : '-';

  const SchemeSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="PMJAY">PMJAY</SelectItem>
        <SelectItem value="MJPJAY">MJPJAY</SelectItem>
      </SelectContent>
    </Select>
  );

  const CategorySelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="CONSERVATIVE">CONSERVATIVE</SelectItem>
        <SelectItem value="SURGICAL">SURGICAL</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            PMJAY / MJPJAY YOJNA — PACKAGE MASTER
          </h1>
          <p className="text-gray-600 mt-2">Manage PMJAY/MJPJAY scheme package codes and rates</p>
        </div>
        {canEditMasters && (
          <button onClick={() => setIsCreating(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Record
          </button>
        )}
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <Label htmlFor="search">Search Packages</Label>
          <Input id="search" placeholder="Search by scheme, diagnosis code, treatment code, category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mt-1" />
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>PMJAY / MJPJAY Packages</span>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-normal text-gray-500">
                {isLoading ? 'Loading...' : totalCount > 0 ? `Showing ${startItem}-${endItem} of ${totalCount} records` : 'No records found'}
              </span>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-normal text-gray-500">Show:</Label>
                <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                  <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5,10,20,50,100].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-normal">
                <input type="checkbox" checked={showInactive} onChange={(e) => { setShowInactive(e.target.checked); setCurrentPage(1); }} className="rounded border-gray-300" />
                Show Inactive
              </label>
              {canEditMasters && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />Export
                </Button>
              )}
              {canEditMasters && (
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild><span><Upload className="h-4 w-4 mr-2" />Import</span></Button>
                  <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
                </label>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <span className="ml-3 text-gray-600">Loading records...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />Error loading records.
            </div>
          ) : records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-700">Treatment Plan</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Treatment Code</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Diag. Code</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Diagnosis</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Scheme</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Category</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Package Price (₹)</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Remark</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Created</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec.id} className={`border-b hover:bg-gray-50 ${!rec.is_active ? 'opacity-50 bg-gray-100' : ''}`}>
                      <td className="p-3 font-medium text-gray-900 max-w-[200px] truncate" title={rec.treatment_plan || ''}>
                        {rec.treatment_plan || '-'}
                        {!rec.is_active && <span className="ml-2 text-xs text-red-500">(Inactive)</span>}
                      </td>
                      <td className="p-3 text-gray-600 font-mono">{rec.treatment_code || '-'}</td>
                      <td className="p-3 text-gray-600 font-mono">{rec.diagnosis_code || '-'}</td>
                      <td className="p-3 text-gray-600 max-w-[180px] truncate" title={rec.diagnosis || ''}>{rec.diagnosis || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${rec.scheme === 'PMJAY' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {rec.scheme}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 text-sm">{rec.category || '-'}</td>
                      <td className="p-3">
                        {editingPriceId === rec.id ? (
                          <input
                            autoFocus
                            type="number"
                            value={priceInput}
                            onChange={(e) => setPriceInput(e.target.value)}
                            onBlur={() => saveInlinePrice(rec.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlinePrice(rec.id);
                              if (e.key === 'Escape') { setEditingPriceId(null); setPriceInput(''); }
                            }}
                            className="w-28 border border-blue-400 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Enter price"
                          />
                        ) : (
                          <span
                            className={`cursor-pointer font-semibold ${rec.package_price != null ? 'text-green-700' : 'text-gray-400 italic text-sm'}`}
                            onClick={() => { setEditingPriceId(rec.id); setPriceInput(rec.package_price?.toString() || ''); }}
                            title="Click to enter price"
                          >
                            {fmt(rec.package_price)}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-gray-600 text-sm">{rec.remark || '-'}</td>
                      <td className="p-3 text-gray-600 text-sm">{rec.created_at ? new Date(rec.created_at).toLocaleDateString() : '-'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setViewingRecord(rec)} className="p-1 text-blue-600 hover:text-blue-800" title="View"><Eye className="h-4 w-4" /></button>
                          {canEditMasters && <button onClick={() => { setEditingRecord(rec); setEditForm(rec); }} className="p-1 text-green-600 hover:text-green-800" title="Edit"><Edit className="h-4 w-4" /></button>}
                          {canEditMasters && <button onClick={() => handleToggleActive(rec)} className="p-1 text-orange-600 hover:text-orange-800" title={rec.is_active ? 'Deactivate' : 'Activate'}><Eye className="h-4 w-4" /></button>}
                          {canEditMasters && <button onClick={() => setDeletingRecord(rec)} className="p-1 text-red-600 hover:text-red-800" title="Delete"><Trash2 className="h-4 w-4" /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No records found</p>
              <p className="text-sm">{searchTerm ? 'No records match your search' : 'Add your first PMJAY/MJPJAY package'}</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-500">Showing {startItem}-{endItem} of {totalCount} results</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" />Previous</Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                  return <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(p)} className="w-8 h-8 p-0">{p}</Button>;
                })}
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Next<ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add PMJAY / MJPJAY Record</h2>
              <button onClick={() => setIsCreating(false)}><X className="h-6 w-6 text-gray-500" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(createForm); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label className="block text-sm font-medium text-gray-700 mb-2">Scheme *</Label><SchemeSelect value={createForm.scheme} onChange={(v) => setCreateForm(p => ({ ...p, scheme: v }))} /></div>
                <div><Label className="block text-sm font-medium text-gray-700 mb-2">Category</Label><CategorySelect value={createForm.category} onChange={(v) => setCreateForm(p => ({ ...p, category: v }))} /></div>
                <div><Label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis Code</Label><Input value={createForm.diagnosis_code} onChange={(e) => setCreateForm(p => ({ ...p, diagnosis_code: e.target.value }))} placeholder="e.g. NA07.7" /></div>
                <div><Label className="block text-sm font-medium text-gray-700 mb-2">Treatment Code</Label><Input value={createForm.treatment_code} onChange={(e) => setCreateForm(p => ({ ...p, treatment_code: e.target.value }))} placeholder="e.g. SN063B" /></div>
                <div className="md:col-span-2"><Label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</Label><Input value={createForm.diagnosis} onChange={(e) => setCreateForm(p => ({ ...p, diagnosis: e.target.value }))} placeholder="Diagnosis description" /></div>
                <div className="md:col-span-2"><Label className="block text-sm font-medium text-gray-700 mb-2">Treatment Plan</Label><Input value={createForm.treatment_plan} onChange={(e) => setCreateForm(p => ({ ...p, treatment_plan: e.target.value }))} placeholder="Treatment plan description" /></div>
                <div><Label className="block text-sm font-medium text-gray-700 mb-2">Package Price (₹)</Label><Input type="number" value={createForm.package_price} onChange={(e) => setCreateForm(p => ({ ...p, package_price: e.target.value }))} placeholder="e.g. 15000" /></div>
                <div><Label className="block text-sm font-medium text-gray-700 mb-2">Remark</Label><Input value={createForm.remark} onChange={(e) => setCreateForm(p => ({ ...p, remark: e.target.value }))} placeholder="Optional remark" /></div>
                <div><Label className="block text-sm font-medium text-gray-700 mb-2">Patient Name Example</Label><Input value={createForm.patient_name_example} onChange={(e) => setCreateForm(p => ({ ...p, patient_name_example: e.target.value }))} placeholder="e.g. Rahul Yadav" /></div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{createMutation.isPending ? 'Saving...' : 'Add Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Package Details</h2>
              <button onClick={() => setViewingRecord(null)}><X className="h-6 w-6 text-gray-500" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {([['Scheme', viewingRecord.scheme], ['Category', viewingRecord.category], ['Diagnosis Code', viewingRecord.diagnosis_code], ['Treatment Code', viewingRecord.treatment_code], ['Package Price', fmt(viewingRecord.package_price)], ['Remark', viewingRecord.remark], ['Patient Example', viewingRecord.patient_name_example], ['Created', viewingRecord.created_at ? new Date(viewingRecord.created_at).toLocaleDateString() : '-']] as [string,string|null][]).map(([label, val]) => (
                <div key={label}><label className="block text-sm font-medium text-gray-700">{label}</label><p className="mt-1 text-sm text-gray-900">{val || '-'}</p></div>
              ))}
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Diagnosis</label><p className="mt-1 text-sm text-gray-900">{viewingRecord.diagnosis || '-'}</p></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Treatment Plan</label><p className="mt-1 text-sm text-gray-900">{viewingRecord.treatment_plan || '-'}</p></div>
            </div>
            <div className="mt-6 flex justify-end"><button onClick={() => setViewingRecord(null)} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Close</button></div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Record</h2>
              <button onClick={() => setEditingRecord(null)}><X className="h-6 w-6 text-gray-500" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label className="block text-sm font-medium text-gray-700 mb-2">Scheme *</Label><SchemeSelect value={editForm.scheme || 'PMJAY'} onChange={(v) => setEditForm(p => ({ ...p, scheme: v }))} /></div>
                <div><Label className="block text-sm font-medium text-gray-700 mb-2">Category</Label><CategorySelect value={editForm.category || ''} onChange={(v) => setEditForm(p => ({ ...p, category: v }))} /></div>
                <div><Label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis Code</Label><Input value={editForm.diagnosis_code || ''} onChange={(e) => setEditForm(p => ({ ...p, diagnosis_code: e.target.value }))} /></div>
                <div><Label className="block text-sm font-medium text-gray-700 mb-2">Treatment Code</Label><Input value={editForm.treatment_code || ''} onChange={(e) => setEditForm(p => ({ ...p, treatment_code: e.target.value }))} /></div>
                <div className="md:col-span-2"><Label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</Label><Input value={editForm.diagnosis || ''} onChange={(e) => setEditForm(p => ({ ...p, diagnosis: e.target.value }))} /></div>
                <div className="md:col-span-2"><Label className="block text-sm font-medium text-gray-700 mb-2">Treatment Plan</Label><Input value={editForm.treatment_plan || ''} onChange={(e) => setEditForm(p => ({ ...p, treatment_plan: e.target.value }))} /></div>
                <div><Label className="block text-sm font-medium text-gray-700 mb-2">Package Price (₹)</Label><Input type="number" value={editForm.package_price ?? ''} onChange={(e) => setEditForm(p => ({ ...p, package_price: e.target.value ? Number(e.target.value) : null }))} /></div>
                <div><Label className="block text-sm font-medium text-gray-700 mb-2">Remark</Label><Input value={editForm.remark || ''} onChange={(e) => setEditForm(p => ({ ...p, remark: e.target.value }))} /></div>
                <div><Label className="block text-sm font-medium text-gray-700 mb-2">Patient Name Example</Label><Input value={editForm.patient_name_example || ''} onChange={(e) => setEditForm(p => ({ ...p, patient_name_example: e.target.value }))} /></div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setEditingRecord(null)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4"><Trash2 className="h-6 w-6 text-red-600" /></div>
              <h3 className="text-lg font-medium">Delete Record</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Are you sure you want to delete <strong>"{deletingRecord.treatment_plan || deletingRecord.treatment_code}"</strong>? This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingRecord(null)} disabled={isDeleting} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
              <button onClick={handleConfirmDelete} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">{isDeleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PmjayMjpjayMaster;
