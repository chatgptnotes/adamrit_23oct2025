-- Maharashtra Yojana (MJPJY / Ayushman Bharat) Tariff Master
-- Separate from CGHS tariff - this is the state government scheme tariff for Maharashtra

-- 1. Main Procedures table
CREATE TABLE IF NOT EXISTS yojana_mh_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_code TEXT NOT NULL,
  specialty TEXT,
  specialty_code TEXT,
  package_code TEXT,
  package_name TEXT,
  procedure_name TEXT,
  tier3_rate NUMERIC(12,2) DEFAULT 0,
  implant_criteria TEXT DEFAULT 'N',
  stratification_criteria TEXT DEFAULT 'N',
  multiple_procedures TEXT DEFAULT 'No',
  special_conditions TEXT DEFAULT 'N',
  reservation_public TEXT DEFAULT 'N',
  reservation_tertiary TEXT DEFAULT 'No',
  level_of_care TEXT,
  los TEXT,
  auto_approved TEXT DEFAULT 'N',
  mandatory_docs_preauth TEXT,
  mandatory_docs_claim TEXT,
  procedure_label TEXT,
  special_condition_popup TEXT DEFAULT 'N',
  special_conditions_rule TEXT DEFAULT 'N',
  enhancement_applicable TEXT DEFAULT 'N',
  medical_or_surgical TEXT,
  day_care_procedure TEXT DEFAULT 'N',
  reserved_procedure TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yojana_mh_procedures_code ON yojana_mh_procedures(procedure_code);
CREATE INDEX IF NOT EXISTS idx_yojana_mh_procedures_specialty ON yojana_mh_procedures(specialty_code);
CREATE INDEX IF NOT EXISTS idx_yojana_mh_procedures_package ON yojana_mh_procedures(package_code);

-- 2. Implant Master
CREATE TABLE IF NOT EXISTS yojana_mh_implants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  implant_code TEXT NOT NULL,
  specialty TEXT,
  implant_name TEXT,
  procedure_code TEXT,
  max_multiplier TEXT,
  implant_price TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yojana_mh_implants_code ON yojana_mh_implants(implant_code);

-- 3. Implant vs Procedure mapping
CREATE TABLE IF NOT EXISTS yojana_mh_implant_procedure_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  implant_code TEXT NOT NULL,
  procedure_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yojana_mh_imp_proc_implant ON yojana_mh_implant_procedure_map(implant_code);
CREATE INDEX IF NOT EXISTS idx_yojana_mh_imp_proc_procedure ON yojana_mh_implant_procedure_map(procedure_code);

-- 4. Stratification Master
CREATE TABLE IF NOT EXISTS yojana_mh_stratification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stratification_code TEXT NOT NULL,
  stratification_options TEXT,
  rule TEXT,
  stratification_detail_code TEXT,
  stratification_details TEXT,
  stratification_detail_options TEXT,
  override_procedure_price TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yojana_mh_strat_code ON yojana_mh_stratification(stratification_code);

-- 5. Stratification vs Procedure mapping
CREATE TABLE IF NOT EXISTS yojana_mh_stratification_procedure_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_code TEXT NOT NULL,
  stratification_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Special Condition Rules
CREATE TABLE IF NOT EXISTS yojana_mh_special_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_code TEXT NOT NULL,
  rule_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Add-On to Primary mapping
CREATE TABLE IF NOT EXISTS yojana_mh_addon_primary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_procedure_code TEXT NOT NULL,
  primary_procedure_code TEXT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yojana_mh_addon_addon ON yojana_mh_addon_primary(addon_procedure_code);
CREATE INDEX IF NOT EXISTS idx_yojana_mh_addon_primary ON yojana_mh_addon_primary(primary_procedure_code);

-- 8. Add-On Specialty mapping
CREATE TABLE IF NOT EXISTS yojana_mh_addon_specialty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_code TEXT NOT NULL,
  specialty_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Special Condition Pop-Up mapping
