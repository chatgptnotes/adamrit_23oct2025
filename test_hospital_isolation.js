#!/usr/bin/env node
/**
 * Hospital Data Isolation Test Script
 * This script tests that hospital data isolation is working correctly
 */

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHospitalIsolation() {
  console.log('🏥 Starting Hospital Data Isolation Tests...\n');

  // Test 1: Hope Hospital Data Query
  console.log('1️⃣ Testing Hope Hospital Data Query');
  try {
    const { data: hopePatients, error: hopeError } = await supabase
      .from('patients')
      .select('patients_id, name, hospital_name')
      .eq('hospital_name', 'hope')
      .limit(5);

    if (hopeError) {
      console.error('❌ Hope query error:', hopeError);
    } else {
      console.log(`✅ Hope query returned ${hopePatients.length} patients`);
      hopePatients.forEach(patient => {
        const idPattern = patient.patients_id.substring(0, 4);
        const isCorrect = idPattern === 'UHHO';
        console.log(`   ${isCorrect ? '✅' : '❌'} ${patient.patients_id} (${patient.hospital_name}) - ${isCorrect ? 'Correct' : 'WRONG HOSPITAL!'}`);
      });
    }
  } catch (error) {
    console.error('❌ Hope test failed:', error);
  }

  console.log();

  // Test 2: Ayushman Hospital Data Query
  console.log('2️⃣ Testing Ayushman Hospital Data Query');
  try {
    const { data: ayushmanPatients, error: ayushmanError } = await supabase
      .from('patients')
      .select('patients_id, name, hospital_name')
      .eq('hospital_name', 'ayushman')
      .limit(5);

    if (ayushmanError) {
      console.error('❌ Ayushman query error:', ayushmanError);
    } else {
      console.log(`✅ Ayushman query returned ${ayushmanPatients.length} patients`);
      ayushmanPatients.forEach(patient => {
        const idPattern = patient.patients_id.substring(0, 4);
        const isCorrect = idPattern === 'UHAY';
        console.log(`   ${isCorrect ? '✅' : '❌'} ${patient.patients_id} (${patient.hospital_name}) - ${isCorrect ? 'Correct' : 'WRONG HOSPITAL!'}`);
      });
    }
  } catch (error) {
    console.error('❌ Ayushman test failed:', error);
  }

  console.log();

  // Test 3: Cross-contamination Check
  console.log('3️⃣ Testing Cross-contamination');
  try {
    const { data: contamination, error: contaminationError } = await supabase
      .from('patients')
      .select('patients_id, hospital_name')
      .or('and(patients_id.like.UHHO%,hospital_name.eq.ayushman),and(patients_id.like.UHAY%,hospital_name.eq.hope)');

    if (contaminationError) {
      console.error('❌ Contamination check error:', contaminationError);
    } else {
      if (contamination.length === 0) {
        console.log('✅ No cross-contamination found - Perfect isolation!');
      } else {
        console.log(`❌ Found ${contamination.length} contaminated records:`);
        contamination.forEach(record => {
          console.log(`   ❌ ${record.patients_id} marked as ${record.hospital_name} hospital`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Contamination test failed:', error);
  }

  console.log();

  // Test 4: Hospital Distribution
  console.log('4️⃣ Testing Hospital Distribution');
  try {
    const { data: distribution, error: distributionError } = await supabase
      .from('patients')
      .select('hospital_name')
      .not('hospital_name', 'is', null);

    if (distributionError) {
      console.error('❌ Distribution check error:', distributionError);
    } else {
      const hopeCoun = distribution.filter(p => p.hospital_name === 'hope').length;
      const ayushmanCount = distribution.filter(p => p.hospital_name === 'ayushman').length;
      const total = distribution.length;

      console.log(`✅ Hospital Distribution:`);
      console.log(`   Hope: ${hopeCoun} patients (${((hopeCoun/total)*100).toFixed(1)}%)`);
      console.log(`   Ayushman: ${ayushmanCount} patients (${((ayushmanCount/total)*100).toFixed(1)}%)`);
      console.log(`   Total: ${total} patients`);
    }
  } catch (error) {
    console.error('❌ Distribution test failed:', error);
  }

  console.log();

  // Test 5: Patient_Data Hospital Alignment  
  console.log('5️⃣ Testing Patient_Data Hospital Alignment');
  try {
    const { data: patientDataSample, error: pdError } = await supabase
      .from('patient_data')
      .select(`
        patient_id,
        patients!inner(patients_id, hospital_name)
      `)
      .limit(10);

    if (pdError) {
      console.error('❌ Patient data alignment error:', pdError);
    } else {
      console.log(`✅ Patient data sample (${patientDataSample.length} records):`);
      patientDataSample.forEach(record => {
        const patient = record.patients;
        const idPattern = patient.patients_id.substring(0, 4);
        const expectedHospital = idPattern === 'UHHO' ? 'hope' : 'ayushman';
        const isCorrect = patient.hospital_name === expectedHospital;
        console.log(`   ${isCorrect ? '✅' : '❌'} ${patient.patients_id} → ${patient.hospital_name} ${isCorrect ? '' : '(MISMATCH!)'}`);
      });
    }
  } catch (error) {
    console.error('❌ Patient data alignment test failed:', error);
  }

  console.log('\n🏥 Hospital Data Isolation Tests Complete!');
}

// Run the tests
if (require.main === module) {
  testHospitalIsolation().catch(console.error);
}

module.exports = { testHospitalIsolation };