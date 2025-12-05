
-- Create bill_sections table to store different sections like "Pre-Surgical Conservative Treatment"
CREATE TABLE public.bill_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  section_title TEXT NOT NULL,
  date_from DATE,
  date_to DATE,
  section_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bill_line_items table to store individual line items
CREATE TABLE public.bill_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  bill_section_id UUID REFERENCES public.bill_sections(id) ON DELETE CASCADE,
  sr_no TEXT NOT NULL,
  item_description TEXT NOT NULL,
  cghs_nabh_code TEXT,
  cghs_nabh_rate NUMERIC(10,2),
  qty INTEGER DEFAULT 1,
  amount NUMERIC(10,2) DEFAULT 0,
  item_type TEXT DEFAULT 'standard', -- 'standard' or 'surgical'
  base_amount NUMERIC(10,2), -- for surgical items
  primary_adjustment TEXT, -- for surgical items
  secondary_adjustment TEXT, -- for surgical items
  dates_info TEXT, -- for storing date ranges like "Dt.(04/03/2024 TO 09/03/2024)"
  item_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_bill_sections_bill_id ON public.bill_sections(bill_id);
CREATE INDEX idx_bill_line_items_bill_id ON public.bill_line_items(bill_id);
CREATE INDEX idx_bill_line_items_section_id ON public.bill_line_items(bill_section_id);

-- Enable RLS on new tables
ALTER TABLE public.bill_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_line_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bill_sections
CREATE POLICY "Bill sections are viewable by everyone" ON public.bill_sections FOR SELECT USING (true);
CREATE POLICY "Bill sections can be created by everyone" ON public.bill_sections FOR INSERT WITH CHECK (true);
CREATE POLICY "Bill sections can be updated by everyone" ON public.bill_sections FOR UPDATE USING (true);
CREATE POLICY "Bill sections can be deleted by everyone" ON public.bill_sections FOR DELETE USING (true);

-- Create RLS policies for bill_line_items
CREATE POLICY "Bill line items are viewable by everyone" ON public.bill_line_items FOR SELECT USING (true);
CREATE POLICY "Bill line items can be created by everyone" ON public.bill_line_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Bill line items can be updated by everyone" ON public.bill_line_items FOR UPDATE USING (true);
CREATE POLICY "Bill line items can be deleted by everyone" ON public.bill_line_items FOR DELETE USING (true);