CREATE TABLE IF NOT EXISTS yojana_mh_popup_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_code TEXT NOT NULL,
  popup_description TEXT,
  stage TEXT,
  step TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Follow-Up to Procedure mapping
CREATE TABLE IF NOT EXISTS yojana_mh_followup_procedure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_code TEXT NOT NULL,
  followup_code TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Investigation Master
CREATE TABLE IF NOT EXISTS yojana_mh_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_code TEXT NOT NULL,
  investigation_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yojana_mh_inv_code ON yojana_mh_investigations(investigation_code);

-- 12. Investigation vs Procedure mapping
CREATE TABLE IF NOT EXISTS yojana_mh_investigation_procedure_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_code TEXT,
  procedure_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE yojana_mh_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE yojana_mh_implants ENABLE ROW LEVEL SECURITY;
ALTER TABLE yojana_mh_implant_procedure_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE yojana_mh_stratification ENABLE ROW LEVEL SECURITY;
ALTER TABLE yojana_mh_stratification_procedure_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE yojana_mh_special_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yojana_mh_addon_primary ENABLE ROW LEVEL SECURITY;
ALTER TABLE yojana_mh_addon_specialty ENABLE ROW LEVEL SECURITY;
ALTER TABLE yojana_mh_popup_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yojana_mh_followup_procedure ENABLE ROW LEVEL SECURITY;
ALTER TABLE yojana_mh_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE yojana_mh_investigation_procedure_map ENABLE ROW LEVEL SECURITY;

-- Allow all operations (same pattern as other tables)
-- Drop existing policies first to avoid "already exists" errors
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all on yojana_mh_procedures" ON yojana_mh_procedures;
  DROP POLICY IF EXISTS "Allow all on yojana_mh_implants" ON yojana_mh_implants;
  DROP POLICY IF EXISTS "Allow all on yojana_mh_implant_procedure_map" ON yojana_mh_implant_procedure_map;
  DROP POLICY IF EXISTS "Allow all on yojana_mh_stratification" ON yojana_mh_stratification;
  DROP POLICY IF EXISTS "Allow all on yojana_mh_stratification_procedure_map" ON yojana_mh_stratification_procedure_map;
  DROP POLICY IF EXISTS "Allow all on yojana_mh_special_conditions" ON yojana_mh_special_conditions;
  DROP POLICY IF EXISTS "Allow all on yojana_mh_addon_primary" ON yojana_mh_addon_primary;
  DROP POLICY IF EXISTS "Allow all on yojana_mh_addon_specialty" ON yojana_mh_addon_specialty;
  DROP POLICY IF EXISTS "Allow all on yojana_mh_popup_conditions" ON yojana_mh_popup_conditions;
  DROP POLICY IF EXISTS "Allow all on yojana_mh_followup_procedure" ON yojana_mh_followup_procedure;
  DROP POLICY IF EXISTS "Allow all on yojana_mh_investigations" ON yojana_mh_investigations;
  DROP POLICY IF EXISTS "Allow all on yojana_mh_investigation_procedure_map" ON yojana_mh_investigation_procedure_map;
END $$;

CREATE POLICY "Allow all on yojana_mh_procedures" ON yojana_mh_procedures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on yojana_mh_implants" ON yojana_mh_implants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on yojana_mh_implant_procedure_map" ON yojana_mh_implant_procedure_map FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on yojana_mh_stratification" ON yojana_mh_stratification FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on yojana_mh_stratification_procedure_map" ON yojana_mh_stratification_procedure_map FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on yojana_mh_special_conditions" ON yojana_mh_special_conditions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on yojana_mh_addon_primary" ON yojana_mh_addon_primary FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on yojana_mh_addon_specialty" ON yojana_mh_addon_specialty FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on yojana_mh_popup_conditions" ON yojana_mh_popup_conditions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on yojana_mh_followup_procedure" ON yojana_mh_followup_procedure FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on yojana_mh_investigations" ON yojana_mh_investigations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on yojana_mh_investigation_procedure_map" ON yojana_mh_investigation_procedure_map FOR ALL USING (true) WITH CHECK (true);
