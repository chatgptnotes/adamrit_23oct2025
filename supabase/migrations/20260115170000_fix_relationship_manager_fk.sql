-- Fix foreign key constraint on visits.relationship_manager_id
-- Change from ON DELETE RESTRICT (default) to ON DELETE SET NULL
-- This allows deleting relationship managers even if visits reference them

-- Drop the existing foreign key constraint
ALTER TABLE public.visits
DROP CONSTRAINT IF EXISTS visits_relationship_manager_id_fkey;

-- Re-add with ON DELETE SET NULL
ALTER TABLE public.visits
ADD CONSTRAINT visits_relationship_manager_id_fkey
FOREIGN KEY (relationship_manager_id)
REFERENCES public.relationship_managers(id)
ON DELETE SET NULL;
