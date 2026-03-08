
import React, { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import {
  LayoutDashboard, BookOpen, FileText, Package,
  BarChart3, ArrowUpFromLine, Link2, Banknote, Landmark,
  Scale, FileBarChart
} from 'lucide-react'
import TallyDashboard from '@/components/tally/TallyDashboard'
import TallyLedgers from '@/components/tally/TallyLedgers'
import TallyVouchers from '@/components/tally/TallyVouchers'
import TallyStockItems from '@/components/tally/TallyStockItems'
import TallyReports from '@/components/tally/TallyReports'
import TallyBillSync from '@/components/tally/TallyBillSync'
import TallyMapping from '@/components/tally/TallyMapping'
import TallyCashBook from '@/components/tally/TallyCashBook'
import TallyBankBook from '@/components/tally/TallyBankBook'
import TallyBankReconciliation from '@/components/tally/TallyBankReconciliation'
import TallyGST from '@/components/tally/TallyGST'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'ledgers', label: 'Ledgers', icon: BookOpen },
  { id: 'vouchers', label: 'Vouchers', icon: FileText },
  { id: 'cashbook', label: 'Cash Book', icon: Banknote },
  { id: 'bankbook', label: 'Bank Book', icon: Landmark },
  { id: 'reconciliation', label: 'Reconciliation', icon: Scale },
  { id: 'stock', label: 'Stock Items', icon: Package },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'gst', label: 'GST', icon: FileBarChart },
  { id: 'billsync', label: 'Bill Sync', icon: ArrowUpFromLine },
  { id: 'mapping', label: 'Mapping', icon: Link2 },
]

export default function TallyPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [serverUrl, setServerUrl] = useState('http://localhost:9000')
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase
        .from('tally_config')
        .select('server_url, company_name')
        .eq('is_active', true)
        .limit(1)
        .single()

      if (data) {
        setServerUrl(data.server_url || 'http://localhost:9000')
        setCompanyName(data.company_name || '')
      }
    }
    loadConfig()
  }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tally Integration</h1>
          <p className="text-sm text-gray-500 mt-1">
            TallyPrime Server two-way sync for Adamrit HMS
          </p>
        </div>
        {companyName && (
          <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
            Company: <span className="font-medium text-blue-700">{companyName}</span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'dashboard' && <TallyDashboard />}
        {activeTab === 'ledgers' && <TallyLedgers serverUrl={serverUrl} companyName={companyName} />}
        {activeTab === 'vouchers' && <TallyVouchers serverUrl={serverUrl} companyName={companyName} />}
        {activeTab === 'cashbook' && <TallyCashBook serverUrl={serverUrl} companyName={companyName} />}
        {activeTab === 'bankbook' && <TallyBankBook serverUrl={serverUrl} companyName={companyName} />}
        {activeTab === 'reconciliation' && <TallyBankReconciliation serverUrl={serverUrl} companyName={companyName} />}
        {activeTab === 'stock' && <TallyStockItems serverUrl={serverUrl} companyName={companyName} />}
        {activeTab === 'reports' && <TallyReports serverUrl={serverUrl} companyName={companyName} />}
        {activeTab === 'gst' && <TallyGST serverUrl={serverUrl} companyName={companyName} />}
        {activeTab === 'billsync' && <TallyBillSync serverUrl={serverUrl} companyName={companyName} />}
        {activeTab === 'mapping' && <TallyMapping serverUrl={serverUrl} companyName={companyName} />}
      </div>
    </div>
  )
}
