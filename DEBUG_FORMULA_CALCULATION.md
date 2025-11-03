# Debug Guide: Formula Auto-Calculation Not Working

## Problem
Values enter karne ke baad bhi "Mean Cell Volume", "Mean Cell Haemoglobin", aur "Mean Cell He.Concentration" boxes mein calculated values nahi aa rahe.

## Debugging Steps

### Step 1: Browser Console Open Karein
1. Press `F12` ya Right Click → "Inspect"
2. "Console" tab pe jaayein
3. Console clear karein: Click "Clear console" button ya press `Ctrl + L`

### Step 2: Test Select Karein aur Console Check Karein

Jab aap "CBC(Complete Blood Count)" select karenge, console mein yeh dikh na chahiye:

```
📦 SubTests updated: 12 tests
🔍 Checking for formulas:
  0. ⚪ "Haemoglobin" - no formula
  1. ⚪ "Total Leukocyte Count" - no formula
  2. ⚪ "Red Cell Count" - no formula
  3. ⚪ "Packed Cell Volume" - no formula
  4. ✅ "Mean Cell Volume" has formula: (Packed Cell Volume/Red Cell Count*10)
  5. ✅ "Mean Cell Haemoglobin" has formula: (Haemoglobin*1)
  6. ✅ "Mean Cell He.Concentration" has formula: (Haemoglobin*100/Packed Cell Volume)
```

### ✅ Expected Output:
- Formulas ke saath **✅ green checkmark** hona chahiye
- Formula text clearly visible hona chahiye

### ❌ If Formulas NOT Showing:
```
📦 SubTests updated: 12 tests
🔍 Checking for formulas:
  0. ⚪ "Haemoglobin" - no formula
  ...
  4. ⚪ "Mean Cell Volume" - no formula  ❌
  5. ⚪ "Mean Cell Haemoglobin" - no formula  ❌
```

**Problem:** Formulas database se load nahi ho rahe!

**Solution:**
1. Check `lab_test_formulas` table mein data hai ya nahi
2. Test name exactly match hona chahiye: `"CBC(Complete Blood Count)"`

### Step 3: Value Enter Karein aur Console Dekhen

Jab aap values enter karenge (e.g., Haemoglobin: 4), console mein DETAILED logging dikhni chahiye:

```
🧮 Starting formula calculations...
📋 Test Results: [
  { name: "Haemoglobin", value: "4" },
  { name: "Red Cell Count", value: "4" },
  { name: "Packed Cell Volume", value: "4" },
  { name: "Mean Cell Volume", value: "" },
  ...
]
📋 SubTests with formulas: [
  { name: "Mean Cell Volume", formula: "(Packed Cell Volume/Red Cell Count*10)" },
  ...
]
  📍 Stored value for "Haemoglobin" (index 0): 4
  📍 Stored value for "Red Cell Count" (index 2): 4
  📍 Stored value for "Packed Cell Volume" (index 3): 4

📐 Processing formula for "Mean Cell Volume" (index 4):
   Formula: (Packed Cell Volume/Red Cell Count*10)
  ✅ Found "Packed Cell Volume" in formula (1 times), replacing with 4
  ✅ Found "Red Cell Count" in formula (1 times), replacing with 4
  📝 Replacements made: 2
  📝 Formula after replacements: (4/4*10)
  🔢 Sanitized formula: (4/4*10)
  ✅ Formula calculated: (Packed Cell Volume/Red Cell Count*10) = 10.00
  ✅ Updating result at index 4
```

### ✅ Success Indicators:
1. **Test Results show entered values** ✅
2. **SubTests with formulas shows formulas** ✅
3. **Values stored** (`📍 Stored value for...`) ✅
4. **Formula processing starts** (`📐 Processing formula for...`) ✅
5. **Replacements found** (`✅ Found "..." in formula`) ✅
6. **Formula calculated** (`✅ Formula calculated: ... = ...`) ✅
7. **Result updated** (`✅ Updating result at index...`) ✅

### ❌ Common Issues & Solutions

#### Issue 1: No Formulas Loaded
```
📦 SubTests updated: 12 tests
🔍 Checking for formulas:
  (all showing ⚪ no formula)
```

**Solution:**
```sql
-- Check if formulas exist in database
SELECT * FROM lab_test_formulas
WHERE test_name = 'CBC(Complete Blood Count)';
```

If empty, run:
```sql
INSERT INTO lab_test_formulas (lab_id, test_name, sub_test_name, formula)
VALUES
  ('your-lab-id', 'CBC(Complete Blood Count)', 'Mean Cell Volume', '(Packed Cell Volume/Red Cell Count*10)'),
  ('your-lab-id', 'CBC(Complete Blood Count)', 'Mean Cell Haemoglobin', '(Haemoglobin*1)');
```

