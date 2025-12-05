-- Step 2: Create Remaining Tables
-- Run this second in Supabase SQL Editor

-- 6. Outstanding Invoices
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

-- 8. Payment Allocations
CREATE TABLE IF NOT EXISTS payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE CASCADE,
    outstanding_invoice_id UUID REFERENCES outstanding_invoices(id),
    allocated_amount DECIMAL(15,2) NOT NULL,
    allocation_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Aging Snapshots
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

-- 10. Daily Balances
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

SELECT 'Step 2 completed: All tables created' as status;