-- Add medical data junction tables

-- Create visit_labs table
CREATE TABLE IF NOT EXISTS visit_labs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ordered',
  ordered_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(visit_id, lab_id)
);

-- Create visit_radiology table
CREATE TABLE IF NOT EXISTS visit_radiology (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  radiology_id UUID NOT NULL REFERENCES radiology(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ordered',
  ordered_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(visit_id, radiology_id)
);

-- Create visit_medications table
CREATE TABLE IF NOT EXISTS visit_medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'prescribed',
  prescribed_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(visit_id, medication_id)
);

-- Add RLS policies
ALTER TABLE visit_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_radiology ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_medications ENABLE ROW LEVEL SECURITY;

-- Create policies for visit_labs
CREATE POLICY "Users can view their own visit_labs"
  ON visit_labs FOR SELECT
  USING (
    visit_id IN (
      SELECT id FROM visits
      WHERE patient_id IN (
        SELECT id FROM patients
        WHERE created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert their own visit_labs"
  ON visit_labs FOR INSERT
  WITH CHECK (
    visit_id IN (
      SELECT id FROM visits
      WHERE patient_id IN (
        SELECT id FROM patients
        WHERE created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own visit_labs"
  ON visit_labs FOR UPDATE
  USING (
    visit_id IN (
      SELECT id FROM visits
      WHERE patient_id IN (
        SELECT id FROM patients
        WHERE created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own visit_labs"
  ON visit_labs FOR DELETE
  USING (
    visit_id IN (
      SELECT id FROM visits
      WHERE patient_id IN (
        SELECT id FROM patients
        WHERE created_by = auth.uid()
      )
    )
  );

-- Create policies for visit_radiology
CREATE POLICY "Users can view their own visit_radiology"
  ON visit_radiology FOR SELECT
  USING (
    visit_id IN (
      SELECT id FROM visits
      WHERE patient_id IN (
        SELECT id FROM patients
        WHERE created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert their own visit_radiology"
  ON visit_radiology FOR INSERT
  WITH CHECK (
    visit_id IN (
      SELECT id FROM visits
      WHERE patient_id IN (
        SELECT id FROM patients
        WHERE created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own visit_radiology"
  ON visit_radiology FOR UPDATE
  USING (
    visit_id IN (
      SELECT id FROM visits
      WHERE patient_id IN (
        SELECT id FROM patients
        WHERE created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own visit_radiology"
  ON visit_radiology FOR DELETE
  USING (
    visit_id IN (
      SELECT id FROM visits
      WHERE patient_id IN (
        SELECT id FROM patients
        WHERE created_by = auth.uid()
      )
    )
  );

-- Create policies for visit_medications
CREATE POLICY "Users can view their own visit_medications"
  ON visit_medications FOR SELECT
  USING (
    visit_id IN (
      SELECT id FROM visits
      WHERE patient_id IN (
        SELECT id FROM patients
        WHERE created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert their own visit_medications"
  ON visit_medications FOR INSERT
  WITH CHECK (
    visit_id IN (
      SELECT id FROM visits
      WHERE patient_id IN (
        SELECT id FROM patients
        WHERE created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own visit_medications"
  ON visit_medications FOR UPDATE
  USING (
    visit_id IN (
      SELECT id FROM visits
      WHERE patient_id IN (
        SELECT id FROM patients
        WHERE created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own visit_medications"
  ON visit_medications FOR DELETE
  USING (
    visit_id IN (
      SELECT id FROM visits
      WHERE patient_id IN (
        SELECT id FROM patients
        WHERE created_by = auth.uid()
      )
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visit_labs_visit_id ON visit_labs(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_labs_lab_id ON visit_labs(lab_id);
CREATE INDEX IF NOT EXISTS idx_visit_radiology_visit_id ON visit_radiology(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_radiology_radiology_id ON visit_radiology(radiology_id);
CREATE INDEX IF NOT EXISTS idx_visit_medications_visit_id ON visit_medications(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_medications_medication_id ON visit_medications(medication_id); 