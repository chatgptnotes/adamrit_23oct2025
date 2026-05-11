import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  console.log('📊 DATA AVAILABILITY CHECK FOR BATCH 3\n');
  console.log('═══════════════════════════════════════════\n');

  // Check doctor_visits count
  const { count: doctorVisitsCount, error: e1 } = await supabase
    .from('doctor_visits')
    .select('*', { count: 'exact', head: true });

  console.log(`1️⃣  DOCTOR VISITS`);
  console.log(`   Records: ${doctorVisitsCount || 0}`);
  console.log(`   Status: ${doctorVisitsCount > 0 ? '✅ HAS DATA' : '❌ NO DATA'}\n`);

  // Check radiology_reports count
  const { count: radiologyCount, error: e2 } = await supabase
    .from('radiology_reports')
    .select('*', { count: 'exact', head: true });

  console.log(`2️⃣  RADIOLOGY REPORTS`);
  console.log(`   Records: ${radiologyCount || 0}`);
  console.log(`   Status: ${radiologyCount > 0 ? '✅ HAS DATA' : '❌ NO DATA'}\n`);

  // Check prescriptions count
  const { count: prescriptionsCount, error: e3 } = await supabase
    .from('prescriptions')
    .select('*', { count: 'exact', head: true });

  console.log(`3️⃣  PRESCRIPTIONS`);
  console.log(`   Records: ${prescriptionsCount || 0}`);
  console.log(`   Status: ${prescriptionsCount > 0 ? '✅ HAS DATA' : '❌ NO DATA'}\n`);

  // Check patients count
  const { count: patientsCount, error: e4 } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true });

  console.log(`4️⃣  PATIENTS`);
  console.log(`   Records: ${patientsCount || 0}`);
  console.log(`   Status: ${patientsCount > 0 ? '✅ HAS DATA' : '❌ NO DATA'}\n`);

  console.log('═══════════════════════════════════════════\n');
  console.log('📋 WHAT\'S NEEDED FOR DOCTOR UNIFIED VIEW:\n');
  console.log('✅ AVAILABLE:');
  console.log(`   • Patients table (${patientsCount} records)`);
  console.log(`   • Prescriptions table (${prescriptionsCount} records)\n`);

  console.log('❌ MISSING:');
  if (doctorVisitsCount === 0) {
    console.log('   • Lab results data (doctor_visits table)');
  }
  if (radiologyCount === 0) {
    console.log('   • Radiology reports data');
  }
  console.log('\n');
}

checkData();
