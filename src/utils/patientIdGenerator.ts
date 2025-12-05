
import { supabase } from '@/integrations/supabase/client';
import { HospitalType } from '@/types/hospital';

// Function to convert month number to alphabet (A=Jan, B=Feb, ..., L=Dec)
const getMonthLetter = (month: number): string => {
  const letters = 'ABCDEFGHIJKL';
  return letters[month - 1] || 'A';
};

// Function to pad number with leading zeros
const padNumber = (num: number, length: number): string => {
  return num.toString().padStart(length, '0');
};

// Function to get hospital prefix
const getHospitalPrefix = (hospitalType: HospitalType): string => {
  switch (hospitalType) {
    case 'hope':
      return 'UHHO';
    case 'ayushman':
      return 'UHAY';
    default:
      return 'UHHO';
  }
};

// Function to generate custom patient ID based on hospital: UHHO24L09009 or UHAY24L09009
export const generatePatientId = async (hospitalType: HospitalType, date: Date = new Date()): Promise<string> => {
  const hospitalPrefix = getHospitalPrefix(hospitalType);
  const year = date.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = getMonthLetter(date.getMonth() + 1); // Month as letter
  const day = padNumber(date.getDate(), 2); // Day with leading zero
  
  // Get today's date in YYYY-MM-DD format for counting patients
  const todayStr = date.toISOString().split('T')[0];
  
  // Count existing patients for today with hospital prefix
  const { data: existingPatients, error } = await supabase
    .from('patients')
    .select('patients_id')
    .like('patients_id', `${hospitalPrefix}${year}${month}${day}%`)
    .not('patients_id', 'is', null);
  
  if (error) {
    console.error('Error counting patients for today:', error);
    throw error;
  }
  
  // Calculate next serial number
  const serialNumber = (existingPatients?.length || 0) + 1;
  const serialStr = padNumber(serialNumber, 3);
  
  return `${hospitalPrefix}${year}${month}${day}${serialStr}`;
};
