-- Step 5: Verify and Fix Data
-- Run this to check and fix any missing data

-- First, let's check what data exists
SELECT 'Checking existing data...' as status;

SELECT 
    'chart_of_accounts' as table_name, 
    COUNT(*) as record_count 
FROM chart_of_accounts
UNION ALL
SELECT 
    'voucher_types' as table_name, 
    COUNT(*) as record_count 
FROM voucher_types;

-- If chart_of_accounts is empty, insert the data
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_group, opening_balance, opening_balance_type) 
SELECT * FROM (VALUES
    ('1000', 'ASSETS', 'ASSETS', 'PRIMARY GROUP', 0.00, 'DR'),
    ('1100', 'CURRENT ASSETS', 'CURRENT_ASSETS', 'ASSETS', 0.00, 'DR'),
    ('1110', 'Cash in Hand', 'CURRENT_ASSETS', 'CASH', 0.00, 'DR'),
    ('1120', 'Cash at Bank', 'CURRENT_ASSETS', 'BANK', 0.00, 'DR'),
    ('1400', 'Patient Debtors', 'CURRENT_ASSETS', 'DEBTORS', 0.00, 'DR'),
    ('1500', 'Other Debtors', 'CURRENT_ASSETS', 'DEBTORS', 0.00, 'DR'),
    ('1600', 'FIXED ASSETS', 'FIXED_ASSETS', 'ASSETS', 0.00, 'DR'),
    ('1610', 'Medical Equipment', 'FIXED_ASSETS', 'EQUIPMENT', 0.00, 'DR'),
    ('1620', 'Furniture & Fixtures', 'FIXED_ASSETS', 'FURNITURE', 0.00, 'DR'),
    ('1630', 'Computer & Software', 'FIXED_ASSETS', 'COMPUTER', 0.00, 'DR'),
    ('2000', 'LIABILITIES', 'LIABILITIES', 'PRIMARY GROUP', 0.00, 'CR'),
    ('2100', 'CURRENT LIABILITIES', 'CURRENT_LIABILITIES', 'LIABILITIES', 0.00, 'CR'),
    ('2110', 'Patient Advance', 'CURRENT_LIABILITIES', 'ADVANCE', 0.00, 'CR'),
    ('2120', 'Other Creditors', 'CURRENT_LIABILITIES', 'CREDITORS', 0.00, 'CR'),
    ('2130', 'Bank Overdraft', 'CURRENT_LIABILITIES', 'BANK', 0.00, 'CR'),
    ('2200', 'LONG TERM LIABILITIES', 'LONG_TERM_LIABILITIES', 'LIABILITIES', 0.00, 'CR'),
    ('2210', 'Loan from Bank', 'LONG_TERM_LIABILITIES', 'LOAN', 0.00, 'CR'),
    ('3000', 'CAPITAL ACCOUNT', 'EQUITY', 'PRIMARY GROUP', 0.00, 'CR'),
    ('3100', 'Owner''s Capital', 'EQUITY', 'CAPITAL', 0.00, 'CR'),
    ('3200', 'Retained Earnings', 'EQUITY', 'RETAINED', 0.00, 'CR'),
    ('4000', 'INCOME', 'INCOME', 'PRIMARY GROUP', 0.00, 'CR'),
    ('4100', 'DIRECT INCOME', 'DIRECT_INCOME', 'INCOME', 0.00, 'CR'),
    ('4110', 'Consultation Fees', 'DIRECT_INCOME', 'CONSULTATION', 0.00, 'CR'),
    ('4120', 'Procedure Charges', 'DIRECT_INCOME', 'PROCEDURE', 0.00, 'CR'),
    ('4130', 'Surgery Charges', 'DIRECT_INCOME', 'SURGERY', 0.00, 'CR'),
    ('4140', 'Investigation Charges', 'DIRECT_INCOME', 'INVESTIGATION', 0.00, 'CR'),
    ('4150', 'Medicine Sales', 'DIRECT_INCOME', 'MEDICINE', 0.00, 'CR'),
    ('4200', 'INDIRECT INCOME', 'INDIRECT_INCOME', 'INCOME', 0.00, 'CR'),
    ('4210', 'Interest Received', 'INDIRECT_INCOME', 'INTEREST', 0.00, 'CR'),
    ('4220', 'Other Income', 'INDIRECT_INCOME', 'OTHER', 0.00, 'CR'),
    ('5000', 'EXPENSES', 'EXPENSES', 'PRIMARY GROUP', 0.00, 'DR'),
    ('5100', 'DIRECT EXPENSES', 'DIRECT_EXPENSES', 'EXPENSES', 0.00, 'DR'),
    ('5110', 'Medicine Purchase', 'DIRECT_EXPENSES', 'MEDICINE', 0.00, 'DR'),
    ('5120', 'Medical Supplies', 'DIRECT_EXPENSES', 'SUPPLIES', 0.00, 'DR'),
    ('5200', 'INDIRECT EXPENSES', 'INDIRECT_EXPENSES', 'EXPENSES', 0.00, 'DR'),
    ('5210', 'Staff Salary', 'INDIRECT_EXPENSES', 'SALARY', 0.00, 'DR'),
    ('5220', 'Rent', 'INDIRECT_EXPENSES', 'RENT', 0.00, 'DR'),
    ('5230', 'Electricity', 'INDIRECT_EXPENSES', 'UTILITIES', 0.00, 'DR'),
    ('5240', 'Telephone', 'INDIRECT_EXPENSES', 'UTILITIES', 0.00, 'DR'),
    ('5250', 'Internet', 'INDIRECT_EXPENSES', 'UTILITIES', 0.00, 'DR'),
    ('5260', 'Maintenance', 'INDIRECT_EXPENSES', 'MAINTENANCE', 0.00, 'DR'),
    ('5270', 'Insurance', 'INDIRECT_EXPENSES', 'INSURANCE', 0.00, 'DR'),
    ('5280', 'Professional Fees', 'INDIRECT_EXPENSES', 'PROFESSIONAL', 0.00, 'DR'),
    ('5290', 'Other Expenses', 'INDIRECT_EXPENSES', 'OTHER', 0.00, 'DR')
) AS v(account_code, account_name, account_type, account_group, opening_balance, opening_balance_type)
WHERE NOT EXISTS (
    SELECT 1 FROM chart_of_accounts WHERE chart_of_accounts.account_code = v.account_code
);

-- Final verification
SELECT 'Final count after fix:' as status;
SELECT 
    'chart_of_accounts' as table_name, 
    COUNT(*) as record_count 
FROM chart_of_accounts
UNION ALL
SELECT 
    'voucher_types' as table_name, 
    COUNT(*) as record_count 
FROM voucher_types;

SELECT 'Setup verification complete!' as final_status;