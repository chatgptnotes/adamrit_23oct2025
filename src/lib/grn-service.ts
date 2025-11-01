// Goods Received Note (GRN) Service
// Handles GRN creation, batch inventory management, and stock movements

import { supabaseClient } from '@/utils/supabase-client';
import type {
  GoodsReceivedNote,
  GRNItem,
  MedicineBatchInventory,
  CreateGRNPayload,
  AvailableBatch,
  BatchStockMovement,
} from '@/types/pharmacy';

// =====================================================
// GRN CREATION AND MANAGEMENT
// =====================================================

/**
 * Generate unique GRN number
 */
export async function generateGRNNumber(): Promise<string> {
  const prefix = 'GRN';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  // Get count of GRNs for this month
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const { count, error } = await supabaseClient
    .from('goods_received_notes')
    .select('*', { count: 'exact', head: true })
    .gte('grn_date', startOfMonth.toISOString());

  if (error) {
    console.error('Error generating GRN number:', error);
    throw error;
  }

  const sequence = ((count || 0) + 1).toString().padStart(4, '0');
  return `${prefix}${year}${month}${sequence}`;
}

/**
 * Create GRN from Purchase Order
 */
export async function createGRNFromPO(
  payload: CreateGRNPayload
): Promise<{ grn: GoodsReceivedNote; batch_inventories: MedicineBatchInventory[] }> {
  try {
    // Generate GRN number
    const grn_number = await generateGRNNumber();

    // Get PO details
    const { data: poData, error: poError } = await supabaseClient
      .from('purchase_orders')
      .select('po_number, supplier_id')
      .eq('id', payload.purchase_order_id)
      .single();

    if (poError) throw poError;

    // Calculate totals
    const total_items = payload.items.length;
    const total_quantity_ordered = payload.items.reduce((sum, item) => sum + item.ordered_quantity, 0);
    const total_quantity_received = payload.items.reduce((sum, item) => sum + item.received_quantity, 0);
    const total_amount = payload.items.reduce((sum, item) => {
      const itemAmount = item.received_quantity * item.purchase_price;
      const taxAmount = ((item.gst || 0) * itemAmount) / 100;
      return sum + itemAmount + taxAmount;
    }, 0);

    // 1. Create GRN header
    const { data: grnData, error: grnError } = await supabaseClient
      .from('goods_received_notes')
      .insert({
        grn_number,
        grn_date: payload.grn_date,
        purchase_order_id: payload.purchase_order_id,
        po_number: poData.po_number,
        supplier_id: poData.supplier_id,
        invoice_number: payload.invoice_number,
        invoice_date: payload.invoice_date,
        invoice_amount: payload.invoice_amount,
        total_items,
        total_quantity_ordered,
        total_quantity_received,
        total_amount,
        discount: payload.discount,
        status: 'DRAFT',
        notes: payload.notes,
        hospital_name: payload.hospital_name,
      })
      .select()
      .single();

    if (grnError) {
      console.error('Error creating GRN:', grnError);
      throw grnError;
    }

    // 2. Create GRN items ONLY (batch inventory will be created on POST)
    const batch_inventories: MedicineBatchInventory[] = [];

    for (const item of payload.items) {
      // Calculate accepted quantity
      const accepted_quantity = item.received_quantity - (item.rejected_quantity || 0);
      const tax_amount = ((item.gst || 0) * item.received_quantity * item.purchase_price) / 100;
      const amount = item.received_quantity * item.purchase_price + tax_amount;

      // Create GRN item (just save the details, don't add to inventory yet)
      const { data: grnItem, error: grnItemError } = await supabaseClient
        .from('grn_items')
        .insert({
          grn_id: grnData.id,
          purchase_order_item_id: item.purchase_order_item_id,
          medicine_id: item.medicine_id,
          product_name: item.product_name,
          manufacturer: item.manufacturer,
          pack: item.pack,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          manufacturing_date: item.manufacturing_date,
          ordered_quantity: item.ordered_quantity,
          received_quantity: item.received_quantity,
          accepted_quantity,
          rejected_quantity: item.rejected_quantity || 0,
          free_quantity: item.free_quantity || 0,
          purchase_price: item.purchase_price,
          sale_price: item.sale_price,
          mrp: item.mrp,
          gst: item.gst,
          sgst: item.sgst,
          cgst: item.cgst,
          tax_amount,
          amount,
          rack_number: item.rack_number,
          shelf_location: item.shelf_location,
        })
        .select()
        .single();

      if (grnItemError) {
        console.error('Error creating GRN item:', grnItemError);
        throw grnItemError;
      }

      // NOTE: Batch inventory creation moved to postGRN() function
      // Will be created only when GRN status changes from DRAFT → POSTED
    }

    // NOTE: PO status update moved to postGRN() function
    // Will be updated only when GRN is posted and inventory is added

    return { grn: grnData, batch_inventories };
  } catch (error) {
    console.error('Error in createGRNFromPO:', error);
    throw error;
  }
}

