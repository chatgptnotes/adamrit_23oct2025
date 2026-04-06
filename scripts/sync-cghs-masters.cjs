const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const EXCEL_PATH = '/Users/murali/Downloads/Cghs_Rate_List Unlisted.00 2025 ( Rate).xlsx';

async function main() {
  // 1. Read Excel (row 0 is title, row 1 is headers, data starts row 2)
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  // Row 1 has actual headers: SNo., Procedure Name, Speciality Classification, Tier, Facility, Ward, Cghs Code No., Rate (₹)
  const headers = rawRows[1];
  const allRows = rawRows.slice(2).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  }).filter(row => row['Procedure Name']);

  console.log(`Total Excel rows: ${allRows.length}`);

  // 2. Categorize by Speciality Classification
  const labRows = [];
  const radiologyRows = [];
  const surgeryRows = [];

  for (const row of allRows) {
    const speciality = (row['Speciality Classification'] || '').trim();
    const name = (row['Procedure Name'] || '').trim();
    const code = (row['Cghs Code No.'] || '').toString().trim();
    const rate = parseFloat(row['Rate (₹)']) || null;

    if (!name) continue;

    if (speciality === 'Laboratory Investigation') {
      labRows.push({
        name,
        CGHS_code: code || null,
        speciality,
        'NABH_rates_in_rupee': rate,
        'Non-NABH_rates_in_rupee': null,
        private: null,
        bhopal_nabh_rate: null,
        bhopal_non_nabh_rate: null,
      });
    } else if (speciality === 'Radiological Investigation') {
      radiologyRows.push({
        name,
        category: speciality,
        NABH_NABL_Rate: rate,
        Non_NABH_NABL_Rate: null,
        private: null,
        bhopal_nabh: null,
        bhopal_non_nabh: null,
      });
    } else {
      surgeryRows.push({
        name,
        code: code || null,
        category: speciality,
        NABH_NABL_Rate: rate,
        Non_NABH_NABL_Rate: null,
        private: null,
        bhopal_nabh_rate: null,
        bhopal_non_nabh_rate: null,
      });
    }
  }

  console.log(`Lab: ${labRows.length}, Radiology: ${radiologyRows.length}, Surgery: ${surgeryRows.length}`);
  console.log(`Total categorized: ${labRows.length + radiologyRows.length + surgeryRows.length}`);

  // 3. Delete all existing rows from each table
  console.log('\n--- Deleting existing data ---');

  let res;
  res = await supabase.from('lab').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log(`lab delete:`, res.error ? `ERROR: ${res.error.message}` : 'OK');

  res = await supabase.from('radiology').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log(`radiology delete:`, res.error ? `ERROR: ${res.error.message}` : 'OK');

  res = await supabase.from('cghs_surgery').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log(`cghs_surgery delete:`, res.error ? `ERROR: ${res.error.message}` : 'OK');

  // 4. Insert in batches of 500
  console.log('\n--- Inserting new data ---');

  await insertBatch('lab', labRows);
  await insertBatch('radiology', radiologyRows);
  await insertBatch('cghs_surgery', surgeryRows);

  console.log('\nDone!');
}

async function insertBatch(table, rows) {
  const BATCH_SIZE = 500;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase.from(table).insert(batch);
    if (error) {
      console.error(`  ${table} batch ${Math.floor(i/BATCH_SIZE)+1} ERROR:`, error.message);
      // Try inserting one by one to find duplicates
      for (const row of batch) {
        const { error: singleErr } = await supabase.from(table).insert(row);
        if (singleErr) {
          console.error(`    Failed: "${row.name}" - ${singleErr.message}`);
          errors++;
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
    }
  }
  console.log(`  ${table}: inserted ${inserted}, errors ${errors} (total attempted: ${rows.length})`);
}

main().catch(console.error);
