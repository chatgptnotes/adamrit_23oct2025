
-- Add infection-related complications to justify expensive antibiotics
UPDATE patients 
SET complications = CASE 
  -- Inguinal Hernia patients
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Inguinal Hernia') THEN 
    CASE 
      WHEN complications = 'Bowel Obstruction' THEN 'Bowel Obstruction + Post-operative Sepsis'
      WHEN complications = 'Incarceration' THEN 'Incarceration + Wound Infection'
      WHEN complications = 'Strangulation' THEN 'Strangulation + Necrotizing Fasciitis'
      WHEN complications = 'Chronic Pain' THEN 'Chronic Pain + Delayed Wound Healing'
      ELSE complications || ' + Post-operative Infection'
    END
    
  -- Hypospadias patients
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Hypospadias') THEN 
    CASE 
      WHEN complications = 'Urethral Stricture' THEN 'Urethral Stricture + Urinary Tract Infection'
      WHEN complications = 'Fistula Formation' THEN 'Fistula Formation + Persistent Infection'
      WHEN complications = 'Meatal Stenosis' THEN 'Meatal Stenosis + Recurrent UTI'
      WHEN complications = 'Chordee Recurrence' THEN 'Chordee Recurrence + Wound Dehiscence'
      ELSE complications || ' + Post-surgical Infection'
    END
    
  -- Undescended Testis patients
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Undescended Testis') THEN 
    CASE 
      WHEN complications = 'Testicular Cancer' THEN 'Testicular Cancer + Immunocompromised Sepsis'
      WHEN complications = 'Infertility' THEN 'Infertility + Chronic Orchitis'
      WHEN complications = 'Testicular Torsion' THEN 'Testicular Torsion + Necrotic Infection'
      ELSE complications || ' + Scrotal Infection'
    END
    
  -- Appendicitis patients
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Appendicitis') THEN 
    CASE 
      WHEN complications = 'Perforation' THEN 'Perforation + Peritonitis + Septic Shock'
      WHEN complications = 'Abscess Formation' THEN 'Abscess Formation + Multi-drug Resistant Infection'
      WHEN complications = 'Sepsis' THEN 'Sepsis + Multi-organ Failure'
      ELSE complications || ' + Intra-abdominal Sepsis'
    END
    
  -- Gallbladder Disease patients
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Gallbladder Disease') THEN 
    CASE 
      WHEN complications = 'Cholangitis' THEN 'Cholangitis + Bacteremia'
      WHEN complications = 'Pancreatitis' THEN 'Pancreatitis + Infected Necrosis'
      WHEN complications = 'Perforation' THEN 'Perforation + Bile Peritonitis'
      ELSE complications || ' + Ascending Cholangitis'
    END
    
  -- Thyroid Disorders patients
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Thyroid Disorders') THEN 
    CASE 
      WHEN complications = 'Recurrent Laryngeal Nerve Injury' THEN 'Recurrent Laryngeal Nerve Injury + Surgical Site Infection'
      WHEN complications = 'Hypoparathyroidism' THEN 'Hypoparathyroidism + Deep Neck Infection'
      WHEN complications = 'Thyroid Storm' THEN 'Thyroid Storm + Septic Shock'
      ELSE complications || ' + Post-thyroidectomy Infection'
    END
    
  -- Varicose Veins patients
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Varicose Veins') THEN 
    CASE 
      WHEN complications = 'Deep Vein Thrombosis' THEN 'Deep Vein Thrombosis + Cellulitis'
      WHEN complications = 'Pulmonary Embolism' THEN 'Pulmonary Embolism + Septic Emboli'
      WHEN complications = 'Chronic Venous Insufficiency' THEN 'Chronic Venous Insufficiency + Infected Ulcers'
      WHEN complications = 'Leg Ulceration' THEN 'Leg Ulceration + Osteomyelitis'
      ELSE complications || ' + Venous Ulcer Infection'
    END
    
  -- Hemorrhoids patients
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Hemorrhoids') THEN 
    CASE 
      WHEN complications = 'Thrombosis' THEN 'Thrombosis + Perianal Abscess'
      WHEN complications = 'Anal Stricture' THEN 'Anal Stricture + Chronic Fistula Infection'
      WHEN complications = 'Incontinence' THEN 'Incontinence + Recurrent Perianal Sepsis'
      WHEN complications = 'Chronic Bleeding/Anemia' THEN 'Chronic Bleeding/Anemia + Iron Deficiency + Secondary Infection'
      ELSE complications || ' + Perianal Infection'
    END
    
  -- Urinary Stones patients
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Urinary Stones') THEN 
    CASE 
      WHEN complications = 'Acute Kidney Injury' THEN 'Acute Kidney Injury + Urosepsis'
      WHEN complications = 'Urosepsis' THEN 'Urosepsis + Multi-drug Resistant UTI'
      WHEN complications = 'Chronic Kidney Disease' THEN 'Chronic Kidney Disease + Recurrent Pyelonephritis'
      WHEN complications = 'Ureteral Stricture' THEN 'Ureteral Stricture + Obstructive Uropathy + Infection'
      ELSE complications || ' + Complicated UTI'
    END
    
  -- Phimosis/Circumcision patients
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Phimosis/Circumcision') THEN 
    CASE 
      WHEN complications = 'Meatal Stenosis' THEN 'Meatal Stenosis + Balanitis'
      WHEN complications = 'Penile Adhesions' THEN 'Penile Adhesions + Wound Dehiscence'
      WHEN complications = 'Bleeding/Hematoma' THEN 'Bleeding/Hematoma + Secondary Infection'
      WHEN complications = 'Infection' THEN 'Severe Post-circumcision Infection + Cellulitis'
      ELSE complications || ' + Genital Infection'
    END
    
  -- Critical Care/ICU patients
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Critical Care/ICU') THEN 
    CASE 
      WHEN complications = 'Multi-organ Failure' THEN 'Multi-organ Failure + Septic Shock + MRSA Infection'
      WHEN complications = 'Septic Shock' THEN 'Septic Shock + Ventilator-Associated Pneumonia'
      WHEN complications = 'ARDS' THEN 'ARDS + Hospital-Acquired Pneumonia'
      WHEN complications = 'Nosocomial Infections' THEN 'Multiple Nosocomial Infections + Antibiotic Resistance'
      ELSE complications || ' + ICU-Acquired Infection'
    END
    
  -- All other diagnosis categories
  ELSE 
    CASE 
      WHEN complications NOT LIKE '%infection%' AND complications NOT LIKE '%sepsis%' AND complications NOT LIKE '%Infection%' AND complications NOT LIKE '%Sepsis%' 
      THEN complications || ' + Post-operative Infection'
      ELSE complications
    END
END
WHERE complications IS NOT NULL AND complications != 'None';

-- Update any remaining 'None' complications with infection-related issues
UPDATE patients 
SET complications = CASE 
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Inguinal Hernia') THEN 'Post-operative Sepsis'
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Hypospadias') THEN 'Urinary Tract Infection'
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Undescended Testis') THEN 'Scrotal Infection'
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Appendicitis') THEN 'Intra-abdominal Sepsis'
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Gallbladder Disease') THEN 'Ascending Cholangitis'
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Thyroid Disorders') THEN 'Surgical Site Infection'
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Varicose Veins') THEN 'Venous Ulcer Infection'
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Hemorrhoids') THEN 'Perianal Infection'
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Urinary Stones') THEN 'Complicated UTI'
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Phimosis/Circumcision') THEN 'Genital Infection'
  WHEN diagnosis_id IN (SELECT id FROM diagnoses WHERE name = 'Critical Care/ICU') THEN 'ICU-Acquired Infection'
  ELSE 'Post-operative Infection'
END
WHERE complications = 'None' OR complications IS NULL;
