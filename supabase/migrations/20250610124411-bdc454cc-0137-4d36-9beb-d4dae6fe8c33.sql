
-- First, insert the new diagnosis categories that aren't already in the database
INSERT INTO public.diagnoses (name, description) VALUES
('Burn Injuries', 'Burn-related cases and post-burn complications'),
('Chronic Wounds', 'Diabetic foot ulcers and soft tissue infections'),
('Facial Bone Fractures', 'Traumatic facial bone injuries requiring surgical repair'),
('Testicular Tumor', 'Testicular malignancies requiring surgical intervention'),
('Bladder Neck Obstruction', 'BPH and bladder outlet obstruction cases'),
('Dialysis', 'End-stage renal disease requiring dialysis'),
('Other Conservative Cases', 'Medical conditions managed without surgery')
ON CONFLICT (name) DO NOTHING;

-- Insert additional Hypospadias patients
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Master Prajwal Devhare', 'Hypospadias (with meatal stenosis)', 'Mild chordee', 'Hypospadias Repair + Meatotomy + Meatoplasty', 'Ultrasound KUB; Urine routine', 'Inj. Ceftriaxone', 'Phenazopyridine (urinary analgesic)', 'Dr. Sudesh Wankhede', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Hypospadias';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Baby Aarav Patle', 'Hypospadias (distal)', 'None', 'Hypospadias Repair + Meatotomy + Meatoplasty', 'Physical exam (diagnostic); Basic labs', 'Inj. Ceftriaxone', 'Paracetamol syrup (pain relief)', 'Dr. Sudesh Wankhede', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Hypospadias';

-- Insert additional Varicose Veins patients
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Rajkumar Arghode', 'Varicose Veins (L leg)', 'None', 'Varicose Vein Laser Ablation', 'Venous Doppler ultrasound', 'None (no significant risk of infection)', 'NSAIDs (pain relief)', 'Dr. Dinesh Sharma', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Varicose Veins';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Pawan Kurvekar', 'Varicose Veins (L leg)', 'Deep vein reflux', 'Endovenous Laser Ablation', 'Venous Doppler; CT Venography (if needed)', 'Inj. Ceftriaxone', 'Compression bandaging; Aspirin (if advised)', 'Dr. Dinesh Sharma', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Varicose Veins';

-- Insert additional Hemorrhoids patients
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Vinod Kalaskar', 'Hemorrhoids (Grade III)', 'Thrombosed pile', 'Open Hemorrhoidectomy', 'Proctoscopy; Coagulation profile', 'Inj. Augmentin', 'Diclofenac (analgesic); Stool softener', 'Dr. Mudassir', 'Dr. Mudassir'
FROM public.diagnoses d WHERE d.name = 'Hemorrhoids';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Vitthal Hinge', 'Hemorrhoids (Grade II)', 'None', 'Laser Hemorrhoidectomy', 'Proctoscopy', 'Oral Metronidazole (short course)', 'Fiber supplements (psyllium)', 'Dr. Mudassir', 'Dr. Mudassir'
FROM public.diagnoses d WHERE d.name = 'Hemorrhoids';

-- Insert additional Urinary Stones patients
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Shailesh Borkar', 'Ureteric Stone (Lt distal)', 'None', 'URSL (Left) + DJ stent placement', 'Ultrasound KUB; Urine culture', 'Inj. Ciprofloxacin', 'Tamsulosin; Diclofenac (pain relief)', 'Dr. Jaydeep Dalvi', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Urinary Stones';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Ms. Shivani Malik', 'Ureteric Stone (Rt side)', 'None', 'URSL (Right) + DJ stenting', 'Ultrasound KUB; KUB X-ray', 'Inj. Cefuroxime', 'Antispasmodic (Drotaverine); NSAIDs', 'Dr. Jaydeep Dalvi', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Urinary Stones';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Priyanshu Tembhurne', 'Ureteric Stone (Lt side)', 'None', 'URSL (Left) + DJ stenting', 'IVU (IV Urography); Urinalysis', 'Inj. Amikacin + Metronidazole', 'Tamsulosin; Analgesics', 'Dr. Vishal Narkhede', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Urinary Stones';

