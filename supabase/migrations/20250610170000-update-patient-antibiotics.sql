
-- Update existing patients with high-level, expensive antibiotics
UPDATE patients 
SET antibiotics = CASE 
  WHEN diagnosis_id IN (
    SELECT id FROM diagnoses WHERE name IN ('Inguinal Hernia', 'Appendicitis', 'Gallbladder Disease')
  ) THEN 'Inj. Meropenem + Vancomycin + Colistin'
  
  WHEN diagnosis_id IN (
    SELECT id FROM diagnoses WHERE name IN ('Hypospadias', 'Undescended Testis', 'Phimosis/Circumcision')
  ) THEN 'Inj. Imipenem-Cilastatin + Linezolid'
  
  WHEN diagnosis_id IN (
    SELECT id FROM diagnoses WHERE name IN ('Thyroid Disorders', 'Varicose Veins')
  ) THEN 'Inj. Doripenem + Tigecycline + Polymyxin B'
  
  WHEN diagnosis_id IN (
    SELECT id FROM diagnoses WHERE name IN ('Hemorrhoids', 'Urinary Stones')
  ) THEN 'Inj. Ertapenem + Daptomycin'
  
  WHEN diagnosis_id IN (
    SELECT id FROM diagnoses WHERE name = 'Critical Care/ICU'
  ) THEN 'Inj. Ceftaroline + Teicoplanin'
  
  ELSE 'Inj. Meropenem + Vancomycin + Colistin'
END
WHERE antibiotics IN (
  'Inj. Amoxicillin-Clavulanate',
  'Inj. Ceftriaxone',
  'Inj. Ciprofloxacin',
  'Inj. Metronidazole',
  'Inj. Vancomycin',
  'Inj. Piperacillin-Tazobactam',
  'Inj. Cefazolin',
  'Inj. Gentamicin',
  'Inj. Clindamycin',
  'Inj. Ampicillin-Sulbactam',
  'Tab. Doxycycline',
  'Tab. Azithromycin',
  'Tab. Levofloxacin',
  'Tab. Trimethoprim-Sulfamethoxazole',
  'None'
);

-- Also update other_medications to include high-level, expensive medications
UPDATE patients 
SET other_medications = CASE 
  WHEN diagnosis_id IN (
    SELECT id FROM diagnoses WHERE name IN ('Inguinal Hernia', 'Appendicitis')
  ) THEN 'Inj. Fentanyl + Remifentanil (high-potency analgesics); Tab. Pregabalin + Gabapentin (neuropathic pain)'
  
  WHEN diagnosis_id IN (
    SELECT id FROM diagnoses WHERE name IN ('Hypospadias', 'Undescended Testis', 'Phimosis/Circumcision')
  ) THEN 'Inj. Ketamine + Dexmedetomidine (anesthesia adjuncts); Tab. Oxycodone + Tapentadol (controlled-release opioids)'
  
  WHEN diagnosis_id IN (
    SELECT id FROM diagnoses WHERE name IN ('Gallbladder Disease', 'Thyroid Disorders')
  ) THEN 'Inj. Propofol + Sevoflurane (premium anesthetics); Tab. Duloxetine + Venlafaxine (antidepressants)'
  
  WHEN diagnosis_id IN (
    SELECT id FROM diagnoses WHERE name IN ('Varicose Veins', 'Hemorrhoids')
  ) THEN 'Inj. Octreotide + Lanreotide (somatostatin analogs); Tab. Apixaban + Rivaroxaban (novel anticoagulants)'
  
  WHEN diagnosis_id IN (
    SELECT id FROM diagnoses WHERE name = 'Urinary Stones'
  ) THEN 'Inj. Erythropoietin + Darbepoetin (erythropoiesis stimulants); Tab. Sirolimus + Tacrolimus (immunosuppressants)'
  
  WHEN diagnosis_id IN (
    SELECT id FROM diagnoses WHERE name = 'Critical Care/ICU'
  ) THEN 'Inj. Bevacizumab + Ranibizumab (anti-VEGF agents); Tab. Lenalidomide + Pomalidomide (immunomodulators)'
  
  ELSE 'Inj. Fentanyl + Remifentanil (high-potency analgesics); Tab. Pregabalin + Gabapentin (neuropathic pain)'
END
WHERE other_medications IN (
  'Paracetamol syrup (pain relief)',
  'Ibuprofen (pain relief)',
  'Phenazopyridine (urinary analgesic)',
  'Domperidone (anti-emetic)',
  'Omeprazole (PPI)',
  'Lactulose (laxative)',
  'Diclofenac gel (topical)',
  'Multivitamins',
  'Iron supplements',
  'Calcium supplements',
  'None',
  'As needed (PRN)'
);
