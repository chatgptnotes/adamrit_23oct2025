# Complete Testing Guide - Formula Auto-Calculation

## ✅ System Overview

### Flow Chart:
```
Database (lab_test_formulas table)
    ↓ (Load formulas)
useLabTestConfig Hook
    ↓ (Fetch with formulas)
EnhancedLabResultsForm Component
    ↓ (Display tests)
User enters observed value
    ↓ (Auto-calculate)
Calculated value shows in formula field
```

## 📊 Current Implementation Status

### ✅ What's Already Working:

1. **Database has formulas** ✅
   ```
   Table: lab_test_formulas
   - Mean Cell Volume = (Packed Cell Volume/Red Cell Count*10)
   - Mean Cell Haemoglobin = (Haemoglobin*1)
   - Mean Cell He.Concentration = (Haemoglobin*100/Packed Cell Volume)
   ```

2. **Hook loads formulas** ✅
   ```typescript
   // src/hooks/useLabTestConfig.ts (Lines 80-105)
   const { data: formulasData } = await supabase
     .from('lab_test_formulas')
     .select('*')
     .eq('test_name', testName);
   ```

3. **SubTest interface includes formula** ✅
   ```typescript
   export interface SubTest {
     formula?: string | null;
     test_type?: string;
     text_value?: string | null;
   }
   ```

4. **Entry form calculates automatically** ✅
   ```typescript
   const handleValueChange = (index: number, value: string) => {
     // ... update value ...
     updatedResults = calculateFormulaValues(updatedResults);
     setTestResults(updatedResults);
   };
   ```

## 🧪 Complete Testing Procedure

### Step 1: Verify Database Formulas

**Open Supabase SQL Editor and run:**
```sql
SELECT
  test_name,
  sub_test_name,
  formula,
  test_type
FROM lab_test_formulas
WHERE test_name = 'CBC(Complete Blood Count)'
ORDER BY sub_test_name;
```

**Expected Output:**
```
test_name                  | sub_test_name              | formula
---------------------------|----------------------------|---------------------------
CBC(Complete Blood Count)  | Mean Cell Volume           | (Packed Cell Volume/Red Cell Count*10)
CBC(Complete Blood Count)  | Mean Cell Haemoglobin      | (Haemoglobin*1)
CBC(Complete Blood Count)  | Mean Cell He.Concentration | (Haemoglobin*100/Packed Cell Volume)
```

✅ **If formulas show:** Database is correct!
❌ **If empty/NULL:** Need to insert formulas

### Step 2: Open Application & Check Console

1. **Open Application:** `http://localhost:8080/lab` (or your URL)
2. **Open Browser Console:** Press `F12` → Console tab
3. **Clear Console:** Click trash icon or `Ctrl + L`

### Step 3: Select Test

**Action:** Select "CBC(Complete Blood Count)" from dropdown

**Expected Console Output:**
```
🔍 Fetching sub-tests for: CBC(Complete Blood Count)
✅ Fetched sub-tests data: [...]
✅ Fetched formulas data: [
  {
    sub_test_name: "Mean Cell Volume",
    formula: "(Packed Cell Volume/Red Cell Count*10)"
  },
  ...
]
📦 SubTests updated: 12 tests
🔍 Checking for formulas:
  0. ⚪ "Haemoglobin" - no formula
  1. ⚪ "Total Leukocyte Count" - no formula
  ...
  9. ✅ "Mean Cell Volume" has formula: (Packed Cell Volume/Red Cell Count*10)
  10. ✅ "Mean Cell Haemoglobin" has formula: (Haemoglobin*1)
  11. ✅ "Mean Cell He.Concentration" has formula: (Haemoglobin*100/Packed Cell Volume)
```

**Verification:**
- ✅ Should see **"✅ Fetched formulas data"**
- ✅ Should see **green checkmarks (✅)** for tests with formulas
- ✅ Formula text should be complete and readable

❌ **If formulas NOT showing:**
```
Problem: Formulas not loading from database
Solutions:
1. Check database has formulas (Step 1)
2. Check test_name matches exactly: "CBC(Complete Blood Count)"
3. Refresh browser: Ctrl + Shift + R
```

### Step 4: Enter Values and Test Calculation

**Test Case 1: Enter First Value**

**Action:** Enter "Haemoglobin" = `15`

**Expected Console:**
```
🧮 Starting formula calculations...
  📍 Stored value for "Haemoglobin" (index 0): 15

📐 Processing formula for "Mean Cell Haemoglobin":
   Formula: (Haemoglobin*1)
  ✅ Found "Haemoglobin" in formula (1 times), replacing with 15
  📝 Replacements made: 1
  🔢 Sanitized formula: (15*1)
  ✅ Formula calculated: (Haemoglobin*1) = 15.00
  ✅ Updating result at index 10

📐 Processing formula for "Mean Cell He.Concentration":
   Formula: (Haemoglobin*100/Packed Cell Volume)
  ✅ Found "Haemoglobin" in formula, replacing with 15
  ⚠️ "Packed Cell Volume" in formula - value not entered yet
  ⏸️ Skipping calculation - not all values available
```

**Expected UI:**
- Mean Cell Haemoglobin box: `15.00` ✅
- Mean Cell He.Concentration box: empty (waiting for Packed Cell Volume)

**Test Case 2: Enter Second Value**

**Action:** Enter "Packed Cell Volume" = `45`

