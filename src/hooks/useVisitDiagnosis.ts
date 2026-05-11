import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VisitDiagnosisData {
  visitId: string;
  patientName: string;
  patientUhId: string;
  mobileNumber: string;
  age: string;
  gender: string;
  admissionDate: string;
  dischargeDate: string;
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  medications: string[];
  complaints: string[];
  vitals: string[];
  investigations: string[];
  treatmentCourse: string[];
  condition: string[];
}

export const useVisitDiagnosis = (visitId: string) => {
  return useQuery({
    queryKey: ['visit-diagnosis', visitId],
    queryFn: async (): Promise<VisitDiagnosisData | null> => {
      if (!visitId) return null;

      console.log('🔍 Fetching visit diagnosis data for:', visitId);

      try {
        // First, let's try a simpler approach and debug step by step
        console.log('🔍 Step 1: Fetching basic visit data for:', visitId);

        // Get basic visit data first
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select('*')
          .eq('visit_id', visitId)
          .single();

        if (visitError) {
          console.error('❌ Visit query error:', visitError);
          return null;
        }

        if (!visitData) {
          return null;
        }

        // Get patient data separately to avoid join issues
        console.log('🔍 Step 1.5: Fetching patient data for patient_id:', visitData.patient_id);

        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('id, name, age, gender, hospital_name, patients_id, phone')
          .eq('id', visitData.patient_id)
          .single();

        if (patientError) {
          console.error('❌ Patient query error:', patientError);
        }

        console.log('🔍 Visit diagnosis_id:', visitData.diagnosis_id);

        // Step 2: Get single diagnosis if diagnosis_id exists
        let singleDiagnosis = null;
        if (visitData.diagnosis_id) {
          console.log('🔍 Step 2: Fetching single diagnosis for diagnosis_id:', visitData.diagnosis_id);

          const { data: diagnosisData, error: diagnosisError } = await supabase
            .from('diagnoses')
            .select('id, name')
            .eq('id', visitData.diagnosis_id)
            .single();

          if (!diagnosisError && diagnosisData) {
            singleDiagnosis = diagnosisData;
          } else {
          }
        }

        // Step 3: Get multiple diagnoses from junction table
        console.log('🔍 Step 3: Fetching multiple diagnoses for visit.id:', visitData.id);

        const { data: multipleDiagnoses, error: multipleError } = await supabase
          .from('visit_diagnoses')
          .select(`
            is_primary,
            notes,
            diagnoses (
              id,
              name
            )
          `)
          .eq('visit_id', visitData.id);

        if (multipleError) {
        } else {
        }

        const visitDiagnoses = multipleDiagnoses || [];

        console.log('🔍 Single diagnosis from visits.diagnosis_id:', singleDiagnosis);
        console.log('🔍 Multiple diagnoses from visit_diagnoses:', visitDiagnoses);

        // Process multiple diagnoses from junction table
        const primaryFromMultiple = visitDiagnoses.find((vd: any) => vd.is_primary)?.diagnoses?.name || '';
        const secondaryFromMultiple = visitDiagnoses
          .filter((vd: any) => !vd.is_primary)
          .map((vd: any) => vd.diagnoses?.name)
          .filter(Boolean);

        // Determine final primary diagnosis
        let finalPrimaryDiagnosis = '';
        if (primaryFromMultiple) {
          // Use primary from multiple diagnoses
          finalPrimaryDiagnosis = primaryFromMultiple;
        } else if (singleDiagnosis?.name) {
          // Use single diagnosis from visits.diagnosis_id
          finalPrimaryDiagnosis = singleDiagnosis.name;
        } else if (visitDiagnoses.length > 0 && visitDiagnoses[0]?.diagnoses?.name) {
          // Use first diagnosis if no primary is marked
          finalPrimaryDiagnosis = visitDiagnoses[0].diagnoses.name;
        }

        // Combine secondary diagnoses
        const finalSecondaryDiagnoses = [...secondaryFromMultiple];


        const result: VisitDiagnosisData = {
          visitId: visitData.visit_id,
          patientName: patientData?.name || 'Unknown Patient',
          patientUhId: patientData?.patients_id || 'N/A',
          mobileNumber: patientData?.phone || 'N/A',
          age: patientData?.age?.toString() || 'N/A',
          gender: patientData?.gender || 'N/A',
          admissionDate: visitData.admission_date || visitData.visit_date || 'N/A',
          dischargeDate: visitData.discharge_date || 'N/A',
          primaryDiagnosis: finalPrimaryDiagnosis || 'No diagnosis recorded',
          secondaryDiagnoses: finalSecondaryDiagnoses,
          medications: [], // Will be populated from other tables if available
          complaints: visitData.reason_for_visit ? [visitData.reason_for_visit] : [],
          vitals: [], // Will be populated from other data sources
          investigations: [], // Will be populated from lab/radiology tables
          treatmentCourse: [], // Will be populated from treatment data
          condition: [] // Will be populated from discharge data
        };

        return result;

      } catch (error) {
        console.error('Error fetching visit diagnosis data:', error);
        return null;
      }
    },
    enabled: !!visitId,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};