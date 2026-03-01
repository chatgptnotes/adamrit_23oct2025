import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { tallySync } from '@/lib/tally-proxy'
import {
  Clock, Play, Pause, RefreshCw, Loader2,
  CheckCircle, XCircle, Settings
} from 'lucide-react'

interface AutoSyncConfig {
  enabled: boolean
  intervalHours: number
  syncItems: string[]
  lastSyncAt: string | null
  nextSyncAt: string | null
}

const SYNC_ITEM_OPTIONS = [
  { key: 'ledgers', label: 'Ledgers' },
  { key: 'groups', label: 'Groups' },
  { key: 'stock', label: 'Stock' },
  { key: 'vouchers', label: 'Vouchers' },
  { key: 'reports', label: 'Reports' },
  { key: 'gst-r1', label: 'GST' },
]

const INTERVAL_OPTIONS = [
  { value: 1, label: 'Every 1 hour' },
  { value: 2, label: 'Every 2 hours' },
  { value: 4, label: 'Every 4 hours' },
  { value: 6, label: 'Every 6 hours' },
  { value: 12, label: 'Every 12 hours' },
  { value: 24, label: 'Every 24 hours' },
]

interface Props {
  serverUrl: string
  companyName: string
  configId: string | null
}

export default function TallyAutoSync({ serverUrl, companyName, configId }: Props) {
  const [config, setConfig] = useState<AutoSyncConfig>({
    enabled: false,
    intervalHours: 4,
    syncItems: ['ledgers', 'groups', 'stock', 'vouchers'],
    lastSyncAt: null,
    nextSyncAt: null,
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState<{ current: string; completed: number; total: number } | null>(null)
  const [syncResults, setSyncResults] = useState<{ item: string; success: boolean; records: number }[]>([])
  const [countdown, setCountdown] = useState(0)
  const [saving, setSaving] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load config from tally_config.metadata
  useEffect(() => {
    if (!configId) return
    loadAutoSyncConfig()
  }, [configId])

  async function loadAutoSyncConfig() {
    const { data } = await supabase
      .from('tally_config')
      .select('metadata')
      .eq('id', configId)
      .single()

    if (data?.metadata?.autoSync) {
      setConfig(data.metadata.autoSync)
    }
  }

  // Save config to tally_config.metadata
  async function saveConfig(newConfig: AutoSyncConfig) {
    if (!configId) {
      toast.error('No Tally configuration found. Save connection settings first.')
      return
    }
    setSaving(true)
    const { data: existing } = await supabase
      .from('tally_config')
      .select('metadata')
      .eq('id', configId)
      .single()

    const metadata = { ...(existing?.metadata || {}), autoSync: newConfig }

    await supabase
      .from('tally_config')
      .update({ metadata, updated_at: new Date().toISOString() })
      .eq('id', configId)

    setConfig(newConfig)
    setSaving(false)
    toast.success('Auto-sync schedule saved')
  }

  // Run sync for all selected items
  const runSyncNow = useCallback(async () => {
    if (!serverUrl || !companyName || config.syncItems.length === 0) return
    setIsSyncing(true)
    setSyncResults([])
    const items = config.syncItems
    const results: { item: string; success: boolean; records: number }[] = []

    for (let i = 0; i < items.length; i++) {
      setSyncProgress({ current: items[i], completed: i, total: items.length })
      try {
        const result = await tallySync(items[i], serverUrl, companyName)
        results.push({
          item: items[i],
          success: result.success !== false,
          records: result.recordsSynced || 0,
        })
      } catch {
        results.push({ item: items[i], success: false, records: 0 })
      }
    }

    setSyncProgress(null)
    setSyncResults(results)
    setIsSyncing(false)

    const now = new Date().toISOString()
    const nextAt = new Date(Date.now() + config.intervalHours * 60 * 60 * 1000).toISOString()
    const updated = { ...config, lastSyncAt: now, nextSyncAt: config.enabled ? nextAt : null }
    setConfig(updated)

    // Persist timestamps
    if (configId) {
      const { data: existing } = await supabase
        .from('tally_config')
        .select('metadata')
        .eq('id', configId)
        .single()
      const metadata = { ...(existing?.metadata || {}), autoSync: updated }
      await supabase
        .from('tally_config')
        .update({ metadata, last_sync_at: now, updated_at: now })
        .eq('id', configId)
    }

    const totalRecords = results.reduce((s, r) => s + r.records, 0)
    const failures = results.filter(r => !r.success).length
    if (failures === 0) {
      toast.success(`Auto-sync complete: ${totalRecords} records synced`)
    } else {
      toast.warning(`Sync done with ${failures} failure(s): ${totalRecords} records synced`)
    }
  }, [serverUrl, companyName, config, configId])

  // Scheduler: setInterval to check if sync is due
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (!config.enabled || !serverUrl || !companyName) return

    // Check every 30 seconds if sync is due
    timerRef.current = setInterval(() => {
      if (isSyncing) return
      const nextAt = config.nextSyncAt ? new Date(config.nextSyncAt).getTime() : 0
      if (nextAt && Date.now() >= nextAt) {
        runSyncNow()
      }
    }, 30000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [config.enabled, config.nextSyncAt, serverUrl, companyName, isSyncing, runSyncNow])

  // Countdown display
  useEffect(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }

    if (!config.enabled || !config.nextSyncAt) {
      setCountdown(0)
      return
    }

    countdownRef.current = setInterval(() => {
      const diff = Math.max(0, Math.round((new Date(config.nextSyncAt!).getTime() - Date.now()) / 1000))
      setCountdown(diff)
    }, 1000)

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [config.enabled, config.nextSyncAt])

  function formatCountdown(secs: number) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}h ${m}m ${String(s).padStart(2, '0')}s`
    return `${m}:${String(s).padStart(2, '0')}`
  }

  function formatDateTime(iso: string | null) {
    if (!iso) return '-'
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  function handleToggle() {
    const nextSyncAt = !config.enabled
      ? new Date(Date.now() + config.intervalHours * 60 * 60 * 1000).toISOString()
      : null
    const updated = { ...config, enabled: !config.enabled, nextSyncAt }
    saveConfig(updated)
  }

  function handleIntervalChange(hours: number) {
    const nextSyncAt = config.enabled
      ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
      : config.nextSyncAt
    const updated = { ...config, intervalHours: hours, nextSyncAt }
    saveConfig(updated)
  }

  function handleSyncItemToggle(key: string) {
    const items = config.syncItems.includes(key)
      ? config.syncItems.filter(k => k !== key)
      : [...config.syncItems, key]
    const updated = { ...config, syncItems: items }
    saveConfig(updated)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Auto-Sync Schedule
        </h2>
        <div className="flex items-center gap-3">
          {config.enabled && (
            <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Active
            </span>
          )}
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Interval selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Sync Interval</label>
        <div className="flex flex-wrap gap-2">
          {INTERVAL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleIntervalChange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                config.intervalHours === opt.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sync items checkboxes */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">What to Sync</label>
        <div className="flex flex-wrap gap-3">
          {SYNC_ITEM_OPTIONS.map(opt => (
            <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.syncItems.includes(opt.key)}
                onChange={() => handleSyncItemToggle(opt.key)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Timing info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Last Sync</p>
          <p className="text-sm font-medium text-gray-900">{formatDateTime(config.lastSyncAt)}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Next Scheduled Sync</p>
          <p className="text-sm font-medium text-gray-900">{formatDateTime(config.nextSyncAt)}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Countdown</p>
          <p className="text-sm font-mono font-bold text-blue-700">
            {config.enabled && countdown > 0 ? formatCountdown(countdown) : '-'}
          </p>
        </div>
      </div>

      {/* Sync progress */}
      {syncProgress && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-blue-700 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Syncing {syncProgress.current}...
            </span>
            <span className="text-blue-600 font-medium">
              {syncProgress.completed}/{syncProgress.total}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${syncProgress.total > 0 ? (syncProgress.completed / syncProgress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Sync results */}
      {syncResults.length > 0 && !syncProgress && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Last Sync Results</p>
          <div className="flex flex-wrap gap-2">
            {syncResults.map((r, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                  r.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {r.success ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {r.item}: {r.records}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sync Now button */}
      <button
        onClick={runSyncNow}
        disabled={isSyncing || !serverUrl || !companyName || config.syncItems.length === 0}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
      >
        {isSyncing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        Sync Now
      </button>
    </div>
  )
}
