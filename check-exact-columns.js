import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  try {
    console.log('🔍 Checking patients table columns...\n');

    // Get one patient and check what columns exist
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No patients in table. Creating test patient to check columns...');
      
      const { error: insertError } = await supabase
        .from('patients')
        .insert({
          name: 'Column Check',
          phone: '1234567890',
          address: 'Test',
          corporate: 'private'
        });

      if (insertError) {
        console.error('Error inserting test patient:', insertError.message);
        return;
      }

      // Fetch again
      const { data: newData, error: newError } = await supabase
        .from('patients')
        .select('*')
        .limit(1);

      if (newError) {
        console.error('Error fetching:', newError.message);
        return;
      }

      const patient = newData?.[0];
      const columns = patient ? Object.keys(patient) : [];
      
      console.log('✓ Patient table columns:');
      columns.forEach(col => console.log(`  • ${col}`));

      const hasMarketedBy = columns.includes('marketed_by');
      const hasReferralSource = columns.includes('referral_source');

      console.log('\nMarketing columns status:');
      console.log(`  ${hasMarketedBy ? '✅' : '❌'} marketed_by`);
      console.log(`  ${hasReferralSource ? '✅' : '❌'} referral_source`);

      if (!hasMarketedBy || !hasReferralSource) {
        console.log('\n⚠️  Columns are missing! Please run this in Supabase SQL Editor:');
        console.log('\nALTER TABLE patients ADD COLUMN IF NOT EXISTS marketed_by TEXT;');
        console.log('ALTER TABLE patients ADD COLUMN IF NOT EXISTS referral_source TEXT;\n');
      }
      return;
    }

    const patient = data[0];
    const columns = Object.keys(patient);
    
    console.log('✓ Patient table columns:');
    columns.forEach(col => console.log(`  • ${col}`));

    const hasMarketedBy = columns.includes('marketed_by');
    const hasReferralSource = columns.includes('referral_source');

    console.log('\n✅ Marketing columns status:');
    console.log(`  ${hasMarketedBy ? '✅' : '❌'} marketed_by`);
    console.log(`  ${hasReferralSource ? '✅' : '❌'} referral_source`);

    if (hasMarketedBy && hasReferralSource) {
      console.log('\n✅ All columns present and ready!');
    } else {
      console.log('\n⚠️  Some columns are missing!');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkColumns();
