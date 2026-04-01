-- ============================================================
-- Daily Payment Allocation Dashboard - Database Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Payment Obligations (master list of recurring payees)
CREATE TABLE IF NOT EXISTS payment_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fixed', 'variable')),
  sub_category TEXT, -- rent, dialysis, electricity, salary, consultant, rmo, referral, vendor, other
  default_daily_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 10, -- lower = higher priority
  chart_of_accounts_id UUID REFERENCES chart_of_accounts(id),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  hospital_name TEXT DEFAULT 'hope',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Daily Payment Schedule (daily allocation records)
CREATE TABLE IF NOT EXISTS daily_payment_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_date DATE NOT NULL,
  obligation_id UUID NOT NULL REFERENCES payment_obligations(id),
  party_name TEXT NOT NULL,
  category TEXT NOT NULL,
  daily_amount NUMERIC(12,2) NOT NULL,
  carryforward_amount NUMERIC(12,2) DEFAULT 0,
  total_due NUMERIC(12,2) GENERATED ALWAYS AS (daily_amount + carryforward_amount) STORED,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'carried_forward')),
  days_overdue INTEGER DEFAULT 0,
  voucher_id UUID,
  paid_at TIMESTAMPTZ,
  paid_by TEXT,
  notes TEXT,
  hospital_name TEXT DEFAULT 'hope',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_date, obligation_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_payment_schedule_date ON daily_payment_schedule(schedule_date);
CREATE INDEX IF NOT EXISTS idx_payment_schedule_hospital ON daily_payment_schedule(hospital_name);
CREATE INDEX IF NOT EXISTS idx_payment_obligations_active ON payment_obligations(is_active);

-- 4. Seed data: Fixed daily obligations
INSERT INTO payment_obligations (party_name, category, sub_category, default_daily_amount, priority, hospital_name, notes)
VALUES
  ('Rent', 'fixed', 'rent', 75000, 1, 'hope', 'Daily rent allocation'),
  ('NefroPlus (Dialysis)', 'fixed', 'dialysis', 50000, 2, 'hope', 'Third-party dialysis company'),
  ('Electricity', 'fixed', 'electricity', 20000, 3, 'hope', 'Daily electricity allocation'),
  ('Staff Salary', 'fixed', 'salary', 50000, 4, 'hope', 'Daily salary allocation')
ON CONFLICT DO NOTHING;

-- 5. RPC: Generate daily payment schedule
CREATE OR REPLACE FUNCTION generate_daily_payment_schedule(p_date DATE, p_hospital TEXT DEFAULT 'hope')
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rec RECORD;
  prev_rec RECORD;
  cf_amount NUMERIC(12,2);
  overdue_days INTEGER;
BEGIN
  -- For each active obligation, insert today's schedule row
  FOR rec IN
    SELECT id, party_name, category, default_daily_amount
    FROM payment_obligations
    WHERE is_active = true
      AND hospital_name = p_hospital
  LOOP
    -- Calculate carryforward from previous day
    cf_amount := 0;
    overdue_days := 0;

    SELECT
      GREATEST((dps.daily_amount + dps.carryforward_amount) - dps.paid_amount, 0),
      CASE WHEN dps.status IN ('pending', 'partial', 'carried_forward') THEN dps.days_overdue + 1 ELSE 0 END
    INTO cf_amount, overdue_days
    FROM daily_payment_schedule dps
    WHERE dps.obligation_id = rec.id
      AND dps.schedule_date = p_date - INTERVAL '1 day'
      AND dps.hospital_name = p_hospital;

    -- If no previous record found, defaults stay at 0
    IF NOT FOUND THEN
      cf_amount := 0;
      overdue_days := 0;
    END IF;

    -- Insert today's schedule (skip if already exists)
    INSERT INTO daily_payment_schedule (
      schedule_date, obligation_id, party_name, category,
      daily_amount, carryforward_amount, days_overdue, hospital_name
    )
    VALUES (
      p_date, rec.id, rec.party_name, rec.category,
      rec.default_daily_amount, cf_amount, overdue_days, p_hospital
    )
    ON CONFLICT (schedule_date, obligation_id) DO NOTHING;
  END LOOP;

  -- Mark previous day's unpaid/partial records as carried_forward
  UPDATE daily_payment_schedule
  SET status = 'carried_forward', updated_at = now()
  WHERE schedule_date = p_date - INTERVAL '1 day'
    AND hospital_name = p_hospital
    AND status IN ('pending', 'partial');
