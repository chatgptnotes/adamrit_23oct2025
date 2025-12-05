
-- Insert all the existing patient data into the database
-- First, let's insert the remaining diagnosis categories that weren't in the initial migration
INSERT INTO public.diagnoses (name, description) VALUES
('Varicose Veins', 'Enlarged, twisted veins usually in the legs'),
('Hemorrhoids', 'Swollen veins in the rectum and anus'),
('Urinary Stones', 'Kidney, bladder, or ureter stones'),
('Phimosis/Circumcision', 'Tight foreskin requiring circumcision'),
('Critical Care/ICU', 'Patients requiring intensive care management')
ON CONFLICT (name) DO NOTHING;

-- Now insert all the patient data
-- Inguinal Hernia patients
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Ms. Niyati Bawankar', 'Inguinal Hernia (left groin)', 'None', 'Hernioplasty', 'Ultrasound abdomen; Routine pre-op labs', 'Inj. Ceftriaxone (prophylactic)', 'Paracetamol (analgesic)', 'Dr. Vishal Nandagavli', 'Dr. Mudassir (Surgery Dept.)'
FROM public.diagnoses d WHERE d.name = 'Inguinal Hernia';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Rajveer S. Ratnaparkhi', 'Inguinal Hernia (right side)', 'None', 'Herniotomy (open hernia repair)', 'Ultrasound groin; CBC, Chest X-ray', 'Inj. Cefuroxime (single dose)', 'Ibuprofen (pain relief)', 'Dr. Thavendra Dihare', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Inguinal Hernia';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Master Utkarsh G. Wasnik', 'Bilateral Inguinal Hernias with Hydrocele', 'Hydrocele sac (associated)', 'Bilateral Herniotomy + Hydrocele repair', 'Ultrasound scrotum; Urinalysis', 'Inj. Ampicillin + Gentamicin', 'Paracetamol; Scrotal support care', 'Dr. Thavendra Dihare', 'Dr. Mudassir'
FROM public.diagnoses d WHERE d.name = 'Inguinal Hernia';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Deepak Paripagar', 'Inguinal Hernia (left side)', 'Obstructed hernia (emergency)', 'Hernioplasty (open)', 'X-ray abdomen (air-fluid levels); Ultrasound groin', 'Inj. Piperacillin-Tazo', 'Metronidazole (bowel flora coverage)', 'Dr. Akshay Akulwar', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Inguinal Hernia';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Brijmohan Dwivedi', 'Inguinal Hernia (left side)', 'None', 'Hernioplasty (open)', 'Ultrasound abdomen; Routine labs', 'Inj. Ceftriaxone (prophylactic)', 'Diclofenac (analgesic)', 'Dr. Mudassir', 'Dr. Mudassir'
FROM public.diagnoses d WHERE d.name = 'Inguinal Hernia';

-- Hypospadias patients
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Master Shourya A. Adsod', 'Hypospadias (anterior)', 'Chordee (penile curvature)', 'Hypospadias Repair + Circumcision', 'Ultrasound KUB (screen for anomalies); MCU (if severe)', 'Inj. Augmentin (Ampicillin/Sulbactam)', 'Urinary catheter care; Acetaminophen', 'Dr. Thavendra Dihare (Pediatric Surgeon)', 'Dr. Mudassir (Pediatrics)'
FROM public.diagnoses d WHERE d.name = 'Hypospadias';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Master Shivansh Chavhan', 'Hypospadias (midshaft)', 'None', 'Hypospadias Repair + Circumcision', 'Ultrasound pelvis; Routine blood tests', 'Inj. Cefotaxime (pediatric dose)', 'Acetaminophen; Antispasmodic drops', 'Dr. Thavendra Dihare', 'Dr. Mudassir'
FROM public.diagnoses d WHERE d.name = 'Hypospadias';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Master Sparsh Bodele', 'Hypospadias (posterior)', 'Chordee', 'One-stage Hypospadias Repair', 'Ultrasound KUB; Urine culture', 'Inj. Ceftriaxone', 'Belladonna & Opium suppository (bladder spasm relief)', 'Dr. Sudesh Wankhede', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Hypospadias';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Master Bhavesh Padole', 'Hypospadias (penoscrotal)', 'None', 'Hypospadias Repair + Circumcision', 'VCUG (voiding cystogram); Pre-op labs', 'Inj. Amoxicillin-Clavulanate', 'Ibuprofen (pain relief)', 'Dr. Sudesh Wankhede', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Hypospadias';

-- Varicose Veins patients
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Pradumna S. Tambekar', 'Varicose Veins (R leg)', 'None (cosmetic issue)', 'Endovenous Laser Ablation (EVLA)', 'Venous Doppler ultrasound legs; Coagulation profile', 'Inj. Cefazolin (single dose)', 'Compression stockings; Ibuprofen', 'Dr. Dinesh Sharma (Interventional Radiologist)', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Varicose Veins';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Suraj Bagekar', 'Varicose Veins (L leg)', 'Stasis dermatitis', 'Endovenous Laser Ablation', 'Venous Doppler ultrasound; Skin swab (if ulcer)', 'Inj. Ceftriaxone', 'Topical antiseptic dressing; Pentoxyfylline', 'Dr. Dinesh Sharma (Interventional Radiologist)', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Varicose Veins';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Ajit Singh', 'Varicose Veins (bilateral)', 'Venous ulcer (ankle)', 'Varicose Vein Laser Ablation', 'Duplex Doppler; Ankle X-ray (ulcer evaluation)', 'Inj. Augmentin', 'Wound care (ulcer dressings); Vitamin C (healing)', 'Dr. Dinesh Sharma', 'Dr. Mudassir'
FROM public.diagnoses d WHERE d.name = 'Varicose Veins';

