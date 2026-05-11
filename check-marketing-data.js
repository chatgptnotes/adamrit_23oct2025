import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkMarketingData() {
  try {
    console.log('📊 CHECKING MARKETING INCENTIVES DATA\n');
    console.log('═════════════════════════════════════════\n');

    // Check marketing_users
    console.log('1️⃣  Marketing Users:');
    const { data: users, error: usersErr } = await supabase
      .from('marketing_users')
      .select('*')
      .eq('is_active', true);

    if (usersErr) {
      console.log('   ❌ Error:', usersErr.message);
    } else if (!users || users.length === 0) {
      console.log('   ⚠️  No marketing users found\n');
    } else {
      console.log(`   ✅ Found ${users.length} marketing users:\n`);
      users.forEach((u, idx) => {
        console.log(`   ${idx + 1}. ${u.name}`);
        console.log(`      Email: ${u.email}`);
        if (u.phone) console.log(`      Phone: ${u.phone}`);
      });
      console.log();
    }

    // Check doctor_visits
    console.log('2️⃣  Doctor Visits (April 2026):');
    const { data: visits, error: visitsErr } = await supabase
      .from('doctor_visits')
      .select('*')
      .gte('visit_date', '2026-04-01')
      .lte('visit_date', '2026-04-30');

    if (visitsErr) {
      console.log('   ❌ Error:', visitsErr.message);
    } else if (!visits || visits.length === 0) {
      console.log('   ⚠️  No doctor visits found\n');
    } else {
      console.log(`   ✅ Found ${visits.length} visits:\n`);
      console.log(`   Date Range: Apr 1 - Apr 30, 2026\n`);
    }

    // Check marketing_camps
    console.log('3️⃣  Marketing Camps (April 2026):');
    const { data: camps, error: campsErr } = await supabase
      .from('marketing_camps')
      .select('*')
      .gte('camp_date', '2026-04-01')
      .lte('camp_date', '2026-04-30');

    if (campsErr) {
      console.log('   ❌ Error:', campsErr.message);
    } else if (!camps || camps.length === 0) {
      console.log('   ⚠️  No marketing camps found\n');
    } else {
      console.log(`   ✅ Found ${camps.length} camps:\n`);
    }

    console.log('\n═════════════════════════════════════════');
    console.log('📍 FEATURE SUMMARY:\n');
    console.log('URL: http://localhost:8080/marketing-incentives\n');
    console.log('✅ Feature Status: ACTIVE');
    console.log('📊 Incentive Calculation: ENABLED\n');
    console.log('💰 Incentive Structure:');
    console.log('   • 0-59% achievement: ₹0');
    console.log('   • 60-79% achievement: ₹2,000');
    console.log('   • 80-99% achievement: ₹5,000');
    console.log('   • 100%+ achievement: ₹10,000 + ₹100 per extra visit');
    console.log('   • Camp Bonus: ₹500 per camp (max ₹2,000)\n');
    console.log('🎯 Monthly Targets:');
    console.log('   • Doctor Visits: 100');
    console.log('   • Marketing Camps: 4\n');
    console.log('═════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkMarketingData();
