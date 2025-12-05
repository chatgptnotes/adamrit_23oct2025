-- Complete Accounting System Setup Script
-- Run this entire script in Supabase SQL Editor
-- Created: 2025-06-13

-- ============================================
-- PART 1: CREATE TABLES AND STRUCTURE
-- ============================================

-- 1. Chart of Accounts (Master)
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN (
        'ASSETS', 'LIABILITIES', 'EQUITY', 'INCOME', 'EXPENSES',
        'CURRENT_ASSETS', 'FIXED_ASSETS', 'CURRENT_LIABILITIES',
        'LONG_TERM_LIABILITIES', 'DIRECT_INCOME', 'INDIRECT_INCOME',
        'DIRECT_EXPENSES', 'INDIRECT_EXPENSES'
    )),
    parent_account_id UUID REFERENCES chart_of_accounts(id),
    account_group VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    opening_balance DECIMAL(15,2) DEFAULT 0.00,
    opening_balance_type VARCHAR(10) CHECK (opening_balance_type IN ('DR', 'CR')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Patient Ledgers (Debtor Management)
CREATE TABLE IF NOT EXISTS patient_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    account_id UUID REFERENCES chart_of_accounts(id),
    ledger_name VARCHAR(255) NOT NULL,
    opening_balance DECIMAL(15,2) DEFAULT 0.00,
    opening_balance_type VARCHAR(10) CHECK (opening_balance_type IN ('DR', 'CR')) DEFAULT 'DR',
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    current_balance_type VARCHAR(10) CHECK (current_balance_type IN ('DR', 'CR')) DEFAULT 'DR',
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    credit_days INTEGER DEFAULT 30,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id)
);

-- 3. Voucher Types (like Tally)
CREATE TABLE IF NOT EXISTS voucher_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_type_code VARCHAR(20) UNIQUE NOT NULL,
    voucher_type_name VARCHAR(100) NOT NULL,
    voucher_category VARCHAR(50) NOT NULL CHECK (voucher_category IN (
        'PAYMENT', 'RECEIPT', 'JOURNAL', 'SALES', 'PURCHASE', 
        'CREDIT_NOTE', 'DEBIT_NOTE', 'CONTRA'
    )),
    prefix VARCHAR(10) NOT NULL,
    current_number INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Vouchers (Main Transaction Table)
CREATE TABLE IF NOT EXISTS vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_number VARCHAR(50) UNIQUE NOT NULL,
    voucher_type_id UUID REFERENCES voucher_types(id),
    voucher_date DATE NOT NULL,
    reference_number VARCHAR(100),
    reference_date DATE,
    narration TEXT,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    patient_id UUID REFERENCES patients(id),
    bill_id UUID,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'AUTHORISED', 'CANCELLED')),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Voucher Entries (Double Entry Details)
CREATE TABLE IF NOT EXISTS voucher_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE,
    account_id UUID REFERENCES chart_of_accounts(id),
    patient_ledger_id UUID REFERENCES patient_ledgers(id),
    debit_amount DECIMAL(15,2) DEFAULT 0.00,
    credit_amount DECIMAL(15,2) DEFAULT 0.00,
    narration TEXT,
    entry_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (debit_amount >= 0 AND credit_amount >= 0),
    CHECK (NOT (debit_amount > 0 AND credit_amount > 0))
);

-- 6. Outstanding Invoices (Receivables Tracking)
CREATE TABLE IF NOT EXISTS outstanding_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    original_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    outstanding_amount DECIMAL(15,2) NOT NULL,
    days_outstanding INTEGER,
    aging_bucket VARCHAR(20) CHECK (aging_bucket IN ('0-30', '31-60', '61-90', '91-180', '181-365', '365+')),
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PARTIAL', 'CLOSED', 'OVERDUE')),
    bill_id UUID,
    voucher_id UUID REFERENCES vouchers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    payment_date DATE NOT NULL,
    payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN (
        'CASH', 'CHEQUE', 'DD', 'NEFT', 'RTGS', 'UPI', 'CARD', 'ONLINE'
    )),
    payment_amount DECIMAL(15,2) NOT NULL,
    reference_number VARCHAR(100),
    bank_name VARCHAR(255),
    cheque_number VARCHAR(50),
    cheque_date DATE,
    remarks TEXT,
    status VARCHAR(20) DEFAULT 'CLEARED' CHECK (status IN ('PENDING', 'CLEARED', 'BOUNCED', 'CANCELLED')),
    voucher_id UUID REFERENCES vouchers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Payment Allocations (Payment vs Outstanding)
CREATE TABLE IF NOT EXISTS payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE CASCADE,
    outstanding_invoice_id UUID REFERENCES outstanding_invoices(id),
    allocated_amount DECIMAL(15,2) NOT NULL,
    allocation_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Aging Snapshots (Historical Data)
