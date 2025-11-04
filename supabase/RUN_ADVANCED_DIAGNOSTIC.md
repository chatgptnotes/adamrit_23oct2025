## URGENT: Run Advanced Diagnostic

## Problem
Basic diagnostic shows everything is correct, but ledger still shows "No transactions found".

This means the issue is more subtle - either:
1. Vouchers created with wrong bank account
2. Payment_mode case mismatch ('ONLINE' vs 'Online')
3. JOIN conditions not matching properly
4. Amount mismatch preventing JOIN

---

## Steps to Run

### 1. Open Supabase SQL Editor
- Go to: https://supabase.com/dashboard/project/xvkxccqaopbnkvwgyfjv
- Click **SQL Editor**

### 2. Run Advanced Diagnostic
- Click **New Query**
- Open file: `supabase/ADVANCED_DIAGNOSTIC_LEDGER.sql`
- Copy ALL content
- Paste in SQL Editor
- Click **Run**

### 3. Take Screenshots of THESE Tests

**IMPORTANT**: I need to see output of these specific tests:

#### TEST 1: Voucher Entries
Look for column: `bank_account_used`
- **Expected**: Should show "SARASWAT BANK"
- **If shows**: "Cash in Hand" → **PROBLEM FOUND!** Vouchers routed to wrong account

#### TEST 4: Payment to Voucher Matching
Look for column: `status`
- **Expected**: Should show "✓ MATCHED"
- **If shows**: "❌ NO VOUCHER" → Vouchers don't exist
- **If shows**: "⚠️ BANK MISMATCH" → **PROBLEM FOUND!** Bank names don't match

#### TEST 5: Ledger WITHOUT Filter
Should show some rows
- **If shows rows**: Problem is with payment_mode filter
- **If shows 0 rows**: Problem is with bank routing

#### TEST 6: Case Variations (A, B, C)
Check which variation returns results:
- TEST 6A (ONLINE) - uppercase
- TEST 6B (Online) - titlecase
- TEST 6C (online) - lowercase

Whichever returns rows tells us the exact case being used in database.

#### TEST 7: Filter Match
Look for column: `filter_match`
- **Expected**: Should show "✓ MATCHES FILTER"
- **If shows**: "❌ DOES NOT MATCH" → **PROBLEM FOUND!** Shows why filter failing

---

## What to Share

Please share screenshot(s) showing:

1. **TEST 1 result** - What bank_account_used shows
2. **TEST 4 result** - What status column shows
3. **TEST 5 result** - How many rows (if any)
4. **TEST 6 results** - Which variation (A/B/C) shows rows
5. **TEST 7 result** - What filter_match shows

---

## Quick Visual Guide

### Good Output Example:
```
TEST 1: bank_account_used = 'SARASWAT BANK' ✓
TEST 4: status = '✓ MATCHED' ✓
TEST 5: 2 rows returned ✓
TEST 7: filter_match = '✓ MATCHES FILTER' ✓
```

### Bad Output Example (shows problem):
```
TEST 1: bank_account_used = 'Cash in Hand' ❌ <- PROBLEM!
TEST 4: status = '⚠️ BANK MISMATCH' ❌ <- PROBLEM!
TEST 5: 0 rows ❌
TEST 7: filter_match = '❌ DOES NOT MATCH: Online' ❌ <- PROBLEM!
```

---

## Why This Matters

Once I see which test is failing, I can create a TARGETED fix for that specific issue:

- If TEST 1 shows wrong bank → Fix voucher entries
- If TEST 4 shows mismatch → Fix bank_account_name
- If TEST 6 shows case issue → Fix payment_mode case
- If TEST 7 shows JOIN fail → Fix JOIN conditions
- If TEST 8 shows amount issue → Fix amount matching

---

## File Location

```
D:\adamrit\adamrit_23oct2025\supabase\ADVANCED_DIAGNOSTIC_LEDGER.sql
```

Run this and share results!