-- Insert additional Phimosis/Circumcision patients
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Master Yugansh Masram', 'Phimosis (tight foreskin)', 'Local inflammation', 'Circumcision', 'None specific (clinical diagnosis)', 'Oral Cefixime suspension', 'Paracetamol syrup', 'Dr. Mudassir', 'Dr. Mudassir'
FROM public.diagnoses d WHERE d.name = 'Phimosis/Circumcision';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Master Yatharth Gavande', 'Meatal Stenosis (post-circumcision)', 'None', 'Meatoplasty + Re-circumcision', 'Urine flow study; Urinalysis', 'Inj. Ceftriaxone', 'Phenazopyridine (for dysuria); Ibuprofen', 'Dr. Sudesh Wankhede', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Phimosis/Circumcision';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Master Mahir Bagul', 'Meatal Stenosis (post-circumcision)', 'None', 'Meatoplasty + Re-circumcision', 'Urinalysis; Ultrasound KUB (to rule out reflux)', 'Inj. Ceftriaxone', 'Phenazopyridine; Paracetamol', 'Dr. Sudesh Wankhede', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Phimosis/Circumcision';

-- Insert Burn Injuries patients
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Ganesh Pendor', 'Burn Injury (Forearm & Hand)', 'Secondary infection (mild)', 'Burn Wound Dressings (repeated)', 'Wound swab culture; CBC (WBC elevated)', 'Inj. Ceftriaxone (5 days)', 'Silver sulfadiazine cream (topical); IV fluids', 'Dr. Sudesh Wankhede', 'Dr. Mudassir'
FROM public.diagnoses d WHERE d.name = 'Burn Injuries';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Sumit Asutkar', 'Post-Burn Contracture (Right index finger)', 'Functional limitation', 'Contracture Release Surgery (Z-plasty)', 'X-ray hand (check bone); None other', 'Inj. Ampicillin-Sulbactam', 'Physiotherapy (post-op exercises); Analgesics', 'Dr. Sudesh Wankhede', 'Dr. Mudassir'
FROM public.diagnoses d WHERE d.name = 'Burn Injuries';

-- Insert Chronic Wounds patients
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Arun Patne', 'Diabetic Foot Ulcer (Rt foot)', 'Osteomyelitis (toe bones)', 'Debridement + Split-Thickness Skin Graft', 'Foot X-ray (bone infection); Wound culture', 'Inj. Piperacillin-Tazobactam + Metronidazole', 'Insulin therapy (for diabetes control); Multivitamins', 'Dr. Sudesh Wankhede', 'Dr. Mudassir'
FROM public.diagnoses d WHERE d.name = 'Chronic Wounds';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Satish Bharatpure', 'Traumatic Leg Wound (Right leg)', 'Soft tissue loss', 'Rotational Flap Closure (leg)', 'Doppler for leg vessels; Wound culture', 'Inj. Ceftriaxone', 'Tetanus toxoid; Analgesics', 'Dr. Sudesh Wankhede', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Chronic Wounds';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Ms. Karuna Gorkhede', 'Necrotizing Fasciitis (Left leg)', 'Sepsis (resolved)', 'Surgical Debridement (multiple sessions)', 'CBC (WBC 18k); CRP high; MRI leg (extent of necrosis)', 'Inj. Meropenem + Clindamycin', 'Vasopressors (ICU, brief); IV fluids', 'Dr. Murali', 'Dr. Mudassir'
FROM public.diagnoses d WHERE d.name = 'Chronic Wounds';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Ritik D. Somkuwar', 'Compartment Syndrome (Rt leg post-trauma)', 'Muscle necrosis', 'Fasciotomy + Debridement', 'Compartment pressure measurement; CK levels', 'Inj. Cefoperazone-Sulbactam', 'IV fluids; Pain management (morphine)', 'Dr. P. A. Sadawarte', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Chronic Wounds';

-- Insert Facial Bone Fractures patients
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Prakash Patel', 'Zygomaticomaxillary Complex Fracture (Facial fracture)', 'Facial swelling', 'ORIF with Plating (Facial bones)', 'Facial CT scan; X-ray mandible', 'Inj. Augmentin', 'Dexamethasone (reduce edema); Painkillers', 'Dr. Sudesh Wankhede', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Facial Bone Fractures';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Deepchand Madavi', 'Mandible Fracture', 'None', 'ORIF with Plating (Jaw fracture)', 'X-ray OPG (jaw); Facial CT', 'Inj. Cefuroxime', 'Chlorhexidine mouthwash (oral hygiene); NSAIDs', 'Dr. Sudesh Wankhede', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Facial Bone Fractures';

