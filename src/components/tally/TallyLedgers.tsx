
import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import {
  Search, Filter, Plus, X, Loader2, Download,
  BookOpen, Link2, ChevronDown, Eye
} from 'lucide-react'
import TallyLedgerView from './TallyLedgerView'

const GROUP_OPTIONS = [
  'All',
  'Sundry Debtors',
  'Sundry Creditors',
  'Cash-in-Hand',
  'Bank Accounts',
  'Direct Incomes',
  'Direct Expenses',
  'Indirect Incomes',
  'Indirect Expenses',
]

const PARENT_GROUP_OPTIONS = [
  'Sundry Debtors',
  'Sundry Creditors',
  'Cash-in-Hand',
  'Bank Accounts',
  'Direct Incomes',
  'Direct Expenses',
  'Indirect Incomes',
  'Indirect Expenses',
  'Loans & Advances (Asset)',
  'Loans (Liability)',
  'Current Assets',
  'Current Liabilities',
  'Fixed Assets',
  'Investments',
  'Capital Account',
  'Sales Accounts',
  'Purchase Accounts',
  'Duties & Taxes',
]

function formatCurrency(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0)
}

export default function TallyLedgers({ serverUrl, companyName, companyId }) {
  const [ledgers, setLedgers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('All')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)

  const [viewLedger, setViewLedger] = useState(null)

  // Create form state
  const [form, setForm] = useState({
    name: '',
    parentGroup: 'Sundry Debtors',
    openingBalance: '',
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
  })

  useEffect(() => {
    fetchLedgers()
  }, [companyId])

  async function fetchLedgers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tally_ledgers')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true })

    if (error) {
      toast.error('Failed to load ledgers')
    } else {
      setLedgers(data || [])
    }
    setLoading(false)
  }

  const filtered = useMemo(() => {
    let result = ledgers

    if (groupFilter !== 'All') {
      result = result.filter(
        (l) => (l.parent_group || '').toLowerCase() === groupFilter.toLowerCase()
      )
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) =>
          (l.name || '').toLowerCase().includes(q) ||
          (l.parent_group || '').toLowerCase().includes(q) ||
          (l.email || '').toLowerCase().includes(q) ||
          (l.gst_number || '').toLowerCase().includes(q) ||
          (l.pan_number || '').toLowerCase().includes(q)
      )
    }

    return result
  }, [ledgers, search, groupFilter])

  function resetForm() {
    setForm({
      name: '',
      parentGroup: 'Sundry Debtors',
      openingBalance: '',
      address: '',
      phone: '',
      email: '',
      gstNumber: '',
    })
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      toast.error('Ledger name is required')
      return
    }
    if (!serverUrl || !companyName) {
      toast.error('Tally server URL and company name are required')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/tally-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'push',
          action: 'create-ledger',
          serverUrl,
          companyName,
          data: {
            name: form.name.trim(),
            parentGroup: form.parentGroup,
            openingBalance: form.openingBalance ? parseFloat(form.openingBalance) : 0,
            address: form.address.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            gstNumber: form.gstNumber.trim(),
          },
        }),
      })

      const result = await res.json()

      if (result.success) {
        toast.success(`Ledger "${form.name}" created in Tally`)
        setShowCreateModal(false)
        resetForm()
        await fetchLedgers()
      } else {
        toast.error(result.error || 'Failed to create ledger in Tally')
      }
    } catch (err) {
      toast.error('Failed to send request to Tally')
    }
    setCreating(false)
  }

  function getMappedLabel(ledger) {
    if (!ledger.is_mapped || !ledger.adamrit_entity_type) return null
    return `${ledger.adamrit_entity_type} #${ledger.adamrit_entity_id || '?'}`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Tally Ledgers
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {ledgers.length} total ledgers{' '}
              {filtered.length !== ledgers.length && (
                <span className="text-blue-600 font-medium">
                  ({filtered.length} shown)
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create in Tally
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, group, email, GST, PAN..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
            >
              {GROUP_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-500">Loading ledgers...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {ledgers.length === 0
                ? 'No ledgers synced yet. Sync ledgers from the dashboard.'
                : 'No ledgers match your search or filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Group</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">Opening Bal</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">Closing Bal</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Type</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Mapped To</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ledger, idx) => {
                  const mapped = getMappedLabel(ledger)
                  return (
                    <tr
                      key={ledger.id}
                      onClick={() => setViewLedger(ledger.name)}
                      className={`border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-medium text-blue-700 max-w-[250px] truncate hover:underline">
                        {ledger.name}
                      </td>
                      <td className="py-2.5 px-4 text-gray-600">{ledger.parent_group || '-'}</td>
                      <td className="py-2.5 px-4 text-right text-gray-700 font-mono text-xs">
                        {formatCurrency(ledger.opening_balance)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-xs">
                        <span
                          className={
                            (ledger.closing_balance || 0) >= 0
                              ? 'text-green-700'
                              : 'text-red-600'
                          }
                        >
                          {formatCurrency(ledger.closing_balance)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {ledger.ledger_type ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {ledger.ledger_type}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {mapped ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <Link2 className="h-3 w-3" />
                            {mapped}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Not mapped</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with count */}
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {filtered.length} of {ledgers.length} ledgers
            </p>
            <p className="text-xs text-gray-400">
              {groupFilter !== 'All' && `Filtered by: ${groupFilter}`}
            </p>
          </div>
        )}
      </div>

      {/* Ledger Account View Modal */}
      {viewLedger && (
        <TallyLedgerView
          ledgerName={viewLedger}
          onClose={() => setViewLedger(null)}
          serverUrl={serverUrl}
          companyName={companyName}
          companyId={companyId}
        />
      )}

      {/* Create Ledger Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Ledger in Tally</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ledger name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Group
                </label>
                <select
                  value={form.parentGroup}
                  onChange={(e) => setForm({ ...form, parentGroup: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {PARENT_GROUP_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opening Balance
                </label>
                <input
                  type="number"
                  value={form.openingBalance}
                  onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                <input
                  type="text"
                  value={form.gstNumber}
                  onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                This will push the ledger to <strong>{companyName || 'your company'}</strong> via
                Tally server at <strong>{serverUrl || 'N/A'}</strong>.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.name.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
