-- Add staff_pin column for quick staff login (@XXXX pattern)
-- Each pin maps to exactly one staff member for audit trail

ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS staff_pin varchar(4) UNIQUE;

-- Index for fast pin lookup
CREATE INDEX IF NOT EXISTS idx_user_staff_pin ON public."User" (staff_pin) WHERE staff_pin IS NOT NULL;

-- Insert Sikandar as Ayushman staff with pin 2345
INSERT INTO public."User" (email, password, role, hospital_type, staff_pin)
VALUES ('sikandar@staff.ayushman', 'staff_pin_only', 'user', 'ayushman', '2345')
ON CONFLICT (email) DO UPDATE SET staff_pin = '2345';
