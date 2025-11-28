-- Comprehensive Accounting System Tables (Tally-like)
-- Created: 2025-06-12

-- 1. Chart of Accounts (Master)
CREATE TABLE chart_of_accounts (
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
CREATE TABLE patient_ledgers (
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
CREATE TABLE voucher_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_type_code VARCHAR(20) UNIQUE NOT NULL,
    voucher_type_name VARCHAR(100) NOT NULL,
    voucher_category VARCHAR(50) NOT NULL CHECK (voucher_category IN (
        'PAYMENT', 'RECEIPT', 'CONTRA', 'JOURNAL', 'SALES', 'PURCHASE',
        'CREDIT_NOTE', 'DEBIT_NOTE', 'DELIVERY_NOTE', 'RECEIPT_NOTE'
    )),
    numbering_method VARCHAR(20) DEFAULT 'AUTO' CHECK (numbering_method IN ('AUTO', 'MANUAL')),
    prefix VARCHAR(10),
    suffix VARCHAR(10),
    starting_number INTEGER DEFAULT 1,
    current_number INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Voucher Master (Main Transaction Header)
CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_number VARCHAR(50) NOT NULL,
    voucher_type_id UUID REFERENCES voucher_types(id),
    voucher_date DATE NOT NULL,
    reference_number VARCHAR(100),
    reference_date DATE,
    narration TEXT,
    total_amount DECIMAL(15,2) NOT NULL,
    patient_id UUID REFERENCES patients(id),
    bill_id UUID REFERENCES bills(id),
    created_by UUID,
    authorised_by UUID,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'AUTHORISED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Voucher Entries (Double Entry System)
CREATE TABLE voucher_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE,
    account_id UUID REFERENCES chart_of_accounts(id),
    patient_ledger_id UUID REFERENCES patient_ledgers(id),
    debit_amount DECIMAL(15,2) DEFAULT 0.00,
    credit_amount DECIMAL(15,2) DEFAULT 0.00,
    narration TEXT,
    entry_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Outstanding Invoices/Bills Tracking
CREATE TABLE outstanding_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    bill_id UUID REFERENCES bills(id),
    voucher_id UUID REFERENCES vouchers(id),
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    original_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    outstanding_amount DECIMAL(15,2) NOT NULL,
    days_outstanding INTEGER DEFAULT 0,
    aging_bucket VARCHAR(20) DEFAULT '0-30' CHECK (aging_bucket IN (
        '0-30', '31-60', '61-90', '91-180', '181-365', '365+'
    )),
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PARTIAL', 'CLOSED', 'OVERDUE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Payment Transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    voucher_id UUID REFERENCES vouchers(id),
    payment_date DATE NOT NULL,
    payment_mode VARCHAR(50) NOT NULL CHECK (payment_mode IN (
        'CASH', 'CHEQUE', 'DD', 'NEFT', 'RTGS', 'UPI', 'CARD', 'ONLINE'
    )),
    payment_amount DECIMAL(15,2) NOT NULL,
    reference_number VARCHAR(100),
    bank_name VARCHAR(255),
    cheque_number VARCHAR(50),
    cheque_date DATE,
    remarks TEXT,
    status VARCHAR(20) DEFAULT 'CLEARED' CHECK (status IN ('PENDING', 'CLEARED', 'BOUNCED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Payment Allocations (Against Outstanding Bills)
CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE CASCADE,
    outstanding_invoice_id UUID REFERENCES outstanding_invoices(id),
    allocated_amount DECIMAL(15,2) NOT NULL,
    allocation_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Aging Analysis Snapshots
CREATE TABLE aging_snapshots (
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
CREATE TABLE daily_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balance_date DATE NOT NULL,
    account_id UUID REFERENCES chart_of_accounts(id),
    opening_balance DECIMAL(15,2) DEFAULT 0.00,
    total_debits DECIMAL(15,2) DEFAULT 0.00,
    total_credits DECIMAL(15,2) DEFAULT 0.00,
    closing_balance DECIMAL(15,2) DEFAULT 0.00,
    balance_type VARCHAR(10) CHECK (balance_type IN ('DR', 'CR')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(balance_date, account_id)
);

-- Create Indexes for Performance
CREATE INDEX idx_vouchers_date ON vouchers(voucher_date);
CREATE INDEX idx_vouchers_patient ON vouchers(patient_id);
CREATE INDEX idx_voucher_entries_account ON voucher_entries(account_id);
CREATE INDEX idx_voucher_entries_voucher ON voucher_entries(voucher_id);
CREATE INDEX idx_outstanding_patient ON outstanding_invoices(patient_id);
CREATE INDEX idx_outstanding_due_date ON outstanding_invoices(due_date);
CREATE INDEX idx_outstanding_status ON outstanding_invoices(status);
CREATE INDEX idx_payment_transactions_patient ON payment_transactions(patient_id);
CREATE INDEX idx_payment_transactions_date ON payment_transactions(payment_date);
CREATE INDEX idx_aging_snapshots_date ON aging_snapshots(snapshot_date);
CREATE INDEX idx_daily_balances_date ON daily_balances(balance_date);

-- Insert Default Chart of Accounts (Tally-like structure)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_group) VALUES
-- Assets
('1000', 'Current Assets', 'CURRENT_ASSETS', 'ASSETS'),
('1100', 'Cash in Hand', 'CURRENT_ASSETS', 'CASH'),
('1200', 'Bank Accounts', 'CURRENT_ASSETS', 'BANK'),
('1300', 'Accounts Receivable', 'CURRENT_ASSETS', 'DEBTORS'),
('1400', 'Patient Debtors', 'CURRENT_ASSETS', 'PATIENT_DEBTORS'),
('1500', 'Fixed Assets', 'FIXED_ASSETS', 'ASSETS'),

-- Liabilities
('2000', 'Current Liabilities', 'CURRENT_LIABILITIES', 'LIABILITIES'),
('2100', 'Accounts Payable', 'CURRENT_LIABILITIES', 'CREDITORS'),
('2200', 'Accrued Expenses', 'CURRENT_LIABILITIES', 'PROVISIONS'),

-- Income
('4000', 'Direct Income', 'DIRECT_INCOME', 'INCOME'),
('4100', 'Medical Services Revenue', 'DIRECT_INCOME', 'MEDICAL_REVENUE'),
('4200', 'Consultation Fees', 'DIRECT_INCOME', 'CONSULTATION'),
('4300', 'Procedure Charges', 'DIRECT_INCOME', 'PROCEDURES'),

-- Expenses
('5000', 'Direct Expenses', 'DIRECT_EXPENSES', 'EXPENSES'),
('5100', 'Medical Supplies', 'DIRECT_EXPENSES', 'SUPPLIES'),
('6000', 'Indirect Expenses', 'INDIRECT_EXPENSES', 'EXPENSES'),
('6100', 'Administrative Expenses', 'INDIRECT_EXPENSES', 'ADMIN');

-- Insert Default Voucher Types
INSERT INTO voucher_types (voucher_type_code, voucher_type_name, voucher_category, prefix) VALUES
('PAY', 'Payment Voucher', 'PAYMENT', 'PAY'),
('REC', 'Receipt Voucher', 'RECEIPT', 'REC'),
('JOU', 'Journal Voucher', 'JOURNAL', 'JOU'),
('SAL', 'Sales Voucher', 'SALES', 'SAL'),
('CN', 'Credit Note', 'CREDIT_NOTE', 'CN'),
('DN', 'Debit Note', 'DEBIT_NOTE', 'DN');

-- Create Functions for Balance Updates
CREATE OR REPLACE FUNCTION update_patient_ledger_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE patient_ledgers 
        SET current_balance = COALESCE((
            SELECT 
                CASE 
                    WHEN SUM(debit_amount - credit_amount) > 0 THEN SUM(debit_amount - credit_amount)
                    ELSE ABS(SUM(debit_amount - credit_amount))
                END
            FROM voucher_entries 
            WHERE patient_ledger_id = NEW.patient_ledger_id
        ), 0),
        current_balance_type = CASE 
            WHEN COALESCE((SELECT SUM(debit_amount - credit_amount) FROM voucher_entries WHERE patient_ledger_id = NEW.patient_ledger_id), 0) >= 0 
            THEN 'DR' 
            ELSE 'CR' 
        END,
        updated_at = NOW()
        WHERE id = NEW.patient_ledger_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger for Auto Balance Update
CREATE TRIGGER trigger_update_patient_ledger_balance
    AFTER INSERT OR UPDATE OR DELETE ON voucher_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_ledger_balance();

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
CREATE POLICY "Allow all operations for authenticated users" ON chart_of_accounts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON patient_ledgers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON voucher_types FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON vouchers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON voucher_entries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON outstanding_invoices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON payment_transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON payment_allocations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON aging_snapshots FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON daily_balances FOR ALL USING (auth.role() = 'authenticated');