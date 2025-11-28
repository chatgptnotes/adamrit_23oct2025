-- Create Financial Summary table to store financial summary data from FinalBill component
CREATE TABLE IF NOT EXISTS public.financial_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES public.visits(id) ON DELETE CASCADE,
  
  -- Total Amount Row
  total_amount_advance_payment DECIMAL(10,2) DEFAULT 0,
  total_amount_clinical_services DECIMAL(10,2) DEFAULT 0,
  total_amount_laboratory_services DECIMAL(10,2) DEFAULT 0,
  total_amount_radiology DECIMAL(10,2) DEFAULT 0,
  total_amount_pharmacy DECIMAL(10,2) DEFAULT 0,
  total_amount_implant DECIMAL(10,2) DEFAULT 0,
  total_amount_blood DECIMAL(10,2) DEFAULT 0,
  total_amount_surgery DECIMAL(10,2) DEFAULT 0,
  total_amount_mandatory_services DECIMAL(10,2) DEFAULT 0,
  total_amount_physiotherapy DECIMAL(10,2) DEFAULT 0,
  total_amount_consultation DECIMAL(10,2) DEFAULT 0,
  total_amount_surgery_internal_report DECIMAL(10,2) DEFAULT 0,
  total_amount_implant_cost DECIMAL(10,2) DEFAULT 0,
  total_amount_private DECIMAL(10,2) DEFAULT 0,
  total_amount_accommodation_charges DECIMAL(10,2) DEFAULT 0,
  total_amount_total DECIMAL(10,2) DEFAULT 0,
  
  -- Discount Row
  discount_advance_payment DECIMAL(10,2) DEFAULT 0,
  discount_clinical_services DECIMAL(10,2) DEFAULT 0,
  discount_laboratory_services DECIMAL(10,2) DEFAULT 0,
  discount_radiology DECIMAL(10,2) DEFAULT 0,
  discount_pharmacy DECIMAL(10,2) DEFAULT 0,
  discount_implant DECIMAL(10,2) DEFAULT 0,
  discount_blood DECIMAL(10,2) DEFAULT 0,
  discount_surgery DECIMAL(10,2) DEFAULT 0,
  discount_mandatory_services DECIMAL(10,2) DEFAULT 0,
  discount_physiotherapy DECIMAL(10,2) DEFAULT 0,
  discount_consultation DECIMAL(10,2) DEFAULT 0,
  discount_surgery_internal_report DECIMAL(10,2) DEFAULT 0,
  discount_implant_cost DECIMAL(10,2) DEFAULT 0,
  discount_private DECIMAL(10,2) DEFAULT 0,
  discount_accommodation_charges DECIMAL(10,2) DEFAULT 0,
  discount_total DECIMAL(10,2) DEFAULT 0,
  
  -- Amount Paid Row
  amount_paid_advance_payment DECIMAL(10,2) DEFAULT 0,
  amount_paid_clinical_services DECIMAL(10,2) DEFAULT 0,
  amount_paid_laboratory_services DECIMAL(10,2) DEFAULT 0,
  amount_paid_radiology DECIMAL(10,2) DEFAULT 0,
  amount_paid_pharmacy DECIMAL(10,2) DEFAULT 0,
  amount_paid_implant DECIMAL(10,2) DEFAULT 0,
  amount_paid_blood DECIMAL(10,2) DEFAULT 0,
  amount_paid_surgery DECIMAL(10,2) DEFAULT 0,
  amount_paid_mandatory_services DECIMAL(10,2) DEFAULT 0,
  amount_paid_physiotherapy DECIMAL(10,2) DEFAULT 0,
  amount_paid_consultation DECIMAL(10,2) DEFAULT 0,
  amount_paid_surgery_internal_report DECIMAL(10,2) DEFAULT 0,
  amount_paid_implant_cost DECIMAL(10,2) DEFAULT 0,
  amount_paid_private DECIMAL(10,2) DEFAULT 0,
  amount_paid_accommodation_charges DECIMAL(10,2) DEFAULT 0,
  amount_paid_total DECIMAL(10,2) DEFAULT 0,
  
  -- Refunded Amount Row
  refunded_amount_advance_payment DECIMAL(10,2) DEFAULT 0,
  refunded_amount_clinical_services DECIMAL(10,2) DEFAULT 0,
  refunded_amount_laboratory_services DECIMAL(10,2) DEFAULT 0,
  refunded_amount_radiology DECIMAL(10,2) DEFAULT 0,
  refunded_amount_pharmacy DECIMAL(10,2) DEFAULT 0,
  refunded_amount_implant DECIMAL(10,2) DEFAULT 0,
  refunded_amount_blood DECIMAL(10,2) DEFAULT 0,
  refunded_amount_surgery DECIMAL(10,2) DEFAULT 0,
  refunded_amount_mandatory_services DECIMAL(10,2) DEFAULT 0,
  refunded_amount_physiotherapy DECIMAL(10,2) DEFAULT 0,
  refunded_amount_consultation DECIMAL(10,2) DEFAULT 0,
  refunded_amount_surgery_internal_report DECIMAL(10,2) DEFAULT 0,
  refunded_amount_implant_cost DECIMAL(10,2) DEFAULT 0,
  refunded_amount_private DECIMAL(10,2) DEFAULT 0,
  refunded_amount_accommodation_charges DECIMAL(10,2) DEFAULT 0,
  refunded_amount_total DECIMAL(10,2) DEFAULT 0,
  
  -- Balance Row
  balance_advance_payment DECIMAL(10,2) DEFAULT 0,
  balance_clinical_services DECIMAL(10,2) DEFAULT 0,
  balance_laboratory_services DECIMAL(10,2) DEFAULT 0,
  balance_radiology DECIMAL(10,2) DEFAULT 0,
  balance_pharmacy DECIMAL(10,2) DEFAULT 0,
  balance_implant DECIMAL(10,2) DEFAULT 0,
  balance_blood DECIMAL(10,2) DEFAULT 0,
  balance_surgery DECIMAL(10,2) DEFAULT 0,
  balance_mandatory_services DECIMAL(10,2) DEFAULT 0,
  balance_physiotherapy DECIMAL(10,2) DEFAULT 0,
  balance_consultation DECIMAL(10,2) DEFAULT 0,
  balance_surgery_internal_report DECIMAL(10,2) DEFAULT 0,
  balance_implant_cost DECIMAL(10,2) DEFAULT 0,
  balance_private DECIMAL(10,2) DEFAULT 0,
  balance_accommodation_charges DECIMAL(10,2) DEFAULT 0,
  balance_total DECIMAL(10,2) DEFAULT 0,
  
  -- Additional metadata
  package_start_date DATE,
  package_end_date DATE,
  total_package_days INTEGER DEFAULT 7,
  total_admission_days INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(bill_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_financial_summary_bill_id ON public.financial_summary(bill_id);
CREATE INDEX IF NOT EXISTS idx_financial_summary_visit_id ON public.financial_summary(visit_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.financial_summary ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - adjust based on your auth requirements)
CREATE POLICY "Allow all operations on financial_summary" ON public.financial_summary
  FOR ALL USING (true) WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.financial_summary IS 'Stores financial summary data for bills including total amounts, discounts, payments, refunds, and balances';
COMMENT ON COLUMN public.financial_summary.bill_id IS 'Reference to the bill this financial summary belongs to';
COMMENT ON COLUMN public.financial_summary.visit_id IS 'Reference to the visit this financial summary belongs to';
COMMENT ON COLUMN public.financial_summary.package_start_date IS 'Start date of the treatment package';
COMMENT ON COLUMN public.financial_summary.package_end_date IS 'End date of the treatment package';
COMMENT ON COLUMN public.financial_summary.total_package_days IS 'Total number of days in the treatment package';
COMMENT ON COLUMN public.financial_summary.total_admission_days IS 'Total number of admission days';