-- Insert Testicular Tumor patient
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Kailash Jha', 'Right Testicular Tumor (suspected seminoma)', 'None (localized)', 'Radical Orchiectomy (Right)', 'Scrotal Ultrasound; Tumor markers (AFP, β-hCG)', 'Inj. Ceftriaxone', 'Anti-emetics; Plan: Oncology referral for chemo', 'Dr. Jaydeep Dalvi', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Testicular Tumor';

-- Insert Bladder Neck Obstruction patient
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Divakar Bobade', 'Bladder Neck Obstruction (BPH)', 'Urinary retention', 'Cystoscopy + Bladder Neck Incision + Urethral Dilatation', 'Ultrasound prostate (enlarged); PSA normal; Uroflowmetry', 'Tab. Nitrofurantoin (post-op prophylaxis)', 'Tamsulosin (alpha-blocker); Finasteride (for BPH)', 'Dr. Vishal Narkhede (Urologist)', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Bladder Neck Obstruction';

-- Insert Dialysis patient
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Mumtaz Ahmad', 'End-Stage Renal Disease (on Dialysis)', 'Anemia; Hyperkalemia', 'Hemodialysis (repeated sessions)', 'Serum Creatinine (9.5); K+ 6.0 mEq/L; Ultrasound KUB (shrunken kidneys)', 'Inj. Meropenem (for intercurrent infection)', 'Erythropoietin injections; Diet modifications (low potassium)', 'N/A (no surgeon)', 'Dr. Wankhede (Physician)'
FROM public.diagnoses d WHERE d.name = 'Dialysis';

-- Insert additional Critical Care/ICU patients
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Ajay Singh', 'COVID-19 Pneumonia (critical)', 'ARDS', 'ICU Care, Oxygen/Ventilator', 'Chest CT (bilateral pneumonia); ABG', 'Inj. Remdesivir + Piperacillin-Tazo', 'Dexamethasone; High-flow O2 therapy', 'N/A', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Critical Care/ICU';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Kamlesh Bhanarkar', 'Dengue Hemorrhagic Fever (ICU)', 'Shock; Bleeding', 'ICU Support, Fluids, Transfusion', 'Platelet count (15k); Dengue serology', 'No antibiotics (viral)', 'IV fluids; Blood transfusions; Vasopressors', 'N/A', 'Dr. Ishan Ghuse'
FROM public.diagnoses d WHERE d.name = 'Critical Care/ICU';

-- Insert Other Conservative Cases patients
INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mr. Deshraj Gendlal', 'Partial Small Bowel Obstruction (adhesions)', 'Dehydration', 'Nasogastric decompression; IV fluids (resolved)', 'Abdominal X-ray (air-fluid levels); Electrolytes', 'None (no infection)', 'IV fluids; Prokinetics (metoclopramide)', 'N/A', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Other Conservative Cases';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Mrs. Smita Meshram', 'Appendiceal Mass (abscess)', 'Low-grade sepsis', 'IV antibiotics; Observation (interval appendectomy planned)', 'CT Abdomen (peri-appendiceal abscess); WBC 12k', 'Inj. Ceftriaxone + Metronidazole', 'Antipyretics; Pain management', 'N/A', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Other Conservative Cases';

INSERT INTO public.patients (diagnosis_id, name, primary_diagnosis, complications, surgery, labs_radiology, antibiotics, other_medications, surgeon, consultant) 
SELECT d.id, 'Ms. Chaitali Meshram', 'Abdominal Tuberculosis (suspected)', 'Malnutrition', 'Anti-tubercular Therapy (ATT); Nutrition support', 'Ultrasound abdomen; Mantoux test positive', 'Inj. Streptomycin (initial)', 'RIPE therapy (Rifampin, Isoniazid, etc.); Nutritional support', 'N/A', 'Dr. Akshay Akulwar'
FROM public.diagnoses d WHERE d.name = 'Other Conservative Cases';