#### Issue 2: Formula Not Matching Test Names
```
📐 Processing formula for "Mean Cell Volume":
   Formula: (Packed Cell Volume/Red Cell Count*10)
  ⏸️ No replacements made - formula values not entered yet
```

**Reason:** Test name in formula doesn't match test name in results

**Check:**
1. Console में "Test Results" देखें - exact names kya hain?
2. Formula में वही exact names होने चाहिए

**Example:**
- If result shows `"Red Cell Count"` (with space)
- Formula should have `"Red Cell Count"` (exact match)
- NOT `"RedCellCount"` or `"red cell count"` ❌

#### Issue 3: Partial Replacements
```
📐 Processing formula for "Mean Cell Volume":
   Formula: (Packed Cell Volume/Red Cell Count*10)
  ✅ Found "Packed Cell Volume" in formula, replacing with 4
  📝 Replacements made: 1
  ⚠️ Formula still has unresolved names: (4/Red Cell Count*10)
  ⏸️ Skipping calculation - not all values available
```

**Reason:** "Red Cell Count" value missing or not entered yet

**Solution:**
1. Enter ALL required values for the formula
2. Check if test name exactly matches

#### Issue 4: Index Mismatch
```
✅ Formula calculated: ... = 10.00
⚠️ Could not find result index for "Mean Cell Volume"
```

**Reason:** Test name in subTests doesn't match test name in results

**Solution:**
- Browser refresh: `Ctrl + Shift + R`
- Re-select the test

#### Issue 5: Calculation Error
```
❌ Error calculating formula for Mean Cell Volume: SyntaxError: ...
```

**Reason:** Invalid formula syntax

**Check:**
```sql
SELECT formula FROM lab_test_formulas
WHERE sub_test_name = 'Mean Cell Volume';
```

Fix formula syntax (use proper operators: +, -, *, /, ())

## Quick Checklist

- [ ] Browser console open hai?
- [ ] Formulas console mein show ho rahe hain? (✅ marks)
- [ ] Values enter karne pe console mein calculations dikhayi de rahe hain?
- [ ] "Replacements made" > 0 hai?
- [ ] "Formula calculated" message aa raha hai?
- [ ] "Updating result at index" message aa raha hai?

## Testing with Sample Data

### Test Case: Mean Cell Volume

1. **Select:** CBC(Complete Blood Count)
2. **Check Console:** Formula dikh na chahiye
3. **Enter Values:**
   - Packed Cell Volume: `45`
   - Red Cell Count: `5`
4. **Expected Console Output:**
   ```
   ✅ Found "Packed Cell Volume" in formula, replacing with 45
   ✅ Found "Red Cell Count" in formula, replacing with 5
   ✅ Formula calculated: (Packed Cell Volume/Red Cell Count*10) = 90.00
   ✅ Updating result at index 4
   ```
5. **Expected Result:** Mean Cell Volume box mein `90.00` automatically aa gaya! ✅

## If Still Not Working

### Share Console Output:
1. Right click in console
2. Select "Save as..."
3. Save as `console-log.txt`
4. Check these specific messages:
   - `📦 SubTests updated:`
   - `🔍 Checking for formulas:`
   - `🧮 Starting formula calculations...`
   - `📐 Processing formula for...`

### Check Database:
```sql
-- 1. Check if test exists
SELECT test_name FROM lab_test_config
WHERE test_name LIKE '%CBC%';

-- 2. Check if formulas exist
SELECT * FROM lab_test_formulas
WHERE test_name LIKE '%CBC%';

-- 3. Check sub_test_names match
SELECT DISTINCT sub_test_name FROM lab_test_config
WHERE test_name = 'CBC(Complete Blood Count)'
ORDER BY sub_test_name;

SELECT DISTINCT sub_test_name FROM lab_test_formulas
WHERE test_name = 'CBC(Complete Blood Count)'
ORDER BY sub_test_name;
```

Names should **exactly match**!

## Summary

अगर formulas काम नहीं कर रहे:
1. ✅ Console में detailed logs check करें
2. ✅ Formulas load ho rahe hain ya nahi dekhen
3. ✅ Test names exact match kar rahe hain ya nahi verify करें
4. ✅ Values enter karne pe calculations trigger ho rahe hain ya nahi check करें
5. ✅ Database में formulas properly save hain ya nahi verify करें

**Ab console mein BAHUT detailed logging hai - easily debug kar sakte hain!** 🔍
