import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

/**
 * Generates a unique visit ID in the hospital format: IH{YY}{monthLetter}{DD}{seq}
 * e.g. IH24L09001. Extracted from VisitRegistrationForm so the desktop visit
 * form and the tablet Register flow share one identical visit-ID path.
 */
export const generateVisitId = async (visitDate: Date): Promise<string> => {
  const year = visitDate.getFullYear().toString().slice(-2);
  const monthLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const monthLetter = monthLetters[visitDate.getMonth()];
  const day = visitDate.getDate().toString().padStart(2, '0');
  const dateString = format(visitDate, 'yyyy-MM-dd');

  // Fetch all existing visit_ids for today
  const { data: existingVisits, error } = await supabase
    .from('visits')
    .select('visit_id')
    .eq('visit_date', dateString)
    .like('visit_id', 'IH%');

  if (error) {
    console.error('Error fetching existing visits:', error);
    throw error;
  }

  // Collect all existing visit_ids for today
  const existingIds = new Set((existingVisits || []).map(v => v.visit_id));
  let sequenceNumber = (existingVisits?.length || 0) + 1;
  let visitId;
  let sequenceStr;
  // Keep incrementing until a unique visit_id is found
  do {
    sequenceStr = sequenceNumber.toString().padStart(3, '0');
    visitId = `IH${year}${monthLetter}${day}${sequenceStr}`;
    sequenceNumber++;
  } while (existingIds.has(visitId));

  return visitId;
};
