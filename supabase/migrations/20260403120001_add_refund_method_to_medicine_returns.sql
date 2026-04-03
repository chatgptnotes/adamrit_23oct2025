-- Add refund_method column to medicine_returns table
ALTER TABLE medicine_returns ADD COLUMN IF NOT EXISTS refund_method VARCHAR(20) DEFAULT 'CASH';
