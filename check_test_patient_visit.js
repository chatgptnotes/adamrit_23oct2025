import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixTestPatient() {
  console.log('🔍 Checking Test patient visit record...\n');

  try {
    // Step 1: Find the Test patient
    console.log('Step 1: Finding Test patient...');
    const { data: testPatient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('name', 'Test')
      .eq('hospital_name', 'ayushman')
      .single();

    if (patientError || !testPatient) {
      console.error('❌ Could not find Test patient:', patientError);
      return;
    }

    console.log('✅ Found Test patient:');
    console.table({
      id: testPatient.id,
      name: testPatient.name,
      patients_id: testPatient.patients_id,
      hospital_name: testPatient.hospital_name
    });

    // Step 2: Check for existing visit records
    console.log('\nStep 2: Checking visit records for Test patient...');
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select('*')
      .or(`patient_id.eq.${testPatient.id},visit_id.eq.IH25I10001`);

    if (visitsError) {
      console.error('❌ Error checking visits:', visitsError);
      return;
    }

    console.log(`Found ${visits?.length || 0} visit record(s):`);
    if (visits && visits.length > 0) {
      visits.forEach(visit => {
        console.table({
          visit_id: visit.visit_id,
          patient_id: visit.patient_id,
          admission_date: visit.admission_date,
          discharge_date: visit.discharge_date,
          created_at: visit.created_at
        });
      });
    }

    // Step 3: Check if visit IH25I10001 exists and is properly linked
    const visitId = 'IH25I10001';
    const existingVisit = visits?.find(v => v.visit_id === visitId);

    if (!existingVisit) {
      console.log('\n❌ Visit IH25I10001 does not exist. Creating it now...');
      
      const { data: newVisit, error: createError } = await supabase
        .from('visits')
        .insert({
          visit_id: visitId,
          patient_id: testPatient.id,
          admission_date: '2025-09-10T00:00:00',
          visit_date: '2025-09-10T00:00:00',
          visit_type: 'ipd',
          status: 'admitted'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating visit:', createError);
        return;
      }

      console.log('✅ Created new visit record:');
      console.table({
        visit_id: newVisit.visit_id,
        patient_id: newVisit.patient_id,
        admission_date: newVisit.admission_date
      });
    } else if (existingVisit.patient_id !== testPatient.id || !existingVisit.admission_date) {
      console.log('\n⚠️ Visit exists but needs updating...');
      console.log('Current state:', {
        patient_id: existingVisit.patient_id,
        expected_patient_id: testPatient.id,
        admission_date: existingVisit.admission_date
      });

      const { error: updateError } = await supabase
        .from('visits')
        .update({
          patient_id: testPatient.id,
          admission_date: existingVisit.admission_date || '2025-09-10T00:00:00'
        })
        .eq('visit_id', visitId);

      if (updateError) {
        console.error('❌ Error updating visit:', updateError);
        return;
      }

      console.log('✅ Updated visit record to link with Test patient');
    } else {
      console.log('\n✅ Visit IH25I10001 is properly configured:');
      console.table({
        visit_id: existingVisit.visit_id,
        patient_id: existingVisit.patient_id,
        admission_date: existingVisit.admission_date,
        discharge_date: existingVisit.discharge_date
      });
    }

    // Step 4: Verify the fix by running the same query as CurrentlyAdmittedPatients
    console.log('\nStep 4: Verifying the fix...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('visits')
      .select(`
        *,
        patients!inner(
          id,
          name,
          patients_id,
          hospital_name
        )
      `)
      .not('admission_date', 'is', null)
      .eq('patients.hospital_name', 'ayushman');

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError);
      return;
    }

    const testVisit = verifyData?.find(v => v.patients?.name === 'Test');
    if (testVisit) {
      console.log('✅ SUCCESS! Test patient should now appear in Currently Admitted Patients');
      console.log('Found Test patient visit in verification query:');
      console.table({
        visit_id: testVisit.visit_id,
        patient_name: testVisit.patients.name,
        hospital: testVisit.patients.hospital_name,
        admission_date: testVisit.admission_date
      });
    } else {
      console.log('⚠️ Test patient still not appearing in query results');
      console.log('Other Ayushman patients found:', verifyData?.map(v => v.patients?.name));
    }

    console.log('\n🎉 Process complete! Please refresh the Currently Admitted Patients page.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAndFixTestPatient();