-- Add rate fields to hope_consultants table
ALTER TABLE hope_consultants 
ADD COLUMN tpa_rate DECIMAL(10,2),
ADD COLUMN non_nabh_rate DECIMAL(10,2), 
ADD COLUMN nabh_rate DECIMAL(10,2),
ADD COLUMN private_rate DECIMAL(10,2);

-- Add comments for clarity
COMMENT ON COLUMN hope_consultants.tpa_rate IS 'TPA consultation rate';
COMMENT ON COLUMN hope_consultants.non_nabh_rate IS 'Non-NABH consultation rate';
COMMENT ON COLUMN hope_consultants.nabh_rate IS 'NABH consultation rate';
COMMENT ON COLUMN hope_consultants.private_rate IS 'Private consultation rate';