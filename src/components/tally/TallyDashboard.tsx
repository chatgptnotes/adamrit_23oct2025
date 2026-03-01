import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import {
  RefreshCw, Settings, Wifi, WifiOff, Database, FileText,
  Package, BarChart3, ArrowDownToLine, ArrowUpFromLine,
  CheckCircle, XCircle, Clock, Loader2, Save, Play, Pause
} from 'lucide-react'
import { tallyTestConnection, tallySync, tallyHealthCheck } from '@/lib/tally-proxy'
import { reverseSync } from '@/lib/tally-reverse-sync'
import { getQueueStats } from '@/lib/tally-retry-processor'
import TallyAutoSync from '@/components/tally/TallyAutoSync'
import TallyRetryQueue from '@/components/tally/TallyRetryQueue'

export default function TallyDashboard() {
  const [serverUrl, setServerUrl] = useState('http://localhost:9000')
  const [companyName, setCompanyName] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [connectionInfo, setConnectionInfo] = useState(null)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [autoSync, setAutoSync] = useState(false)
  const [syncInterval, setSyncInterval] = useState(30)
  const [configId, setConfigId] = useState(null)

  // Proxy health
  const [proxyOnline, setProxyOnline] = useState<boolean | null>(null)

  // Sync state
  const [syncing, setSyncing] = useState(null) // null or sync type
  const [syncProgress, setSyncProgress] = useState(0)

  // Stats
  const [stats, setStats] = useState({
    ledgers: 0, vouchers: 0, stockItems: 0, reports: 0
  })
  const [financials, setFinancials] = useState({
    cashInHand: 0, bankBalance: 0, receivables: 0, payables: 0
  })

  // Reverse sync
  const [reverseSyncing, setReverseSyncing] = useState(false)
  const [reverseSyncResult, setReverseSyncResult] = useState<{
    matched: number; updated: number; newLedgers: number; unmatched: string[];
  } | null>(null)
  const [showReverseSyncModal, setShowReverseSyncModal] = useState(false)

  // Queue stats
  const [queuePending, setQueuePending] = useState(0)

  // Sync logs
  const [syncLogs, setSyncLogs] = useState([])

  // Auto-sync scheduler state
  const autoSyncTimerRef = useRef(null)
  const [nextSyncAt, setNextSyncAt] = useState(null)
  const [lastSyncAt, setLastSyncAt] = useState(null)
  const [autoSyncQueue, setAutoSyncQueue] = useState([])
  const [autoSyncCurrent, setAutoSyncCurrent] = useState(null)
  const [autoSyncCompleted, setAutoSyncCompleted] = useState(0)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    loadConfig()
    loadStats()
    loadSyncLogs()
    checkProxyHealth()
    loadQueueStats()
  }, [])

  async function loadQueueStats() {
    try {
      const qs = await getQueueStats()
      setQueuePending(qs.pending)
    } catch {}
  }

  async function checkProxyHealth() {
    const result = await tallyHealthCheck()
    setProxyOnline(result?.status === 'ok')
  }

  // Check if auto-sync is overdue and trigger it
  useEffect(() => {
    if (!configId || !serverUrl || !companyName) return
    async function checkOverdue() {
      const { data } = await supabase
        .from('tally_config')
        .select('metadata')
        .eq('id', configId)
        .single()
      const autoSyncCfg = data?.metadata?.autoSync
      if (!autoSyncCfg?.enabled || !autoSyncCfg?.nextSyncAt) return
      if (Date.now() >= new Date(autoSyncCfg.nextSyncAt).getTime()) {
        toast.info('Auto-sync is overdue — triggering now...')
        runAutoSync()
      }
    }
    checkOverdue()
  }, [configId, serverUrl, companyName])

  async function loadConfig() {
    const { data } = await supabase
      .from('tally_config')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (data) {
      setServerUrl(data.server_url || 'http://localhost:9000')
      setCompanyName(data.company_name || '')
      setAutoSync(data.auto_sync_enabled || false)
      setSyncInterval(data.sync_interval_minutes || 30)
      setConfigId(data.id)
    }
  }

  async function loadStats() {
    const [ledgers, vouchers, stock, reports] = await Promise.all([
      supabase.from('tally_ledgers').select('*', { count: 'exact', head: true }),
      supabase.from('tally_vouchers').select('*', { count: 'exact', head: true }),
      supabase.from('tally_stock_items').select('*', { count: 'exact', head: true }),
      supabase.from('tally_reports').select('*', { count: 'exact', head: true }),
    ])
    setStats({
      ledgers: ledgers.count || 0,
      vouchers: vouchers.count || 0,
      stockItems: stock.count || 0,
      reports: reports.count || 0,
    })

    // Load financial snapshot from ledgers
    const { data: cashLedgers } = await supabase
      .from('tally_ledgers')
      .select('name, closing_balance, parent_group')
      .or('parent_group.ilike.%cash%,parent_group.ilike.%bank%')

    if (cashLedgers) {
      let cash = 0, bank = 0
      for (const l of cashLedgers) {
        const pg = (l.parent_group || '').toLowerCase()
        if (pg.includes('cash')) cash += Math.abs(l.closing_balance || 0)
        else if (pg.includes('bank')) bank += Math.abs(l.closing_balance || 0)
      }
      setFinancials(prev => ({ ...prev, cashInHand: cash, bankBalance: bank }))
    }

    const { data: debtors } = await supabase
      .from('tally_ledgers')
      .select('closing_balance')
      .ilike('parent_group', '%sundry debtor%')

    const { data: creditors } = await supabase
      .from('tally_ledgers')
      .select('closing_balance')
      .ilike('parent_group', '%sundry creditor%')

    setFinancials(prev => ({
      ...prev,
      receivables: (debtors || []).reduce((s, l) => s + Math.abs(l.closing_balance || 0), 0),
      payables: (creditors || []).reduce((s, l) => s + Math.abs(l.closing_balance || 0), 0),
    }))
  }

  async function loadSyncLogs() {
    const { data } = await supabase
      .from('tally_sync_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20)

    setSyncLogs(data || [])
  }

  async function testConnection() {
    setIsTesting(true)
    try {
      const result = await tallyTestConnection(serverUrl, companyName)

      if (result.connected) {
        setIsConnected(true)
        setConnectionInfo(result)
        toast.success(`Connected to TallyPrime! Found ${result.companies.length} company(ies)`)
      } else {
        setIsConnected(false)
        setConnectionInfo(null)
        toast.error(result.error || 'Cannot connect to Tally server')
      }
    } catch (err) {
      setIsConnected(false)
      toast.error('Failed to test connection')
    }
    setIsTesting(false)
  }

  async function saveConfig() {
    setIsSaving(true)
    try {
      const payload = {
        company_name: companyName,
        server_url: serverUrl,
        is_active: true,
        auto_sync_enabled: autoSync,
        sync_interval_minutes: syncInterval,
        updated_at: new Date().toISOString(),
      }

      if (configId) {
        await supabase.from('tally_config').update(payload).eq('id', configId)
      } else {
        const { data } = await supabase.from('tally_config').insert(payload).select().single()
        if (data) setConfigId(data.id)
      }
      toast.success('Configuration saved')
    } catch (err) {
      toast.error('Failed to save configuration')
    }
    setIsSaving(false)
  }

  // Auto-sync scheduler
  const runAutoSync = useCallback(async () => {
    if (!serverUrl || !companyName) return
    const syncTypes = ['ledgers', 'vouchers', 'stock', 'reports']
    setAutoSyncQueue(syncTypes)
    setAutoSyncCompleted(0)

    for (let i = 0; i < syncTypes.length; i++) {
      setAutoSyncCurrent(syncTypes[i])
      setAutoSyncCompleted(i)
      try {
        await tallySync(syncTypes[i], serverUrl, companyName)
      } catch {}
    }

    setAutoSyncCurrent(null)
    setAutoSyncCompleted(syncTypes.length)
    setAutoSyncQueue([])
    setLastSyncAt(new Date())
    await loadStats()
    await loadSyncLogs()
  }, [serverUrl, companyName])

  useEffect(() => {
    if (autoSyncTimerRef.current) {
      clearInterval(autoSyncTimerRef.current)
      autoSyncTimerRef.current = null
    }

    if (autoSync && companyName && serverUrl) {
      const intervalMs = syncInterval * 60 * 1000
      setNextSyncAt(new Date(Date.now() + intervalMs))

      autoSyncTimerRef.current = setInterval(() => {
        runAutoSync()
        setNextSyncAt(new Date(Date.now() + intervalMs))
      }, intervalMs)
    } else {
      setNextSyncAt(null)
    }

    return () => {
      if (autoSyncTimerRef.current) clearInterval(autoSyncTimerRef.current)
    }
  }, [autoSync, syncInterval, companyName, serverUrl, runAutoSync])

  // Countdown timer
  useEffect(() => {
    if (!nextSyncAt || !autoSync) { setCountdown(0); return }
    const timer = setInterval(() => {
      const diff = Math.max(0, Math.round((nextSyncAt.getTime() - Date.now()) / 1000))
      setCountdown(diff)
    }, 1000)
    return () => clearInterval(timer)
  }, [nextSyncAt, autoSync])

  function formatCountdown(secs) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  async function runSync(action) {
    setSyncing(action)
    setSyncProgress(10)
    try {
      const progressTimer = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 10, 90))
      }, 1000)

      const result = await tallySync(action, serverUrl, companyName)
      clearInterval(progressTimer)
      setSyncProgress(100)

      if (result.success) {
        toast.success(`Sync complete: ${result.recordsSynced} records synced${result.recordsFailed ? `, ${result.recordsFailed} failed` : ''}`)
      } else {
        toast.error(result.error || 'Sync failed')
      }

      await loadStats()
      await loadSyncLogs()
    } catch (err) {
      toast.error('Sync request failed')
    }
    setSyncing(null)
    setSyncProgress(0)
  }

  function formatCurrency(val) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0)
  }

  function formatDate(d) {
    if (!d) return '-'
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  async function runReverseSync() {
    if (!serverUrl || !companyName) {
      toast.error('Configure Tally connection first')
      return
    }
    setReverseSyncing(true)
    try {
      const result = await reverseSync(serverUrl, companyName)
      setReverseSyncResult(result)
      setShowReverseSyncModal(true)
      toast.success(`Reverse sync: ${result.matched} matched, ${result.updated} updated, ${result.newLedgers} new ledgers`)
      await loadStats()
      await loadSyncLogs()
    } catch (err) {
      toast.error('Reverse sync failed')
    }
    setReverseSyncing(false)
  }

  return (
    <div className="space-y-6">
      {/* Connection Panel */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            TallyPrime Server Connection
          </h2>
          <div className="flex items-center gap-2">
            {proxyOnline !== null && (
              proxyOnline ? (
                <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <CheckCircle className="h-4 w-4" /> Proxy: Online
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-red-500 bg-red-50 px-3 py-1 rounded-full">
                  <XCircle className="h-4 w-4" /> Proxy: Offline
                </span>
              )
            )}
            {isConnected ? (
              <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <Wifi className="h-4 w-4" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-red-500 bg-red-50 px-3 py-1 rounded-full">
                <WifiOff className="h-4 w-4" /> Disconnected
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Server URL</label>
            <input
              type="text"
              value={serverUrl}
              onChange={e => setServerUrl(e.target.value)}
              placeholder="http://localhost:9000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Your Company Name in Tally"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {connectionInfo && isConnected && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm">
            <p className="font-medium text-green-800">Connected to TallyPrime (v{connectionInfo.version})</p>
            {connectionInfo.companies.length > 0 && (
              <p className="text-green-700 mt-1">
                Companies: {connectionInfo.companies.join(', ')}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Auto-Sync</label>
            <button
              onClick={() => setAutoSync(!autoSync)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoSync ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoSync ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {autoSync && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Every</label>
              <select
                value={syncInterval}
                onChange={e => setSyncInterval(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={360}>6 hours</option>
              </select>
            </div>
          )}
        </div>

        {/* Auto-sync status bar */}
        {autoSync && companyName && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm font-medium text-green-800">Auto-Sync Active</span>
                <span className="text-xs text-green-600">Every {syncInterval} min</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-green-700">
                {countdown > 0 && (
                  <span>Next sync in <span className="font-mono font-bold">{formatCountdown(countdown)}</span></span>
                )}
                {lastSyncAt && (
                  <span>Last: {lastSyncAt.toLocaleTimeString('en-IN')}</span>
                )}
              </div>
            </div>
            {autoSyncCurrent && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-green-700 mb-1">
                  <span>Syncing {autoSyncCurrent}...</span>
                  <span>{autoSyncCompleted}/{autoSyncQueue.length} complete</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-1.5">
                  <div className="bg-green-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${autoSyncQueue.length > 0 ? (autoSyncCompleted / autoSyncQueue.length) * 100 : 0}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={testConnection}
            disabled={isTesting || !serverUrl}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
            Test Connection
          </button>
          <button
            onClick={saveConfig}
            disabled={isSaving || !companyName}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Configuration
          </button>
        </div>
      </div>

      {/* Auto-Sync Schedule */}
      <TallyAutoSync serverUrl={serverUrl} companyName={companyName} configId={configId} />

      {/* Sync Control Panel */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <RefreshCw className="h-5 w-5 text-blue-600" />
          Sync Control
        </h2>

        {syncing && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Syncing {syncing}...</span>
              <span className="text-blue-600 font-medium">{syncProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { action: 'full', label: 'Sync All', icon: RefreshCw, color: 'blue' },
            { action: 'ledgers', label: 'Ledgers', icon: Database, color: 'indigo' },
            { action: 'groups', label: 'Groups', icon: FileText, color: 'purple' },
            { action: 'stock', label: 'Stock', icon: Package, color: 'emerald' },
            { action: 'vouchers', label: 'Vouchers', icon: ArrowDownToLine, color: 'orange' },
            { action: 'reports', label: 'Reports', icon: BarChart3, color: 'teal' },
          ].map(({ action, label, icon: Icon, color }) => (
            <button
              key={action}
              onClick={() => runSync(action)}
              disabled={!!syncing || !companyName}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-${color}-200 bg-${color}-50 hover:bg-${color}-100 disabled:opacity-50 transition-colors text-sm font-medium text-${color}-700`}
            >
              {syncing === action ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
              {label}
            </button>
          ))}
        </div>

        {/* Reverse Sync Button */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={runReverseSync}
            disabled={reverseSyncing || !companyName}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {reverseSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
            Reverse Sync (Tally → Adamrit)
          </button>
          <p className="text-xs text-gray-500 mt-1">Pull receipts from Tally and match to unpaid bills in Adamrit</p>
        </div>
      </div>

      {/* Reverse Sync Results Modal */}
      {showReverseSyncModal && reverseSyncResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowReverseSyncModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reverse Sync Results</h3>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">{reverseSyncResult.matched}</p>
                <p className="text-xs text-green-600">Matched</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-700">{reverseSyncResult.updated}</p>
                <p className="text-xs text-blue-600">Updated</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-700">{reverseSyncResult.newLedgers}</p>
                <p className="text-xs text-purple-600">New Ledgers</p>
              </div>
            </div>

            {reverseSyncResult.unmatched.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Unmatched Receipts ({reverseSyncResult.unmatched.length})
                </p>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {reverseSyncResult.unmatched.map((item, i) => (
                    <p key={i} className="text-xs text-gray-600 py-1 border-b border-gray-100 last:border-0">{item}</p>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowReverseSyncModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Data Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Ledgers Synced', value: stats.ledgers, icon: Database, color: 'blue' },
          { label: 'Vouchers Synced', value: stats.vouchers, icon: FileText, color: 'indigo' },
          { label: 'Stock Items', value: stats.stockItems, icon: Package, color: 'emerald' },
          { label: 'Reports Cached', value: stats.reports, icon: BarChart3, color: 'purple' },
          { label: 'Queue Pending', value: queuePending, icon: Clock, color: 'orange' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
              </div>
              <div className={`p-3 bg-${color}-100 rounded-lg`}>
                <Icon className={`h-6 w-6 text-${color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Snapshot */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Snapshot (from Tally)</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">Cash in Hand</p>
            <p className="text-xl font-bold text-green-800 mt-1">{formatCurrency(financials.cashInHand)}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">Bank Balance</p>
            <p className="text-xl font-bold text-blue-800 mt-1">{formatCurrency(financials.bankBalance)}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-700">Total Receivables</p>
            <p className="text-xl font-bold text-orange-800 mt-1">{formatCurrency(financials.receivables)}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-700">Total Payables</p>
            <p className="text-xl font-bold text-red-800 mt-1">{formatCurrency(financials.payables)}</p>
          </div>
        </div>
      </div>

      {/* Retry Queue */}
      <TallyRetryQueue />

      {/* Sync Log Table */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Sync Activity</h2>
        {syncLogs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No sync activity yet. Click a sync button above to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Type</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Direction</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Synced</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Failed</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Duration</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {syncLogs.map(log => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 capitalize font-medium text-gray-900">{log.sync_type}</td>
                    <td className="py-2 px-3">
                      <span className="flex items-center gap-1 text-gray-600">
                        {log.direction === 'inward' ? <ArrowDownToLine className="h-3 w-3" /> : <ArrowUpFromLine className="h-3 w-3" />}
                        {log.direction}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.status === 'completed' ? 'bg-green-100 text-green-700' :
                        log.status === 'failed' ? 'bg-red-100 text-red-700' :
                        log.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {log.status === 'completed' ? <CheckCircle className="h-3 w-3" /> :
                         log.status === 'failed' ? <XCircle className="h-3 w-3" /> :
                         <Clock className="h-3 w-3" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-gray-900">{log.records_synced || 0}</td>
                    <td className="py-2 px-3 text-right text-red-600">{log.records_failed || 0}</td>
                    <td className="py-2 px-3 text-right text-gray-600">
                      {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '-'}
                    </td>
                    <td className="py-2 px-3 text-gray-600">{formatDate(log.started_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
