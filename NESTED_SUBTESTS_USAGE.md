# Nested Sub-Tests Implementation Guide

## Overview
Is implementation me lab results ko hierarchical structure me save kiya ja sakta hai with unlimited nesting levels.

## Database Schema

### New Columns Added to `lab_results` table:
```sql
parent_test_id UUID          -- Parent test ka reference (NULL for main tests)
test_level INTEGER           -- Hierarchy level: 0=Main, 1=Sub-test, 2=Nested sub-test
sub_test_config JSONB        -- Age ranges, normal ranges, unit configuration
display_order INTEGER        -- Display order under parent
```

### Example Structure:
```
CBC (Main Test) - test_level: 0, parent_test_id: NULL
  ├─ Hemoglobin (Sub-test) - test_level: 1, parent_test_id: <CBC_ID>
  │   ├─ HbA1c (Nested) - test_level: 2, parent_test_id: <Hemoglobin_ID>
  │   └─ HbA2 (Nested) - test_level: 2, parent_test_id: <Hemoglobin_ID>
  ├─ WBC Count (Sub-test) - test_level: 1, parent_test_id: <CBC_ID>
  │   ├─ Neutrophils (Nested) - test_level: 2, parent_test_id: <WBC_ID>
  │   └─ Lymphocytes (Nested) - test_level: 2, parent_test_id: <WBC_ID>
  └─ RBC Count (Sub-test) - test_level: 1, parent_test_id: <CBC_ID>
```

## Usage Example

### 1. UI Component (`TestConfigurationSection.tsx`)
Component already updated with:
- ✅ Nested sub-tests support in SubTest interface
- ✅ Add/Edit/Remove nested sub-tests
- ✅ Age ranges and normal ranges for nested sub-tests
- ✅ Visual hierarchy with blue borders

### 2. Saving Data

```typescript
import { saveTestWithNestedSubTests, SubTest } from '@/utils/labResultsHelper';

// Example: Save CBC with nested sub-tests
const cbcSubTests: SubTest[] = [
  {
    id: 'hb_1',
    name: 'Hemoglobin',
    unit: 'g/dL',
    result_value: '14.5',
    ageRanges: [
      { id: 'ar1', minAge: '18', maxAge: '65', unit: 'Years', description: 'Adult' }
    ],
    normalRanges: [
      { id: 'nr1', ageRange: '18-65 Years', gender: 'Male', minValue: '13', maxValue: '17', unit: 'g/dL' }
    ],
    subTests: [
      {
        id: 'hba1c_1',
        name: 'HbA1c',
        unit: '%',
        result_value: '5.8',
        ageRanges: [],
        normalRanges: [
          { id: 'nr2', ageRange: '18-65 Years', gender: 'Both', minValue: '4', maxValue: '5.6', unit: '%' }
        ]
      }
    ]
  },
  {
    id: 'wbc_1',
    name: 'WBC Count',
    unit: 'cells/μL',
    result_value: '8000',
    ageRanges: [],
    normalRanges: [
      { id: 'nr3', ageRange: '18-65 Years', gender: 'Both', minValue: '4000', maxValue: '11000', unit: 'cells/μL' }
    ]
  }
];

// Save with nested structure
const savedIds = await saveTestWithNestedSubTests(
  {
    mainTestName: 'CBC',
    testName: 'Complete Blood Count',
    testCategory: 'HEMATOLOGY',
    patientName: 'John Doe',
    patientAge: 35,
    patientGender: 'Male',
    visitId: 'visit-uuid-123',
    labId: 'lab-uuid-456',
    resultStatus: 'Preliminary',
    technicianName: 'Dr. Smith',
    authenticatedResult: false
  },
  cbcSubTests,  // Nested sub-tests array
  null,         // No parent (this is main test)
  0             // Level 0 (main test)
);

console.log('Saved test IDs:', savedIds);
```

### 3. Loading Data

