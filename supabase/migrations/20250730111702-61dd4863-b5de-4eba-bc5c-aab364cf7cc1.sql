-- Add billing_status column to visits table to store billing status information
ALTER TABLE public.visits 
ADD COLUMN billing_status TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN public.visits.billing_status IS 'Billing status options: Approval Pending, ID Pending, Bill Not Submitted, Bill Completed, Bill Submitted';