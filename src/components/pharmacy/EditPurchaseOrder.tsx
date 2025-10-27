import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PurchaseOrderService, PurchaseOrder } from '@/lib/purchase-order-service';
import { SupplierService, Supplier } from '@/lib/supplier-service';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Package } from 'lucide-react';

interface EditPurchaseOrderProps {
  purchaseOrderId: string;
  onBack?: () => void;
}

interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  medicine_id?: string;
  product_name: string;
  manufacturer: string;
  pack: string;
  batch_no: string;
  expiry_date?: string;
  mrp: number;
  sale_price: number;
  purchase_price: number;
  tax_percentage: number;
  tax_amount: number;
  order_quantity: number;
  received_quantity?: number;
  amount: number;
  gst?: number;
  sgst?: number;
  cgst?: number;
  gst_amount?: number;
}

const EditPurchaseOrder: React.FC<EditPurchaseOrderProps> = ({ purchaseOrderId, onBack }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // PO Header Data
  const [poData, setPoData] = useState<PurchaseOrder | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // PO Items Data
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);

  // Form state
  const [partyInvoiceNumber, setPartyInvoiceNumber] = useState('');
  const [goodsReceivedDate, setGoodsReceivedDate] = useState('');
  const [discount, setDiscount] = useState<number>(0);

  useEffect(() => {
    fetchPurchaseOrder();
  }, [purchaseOrderId]);

  const fetchPurchaseOrder = async () => {
    try {
      setIsLoading(true);

      // Fetch PO header, items, and suppliers in parallel
      const [poHeader, poItems, suppliersData] = await Promise.all([
        PurchaseOrderService.getById(purchaseOrderId),
        PurchaseOrderService.getPurchaseOrderItems(purchaseOrderId),
        SupplierService.getAll(),
      ]);

      setPoData(poHeader);
      setItems(poItems);
      setSuppliers(suppliersData);

      // Load discount value from database
      setDiscount(poHeader.discount || 0);

      // Set current date for goods received date
      const now = new Date();
      const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setGoodsReceivedDate(formattedDate);
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to load purchase order',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Recalculate amounts if quantity or price changes
    if (['order_quantity', 'received_quantity', 'purchase_price', 'tax_percentage', 'mrp', 'sale_price'].includes(field)) {
      const item = updatedItems[index];
      const qty = item.received_quantity || item.order_quantity || 0;
      const price = item.purchase_price || 0;
      const taxPercent = item.tax_percentage || 0;

      // Calculate GST amounts (assuming GST is split equally between SGST and CGST)
      const sgst = taxPercent / 2;
      const cgst = taxPercent / 2;
      const gstAmount = (qty * price * taxPercent) / 100;

      updatedItems[index] = {
        ...updatedItems[index],
        gst: taxPercent,
        sgst: sgst,
        cgst: cgst,
        gst_amount: gstAmount,
        tax_amount: gstAmount,
        amount: qty * price + gstAmount,
      };
    }

    setItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!poData) {
      toast({
        title: 'Error',
        description: 'Purchase order data not loaded',
        variant: 'destructive',
      });
      return;
    }

    // Validate required fields
    const hasEmptyRequiredFields = items.some(item =>
      !item.batch_no ||
      !item.expiry_date ||
      !item.mrp ||
      item.mrp <= 0 ||
      !item.purchase_price ||
      item.purchase_price <= 0 ||
      !item.sale_price ||
      item.sale_price <= 0
    );

    if (hasEmptyRequiredFields) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all mandatory fields (Batch No., Expiry Date, MRP, Purchase Price, Sale Price)',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.purchase_price * (item.received_quantity || item.order_quantity)), 0);
      const totalSGST = items.reduce((sum, item) => sum + ((item.sgst || 0) * (item.received_quantity || item.order_quantity) * item.purchase_price) / 100, 0);
      const totalCGST = items.reduce((sum, item) => sum + ((item.cgst || 0) * (item.received_quantity || item.order_quantity) * item.purchase_price) / 100, 0);
      const totalTax = totalSGST + totalCGST;
      const totalAmount = subtotal + totalTax;
      const netAmount = totalAmount - discount;

      // Update PO header
      const updatedPoData = {
        order_date: poData.order_date,
        order_for: poData.order_for,
        supplier_id: poData.supplier_id,
        status: poData.status,
        subtotal: subtotal,
        discount: discount,
        tax_amount: totalTax,
        total_amount: netAmount,
      };

      await PurchaseOrderService.updatePurchaseOrderWithItems(
        purchaseOrderId,
        updatedPoData,
        items
      );

      toast({
        title: 'Success',
        description: 'Purchase order updated successfully',
      });

      // Navigate back after short delay
      setTimeout(() => {
        if (onBack) {
          onBack();
        }
      }, 1000);
    } catch (error) {
      console.error('Error updating purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update purchase order',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.purchase_price * (item.received_quantity || item.order_quantity)), 0);
    const totalSGST = items.reduce((sum, item) => sum + ((item.sgst || 0) * (item.received_quantity || item.order_quantity) * item.purchase_price) / 100, 0);
    const totalCGST = items.reduce((sum, item) => sum + ((item.cgst || 0) * (item.received_quantity || item.order_quantity) * item.purchase_price) / 100, 0);
    const totalAmount = subtotal + totalSGST + totalCGST;
    const netAmount = totalAmount - discount;

    return {
      subtotal,
      discount,
      totalSGST,
      totalCGST,
      totalAmount,
      netAmount,
    };
  };

  const totals = calculateTotals();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading purchase order...</span>
      </div>
    );
  }

  if (!poData) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Purchase order not found</p>
        <Button onClick={onBack} className="mt-4">Back to List</Button>
      </div>
    );
  }

  const supplier = suppliers.find(s => s.id === poData.supplier_id);

  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Goods Received Note</h2>
            <p className="text-sm text-gray-500">Edit and update purchase order details</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-gray-300 hover:bg-gray-100"
          onClick={onBack}
        >
          Back
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Search Filters Card */}
        <Card className="shadow-md border-gray-200">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium text-gray-700 mb-2 block">From</label>
                <Input type="date" className="border-gray-300" />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium text-gray-700 mb-2 block">To</label>
                <Input type="date" className="border-gray-300" />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Supplier</label>
                <Input type="text" placeholder="Search supplier..." className="border-gray-300" />
              </div>
              <div className="w-32">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Location</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white">
                  <option>All</option>
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium text-gray-700 mb-2 block">GRN No</label>
                <Input type="text" placeholder="Search GRN..." className="border-gray-300" />
              </div>
              <Button type="button" className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* PO Info Card */}
        <Card className="shadow-md border-gray-200">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
                <div className="h-10 w-1 bg-blue-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-800">Purchase Order Details</h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">PO Number:</span>
                    <Badge variant="outline" className="font-mono text-blue-600 border-blue-300">
                      {poData.po_number}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Order For:</span>
                    <span className="ml-2 font-medium text-gray-900">{poData.order_for}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-600">Supplier:</span>
                    <span className="ml-2 font-medium text-gray-900">{supplier?.supplier_name || 'N/A'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {poData.created_at ? new Date(poData.created_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-3 border-t border-gray-200">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Party Invoice Number
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter invoice number..."
                    className="border-gray-300"
                    value={partyInvoiceNumber}
                    onChange={(e) => setPartyInvoiceNumber(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Goods Received Date
                  </label>
                  <Input
                    type="text"
                    className="border-gray-300 bg-gray-50"
                    value={goodsReceivedDate}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Table Card */}
        <Card className="shadow-md border-gray-200">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Manufacturer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Pack</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Batch No<span className="text-red-500">*</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Expiry Date<span className="text-red-500">*</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      MRP<span className="text-red-500">*</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Pur. Price<span className="text-red-500">*</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Sale Price<span className="text-red-500">*</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">GST</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SGST</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">CGST</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">GST Amt.</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Qty. Ord</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Qty. Rcvd</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Free</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-2 text-center text-gray-700">{index + 1}</td>
                      <td className="px-4 py-2">
                        <div className="text-xs font-medium text-gray-900">{item.product_name}</div>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600">{item.manufacturer}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">{item.pack}</td>
                      <td className="px-4 py-2">
                        <Input
                          type="text"
                          required
                          className={`w-24 h-8 px-2 text-xs ${!item.batch_no ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}`}
                          value={item.batch_no}
                          onChange={(e) => handleItemChange(index, 'batch_no', e.target.value)}
                          placeholder="Required"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="date"
                          required
                          className={`w-32 h-8 px-2 text-xs ${!item.expiry_date ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}`}
                          value={item.expiry_date ? item.expiry_date.split('T')[0] : ''}
                          onChange={(e) => handleItemChange(index, 'expiry_date', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          step="0.01"
                          required
                          min="0.01"
                          className={`w-20 h-8 px-2 text-xs text-right ${item.mrp <= 0 ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}`}
                          value={item.mrp}
                          onChange={(e) => handleItemChange(index, 'mrp', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          step="0.01"
                          required
                          min="0.01"
                          className={`w-20 h-8 px-2 text-xs text-right ${item.purchase_price <= 0 ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}`}
                          value={item.purchase_price}
                          onChange={(e) => handleItemChange(index, 'purchase_price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          step="0.01"
                          required
                          min="0.01"
                          className={`w-20 h-8 px-2 text-xs text-right ${item.sale_price <= 0 ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}`}
                          value={item.sale_price}
                          onChange={(e) => handleItemChange(index, 'sale_price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-gray-600">{item.gst || item.tax_percentage}</td>
                      <td className="px-4 py-2 text-right text-xs text-gray-600">{item.sgst || (item.tax_percentage / 2)}</td>
                      <td className="px-4 py-2 text-right text-xs text-gray-600">{item.cgst || (item.tax_percentage / 2)}</td>
                      <td className="px-4 py-2 text-right text-xs text-gray-700 font-medium">
                        {item.gst_amount?.toFixed(2) || item.tax_amount?.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-center text-xs text-gray-700">{item.order_quantity}</td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          min="0"
                          className="w-16 h-8 px-2 text-xs text-center border-gray-300"
                          value={item.received_quantity || item.order_quantity}
                          onChange={(e) => handleItemChange(index, 'received_quantity', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-4 py-2 text-center text-xs text-gray-500">-</td>
                      <td className="px-4 py-2 text-right text-xs font-semibold text-gray-900">
                        ₹{item.amount?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Totals Card */}
        <div className="flex justify-end">
          <Card className="w-96 shadow-md border-gray-200">
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                <div className="flex justify-between px-4 py-3 bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">Subtotal</span>
                  <span className="text-sm font-semibold text-gray-900">₹{totals.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between px-4 py-3 bg-white">
                  <span className="text-sm font-medium text-gray-700">Discount</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-24 h-8 px-2 text-right text-sm border-gray-300"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="flex justify-between px-4 py-3 bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">Total SGST</span>
                  <span className="text-sm font-semibold text-gray-900">₹{totals.totalSGST.toFixed(2)}</span>
                </div>

                <div className="flex justify-between px-4 py-3 bg-white">
                  <span className="text-sm font-medium text-gray-700">Total CGST</span>
                  <span className="text-sm font-semibold text-gray-900">₹{totals.totalCGST.toFixed(2)}</span>
                </div>

                <div className="flex justify-between px-4 py-3 bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">Total Amount</span>
                  <span className="text-sm font-semibold text-gray-900">₹{totals.totalAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <span className="text-base font-bold text-gray-800">Net Amount</span>
                  <span className="text-base font-bold text-blue-600">₹{totals.netAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            disabled={isSaving}
            variant="outline"
            className="border-gray-300 hover:bg-gray-100 px-8 py-3 text-base"
            onClick={() => fetchPurchaseOrder()}
          >
            Update
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-10 py-3 text-base shadow-md hover:shadow-lg transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditPurchaseOrder;
