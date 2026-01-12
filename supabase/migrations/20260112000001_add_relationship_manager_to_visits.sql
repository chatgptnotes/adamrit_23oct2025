-- Add relationship_manager_id column to visits table
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS relationship_manager_id UUID REFERENCES public.relationship_managers(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_visits_relationship_manager_id
ON public.visits(relationship_manager_id);
