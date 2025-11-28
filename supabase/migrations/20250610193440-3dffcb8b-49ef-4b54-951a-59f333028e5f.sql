
-- Create table for ESIC surgeons
CREATE TABLE public.esic_surgeons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  specialty text,
  department text,
  contact_info text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for referees
CREATE TABLE public.referees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  specialty text,
  institution text,
  contact_info text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for Hope surgeons
CREATE TABLE public.hope_surgeons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  specialty text,
  department text,
  contact_info text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for Hope consultants
CREATE TABLE public.hope_consultants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  specialty text,
  department text,
  contact_info text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert sample data for ESIC surgeons
INSERT INTO public.esic_surgeons (name, specialty, department) VALUES
('Dr. Smith', 'General Surgery', 'Surgery'),
('Dr. Johnson', 'Orthopedic Surgery', 'Orthopedics'),
('Dr. Williams', 'Cardiovascular Surgery', 'Cardiology'),
('Dr. Brown', 'Neurosurgery', 'Neurology'),
('Dr. Davis', 'Plastic Surgery', 'Plastic Surgery'),
('Dr. Miller', 'Urology', 'Urology'),
('Dr. Wilson', 'ENT Surgery', 'ENT'),
('Dr. Moore', 'Gynecology', 'Gynecology'),
('Dr. Taylor', 'Pediatric Surgery', 'Pediatrics'),
('Dr. Anderson', 'Thoracic Surgery', 'Thoracic Surgery'),
('Dr. Patel', 'General Surgery', 'Surgery'),
('Dr. Singh', 'Orthopedic Surgery', 'Orthopedics'),
('Dr. Kumar', 'Gastroenterology', 'Gastroenterology'),
('Dr. Sharma', 'Cardiology', 'Cardiology'),
('Dr. Verma', 'Neurology', 'Neurology'),
('Dr. Gupta', 'Dermatology', 'Dermatology'),
('Dr. Agarwal', 'Ophthalmology', 'Ophthalmology'),
('Dr. Jain', 'Pulmonology', 'Pulmonology'),
('Dr. Reddy', 'Nephrology', 'Nephrology'),
('Dr. Nair', 'Endocrinology', 'Endocrinology');

-- Insert sample data for referees
INSERT INTO public.referees (name, specialty, institution) VALUES
('Dr. Garcia', 'Internal Medicine', 'City Hospital'),
('Dr. Martinez', 'Family Medicine', 'Community Clinic'),
('Dr. Rodriguez', 'Emergency Medicine', 'Emergency Center'),
('Dr. Lewis', 'Pediatrics', 'Children Hospital'),
('Dr. Lee', 'Geriatrics', 'Senior Care Center'),
('Dr. Walker', 'Psychiatry', 'Mental Health Center'),
('Dr. Hall', 'Radiology', 'Imaging Center'),
('Dr. Allen', 'Pathology', 'Lab Services'),
('Dr. Young', 'Anesthesiology', 'Surgery Center'),
('Dr. King', 'Physical Medicine', 'Rehabilitation Center'),
('Dr. Mehta', 'Oncology', 'Cancer Center'),
('Dr. Kapoor', 'Hematology', 'Blood Center'),
('Dr. Saxena', 'Infectious Disease', 'ID Clinic'),
('Dr. Malhotra', 'Rheumatology', 'Arthritis Center'),
('Dr. Chopra', 'Allergy & Immunology', 'Allergy Clinic'),
('Dr. Bansal', 'Sports Medicine', 'Sports Clinic'),
('Dr. Sinha', 'Pain Management', 'Pain Center'),
('Dr. Mishra', 'Sleep Medicine', 'Sleep Center'),
('Dr. Tiwari', 'Occupational Medicine', 'Work Health'),
('Dr. Pandey', 'Preventive Medicine', 'Prevention Center');

-- Insert sample data for Hope surgeons
INSERT INTO public.hope_surgeons (name, specialty, department) VALUES
('Dr. Thompson', 'Cardiac Surgery', 'Cardiothoracic'),
('Dr. White', 'Vascular Surgery', 'Vascular'),
('Dr. Harris', 'Transplant Surgery', 'Transplant'),
('Dr. Martin', 'Oncologic Surgery', 'Surgical Oncology'),
('Dr. Jackson', 'Minimally Invasive Surgery', 'Advanced Surgery'),
('Dr. Clark', 'Reconstructive Surgery', 'Plastic & Reconstructive'),
('Dr. Rodriguez', 'Spine Surgery', 'Neurosurgery'),
('Dr. Lewis', 'Hand Surgery', 'Orthopedics'),
('Dr. Lee', 'Pediatric Surgery', 'Pediatric Surgery'),
('Dr. Walker', 'Bariatric Surgery', 'Metabolic Surgery'),
('Dr. Krishnan', 'Robotic Surgery', 'Advanced Robotics'),
('Dr. Iyer', 'Laparoscopic Surgery', 'Minimally Invasive'),
('Dr. Nair', 'Endocrine Surgery', 'Endocrine'),
('Dr. Menon', 'Hepatobiliary Surgery', 'HPB Surgery'),
('Dr. Pillai', 'Colorectal Surgery', 'Colorectal'),
('Dr. Varma', 'Trauma Surgery', 'Trauma'),
('Dr. Bhat', 'Ophthalmic Surgery', 'Ophthalmology'),
('Dr. Rao', 'Oral Surgery', 'Oral & Maxillofacial'),
('Dr. Desai', 'Aesthetic Surgery', 'Cosmetic Surgery'),
('Dr. Shah', 'Emergency Surgery', 'Emergency Surgery');

-- Insert sample data for Hope consultants
INSERT INTO public.hope_consultants (name, specialty, department) VALUES
('Dr. Adams', 'Critical Care', 'ICU'),
('Dr. Baker', 'Hospitalist', 'Internal Medicine'),
('Dr. Carter', 'Emergency Medicine', 'Emergency'),
('Dr. Davis', 'Intensive Care', 'Critical Care'),
('Dr. Evans', 'Palliative Care', 'Palliative Medicine'),
('Dr. Foster', 'Geriatric Medicine', 'Geriatrics'),
('Dr. Green', 'Infectious Disease', 'ID Consultation'),
('Dr. Hill', 'Pain Management', 'Pain Service'),
('Dr. Jones', 'Cardiology Consult', 'Cardiology'),
('Dr. Kelly', 'Pulmonology Consult', 'Pulmonology'),
('Dr. Raman', 'Nephrology Consult', 'Nephrology'),
('Dr. Subramanian', 'Endocrinology Consult', 'Endocrinology'),
('Dr. Venkatesh', 'Gastroenterology Consult', 'Gastroenterology'),
('Dr. Lakshmi', 'Hematology Consult', 'Hematology'),
('Dr. Priya', 'Oncology Consult', 'Oncology'),
('Dr. Kavitha', 'Rheumatology Consult', 'Rheumatology'),
('Dr. Divya', 'Neurology Consult', 'Neurology'),
('Dr. Anjali', 'Psychiatry Consult', 'Psychiatry'),
('Dr. Pooja', 'Dermatology Consult', 'Dermatology'),
('Dr. Sneha', 'Nutrition Consult', 'Clinical Nutrition');
