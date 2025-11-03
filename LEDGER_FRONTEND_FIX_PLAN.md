# Ledger Statement Frontend Fix Plan

## Problem Identified
The frontend code has a useEffect (lines 29-36) that **automatically resets paymentModeFilter to undefined** for STATE BANK OF INDIA (DRM). This means:
- Even if user selects ONLINE mode, it gets reset to undefined
- The backend never receives the payment mode filter
- Result: No transactions appear

## Root Cause
```typescript
// Lines 29-36 in LedgerStatement.tsx
useEffect(() => {
  if (accountName === 'SARASWAT BANK') {
    setPaymentModeFilter('ONLINE');
  } else {
    setPaymentModeFilter(undefined);  // ← RESETS FILTER FOR STATE BANK!
  }
}, [accountName]);
```

## Solution

### 1. Remove problematic useEffect
Remove lines 29-36 that reset payment mode filter

### 2. Add Payment Mode dropdown in UI
Add dropdown after "Account" dropdown with options:
- ALL (undefined)
- ONLINE
- CASH

### 3. Set default payment mode
When bank account is selected, default to 'ONLINE'

## Files to Modify
- `src/pages/LedgerStatement.tsx` (lines 29-36 and 327-349)
