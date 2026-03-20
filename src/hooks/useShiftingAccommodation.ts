import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

function classifyWardType(wardType: string): string {
  const lower = wardType.toLowerCase();
  if (lower.includes('icu') || lower.includes('cicu')) return 'ICU';
  if (lower.includes('semi') || lower.includes('twin')) return 'Semi Private';
  if (lower.includes('delux') || lower.includes('private') || lower.includes('single occupancy')) return 'Private';
  if (lower.includes('general') || lower.includes('female ward')) return 'General Ward';
  return wardType;
}

interface DateSegment {
  startDate: string;
  endDate: string;
  wardType: string;
}

export function useShiftingAccommodation() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAccommodationsFromShiftings = async (visitIdString: string) => {
    setIsGenerating(true);
    try {
      // 1. Get visit UUID and data
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .select('id, admission_date, discharge_date, ward_allotted, visit_date')
        .eq('visit_id', visitIdString)
        .single();

      if (visitError || !visit) {
        toast.error('Visit not found');
        return false;
      }

      const admissionDate = visit.admission_date || visit.visit_date;
      if (!admissionDate) {
        toast.error('Admission date not set for this visit');
        return false;
      }

      // 2. Get initial ward type from room_management
      let initialWardType = '';
      if (visit.ward_allotted) {
        const { data: wardData } = await supabase
          .from('room_management')
          .select('ward_type')
          .eq('ward_id', visit.ward_allotted)
          .limit(1)
          .single();

        if (wardData) {
          initialWardType = wardData.ward_type;
        }
      }

      if (!initialWardType) {
        toast.error('No initial ward assigned to this visit');
        return false;
      }

      // 3. Fetch shifting history ordered by date
      const { data: shiftings, error: shiftError } = await supabase
        .from('ward_shiftings')
        .select('shifting_date, shifting_ward')
        .eq('visit_id', visit.id)
        .order('shifting_date', { ascending: true });

      if (shiftError) {
        toast.error('Failed to fetch shifting records');
        return false;
      }

      // 4. Build date segments
      const segments: DateSegment[] = [];
      const endDate = visit.discharge_date || new Date().toISOString().split('T')[0];

      if (!shiftings || shiftings.length === 0) {
        // No shiftings - single segment from admission to discharge/today
        segments.push({
          startDate: admissionDate.split('T')[0],
          endDate: endDate.split('T')[0],
          wardType: initialWardType,
        });
      } else {
        // First segment: admission to day before first shifting
        const firstShiftDate = new Date(shiftings[0].shifting_date);
        const dayBeforeFirst = new Date(firstShiftDate);
        dayBeforeFirst.setDate(dayBeforeFirst.getDate() - 1);

        const admDateObj = new Date(admissionDate);
        if (dayBeforeFirst >= admDateObj) {
          segments.push({
            startDate: admissionDate.split('T')[0],
            endDate: dayBeforeFirst.toISOString().split('T')[0],
            wardType: initialWardType,
          });
        }

        // Middle segments
        for (let i = 0; i < shiftings.length; i++) {
          const shiftDate = new Date(shiftings[i].shifting_date);
          let segEnd: Date;

          if (i < shiftings.length - 1) {
            segEnd = new Date(shiftings[i + 1].shifting_date);
            segEnd.setDate(segEnd.getDate() - 1);
          } else {
            segEnd = new Date(endDate);
          }

          segments.push({
            startDate: shiftDate.toISOString().split('T')[0],
            endDate: segEnd.toISOString().split('T')[0],
            wardType: shiftings[i].shifting_ward,
          });
        }
      }

      if (segments.length === 0) {
        toast.error('No date segments could be generated');
        return false;
      }

      // 5. For each segment, find matching accommodation
      const accommodationRows: any[] = [];

      for (const seg of segments) {
        const keyword = classifyWardType(seg.wardType);

        const { data: accData } = await supabase
          .from('accommodations')
          .select('id, private_rate')
          .ilike('room_type', `%${keyword}%`)
          .limit(1);

        if (!accData || accData.length === 0) {
          console.warn(`No accommodation found for ward type: ${seg.wardType} (keyword: ${keyword})`);
          continue;
        }

        accommodationRows.push({
          visit_id: visit.id,
          accommodation_id: accData[0].id,
          start_date: seg.startDate,
          end_date: seg.endDate,
          rate_used: accData[0].private_rate || 0,
          rate_type: 'private',
          source: 'shifting',
        });
      }

      if (accommodationRows.length === 0) {
        toast.error('No matching accommodations found for the ward types');
        return false;
      }

      // 6. Delete existing shifting-sourced entries
      await supabase
        .from('visit_accommodations')
        .delete()
        .eq('visit_id', visit.id)
        .eq('source', 'shifting');

      // 7. Insert new rows
      const { error: insertError } = await supabase
        .from('visit_accommodations')
        .insert(accommodationRows);

      if (insertError) {
        toast.error('Failed to insert accommodation entries: ' + insertError.message);
        return false;
      }

      toast.success(`Generated ${accommodationRows.length} accommodation segment(s) from shiftings`);
      return true;
    } catch (err) {
      console.error('Error generating accommodations from shiftings:', err);
      toast.error('Unexpected error generating accommodations');
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateAccommodationsFromShiftings, isGenerating };
}
