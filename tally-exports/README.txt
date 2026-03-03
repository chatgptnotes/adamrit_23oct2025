TALLY EXPORT DIRECTORY
======================

This folder is where Tally Prime exports its XML data files.

IN PRODUCTION:
  - Set TALLY_EXPORT_DIR in your .env to the VPN-mounted path (e.g., Z:\DataExport)
  - This local folder is only used for testing/development

EXPECTED FILES (place Tally-exported XML files here):
  DayBook.xml          — All vouchers (payments, receipts, journals, sales)
  LedgerList.xml       — All ledger/account masters
  GroupList.xml        — Account groups
  StockItems.xml       — Inventory/medicine stock
  TrialBalance.xml     — Trial balance report

HOW TO EXPORT FROM TALLY PRIME:
  1. Open Tally Prime
  2. Go to: Display → Day Book
  3. Press Alt+E → Export → XML → select the export directory
  4. Repeat for: Account Books → Ledger (for LedgerList.xml)
  5. Run: npm run tally:sync

This folder is gitignored — never commit actual financial data.
