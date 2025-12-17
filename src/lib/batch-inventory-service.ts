import { supabase } from "@/integrations/supabase/client";

// ==================== INTERFACES ====================

export interface BatchFilters {
  expiry_status?: 'EXPIRED' | 'EXPIRING_SOON' | 'NEAR_EXPIRY' | 'GOOD';
  has_stock?: boolean;
  supplier_id?: number;
  medicine_id?: string;
  search_term?: string;
  from_date?: string;
  to_date?: string;
}

export interface StockAdjustment {
  batch_id: string;
  adjustment_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'EXPIRY';
  quantity: number;
  reason: string;
  performed_by?: string;
  reference_type?: string;
  reference_id?: string;
}

export interface BatchAllocation {
  batch_id: string;
  batch_number: string;
  allocated_quantity: number;
  remaining_stock: number;
  expiry_date: string;
  selling_price: number;
}

export interface BatchSummary {
  medicine_id: string;
  medicine_name: string;
  total_batches: number;
  total_stock: number;
  total_value: number;
  expired_batches: number;
  near_expiry_batches: number;
  oldest_batch_expiry: string | null;
  newest_batch_expiry: string | null;
}

export interface BatchAlert {
  id: string;
  batch_id: string;
  medicine_name: string;
  batch_number: string;
  alert_type: 'EXPIRED' | 'EXPIRING_SOON' | 'LOW_STOCK' | 'NEAR_EXPIRY';
  expiry_date?: string;
  days_to_expiry?: number;
  current_stock: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// ==================== CORE BATCH OPERATIONS ====================

/**
 * Get all batches for a medicine with optional filters
 */
export async function getMedicineBatches(
  medicine_id: string,
  hospital_name: string,
  filters?: BatchFilters
) {
  try {
    let query = supabase
      .from('medicine_batch_inventory')
      .select(`
        *,
        medication:medicine_id (
          product_name,
          generic,
          manufacturer
        )
      `)
      .eq('medicine_id', medicine_id)
      .eq('hospital_name', hospital_name)
      .eq('is_active', true)
      .order('expiry_date', { ascending: true });

    // Apply filters
    if (filters?.has_stock) {
      query = query.gt('current_stock', 0);
    }

    if (filters?.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }

    if (filters?.from_date) {
      query = query.gte('manufacturing_date', filters.from_date);
    }

    if (filters?.to_date) {
      query = query.lte('expiry_date', filters.to_date);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching medicine batches:', error);
    throw error;
  }
}

/**
 * Get all batch inventory with details (uses view)
 */
export async function getAllBatchInventory(
  hospital_name: string,
  filters?: BatchFilters
) {
  try {
    let query = supabase
      .from('v_batch_stock_details')
      .select('*')
      .eq('hospital_name', hospital_name)
      .order('expiry_date', { ascending: true });

    // Apply filters
    if (filters?.expiry_status) {
      query = query.eq('expiry_status', filters.expiry_status);
    }

    if (filters?.has_stock) {
      query = query.gt('current_stock', 0);
    }

    if (filters?.search_term) {
      query = query.or(`medicine_name.ilike.%${filters.search_term}%,batch_number.ilike.%${filters.search_term}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching batch inventory:', error);
    throw error;
  }
}

/**
 * Get batch inventory summary for a medicine
 */
export async function getMedicineBatchSummary(
  medicine_id: string,
  hospital_name: string
): Promise<BatchSummary | null> {
  try {
    const { data, error } = await supabase
      .from('medicine_batch_inventory')
      .select(`
        current_stock,
        mrp,
        expiry_date,
        is_expired,
        medication:medicine_id (
          product_name
        )
      `)
      .eq('medicine_id', medicine_id)
      .eq('hospital_name', hospital_name)
      .eq('is_active', true);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const now = new Date();
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const summary: BatchSummary = {
      medicine_id,
      medicine_name: data[0].medication?.product_name || 'Unknown',
      total_batches: data.length,
      total_stock: data.reduce((sum, batch) => sum + (batch.current_stock || 0), 0),
      total_value: data.reduce((sum, batch) => sum + ((batch.current_stock || 0) * (batch.mrp || 0)), 0),
      expired_batches: data.filter(batch => batch.is_expired).length,
      near_expiry_batches: data.filter(batch => {
        if (!batch.expiry_date) return false;
        const expiryDate = new Date(batch.expiry_date);
        return expiryDate <= ninetyDaysFromNow && expiryDate > now;
      }).length,
      oldest_batch_expiry: data.length > 0 ? data[0].expiry_date : null,
      newest_batch_expiry: data.length > 0 ? data[data.length - 1].expiry_date : null,
    };

    return summary;
  } catch (error) {
    console.error('Error fetching medicine batch summary:', error);
    throw error;
  }
}

/**
 * Adjust batch stock with audit trail
 */
export async function adjustBatchStock(adjustment: StockAdjustment, hospital_name: string) {
  try {
    // Get current batch stock
    const { data: batchData, error: fetchError } = await supabase
      .from('medicine_batch_inventory')
      .select('current_stock, sold_quantity')
      .eq('id', adjustment.batch_id)
      .single();

    if (fetchError) throw fetchError;
    if (!batchData) throw new Error('Batch not found');

    const currentStock = batchData.current_stock || 0;
    const soldQuantity = batchData.sold_quantity || 0;

    // Calculate new stock based on adjustment type
    let newStock = currentStock;
    let newSoldQuantity = soldQuantity;
    let quantityChange = adjustment.quantity;

    switch (adjustment.adjustment_type) {
      case 'IN':
      case 'ADJUSTMENT':
        newStock = currentStock + adjustment.quantity;
        break;
      case 'OUT':
        if (currentStock < adjustment.quantity) {
          throw new Error('Insufficient stock for this adjustment');
        }
        newStock = currentStock - adjustment.quantity;
        newSoldQuantity = soldQuantity + adjustment.quantity;
        quantityChange = -adjustment.quantity;
        break;
      case 'DAMAGE':
      case 'EXPIRY':
        if (currentStock < adjustment.quantity) {
          throw new Error('Insufficient stock for this adjustment');
        }
        newStock = currentStock - adjustment.quantity;
        quantityChange = -adjustment.quantity;
        break;
    }

    // Update batch stock
    const { error: updateError } = await supabase
      .from('medicine_batch_inventory')
      .update({
        current_stock: newStock,
        sold_quantity: newSoldQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adjustment.batch_id);

    if (updateError) throw updateError;

    // Create stock movement record
    const { error: movementError } = await supabase
      .from('batch_stock_movements')
      .insert({
        batch_inventory_id: adjustment.batch_id,
        movement_type: adjustment.adjustment_type,
        reference_type: adjustment.reference_type || 'ADJUSTMENT',
        reference_id: adjustment.reference_id,
        quantity_before: currentStock,
        quantity_changed: quantityChange,
        quantity_after: newStock,
        reason: adjustment.reason,
        performed_by: adjustment.performed_by,
        movement_date: new Date().toISOString(),
        hospital_name: hospital_name,
      });

    if (movementError) throw movementError;

    return { success: true, newStock };
  } catch (error) {
    console.error('Error adjusting batch stock:', error);
    throw error;
  }
}

/**
 * Get stock movement history for a batch
 */
export async function getBatchMovementHistory(batch_id: string) {
  try {
    const { data, error } = await supabase
      .from('batch_stock_movements')
      .select('*')
      .eq('batch_inventory_id', batch_id)
      .order('movement_date', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching batch movement history:', error);
    throw error;
  }
}

/**
 * Get near expiry alerts
 */
export async function getNearExpiryAlerts(
  hospital_name: string,
  days_threshold: number = 90
): Promise<BatchAlert[]> {
  try {
    const { data, error } = await supabase
      .from('v_batch_stock_details')
      .select('*')
      .eq('hospital_name', hospital_name)
      .gt('current_stock', 0)
      .in('expiry_status', ['EXPIRED', 'EXPIRING_SOON', 'NEAR_EXPIRY'])
      .order('days_to_expiry', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    // Transform to alert format
    const alerts: BatchAlert[] = data.map(batch => {
      let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      let alert_type: 'EXPIRED' | 'EXPIRING_SOON' | 'LOW_STOCK' | 'NEAR_EXPIRY' = 'NEAR_EXPIRY';

      if (batch.expiry_status === 'EXPIRED') {
        severity = 'CRITICAL';
        alert_type = 'EXPIRED';
      } else if (batch.expiry_status === 'EXPIRING_SOON') {
        severity = 'HIGH';
        alert_type = 'EXPIRING_SOON';
      } else if (batch.expiry_status === 'NEAR_EXPIRY') {
        severity = 'MEDIUM';
        alert_type = 'NEAR_EXPIRY';
      }

      return {
        id: batch.id,
        batch_id: batch.id,
        medicine_name: batch.medicine_name || 'Unknown',
        batch_number: batch.batch_number || 'N/A',
        alert_type,
        expiry_date: batch.expiry_date,
        days_to_expiry: batch.days_to_expiry,
        current_stock: batch.current_stock || 0,
        severity,
      };
    });

    return alerts;
  } catch (error) {
    console.error('Error fetching near expiry alerts:', error);
    throw error;
  }
}

/**
 * Get low stock alerts
 */
export async function getLowStockAlerts(hospital_name: string): Promise<BatchAlert[]> {
  try {
    // For low stock, we need to aggregate by medicine and check against minimum stock
    const { data: medicines, error } = await supabase
      .from('v_medicine_combined_stock')
      .select(`
        *,
        medication:medicine_id (
          product_name,
          minimum_stock
        )
      `)
      .eq('hospital_name', hospital_name);

    if (error) throw error;
    if (!medicines) return [];

    const alerts: BatchAlert[] = [];

    for (const medicine of medicines) {
      const minStock = medicine.medication?.minimum_stock || 0;
      const currentStock = medicine.total_stock || 0;

      if (minStock > 0 && currentStock <= minStock) {
        let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';

        if (currentStock === 0) {
          severity = 'CRITICAL';
        } else if (currentStock <= minStock * 0.5) {
          severity = 'HIGH';
        }

        alerts.push({
          id: medicine.medicine_id,
          batch_id: medicine.medicine_id,
          medicine_name: medicine.medication?.product_name || 'Unknown',
          batch_number: `${medicine.batch_count} batch(es)`,
          alert_type: 'LOW_STOCK',
          current_stock: currentStock,
          severity,
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    throw error;
  }
}

/**
 * Mark batch as expired
 */
export async function markBatchExpired(batch_id: string, reason: string, performed_by?: string) {
  try {
    const { error } = await supabase
      .from('medicine_batch_inventory')
      .update({
        is_expired: true,
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batch_id);

    if (error) throw error;

    // Create movement record
    const { data: batchData } = await supabase
      .from('medicine_batch_inventory')
      .select('current_stock, hospital_name')
      .eq('id', batch_id)
      .single();

    if (batchData && batchData.current_stock > 0) {
      await supabase
        .from('batch_stock_movements')
        .insert({
          batch_inventory_id: batch_id,
          movement_type: 'EXPIRY',
          reference_type: 'ADJUSTMENT',
          quantity_before: batchData.current_stock,
          quantity_changed: -batchData.current_stock,
          quantity_after: 0,
          reason: reason,
          performed_by: performed_by,
          movement_date: new Date().toISOString(),
          hospital_name: batchData.hospital_name,
        });

      // Set stock to 0
      await supabase
        .from('medicine_batch_inventory')
        .update({ current_stock: 0 })
        .eq('id', batch_id);
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking batch as expired:', error);
    throw error;
  }
}

/**
 * Allocate stock for sale using FEFO (First Expiry First Out)
 */
export async function allocateStockForSale(
  medicine_id: string,
  required_quantity: number,
  hospital_name: string
): Promise<BatchAllocation[]> {
  try {
    // Get available batches using the database function
    const { data, error } = await supabase
      .rpc('get_available_batches', {
        p_medicine_id: medicine_id,
        p_hospital_name: hospital_name
      });

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('No available batches for this medicine');
    }

    const allocations: BatchAllocation[] = [];
    let remainingQuantity = required_quantity;

    // Allocate from batches (FEFO sorted)
    for (const batch of data) {
      if (remainingQuantity <= 0) break;

      const availableInBatch = batch.available_stock;
      const allocateFromThisBatch = Math.min(remainingQuantity, availableInBatch);

      allocations.push({
        batch_id: batch.batch_id,
        batch_number: batch.batch_number,
        allocated_quantity: allocateFromThisBatch,
        remaining_stock: availableInBatch - allocateFromThisBatch,
        expiry_date: batch.expiry_date,
        selling_price: batch.selling_price || batch.mrp,
      });

      remainingQuantity -= allocateFromThisBatch;
    }

    if (remainingQuantity > 0) {
      throw new Error(`Insufficient stock. Required: ${required_quantity}, Available: ${required_quantity - remainingQuantity}`);
    }

    return allocations;
  } catch (error) {
    console.error('Error allocating stock for sale:', error);
    throw error;
  }
}

/**
 * Transfer stock between batches
 */
export async function transferStock(
  from_batch_id: string,
  to_batch_id: string,
  quantity: number,
  reason: string,
  hospital_name: string,
  performed_by?: string
) {
  try {
    // Deduct from source batch
    await adjustBatchStock({
      batch_id: from_batch_id,
      adjustment_type: 'OUT',
      quantity: quantity,
      reason: `Transfer out: ${reason}`,
      performed_by,
      reference_type: 'TRANSFER',
      reference_id: to_batch_id,
    }, hospital_name);

    // Add to destination batch
    await adjustBatchStock({
      batch_id: to_batch_id,
      adjustment_type: 'IN',
      quantity: quantity,
      reason: `Transfer in: ${reason}`,
      performed_by,
      reference_type: 'TRANSFER',
      reference_id: from_batch_id,
    }, hospital_name);

    return { success: true };
  } catch (error) {
    console.error('Error transferring stock:', error);
    throw error;
  }
}

// ==================== OPENING STOCK ====================

export interface OpeningStockData {
  medicine_id: string;
  batch_number: string;
  quantity: number;
  expiry_date: string;
  manufacturing_date?: string;
  purchase_price?: number;
  mrp?: number;
  selling_price?: number;
  rack_number?: string;
  shelf_location?: string;
  hospital_name: string;
  performed_by?: string;
}

/**
 * Add opening stock for existing medicines (bypasses PO/GRN flow)
 * Creates a new batch inventory record and audit trail
 */
export async function addOpeningStock(data: OpeningStockData) {
  try {
    // Create batch inventory record
    const { data: batchData, error: batchError } = await supabase
      .from('medicine_batch_inventory')
      .insert({
        medicine_id: data.medicine_id,
        batch_number: data.batch_number,
        expiry_date: data.expiry_date,
        manufacturing_date: data.manufacturing_date || null,
        received_quantity: data.quantity,
        current_stock: data.quantity,
        sold_quantity: 0,
        reserved_stock: 0,
        damaged_stock: 0,
        purchase_price: data.purchase_price || 0,
        mrp: data.mrp || 0,
        selling_price: data.selling_price || 0,
        rack_number: data.rack_number || null,
        shelf_location: data.shelf_location || null,
        hospital_name: data.hospital_name,
        is_active: true,
        is_expired: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (batchError) throw batchError;

    // Create stock movement audit record
    const { error: movementError } = await supabase
      .from('batch_stock_movements')
      .insert({
        batch_inventory_id: batchData.id,
        movement_type: 'IN',
        reference_type: 'OPENING_STOCK',
        quantity_before: 0,
        quantity_changed: data.quantity,
        quantity_after: data.quantity,
        reason: 'Opening Stock Entry',
        performed_by: data.performed_by || null,
        movement_date: new Date().toISOString(),
        hospital_name: data.hospital_name,
      });

    if (movementError) {
      console.error('Error creating stock movement record:', movementError);
      // Don't throw here - batch was created successfully
    }

    return { success: true, batch: batchData };
  } catch (error) {
    console.error('Error adding opening stock:', error);
    throw error;
  }
}
