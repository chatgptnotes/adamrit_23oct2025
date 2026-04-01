-- Fix payment_date columns to use TIMESTAMPTZ so actual time is captured
-- Previously DATE type caused all times to show as 5:30 AM IST (midnight UTC)

-- advance_payment: payment_date DATE → TIMESTAMPTZ
ALTER TABLE advance_payment
  ALTER COLUMN payment_date TYPE TIMESTAMPTZ
  USING payment_date::TIMESTAMPTZ;

-- Ensure triggers that cast payment_date::DATE still work
-- (they already do — PostgreSQL casts TIMESTAMPTZ to DATE correctly)

-- Add payment_time column to advance_payment for explicit time tracking
-- (created_at already tracks insert time, but payment_time is the user-facing time)
COMMENT ON COLUMN advance_payment.payment_date IS 'Full timestamp of when payment was made (IST)';
