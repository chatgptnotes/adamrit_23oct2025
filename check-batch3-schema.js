import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('🔍 CHECKING BATCH 3 DATABASE SCHEMA\n');
  console.log('═══════════════════════════════════════════\n');

  // Check each required table
  const tables = ['doctor_visits', 'radiology_reports', 'prescriptions'];

  for (const table of tables) {
    console.log(`\n📋 Table: ${table}`);
    console.log('─'.repeat(50));

    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error && error.code === '42P01') {
        console.log(`❌ TABLE DOES NOT EXIST\n`);
        continue;
      }

      if (error) {
        console.log(`⚠️  Error: ${error.message}\n`);
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`✅ Table exists but NO DATA\n`);
        continue;
      }

      const row = data[0];
      const columns = Object.keys(row);
      
      console.log(`✅ Table exists with ${columns.length} columns:`);
      columns.forEach(col => {
        const value = row[col];
        const type = value === null ? 'null' : typeof value;
        console.log(`   • ${col} (${type})`);
      });
      console.log(`\n✓ Sample data exists\n`);

    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }

  // Check patients table for required fields
  console.log('\n📋 Table: patients (Doctor View Dependencies)');
  console.log('─'.repeat(50));

  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .limit(1);

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`✅ Patients table has ${columns.length} columns:`);
      
      const requiredFields = ['name', 'date_of_birth', 'phone', 'age'];
      requiredFields.forEach(field => {
        const exists = columns.includes(field);
        console.log(`   ${exists ? '✅' : '❌'} ${field}`);
      });
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }

  console.log('\n═══════════════════════════════════════════\n');
  console.log('SUMMARY:\n');
  console.log('For Doctor Unified View, we need:\n');
  console.log('1. doctor_visits table');
  console.log('   → Contains: lab results, test data, visit_date');
  console.log('   → Status: CHECK ABOVE\n');
  
  console.log('2. radiology_reports table');
  console.log('   → Contains: imaging reports, file URLs, report_date');
  console.log('   → Status: CHECK ABOVE\n');
  
  console.log('3. prescriptions table');
  console.log('   → Contains: medications, dosage, duration, expiry_date');
  console.log('   → Status: CHECK ABOVE\n');

  console.log('4. patients table (should already exist)');
  console.log('   → Status: CHECK ABOVE\n');
}

checkSchema();