/**
 * Post GRN - Creates batch inventory and adds stock
 * This is the SUBMIT action that finalizes the GRN
 */
export async function postGRN(
  grn_id: string,
  verified_by?: string,
  discount?: number
): Promise<{ grn: GoodsReceivedNote; batch_inventories: MedicineBatchInventory[] }> {
  try {
    // 1. Get GRN details with items
    const { data: grnData, error: grnFetchError } = await supabaseClient
      .from('goods_received_notes')
      .select(`
        *,
        grn_items(*),
        purchase_order:purchase_orders(*)
      `)
      .eq('id', grn_id)
      .single();

    if (grnFetchError) throw grnFetchError;

    // Validate GRN status
    if (grnData.status === 'POSTED') {
      throw new Error('GRN is already posted');
    }

    const batch_inventories: MedicineBatchInventory[] = [];

    // 2. Create batch inventory for each item
    for (const item of grnData.grn_items) {
      const accepted_quantity = item.accepted_quantity || 0;

      if (accepted_quantity > 0) {
        // Check if batch inventory already exists for this GRN
        const { data: existingBatch } = await supabaseClient
          .from('medicine_batch_inventory')
          .select('id')
          .eq('grn_number', grnData.grn_number)
          .eq('batch_number', item.batch_number)
          .maybeSingle();

        if (existingBatch) {
          console.log(`Batch inventory already exists for GRN ${grnData.grn_number}, batch ${item.batch_number}`);
          // Fetch the existing batch to add to our return array
          const { data: existingFullBatch } = await supabaseClient
            .from('medicine_batch_inventory')
            .select('*')
            .eq('id', existingBatch.id)
            .single();

          if (existingFullBatch) {
            batch_inventories.push(existingFullBatch);
          }
          continue; // Skip creating duplicate
        }

        const { data: batchInventory, error: batchError } = await supabaseClient
          .from('medicine_batch_inventory')
          .insert({
            medicine_id: item.medicine_id,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date,
            manufacturing_date: item.manufacturing_date,
            received_quantity: accepted_quantity,
            current_stock: accepted_quantity + (item.free_quantity || 0),
            sold_quantity: 0,
            reserved_stock: 0,
            free_quantity: item.free_quantity || 0,
            purchase_price: item.purchase_price,
            selling_price: item.sale_price,
            mrp: item.mrp,
            gst: item.gst,
            sgst: item.sgst,
            cgst: item.cgst,
            gst_amount: item.tax_amount,
            purchase_order_id: grnData.purchase_order_id,
            supplier_id: grnData.supplier_id,
            grn_number: grnData.grn_number,
            grn_date: grnData.grn_date,
            rack_number: item.rack_number,
            shelf_location: item.shelf_location,
            hospital_name: grnData.hospital_name,
            is_active: true,
          })
          .select()
          .single();

        if (batchError) {
          console.error('Error creating batch inventory:', batchError);
          throw batchError;
        }

        batch_inventories.push(batchInventory);

        // Create stock movement record
        await supabaseClient.from('batch_stock_movements').insert({
          batch_inventory_id: batchInventory.id,
          medicine_id: item.medicine_id,
          batch_number: item.batch_number,
          movement_type: 'IN',
          reference_type: 'GRN',
          reference_id: grnData.id,
          reference_number: grnData.grn_number,
          quantity_before: 0,
          quantity_changed: accepted_quantity + (item.free_quantity || 0),
          quantity_after: accepted_quantity + (item.free_quantity || 0),
          reason: `Goods received via GRN ${grnData.grn_number}`,
          hospital_name: grnData.hospital_name,
        });
      }

      // Update purchase order item received quantity
      if (item.purchase_order_item_id) {
        const { data: poItem } = await supabaseClient
          .from('purchase_order_items')
          .select('received_quantity')
          .eq('id', item.purchase_order_item_id)
          .single();

        const newReceivedQty = (poItem?.received_quantity || 0) + item.received_quantity;

        await supabaseClient
          .from('purchase_order_items')
          .update({ received_quantity: newReceivedQty })
          .eq('id', item.purchase_order_item_id);
      }
    }

    // 3. Update Purchase Order status
    const { data: poItems } = await supabaseClient
      .from('purchase_order_items')
      .select('order_quantity, received_quantity')
      .eq('purchase_order_id', grnData.purchase_order_id);

    if (poItems) {
      const totalOrdered = poItems.reduce((sum, item) => sum + item.order_quantity, 0);
      const totalReceived = poItems.reduce((sum, item) => sum + (item.received_quantity || 0), 0);

      let newStatus = 'ORDERED';
      if (totalReceived === 0) {
        newStatus = 'ORDERED';
      } else if (totalReceived < totalOrdered) {
        newStatus = 'PARTIAL_RECEIVED';
      } else if (totalReceived >= totalOrdered) {
        newStatus = 'RECEIVED';
      }

      await supabaseClient
        .from('purchase_orders')
        .update({
          status: newStatus,
          actual_delivery_date: totalReceived >= totalOrdered ? grnData.grn_date : null,
        })
        .eq('id', grnData.purchase_order_id);
    }

    // 4. Update GRN status to POSTED
    const updateData: any = {
      status: 'POSTED',
      verified_at: new Date().toISOString(),
    };

    if (verified_by) {
      updateData.verified_by = verified_by;
    }

    if (discount !== undefined) {
      // Save discount as separate field
      updateData.discount = discount;
      // Recalculate total_amount with discount
      const newTotalAmount = grnData.total_amount - discount;
      updateData.total_amount = newTotalAmount;
      updateData.notes = grnData.notes
        ? `${grnData.notes}\nDiscount applied: ₹${discount}`
        : `Discount applied: ₹${discount}`;
    }

    const { data: updatedGRN, error: updateError } = await supabaseClient
      .from('goods_received_notes')
      .update(updateData)
      .eq('id', grn_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 5. Update Purchase Order status to Completed
    await supabaseClient
      .from('purchase_orders')
      .update({ status: 'Completed' })
      .eq('id', grnData.purchase_order_id);

    return { grn: updatedGRN, batch_inventories };
  } catch (error) {
    console.error('Error posting GRN:', error);
    throw error;
  }
}

/**
 * Verify and post GRN (Legacy - use postGRN instead)
 * @deprecated Use postGRN() for full workflow
 */
export async function verifyAndPostGRN(
  grn_id: string,
  verified_by: string
): Promise<GoodsReceivedNote> {
  try {
    const { data, error } = await supabaseClient
      .from('goods_received_notes')
      .update({
        status: 'POSTED',
        verified_by,
        verified_at: new Date().toISOString(),
      })
      .eq('id', grn_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error verifying GRN:', error);
    throw error;
  }
}

/**
 * Get GRN details with items
 */
export async function getGRNDetails(grn_id: string): Promise<GoodsReceivedNote> {
  try {
    const { data, error } = await supabaseClient
      .from('goods_received_notes')
      .select(
        `
        *,
        purchase_order:purchase_orders(*),
        grn_items(*)
      `
      )
      .eq('id', grn_id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching GRN details:', error);
    throw error;
  }
}

/**
 * List GRNs with filters
 */
export async function listGRNs(filters?: {
  status?: string;
  from_date?: string;
  to_date?: string;
  supplier_id?: number;
  hospital_name?: string;
}): Promise<GoodsReceivedNote[]> {
  try {
    let query = supabaseClient
      .from('goods_received_notes')
      .select(
        `
        *,
        purchase_order:purchase_orders(po_number)
      `
      )
      .order('grn_date', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.from_date) {
      query = query.gte('grn_date', filters.from_date);
    }

    if (filters?.to_date) {
      query = query.lte('grn_date', filters.to_date);
    }

    if (filters?.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }

    if (filters?.hospital_name) {
      query = query.eq('hospital_name', filters.hospital_name);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error listing GRNs:', error);
    throw error;
  }
}

// =====================================================
// BATCH INVENTORY QUERIES
// =====================================================

/**
 * Get available batches for a medicine (sorted by expiry - FEFO)
 */
export async function getAvailableBatches(
  medicine_id: string,
  hospital_name?: string
): Promise<AvailableBatch[]> {
  try {
    const { data, error } = await supabaseClient.rpc('get_available_batches', {
      p_medicine_id: medicine_id,
      p_hospital_name: hospital_name || null,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching available batches:', error);
    throw error;
  }
}

/**
 * Get batch inventory details
 */
export async function getBatchInventoryDetails(
  batch_id: string
): Promise<MedicineBatchInventory> {
  try {
    const { data, error } = await supabaseClient
      .from('medicine_batch_inventory')
      .select('*')
      .eq('id', batch_id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching batch inventory:', error);
    throw error;
  }
}

/**
 * Get all batches for a medicine
 */
export async function getMedicineBatches(
  medicine_id: string,
  include_expired: boolean = false
): Promise<MedicineBatchInventory[]> {
  try {
    let query = supabaseClient
      .from('medicine_batch_inventory')
      .select('*')
      .eq('medicine_id', medicine_id)
      .eq('is_active', true)
      .order('expiry_date', { ascending: true });

    if (!include_expired) {
      query = query.gt('expiry_date', new Date().toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching medicine batches:', error);
    throw error;
  }
}

/**
 * Get combined stock for a medicine (total across all batches)
 */
export async function getMedicineCombinedStock(medicine_id: string, hospital_name?: string) {
  try {
    let query = supabaseClient
      .from('v_medicine_combined_stock')
      .select('*')
      .eq('medicine_id', medicine_id);

    if (hospital_name) {
      query = query.eq('hospital_name', hospital_name);
    }

    const { data, error } = await query.single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching combined stock:', error);
    throw error;
  }
}

/**
 * Update batch stock (for sales/adjustments)
 */
export async function updateBatchStock(
  batch_id: string,
  quantity_change: number,
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'EXPIRY' | 'RETURN',
  reference_type: string,
  reference_id: string,
  reason?: string,
  performed_by?: string
): Promise<MedicineBatchInventory> {
  try {
    // Get current batch details
    const { data: batch, error: batchError } = await supabaseClient
      .from('medicine_batch_inventory')
      .select('*')
      .eq('id', batch_id)
      .single();

    if (batchError) throw batchError;

    const quantity_before = batch.current_stock;
    const quantity_after = quantity_before + quantity_change;

    // Validate stock availability for OUT movements
    if (movement_type === 'OUT' && quantity_after < 0) {
      throw new Error('Insufficient stock in batch');
    }

    // Update batch inventory
    const { data: updatedBatch, error: updateError } = await supabaseClient
      .from('medicine_batch_inventory')
      .update({
        current_stock: quantity_after,
        sold_quantity: movement_type === 'OUT' ? batch.sold_quantity - quantity_change : batch.sold_quantity,
      })
      .eq('id', batch_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create stock movement record
    await supabaseClient.from('batch_stock_movements').insert({
      batch_inventory_id: batch_id,
      medicine_id: batch.medicine_id,
      batch_number: batch.batch_number,
      movement_type,
      reference_type,
      reference_id,
      quantity_before,
      quantity_changed: quantity_change,
      quantity_after,
      reason,
      performed_by,
      hospital_name: batch.hospital_name,
    });

    return updatedBatch;
  } catch (error) {
    console.error('Error updating batch stock:', error);
    throw error;
  }
}

/**
 * Get batch stock movements (audit trail)
 */
export async function getBatchStockMovements(
  batch_id: string,
  limit: number = 50
): Promise<BatchStockMovement[]> {
  try {
    const { data, error } = await supabaseClient
      .from('batch_stock_movements')
      .select('*')
      .eq('batch_inventory_id', batch_id)
      .order('movement_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    throw error;
  }
}

/**
 * Get near-expiry batches
 */
export async function getNearExpiryBatches(
  days_threshold: number = 90,
  hospital_name?: string
): Promise<MedicineBatchInventory[]> {
  try {
    const threshold_date = new Date();
    threshold_date.setDate(threshold_date.getDate() + days_threshold);

    let query = supabaseClient
      .from('medicine_batch_inventory')
      .select('*')
      .eq('is_active', true)
      .gt('current_stock', 0)
      .lte('expiry_date', threshold_date.toISOString().split('T')[0])
      .gt('expiry_date', new Date().toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });

    if (hospital_name) {
      query = query.eq('hospital_name', hospital_name);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching near-expiry batches:', error);
    throw error;
  }
}

/**
 * Get expired batches
 */
export async function getExpiredBatches(hospital_name?: string): Promise<MedicineBatchInventory[]> {
  try {
    let query = supabaseClient
      .from('medicine_batch_inventory')
      .select('*')
      .eq('is_active', true)
      .lt('expiry_date', new Date().toISOString().split('T')[0])
      .order('expiry_date', { ascending: false });

    if (hospital_name) {
      query = query.eq('hospital_name', hospital_name);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching expired batches:', error);
    throw error;
  }
}

export const GRNService = {
  generateGRNNumber,
  createGRNFromPO,
  postGRN,
  verifyAndPostGRN,
  getGRNDetails,
  listGRNs,
  getAvailableBatches,
  getBatchInventoryDetails,
  getMedicineBatches,
  getMedicineCombinedStock,
  updateBatchStock,
  getBatchStockMovements,
  getNearExpiryBatches,
  getExpiredBatches,
};
