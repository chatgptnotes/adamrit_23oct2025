import { supabaseClient } from '@/utils/supabase-client';

export interface PurchaseOrder {
  id: string;
  po_number: string;
  order_date: string;
  order_for?: string;
  supplier_id?: number;
  status?: string;
  notes?: string;
  subtotal?: number;
  tax_amount?: number;
  total_amount?: number;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  approved_by?: string;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
}

export class PurchaseOrderService {
  /**
   * Generate a unique PO number in format: PO/YY-SEQUENCE
   * Example: PO/25-18063
   */
  static async generatePONumber(): Promise<string> {
    try {
      // Get current year (last 2 digits)
      const currentYear = new Date().getFullYear().toString().slice(-2);

      // Get the latest PO number for the current year
      const { data, error } = await supabaseClient
        .from('purchase_orders')
        .select('po_number')
        .like('po_number', `PO/${currentYear}-%`)
        .order('po_number', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching latest PO number:', error);
        // If error or no records, start from 1
        return `PO/${currentYear}-10001`;
      }

      if (!data || data.length === 0) {
        // No PO for current year, start from 10001
        return `PO/${currentYear}-10001`;
      }

      // Extract sequence number from latest PO
      const latestPO = data[0].po_number;
      const match = latestPO.match(/PO\/\d{2}-(\d+)/);

      if (match) {
        const lastSequence = parseInt(match[1], 10);
        const newSequence = lastSequence + 1;
        return `PO/${currentYear}-${newSequence}`;
      }

      // Fallback if pattern doesn't match
      return `PO/${currentYear}-10001`;
    } catch (error) {
      console.error('Error generating PO number:', error);
      const currentYear = new Date().getFullYear().toString().slice(-2);
      return `PO/${currentYear}-10001`;
    }
  }

  /**
   * Get all purchase orders
   */
  static async getAll(): Promise<PurchaseOrder[]> {
    const { data, error } = await supabaseClient
      .from('purchase_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Create a new purchase order
   */
  static async create(purchaseOrder: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>): Promise<PurchaseOrder> {
    const { data, error } = await supabaseClient
      .from('purchase_orders')
      .insert([purchaseOrder])
      .select()
      .single();

    if (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get purchase order by ID
   */
  static async getById(id: string): Promise<PurchaseOrder | null> {
    const { data, error } = await supabaseClient
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching purchase order:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update a purchase order
   */
  static async update(id: string, purchaseOrder: Partial<Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>>): Promise<PurchaseOrder> {
    const { data, error } = await supabaseClient
      .from('purchase_orders')
      .update({ ...purchaseOrder, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating purchase order:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a purchase order
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabaseClient
      .from('purchase_orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting purchase order:', error);
      throw error;
    }
  }

  /**
   * Search purchase orders by PO number or supplier
   */
  static async search(searchTerm: string): Promise<PurchaseOrder[]> {
    const { data, error } = await supabaseClient
      .from('purchase_orders')
      .select('*')
      .or(`po_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching purchase orders:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get purchase orders by status
   */
  static async getByStatus(status: string): Promise<PurchaseOrder[]> {
    const { data, error } = await supabaseClient
      .from('purchase_orders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase orders by status:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Create purchase order with items and update medicine inventory
   */
  static async createWithItems(
    poData: {
      po_number: string;
      order_date: string;
      order_for: string;
      supplier_id: number;
      subtotal: number;
      tax_amount: number;
      total_amount: number;
    },
    items: Array<{
      medicine_id?: string;
      product_name: string;
      manufacturer: string;
      pack: string;
      batch_no: string;
      mrp: number;
      sale_price: number;
      purchase_price: number;
      tax: number;
      order_qty: number;
      vat_amt: number;
      amount: number;
    }>
  ): Promise<{ po: PurchaseOrder; items: any[] }> {
    try {
      // 1. Create purchase order header
      const { data: poResult, error: poError } = await supabaseClient
        .from('purchase_orders')
        .insert([{
          po_number: poData.po_number,
          order_date: poData.order_date,
          order_for: poData.order_for,
          supplier_id: poData.supplier_id,
          status: 'Pending',
          subtotal: poData.subtotal,
          tax_amount: poData.tax_amount,
          total_amount: poData.total_amount,
        }])
        .select()
        .single();

      if (poError) {
        console.error('Error creating purchase order:', poError);
        throw poError;
      }

      // 2. Create purchase order items
      const itemsToInsert = items.map(item => ({
        purchase_order_id: poResult.id,
        medicine_id: item.medicine_id,
        product_name: item.product_name,
        manufacturer: item.manufacturer,
        pack: item.pack,
        batch_no: item.batch_no,
        mrp: item.mrp,
        sale_price: item.sale_price,
        purchase_price: item.purchase_price,
        tax_percentage: item.tax,
        tax_amount: item.vat_amt,
        order_quantity: item.order_qty,
        amount: item.amount,
      }));

      const { data: itemsResult, error: itemsError } = await supabaseClient
        .from('purchase_order_items')
        .insert(itemsToInsert)
        .select();

      if (itemsError) {
        console.error('Error creating purchase order items:', itemsError);
        throw itemsError;
      }

      // 3. Update medicine inventory quantities
      for (const item of items) {
        if (item.medicine_id) {
          // Increment the quantity in medicine_master
          const { error: updateError } = await supabaseClient.rpc(
            'increment_medicine_quantity',
            {
              medicine_id: item.medicine_id,
              qty_to_add: item.order_qty
            }
          );

          // Fallback: If RPC doesn't exist, use direct update
          if (updateError) {
            console.warn('RPC not found, using direct update:', updateError);

            // Get current quantity
            const { data: currentMed, error: fetchError } = await supabaseClient
              .from('medicine_master')
              .select('quantity')
              .eq('id', item.medicine_id)
              .single();

            if (!fetchError && currentMed) {
              const newQuantity = (currentMed.quantity || 0) + item.order_qty;

              const { error: directUpdateError } = await supabaseClient
                .from('medicine_master')
                .update({
                  quantity: newQuantity,
                  updated_at: new Date().toISOString()
                })
                .eq('id', item.medicine_id);

              if (directUpdateError) {
                console.error('Error updating medicine quantity:', directUpdateError);
              }
            }
          }
        }
      }

      return {
        po: poResult,
        items: itemsResult || [],
      };
    } catch (error) {
      console.error('Error in createWithItems:', error);
      throw error;
    }
  }
}
