import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAndAddColumns() {
  try {
    console.log('🔍 Checking patients table schema...\n');

    // Check if columns already exist
    const { data, error } = await supabase
      .from('patients')
      .select('marketed_by, referral_source')
      .limit(1);

    if (!error) {
      console.log('✅ Columns already exist! No changes needed.\n');
      console.log('The marketed_by and referral_source columns are ready to use.');
      return;
    }

    if (error && error.code === '42703') {
      // Column not found error - add columns
      console.log('⚠️  Columns not found. Adding them now...\n');

      const result = await supabase.rpc('exec', {
        sql: `
          ALTER TABLE patients ADD COLUMN IF NOT EXISTS marketed_by TEXT;
          ALTER TABLE patients ADD COLUMN IF NOT EXISTS referral_source TEXT;
        `
      }).catch(() => null);

      // Try alternative approach with direct SQL
      console.log('📝 Adding columns via Supabase...');
      
      // Since we can't directly execute SQL via anon key, we'll inform the user
      console.log('\n⚠️  Note: You need to run these SQL commands in Supabase Console:\n');
      console.log('ALTER TABLE patients ADD COLUMN marketed_by TEXT;');
      console.log('ALTER TABLE patients ADD COLUMN referral_source TEXT;\n');
      console.log('Steps:');
      console.log('1. Go to: https://supabase.com/dashboard');
      console.log('2. Select your project');
      console.log('3. Open: SQL Editor');
      console.log('4. Paste the commands above');
      console.log('5. Click Execute');
      return;
    }

    console.log('✅ Schema check complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAndAddColumns();
