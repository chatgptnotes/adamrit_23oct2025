-- Create WhatsApp Notifications Tracking Table
-- This table tracks all WhatsApp notifications sent for admission reminders

CREATE TABLE IF NOT EXISTS whatsapp_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id TEXT NOT NULL,
    patient_id UUID NOT NULL,
    patient_name TEXT NOT NULL,
    admission_date DATE NOT NULL,
    corporate TEXT,
    phone_number TEXT NOT NULL,
    message_content TEXT NOT NULL,
    template_name TEXT NOT NULL DEFAULT 'patient_admission_reminder',
    status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    doubletick_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Foreign key relationships
    CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,

    -- Prevent duplicate notifications for the same visit
    CONSTRAINT unique_visit_notification UNIQUE (visit_id, admission_date)
);

-- Create indexes for better query performance
CREATE INDEX idx_whatsapp_notifications_visit_id ON whatsapp_notifications(visit_id);
CREATE INDEX idx_whatsapp_notifications_patient_id ON whatsapp_notifications(patient_id);
CREATE INDEX idx_whatsapp_notifications_admission_date ON whatsapp_notifications(admission_date);
CREATE INDEX idx_whatsapp_notifications_status ON whatsapp_notifications(status);
CREATE INDEX idx_whatsapp_notifications_sent_at ON whatsapp_notifications(sent_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at column
CREATE TRIGGER trigger_update_whatsapp_notifications_updated_at
    BEFORE UPDATE ON whatsapp_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_notifications_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all authenticated users" ON whatsapp_notifications
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON whatsapp_notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON whatsapp_notifications
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Add comment to table
COMMENT ON TABLE whatsapp_notifications IS 'Tracks all WhatsApp notifications sent for 5-day admission reminders';
COMMENT ON COLUMN whatsapp_notifications.status IS 'pending: queued, sent: successfully sent, failed: failed to send';
COMMENT ON COLUMN whatsapp_notifications.doubletick_response IS 'Stores the complete API response from Double Tick for debugging';
