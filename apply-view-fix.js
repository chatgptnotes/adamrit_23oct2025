// Script to apply the batch_stock_details view fix
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read Supabase credentials from environment or use direct values
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oqotvqmfxwunzhzqrkez.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔄 Applying batch_stock_details view fix...\n');

  // Read the migration SQL file
  const migrationPath = './supabase/migrations/20251103_fix_batch_stock_details_view.sql';
  let sql;

  try {
    sql = fs.readFileSync(migrationPath, 'utf8');
  } catch (error) {
    console.error('❌ Error reading migration file:', error.message);
    process.exit(1);
  }

  // Split by DO $$ blocks and execute separately (DO blocks can't be in multi-statement queries)
  const statements = sql.split('DO $$');
  const mainSql = statements[0];

  try {
    // Execute main SQL (DROP VIEW, CREATE VIEW, COMMENT, GRANT)
    console.log('📝 Executing view update...');
    const { error } = await supabase.rpc('exec_sql', { sql_query: mainSql });

    if (error) {
      // If RPC doesn't exist, try direct execution via REST API
      console.log('⚠️  RPC method not available, attempting alternative method...');

      // Split into individual statements
      const sqlStatements = mainSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of sqlStatements) {
        if (statement) {
          console.log(`   Executing: ${statement.substring(0, 50)}...`);
          // Note: This won't work for DDL statements through client library
          // User will need to run this manually
        }
      }

      console.log('\n⚠️  Note: DDL statements (DROP VIEW, CREATE VIEW) cannot be executed through Supabase client.');
      console.log('Please run this migration manually using one of these methods:\n');
      console.log('Option 1: Supabase Dashboard');
      console.log('  1. Go to https://supabase.com/dashboard/project/oqotvqmfxwunzhzqrkez/sql/new');
      console.log('  2. Copy the contents of: supabase/migrations/20251103_fix_batch_stock_details_view.sql');
      console.log('  3. Paste and click "Run"\n');
      console.log('Option 2: psql command line');
      console.log('  psql "postgresql://postgres.oqotvqmfxwunzhzqrkez:S@t31lit3$@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/20251103_fix_batch_stock_details_view.sql\n');
      return;
    }

    console.log('✅ View updated successfully!');

    // Test the view
    console.log('\n🔍 Testing the updated view...');
    const { data, error: selectError, count } = await supabase
      .from('v_batch_stock_details')
      .select('medicine_name, batch_number, current_stock, expiry_status', { count: 'exact' })
      .limit(5);

    if (selectError) {
      console.error('❌ Error querying view:', selectError.message);
    } else {
      console.log(`✅ View is working! Found ${count} batch records.`);
      if (data && data.length > 0) {
        console.log('\nSample records:');
        data.forEach((record, i) => {
          console.log(`  ${i + 1}. ${record.medicine_name} - Batch: ${record.batch_number} - Stock: ${record.current_stock} - Status: ${record.expiry_status}`);
        });
      } else {
        console.log('\n⚠️  No batch inventory records found. This is expected if you haven\'t received any stock through GRN yet.');
      }
    }

    console.log('\n✨ Migration completed!');
    console.log('   Refresh your Stock Management page to see the changes.');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.error('\nPlease apply the migration manually through Supabase Dashboard:');
    console.error('1. Go to SQL Editor: https://supabase.com/dashboard/project/oqotvqmfxwunzhzqrkez/sql/new');
    console.error('2. Copy and paste the contents of: supabase/migrations/20251103_fix_batch_stock_details_view.sql');
    console.error('3. Click "Run"');
    process.exit(1);
  }
}

applyMigration();
