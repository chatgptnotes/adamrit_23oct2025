-- Create gatepass_notifications table for storing notification data
-- Used to track pending amounts and reasons before gate pass generation

CREATE TABLE IF NOT EXISTS gatepass_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id VARCHAR NOT NULL,
  patient_id UUID REFERENCES patients(id),
  patient_name VARCHAR,
  reason VARCHAR NOT NULL,
  custom_reason VARCHAR,
  pending_amount NUMERIC DEFAULT 0,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by visit_id
CREATE INDEX IF NOT EXISTS idx_gatepass_notifications_visit_id ON gatepass_notifications(visit_id);

-- Index for checking unresolved notifications
CREATE INDEX IF NOT EXISTS idx_gatepass_notifications_resolved ON gatepass_notifications(resolved);

-- Enable RLS
ALTER TABLE gatepass_notifications ENABLE ROW LEVEL SECURITY;

-- Policy for all operations (adjust based on your security requirements)
CREATE POLICY "Allow all operations for gatepass_notifications" ON gatepass_notifications
  FOR ALL USING (true) WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE gatepass_notifications IS 'Stores notifications for pending amounts that need to be resolved before gate pass generation';
