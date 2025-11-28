import { supabaseClient } from '@/utils/supabase-client';

export interface ManufacturerCompany {
  id: number;
  name: string;
  created_at?: string;
}

export class ManufacturerService {
  // Get all manufacturers
  static async getAll(): Promise<ManufacturerCompany[]> {
    const { data, error } = await supabaseClient
      .from('manufacturer_companies')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching manufacturers:', error);
      throw error;
    }

    return data || [];
  }

  // Add a new manufacturer
  static async create(name: string): Promise<ManufacturerCompany> {
    const { data, error } = await supabaseClient
      .from('manufacturer_companies')
      .insert([{ name }])
      .select()
      .single();

    if (error) {
      console.error('Error creating manufacturer:', error);
      throw error;
    }

    return data;
  }

  // Update a manufacturer
  static async update(id: number, name: string): Promise<ManufacturerCompany> {
    const { data, error } = await supabaseClient
      .from('manufacturer_companies')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating manufacturer:', error);
      throw error;
    }

    return data;
  }

  // Delete a manufacturer
  static async delete(id: number): Promise<void> {
    const { error } = await supabaseClient
      .from('manufacturer_companies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting manufacturer:', error);
      throw error;
    }
  }

  // Search manufacturers by name
  static async search(searchTerm: string): Promise<ManufacturerCompany[]> {
    const { data, error } = await supabaseClient
      .from('manufacturer_companies')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error searching manufacturers:', error);
      throw error;
    }

    return data || [];
  }
}
