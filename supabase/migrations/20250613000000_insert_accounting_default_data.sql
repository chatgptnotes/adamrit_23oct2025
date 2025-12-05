-- Insert Default Accounting Data
-- Created: 2025-06-13

-- Insert Default Chart of Accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_group, opening_balance, opening_balance_type) VALUES
-- Assets
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

-- Liabilities
('2000', 'LIABILITIES', 'LIABILITIES', 'PRIMARY GROUP', 0.00, 'CR'),
('2100', 'CURRENT LIABILITIES', 'CURRENT_LIABILITIES', 'LIABILITIES', 0.00, 'CR'),
('2110', 'Patient Advance', 'CURRENT_LIABILITIES', 'ADVANCE', 0.00, 'CR'),
('2120', 'Other Creditors', 'CURRENT_LIABILITIES', 'CREDITORS', 0.00, 'CR'),
('2130', 'Bank Overdraft', 'CURRENT_LIABILITIES', 'BANK', 0.00, 'CR'),
('2200', 'LONG TERM LIABILITIES', 'LONG_TERM_LIABILITIES', 'LIABILITIES', 0.00, 'CR'),
('2210', 'Loan from Bank', 'LONG_TERM_LIABILITIES', 'LOAN', 0.00, 'CR'),

-- Equity
('3000', 'CAPITAL ACCOUNT', 'EQUITY', 'PRIMARY GROUP', 0.00, 'CR'),
('3100', 'Owner''s Capital', 'EQUITY', 'CAPITAL', 0.00, 'CR'),
('3200', 'Retained Earnings', 'EQUITY', 'RETAINED', 0.00, 'CR'),

-- Income
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

-- Expenses
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
('5290', 'Other Expenses', 'INDIRECT_EXPENSES', 'OTHER', 0.00, 'DR');

-- Insert Default Voucher Types
INSERT INTO voucher_types (voucher_type_code, voucher_type_name, voucher_category, prefix, current_number, is_active) VALUES
('RV', 'Receipt Voucher', 'RECEIPT', 'RV', 1, true),
('PV', 'Payment Voucher', 'PAYMENT', 'PV', 1, true),
('JV', 'Journal Voucher', 'JOURNAL', 'JV', 1, true),
('SV', 'Sales Voucher', 'SALES', 'SV', 1, true),
('CN', 'Credit Note', 'CREDIT_NOTE', 'CN', 1, true),
('DN', 'Debit Note', 'DEBIT_NOTE', 'DN', 1, true),
('CV', 'Contra Voucher', 'CONTRA', 'CV', 1, true),
('PF', 'Professional Fee', 'SALES', 'PF', 1, true),
('PC', 'Procedure Charge', 'SALES', 'PC', 1, true),
('MC', 'Medicine Sale', 'SALES', 'MC', 1, true);

-- Update chart_of_accounts with parent relationships
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1000') WHERE account_code = '1100';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1000') WHERE account_code = '1600';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1100') WHERE account_code IN ('1110', '1120', '1400', '1500');
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1600') WHERE account_code IN ('1610', '1620', '1630');

UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '2000') WHERE account_code = '2100';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '2000') WHERE account_code = '2200';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '2100') WHERE account_code IN ('2110', '2120', '2130');
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '2200') WHERE account_code = '2210';

UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '3000') WHERE account_code IN ('3100', '3200');

UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '4000') WHERE account_code = '4100';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '4000') WHERE account_code = '4200';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '4100') WHERE account_code IN ('4110', '4120', '4130', '4140', '4150');
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '4200') WHERE account_code IN ('4210', '4220');

UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '5000') WHERE account_code = '5100';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '5000') WHERE account_code = '5200';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '5100') WHERE account_code IN ('5110', '5120');
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '5200') WHERE account_code IN ('5210', '5220', '5230', '5240', '5250', '5260', '5270', '5280', '5290');