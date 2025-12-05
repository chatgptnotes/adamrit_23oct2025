
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface IdMappingResult {
  success: boolean;
  id?: string;
  error?: string;
}

interface TableData {
  id: string;
  name: string;
  [key: string]: unknown;
}

export const useIdMapping = () => {
  const [mappings, setMappings] = useState<Record<string, string>>({});

  const mapId = async (tableName: string, name: string): Promise<IdMappingResult> => {
    try {
      const query = supabase.from(tableName).select('id, name').eq('name', name).limit(1);
      
      const { data, error } = await query;
      
      if (error) {
        console.error(`Error mapping ID for ${tableName}:`, error);
        return { success: false, error: error.message };
      }
      
      if (data && data.length > 0) {
        const id = data[0].id;
        setMappings(prev => ({ ...prev, [`${tableName}:${name}`]: id }));
        return { success: true, id };
      }
      
      return { success: false, error: 'No matching record found' };
    } catch (error) {
      console.error(`Error in mapId for ${tableName}:`, error);
      return { success: false, error: 'Unknown error occurred' };
    }
  };

  const mapIdsForTable = async (tableName: string, names: string[]): Promise<Record<string, string>> => {
    const results: Record<string, string> = {};
    
    for (const name of names) {
      if (name.trim()) {
        const result = await mapId(tableName, name.trim());
        if (result.success && result.id) {
          results[name] = result.id;
        }
      }
    }
    
    return results;
  };

  const mapAllIds = async (data: Record<string, string[]>): Promise<Record<string, Record<string, string>>> => {
    const results: Record<string, Record<string, string>> = {};
    
    for (const [tableName, names] of Object.entries(data)) {
      if (names && names.length > 0) {
        const tableResults = await mapIdsForTable(tableName, names);
        results[tableName] = tableResults;
      }
    }
    
    return results;
  };

  const getTableConfig = (tableName: string): { selectFields: string; searchField: string } => {
    switch (tableName) {
      case 'diagnoses': {
        const config = { selectFields: 'id, name, code', searchField: 'name' };
        return config;
      }
      case 'complications': {
        const config = { selectFields: 'id, name, description', searchField: 'name' };
        return config;
      }
      case 'cghs_surgery': {
        const config = { selectFields: 'id, name, code, description', searchField: 'name' };
        return config;
      }
      case 'hope_surgery': {
        const config = { selectFields: 'id, name, code, description', searchField: 'name' };
        return config;
      }
      case 'lab': {
        const config = { selectFields: 'id, name, description, service_group', searchField: 'name' };
        return config;
      }
      case 'radiology': {
        const config = { selectFields: 'id, name, description, modality', searchField: 'name' };
        return config;
      }
      case 'medication': {
        const config = { selectFields: 'id, name, generic_name, dosage_form', searchField: 'name' };
        return config;
      }
      case 'esic_surgeons': {
        const config = { selectFields: 'id, name, specialty, department', searchField: 'name' };
        return config;
      }
      case 'hope_surgeons': {
        const config = { selectFields: 'id, name, specialty, department', searchField: 'name' };
        return config;
      }
      case 'hope_consultants': {
        const config = { selectFields: 'id, name, specialty, department', searchField: 'name' };
        return config;
      }
      case 'referees': {
        const config = { selectFields: 'id, name, specialty, institution', searchField: 'name' };
        return config;
      }
      default: {
        const config = { selectFields: 'id, name', searchField: 'name' };
        return config;
      }
    }
  };

  const searchTable = async (tableName: string, searchTerm: string): Promise<TableData[]> => {
    try {
      const config = getTableConfig(tableName);
      const query = supabase
        .from(tableName)
        .select(config.selectFields)
        .ilike(config.searchField, `%${searchTerm}%`)
        .limit(10);
      
      const { data, error } = await query;
      
      if (error) {
        console.error(`Error searching ${tableName}:`, error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error(`Error in searchTable for ${tableName}:`, error);
      return [];
    }
  };

  return {
    mapId,
    mapIdsForTable,
    mapAllIds,
    searchTable,
    mappings
  };
};