**Expected Console:**
```
🧮 Starting formula calculations...
  📍 Stored value for "Haemoglobin": 15
  📍 Stored value for "Packed Cell Volume": 45

📐 Processing formula for "Mean Cell He.Concentration":
   Formula: (Haemoglobin*100/Packed Cell Volume)
  ✅ Found "Haemoglobin", replacing with 15
  ✅ Found "Packed Cell Volume", replacing with 45
  📝 Replacements made: 2
  🔢 Sanitized formula: (15*100/45)
  ✅ Formula calculated: (Haemoglobin*100/Packed Cell Volume) = 33.33
  ✅ Updating result at index 11
```

**Expected UI:**
- Mean Cell He.Concentration box: `33.33` ✅

**Test Case 3: Complete All Values**

**Action:** Enter "Red Cell Count" = `5`

**Expected Console:**
```
📐 Processing formula for "Mean Cell Volume":
   Formula: (Packed Cell Volume/Red Cell Count*10)
  ✅ Found "Packed Cell Volume", replacing with 45
  ✅ Found "Red Cell Count", replacing with 5
  ✅ Formula calculated: (Packed Cell Volume/Red Cell Count*10) = 90.00
```

**Expected UI:**
- Mean Cell Volume box: `90.00` ✅

**Test Case 4: Delete Value (Auto-Clear)**

**Action:** Clear "Red Cell Count" field (backspace/delete)

**Expected Console:**
```
🧮 Starting formula calculations...
  🗑️ Empty value for "Red Cell Count"

📐 Processing formula for "Mean Cell Volume":
  🗑️ "Red Cell Count" in formula is EMPTY - will clear
  🗑️ Clearing calculated value for "Mean Cell Volume"
```

**Expected UI:**
- Mean Cell Volume box: empty ✅

## 🔍 Debugging Checklist

### Issue 1: Formulas Not Loading

**Check Console for:**
```
✅ Fetched formulas data: [...]
```

**If missing:**
1. Open Network tab (F12 → Network)
2. Filter: `lab_test_formulas`
3. Click on request
4. Check Response → Should show formulas

**If empty response:**
- Database doesn't have formulas
- Run INSERT queries to add formulas

### Issue 2: Formulas Loading but Not Calculating

**Check Console for:**
```
🔍 Checking for formulas:
  9. ✅ "Mean Cell Volume" has formula: (...)
```

**If showing ⚪ instead of ✅:**
- Formulas not merging with sub-tests correctly
- Check `fetchSubTestsForTest` in useLabTestConfig.ts

**If ✅ showing but no calculation:**
- Check console when entering values
- Should see: `🧮 Starting formula calculations...`
- If not showing: `handleValueChange` not triggering

### Issue 3: Wrong Calculation Results

**Check Console:**
```
📝 Formula after replacements: (45/5*10)
```

**Verify:**
1. Test names match exactly (case-sensitive in formula)
2. All required values entered
3. Formula syntax is correct

### Issue 4: Test Name Mismatch

**Problem:** Formula has "Haemoglobin" but test is "Hemoglobin" (different spelling)

**Check:**
```sql
-- Check test names in lab_test_config
SELECT DISTINCT sub_test_name
FROM lab_test_config
WHERE test_name = 'CBC(Complete Blood Count)';

-- Check test names in formulas
SELECT DISTINCT sub_test_name
FROM lab_test_formulas
WHERE test_name = 'CBC(Complete Blood Count)';

-- Compare - should match exactly!
```

**Solution:** Update formula to use exact test name

## 📝 Quick Test Summary

### Minimum Working Test:

1. ✅ Open form, select CBC test
2. ✅ Console shows: `✅ "Mean Cell Volume" has formula: ...`
3. ✅ Enter: Packed Cell Volume = 45, Red Cell Count = 5
4. ✅ See: Mean Cell Volume = 90.00 (automatic!)
5. ✅ Delete Red Cell Count
6. ✅ See: Mean Cell Volume clears (automatic!)

**If all steps work: System is functioning correctly!** ✅

## 🎯 Expected Final State

### Database:
```
lab_test_formulas table populated with formulas ✅
```

### Console Output:
```
✅ Fetched formulas data ✅
✅ "Test" has formula: (...) ✅
🧮 Starting formula calculations ✅
✅ Formula calculated ✅
```

### UI Behavior:
```
Enter value → Instant calculation ✅
Change value → Instant recalculation ✅
Delete value → Instant clear ✅
```

## 🚨 Common Issues & Quick Fixes

| Issue | Check | Fix |
|-------|-------|-----|
| No formulas in console | Database empty | Run INSERT queries |
| Formula shows but no calc | Test name mismatch | Update formula test names |
| Wrong calculation | Formula syntax | Fix formula in database |
| Not auto-calculating | Console no logs | Hard refresh (Ctrl+Shift+R) |
| Auto-clear not working | Old code | Already fixed in latest code |

## ✅ Success Criteria

All these should be TRUE:
- [ ] Console shows "✅ Fetched formulas data"
- [ ] Console shows "✅ Test has formula: ..."
- [ ] Entering value triggers calculation
- [ ] Console shows "✅ Formula calculated: ... = ..."
- [ ] Calculated value appears in UI automatically
- [ ] Deleting dependency clears calculated value
- [ ] Console shows "🗑️ Clearing calculated value"

**If all checked: System is working perfectly!** 🎉

## 📞 Support

**If still not working, share:**
1. Console screenshot showing formula loading
2. Console screenshot when entering values
3. Database screenshot of lab_test_formulas table
4. Test name being used

This will help identify the exact issue!
