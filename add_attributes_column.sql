-- Add attributes column to lab table for storing category data
ALTER TABLE lab ADD COLUMN attributes JSONB DEFAULT '[]'::jsonb;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_lab_attributes ON lab USING GIN (attributes);

-- Add comment to explain column purpose
COMMENT ON COLUMN lab.attributes IS 'Stores test attributes/categories with normal ranges, formulas, units, and configuration data';

-- Verify column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'lab' AND column_name = 'attributes';

-- Test with sample data
INSERT INTO lab (name, category, attributes) 
VALUES (
  'Test Panel - Category Data',
  'Test Category',
  '[
    {
      "name": "Hemoglobin",
      "type": "Numeric",
      "isMandatory": true,
      "isCategory": false,
      "isDescriptive": false,
      "machineName": "Sysmex XN-1000",
      "multiplyBy": "1",
      "decimalPlaces": "1",
      "isByAge": false,
      "isBySex": true,
      "isByRange": false,
      "hasFormula": false,
      "formulaText": "",
      "normalRange": {
        "male": {"ll": "13", "ul": "17", "default": "15"},
        "female": {"ll": "12", "ul": "16", "default": "14"},
        "child": {"ll": "11", "ul": "13", "default": "12"},
        "ageRanges": [],
        "ranges": []
      },
      "units": "g/dL",
      "sortOrder": "1"
    }
  ]'::jsonb
);

-- Verify test data
SELECT 
  name, 
  attributes->0->>'name' as first_attribute_name,
  attributes->0->>'units' as first_attribute_units,
  jsonb_array_length(attributes) as attribute_count
FROM lab 
WHERE name = 'Test Panel - Category Data'; 