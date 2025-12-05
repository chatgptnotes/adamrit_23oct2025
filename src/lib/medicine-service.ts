import { supabaseClient } from '@/utils/supabase-client';

export interface Medicine {
  id: string;
  medicine_name: string;
  generic_name?: string;
  manufacturer_id?: number;
  supplier_id?: number;
  quantity: number;
  tablets_pieces?: number;
  batch_number?: string;
  type?: string;
  purchase_price: number;
  selling_price: number;
  mrp_price: number;
  expiry_date?: string;
  hospital_name?: string;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ManufacturerCompany {
  id: number;
  name: string;
  created_at?: string;
}

export class MedicineService {
  /**
   * Search medicines by name or generic name
   */
  static async searchMedicines(searchTerm: string): Promise<Medicine[]> {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const { data, error } = await supabaseClient
      .from('medicine_master')
      .select('*')
      .eq('is_deleted', false)
      .or(`medicine_name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%`)
      .order('medicine_name', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Error searching medicines:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get all medicines (not deleted)
   */
  static async getAll(): Promise<Medicine[]> {
    const { data, error } = await supabaseClient
      .from('medicine_master')
      .select('*')
      .eq('is_deleted', false)
      .order('medicine_name', { ascending: true });

    if (error) {
      console.error('Error fetching medicines:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get medicine by ID
   */
  static async getById(id: string): Promise<Medicine | null> {
    const { data, error } = await supabaseClient
      .from('medicine_master')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error) {
      console.error('Error fetching medicine:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get manufacturer by ID
   */
  static async getManufacturerById(id: number): Promise<ManufacturerCompany | null> {
    const { data, error } = await supabaseClient
      .from('manufacturer_companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching manufacturer:', error);
      return null;
    }

    return data;
  }

  /**
   * Get medicines by supplier
   */
  static async getBySupplier(supplierId: number): Promise<Medicine[]> {
    const { data, error } = await supabaseClient
      .from('medicine_master')
      .select('*')
      .eq('is_deleted', false)
      .eq('supplier_id', supplierId)
      .order('medicine_name', { ascending: true });

    if (error) {
      console.error('Error fetching medicines by supplier:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get medicines expiring soon (within days)
   */
  static async getExpiringSoon(days: number = 30): Promise<Medicine[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabaseClient
      .from('medicine_master')
      .select('*')
      .eq('is_deleted', false)
      .lte('expiry_date', futureDate.toISOString())
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('Error fetching expiring medicines:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get low stock medicines
   */
  static async getLowStock(threshold: number = 10): Promise<Medicine[]> {
    const { data, error } = await supabaseClient
      .from('medicine_master')
      .select('*')
      .eq('is_deleted', false)
      .lte('quantity', threshold)
      .order('quantity', { ascending: true });

    if (error) {
      console.error('Error fetching low stock medicines:', error);
      throw error;
    }

    return data || [];
  }
}
