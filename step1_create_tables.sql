-- Step 1: Create Accounting Tables
-- Run this first in Supabase SQL Editor

-- 1. Chart of Accounts
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

-- 2. Patient Ledgers
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

-- 3. Voucher Types
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

-- 4. Vouchers
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

-- 5. Voucher Entries
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

SELECT 'Step 1 completed: Core tables created' as status;