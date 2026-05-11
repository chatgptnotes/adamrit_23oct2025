import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function generateVisitId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${year}${month}${day}${random}`;
}

async function addDummyData() {
  try {
    console.log('🏥 Creating dummy patient with lab test history...\n');

    // 1. Create dummy patient
    const patientData = {
      name: 'John Test Patient - Lab Trends',
      age: 35,
      gender: 'M',
      phone: '9876543210',
      address: '123 Test Medical Street, Test City'
    };

    const { data: patientRes, error: patientErr } = await supabase
      .from('patients')
      .insert([patientData])
      .select();

    if (patientErr) {
      console.error('❌ Error creating patient:', patientErr.message);
      return;
    }

    const patientId = patientRes[0].id;
    console.log('✅ Patient created');
    console.log(`   ID: ${patientId}`);
    console.log(`   Name: ${patientRes[0].name}\n`);

    // 2. Create dummy visits with lab tests
    const testDates = [
      new Date('2026-02-01'),
      new Date('2026-02-15'),
      new Date('2026-03-01'),
      new Date('2026-03-15'),
      new Date('2026-04-01'),
      new Date('2026-04-15')
    ];

    console.log('📋 Adding 6 visits with lab results...\n');

    for (const testDate of testDates) {
      const dateStr = testDate.toISOString().split('T')[0];
      const generatedVisitId = generateVisitId();

      const visitPayload = {
        patient_id: patientId,
        visit_type: 'Lab Test',
        visit_date: dateStr,
        visit_id: generatedVisitId,
        appointment_with: 'Lab Technician',
        status: 'completed'
      };

      const { data: visitRes, error: visitErr } = await supabase
        .from('visits')
        .insert([visitPayload])
        .select();

      if (visitErr) {
        console.error(`❌ Error creating visit:`, visitErr.message);
        continue;
      }

      if (!visitRes || visitRes.length === 0) {
        console.error(`❌ Visit insert failed for ${dateStr}`);
        continue;
      }

      const visitId = visitRes[0].id;
      console.log(`✅ Visit: ${dateStr}`);

      // Add lab results for this visit (CORRECT TABLE: lab_results)
      const labResults = [
        {
          visit_id: visitId,
          test_name: 'Blood Sugar',
          test_category: 'Chemistry',
          result_value: String((95 + Math.random() * 40).toFixed(2)),
          result_unit: 'mg/dL',
          reference_range: '70-100',
          is_abnormal: false
        },
        {
          visit_id: visitId,
          test_name: 'Hemoglobin',
          test_category: 'Hematology',
          result_value: String((12 + Math.random() * 3).toFixed(2)),
          result_unit: 'g/dL',
          reference_range: '12-16',
          is_abnormal: false
        },
        {
          visit_id: visitId,
          test_name: 'Total Cholesterol',
          test_category: 'Lipids',
          result_value: String((150 + Math.random() * 100).toFixed(2)),
          result_unit: 'mg/dL',
          reference_range: '<200',
          is_abnormal: false
        }
      ];

      const { error: labErr } = await supabase
        .from('lab_results')
        .insert(labResults);

      if (labErr) {
        console.error(`   ⚠️  Lab results error:`, labErr.message || JSON.stringify(labErr));
      } else {
        console.log(`   ✅ 3 lab results added`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ DUMMY DATA COMPLETE!');
    console.log('='.repeat(70));
    console.log('\n🧪 TEST LAB TRENDS FEATURE:\n');
    console.log(`🔗 URL: http://localhost:8080/patient-profile?patient=${patientId}\n`);
    console.log('👉 Steps:');
    console.log('   1. Click the URL above');
    console.log('   2. Refresh page (F5)');
    console.log('   3. Click "Lab Trends" tab');
    console.log('   4. Should see 3 line charts\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addDummyData();
