
-- First, let's check and update any patients that still have 'None' as complications
-- Assign specific complications to Inguinal Hernia patients
UPDATE public.patients 
SET complications = CASE 
  WHEN name LIKE '%Niyati%' THEN 'Bowel Obstruction'
  WHEN name LIKE '%Rajveer%' THEN 'Incarceration'
  WHEN name LIKE '%Utkarsh%' THEN 'Strangulation'
  WHEN name LIKE '%Deepak%' THEN 'Chronic Pain'
  WHEN name LIKE '%Brijmohan%' THEN 'Bowel Obstruction'
  ELSE 'Bowel Obstruction'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Inguinal Hernia')
  AND (complications = 'None' OR complications IS NULL);

-- Assign specific complications to Hypospadias patients
UPDATE public.patients 
SET complications = CASE 
  WHEN name LIKE '%Shourya%' THEN 'Urethral Stricture'
  WHEN name LIKE '%Shivansh%' THEN 'Fistula Formation'
  WHEN name LIKE '%Sparsh%' THEN 'Meatal Stenosis'
  WHEN name LIKE '%Bhavesh%' THEN 'Chordee Recurrence'
  WHEN name LIKE '%Prajwal%' THEN 'Urethral Stricture'
  WHEN name LIKE '%Aarav%' THEN 'Fistula Formation'
  ELSE 'Urethral Stricture'
END
WHERE diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Hypospadias')
  AND (complications = 'None' OR complications IS NULL);

-- Assign specific complications to other diagnosis categories
UPDATE public.patients 
SET complications = CASE 
  WHEN diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Undescended Testis') THEN 
    CASE WHEN name LIKE '%Anay%' THEN 'Testicular Cancer' ELSE 'Infertility' END
  WHEN diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Varicose Veins') THEN 
    CASE 
      WHEN name LIKE '%Pradumna%' THEN 'Deep Vein Thrombosis'
      WHEN name LIKE '%Suraj%' THEN 'Pulmonary Embolism'
      WHEN name LIKE '%Ajit%' THEN 'Chronic Venous Insufficiency'
      WHEN name LIKE '%Rajkumar%' THEN 'Leg Ulceration'
      ELSE 'Deep Vein Thrombosis'
    END
  WHEN diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Hemorrhoids') THEN 
    CASE 
      WHEN name LIKE '%Ashish%' THEN 'Thrombosis'
      WHEN name LIKE '%Bhanudas%' THEN 'Anal Stricture'
      WHEN name LIKE '%Umadevi%' THEN 'Incontinence'
      ELSE 'Chronic Bleeding/Anemia'
    END
  WHEN diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Urinary Stones') THEN 
    CASE 
      WHEN name LIKE '%Ramprasad%' THEN 'Acute Kidney Injury'
      WHEN name LIKE '%Pankaj%' THEN 'Urosepsis'
      WHEN name LIKE '%Baldeo%' THEN 'Chronic Kidney Disease'
      ELSE 'Ureteral Stricture'
    END
  WHEN diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Phimosis/Circumcision') THEN 
    CASE 
      WHEN name LIKE '%Anshu%' THEN 'Meatal Stenosis'
      WHEN name LIKE '%Advik%' THEN 'Penile Adhesions'
      WHEN name LIKE '%Yugansh%' THEN 'Bleeding/Hematoma'
      ELSE 'Infection'
    END
  WHEN diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Critical Care/ICU') THEN 
    CASE 
      WHEN name LIKE '%Ranjita%' THEN 'Multi-organ Failure'
      WHEN name LIKE '%Om%' THEN 'Septic Shock'
      WHEN name LIKE '%Ajay%' THEN 'ARDS'
      ELSE 'Nosocomial Infections'
    END
  ELSE complications
END
WHERE (complications = 'None' OR complications IS NULL);

-- For any remaining patients with 'None', assign the first complication from their diagnosis category
UPDATE public.patients 
SET complications = CASE 
  WHEN diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Appendicitis') THEN 'Perforation'
  WHEN diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Gallbladder Disease') THEN 'Cholangitis'
  WHEN diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Thyroid Disorders') THEN 'Recurrent Laryngeal Nerve Injury'
  WHEN diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Burn Injuries') THEN 'Multi-organ Failure'
  WHEN diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Chronic Wounds') THEN 'Multi-organ Failure'
  WHEN diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Facial Bone Fractures') THEN 'Multi-organ Failure'
  WHEN diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Testicular Tumor') THEN 'Multi-organ Failure'
  WHEN diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Bladder Neck Obstruction') THEN 'Multi-organ Failure'
  WHEN diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Dialysis') THEN 'Multi-organ Failure'
  WHEN diagnosis_id IN (SELECT id FROM public.diagnoses WHERE name = 'Other Conservative Cases') THEN 'Multi-organ Failure'
  ELSE complications
END
WHERE complications = 'None' OR complications IS NULL;
