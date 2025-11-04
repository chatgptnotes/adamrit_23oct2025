# Formula Auto-Calculation Feature

## समस्या (Problem)

Database में formulas save हैं जैसे:
- `Mean Cell Volume = (Packed Cell Volume/Red Cell Count*10)`
- `Mean Cell Haemoglobin = (Haemoglobin*1...)`

**Requirements:**
जब user "Red Cell Count" या "Packed Cell Volume" में observed value enter करे, तो automatically "Mean Cell Volume" calculate होकर उसके box में show हो जाए!

## समाधान (Solution Implemented)

### ✅ Changes Made

#### 1. **Updated SubTest Interface** (`src/hooks/useLabTestConfig.ts` Lines 11-25)

**Added formula fields:**
```typescript
export interface SubTest {
  id: string;
  lab_id: string;
  test_name: string;
  sub_test_name: string;
  unit: string;
  min_age: number;
  max_age: number;
  age_unit: string;
  nested_sub_tests?: NestedSubTest[];
  normal_ranges?: any[];
  formula?: string | null;        // ✅ NEW: Formula for auto-calculation
  test_type?: string;              // ✅ NEW: Numeric or Text
  text_value?: string | null;      // ✅ NEW: Text value
}
```

#### 2. **Updated fetchSubTestsForTest Hook** (`src/hooks/useLabTestConfig.ts` Lines 63-124)

**अब formulas भी load होते हैं:**
```typescript
// Fetch formulas from lab_test_formulas table
const { data: formulasData } = await supabase
  .from('lab_test_formulas')
  .select('*')
  .eq('test_name', testName);

// Merge formula data with sub-tests
const subTestsWithFormulas = data?.map(subTest => {
  const formulaData = formulasMap.get(subTest.sub_test_name);
  return {
    ...subTest,
    formula: formulaData?.formula || null,
    test_type: formulaData?.test_type || 'Numeric',
    text_value: formulaData?.text_value || null
  };
}) || [];
```

Console में log होगा:
```
📐 Haemoglobin has formula: (Haemoglobin*3+1)
📐 Mean Cell Volume has formula: (Packed Cell Volume/Red Cell Count*10)
```

#### 3. **Added Auto-Calculation Function** (`src/components/lab/EnhancedLabResultsForm.tsx` Lines 100-171)

**`calculateFormulaValues` function:**

यह function:
1. सभी entered values का एक Map बनाता है
2. हर formula को check करता है
3. Formula में test names को actual values से replace करता है
4. Safe evaluation करके result calculate करता है
5. Calculated value को automatically fill कर देता है

**Example:**
```typescript
Formula: "Packed Cell Volume/Red Cell Count*10"

If user enters:
- Packed Cell Volume = 45
- Red Cell Count = 5

Then:
- Formula becomes: 45/5*10
- Calculation: 90
- "Mean Cell Volume" box में automatically "90.00" show होगा!
```

#### 4. **Updated handleValueChange** (`src/components/lab/EnhancedLabResultsForm.tsx` Lines 173-187)

**Har value change पे auto-calculation:**
```typescript
const handleValueChange = (index: number, value: string) => {
  let updatedResults = [...testResults];
  updatedResults[index].observedValue = value;

  // ... status check ...

  // ✅ Auto-calculate formula-based fields
  updatedResults = calculateFormulaValues(updatedResults);

  setTestResults(updatedResults);
};
```

## कैसे काम करता है (How It Works)

### Step-by-Step Process:

1. **User test select करता है** (e.g., "CBC(Complete Blood Count)")

2. **Formulas load होते हैं database से:**
   ```
   ✅ Fetched formulas data: [
     { sub_test_name: "Mean Cell Volume", formula: "(Packed Cell Volume/Red Cell Count*10)" },
     { sub_test_name: "Mean Cell Haemoglobin", formula: "(Haemoglobin*1)" }
   ]
   ```

3. **User values enter करता है:**
   - "Packed Cell Volume" में `2` enter
   - "Red Cell Count" में `2` enter

4. **Automatic Calculation होता है:**
   ```
   🧮 Starting formula calculations...
   📊 Value map: { "Packed Cell Volume": 2, "Red Cell Count": 2 }
   📐 Processing formula for "Mean Cell Volume": (Packed Cell Volume/Red Cell Count*10)
     ✅ Replacing "Packed Cell Volume" with 2
     ✅ Replacing "Red Cell Count" with 2
     🔢 Sanitized formula: (2/2*10)
     ✅ Formula calculated: (Packed Cell Volume/Red Cell Count*10) = 10.00
   ```

5. **Calculated value automatically "Mean Cell Volume" box में show होता है!** ✅

## Formula Format

### Supported Operations:
- Addition: `+`
- Subtraction: `-`
- Multiplication: `*`
- Division: `/`
- Parentheses: `()`

### Example Formulas:
```
Mean Cell Volume = (Packed Cell Volume/Red Cell Count*10)
Mean Cell Haemoglobin = (Haemoglobin*1.5)
Mean Cell He.Concentration = (Haemoglobin*100/Packed Cell Volume)
```

### Important Notes:
- Test names **case-insensitive** match होते हैं
- Formula में test name **exact match** होना चाहिए
- अगर कोई required value missing है, तो calculation skip होगा

## Console Logging

जब user values enter करता है, console में यह दिखेगा:

