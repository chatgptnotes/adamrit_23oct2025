
import { supabase } from '@/integrations/supabase/client';

export const importRegistrationData = async (csvData: any[]) => {
  try {
    // Process patients first
    const patientsToInsert = [];
    const visitsToInsert = [];

    for (const row of csvData) {
      // Create patient record
      const patientData = {
        name: row.name || '',
        primary_diagnosis: row.primary_diagnosis || '',
        admission_date: row.admission_date || null,
        surgery_date: row.surgery_date || null,
        discharge_date: row.discharge_date || null,
        complications: row.complications || 'None',
        surgery: row.surgery || null,
        labs: row.labs || null,
        labs_radiology: row.labs_radiology || null,
        radiology: row.radiology || null,
        antibiotics: row.antibiotics || null,
        other_medications: row.other_medications || null,
        surgeon: row.surgeon || null,
        consultant: row.consultant || null,
        hope_surgeon: row.hope_surgeon || null,
        hope_consultants: row.hope_consultants || null,
        insurance_person_no: row.insurance_person_no || null,
        patients_id: row.patients_id || null,
        diagnosis_id: row.diagnosis_id || null
      };

      patientsToInsert.push(patientData);

      // Create visit record if visit data exists
      if (row.visit_id || row.visit_date) {
        const visitData = {
          visit_id: row.visit_id || `V${Date.now()}`,
          patient_id: row.patient_id || null,
          visit_date: row.visit_date || new Date().toISOString().split('T')[0],
          visit_type: row.visit_type || 'consultation',
          appointment_with: row.appointment_with || 'Doctor',
          reason_for_visit: row.reason_for_visit || 'General consultation',
          claim_id: row.claim_id || `C${Date.now()}`,
          relation_with_employee: row.relation_with_employee || null,
          status: row.status || 'scheduled',
          diagnosis_id: row.diagnosis_id || null,
          surgery_id: row.surgery_id || null,
          referring_doctor_id: row.referring_doctor_id || null
        };

        visitsToInsert.push(visitData);
      }
    }

    // Insert patients
    const { data: insertedPatients, error: patientError } = await supabase
      .from('patients')
      .insert(patientsToInsert)
      .select();

    if (patientError) {
      console.error('Error inserting patients:', patientError);
      throw patientError;
    }

    // Insert visits if any
    if (visitsToInsert.length > 0) {
      const { error: visitError } = await supabase
        .from('visits')
        .insert(visitsToInsert);

      if (visitError) {
        console.error('Error inserting visits:', visitError);
        throw visitError;
      }
    }

    return {
      success: true,
      patientsInserted: insertedPatients?.length || 0,
      visitsInserted: visitsToInsert.length
    };

  } catch (error) {
    console.error('Error importing registration data:', error);
    throw error;
  }
};
