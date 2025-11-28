-- ============================================================================
-- CHECK BANK ACCOUNT NAMES
-- Purpose: Find the exact bank account name in chart_of_accounts
-- ============================================================================

-- Show all bank accounts
SELECT
    '=== ALL BANK ACCOUNTS ===' as check_name;

SELECT
    id,
    account_name,
    account_code,
    is_active
FROM chart_of_accounts
WHERE account_name ILIKE '%bank%'
   OR account_code LIKE '1%'  -- Bank accounts usually start with 1
ORDER BY account_name;

-- Specifically search for Saraswat
SELECT
    '=== SARASWAT BANK SEARCH ===' as check_name;

SELECT
    id,
    account_name,
    account_code,
    is_active
FROM chart_of_accounts
WHERE account_name ILIKE '%saraswat%'
ORDER BY account_name;

-- Check what name is in advance_payment
SELECT
    '=== BANK NAMES USED IN ADVANCE PAYMENTS ===' as check_name;

SELECT DISTINCT
    bank_account_name,
    COUNT(*) as usage_count
FROM advance_payment
WHERE bank_account_name IS NOT NULL
GROUP BY bank_account_name
ORDER BY usage_count DESC;