```
🧮 Starting formula calculations...
📊 Value map: {
  "Haemoglobin": 2,
  "Packed Cell Volume": 2,
  "Red Cell Count": 2
}
📐 Processing formula for "Mean Cell Volume": (Packed Cell Volume/Red Cell Count*10)
  ✅ Replacing "Packed Cell Volume" with 2
  ✅ Replacing "Red Cell Count" with 2
  🔢 Sanitized formula: (2/2*10)
  ✅ Formula calculated: (Packed Cell Volume/Red Cell Count*10) = 10.00

📐 Processing formula for "Mean Cell Haemoglobin": (Haemoglobin*1.5)
  ✅ Replacing "Haemoglobin" with 2
  🔢 Sanitized formula: (2*1.5)
  ✅ Formula calculated: (Haemoglobin*1.5) = 3.00
```

## Safety Features

### 1. **Sanitization:**
Formula में sirf numbers aur operators allow hote hain:
```typescript
const sanitizedFormula = formula.replace(/[^0-9+\-*/().\s]/g, '');
```

### 2. **Validation:**
- Check for `NaN` (Not a Number)
- Check for `Infinity`
- Only valid numbers displayed

### 3. **Error Handling:**
```typescript
try {
  const result = new Function(`return ${sanitizedFormula}`)();
  // ...
} catch (error) {
  console.error('❌ Error calculating formula:', error);
}
```

## Testing Steps

### Test Case 1: Mean Cell Volume

1. **Select test:** CBC(Complete Blood Count)
2. **Check console:**
   ```
   📐 Mean Cell Volume has formula: (Packed Cell Volume/Red Cell Count*10)
   ```
3. **Enter values:**
   - Packed Cell Volume: `45`
   - Red Cell Count: `5`
4. **Expected result:**
   - Mean Cell Volume box में automatically `90.00` show होगा
5. **Console verify:**
   ```
   ✅ Formula calculated: (Packed Cell Volume/Red Cell Count*10) = 90.00
   ```

### Test Case 2: Multiple Dependencies

1. **Enter Haemoglobin:** `15`
2. **Console shows:**
   ```
   🧮 Starting formula calculations...
   ✅ Replacing "Haemoglobin" with 15
   ✅ Formula calculated: (Haemoglobin*...) = ...
   ```
3. **All dependent formulas automatically calculate!**

### Test Case 3: Missing Values

1. **Enter only Red Cell Count:** `5`
2. **Packed Cell Volume empty**
3. **Console shows:**
   ```
   ⚠️ Missing value for "Packed Cell Volume"
   ⏸️ Skipping calculation - not all values available
   ```
4. **No calculation होगा** (correct behavior!)

## Files Modified

### 1. `src/hooks/useLabTestConfig.ts`
- **Lines 11-25:** Updated SubTest interface
- **Lines 63-124:** Updated fetchSubTestsForTest with formula loading
- **Lines 71-72:** Added display_order sorting

### 2. `src/components/lab/EnhancedLabResultsForm.tsx`
- **Lines 100-171:** Added calculateFormulaValues function
- **Lines 173-187:** Updated handleValueChange to trigger auto-calculation

## Database Structure

### lab_test_formulas Table:
```sql
CREATE TABLE lab_test_formulas (
  id UUID PRIMARY KEY,
  lab_id UUID NOT NULL,
  test_name TEXT NOT NULL,
  sub_test_name TEXT NOT NULL,
  formula TEXT,              -- The calculation formula
  test_type TEXT,            -- Numeric or Text
  text_value TEXT,           -- For Text type tests
  ...
);
```

**Example Data:**
```
test_name: "CBC(Complete Blood Count)"
sub_test_name: "Mean Cell Volume"
formula: "(Packed Cell Volume/Red Cell Count*10)"
```

## Troubleshooting

### Problem: Calculation not working

**Solutions:**
1. **Check console:** Formula load hua hai?
   ```
   📐 Test has formula: ...
   ```
2. **Test name match check karein:** Exact spelling match hona chahiye
3. **Values numeric hain?** Non-numeric values skip honge
4. **Browser refresh:** `Ctrl + Shift + R`

### Problem: Wrong calculation

**Check:**
1. **Formula syntax:** Parentheses correct hain?
2. **Console log:** Sanitized formula check karein
3. **Value map:** Sahi values load ho rahe hain?

### Problem: Console errors

```
❌ Error calculating formula for ...
```

**Fix:**
- Formula syntax check karein
- Test names spelling check karein
- Database में formula correct hai?

## Benefits

✅ **Automatic Calculation** - No manual calculation needed!
✅ **Real-time Updates** - Values update hote hi calculation ho jata hai
✅ **Error Prevention** - Manual calculation errors eliminate ho gaye
✅ **Time Saving** - Faster data entry
✅ **Consistent Results** - Same formula har baar same result
✅ **Console Logging** - Easy debugging aur verification

## Example Workflow

```
User opens Lab Results Entry Form
  ↓
Selects "CBC(Complete Blood Count)"
  ↓
Console: ✅ Fetched formulas data: [...]
Console: 📐 Mean Cell Volume has formula: (Packed Cell Volume/Red Cell Count*10)
  ↓
User enters "Packed Cell Volume" = 45
  ↓
Console: 🧮 Starting formula calculations...
Console: ⏸️ Skipping - not all values available
  ↓
User enters "Red Cell Count" = 5
  ↓
Console: 🧮 Starting formula calculations...
Console: ✅ Replacing "Packed Cell Volume" with 45
Console: ✅ Replacing "Red Cell Count" with 5
Console: ✅ Formula calculated = 90.00
  ↓
"Mean Cell Volume" box में automatically "90.00" appears! 🎉
```

## Summary

अब जब भी user observation entry form में values enter करता है:
1. ✅ Formulas automatically database से load होते हैं
2. ✅ Har value entry पे dependent formulas calculate होते हैं
3. ✅ Calculated values automatically fill हो जाते हैं
4. ✅ Console में detailed logging होती है
5. ✅ Safe evaluation aur error handling built-in है

**Auto-calculation ab fully functional hai! 🎉**
