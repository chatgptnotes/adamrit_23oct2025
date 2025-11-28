# How to Import pharmacy_items.sql Data into Supabase

## Problem
You have a large `pharmacy_items.sql` file (8.7MB) with MySQL format data that needs to be imported into Supabase `medication` table.

---

## ✅ Solution Options

### **Option 1: Manual Small Batch (Easiest)** ⭐ Recommended for testing

Use the file: `direct_insert_medication_supabase.sql`

1. Open Supabase SQL Editor
2. Copy-paste the INSERT statements (15 sample records provided)
3. Run the query
4. Add more INSERT rows as needed from your `pharmacy_items.sql`

**Pros:**
- Simple, no tools needed
- Good for testing
- Full control

**Cons:**
- Manual work for large datasets
- Only suitable for small batches

---

### **Option 2: CSV Import via Supabase Dashboard** ⭐ Recommended for large data

#### Step 1: Convert pharmacy_items.sql to CSV

**Using Excel/Google Sheets:**
1. Open `pharmacy_items.sql` in text editor
2. Copy INSERT statements
3. Use online tool to convert SQL INSERT to CSV:
   - https://www.convertcsv.com/sql-to-csv.htm
4. Or manually create CSV with columns:
   ```csv
   name,generic_name,item_code,drug_id_external,stock,pack_size,manufacturer,manufacturer_id,supplier_name,supplier_id
   "1-AL TAB","LEVOCETRIZINE","T1AL001","1","0",10,"FDC LIMITED","1","","255"
   "3D FLAM INJ","DICLOFENAC SODIUM","I3DF001","2","0",3,"INTAS PHARMACEUTICALS LTD.","2","","361"
   ```

#### Step 2: Import CSV to Supabase

**Method A: Using Supabase Table Editor**
1. Go to Supabase Dashboard
2. Click **Table Editor** → Select `medication` table
3. Click **Insert** → **Import data from CSV**
4. Upload your CSV file
5. Map columns correctly
6. Click Import

**Method B: Using SQL COPY command**
1. Upload CSV to Supabase Storage first
2. Then run in SQL Editor:
```sql
-- Note: This requires CSV to be accessible
COPY medication (name, generic_name, item_code, drug_id_external, stock, pack_size, manufacturer)
FROM '/path/to/medications.csv'
WITH (FORMAT csv, HEADER true);
```

---

### **Option 3: Python Script** (For developers)

Create a Python script to parse and insert:

```python
import psycopg2
import re

# Supabase connection
conn = psycopg2.connect(
    host="your-project.supabase.co",
    database="postgres",
    user="postgres",
    password="your-password",
    port="5432"
)

cur = conn.cursor()

# Read pharmacy_items.sql
with open('pharmacy_items.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Parse INSERT statements
# Extract values from INSERT INTO `pharmacy_items` ... VALUES (...)
pattern = r'\(([^)]+)\)'
matches = re.findall(pattern, content)

for match in matches[:100]:  # Process first 100 records
    values = match.split(',')

    # Clean values
    name = values[4].strip().strip("'")
    generic = values[16].strip().strip("'") if values[16] != 'NULL' else None
    item_code = values[12].strip().strip("'")
    # ... extract more fields

    # Insert into medication
    cur.execute("""
        INSERT INTO medication (name, generic_name, item_code, ...)
        VALUES (%s, %s, %s, ...)
        ON CONFLICT (name) DO NOTHING
    """, (name, generic, item_code, ...))

conn.commit()
cur.close()
conn.close()
```

---

### **Option 4: Use pgloader** (Advanced)

If you have MySQL database access:

```bash
# Install pgloader
apt-get install pgloader  # Linux
brew install pgloader      # Mac

# Convert MySQL to PostgreSQL
pgloader mysql://user:pass@localhost/db_HopeHospital \
         postgresql://postgres:pass@your-project.supabase.co:5432/postgres
```

---

### **Option 5: Node.js Script** (For your React app)

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// Read and parse pharmacy_items.sql
const sqlContent = fs.readFileSync('pharmacy_items.sql', 'utf8');

// Extract INSERT values
const regex = /INSERT INTO `pharmacy_items`.*?VALUES\s+([\s\S]*?);/gi;
const matches = sqlContent.matchAll(regex);

for (const match of matches) {
  const valuesStr = match[1];

  // Parse each row
  const rows = valuesStr.split(/\),\s*\(/);

  for (const row of rows) {
    const values = row.replace(/^\(|\)$/g, '').split(',');

    const medication = {
      name: values[4].trim().replace(/'/g, ''),
      generic_name: values[16] !== 'NULL' ? values[16].trim().replace(/'/g, '') : null,
      item_code: values[12].trim().replace(/'/g, ''),
      drug_id_external: values[1].trim(),
      stock: values[14].trim(),
      pack_size: parseInt(values[13].trim()),
      manufacturer: values[7].trim().replace(/'/g, ''),
      manufacturer_id: values[8].trim(),
      // ... add more fields
    };

    const { error } = await supabase
      .from('medication')
      .insert(medication);

    if (error) console.error('Error:', error);
  }
}
```

---

## 🎯 Recommended Approach

For your case, I recommend **Option 2 (CSV Import)**:

### Quick Steps:
1. **Extract data from pharmacy_items.sql**
   - Open in text editor
   - Copy INSERT statements section

2. **Convert to CSV**
   - Use: https://www.convertcsv.com/sql-to-csv.htm
   - Or create manually in Excel

3. **Clean CSV headers** to match medication table:
   ```
   name,generic_name,category,dosage,description,medicine_code,barcode,
   strength,manufacturer,manufacturer_id,stock,loose_stock,pack,
   item_code,drug_id_external,shelf,supplier_name,supplier_id,
   exp_date,is_deleted,is_implant,item_type,pack_size
   ```

4. **Import via Supabase Table Editor**
   - Dashboard → Table Editor → medication
   - Insert → Import CSV
   - Upload and map columns

---

## 🧪 Testing First

Before importing all 8.7MB:
1. Run `direct_insert_medication_supabase.sql` first (15 sample records)
2. Verify data looks correct
3. Then proceed with full import

---

## ⚠️ Important Notes

1. **Backup First**: Always backup your Supabase database
2. **Test Small**: Import 10-20 records first
3. **Check Mappings**: Ensure column names match
4. **Handle Conflicts**: Use `ON CONFLICT (name) DO UPDATE` to handle duplicates
5. **Data Types**:
   - MySQL `tinyint(1)` → PostgreSQL `BOOLEAN`
   - MySQL `''` empty strings → PostgreSQL `NULL`
   - MySQL backticks → Remove or use double quotes

---

## 📞 Need Help?

If you're stuck, you can:
1. Share a small sample (10-20 rows) from pharmacy_items.sql
2. I'll create a ready-to-run script for you
3. Or we can create a Node.js import script

---

**Files Created:**
- `direct_insert_medication_supabase.sql` - Manual insert with 15 sample records
- This guide - `IMPORT_PHARMACY_DATA_GUIDE.md`
