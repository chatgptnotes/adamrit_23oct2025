
// @ts-nocheck

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDiagnoses } from './useDiagnoses';
import { usePatientOperations } from './usePatientOperations';
import { transformPatientsData } from '@/utils/patientDataTransformer';
import { useAuth } from '@/contexts/AuthContext';

export const usePatients = () => {
  const { hospitalConfig } = useAuth();
  const {
    diagnoses,
    isLoading: diagnosesLoading,
    addDiagnosis,
    isAddingDiagnosis
  } = useDiagnoses();

  // 🚨 DEBUG: Check hospital config
  console.log('🔍 usePatients DEBUG: hospitalConfig =', hospitalConfig);
  console.log('🔍 usePatients DEBUG: hospitalConfig.name =', hospitalConfig.name);
  console.log('🔍 usePatients DEBUG: hospitalConfig.id =', hospitalConfig.id);

  // 🏥 EXPLICIT HOSPITAL FILTERING - If-Else Condition
  let hospitalFilter = '';
  if (hospitalConfig.name === 'hope') {
    hospitalFilter = 'hope';
    console.log('🏥 HOPE Hospital login detected - fetching hope patients');
  } else if (hospitalConfig.name === 'ayushman') {
    hospitalFilter = 'ayushman';
    console.log('🏥 AYUSHMAN Hospital login detected - fetching ayushman patients');
  } else {
    hospitalFilter = 'hope'; // default fallback
    console.log('🏥 Unknown hospital type, defaulting to hope patients');
    console.log('🚨 DEBUG: hospitalConfig.name was:', hospitalConfig.name);
  }

  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ['patients', hospitalFilter, hospitalConfig.name], // Include hospital name in cache key
    queryFn: async () => {
      console.log('🚨 QUERY DEBUG: hospitalFilter =', hospitalFilter);
      console.log('🚨 QUERY DEBUG: About to query patients with hospital_name =', hospitalFilter);
      
      // First, check what hospital_name values exist in database
      const { data: allHospitals, error: hospitalError } = await supabase
        .from('patients')
        .select('hospital_name, patients_id, name')
        .not('hospital_name', 'is', null);
      
      if (!hospitalError && allHospitals) {
        const uniqueHospitals = [...new Set(allHospitals.map(p => p.hospital_name))];
        console.log('🚨 DATABASE DEBUG: All hospital_name values in database:', uniqueHospitals);
        
        const hospitalCounts = uniqueHospitals.map(hospital => ({
          hospital,
          count: allHospitals.filter(p => p.hospital_name === hospital).length,
          samplePatients: allHospitals.filter(p => p.hospital_name === hospital).slice(0, 5).map(p => ({
            name: p.name,
            id: p.patients_id
          }))
        }));
        console.log('🚨 DATABASE DEBUG: Patient counts by hospital:', hospitalCounts);
        
        // Specifically check Ayushman patients
        const ayushmanPatients = allHospitals.filter(p => p.hospital_name === 'ayushman');
        console.log(`🏥 AYUSHMAN CHECK: Found ${ayushmanPatients.length} Ayushman patients:`, 
          ayushmanPatients.map(p => ({ name: p.name, id: p.patients_id })));
      }
      
      // Build query step by step for debugging
      // TEMPORARY FIX: Use patient ID prefix filtering until migration is applied
      let query = supabase
        .from('patients')
        .select(`
          id,
          name,
          age,
          gender,
          patients_id,
          insurance_person_no,
          hospital_name,
          visits(
            id,
            visit_id,
            visit_date,
            admission_date,
            surgery_date,
            discharge_date,
            sr_no,
            bunch_no,
            status,
            sst_treatment,
            intimation_done,
            cghs_code,
            package_amount,
            billing_executive,
            extension_taken,
            delay_waiver_intimation,
            surgical_approval,
            remark1,
            remark2,
            visit_surgeries(
              id,
              status,
              sanction_status,
              cghs_surgery(
                id,
                name,
                code,
                description,
                category
              )
            ),
            visit_complications(
              complications!complication_id(
                id,
                name
              )
            ),
            visit_esic_surgeons(
              esic_surgeons!surgeon_id(
                id,
                name
              )
            ),
            visit_referees(
              referees!referee_id(
                id,
                name
              )
            ),
            visit_hope_surgeons(
              hope_surgeons!surgeon_id(
                id,
                name
              )
            ),
            visit_hope_consultants(
              hope_consultants!consultant_id(
                id,
                name
              )
            ),
            visit_diagnoses(
              id,
              is_primary,
              diagnoses(
                id,
                name
              )
            )
          )
        `);

      // Apply hospital filtering based on hospital_name column
      query = query.eq('hospital_name', hospitalFilter);
      console.log('🏥 Filtering patients by hospital_name =', hospitalFilter);
      
      query = query.order('name');
      
      console.log('🚨 QUERY DEBUG: Final query object:', query);
      console.log('🚨 QUERY DEBUG: SQL equivalent: SELECT * FROM patients WHERE hospital_name =', `'${hospitalFilter}'`);
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching patients:', error);
        throw error;
      }
      
      console.log('🚨 QUERY RESULT: Raw patient data from database:', data);
      console.log(`🚨 QUERY RESULT: Found ${data?.length || 0} patients for hospital: ${hospitalFilter}`);
      
      // Debug: Show patient IDs to verify correct hospital
      if (data && data.length > 0) {
        const patientIds = data.map(p => p.patients_id).slice(0, 5);
        console.log('🚨 QUERY RESULT: First 5 patient IDs:', patientIds);
        console.log('🚨 QUERY RESULT: Expected prefix for', hospitalFilter, ':', hospitalFilter === 'ayushman' ? 'UHAY' : 'UHHO');
      }
      
      return data;
    }
  });

  const {
    addPatient,
    updatePatient,
    deletePatient,
    isAddingPatient,
    isUpdatingPatient,
    isDeletingPatient
  } = usePatientOperations(diagnoses);

  // Transform patients data to match the original structure
  const patientsByDiagnosis = transformPatientsData(patients);

  return {
    diagnoses,
    patients: patientsByDiagnosis,
    isLoading: diagnosesLoading || patientsLoading,
    addPatient,
    updatePatient,
    deletePatient,
    addDiagnosis,
    isAddingPatient,
    isUpdatingPatient,
    isDeletingPatient,
    isAddingDiagnosis
  };
};
