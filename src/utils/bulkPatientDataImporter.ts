
import { supabase } from '@/integrations/supabase/client';

export interface BulkPatientData {
  id?: string;
  diagnosis_id: string;
  name: string;
  primary_diagnosis: string;
  complications?: string;
  surgery?: string;
  // REMOVED: labs_radiology, antibiotics, other_medications - now stored in junction tables only
  surgeon?: string;
  consultant?: string;
  hope_surgeon?: string;
  hope_consultants?: string;
  // REMOVED: labs, radiology - now stored in junction tables only
  admission_date?: string;
  surgery_date?: string;
  discharge_date?: string;
  insurance_person_no?: string;
  patients_id?: string;
  corporate?: string;
  age?: number;
  gender?: string;
  phone?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_mobile?: string;
  second_emergency_contact_name?: string;
  second_emergency_contact_mobile?: string;
  date_of_birth?: string;
  patient_photo?: string;
  aadhar_passport?: string;
  quarter_plot_no?: string;
  ward?: string;
  panchayat?: string;
  relationship_manager?: string;
  pin_code?: string;
  state?: string;
  city_town?: string;
  blood_group?: string;
  spouse_name?: string;
  allergies?: string;
  relative_phone_no?: string;
  instructions?: string;
  identity_type?: string;
  email?: string;
  privilege_card_number?: string;
  billing_link?: string;
  referral_letter?: string;
  patient_type?: string;
}

export const importBulkPatientData = async (csvText: string) => {
  try {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    const headers = lines[0].split('\t').map(h => h.trim());
    console.log('CSV Headers:', headers);

    const patients: BulkPatientData[] = [];
    const errors: string[] = [];

    // First, get a default diagnosis ID to use when none is provided
    const { data: defaultDiagnosis } = await supabase
      .from('diagnoses')
      .select('id')
      .limit(1)
      .single();

    if (!defaultDiagnosis) {
      throw new Error('No diagnoses found in the system. Please add at least one diagnosis first.');
    }

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      
      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
        continue;
      }

      // Initialize patient with required fields
      const patient: BulkPatientData = {
        diagnosis_id: defaultDiagnosis.id,
        name: '',
        primary_diagnosis: ''
      };
      
      // Map each header to its corresponding value
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        
        switch (header) {
          case 'id':
            if (value && value !== '') patient.id = value;
            break;
          case 'diagnosis_id':
            if (value && value !== '') patient.diagnosis_id = value;
            break;
          case 'name':
            patient.name = value || '';
            break;
          case 'primary_diagnosis':
            patient.primary_diagnosis = value || '';
            break;
          case 'complications':
            patient.complications = value || 'None';
            break;
          case 'surgery':
            patient.surgery = value || '';
            break;
          case 'labs_radiology':
            // REMOVED: labs_radiology - now stored in junction tables only
            break;
          case 'antibiotics':
            // REMOVED: antibiotics - now stored in junction tables only
            break;
          case 'other_medications':
            // REMOVED: other_medications - now stored in junction tables only
            break;
          case 'surgeon':
            patient.surgeon = value || '';
            break;
          case 'consultant':
            patient.consultant = value || '';
            break;
          case 'hope_surgeon':
            patient.hope_surgeon = value || '';
            break;
          case 'hope_consultants':
            patient.hope_consultants = value || '';
            break;
          case 'labs':
            // REMOVED: labs - now stored in junction tables only
            break;
          case 'radiology':
            // REMOVED: radiology - now stored in junction tables only
            break;
          case 'admission_date':
            if (value && value !== '') {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                patient.admission_date = date.toISOString().split('T')[0];
              }
            }
            break;
          case 'surgery_date':
            if (value && value !== '') {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                patient.surgery_date = date.toISOString().split('T')[0];
              }
            }
            break;
          case 'discharge_date':
            if (value && value !== '') {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                patient.discharge_date = date.toISOString().split('T')[0];
              }
            }
            break;
          case 'insurance_person_no':
            patient.insurance_person_no = value || '';
            break;
          case 'patients_id':
            patient.patients_id = value || '';
            break;
          case 'corporate':
            patient.corporate = value || '';
            break;
          case 'age':
            if (value && value !== '' && !isNaN(Number(value))) {
              patient.age = Number(value);
            }
            break;
          case 'gender':
            patient.gender = value || '';
            break;
          case 'phone':
            patient.phone = value || '';
            break;
          case 'address':
            patient.address = value || '';
            break;
          case 'emergency_contact_name':
            patient.emergency_contact_name = value || '';
            break;
          case 'emergency_contact_mobile':
            patient.emergency_contact_mobile = value || '';
            break;
          case 'second_emergency_contact_name':
            patient.second_emergency_contact_name = value || '';
            break;
          case 'second_emergency_contact_mobile':
            patient.second_emergency_contact_mobile = value || '';
            break;
          case 'date_of_birth':
            if (value && value !== '') {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                patient.date_of_birth = date.toISOString().split('T')[0];
              }
            }
            break;
          case 'patient_photo':
            patient.patient_photo = value || '';
            break;
          case 'aadhar_passport':
            patient.aadhar_passport = value || '';
            break;
          case 'quarter_plot_no':
            patient.quarter_plot_no = value || '';
            break;
          case 'ward':
            patient.ward = value || '';
            break;
          case 'panchayat':
            patient.panchayat = value || '';
            break;
          case 'relationship_manager':
            patient.relationship_manager = value || '';
            break;
          case 'pin_code':
            patient.pin_code = value || '';
            break;
          case 'state':
            patient.state = value || '';
            break;
          case 'city_town':
            patient.city_town = value || '';
            break;
          case 'blood_group':
            patient.blood_group = value || '';
            break;
          case 'spouse_name':
            patient.spouse_name = value || '';
            break;
          case 'allergies':
            patient.allergies = value || '';
            break;
          case 'relative_phone_no':
            patient.relative_phone_no = value || '';
            break;
          case 'instructions':
            patient.instructions = value || '';
            break;
          case 'identity_type':
            patient.identity_type = value || '';
            break;
          case 'email':
            patient.email = value || '';
            break;
          case 'privilege_card_number':
            patient.privilege_card_number = value || '';
            break;
          case 'billing_link':
            patient.billing_link = value || '';
            break;
          case 'referral_letter':
            patient.referral_letter = value || '';
            break;
          case 'patient_type':
            patient.patient_type = value || '';
            break;
        }
      });

      // Validate required fields
      if (!patient.name) {
        errors.push(`Row ${i + 1}: Name is required`);
        continue;
      }

      if (!patient.primary_diagnosis) {
        errors.push(`Row ${i + 1}: Primary diagnosis is required`);
        continue;
      }

      patients.push(patient);
    }

    if (errors.length > 0) {
      console.warn('Import warnings:', errors);
    }

    // Insert patients in batches
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < patients.length; i += batchSize) {
      const batch = patients.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('patients')
        .upsert(batch, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('Batch insert error:', error);
        throw new Error(`Failed to insert batch starting at row ${i + 1}: ${error.message}`);
      }

      insertedCount += data?.length || 0;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}, rows: ${data?.length}`);
    }

    return {
      success: true,
      inserted: insertedCount,
      errors: errors,
      total: patients.length
    };

  } catch (error) {
    console.error('Import error:', error);
    throw error;
  }
};
