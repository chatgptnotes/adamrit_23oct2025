import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2R5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  console.log('🔍 DETAILED COLUMN CHECK\n');

  // Check doctor_visits columns
  console.log('1️⃣  DOCTOR_VISITS Table');
  console.log('─'.repeat(50));
  
  try {
    // Try to insert dummy record to see schema
    const { data, error } = await supabase
      .from('doctor_visits')
      .select('*')
      .limit(0);

    // Get column info from the error or try a different approach
    const { data: allData } = await supabase
      .from('doctor_visits')
      .select('*');

    if (allData && allData.length === 0) {
      console.log('⚠️  Table is empty - cannot determine columns from data');
      console.log('Expected columns for lab results:');
      console.log('   • id, patient_id, visit_date, test_type');
      console.log('   • lab_results (JSON), doctor_name, notes\n');
    }
  } catch (e) {
    console.log('Error checking doctor_visits\n');
  }

  // Check radiology_reports columns
  console.log('2️⃣  RADIOLOGY_REPORTS Table');
  console.log('─'.repeat(50));
  
  try {
    const { data: allData } = await supabase
      .from('radiology_reports')
      .select('*');

    if (allData && allData.length === 0) {
      console.log('⚠️  Table is empty - cannot determine columns from data');
      console.log('Expected columns for radiology:');
      console.log('   • id, patient_id, report_date, imaging_type');
      console.log('   • report_file (URL), findings, radiologist_name\n');
    }
  } catch (e) {
    console.log('Error checking radiology_reports\n');
  }

  // Count prescriptions with patient data
  console.log('3️⃣  PRESCRIPTIONS Table');
  console.log('─'.repeat(50));
  
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('patient_id, doctor_name, prescription_date, status')
      .limit(5);

    if (data && data.length > 0) {
      console.log(`✅ ${data.length} prescriptions found\n`);
      console.log('Sample prescription data:');
      data.forEach((p, idx) => {
        console.log(`   ${idx + 1}. Patient: ${p.patient_id}`);
        console.log(`      Doctor: ${p.doctor_name}`);
        console.log(`      Date: ${p.prescription_date}`);
        console.log(`      Status: ${p.status}\n`);
      });
    }
  } catch (e) {
    console.log('Error checking prescriptions\n');
  }

  console.log('\n═══════════════════════════════════════════\n');
}

checkColumns();
