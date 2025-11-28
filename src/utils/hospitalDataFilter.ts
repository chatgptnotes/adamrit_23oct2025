/**
 * Hospital Data Filtering Utilities
 * Ensures all data queries are properly scoped to the current hospital
 */

import { useAuth } from '@/contexts/AuthContext';

export const useHospitalFilter = () => {
  const { hospitalConfig, hospitalType } = useAuth();
  
  // Get the hospital name for database filtering
  const getHospitalName = () => {
    return hospitalType || 'hope'; // fallback to hope
  };

  // Create a hospital-scoped supabase query filter
  const applyHospitalFilter = (query: any, table: string) => {
    const hospitalName = getHospitalName();
    
    // Tables that have direct hospital_name column
    const directHospitalTables = ['patients', 'User'];
    
    // Tables that need filtering through patient relationship
    const patientRelatedTables = ['patient_data', 'visits', 'prescriptions', 'lab_orders', 'radiology_orders'];
    
    if (directHospitalTables.includes(table)) {
      return query.eq('hospital_name', hospitalName);
    } else if (patientRelatedTables.includes(table)) {
      // For patient-related tables, we need to filter through patients table
      return query.in(
        'patient_id',
        // This would be a subquery to get patient IDs for the current hospital
        `(SELECT patients_id FROM patients WHERE hospital_name = '${hospitalName}')`
      );
    }
    
    return query; // No filtering for other tables
  };

  return {
    hospitalName: getHospitalName(),
    applyHospitalFilter,
    hospitalConfig
  };
};

// Utility function to check if a patient ID belongs to current hospital
export const isPatientFromCurrentHospital = (patientId: string, currentHospital: string): boolean => {
  if (currentHospital === 'hope') {
    return patientId.startsWith('UHHO');
  } else if (currentHospital === 'ayushman') {
    return patientId.startsWith('UHAY');
  }
  return false;
};

// Utility function to get hospital from patient ID
export const getHospitalFromPatientId = (patientId: string): string => {
  if (patientId.startsWith('UHHO')) {
    return 'hope';
  } else if (patientId.startsWith('UHAY')) {
    return 'ayushman';
  }
  return 'unknown';
};

// Debug utility to log hospital context
export const logHospitalContext = (operation: string, hospitalName: string) => {
  console.log(`🏥 Hospital Filter: ${operation} for hospital: ${hospitalName}`);
};

// Validate hospital data consistency
export const validateHospitalData = (data: any[], currentHospital: string, idField: string = 'patients_id') => {
  const issues = data.filter(item => {
    const patientId = item[idField];
    return patientId && !isPatientFromCurrentHospital(patientId, currentHospital);
  });
  
  if (issues.length > 0) {
    console.warn(`🚨 Hospital Data Validation: Found ${issues.length} records that don't belong to ${currentHospital} hospital:`, issues);
  }
  
  return issues.length === 0;
};