-- Hemorrhoids patients
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Ashish Barsagade', 'Hemorrhoids (Grade III)', 'Bleeding per rectum', 'Laser Hemorrhoidectomy + Sphincterotomy', 'Proctoscopy; CBC (anemia check)', 'Inj. Metronidazole + Ciprofloxacin', 'Stool softener (Lactulose); Sitz baths', 'Dr. Mudassir', 'Dr. Mudassir'
FROM public.diagnoses d WHERE d.name = 'Hemorrhoids';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Bhanudas Kawale', 'Hemorrhoids (Grade IV)', 'Anal prolapse', 'Laser Hemorrhoidectomy + Sphincterotomy', 'Colonoscopy (to rule out other lesions)', 'Inj. Ceftriaxone + Metronidazole', 'Stool softener; Topical anesthetic cream', 'Dr. Mudassir', 'Dr. Mudassir'
FROM public.diagnoses d WHERE d.name = 'Hemorrhoids';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mrs. Umadevi Prasad', 'Hemorrhoids (Bleeding)', 'Anemia (mild)', 'Laser Hemorrhoidectomy', 'Proctoscopy; CBC (Hb 9 g/dL)', 'Inj. Metronidazole + Amikacin', 'Iron supplements (for anemia); Stool softeners', 'Dr. Mudassir', 'Dr. Mudassir'
FROM public.diagnoses d WHERE d.name = 'Hemorrhoids';

-- Urinary Stones patients
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Ramprasad Lilhare', 'Right Kidney Stone', 'Hydronephrosis', 'PCNL (Right kidney) + DJ stent', 'Ultrasound KUB; CT KUB (2 cm stone)', 'Inj. Piperacillin-Tazobactam + Amikacin', 'Urinary alkalizers; Painkillers', 'Dr. Jaydeep Dalvi', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Urinary Stones';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Pankaj Dhongade', 'Large Ureteric Stone (Lt side)', 'Ureteral obstruction', 'URSL (Laser lithotripsy) + DJ stenting', 'X-ray KUB; CT Urogram', 'Inj. Ceftriaxone + Gentamicin', 'Tamsulosin (to aid fragment passage); IV fluids', 'Dr. Jaydeep Dalvi', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Urinary Stones';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Baldeo Kokade', 'Staghorn Kidney Stone (Rt)', 'Infection (UTI)', 'PCNL (Right kidney) + URSL (ureter)', 'CT KUB; Urine culture (E. coli)', 'Inj. Piperacillin-Tazo + Metronidazole', 'IV fluids; Acetaminophen', 'Dr. Jaydeep Dalvi', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Urinary Stones';

-- Undescended Testis patients
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Baby Anay A. Shivankar', 'Undescended Testis (Left)', 'None', 'Left Orchidopexy', 'Ultrasound abdomen (locate testis); Hormone levels (if needed)', 'Inj. Cefotaxime (peri-op)', 'Acetaminophen (pain relief)', 'Dr. Thavendra Dihare', 'Dr. Mudassir'
FROM public.diagnoses d WHERE d.name = 'Undescended Testis';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Master Sanidhya H. Nimje', 'Undescended Testis (Right)', 'Inguinal hernia (same side)', 'Right Orchidopexy + Herniotomy', 'Ultrasound groin/scrotum; Routine labs', 'Inj. Ceftriaxone', 'Ibuprofen (pain relief)', 'Dr. Thavendra Dihare', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Undescended Testis';

-- Phimosis/Circumcision patients
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Anshu Korwate', 'Phimosis with meatal stenosis', 'Recurrent balanoposthitis', 'Circumcision + Meatoplasty', 'Urine culture (pre-op); Routine labs', 'Oral Co-Amoxiclav syrup', 'Topical antibiotic ointment; Paracetamol', 'Dr. Sudesh Wankhede', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Phimosis/Circumcision';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Master Advik Gajbhiye', 'Phimosis (with meatal web)', 'None', 'Circumcision + Meatotomy', 'Physical exam (diagnostic); UA analysis', 'Inj. Ceftriaxone (single dose)', 'Ibuprofen (post-op pain)', 'Dr. Mudassir', 'Dr. Mudassir'
FROM public.diagnoses d WHERE d.name = 'Phimosis/Circumcision';

-- Critical Care/ICU patients
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Ms. Ranjita Naharkar', 'Acute Appendicitis (managed non-operatively)', 'Abscess formation (resolved)', 'IV Antibiotics & Supportive Care', 'CT Abdomen (appendiceal abscess); WBC 14k', 'Inj. Piperacillin-Tazobactam', 'IV fluids; Antipyretics', 'N/A', 'Dr. Mudassir'
FROM public.diagnoses d WHERE d.name = 'Critical Care/ICU';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Om Mahale', 'Severe Sepsis (unknown source)', 'Septic shock (ICU)', 'ICU Care, Vasopressors, Ventilation', 'Blood cultures; ABG; Chest X-ray (ARDS)', 'Inj. Meropenem + Vancomycin', 'Noradrenaline infusion; Mechanical ventilation', 'N/A', 'Dr. Mudassir'
FROM public.diagnoses d WHERE d.name = 'Critical Care/ICU';