END;
$$;

-- 6. RPC: Mark obligation as paid (creates payment voucher)
CREATE OR REPLACE FUNCTION mark_obligation_paid(
  p_schedule_id UUID,
  p_amount NUMERIC(12,2),
  p_user_id TEXT DEFAULT 'admin'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_schedule RECORD;
  v_voucher_id UUID;
  v_voucher_number TEXT;
  v_expense_account_id UUID;
  v_cash_account_id UUID;
  v_new_paid NUMERIC(12,2);
  v_new_status TEXT;
BEGIN
  -- Get the schedule record
  SELECT * INTO v_schedule FROM daily_payment_schedule WHERE id = p_schedule_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule record not found';
  END IF;

  -- Find Cash in Hand account
  SELECT id INTO v_cash_account_id
  FROM chart_of_accounts
  WHERE account_name = 'Cash in Hand'
  LIMIT 1;

  -- Find or use the obligation's linked expense account
  SELECT chart_of_accounts_id INTO v_expense_account_id
  FROM payment_obligations
  WHERE id = v_schedule.obligation_id;

  -- If no linked account, try to find a generic expense account
  IF v_expense_account_id IS NULL THEN
    SELECT id INTO v_expense_account_id
    FROM chart_of_accounts
    WHERE account_name ILIKE '%expense%' OR account_type = 'expense'
    LIMIT 1;
  END IF;

  -- Generate voucher number
  v_voucher_number := 'PAY-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');

  -- Create payment voucher
  INSERT INTO vouchers (
    voucher_number, voucher_date, total_amount, narration,
    status, created_by, reference_number
  )
  VALUES (
    v_voucher_number,
    v_schedule.schedule_date,
    p_amount,
    'Payment to ' || v_schedule.party_name || ' for ' || v_schedule.category || ' (Schedule: ' || v_schedule.schedule_date || ')',
    'posted',
    p_user_id,
    p_schedule_id::TEXT
  )
  RETURNING id INTO v_voucher_id;

  -- Create voucher entries (double-entry)
  -- Debit: Expense account
  IF v_expense_account_id IS NOT NULL THEN
    INSERT INTO voucher_entries (voucher_id, account_id, debit_amount, credit_amount, narration, entry_order)
    VALUES (v_voucher_id, v_expense_account_id, p_amount, 0, 'Payment to ' || v_schedule.party_name, 1);
  END IF;

  -- Credit: Cash in Hand
  IF v_cash_account_id IS NOT NULL THEN
    INSERT INTO voucher_entries (voucher_id, account_id, debit_amount, credit_amount, narration, entry_order)
    VALUES (v_voucher_id, v_cash_account_id, 0, p_amount, 'Payment to ' || v_schedule.party_name, 2);
  END IF;

  -- Update the schedule record
  v_new_paid := v_schedule.paid_amount + p_amount;
  IF v_new_paid >= (v_schedule.daily_amount + v_schedule.carryforward_amount) THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'partial';
  END IF;

  UPDATE daily_payment_schedule
  SET paid_amount = v_new_paid,
      status = v_new_status,
      voucher_id = v_voucher_id,
      paid_at = now(),
      paid_by = p_user_id,
      updated_at = now()
  WHERE id = p_schedule_id;

  RETURN v_voucher_id;
END;
$$;

-- 7. RLS Policies
ALTER TABLE payment_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_payment_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to payment_obligations" ON payment_obligations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to daily_payment_schedule" ON daily_payment_schedule FOR ALL USING (true) WITH CHECK (true);

-- Done! Run generate_daily_payment_schedule(CURRENT_DATE, 'hope') to generate today's schedule.
