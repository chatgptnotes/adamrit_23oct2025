-- CORRECT Lab Test Config Table Structure
-- This structure supports:
-- 1. Multiple age ranges per sub-test
-- 2. Multiple normal ranges per sub-test (gender-specific)
-- 3. Nested sub-tests with their own age and normal ranges
-- 4. Everything in a single row (no separate rows for nested tests)

CREATE TABLE public.lab_test_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL,
  test_name text NOT NULL,
  sub_test_name text NOT NULL,
  unit text NULL,

  -- Backward compatibility fields (stores first age range and normal range)
  min_age integer NOT NULL DEFAULT 0,
  max_age integer NOT NULL DEFAULT 100,
  age_unit text NOT NULL DEFAULT 'Years'::text,
  age_description text NULL,
  gender text NOT NULL DEFAULT 'Both'::text,
  min_value numeric(10, 2) NOT NULL DEFAULT 0,
  max_value numeric(10, 2) NOT NULL DEFAULT 0,
  normal_unit text NULL,

  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  -- Metadata
  test_level integer NOT NULL DEFAULT 1,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,

  -- JSONB columns for flexible data (MAIN STRUCTURE)
  age_ranges jsonb NULL DEFAULT '[]'::jsonb,
  normal_ranges jsonb NULL DEFAULT '[]'::jsonb,
  nested_sub_tests jsonb NULL DEFAULT '[]'::jsonb,

  -- Constraints
  CONSTRAINT lab_test_config_pkey PRIMARY KEY (id),
  CONSTRAINT fk_lab FOREIGN KEY (lab_id) REFERENCES lab (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lab_test_config_test_level
  ON public.lab_test_config USING btree (test_level) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_lab_test_config_display_order
  ON public.lab_test_config USING btree (display_order) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_lab_test_config_lab_id_test_name
  ON public.lab_test_config USING btree (lab_id, test_name) TABLESPACE pg_default;

-- GIN indexes for JSONB columns (for fast querying)
CREATE INDEX IF NOT EXISTS idx_lab_test_config_age_ranges
  ON public.lab_test_config USING gin (age_ranges) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_lab_test_config_normal_ranges
  ON public.lab_test_config USING gin (normal_ranges) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_lab_test_config_nested_sub_tests
  ON public.lab_test_config USING gin (nested_sub_tests) TABLESPACE pg_default;

-- Comments explaining the JSONB structure
COMMENT ON COLUMN public.lab_test_config.age_ranges IS
'Array of age ranges for this sub-test.
Structure: [
  {
    "min_age": 0,
    "max_age": 5,
    "unit": "Years",
    "description": "Infant",
    "gender": "Both"
  },
  ...
]';

COMMENT ON COLUMN public.lab_test_config.normal_ranges IS
'Array of normal value ranges for this sub-test (can be age and gender specific).
Structure: [
  {
    "age_range": "0-5 Years",
    "gender": "Male",
    "min_value": 12.0,
    "max_value": 16.0,
    "unit": "g/dL"
  },
  ...
]';

COMMENT ON COLUMN public.lab_test_config.nested_sub_tests IS
'Array of nested sub-tests with their own age and normal ranges.
Structure: [
  {
    "name": "Eosinophils",
    "unit": "%",
    "age_ranges": [
      {
        "min_age": 1,
        "max_age": 5,
        "unit": "Years",
        "description": "Child",
        "gender": "Both"
      }
    ],
    "normal_ranges": [
      {
        "age_range": "1-5 Years",
        "gender": "Both",
        "min_value": 4.0,
        "max_value": 6.0,
        "unit": "%"
      }
    ]
  },
  ...
]';
