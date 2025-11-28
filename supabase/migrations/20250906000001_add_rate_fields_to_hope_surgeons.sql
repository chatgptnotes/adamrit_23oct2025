-- Add rate fields to hope_surgeons table
ALTER TABLE hope_surgeons 
ADD COLUMN tpa_rate DECIMAL(10,2),
ADD COLUMN non_nabh_rate DECIMAL(10,2), 
ADD COLUMN nabh_rate DECIMAL(10,2),
ADD COLUMN private_rate DECIMAL(10,2);

-- Add comments for clarity
COMMENT ON COLUMN hope_surgeons.tpa_rate IS 'TPA surgery rate';
COMMENT ON COLUMN hope_surgeons.non_nabh_rate IS 'Non-NABH surgery rate';
COMMENT ON COLUMN hope_surgeons.nabh_rate IS 'NABH surgery rate';
COMMENT ON COLUMN hope_surgeons.private_rate IS 'Private surgery rate';