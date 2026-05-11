import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://xvkxccqaopbnkvwgyfjv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU');

async function checkSchema() {
  console.log('📊 Checking Database Schema...\n');

  // Check doctor_visits columns
  const { data: visits } = await supabase
    .from('doctor_visits')
    .select()
    .limit(1);

  if (visits && visits.length > 0) {
    console.log('✅ doctor_visits table columns:');
    console.log(Object.keys(visits[0]).join(', '));
  }

  // Check patients columns
  const { data: patients } = await supabase
    .from('patients')
    .select()
    .limit(1);

  if (patients && patients.length > 0) {
    console.log('\n✅ patients table columns:');
    console.log(Object.keys(patients[0]).join(', '));
  }
}

checkSchema();
