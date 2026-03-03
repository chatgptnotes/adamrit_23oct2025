/**
 * Tally Data Export Directory Sync Script
 * ----------------------------------------
 * Reads XML files exported by Tally Prime from a shared/VPN-mounted folder
 * and pushes the data into Supabase (which Adam Rith reads from).
 *
 * Usage:
 *   node scripts/sync-tally-export.js
 *
 * Or with a custom export path:
 *   TALLY_EXPORT_DIR="Z:/DataExport" node scripts/sync-tally-export.js
 *
 * Schedule with cron (Linux/Mac) — runs every hour:
 *   0 * * * * node /path/to/adamrit/scripts/sync-tally-export.js >> /tmp/tally-sync.log 2>&1
 *
 * Schedule with Task Scheduler (Windows):
 *   Create a Basic Task → Daily/Hourly → Action: node C:\path\adamrit\scripts\sync-tally-export.js
 *
 * Environment variables — add to .env or set in shell before running:
 *   VITE_SUPABASE_URL          (already in .env)
 *   SUPABASE_SERVICE_ROLE_KEY  get from: Supabase Dashboard → Project Settings → API → service_role key
 *   TALLY_EXPORT_DIR           path to the VPN-mounted export folder
 *     Windows example:  Z:\DataExport
 *     macOS example:    /Volumes/DataExport
 *     Linux example:    /mnt/tally-export
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load .env file
config()

// ─── Configuration ─────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xvkxccqaopbnkvwgyfjv.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const EXPORT_DIR   = process.env.TALLY_EXPORT_DIR || './tally-exports'

// Known filenames Tally uses when exporting (tries each in order, uses first found).
// Adjust if your Tally exports use different filenames.
const EXPORT_FILES = {
  daybook:      ['DayBook.xml', 'daybook.xml', 'Day Book.xml'],
  ledgers:      ['LedgerList.xml', 'ledgerlist.xml', 'Ledger.xml', 'List of Ledgers.xml'],
  groups:       ['GroupList.xml', 'grouplist.xml', 'List of Groups.xml'],
  stockItems:   ['StockItems.xml', 'stockitems.xml', 'List of Stock Items.xml'],
  trialBalance: ['TrialBalance.xml', 'trialbalance.xml', 'Trial Balance.xml'],
}

// ─── XML Parsing Helpers ────────────────────────────────────────────────────

function getVal(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'))
  return m ? m[1].trim() : ''
}

function getAll(xml, tag) {
  return xml.match(new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, 'gi')) || []
}

function getAttr(xml, attr) {
  const m = xml.match(new RegExp(`${attr}="([^"]*)"`, 'i'))
  return m ? m[1] : ''
}

function parseNum(str) {
  const v = parseFloat(str || '0')
  return isNaN(v) ? 0 : v
}

function formatDate(raw) {
  // Tally date format: YYYYMMDD → YYYY-MM-DD
  if (!raw || raw.length !== 8) return null
  return `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`
}

// ─── File Helpers ───────────────────────────────────────────────────────────

function findFile(candidates) {
  for (const name of candidates) {
    const full = path.join(EXPORT_DIR, name)
    if (fs.existsSync(full)) return full
  }
  return null
}

// ─── Sync: Ledgers ──────────────────────────────────────────────────────────

async function syncLedgers(supabase) {
  const filePath = findFile(EXPORT_FILES.ledgers)
  if (!filePath) { console.log('  [SKIP] No ledger export file found'); return 0 }

  const xml = fs.readFileSync(filePath, 'utf8')
  const elements = getAll(xml, 'LEDGER')
  console.log(`  [LEDGERS] ${elements.length} found in ${path.basename(filePath)}`)

  let synced = 0, failed = 0
  for (const el of elements) {
    try {
      const name = getVal(el, 'NAME') || getAttr(el, 'NAME')
      if (!name) continue
      const guid = getVal(el, 'GUID') || getAttr(el, 'GUID') || null

      await supabase.from('tally_ledgers').upsert({
        name,
        tally_guid:       guid,
        parent_group:     getVal(el, 'PARENT') || null,
        opening_balance:  parseNum(getVal(el, 'OPENINGBALANCE')),
        closing_balance:  parseNum(getVal(el, 'CLOSINGBALANCE')),
        address:          getVal(el, 'ADDRESS') || null,
        phone:            getVal(el, 'LEDGERPHONE') || getVal(el, 'PHONE') || null,
        email:            getVal(el, 'EMAIL') || getVal(el, 'LEDGEREMAIL') || null,
        gst_number:       getVal(el, 'PARTYGSTIN') || null,
        pan_number:       getVal(el, 'INCOMETAXNUMBER') || null,
        last_synced_at:   new Date().toISOString(),
      }, { onConflict: guid ? 'tally_guid' : 'name', ignoreDuplicates: false })
      synced++
    } catch (e) { failed++; console.error(`    [ERROR] ${e.message}`) }
  }
  console.log(`  [LEDGERS] Synced: ${synced}, Failed: ${failed}`)
  return synced
}

// ─── Sync: Groups ───────────────────────────────────────────────────────────

async function syncGroups(supabase) {
  const filePath = findFile(EXPORT_FILES.groups)
  if (!filePath) { console.log('  [SKIP] No groups export file found'); return 0 }

  const xml = fs.readFileSync(filePath, 'utf8')
  const elements = getAll(xml, 'GROUP')
  console.log(`  [GROUPS] ${elements.length} found`)

  let synced = 0, failed = 0
  for (const el of elements) {
    try {
      const name = getVal(el, 'NAME') || getAttr(el, 'NAME')
      if (!name) continue
      await supabase.from('tally_groups').upsert({
        name,
        parent_group:       getVal(el, 'PARENT') || null,
        nature_of_group:    getVal(el, 'NATUREOFGROUP') || null,
        is_revenue:         (getVal(el, 'NATUREOFGROUP') || '').toLowerCase().includes('revenue'),
        is_deemed_positive: getVal(el, 'ISDEEMEDPOSITIVE') === 'Yes',
        last_synced_at:     new Date().toISOString(),
      }, { onConflict: 'name' })
      synced++
    } catch (e) { failed++; console.error(`    [ERROR] ${e.message}`) }
  }
  console.log(`  [GROUPS] Synced: ${synced}, Failed: ${failed}`)
  return synced
}

// ─── Sync: Stock Items ──────────────────────────────────────────────────────

async function syncStockItems(supabase) {
  const filePath = findFile(EXPORT_FILES.stockItems)
  if (!filePath) { console.log('  [SKIP] No stock items export file found'); return 0 }

  const xml = fs.readFileSync(filePath, 'utf8')
  const elements = getAll(xml, 'STOCKITEM')
  console.log(`  [STOCK] ${elements.length} found`)

  let synced = 0, failed = 0
  for (const el of elements) {
    try {
      const name = getVal(el, 'NAME') || getAttr(el, 'NAME')
      if (!name) continue
      const guid = getVal(el, 'GUID') || getAttr(el, 'GUID') || null
      await supabase.from('tally_stock_items').upsert({
        name,
        tally_guid:      guid,
        stock_group:     getVal(el, 'PARENT') || getVal(el, 'STOCKGROUP') || null,
        unit:            getVal(el, 'BASEUNITS') || getVal(el, 'UNIT') || null,
        opening_balance: parseNum(getVal(el, 'OPENINGBALANCE')),
        closing_balance: parseNum(getVal(el, 'CLOSINGBALANCE')),
        opening_value:   parseNum(getVal(el, 'OPENINGVALUE')),
        closing_value:   parseNum(getVal(el, 'CLOSINGVALUE')),
        rate:            parseNum(getVal(el, 'CLOSINGRATE') || getVal(el, 'RATE')),
        gst_rate:        parseNum(getVal(el, 'GSTRATE')),
        hsn_code:        getVal(el, 'HSNCODE') || getVal(el, 'HSNSACCODE') || null,
        last_synced_at:  new Date().toISOString(),
      }, { onConflict: guid ? 'tally_guid' : 'name', ignoreDuplicates: false })
      synced++
    } catch (e) { failed++; console.error(`    [ERROR] ${e.message}`) }
  }
  console.log(`  [STOCK] Synced: ${synced}, Failed: ${failed}`)
  return synced
}

// ─── Sync: Vouchers (Day Book) ──────────────────────────────────────────────

async function syncVouchers(supabase) {
  const filePath = findFile(EXPORT_FILES.daybook)
  if (!filePath) { console.log('  [SKIP] No Day Book export file found'); return 0 }

  const xml = fs.readFileSync(filePath, 'utf8')
  const elements = getAll(xml, 'VOUCHER')
  console.log(`  [VOUCHERS] ${elements.length} found in ${path.basename(filePath)}`)

  let synced = 0, failed = 0
  for (const el of elements) {
    try {
      const rawDate = getVal(el, 'DATE')
      const date = formatDate(rawDate)
      if (!date) continue

      const guid          = getVal(el, 'GUID') || getAttr(el, 'REMOTEID') || null
      const voucherNumber = getVal(el, 'VOUCHERNUMBER')
      const voucherType   = getVal(el, 'VOUCHERTYPENAME') || getAttr(el, 'VCHTYPE')

      const entryElements = getAll(el, 'ALLLEDGERENTRIES.LIST')
      const ledgerEntries = entryElements.map(entryEl => {
        const amt = parseNum(getVal(entryEl, 'AMOUNT'))
        return { ledger: getVal(entryEl, 'LEDGERNAME'), amount: Math.abs(amt), is_debit: amt < 0 }
      })

      const totalAmount = ledgerEntries
        .filter(e => e.is_debit)
        .reduce((sum, e) => sum + e.amount, 0)

      await supabase.from('tally_vouchers').upsert({
        tally_guid:     guid,
        voucher_number: voucherNumber,
        voucher_type:   voucherType,
        date,
        party_ledger:   getVal(el, 'PARTYLEDGERNAME') || null,
        amount:         totalAmount,
        narration:      getVal(el, 'NARRATION') || null,
        is_cancelled:   getVal(el, 'ISCANCELLED') === 'Yes',
        sync_direction: 'from_tally',
        sync_status:    'synced',
        ledger_entries: ledgerEntries,
        synced_at:      new Date().toISOString(),
      }, { onConflict: guid ? 'tally_guid' : 'voucher_number', ignoreDuplicates: false })
      synced++
    } catch (e) { failed++; console.error(`    [ERROR] ${e.message}`) }
  }
  console.log(`  [VOUCHERS] Synced: ${synced}, Failed: ${failed}`)
  return synced
}

// ─── Sync: Trial Balance ────────────────────────────────────────────────────

async function syncTrialBalance(supabase) {
  const filePath = findFile(EXPORT_FILES.trialBalance)
  if (!filePath) { console.log('  [SKIP] No Trial Balance export file found'); return 0 }

  const xml = fs.readFileSync(filePath, 'utf8')
  const today = new Date().toISOString().split('T')[0]

  await supabase.from('tally_reports').insert({
    report_type: 'trial_balance',
    report_date: today,
    data: { raw: xml, source: 'file_export' },
    fetched_at: new Date().toISOString(),
  })

  console.log('  [TRIAL BALANCE] Saved')
  return 1
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60))
  console.log(`Tally Export Sync  —  ${new Date().toLocaleString()}`)
  console.log(`Export directory:  ${EXPORT_DIR}`)
  console.log('='.repeat(60))

  if (!SUPABASE_KEY) {
    console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is not set.')
    console.error('Get it from: Supabase Dashboard → Project Settings → API → service_role key')
    console.error('Add it to your .env file:  SUPABASE_SERVICE_ROLE_KEY=your_key_here')
    process.exit(1)
  }

  if (!fs.existsSync(EXPORT_DIR)) {
    console.error(`ERROR: Export directory not found: ${EXPORT_DIR}`)
    console.error('Steps to fix:')
    console.error('  1. Connect the VPN client')
    console.error('  2. Mount the "Data Export" folder:')
    console.error('       Windows: Map network drive → assign drive letter (e.g. Z:)')
    console.error('       macOS:   Finder → Go → Connect to Server → smb://[vpn-ip]/DataExport')
    console.error('  3. Set TALLY_EXPORT_DIR=Z:/DataExport (Windows) or TALLY_EXPORT_DIR=/Volumes/DataExport (Mac)')
    process.exit(1)
  }

  const files = fs.readdirSync(EXPORT_DIR)
  console.log(`Files found: ${files.length > 0 ? files.join(', ') : '(none — export from Tally first)'}`)
  console.log('')

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  const results = {
    groups:       await syncGroups(supabase),
    ledgers:      await syncLedgers(supabase),
    stockItems:   await syncStockItems(supabase),
    vouchers:     await syncVouchers(supabase),
    trialBalance: await syncTrialBalance(supabase),
  }

  // Log this sync run
  const total = Object.values(results).reduce((a, b) => a + b, 0)
  await supabase.from('tally_sync_log').insert({
    sync_type: 'file_export_sync',
    direction: 'inward',
    status: 'completed',
    records_synced: total,
    completed_at: new Date().toISOString(),
  }).catch(e => console.warn('  [WARN] Could not write sync log:', e.message))

  console.log('')
  console.log('─'.repeat(60))
  console.log('Sync complete.')
  console.log(`  Groups:        ${results.groups}`)
  console.log(`  Ledgers:       ${results.ledgers}`)
  console.log(`  Stock Items:   ${results.stockItems}`)
  console.log(`  Vouchers:      ${results.vouchers}`)
  console.log(`  Reports saved: ${results.trialBalance}`)
  console.log(`  Total:         ${total} records`)
  console.log('─'.repeat(60))
}

main().catch(err => {
  console.error('FATAL:', err.message)
  process.exit(1)
})
