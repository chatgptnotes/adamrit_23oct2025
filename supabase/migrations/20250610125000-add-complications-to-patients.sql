
-- Update patients with their respective diagnosis complications

-- Update Inguinal Hernia patients with complications
UPDATE public.patients 
SET complications = CASE 
  WHEN name = 'Ms. Niyati Bawankar' THEN 'Bowel Obstruction'
  WHEN name = 'Mr. Rajveer S. Ratnaparkhi' THEN 'Incarceration'
  WHEN name = 'Master Utkarsh G. Wasnik' THEN 'Strangulation'
  WHEN name = 'Mr. Deepak Paripagar' THEN 'Chronic Pain'
  WHEN name = 'Mr. Brijmohan Dwivedi' THEN 'Bowel Obstruction'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Inguinal Hernia');

-- Update Hypospadias patients with complications
UPDATE public.patients 
SET complications = CASE 
  WHEN name = 'Master Shourya A. Adsod' THEN 'Urethral Stricture'
  WHEN name = 'Master Shivansh Chavhan' THEN 'Fistula Formation'
  WHEN name = 'Master Sparsh Bodele' THEN 'Meatal Stenosis'
  WHEN name = 'Master Bhavesh Padole' THEN 'Chordee Recurrence'
  WHEN name = 'Master Prajwal Devhare' THEN 'Urethral Stricture'
  WHEN name = 'Baby Aarav Patle' THEN 'Fistula Formation'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Hypospadias');

-- Update Undescended Testis patients with complications
UPDATE public.patients 
SET complications = CASE 
  WHEN name = 'Baby Anay A. Shivankar' THEN 'Testicular Cancer'
  WHEN name = 'Master Sanidhya H. Nimje' THEN 'Infertility'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Undescended Testis');

-- Update Appendicitis patients with complications (if any exist)
UPDATE public.patients 
SET complications = CASE 
  WHEN name LIKE '%Appendicitis%' THEN 'Perforation'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Appendicitis');

-- Update Gallbladder Disease patients with complications (if any exist)
UPDATE public.patients 
SET complications = CASE 
  WHEN name LIKE '%Gallbladder%' THEN 'Cholangitis'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Gallbladder Disease');

-- Update Thyroid Disorders patients with complications (if any exist)
UPDATE public.patients 
SET complications = CASE 
  WHEN name LIKE '%Thyroid%' THEN 'Recurrent Laryngeal Nerve Injury'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Thyroid Disorders');

-- Update Varicose Veins patients with complications
UPDATE public.patients 
SET complications = CASE 
  WHEN name = 'Mr. Pradumna S. Tambekar' THEN 'Deep Vein Thrombosis'
  WHEN name = 'Mr. Suraj Bagekar' THEN 'Pulmonary Embolism'
  WHEN name = 'Mr. Ajit Singh' THEN 'Chronic Venous Insufficiency'
  WHEN name = 'Mr. Rajkumar Arghode' THEN 'Leg Ulceration'
  WHEN name = 'Mr. Pawan Kurvekar' THEN 'Deep Vein Thrombosis'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Varicose Veins');

-- Update Hemorrhoids patients with complications
UPDATE public.patients 
SET complications = CASE 
  WHEN name = 'Mr. Ashish Barsagade' THEN 'Thrombosis'
  WHEN name = 'Mr. Bhanudas Kawale' THEN 'Anal Stricture'
  WHEN name = 'Mrs. Umadevi Prasad' THEN 'Incontinence'
  WHEN name = 'Mr. Vinod Kalaskar' THEN 'Chronic Bleeding/Anemia'
  WHEN name = 'Mr. Vitthal Hinge' THEN 'Thrombosis'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Hemorrhoids');

-- Update Urinary Stones patients with complications
UPDATE public.patients 
SET complications = CASE 
  WHEN name = 'Mr. Ramprasad Lilhare' THEN 'Acute Kidney Injury'
  WHEN name = 'Mr. Pankaj Dhongade' THEN 'Urosepsis'
  WHEN name = 'Mr. Baldeo Kokade' THEN 'Chronic Kidney Disease'
  WHEN name = 'Mr. Shailesh Borkar' THEN 'Ureteral Stricture'
  WHEN name = 'Ms. Shivani Malik' THEN 'Acute Kidney Injury'
  WHEN name = 'Mr. Priyanshu Tembhurne' THEN 'Urosepsis'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Urinary Stones');

-- Update Phimosis/Circumcision patients with complications
UPDATE public.patients 
SET complications = CASE 
  WHEN name = 'Mr. Anshu Korwate' THEN 'Meatal Stenosis'
  WHEN name = 'Master Advik Gajbhiye' THEN 'Penile Adhesions'
  WHEN name = 'Master Yugansh Masram' THEN 'Bleeding/Hematoma'
  WHEN name = 'Master Yatharth Gavande' THEN 'Infection'
  WHEN name = 'Master Mahir Bagul' THEN 'Meatal Stenosis'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Phimosis/Circumcision');

-- Update Critical Care/ICU patients with complications
UPDATE public.patients 
SET complications = CASE 
  WHEN name = 'Ms. Ranjita Naharkar' THEN 'Multi-organ Failure'
  WHEN name = 'Mr. Om Mahale' THEN 'Septic Shock'
  WHEN name = 'Mr. Ajay Singh' THEN 'ARDS'
  WHEN name = 'Mr. Kamlesh Bhanarkar' THEN 'Nosocomial Infections'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Critical Care/ICU');

-- Update Burn Injuries patients with complications
UPDATE public.patients 
SET complications = CASE 
  WHEN name = 'Mr. Ganesh Pendor' THEN 'Multi-organ Failure'
  WHEN name = 'Mr. Sumit Asutkar' THEN 'Septic Shock'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Burn Injuries');

-- Update Chronic Wounds patients with complications
UPDATE public.patients 
SET complications = CASE 
  WHEN name = 'Mr. Arun Patne' THEN 'Multi-organ Failure'
  WHEN name = 'Mr. Satish Bharatpure' THEN 'Septic Shock'
  WHEN name = 'Ms. Karuna Gorkhede' THEN 'ARDS'
  WHEN name = 'Mr. Ritik D. Somkuwar' THEN 'Nosocomial Infections'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Chronic Wounds');

-- Update Facial Bone Fractures patients with complications
UPDATE public.patients 
SET complications = CASE 
  WHEN name = 'Mr. Prakash Patel' THEN 'Multi-organ Failure'
  WHEN name = 'Mr. Deepchand Madavi' THEN 'Septic Shock'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Facial Bone Fractures');

-- Update Testicular Tumor patients with complications
UPDATE public.patients 
SET complications = CASE 
  WHEN name = 'Mr. Kailash Jha' THEN 'Multi-organ Failure'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Testicular Tumor');

-- Update Bladder Neck Obstruction patients with complications
UPDATE public.patients 
SET complications = CASE 
  WHEN name = 'Mr. Divakar Bobade' THEN 'Multi-organ Failure'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Bladder Neck Obstruction');

-- Update Dialysis patients with complications
UPDATE public.patients 
SET complications = CASE 
  WHEN name = 'Mr. Mumtaz Ahmad' THEN 'Multi-organ Failure'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Dialysis');

-- Update Other Conservative Cases patients with complications
UPDATE public.patients 
SET complications = CASE 
  WHEN name = 'Mr. Deshraj Gendlal' THEN 'Multi-organ Failure'
  WHEN name = 'Mrs. Smita Meshram' THEN 'Septic Shock'
  WHEN name = 'Ms. Chaitali Meshram' THEN 'ARDS'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Other Conservative Cases');
