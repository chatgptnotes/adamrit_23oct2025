const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addDummyData() {
  try {
    console.log('Creating dummy patient...');

    // 1. Create dummy patient
    const patientData = {
      name: 'Test Patient Lab Trends',
      gender: 'M',
      date_of_birth: '1990-05-15',
      mobile: '9876543210',
      email: 'testlab@example.com',
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456'
    };

    const { data: patientRes, error: patientErr } = await supabase
      .from('patients')
      .insert([patientData])
      .select();

    if (patientErr) {
      console.error('Error creating patient:', patientErr);
      return;
    }

    const patientId = patientRes[0].id;
    console.log('✅ Patient created:', patientId);

    // 2. Create dummy visits with lab tests
    const testDates = [
      new Date('2026-02-01'),
      new Date('2026-02-15'),
      new Date('2026-03-01'),
      new Date('2026-03-15'),
      new Date('2026-04-01'),
      new Date('2026-04-15')
    ];

    for (const testDate of testDates) {
      const visitData = {
        patient_id: patientId,
        visit_date: testDate.toISOString().split('T')[0],
        visit_type: 'Lab Test',
        notes: 'Routine lab screening'
      };

      const { data: visitRes, error: visitErr } = await supabase
        .from('visits')
        .insert([visitData])
        .select();

      if (visitErr) {
        console.error('Error creating visit:', visitErr);
        continue;
      }

      const visitId = visitRes[0].id;

      // Add lab test results for this visit
      const labResults = [
        {
          visit_id: visitId,
          test_name: 'Blood Sugar (Fasting)',
          result_value: 95 + Math.random() * 40,
          unit: 'mg/dL',
          reference_range: '70-100',
          status: 'Normal',
          test_date: testDate.toISOString().split('T')[0]
        },
        {
          visit_id: visitId,
          test_name: 'Hemoglobin',
          result_value: 12 + Math.random() * 3,
          unit: 'g/dL',
          reference_range: '12-16',
          status: 'Normal',
          test_date: testDate.toISOString().split('T')[0]
        },
        {
          visit_id: visitId,
          test_name: 'Total Cholesterol',
          result_value: 150 + Math.random() * 100,
          unit: 'mg/dL',
          reference_range: '<200',
          status: 'Normal',
          test_date: testDate.toISOString().split('T')[0]
        }
      ];

      const { error: labErr } = await supabase
        .from('lab_test_results')
        .insert(labResults);

      if (labErr) {
        console.error('Error adding lab results:', labErr);
      } else {
        console.log(`✅ Lab tests added for ${testDate.toDateString()}`);
      }
    }

    console.log('\n✅ All dummy data added successfully!');
    console.log(`\nTest this patient: http://localhost:8080/patient-profile?patient=${patientId}`);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addDummyData();
