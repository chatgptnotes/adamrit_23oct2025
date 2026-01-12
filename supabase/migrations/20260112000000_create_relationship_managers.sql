-- Create relationship_managers table
CREATE TABLE IF NOT EXISTS public.relationship_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_no TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.relationship_managers ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations (public access like other master tables)
CREATE POLICY "Allow all operations on relationship_managers"
ON public.relationship_managers FOR ALL USING (true);

-- Create index for faster name searches
CREATE INDEX IF NOT EXISTS idx_relationship_managers_name ON public.relationship_managers(name);
