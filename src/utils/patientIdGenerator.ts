
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
  
  // Get existing patients for today with hospital prefix, ordered by patients_id
  const { data: existingPatients, error } = await supabase
    .from('patients')
    .select('patients_id')
    .like('patients_id', `${hospitalPrefix}${year}${month}${day}%`)
    .not('patients_id', 'is', null)
    .order('patients_id', { ascending: true });
  
  if (error) {
    console.error('Error counting patients for today:', error);
    throw error;
  }
  
  // Find the first available serial number to handle gaps in sequence
  let serialNumber = 1;
  const basePattern = `${hospitalPrefix}${year}${month}${day}`;
  
  if (existingPatients && existingPatients.length > 0) {
    // Extract serial numbers from existing patient IDs
    const usedSerialNumbers = new Set<number>();
    
    for (const patient of existingPatients) {
      if (patient.patients_id?.startsWith(basePattern)) {
        const serialPart = patient.patients_id.substring(basePattern.length);
        const serial = parseInt(serialPart, 10);
        if (!isNaN(serial)) {
          usedSerialNumbers.add(serial);
        }
      }
    }
    
    // Find the first available serial number
    while (usedSerialNumbers.has(serialNumber)) {
      serialNumber++;
    }
  }
  
  const serialStr = padNumber(serialNumber, 3);
  
  return `${basePattern}${serialStr}`;
};
