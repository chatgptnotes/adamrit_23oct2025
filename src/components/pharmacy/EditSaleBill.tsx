import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';

interface SaleItem {
  sale_item_id: number;
  medication_name: string;
  generic_name?: string;
  quantity: number;
  pack?: string;
  pack_size?: number;
  administration_time?: string;
  batch_number: string;
  expiry_date: string;
  mrp: number;
  unit_price: number;
  discount_percentage: number;
  total_amount: number;
}

interface Sale {
  sale_id: number;
  patient_id: string;
  patient_name: string;
  sale_date: string;
  subtotal: number;
  discount: number;
  tax_gst: number;
  total_amount: number;
  payment_method: string;
  ward_type?: string;
  sale_type?: string;
  visit_id?: string;
  doctor_name?: string;
}

export const EditSaleBill: React.FC = () => {
  const { saleId } = useParams<{ saleId: string }>();
  const navigate = useNavigate();
  const { hospitalConfig } = useAuth();

  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [billDate, setBillDate] = useState<string>('');
  const [deletedItemIds, setDeletedItemIds] = useState<number[]>([]);

  useEffect(() => {
    fetchSaleData();
  }, [saleId]);

  const fetchSaleData = async () => {
    if (!saleId) return;

    // Fetch sale details (with hospital filter)
    let saleQuery = supabase
      .from('pharmacy_sales')
      .select('*')
      .eq('sale_id', parseInt(saleId));

    // Filter by hospital
    if (hospitalConfig?.name) {
      saleQuery = saleQuery.eq('hospital_name', hospitalConfig.name);
    }

    const { data: saleData, error: saleError } = await saleQuery.single();

    if (saleError) {
      console.error('Error fetching sale:', saleError);
      return;
    }

    setSale(saleData);

    // Initialize billDate from sale data
    if (saleData.sale_date) {
      setBillDate(new Date(saleData.sale_date).toISOString().split('T')[0]);
    }

    // Fetch sale items
    const { data: itemsData, error: itemsError } = await supabase
      .from('pharmacy_sale_items')
      .select('*')
      .eq('sale_id', parseInt(saleId));

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      return;
    }

    setItems(itemsData || []);
    setLoading(false);
  };

  const updateItem = (itemId: number, field: string, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.sale_item_id === itemId) {
        const updated = { ...item, [field]: value };

        // Recalculate total if quantity or price changed
        if (field === 'quantity' || field === 'unit_price' || field === 'discount_percentage') {
          const subtotal = updated.unit_price * updated.quantity;
          const discount = (subtotal * updated.discount_percentage) / 100;
          updated.total_amount = subtotal - discount;
        }

        return updated;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + ((item.unit_price || 0) * (item.quantity || 0)), 0);
    const totalDiscount = items.reduce((sum, item) => sum + (((item.unit_price || 0) * (item.quantity || 0) * (item.discount_percentage || 0)) / 100), 0);
    const totalAmount = subtotal - totalDiscount;
    return { subtotal, totalDiscount, totalAmount };
  };

  const removeItem = (itemId: number) => {
    // Track deletion for existing items (not temporary new ones)
    const isExistingItem = itemId < Date.now() - 3600000;
    if (isExistingItem) {
      setDeletedItemIds(prev => [...prev, itemId]);
    }
    setItems(prev => prev.filter(item => item.sale_item_id !== itemId));
  };

  const handleSubmit = async () => {
    if (!sale) return;

    const totals = calculateTotals();

    // Delete removed items from database
    for (const itemId of deletedItemIds) {
      const { error: deleteError } = await supabase
        .from('pharmacy_sale_items')
        .delete()
        .eq('sale_item_id', itemId);

      if (deleteError) {
        console.error('Error deleting item:', deleteError);
      }
    }

    // Update sale
    const { error: saleError } = await supabase
      .from('pharmacy_sales')
      .update({
        subtotal: totals.subtotal,
        discount: totals.totalDiscount,
        total_amount: totals.totalAmount,
        sale_date: billDate,
        updated_at: new Date().toISOString()
      })
      .eq('sale_id', sale.sale_id);

    if (saleError) {
      alert('Error updating sale: ' + saleError.message);
      return;
    }

    // Update or insert items
    for (const item of items) {
      // Check if item is new (has temporary ID > current timestamp - 1 hour)
      const isNewItem = item.sale_item_id > Date.now() - 3600000;

      if (isNewItem) {
        // Insert new item
        const { error: insertError } = await supabase
          .from('pharmacy_sale_items')
          .insert({
            sale_id: sale.sale_id,
            medication_id: (item as any).medication_id || item.sale_item_id.toString(),
            medication_name: item.medication_name,
            generic_name: item.generic_name,
            quantity: item.quantity,
            pack_size: 1,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date,
            mrp: item.mrp,
            unit_price: item.unit_price,
            discount_percentage: item.discount_percentage,
            total_amount: item.total_amount
          });

        if (insertError) {
          console.error('Error inserting new item:', insertError);
        }
      } else {
        // Update existing item
        const { error: updateError } = await supabase
          .from('pharmacy_sale_items')
          .update({
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percentage: item.discount_percentage,
            total_amount: item.total_amount,
            administration_time: item.administration_time,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date
          })
          .eq('sale_item_id', item.sale_item_id);

        if (updateError) {
          console.error('Error updating item:', updateError);
        }
      }
    }

    alert('Sale bill updated successfully!');
    navigate('/pharmacy');
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const totals = calculateTotals();

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!sale) {
    return <div className="p-4">Sale not found</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Edit Sale Bill</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/pharmacy?tab=view_sales&saleId=${saleId}`)}>Back</Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </div>
      </div>

      {/* Sale Information */}
      <div className="bg-white border rounded mb-4">
        <h3 className="text-lg font-semibold bg-gray-100 p-3 border-b">Sale Information</h3>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium">Patient Name / ID</label>
              <Input
                value={`${sale.patient_name} (${sale.patient_id})`}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center space-x-2 pb-2">
                <input type="checkbox" className="rounded" readOnly />
                <span className="text-sm font-medium">All Encounter</span>
              </label>
              <span className="text-sm pb-2">{sale.ward_type || '(Private) - OPD'}</span>
            </div>
            <div>
              <label className="text-sm font-medium">Doctor Name</label>
              <Input
                value={sale.doctor_name || 'N/A'}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bill Date</label>
              <Input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Sale Type</label>
              <Input
                value={sale.sale_type || 'Other'}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Patient ID</label>
              <Input
                value={sale.patient_id}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Visit ID</label>
              <Input
                value={sale.visit_id || 'N/A'}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Item List</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Quantity (MSU)</TableHead>
                <TableHead>Pack</TableHead>
                <TableHead>Administration Time</TableHead>
                <TableHead>Batch No.</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>MRP</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>#</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.sale_item_id}>
                  <TableCell>
                    <div className="font-medium">{item.medication_name}</div>
                    <div className="text-xs text-gray-500">{item.generic_name}</div>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.pack_size || item.pack || '-'}</TableCell>
                  <TableCell>{item.administration_time || '-'}</TableCell>
                  <TableCell>{item.batch_number || '-'}</TableCell>
                  <TableCell>{item.expiry_date || '-'}</TableCell>
                  <TableCell>{formatCurrency(item.mrp || 0)}</TableCell>
                  <TableCell>{formatCurrency(item.unit_price || 0)}</TableCell>
                  <TableCell>{formatCurrency((item.unit_price || 0) * (item.quantity || 0))}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-100"
                      onClick={() => removeItem(item.sale_item_id)}
                    >
                      ✕
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-gray-100 p-4 rounded">
        <div className="grid grid-cols-3 gap-4 max-w-xl ml-auto">
          <div>
            <label className="text-sm font-medium">Total Amount</label>
            <Input value={formatCurrency(totals.subtotal || 0)} readOnly />
          </div>
          <div>
            <label className="text-sm font-medium">Net Amount</label>
            <Input value={formatCurrency(totals.totalAmount || 0)} readOnly />
          </div>
          <div>
            <label className="text-sm font-medium">Payment Mode</label>
            <select className="border rounded p-2 w-full">
              <option value="Cash">{sale.payment_method || 'Cash'}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSaleBill;
