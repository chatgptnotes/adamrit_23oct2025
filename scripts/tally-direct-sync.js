/**
 * Tally Direct HTTP Sync Script
 * ─────────────────────────────
 * Connects directly to TallyPrime's built-in HTTP server (port 9000)
 * and pulls data into Supabase — no file export needed.
 *
 * Prerequisites:
 *   1. TallyPrime must be running with HTTP server enabled:
 *      Gateway of Tally → F12 → Advanced → Enable TallyPrime Server = Yes, Port = 9000
 *   2. Node.js 18+ installed on the Tally machine
 *
 * Usage:
 *   node scripts/tally-direct-sync.js                   # Full sync
 *   node scripts/tally-direct-sync.js --test             # Test connection only
 *   node scripts/tally-direct-sync.js --ledgers-only     # Sync only ledgers
 *   node scripts/tally-direct-sync.js --vouchers-only --from=2025-04-01 --to=2025-12-31
 *   node scripts/tally-direct-sync.js --help             # Show all options
 *
 * Environment variables (add to .env):
 *   TALLY_SERVER_URL         default: http://localhost
 *   TALLY_PORT               default: 9000
 *   TALLY_COMPANY_NAME       required — your Tally company name
 *   VITE_SUPABASE_URL        (already in .env)
 *   SUPABASE_SERVICE_ROLE_KEY get from: Supabase Dashboard → Project Settings → API → service_role key
 *   TALLY_SYNC_FROM_DATE     optional, default: current FY start (April 1)
 *   TALLY_SYNC_TO_DATE       optional, default: today
 *
 * Schedule with Windows Task Scheduler:
 *   1. Open Task Scheduler
 *   2. Create Basic Task → Name: "Tally Direct Sync"
 *   3. Trigger: Daily, repeat every 1 hour
 *   4. Action: Start a Program
 *      Program:   node
 *      Arguments: C:\path\to\adamrit\scripts\tally-direct-sync.js
 *      Start in:  C:\path\to\adamrit
 *   5. Properties → Settings → "Run whether user is logged on or not"
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load .env file
config()

// ─── Colors (ANSI escape codes) ──────────────────────────────────────────────

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m',
  magenta: '\x1b[35m', white: '\x1b[37m',
}

function logOk(msg)   { console.log(`  ${C.green}[OK]${C.reset}   ${msg}`) }
function logErr(msg)  { console.log(`  ${C.red}[ERR]${C.reset}  ${msg}`) }
function logWarn(msg) { console.log(`  ${C.yellow}[WARN]${C.reset} ${msg}`) }
function logInfo(msg) { console.log(`  ${C.cyan}[INFO]${C.reset} ${msg}`) }
function logSkip(msg) { console.log(`  ${C.dim}[SKIP]${C.reset} ${msg}`) }

// ─── Configuration ───────────────────────────────────────────────────────────

const TALLY_SERVER_URL = process.env.TALLY_SERVER_URL || 'http://localhost'
const TALLY_PORT       = process.env.TALLY_PORT || '9000'
const TALLY_URL        = `${TALLY_SERVER_URL}:${TALLY_PORT}`
const COMPANY_NAME     = process.env.TALLY_COMPANY_NAME || ''
const SUPABASE_URL     = process.env.VITE_SUPABASE_URL || 'https://xvkxccqaopbnkvwgyfjv.supabase.co'
const SUPABASE_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY

// ─── CLI Argument Parsing ────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2)
  const flags = {
    test: false, help: false,
    ledgersOnly: false, groupsOnly: false, stockOnly: false,
    vouchersOnly: false, reportsOnly: false, gstOnly: false,
    from: null, to: null,
  }

  for (const arg of args) {
    if (arg === '--test') flags.test = true
    else if (arg === '--help' || arg === '-h') flags.help = true
    else if (arg === '--ledgers-only') flags.ledgersOnly = true
    else if (arg === '--groups-only') flags.groupsOnly = true
    else if (arg === '--stock-only') flags.stockOnly = true
    else if (arg === '--vouchers-only') flags.vouchersOnly = true
    else if (arg === '--reports-only') flags.reportsOnly = true
    else if (arg === '--gst-only') flags.gstOnly = true
    else if (arg.startsWith('--from=')) flags.from = arg.split('=')[1]
    else if (arg.startsWith('--to=')) flags.to = arg.split('=')[1]
    else { console.error(`Unknown argument: ${arg}. Use --help for usage.`); process.exit(1) }
  }

  // Check if any --*-only flag is set
  const hasOnlyFlag = flags.ledgersOnly || flags.groupsOnly || flags.stockOnly ||
                      flags.vouchersOnly || flags.reportsOnly || flags.gstOnly
  // If no --*-only flag, run all
  flags.runAll = !hasOnlyFlag

  return flags
}

function showHelp() {
  console.log(`
${C.bold}Tally Direct HTTP Sync${C.reset}
Pulls data from TallyPrime HTTP API and pushes to Supabase.

${C.cyan}Usage:${C.reset}
  node scripts/tally-direct-sync.js [options]

${C.cyan}Options:${C.reset}
  --test              Test Tally connection only (no sync)
  --ledgers-only      Sync only ledgers
  --groups-only       Sync only groups
  --stock-only        Sync only stock items
  --vouchers-only     Sync only vouchers (Day Book)
  --reports-only      Sync only financial reports
  --gst-only          Sync only GST data
  --from=YYYY-MM-DD   Start date for vouchers/reports (default: FY start)
  --to=YYYY-MM-DD     End date for vouchers/reports (default: today)
  --help, -h          Show this help message

${C.cyan}Examples:${C.reset}
  node scripts/tally-direct-sync.js                          # Full sync
  node scripts/tally-direct-sync.js --test                   # Test connection
  node scripts/tally-direct-sync.js --vouchers-only --from=2025-04-01
  node scripts/tally-direct-sync.js --ledgers-only --groups-only  # Multiple categories

${C.cyan}Environment variables (.env):${C.reset}
  TALLY_SERVER_URL=http://localhost
  TALLY_PORT=9000
  TALLY_COMPANY_NAME=Your Company Name
  VITE_SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your_key_here
`)
}

// ─── XML Parsing Helpers (reused from sync-tally-export.js) ──────────────────

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
  if (!raw || raw.length !== 8) return null
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
}

function toTallyDate(dateStr) {
  return (dateStr || '').replace(/-/g, '')
}

// ─── HTTP Communication ──────────────────────────────────────────────────────

function buildExportXml(reportId, companyName, extraVars = '') {
  return `<ENVELOPE>
  <HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Data</TYPE><ID>${reportId}</ID></HEADER>
  <BODY><DESC><STATICVARIABLES>
    <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
    <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
    ${extraVars}
  </STATICVARIABLES></DESC></BODY>
</ENVELOPE>`
}

async function fetchFromTally(xmlBody, timeoutMs = 30000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(TALLY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xmlBody,
      signal: controller.signal,
    })
    clearTimeout(timeout)
    return await res.text()
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') throw new Error(`Tally request timed out (${timeoutMs / 1000}s)`)
    throw new Error(`Cannot connect to Tally at ${TALLY_URL}: ${err.message}`)
  }
}

// ─── Financial Year Helper ───────────────────────────────────────────────────

function getCurrentFYDates() {
  const now = new Date()
  const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return {
    from: `${fyStartYear}-04-01`,
    to: now.toISOString().split('T')[0],
  }
}

// ─── Connection Test ─────────────────────────────────────────────────────────

async function testConnection() {
  logInfo(`Connecting to Tally at ${C.bold}${TALLY_URL}${C.reset}...`)

  const xmlBody = buildExportXml('List of Companies', COMPANY_NAME || '')
  const response = await fetchFromTally(xmlBody, 15000)

  // Extract companies
  const companies = []
  const companyMatches = response.match(/<NAME[^>]*>([^<]+)<\/NAME>/gi) || []
  for (const match of companyMatches) {
    const name = match.replace(/<\/?NAME[^>]*>/gi, '').trim()
    if (name && !companies.includes(name)) companies.push(name)
  }

  // Extract version
  const versionMatch = response.match(/<VERSION[^>]*>([^<]+)<\/VERSION>/i)
  const version = versionMatch ? versionMatch[1] : 'Unknown'

  logOk(`Connected! Tally Version: ${C.bold}${version}${C.reset}`)
  logInfo(`Companies found: ${companies.length > 0 ? companies.join(', ') : '(none)'}`)

  if (COMPANY_NAME && !companies.includes(COMPANY_NAME)) {
    logWarn(`Company "${COMPANY_NAME}" not found in Tally. Available: ${companies.join(', ')}`)
  } else if (COMPANY_NAME) {
    logOk(`Company "${C.bold}${COMPANY_NAME}${C.reset}" verified`)
  }

  return { connected: true, companies, version }
}

// ─── Sync: Groups ────────────────────────────────────────────────────────────

async function syncGroups(supabase) {
  logInfo('Syncing Groups...')
  const xml = buildExportXml('List of Groups', COMPANY_NAME)
  const response = await fetchFromTally(xml)
  const elements = getAll(response, 'GROUP')
  logInfo(`${elements.length} groups found in Tally`)

  let synced = 0, failed = 0
  const errors = []
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
    } catch (e) { failed++; errors.push(`Group "${getVal(el, 'NAME')}": ${e.message}`) }
  }

  if (synced > 0) logOk(`Groups: ${synced} synced`)
  if (failed > 0) logErr(`Groups: ${failed} failed`)
  return { synced, failed, errors }
}

// ─── Sync: Ledgers ───────────────────────────────────────────────────────────

async function syncLedgers(supabase) {
  logInfo('Syncing Ledgers...')
  const xml = buildExportXml('List of Ledgers', COMPANY_NAME)
  const response = await fetchFromTally(xml)
  const elements = getAll(response, 'LEDGER')
  logInfo(`${elements.length} ledgers found in Tally`)

  let synced = 0, failed = 0
  const errors = []
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
    } catch (e) { failed++; errors.push(`Ledger "${getVal(el, 'NAME')}": ${e.message}`) }
  }

  if (synced > 0) logOk(`Ledgers: ${synced} synced`)
  if (failed > 0) logErr(`Ledgers: ${failed} failed`)
  return { synced, failed, errors }
}

// ─── Sync: Stock Items ──────────────────────────────────────────────────────

async function syncStockItems(supabase) {
  logInfo('Syncing Stock Items...')
  const xml = buildExportXml('List of Stock Items', COMPANY_NAME)
  const response = await fetchFromTally(xml)
  const elements = getAll(response, 'STOCKITEM')
  logInfo(`${elements.length} stock items found in Tally`)

  let synced = 0, failed = 0
  const errors = []
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
    } catch (e) { failed++; errors.push(`Stock "${getVal(el, 'NAME')}": ${e.message}`) }
  }

  if (synced > 0) logOk(`Stock Items: ${synced} synced`)
  if (failed > 0) logErr(`Stock Items: ${failed} failed`)
  return { synced, failed, errors }
}

// ─── Sync: Vouchers (Day Book) ──────────────────────────────────────────────

async function syncVouchers(supabase, fromDate, toDate) {
  logInfo(`Syncing Vouchers (${fromDate} to ${toDate})...`)
  const xml = buildExportXml('Day Book', COMPANY_NAME,
    `<SVFROMDATE>${toTallyDate(fromDate)}</SVFROMDATE><SVTODATE>${toTallyDate(toDate)}</SVTODATE>`)
  const response = await fetchFromTally(xml, 120000) // 2 min timeout for large data
  const elements = getAll(response, 'VOUCHER')
  logInfo(`${elements.length} vouchers found in Tally`)

  let synced = 0, failed = 0
  const errors = []

  // Process in batches of 50 for better performance
  const BATCH_SIZE = 50
  for (let i = 0; i < elements.length; i += BATCH_SIZE) {
    const batch = elements.slice(i, i + BATCH_SIZE)
    const rows = []

    for (const el of batch) {
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

        rows.push({
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
        })
      } catch (e) { failed++; errors.push(`Voucher parse error: ${e.message}`) }
    }

    // Bulk upsert the batch
    if (rows.length > 0) {
      try {
        const { error } = await supabase.from('tally_vouchers').upsert(rows, {
          onConflict: 'tally_guid', ignoreDuplicates: false,
        })
        if (error) {
          // Fallback: try one by one
          for (const row of rows) {
            try {
              await supabase.from('tally_vouchers').upsert(row, {
                onConflict: row.tally_guid ? 'tally_guid' : 'voucher_number',
                ignoreDuplicates: false,
              })
              synced++
            } catch (e2) { failed++; errors.push(`Voucher "${row.voucher_number}": ${e2.message}`) }
          }
        } else {
          synced += rows.length
        }
      } catch (e) {
        // Fallback: try one by one
        for (const row of rows) {
          try {
            await supabase.from('tally_vouchers').upsert(row, {
              onConflict: row.tally_guid ? 'tally_guid' : 'voucher_number',
              ignoreDuplicates: false,
            })
            synced++
          } catch (e2) { failed++; errors.push(`Voucher "${row.voucher_number}": ${e2.message}`) }
        }
      }
    }

    // Progress indicator for large datasets
    if (elements.length > BATCH_SIZE && (i + BATCH_SIZE) % 200 === 0) {
      logInfo(`  Progress: ${Math.min(i + BATCH_SIZE, elements.length)}/${elements.length} vouchers processed`)
    }
  }

  if (synced > 0) logOk(`Vouchers: ${synced} synced`)
  if (failed > 0) logErr(`Vouchers: ${failed} failed`)
  return { synced, failed, errors }
}

// ─── Sync: Financial Reports ─────────────────────────────────────────────────

async function syncReports(supabase, fromDate, toDate) {
  logInfo('Syncing Financial Reports...')
  const fromFmt = toTallyDate(fromDate)
  const toFmt = toTallyDate(toDate)

  const reports = [
    { id: 'Trial Balance',           type: 'trial_balance',           extra: `<SVTODATE>${toFmt}</SVTODATE>` },
    { id: 'Balance Sheet',           type: 'balance_sheet',           extra: `<SVTODATE>${toFmt}</SVTODATE>` },
    { id: 'Profit and Loss A/c',     type: 'pnl',                    extra: `<SVFROMDATE>${fromFmt}</SVFROMDATE><SVTODATE>${toFmt}</SVTODATE>` },
    { id: 'Outstanding Receivables', type: 'outstanding_receivables', extra: '' },
    { id: 'Outstanding Payables',    type: 'outstanding_payables',    extra: '' },
  ]

  let synced = 0, failed = 0
  const errors = []

  for (const report of reports) {
    try {
      const xml = buildExportXml(report.id, COMPANY_NAME, report.extra)
      const response = await fetchFromTally(xml, 60000)
      await supabase.from('tally_reports').insert({
        report_type: report.type,
        report_date: toDate,
        period_from: fromDate,
        period_to:   toDate,
        data:        { raw: response, source: 'http_direct' },
        fetched_at:  new Date().toISOString(),
      })
      synced++
      logOk(`  ${report.id}`)
    } catch (e) {
      failed++
      errors.push(`${report.type}: ${e.message}`)
      logErr(`  ${report.id}: ${e.message}`)
    }
  }

  return { synced, failed, errors }
}

// ─── Sync: GST Data ─────────────────────────────────────────────────────────

async function syncGST(supabase, fromDate, toDate) {
  logInfo('Syncing GST Data...')
  const fromFmt = toTallyDate(fromDate)
  const toFmt = toTallyDate(toDate)

  const gstReports = [
    { id: 'GSTR-1',  type: 'gstr1' },
    { id: 'GSTR-3B', type: 'gstr3b' },
  ]

  let synced = 0, failed = 0
  const errors = []

  for (const report of gstReports) {
    try {
      const xml = buildExportXml(report.id, COMPANY_NAME,
        `<SVFROMDATE>${fromFmt}</SVFROMDATE><SVTODATE>${toFmt}</SVTODATE>`)
      const response = await fetchFromTally(xml, 60000)
      await supabase.from('tally_gst_data').insert({
        report_type: report.type,
        period_from: fromDate,
        period_to:   toDate,
        data:        { raw: response },
        fetched_at:  new Date().toISOString(),
      })
      synced++
      logOk(`  ${report.id}`)
    } catch (e) {
      failed++
      errors.push(`${report.type}: ${e.message}`)
      logErr(`  ${report.id}: ${e.message}`)
    }
  }

  return { synced, failed, errors }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const flags = parseArgs()

  if (flags.help) {
    showHelp()
    process.exit(0)
  }

  const startTime = Date.now()

  // Banner
  console.log('')
  console.log(`${C.bold}${C.cyan}${'='.repeat(60)}${C.reset}`)
  console.log(`${C.bold}  Tally Direct HTTP Sync${C.reset}  —  ${new Date().toLocaleString()}`)
  console.log(`${C.cyan}${'='.repeat(60)}${C.reset}`)
  console.log(`  Tally Server:  ${C.bold}${TALLY_URL}${C.reset}`)
  console.log(`  Company:       ${C.bold}${COMPANY_NAME || '(auto-detect)'}${C.reset}`)
  console.log(`  Supabase:      ${C.bold}${SUPABASE_URL}${C.reset}`)
  console.log('')

  // Validate required config
  if (!SUPABASE_KEY) {
    logErr('SUPABASE_SERVICE_ROLE_KEY is not set.')
    console.error('  Get it from: Supabase Dashboard → Project Settings → API → service_role key')
    console.error('  Add to .env: SUPABASE_SERVICE_ROLE_KEY=your_key_here')
    process.exit(1)
  }

  if (!COMPANY_NAME) {
    logErr('TALLY_COMPANY_NAME is not set.')
    console.error('  Add to .env: TALLY_COMPANY_NAME=Your Company Name')
    console.error('  Tip: Run with --test first to see available companies')
    process.exit(1)
  }

  // Test connection
  try {
    await testConnection()
  } catch (err) {
    logErr(`Cannot connect to Tally: ${err.message}`)
    console.error('')
    console.error('  Troubleshooting:')
    console.error('  1. Is TallyPrime running?')
    console.error('  2. Is HTTP server enabled? (Gateway of Tally → F12 → Advanced → Enable TallyPrime Server = Yes)')
    console.error(`  3. Is port ${TALLY_PORT} correct? (Check Tally → F12 → Advanced → Port)`)
    console.error(`  4. Try opening ${TALLY_URL} in your browser`)
    process.exit(1)
  }

  if (flags.test) {
    console.log('')
    logOk('Connection test passed! Tally is reachable.')
    process.exit(0)
  }

  console.log('')

  // Initialize Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // Calculate date range
  const fyDates = getCurrentFYDates()
  const fromDate = flags.from || process.env.TALLY_SYNC_FROM_DATE || fyDates.from
  const toDate   = flags.to || process.env.TALLY_SYNC_TO_DATE || fyDates.to
  logInfo(`Date range: ${C.bold}${fromDate}${C.reset} to ${C.bold}${toDate}${C.reset}`)
  console.log('')

  // Create sync log entry
  const syncType = flags.runAll ? 'direct_http_full' : 'direct_http_selective'
  const { data: logData } = await supabase.from('tally_sync_log').insert({
    sync_type: syncType, direction: 'inward', status: 'started',
  }).select().single()
  const logId = logData?.id

  // Run sync functions
  const results = { groups: null, ledgers: null, stock: null, vouchers: null, reports: null, gst: null }
  const allErrors = []

  try {
    if (flags.runAll || flags.groupsOnly) {
      results.groups = await syncGroups(supabase)
      allErrors.push(...(results.groups?.errors || []))
      console.log('')
    }

    if (flags.runAll || flags.ledgersOnly) {
      results.ledgers = await syncLedgers(supabase)
      allErrors.push(...(results.ledgers?.errors || []))
      console.log('')
    }

    if (flags.runAll || flags.stockOnly) {
      results.stock = await syncStockItems(supabase)
      allErrors.push(...(results.stock?.errors || []))
      console.log('')
    }

    if (flags.runAll || flags.vouchersOnly) {
      results.vouchers = await syncVouchers(supabase, fromDate, toDate)
      allErrors.push(...(results.vouchers?.errors || []))
      console.log('')
    }

    if (flags.runAll || flags.reportsOnly) {
      results.reports = await syncReports(supabase, fromDate, toDate)
      allErrors.push(...(results.reports?.errors || []))
      console.log('')
    }

    if (flags.runAll || flags.gstOnly) {
      results.gst = await syncGST(supabase, fromDate, toDate)
      allErrors.push(...(results.gst?.errors || []))
      console.log('')
    }
  } catch (err) {
    logErr(`Fatal sync error: ${err.message}`)
    allErrors.push(err.message)
  }

  // Calculate totals
  const totalSynced = Object.values(results).reduce((sum, r) => sum + (r?.synced || 0), 0)
  const totalFailed = Object.values(results).reduce((sum, r) => sum + (r?.failed || 0), 0)
  const durationMs = Date.now() - startTime
  const durationSec = (durationMs / 1000).toFixed(1)

  // Update sync log
  if (logId) {
    const status = totalFailed > 0 && totalSynced > 0 ? 'partial'
                 : totalFailed > 0 ? 'failed'
                 : 'completed'
    await supabase.from('tally_sync_log').update({
      status,
      records_synced: totalSynced,
      records_failed: totalFailed,
      error_details: allErrors.length > 0 ? { errors: allErrors } : null,
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
    }).eq('id', logId).catch(() => {})
  }

  // Update last sync timestamp
  await supabase.from('tally_config')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('is_active', true)
    .catch(() => {})

  // Print summary
  console.log(`${C.bold}${C.cyan}${'='.repeat(60)}${C.reset}`)
  console.log(`${C.bold}  SYNC COMPLETE${C.reset}`)
  console.log(`${C.cyan}${'='.repeat(60)}${C.reset}`)
  console.log(`  Duration:      ${C.bold}${durationSec}s${C.reset}`)
  console.log('')
  if (results.groups)   console.log(`  Groups:        ${C.green}${results.groups.synced} synced${C.reset}${results.groups.failed > 0 ? `, ${C.red}${results.groups.failed} failed${C.reset}` : ''}`)
  if (results.ledgers)  console.log(`  Ledgers:       ${C.green}${results.ledgers.synced} synced${C.reset}${results.ledgers.failed > 0 ? `, ${C.red}${results.ledgers.failed} failed${C.reset}` : ''}`)
  if (results.stock)    console.log(`  Stock Items:   ${C.green}${results.stock.synced} synced${C.reset}${results.stock.failed > 0 ? `, ${C.red}${results.stock.failed} failed${C.reset}` : ''}`)
  if (results.vouchers) console.log(`  Vouchers:      ${C.green}${results.vouchers.synced} synced${C.reset}${results.vouchers.failed > 0 ? `, ${C.red}${results.vouchers.failed} failed${C.reset}` : ''}`)
  if (results.reports)  console.log(`  Reports:       ${C.green}${results.reports.synced} synced${C.reset}${results.reports.failed > 0 ? `, ${C.red}${results.reports.failed} failed${C.reset}` : ''}`)
  if (results.gst)      console.log(`  GST Data:      ${C.green}${results.gst.synced} synced${C.reset}${results.gst.failed > 0 ? `, ${C.red}${results.gst.failed} failed${C.reset}` : ''}`)
  console.log('')
  console.log(`  ${C.bold}TOTAL:${C.reset}         ${C.green}${totalSynced} synced${C.reset}${totalFailed > 0 ? `, ${C.red}${totalFailed} failed${C.reset}` : ''}`)

  if (allErrors.length > 0) {
    console.log('')
    console.log(`  ${C.red}Errors (${allErrors.length}):${C.reset}`)
    allErrors.slice(0, 10).forEach((err, i) => {
      console.log(`    ${i + 1}. ${err}`)
    })
    if (allErrors.length > 10) {
      console.log(`    ... and ${allErrors.length - 10} more`)
    }
  }

  console.log(`${C.cyan}${'='.repeat(60)}${C.reset}`)
  console.log('')

  process.exit(totalFailed > 0 ? 1 : 0)
}

main().catch(err => {
  logErr(`FATAL: ${err.message}`)
  process.exit(1)
})
