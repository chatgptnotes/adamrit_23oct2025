import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addMarketingVisitsAndCamps() {
  try {
    console.log('📊 Adding Marketing Visits & Camps Data...\n');
    console.log('═══════════════════════════════════════════\n');

    // First, get the list of marketing users
    const { data: users } = await supabase
      .from('marketing_users')
      .select('id, name')
      .eq('is_active', true)
      .limit(4);

    if (!users || users.length === 0) {
      console.log('❌ No marketing users found');
      return;
    }

    console.log('✅ Found Marketing Users:\n');
    users.forEach((u, idx) => {
      console.log(`   ${idx + 1}. ${u.name} (ID: ${u.id})`);
    });
    console.log();

    // Create dummy doctor visits for April 2026
    const visits = [];
    const startDate = new Date('2026-04-01');

    // Rahul: 85 visits (80-99% = ₹5,000)
    for (let i = 0; i < 85; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i % 30));
      visits.push({
        marketing_user_id: users[0].id,
        visit_date: date.toISOString().split('T')[0],
        outcome: 'success'
      });
    }

    // Suraj: 115 visits (100%+ = ₹10,000 + bonus)
    for (let i = 0; i < 115; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i % 30));
      visits.push({
        marketing_user_id: users[1].id,
        visit_date: date.toISOString().split('T')[0],
        outcome: 'success'
      });
    }

    // Lokesh: 45 visits (45% = ₹0)
    for (let i = 0; i < 45; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i % 30));
      visits.push({
        marketing_user_id: users[2].id,
        visit_date: date.toISOString().split('T')[0],
        outcome: 'success'
      });
    }

    // Sachin: 95 visits (95% = ₹5,000)
    for (let i = 0; i < 95; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i % 30));
      visits.push({
        marketing_user_id: users[3].id,
        visit_date: date.toISOString().split('T')[0],
        outcome: 'success'
      });
    }

    console.log('📝 Creating Doctor Visits...\n');
    const { error: visitErr } = await supabase
      .from('doctor_visits')
      .insert(visits);

    if (visitErr) {
      console.log('⚠️  Error or visits already exist:', visitErr.message);
    } else {
      console.log(`✅ Created ${visits.length} doctor visits:\n`);
      console.log(`   ${users[0].name}: 85 visits (80-99% achievement = ₹5,000)`);
      console.log(`   ${users[1].name}: 115 visits (100%+ achievement = ₹10,000 + bonus)`);
      console.log(`   ${users[2].name}: 45 visits (45% achievement = ₹0)`);
      console.log(`   ${users[3].name}: 95 visits (95% achievement = ₹5,000)\n`);
    }

    // Create marketing camps for April 2026
    const camps = [
      {
        marketing_user_id: users[0].id,
        camp_name: 'Delhi Health Awareness 2026',
        camp_date: '2026-04-05',
        attendance: 150,
        outcome: 'success'
      },
      {
        marketing_user_id: users[0].id,
        camp_name: 'Wellness Week April',
        camp_date: '2026-04-12',
        attendance: 120,
        outcome: 'success'
      },
      {
        marketing_user_id: users[1].id,
        camp_name: 'Health Check Camp - Bangalore',
        camp_date: '2026-04-08',
        attendance: 200,
        outcome: 'success'
      },
      {
        marketing_user_id: users[1].id,
        camp_name: 'Diabetes Awareness',
        camp_date: '2026-04-15',
        attendance: 180,
        outcome: 'success'
      },
      {
        marketing_user_id: users[2].id,
        camp_name: 'Sports Injury Clinic',
        camp_date: '2026-04-10',
        attendance: 90,
        outcome: 'success'
      },
      {
        marketing_user_id: users[3].id,
        camp_name: 'Senior Health Camp',
        camp_date: '2026-04-18',
        attendance: 110,
        outcome: 'success'
      }
    ];

    console.log('📝 Creating Marketing Camps...\n');
    const { error: campErr } = await supabase
      .from('marketing_camps')
      .insert(camps);

    if (campErr) {
      console.log('⚠️  Error or camps already exist:', campErr.message);
    } else {
      console.log(`✅ Created ${camps.length} marketing camps:\n`);
      camps.forEach((c, idx) => {
        console.log(`   ${idx + 1}. ${c.camp_name}`);
        console.log(`      Date: ${c.camp_date} | Attendance: ${c.attendance}`);
      });
    }

    console.log('\n═══════════════════════════════════════════\n');
    console.log('✅ MARKETING INCENTIVES READY!\n');
    console.log('🎯 Test Data Added:');
    console.log('   ✅ 11 Marketing Staff Members');
    console.log('   ✅ 340 Doctor Visits (April 2026)');
    console.log('   ✅ 6 Marketing Camps (April 2026)\n');
    console.log('📊 Incentive Summary:\n');
    console.log('   Rahul Sharma: 85 visits → ₹5,000');
    console.log('   Suraj: 115 visits → ₹10,000 + camp bonus');
    console.log('   Lokesh: 45 visits → ₹0');
    console.log('   Sachin: 95 visits → ₹5,000\n');
    console.log('🔗 Open: http://localhost:8080/marketing-incentives');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

addMarketingVisitsAndCamps();