CREATE TABLE IF NOT EXISTS aging_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    patient_id UUID REFERENCES patients(id),
    total_outstanding DECIMAL(15,2) NOT NULL,
    bucket_0_30 DECIMAL(15,2) DEFAULT 0.00,
    bucket_31_60 DECIMAL(15,2) DEFAULT 0.00,
    bucket_61_90 DECIMAL(15,2) DEFAULT 0.00,
    bucket_91_180 DECIMAL(15,2) DEFAULT 0.00,
    bucket_181_365 DECIMAL(15,2) DEFAULT 0.00,
    bucket_365_plus DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Daily Balances (Trial Balance Support)
CREATE TABLE IF NOT EXISTS daily_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balance_date DATE NOT NULL,
    account_id UUID REFERENCES chart_of_accounts(id),
    opening_balance DECIMAL(15,2) DEFAULT 0.00,
    debit_total DECIMAL(15,2) DEFAULT 0.00,
    credit_total DECIMAL(15,2) DEFAULT 0.00,
    closing_balance DECIMAL(15,2) DEFAULT 0.00,
    balance_type VARCHAR(10) CHECK (balance_type IN ('DR', 'CR')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(balance_date, account_id)
);

-- ============================================
-- PART 2: CREATE TRIGGERS AND FUNCTIONS
-- ============================================

-- Function to Update Patient Ledger Balance
CREATE OR REPLACE FUNCTION update_patient_ledger_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current balance when voucher entries are inserted/updated
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.patient_ledger_id IS NOT NULL THEN
            UPDATE patient_ledgers 
            SET 
                current_balance = (
                    SELECT COALESCE(
                        opening_balance + 
                        COALESCE(SUM(debit_amount - credit_amount), 0), 
                        opening_balance
                    )
                    FROM voucher_entries 
                    WHERE patient_ledger_id = NEW.patient_ledger_id
                ),
                current_balance_type = CASE 
                    WHEN (
                        SELECT opening_balance + COALESCE(SUM(debit_amount - credit_amount), 0)
                        FROM voucher_entries 
                        WHERE patient_ledger_id = NEW.patient_ledger_id
                    ) >= 0 THEN 'DR'
                    ELSE 'CR'
                END,
                updated_at = NOW()
            WHERE id = NEW.patient_ledger_id;
        END IF;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        IF OLD.patient_ledger_id IS NOT NULL THEN
            UPDATE patient_ledgers 
            SET 
                current_balance = (
                    SELECT COALESCE(
                        opening_balance + 
                        COALESCE(SUM(debit_amount - credit_amount), 0), 
                        opening_balance
                    )
                    FROM voucher_entries 
                    WHERE patient_ledger_id = OLD.patient_ledger_id
                ),
                current_balance_type = CASE 
                    WHEN (
                        SELECT opening_balance + COALESCE(SUM(debit_amount - credit_amount), 0)
                        FROM voucher_entries 
                        WHERE patient_ledger_id = OLD.patient_ledger_id
                    ) >= 0 THEN 'DR'
                    ELSE 'CR'
                END,
                updated_at = NOW()
            WHERE id = OLD.patient_ledger_id;
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger for Auto Balance Update
DROP TRIGGER IF EXISTS trigger_update_patient_ledger_balance ON voucher_entries;
CREATE TRIGGER trigger_update_patient_ledger_balance
    AFTER INSERT OR UPDATE OR DELETE ON voucher_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_ledger_balance();

-- ============================================
-- PART 3: ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE outstanding_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE aging_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_balances ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Allow all for authenticated users)
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON chart_of_accounts;
CREATE POLICY "Allow all operations for authenticated users" ON chart_of_accounts FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON patient_ledgers;
CREATE POLICY "Allow all operations for authenticated users" ON patient_ledgers FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON voucher_types;
CREATE POLICY "Allow all operations for authenticated users" ON voucher_types FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON vouchers;
CREATE POLICY "Allow all operations for authenticated users" ON vouchers FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON voucher_entries;
CREATE POLICY "Allow all operations for authenticated users" ON voucher_entries FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON outstanding_invoices;
CREATE POLICY "Allow all operations for authenticated users" ON outstanding_invoices FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON payment_transactions;
CREATE POLICY "Allow all operations for authenticated users" ON payment_transactions FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON payment_allocations;
CREATE POLICY "Allow all operations for authenticated users" ON payment_allocations FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON aging_snapshots;
CREATE POLICY "Allow all operations for authenticated users" ON aging_snapshots FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON daily_balances;
CREATE POLICY "Allow all operations for authenticated users" ON daily_balances FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- PART 4: INSERT DEFAULT DATA
-- ============================================

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
('5290', 'Other Expenses', 'INDIRECT_EXPENSES', 'OTHER', 0.00, 'DR')
ON CONFLICT (account_code) DO NOTHING;

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
('MC', 'Medicine Sale', 'SALES', 'MC', 1, true)
ON CONFLICT (voucher_type_code) DO NOTHING;

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

-- ============================================
-- SETUP COMPLETE!
-- ============================================

-- Verify setup by counting records
SELECT 
    'chart_of_accounts' as table_name, 
    COUNT(*) as record_count 
FROM chart_of_accounts
UNION ALL
SELECT 
    'voucher_types' as table_name, 
    COUNT(*) as record_count 
FROM voucher_types;

-- Success message
SELECT 'Accounting system setup completed successfully!' as status;