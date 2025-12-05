-- Add extension_of_stay and additional_approvals columns to visits table
ALTER TABLE public.visits 
ADD COLUMN extension_of_stay TEXT DEFAULT 'not_required' CHECK (extension_of_stay IN ('taken', 'not_taken', 'not_required')),
ADD COLUMN additional_approvals TEXT DEFAULT 'not_required' CHECK (additional_approvals IN ('taken', 'not_taken', 'not_required'));