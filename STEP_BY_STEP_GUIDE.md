# Step-by-Step Guide: Save Nested Sub-Tests

## Problem
Nested sub-test name aur details save nahi ho rahe the.

## Solution
Ye step-by-step follow karo:

---

## Step 1: Get Lab ID

Supabase SQL Editor me run karo:

```sql
SELECT id, name FROM lab LIMIT 5;
```

**Result example:**
```
id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
name: Main Lab
```

Copy karo ye `id`.

---

## Step 2: Insert Sub-Test (Level 1)

Replace `YOUR_LAB_ID` with actual lab ID:

```sql
INSERT INTO public.lab_test_config (
    lab_id,
    test_name,
    sub_test_name,
    unit,
    min_age, max_age, age_unit, age_description,
    gender, min_value, max_value, normal_unit,
    parent_config_id, test_level, display_order, is_active
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,  -- Your lab_id
    'CBC',
    'Differential Leukocyte Count',  -- Sub-test name
    'unit',
    0, 100, 'Years', NULL,
    'Both', 0, 0, 'unit',
    NULL,  -- No parent (this is Level 1)
    1,     -- Level 1
    0,
    true
) RETURNING id, sub_test_name, test_level;
```

**Result:**
```
id: b2c3d4e5-f6g7-8901-bcde-fg2345678901
sub_test_name: Differential Leukocyte Count
test_level: 1
```

Copy ye returned `id` - ye parent_id hoga.

---

## Step 3: Insert Nested Sub-Test (Level 2)

Replace:
- `YOUR_LAB_ID` with lab ID
- `PARENT_ID` with ID from Step 2

```sql
INSERT INTO public.lab_test_config (
    lab_id,
    test_name,
    sub_test_name,
    unit,
    min_age, max_age, age_unit, age_description,
    gender, min_value, max_value, normal_unit,
    parent_config_id, test_level, display_order, is_active
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,  -- Your lab_id
    'CBC',
    'Differential Count',  -- NESTED sub-test name
    '%',
    1, 5, 'Years', 'Description',
    'Both', 0, 0, '%',
    'b2c3d4e5-f6g7-8901-bcde-fg2345678901'::uuid,  -- Parent ID from Step 2
    2,     -- Level 2 (NESTED)
    0,
    true
) RETURNING id, sub_test_name, test_level, parent_config_id;
```

**Result:**
```
id: c3d4e5f6-g7h8-9012-cdef-gh3456789012
sub_test_name: Differential Count
test_level: 2
parent_config_id: b2c3d4e5-f6g7-8901-bcde-fg2345678901  ✅ Has parent!
```

---

## Step 4: Verify Data Saved

```sql
SELECT
    REPEAT('  ', test_level - 1) || '└─ ' || sub_test_name as hierarchy,
    test_level,
    parent_config_id,
    unit
FROM public.lab_test_config
WHERE test_name = 'CBC'
  AND lab_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
ORDER BY test_level, display_order;
```

**Expected Output:**
```
hierarchy                            | test_level | parent_config_id | unit
-------------------------------------|------------|------------------|------
└─ Differential Leukocyte Count      | 1          | NULL             | unit
  └─ Differential Count              | 2          | b2c3...          | %
```

---

## Alternative: Automatic Insert (Easiest)

Agar manual steps nahi karne to ye complete query run karo:

```sql
DO $$
DECLARE
    v_lab_id uuid := 'YOUR_LAB_ID'::uuid;  -- Replace
    v_parent_id uuid;
BEGIN
    -- Insert Sub-Test
    INSERT INTO public.lab_test_config (
        lab_id, test_name, sub_test_name, unit,
        min_age, max_age, age_unit, age_description,
        gender, min_value, max_value, normal_unit,
        parent_config_id, test_level, display_order, is_active
    ) VALUES (
        v_lab_id, 'CBC', 'Differential Leukocyte Count', 'unit',
        0, 100, 'Years', NULL,
        'Both', 0, 0, 'unit',
        NULL, 1, 0, true
    ) RETURNING id INTO v_parent_id;

    -- Insert Nested Sub-Test (automatically uses parent_id)
    INSERT INTO public.lab_test_config (
        lab_id, test_name, sub_test_name, unit,
        min_age, max_age, age_unit, age_description,
        gender, min_value, max_value, normal_unit,
        parent_config_id, test_level, display_order, is_active
    ) VALUES (
        v_lab_id, 'CBC', 'Differential Count', '%',
        1, 5, 'Years', 'Description',
        'Both', 0, 0, '%',
        v_parent_id, 2, 0, true  -- Uses parent ID
    );

    RAISE NOTICE 'Success! Parent ID: %', v_parent_id;
END $$;
```

---

## Common Mistakes

❌ **Wrong:**
```sql
parent_config_id: NULL  -- Nested test ka parent NULL nahi ho sakta
test_level: 1           -- Nested test ka level 1 nahi, 2 hona chahiye
```

✅ **Correct:**
```sql
parent_config_id: 'uuid-of-parent'  -- Must have parent UUID
test_level: 2                        -- Level 2 for nested
```

---

## Checking if Saved

```sql
-- Count by level
SELECT
    test_level,
    COUNT(*) as count,
    string_agg(sub_test_name, ', ') as tests
FROM lab_test_config
WHERE test_name = 'CBC'
GROUP BY test_level;
```

**Expected:**
```
test_level | count | tests
-----------|-------|------------------------------------------
1          | 1     | Differential Leukocyte Count
2          | 1     | Differential Count
```

Agar Level 2 me data hai to **nested sub-test successfully saved!** ✅

---

## Files to Use

1. **COMPLETE_WORKING_INSERT.sql** - Complete automated query
2. **SIMPLE_INSERT_WITH_ACTUAL_LAB.sql** - Step-by-step manual
3. **labTestConfigHelper_v2.ts** - TypeScript helper functions

Choose koi bhi ek method aur follow karo!
