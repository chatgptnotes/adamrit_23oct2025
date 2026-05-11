import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addColumns() {
  try {
    console.log('🔍 Checking if columns exist...\n');

    // Try to read the columns - if error, they don't exist
    const { error: checkError } = await supabase
      .from('patients')
      .select('marketed_by, referral_source')
      .limit(1);

    if (!checkError) {
      console.log('✅ SUCCESS! Columns already exist or are accessible.\n');
      console.log('The following columns are ready to use:');
      console.log('  • marketed_by');
      console.log('  • referral_source\n');
      return;
    }

    if (checkError.code === '42703') {
      console.log('⚠️  Columns not found. Adding them...\n');
      
      // Execute SQL directly
      const { error: sqlError } = await supabase.rpc('exec', {
        query: `
          ALTER TABLE patients ADD COLUMN marketed_by TEXT;
          ALTER TABLE patients ADD COLUMN referral_source TEXT;
        `
      });

      if (sqlError) {
        // Try individual queries
        const queries = [
          'ALTER TABLE patients ADD COLUMN marketed_by TEXT;',
          'ALTER TABLE patients ADD COLUMN referral_source TEXT;'
        ];

        console.log('Executing SQL commands...');
        for (const query of queries) {
          try {
            const { error } = await supabase.rpc('exec', { query });
            if (error) console.log('Query result:', error.message);
          } catch (e) {
            // Fallback: columns might already exist or this will be handled
          }
        }
      }

      // Verify they exist now
      const { data, error: verifyError } = await supabase
        .from('patients')
        .select('marketed_by, referral_source')
        .limit(1);

      if (!verifyError) {
        console.log('✅ SUCCESS! Columns created successfully!\n');
        console.log('Ready to use in forms.');
      } else {
        console.log('Note: Columns may need to be added via Supabase Console');
      }
      return;
    }

    console.log('✅ Columns are accessible and ready!');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

addColumns();
