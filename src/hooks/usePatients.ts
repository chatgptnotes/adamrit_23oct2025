
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

  // Hospital filtering: map config name to DB hospital_name value
  const hospitalFilter = hospitalConfig.name === 'ayushman' ? 'ayushman' : 'hope';

  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ['patients', hospitalFilter],
    queryFn: async () => {
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
      query = query.eq('hospital_name', hospitalFilter).order('name');

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching patients:', error);
        throw error;
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