```typescript
import { loadTestsWithNestedSubTests } from '@/utils/labResultsHelper';

// Load all tests for a visit with hierarchy
const hierarchicalTests = await loadTestsWithNestedSubTests('visit-uuid-123');

// Result structure:
[
  {
    id: 'test-1',
    test_name: 'Complete Blood Count',
    test_level: 0,
    parent_test_id: null,
    subTests: [
      {
        id: 'test-2',
        test_name: 'Hemoglobin',
        test_level: 1,
        parent_test_id: 'test-1',
        subTests: [
          {
            id: 'test-3',
            test_name: 'HbA1c',
            test_level: 2,
            parent_test_id: 'test-2',
            subTests: []
          }
        ]
      }
    ]
  }
]
```

### 4. Integration in LabOrders Component

Replace the current save logic (around line 1125-1165) with:

```typescript
import { saveTestWithNestedSubTests } from '@/utils/labResultsHelper';

// Inside saveLabResultsMutation
for (const result of resultsData) {
  const originalTestRow = selectedTestsForEntry.find(t =>
    t.id === result.order_id || t.order_id === result.order_id
  );

  if (!originalTestRow) continue;

  // If result has nested sub-tests (from TestConfigurationSection)
  const subTests = result.subTests || [];

  await saveTestWithNestedSubTests(
    {
      mainTestName: originalTestRow.test_name || 'Unknown Test',
      testName: result.test_name || originalTestRow.test_name,
      testCategory: result.test_category || 'GENERAL',
      resultValue: result.result_value,
      resultUnit: result.result_unit,
      referenceRange: result.reference_range,
      comments: result.comments,
      isAbnormal: result.is_abnormal || false,
      resultStatus: authenticatedResult ? 'Final' : 'Preliminary',
      technicianName: result.technician_name || '',
      pathologistName: result.pathologist_name || '',
      authenticatedResult: authenticatedResult || false,
      patientName: originalTestRow.patient_name || 'Unknown Patient',
      patientAge: originalTestRow.patient_age,
      patientGender: originalTestRow.patient_gender,
      visitId: originalTestRow.visit_id,
      labId: originalTestRow.test_id || originalTestRow.lab_id
    },
    subTests, // Pass nested sub-tests
    null,     // No parent for main test
    0         // Level 0
  );
}
```

## Database Helper Functions

### 1. Get Test with All Nested Sub-tests
```sql
SELECT * FROM get_test_with_nested_subtests('test-uuid-123');
```

### 2. Get All Tests for Visit (Hierarchical)
```sql
SELECT * FROM get_visit_lab_results_hierarchical('visit-uuid-123');
```

### 3. View with Tree Structure
```sql
SELECT * FROM lab_results_tree WHERE visit_id = 'visit-uuid-123';
```

## Migration File
Migration file created at:
```
supabase/migrations/20251001000000_add_nested_subtests_support.sql
```

Run migration:
```bash
npx supabase db reset
# OR
npx supabase migration up
```

## Data Flow

1. **UI Input**: User adds nested sub-tests in `TestConfigurationSection.tsx`
2. **Save**: `saveTestWithNestedSubTests()` recursively saves main test → sub-tests → nested sub-tests
3. **Database**: Each level stored with `parent_test_id` and `test_level`
4. **Load**: `loadTestsWithNestedSubTests()` rebuilds hierarchy
5. **Display**: Show in tree view or hierarchical list

## Benefits

✅ **Unlimited Nesting**: Support for any depth of nested sub-tests
✅ **Data Integrity**: Foreign key constraints maintain relationships
✅ **Query Performance**: Indexed columns for fast hierarchical queries
✅ **Recursive Functions**: Database functions for efficient data retrieval
✅ **Backward Compatible**: Existing data (parent_test_id = NULL) works as before

## Notes

- `test_level = 0`: Main test (e.g., CBC)
- `test_level = 1`: Direct sub-test (e.g., Hemoglobin under CBC)
- `test_level = 2`: Nested sub-test (e.g., HbA1c under Hemoglobin)
- `test_level = 3+`: Further nesting levels

- `sub_test_config` stores age ranges, normal ranges as JSONB
- `display_order` maintains order of sub-tests under parent
- Cascade delete: Deleting parent automatically deletes all nested children
