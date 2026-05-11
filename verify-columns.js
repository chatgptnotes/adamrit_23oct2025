import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
  try {
    console.log('✓ Verifying database columns...\n');

    const { data, error } = await supabase
      .from('patients')
      .select('marketed_by, referral_source')
      .limit(1);

    if (!error) {
      console.log('✅ SUCCESS! Columns are working perfectly!\n');
      console.log('Database is ready:');
      console.log('  ✓ marketed_by column');
      console.log('  ✓ referral_source column\n');
      console.log('The Add Patient form will now save marketing data correctly.');
      return;
    }

    console.error('❌ Error:', error.message);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

verify();
