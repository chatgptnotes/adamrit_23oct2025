-- Add attachment URL and Google Sheet link to payment_obligations
-- For uploading outstanding payment Excel/docs and linking Google Sheets

ALTER TABLE payment_obligations ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE payment_obligations ADD COLUMN IF NOT EXISTS google_sheet_link TEXT;

COMMENT ON COLUMN payment_obligations.attachment_url IS 'URL of uploaded Excel/Doc file with outstanding payment details';
COMMENT ON COLUMN payment_obligations.google_sheet_link IS 'Google Sheets/Drive link for viewing outstanding payments';
