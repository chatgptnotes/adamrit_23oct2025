import React, { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import {
  Link2, Unlink, Search, Filter, Zap, Info, Database,
  MapPin, CheckCircle, XCircle, Loader2, X, Plus, Pencil, Trash2, Settings2
} from 'lucide-react'

const ENTITY_TYPES = ['patient', 'supplier', 'doctor', 'income_head', 'expense_head']
const CC_CATEGORIES = ['department', 'ward', 'doctor']
const FILTER_OPTIONS = ['All', 'Mapped', 'Unmapped']
const MAPPING_ENTITY_TYPES = ['payment_mode', 'service_category', 'pharmacy', 'department']

const DEFAULT_RULES = [
  { label: 'Patient', arrow: 'Sundry Debtor ledger', color: 'blue' },
  { label: 'Ward / Department', arrow: 'Cost Centre', color: 'purple' },
  { label: 'Service Charges', arrow: 'Income ledger', color: 'green' },
  { label: 'Pharmacy Sales', arrow: 'Sales ledger', color: 'emerald' },
  { label: 'Supplier', arrow: 'Sundry Creditor ledger', color: 'orange' },
]

interface LedgerMappingRow {
  id: string
  adamrit_entity_type: string
  adamrit_entity_name: string
  tally_ledger_name: string
  tally_group: string | null
  is_active: boolean
}

export default function TallyMapping({ serverUrl, companyName }: { serverUrl?: string; companyName?: string }) {
  const [tab, setTab] = useState('ledger')
  const [ledgers, setLedgers] = useState<any[]>([])
  const [costCentres, setCostCentres] = useState<any[]>([])
  const [ledgerMappings, setLedgerMappings] = useState<LedgerMappingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [stats, setStats] = useState({ total: 0, mapped: 0, unmapped: 0, totalCC: 0, totalMappings: 0 })

  // Modal state for ledger/cc mapping
  const [modal, setModal] = useState<any>(null)
  const [entityType, setEntityType] = useState('patient')
  const [entityId, setEntityId] = useState('')
  const [ccCategory, setCcCategory] = useState('department')
  const [deptId, setDeptId] = useState('')
  const [saving, setSaving] = useState(false)
  const [autoMapping, setAutoMapping] = useState(false)

  // Modal state for ledger mapping CRUD
  const [mappingModal, setMappingModal] = useState<{ mode: 'add' | 'edit'; item?: LedgerMappingRow } | null>(null)
  const [mappingForm, setMappingForm] = useState({
    adamrit_entity_type: 'payment_mode',
    adamrit_entity_name: '',
    tally_ledger_name: '',
    tally_group: '',
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [ledgerRes, ccRes, mappingRes] = await Promise.all([
      supabase.from('tally_ledgers').select('*').order('name'),
      supabase.from('tally_cost_centres').select('*').order('name'),
      supabase.from('tally_ledger_mapping').select('*').order('adamrit_entity_type').order('adamrit_entity_name'),
    ])
    const l = ledgerRes.data || []
    const c = ccRes.data || []
    const m = (mappingRes.data || []) as LedgerMappingRow[]
    setLedgers(l)
    setCostCentres(c)
    setLedgerMappings(m)
    setStats({
      total: l.length,
      mapped: l.filter(x => x.is_mapped).length,
      unmapped: l.filter(x => !x.is_mapped).length,
      totalCC: c.length,
      totalMappings: m.length,
    })
    setLoading(false)
  }

  function filtered(items: any[], nameKey = 'name') {
    let result = items
    if (filter === 'Mapped') result = result.filter(x => x.is_mapped || x.adamrit_department_id)
    if (filter === 'Unmapped') result = result.filter(x => !x.is_mapped && !x.adamrit_department_id)
    if (search) result = result.filter(x => (x[nameKey] || '').toLowerCase().includes(search.toLowerCase()))
    return result
  }

  function filteredMappings() {
    let result = ledgerMappings
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(m =>
        m.adamrit_entity_name.toLowerCase().includes(q) ||
        m.tally_ledger_name.toLowerCase().includes(q) ||
        m.adamrit_entity_type.toLowerCase().includes(q)
      )
    }
    return result
  }

  function openMapModal(type: string, item: any) {
    setModal({ type, item })
    if (type === 'ledger') {
      setEntityType(item.adamrit_entity_type || 'patient')
      setEntityId(item.adamrit_entity_id || '')
    } else {
      setCcCategory(item.category || 'department')
      setDeptId(item.adamrit_department_id || '')
    }
  }

  async function saveMapping() {
    setSaving(true)
    try {
      if (modal.type === 'ledger') {
        await supabase.from('tally_ledgers').update({
          is_mapped: true,
          adamrit_entity_id: entityId,
          adamrit_entity_type: entityType,
        }).eq('id', modal.item.id)
      } else {
        await supabase.from('tally_cost_centres').update({
          category: ccCategory,
          adamrit_department_id: deptId,
        }).eq('id', modal.item.id)
      }
      toast.success('Mapping saved successfully')
      setModal(null)
      await loadData()
    } catch {
      toast.error('Failed to save mapping')
    }
    setSaving(false)
  }

  async function unmap(type: string, id: string) {
    try {
      if (type === 'ledger') {
        await supabase.from('tally_ledgers').update({
          is_mapped: false, adamrit_entity_id: null, adamrit_entity_type: null,
        }).eq('id', id)
      } else {
        await supabase.from('tally_cost_centres').update({
          category: null, adamrit_department_id: null,
        }).eq('id', id)
      }
      toast.success('Mapping removed')
      await loadData()
    } catch {
      toast.error('Failed to remove mapping')
    }
  }

  async function autoMap() {
    setAutoMapping(true)
    try {
      const unmapped = ledgers.filter(l => !l.is_mapped && (l.parent_group || '').toLowerCase().includes('sundry debtor'))
      if (unmapped.length === 0) { toast.info('No unmapped Sundry Debtor ledgers found'); setAutoMapping(false); return }

      const { data: patients } = await supabase.from('patients').select('id, patient_name, name')
      if (!patients || patients.length === 0) { toast.info('No patients found for auto-mapping'); setAutoMapping(false); return }

      let mapped = 0
      for (const ledger of unmapped) {
        const lName = (ledger.name || '').toLowerCase().trim()
        const match = patients.find((p: any) => {
          const pName = (p.patient_name || p.name || '').toLowerCase().trim()
          return pName && lName && (pName === lName || lName.includes(pName) || pName.includes(lName))
        })
        if (match) {
          await supabase.from('tally_ledgers').update({
            is_mapped: true, adamrit_entity_id: match.id, adamrit_entity_type: 'patient',
          }).eq('id', ledger.id)
          mapped++
        }
      }
      toast.success(`Auto-mapped ${mapped} of ${unmapped.length} Sundry Debtor ledgers`)
      await loadData()
    } catch {
      toast.error('Auto-mapping failed')
    }
    setAutoMapping(false)
  }

  // Ledger Mapping CRUD
  function openMappingAdd() {
    setMappingForm({ adamrit_entity_type: 'payment_mode', adamrit_entity_name: '', tally_ledger_name: '', tally_group: '' })
    setMappingModal({ mode: 'add' })
  }

  function openMappingEdit(item: LedgerMappingRow) {
    setMappingForm({
      adamrit_entity_type: item.adamrit_entity_type,
      adamrit_entity_name: item.adamrit_entity_name,
      tally_ledger_name: item.tally_ledger_name,
      tally_group: item.tally_group || '',
    })
    setMappingModal({ mode: 'edit', item })
  }

  async function saveLedgerMapping() {
    if (!mappingForm.adamrit_entity_name || !mappingForm.tally_ledger_name) {
      toast.error('Entity name and Tally ledger name are required')
      return
    }
    setSaving(true)
    try {
      if (mappingModal?.mode === 'edit' && mappingModal.item) {
        await supabase.from('tally_ledger_mapping').update({
          adamrit_entity_type: mappingForm.adamrit_entity_type,
          adamrit_entity_name: mappingForm.adamrit_entity_name,
          tally_ledger_name: mappingForm.tally_ledger_name,
          tally_group: mappingForm.tally_group || null,
          updated_at: new Date().toISOString(),
        }).eq('id', mappingModal.item.id)
      } else {
        await supabase.from('tally_ledger_mapping').insert({
          adamrit_entity_type: mappingForm.adamrit_entity_type,
          adamrit_entity_name: mappingForm.adamrit_entity_name,
          tally_ledger_name: mappingForm.tally_ledger_name,
          tally_group: mappingForm.tally_group || null,
        })
      }
      toast.success('Ledger mapping saved')
      setMappingModal(null)
      await loadData()
    } catch {
      toast.error('Failed to save ledger mapping')
    }
    setSaving(false)
  }

  async function deleteLedgerMapping(id: string) {
    try {
      await supabase.from('tally_ledger_mapping').delete().eq('id', id)
      toast.success('Mapping deleted')
      await loadData()
    } catch {
      toast.error('Failed to delete mapping')
    }
  }

  const filteredLedgers = filtered(ledgers)
  const filteredCC = filtered(costCentres)
  const filteredLM = filteredMappings()

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Ledgers', value: stats.total, icon: Database, bg: 'bg-blue-100', text: 'text-blue-600' },
          { label: 'Mapped', value: stats.mapped, icon: CheckCircle, bg: 'bg-green-100', text: 'text-green-600' },
          { label: 'Unmapped', value: stats.unmapped, icon: XCircle, bg: 'bg-red-100', text: 'text-red-600' },
          { label: 'Cost Centres', value: stats.totalCC, icon: MapPin, bg: 'bg-purple-100', text: 'text-purple-600' },
          { label: 'Auto-Push Maps', value: stats.totalMappings, icon: Settings2, bg: 'bg-amber-100', text: 'text-amber-600' },
        ].map(({ label, value, icon: Icon, bg, text }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className={`p-3 ${bg} rounded-lg`}><Icon className={`h-6 w-6 ${text}`} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Default Mapping Rules */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-blue-600" /> Default Mapping Rules
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {DEFAULT_RULES.map(r => (
            <div key={r.label} className="bg-gray-50 rounded-lg p-3 text-center text-xs border">
              <p className="font-semibold text-gray-800">{r.label}</p>
              <p className="text-gray-400 my-1">&#8595;</p>
              <p className="text-blue-600 font-medium">{r.arrow}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + Search/Filter */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center justify-between border-b px-6 py-3">
          <div className="flex gap-1">
            {[
              { key: 'ledger', label: 'Ledger Mapping' },
              { key: 'cc', label: 'Cost Centre Mapping' },
              { key: 'autopush', label: 'Auto-Push Mapping' },
            ].map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); setFilter('All') }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm w-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            {tab !== 'autopush' && (
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4 text-gray-400" />
                {FILTER_OPTIONS.map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded text-xs font-medium ${filter === f ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                    {f}
                  </button>
                ))}
              </div>
            )}
            {tab === 'ledger' && (
              <button onClick={autoMap} disabled={autoMapping}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                {autoMapping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                Auto-Map
              </button>
            )}
            {tab === 'autopush' && (
              <button onClick={openMappingAdd}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 flex items-center gap-1">
                <Plus className="h-3 w-3" /> Add Mapping
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
          ) : tab === 'ledger' ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Tally Ledger Name</th>
                  <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Group</th>
                  <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Mapped To</th>
                  <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Entity Type</th>
                  <th className="text-right py-2.5 px-4 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedgers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">No ledgers found</td></tr>
                ) : filteredLedgers.map(l => (
                  <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4 font-medium text-gray-900">{l.name}</td>
                    <td className="py-2 px-4 text-gray-600">{l.parent_group || '-'}</td>
                    <td className="py-2 px-4">
                      {l.is_mapped ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3" /> {l.adamrit_entity_id}
                        </span>
                      ) : <span className="text-gray-400 text-xs">Unmapped</span>}
                    </td>
                    <td className="py-2 px-4 text-gray-600 capitalize">{l.adamrit_entity_type || '-'}</td>
                    <td className="py-2 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openMapModal('ledger', l)}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 flex items-center gap-1">
                          <Link2 className="h-3 w-3" /> Map
                        </button>
                        {l.is_mapped && (
                          <button onClick={() => unmap('ledger', l.id)}
                            className="px-2.5 py-1 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 flex items-center gap-1">
                            <Unlink className="h-3 w-3" /> Unmap
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : tab === 'cc' ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Cost Centre Name</th>
                  <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Parent</th>
                  <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Category</th>
                  <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Mapped Department</th>
                  <th className="text-right py-2.5 px-4 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCC.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">No cost centres found</td></tr>
                ) : filteredCC.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4 font-medium text-gray-900">{c.name}</td>
                    <td className="py-2 px-4 text-gray-600">{c.parent || '-'}</td>
                    <td className="py-2 px-4 text-gray-600 capitalize">{c.category || '-'}</td>
                    <td className="py-2 px-4">
                      {c.adamrit_department_id ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3" /> {c.adamrit_department_id}
                        </span>
                      ) : <span className="text-gray-400 text-xs">Unmapped</span>}
                    </td>
                    <td className="py-2 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openMapModal('cc', c)}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 flex items-center gap-1">
                          <Link2 className="h-3 w-3" /> Map
                        </button>
                        {c.adamrit_department_id && (
                          <button onClick={() => unmap('cc', c.id)}
                            className="px-2.5 py-1 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 flex items-center gap-1">
                            <Unlink className="h-3 w-3" /> Unmap
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* Auto-Push Mapping Tab */
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Type</th>
                  <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Adamrit Entity</th>
                  <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Tally Ledger</th>
                  <th className="text-left py-2.5 px-4 text-gray-500 font-medium">Tally Group</th>
                  <th className="text-center py-2.5 px-4 text-gray-500 font-medium">Active</th>
                  <th className="text-right py-2.5 px-4 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLM.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">No auto-push mappings found. Click "Add Mapping" to create one.</td></tr>
                ) : filteredLM.map(m => (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {m.adamrit_entity_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-4 font-medium text-gray-900">{m.adamrit_entity_name}</td>
                    <td className="py-2 px-4 text-gray-800">{m.tally_ledger_name}</td>
                    <td className="py-2 px-4 text-gray-600">{m.tally_group || '-'}</td>
                    <td className="py-2 px-4 text-center">
                      {m.is_active ? (
                        <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" /></span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400"><XCircle className="h-4 w-4" /></span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openMappingEdit(m)}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 flex items-center gap-1">
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button onClick={() => deleteLedgerMapping(m.id)}
                          className="px-2.5 py-1 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 flex items-center gap-1">
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Ledger/CC Mapping Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {modal.type === 'ledger' ? 'Map Ledger' : 'Map Cost Centre'}
              </h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Mapping: <span className="font-medium text-gray-800">{modal.item.name}</span></p>
            {modal.type === 'ledger' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                  <select value={entityType} onChange={e => setEntityType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    {ENTITY_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entity ID (Patient name or ID)</label>
                  <input value={entityId} onChange={e => setEntityId(e.target.value)} placeholder="Enter patient name or entity ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={ccCategory} onChange={e => setCcCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    {CC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department ID</label>
                  <input value={deptId} onChange={e => setDeptId(e.target.value)} placeholder="Enter department ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={saveMapping} disabled={saving || (modal.type === 'ledger' ? !entityId : !deptId)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Save Mapping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Push Mapping Add/Edit Modal */}
      {mappingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {mappingModal.mode === 'add' ? 'Add Auto-Push Mapping' : 'Edit Auto-Push Mapping'}
              </h3>
              <button onClick={() => setMappingModal(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                <select value={mappingForm.adamrit_entity_type}
                  onChange={e => setMappingForm(f => ({ ...f, adamrit_entity_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  {MAPPING_ENTITY_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adamrit Entity Name</label>
                <input value={mappingForm.adamrit_entity_name}
                  onChange={e => setMappingForm(f => ({ ...f, adamrit_entity_name: e.target.value }))}
                  placeholder="e.g., Cash, UPI, ICU, Pharmacy Sales"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tally Ledger Name</label>
                <input value={mappingForm.tally_ledger_name}
                  onChange={e => setMappingForm(f => ({ ...f, tally_ledger_name: e.target.value }))}
                  placeholder="e.g., Cash, HDFC Bank, Hospital Income"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tally Group (optional)</label>
                <input value={mappingForm.tally_group}
                  onChange={e => setMappingForm(f => ({ ...f, tally_group: e.target.value }))}
                  placeholder="e.g., Cash-in-Hand, Bank Accounts, Direct Incomes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setMappingModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={saveLedgerMapping}
                disabled={saving || !mappingForm.adamrit_entity_name || !mappingForm.tally_ledger_name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {mappingModal.mode === 'add' ? 'Add Mapping' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
