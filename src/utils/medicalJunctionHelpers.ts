// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';

// Helper functions for managing medical junction table data

export interface MedicalJunctionData {
  complications: string[];
  esicSurgeons: string[];
  referees: string[];
  hopeSurgeons: string[];
  hopeConsultants: string[];
}

// Get all medical data for a visit
export async function getVisitMedicalData(visitId: string): Promise<MedicalJunctionData> {
  try {
    const [
      complicationsResult,
      esicSurgeonsResult,
      refereesResult,
      hopeSurgeonsResult,
      hopeConsultantsResult
    ] = await Promise.all([
      // Get complications
      supabase
        .from('visit_complications')
        .select('complications(name)')
        .eq('visit_id', visitId),
      
      // Get ESIC surgeons
      supabase
        .from('visit_esic_surgeons')
        .select('esic_surgeons(name)')
        .eq('visit_id', visitId),
      
      // Get referees
      supabase
        .from('visit_referees')
        .select('referees(name)')
        .eq('visit_id', visitId),
      
      // Get Hope surgeons
      supabase
        .from('visit_hope_surgeons')
        .select('hope_surgeons(name)')
        .eq('visit_id', visitId),
      
      // Get Hope consultants
      supabase
        .from('visit_hope_consultants')
        .select('hope_consultants(name)')
        .eq('visit_id', visitId)
    ]);

    interface ComplicationItem {
      complications?: { name: string };
    }
    
    interface EsicSurgeonItem {
      esic_surgeons?: { name: string };
    }
    
    interface RefereeItem {
      referees?: { name: string };
    }
    
    interface HopeSurgeonItem {
      hope_surgeons?: { name: string };
    }
    
    interface HopeConsultantItem {
      hope_consultants?: { name: string };
    }

    return {
      complications: (complicationsResult.data as ComplicationItem[])?.map(item => item.complications?.name).filter(Boolean) || [],
      esicSurgeons: (esicSurgeonsResult.data as EsicSurgeonItem[])?.map(item => item.esic_surgeons?.name).filter(Boolean) || [],
      referees: (refereesResult.data as RefereeItem[])?.map(item => item.referees?.name).filter(Boolean) || [],
      hopeSurgeons: (hopeSurgeonsResult.data as HopeSurgeonItem[])?.map(item => item.hope_surgeons?.name).filter(Boolean) || [],
      hopeConsultants: (hopeConsultantsResult.data as HopeConsultantItem[])?.map(item => item.hope_consultants?.name).filter(Boolean) || []
    };
  } catch (error) {
    console.error('Error fetching visit medical data:', error);
    return {
      complications: [],
      esicSurgeons: [],
      referees: [],
      hopeSurgeons: [],
      hopeConsultants: []
    };
  }
}

// Save medical data to junction tables
export async function saveVisitMedicalData(visitId: string, data: MedicalJunctionData) {
  try {
    console.log('Starting saveVisitMedicalData for visit:', visitId);
    console.log('Data to save:', data);
    
    // Clear existing data first
    console.log('Clearing existing junction data...');
    const clearResults = await Promise.all([
      supabase.from('visit_complications').delete().eq('visit_id', visitId),
      supabase.from('visit_esic_surgeons').delete().eq('visit_id', visitId),
      supabase.from('visit_referees').delete().eq('visit_id', visitId),
      supabase.from('visit_hope_surgeons').delete().eq('visit_id', visitId),
      supabase.from('visit_hope_consultants').delete().eq('visit_id', visitId)
    ]);
    
    // Check for delete errors
    clearResults.forEach((result, index) => {
      const tableNames = ['visit_complications', 'visit_esic_surgeons', 'visit_referees', 'visit_hope_surgeons', 'visit_hope_consultants'];
      if (result.error) {
        console.error(`Error clearing ${tableNames[index]}:`, result.error);
      } else {
        console.log(`Cleared ${tableNames[index]} successfully`);
      }
    });

    // Get IDs for the selected items
    console.log('Getting IDs for selected items...');
    const [
      complicationIds,
      esicSurgeonIds,
      refereeIds,
      hopeSurgeonIds,
      hopeConsultantIds
    ] = await Promise.all([
      getIdsByNames('complications', data.complications),
      getIdsByNames('esic_surgeons', data.esicSurgeons),
      getIdsByNames('referees', data.referees),
      getIdsByNames('hope_surgeons', data.hopeSurgeons),
      getIdsByNames('hope_consultants', data.hopeConsultants)
    ]);
    
    console.log('Retrieved IDs:', {
      complicationIds,
      esicSurgeonIds,
      refereeIds,
      hopeSurgeonIds,
      hopeConsultantIds
    });

    // Insert new data
    const insertPromises = [];

    if (complicationIds.length > 0) {
      insertPromises.push(
        supabase.from('visit_complications').insert(
          complicationIds.map(id => ({ visit_id: visitId, complication_id: id }))
        )
      );
    }

    if (esicSurgeonIds.length > 0) {
      insertPromises.push(
        supabase.from('visit_esic_surgeons').insert(
          esicSurgeonIds.map(id => ({ visit_id: visitId, surgeon_id: id }))
        )
      );
    }

    if (refereeIds.length > 0) {
      insertPromises.push(
        supabase.from('visit_referees').insert(
          refereeIds.map(id => ({ visit_id: visitId, referee_id: id }))
        )
      );
    }

    if (hopeSurgeonIds.length > 0) {
      insertPromises.push(
        supabase.from('visit_hope_surgeons').insert(
          hopeSurgeonIds.map(id => ({ visit_id: visitId, surgeon_id: id }))
        )
      );
    }

    if (hopeConsultantIds.length > 0) {
      insertPromises.push(
        supabase.from('visit_hope_consultants').insert(
          hopeConsultantIds.map(id => ({ visit_id: visitId, consultant_id: id }))
        )
      );
    }

    console.log('Executing insert promises...', insertPromises.length);
    const insertResults = await Promise.all(insertPromises);
    
    // Check for insert errors
    insertResults.forEach((result, index) => {
      if (result.error) {
        console.error(`Insert error at index ${index}:`, result.error);
      } else {
        console.log(`Insert successful at index ${index}:`, result.data?.length || 0, 'records');
      }
    });
    
    console.log('saveVisitMedicalData completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error saving visit medical data:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      visitId,
      data
    });
    return { success: false, error };
  }
}

// Helper function to get IDs by names
async function getIdsByNames(tableName: string, names: string[]): Promise<string[]> {
  if (names.length === 0) {
    console.log(`No names provided for ${tableName}, returning empty array`);
    return [];
  }
  
  try {
    console.log(`Getting IDs from ${tableName} for names:`, names);
    const { data, error } = await supabase
      .from(tableName)
      .select('id, name')
      .in('name', names);
    
    if (error) {
      console.error(`Supabase error for ${tableName}:`, error);
      throw error;
    }
    
    const ids = data?.map(item => item.id) || [];
    console.log(`Found ${ids.length} IDs for ${tableName}:`, ids);
    
    // Check for missing names
    const foundNames = data?.map(item => item.name) || [];
    const missingNames = names.filter(name => !foundNames.includes(name));
    if (missingNames.length > 0) {
      console.warn(`Missing names in ${tableName}:`, missingNames);
    }
    
    return ids;
  } catch (error) {
    console.error(`Error getting IDs for ${tableName}:`, error);
    console.error('Error details:', {
      message: error.message,
      tableName,
      names,
      stack: error.stack
    });
    return [];
  }
} 