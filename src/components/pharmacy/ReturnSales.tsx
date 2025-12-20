// Return Sales Component - Sale Bill Style Layout
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from 'use-debounce';
import {
  Search,
  RotateCcw,
  Package,
  Loader2,
  User,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  CreditCard,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SaleItem {
  id: string;
  sale_id: string;
  medicine_id: string;
  medicine_name: string;
  generic_name?: string;
  batch_number: string;
  expiry_date: string;
  quantity_sold: number;
  unit_price: number;
  total_amount: number;
  quantity_returned: number; // Already returned
  quantity_available: number; // Can still return
}

interface PatientSale {
  sale_id: string;
  bill_number: string;
  sale_date: string;
  total_amount: number;
  payment_method: string;
  items: SaleItem[];
  expanded: boolean;
}

interface ReturnCartItem {
  sale_item_id: string;
  sale_id: string;
  medicine_id: string;
  medicine_name: string;
  batch_number: string;
  unit_price: number;
  quantity_to_return: number;
  max_quantity: number;
  condition: 'GOOD' | 'DAMAGED' | 'EXPIRED' | 'OPENED';
  can_restock: boolean;
  refund_amount: number;
}

const ReturnSales: React.FC = () => {
  const { toast } = useToast();
  const { hospitalConfig } = useAuth();

  // Patient search state
  const [patientSearch, setPatientSearch] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [debouncedPatientSearch] = useDebounce(patientSearch, 300);

  // Sales state
  const [patientSales, setPatientSales] = useState<PatientSale[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);

  // Return cart state
  const [returnCart, setReturnCart] = useState<ReturnCartItem[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [processingFee, setProcessingFee] = useState(0);
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'CREDIT'>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate totals
  const subtotalRefund = returnCart.reduce((sum, item) => sum + item.refund_amount, 0);
  const netRefund = subtotalRefund - processingFee;

  // Search patients
  useEffect(() => {
    const searchPatients = async () => {
      if (debouncedPatientSearch.length < 2) {
        setPatientSearchResults([]);
        return;
      }

      // Skip search if we already selected this patient (to prevent dropdown reopening)
      if (selectedPatient && debouncedPatientSearch === selectedPatient.name) {
        setPatientSearchResults([]);
        return;
      }

      setIsSearchingPatient(true);
      try {
        let query = supabase
          .from('patients')
          .select('id, name, patients_id, phone')
          .or(`name.ilike.%${debouncedPatientSearch}%,patients_id.ilike.%${debouncedPatientSearch}%`)
          .limit(10);

        if (hospitalConfig?.name) {
          query = query.eq('hospital_name', hospitalConfig.name);
        }

        const { data, error } = await query;

        if (error) throw error;
        setPatientSearchResults(data || []);
        setShowPatientDropdown(true);
      } catch (error) {
        console.error('Error searching patients:', error);
      } finally {
        setIsSearchingPatient(false);
      }
    };

    searchPatients();
  }, [debouncedPatientSearch, selectedPatient]);

  // Fetch patient's sales when patient is selected
  const fetchPatientSales = async (patientId: string) => {
    setIsLoadingSales(true);
    try {
      let query = supabase
        .from('pharmacy_sales')
        .select(`
          sale_id,
          bill_number,
          sale_date,
          total_amount,
          payment_method
        `)
        .eq('patient_id', patientId)
        .order('sale_date', { ascending: false });

      if (hospitalConfig?.name) {
        query = query.eq('hospital_name', hospitalConfig.name);
      }

      const { data: salesData, error: salesError } = await query;

      if (salesError) throw salesError;

      // Fetch items for each sale
      const salesWithItems: PatientSale[] = [];

      for (const sale of salesData || []) {
        const { data: itemsData } = await supabase
          .from('pharmacy_sale_items')
          .select(`
            sale_item_id,
            medication_id,
            medication_name,
            generic_name,
            quantity,
            unit_price,
            total_amount,
            batch_number,
            expiry_date
          `)
          .eq('sale_id', sale.sale_id);

        // Get existing returns for these items
        const itemIds = itemsData?.map(i => i.sale_item_id) || [];
        const { data: existingReturns } = await supabase
          .from('medicine_return_items')
          .select('original_sale_item_id, quantity_returned')
          .in('original_sale_item_id', itemIds);

        const returnedQuantities = new Map<string, number>();
        existingReturns?.forEach(r => {
          const current = returnedQuantities.get(r.original_sale_item_id) || 0;
          returnedQuantities.set(r.original_sale_item_id, current + r.quantity_returned);
        });

        const items: SaleItem[] = (itemsData || []).map(item => {
          const returned = returnedQuantities.get(item.sale_item_id) || 0;
          return {
            id: item.sale_item_id,
            sale_id: sale.sale_id,
            medicine_id: item.medication_id,
            medicine_name: item.medication_name || 'Unknown',
            generic_name: item.generic_name,
            batch_number: item.batch_number || '',
            expiry_date: item.expiry_date || '',
            quantity_sold: item.quantity,
            unit_price: item.unit_price,
            total_amount: item.total_amount,
            quantity_returned: returned,
            quantity_available: item.quantity - returned,
          };
        });

        salesWithItems.push({
          ...sale,
          items,
          expanded: false,
        });
      }

      setPatientSales(salesWithItems);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch patient sales',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSales(false);
    }
  };

  const selectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setPatientSearch(patient.name);
    setShowPatientDropdown(false);
    setPatientSearchResults([]); // Clear results to ensure dropdown closes
    setReturnCart([]);
    fetchPatientSales(patient.patients_id); // Use patients_id, not id (UUID)
  };

  const toggleSaleExpanded = (saleId: string) => {
    setPatientSales(patientSales.map(sale =>
      sale.sale_id === saleId ? { ...sale, expanded: !sale.expanded } : sale
    ));
  };

  const addItemToCart = (item: SaleItem, saleId: string) => {
    if (item.quantity_available <= 0) {
      toast({
        title: 'Cannot Return',
        description: 'All items have already been returned',
        variant: 'destructive',
      });
      return;
    }

    // Check if already in cart
    if (returnCart.find(c => c.sale_item_id === item.id)) {
      toast({
        title: 'Already Added',
        description: 'This item is already in the return cart',
        variant: 'destructive',
      });
      return;
    }

    setReturnCart([...returnCart, {
      sale_item_id: item.id,
      sale_id: saleId,
      medicine_id: item.medicine_id,
      medicine_name: item.medicine_name,
      batch_number: item.batch_number,
      unit_price: item.unit_price,
      quantity_to_return: 1,
      max_quantity: item.quantity_available,
      condition: 'GOOD',
      can_restock: true,
      refund_amount: item.unit_price,
    }]);
  };

  const updateCartItem = (saleItemId: string, field: string, value: any) => {
    setReturnCart(returnCart.map(item => {
      if (item.sale_item_id !== saleItemId) return item;

      const updated = { ...item, [field]: value };

      if (field === 'quantity_to_return') {
        updated.refund_amount = updated.unit_price * value;
      }

      if (field === 'condition') {
        updated.can_restock = value === 'GOOD';
      }

      return updated;
    }));
  };

  const removeFromCart = (saleItemId: string) => {
    setReturnCart(returnCart.filter(item => item.sale_item_id !== saleItemId));
  };

  const incrementQuantity = (saleItemId: string) => {
    const item = returnCart.find(i => i.sale_item_id === saleItemId);
    if (item && item.quantity_to_return < item.max_quantity) {
      updateCartItem(saleItemId, 'quantity_to_return', item.quantity_to_return + 1);
    }
  };

  const decrementQuantity = (saleItemId: string) => {
    const item = returnCart.find(i => i.sale_item_id === saleItemId);
    if (item && item.quantity_to_return > 1) {
      updateCartItem(saleItemId, 'quantity_to_return', item.quantity_to_return - 1);
    }
  };

  const generateReturnNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RET-${year}-${random}`;
  };

  const processReturn = async () => {
    if (!selectedPatient || returnCart.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a patient and add items to return',
        variant: 'destructive',
      });
      return;
    }

    if (!returnReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a return reason',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const returnNumber = generateReturnNumber();
      const saleId = returnCart[0].sale_id; // Use first item's sale ID

      // Create the return record
      const { data: returnData, error: returnError } = await supabase
        .from('medicine_returns')
        .insert({
          return_number: returnNumber,
          original_sale_id: saleId,
          patient_id: selectedPatient.id,
          return_date: new Date().toISOString().split('T')[0],
          return_reason: returnReason,
          return_type: 'PATIENT',
          refund_amount: subtotalRefund,
          processing_fee: processingFee,
          net_refund: netRefund,
          status: 'PROCESSED',
          processed_at: new Date().toISOString(),
          hospital_name: hospitalConfig?.name || 'hope HMIS',
        })
        .select()
        .single();

      if (returnError) throw returnError;

      // Create return items
      const returnItemsToInsert = returnCart.map(item => ({
        return_id: returnData.id,
        medicine_id: item.medicine_id,
        original_sale_item_id: item.sale_item_id,
        quantity_returned: item.quantity_to_return,
        unit_price: item.unit_price,
        refund_amount: item.refund_amount,
        batch_number: item.batch_number,
        medicine_condition: item.condition,
        can_restock: item.can_restock,
      }));

      const { error: itemsError } = await supabase
        .from('medicine_return_items')
        .insert(returnItemsToInsert);

      if (itemsError) throw itemsError;

      // Update inventory for restockable items
      for (const item of returnCart) {
        if (item.can_restock) {
          const { data: inventoryData } = await supabase
            .from('medicine_inventory')
            .select('id, quantity_in_stock')
            .eq('medicine_id', item.medicine_id)
            .eq('batch_number', item.batch_number)
            .single();

          if (inventoryData) {
            await supabase
              .from('medicine_inventory')
              .update({
                quantity_in_stock: inventoryData.quantity_in_stock + item.quantity_to_return,
              })
              .eq('id', inventoryData.id);
          }
        }
      }

      toast({
        title: 'Success',
        description: `Return ${returnNumber} processed successfully. Refund: ₹${netRefund.toFixed(2)}`,
      });

      // Reset form
      setReturnCart([]);
      setReturnReason('');
      setProcessingFee(0);
      fetchPatientSales(selectedPatient.id); // Refresh sales

    } catch (error) {
      console.error('Error processing return:', error);
      toast({
        title: 'Error',
        description: 'Failed to process return',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setPatientSales([]);
    setReturnCart([]);
    setReturnReason('');
    setProcessingFee(0);
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Left Section - Patient & Sales */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-6 w-6 text-orange-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Return Sales</h2>
              <p className="text-sm text-gray-500">Process returns and refunds for sold items</p>
            </div>
          </div>
          <Button variant="outline" onClick={clearAll}>
            Clear All
          </Button>
        </div>

        {/* Patient Search */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1 relative">
                <Label>Patient Name / ID</Label>
                <div className="relative mt-1">
                  <Input
                    placeholder="Search patient by name or ID..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setShowPatientDropdown(true);
                    }}
                    onFocus={() => patientSearchResults.length > 0 && setShowPatientDropdown(true)}
                  />
                  {isSearchingPatient && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>

                {/* Patient Dropdown */}
                {showPatientDropdown && patientSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {patientSearchResults.map((patient) => (
                      <div
                        key={patient.id}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-3"
                        onClick={() => selectPatient(patient)}
                      >
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-xs text-gray-500">
                            ID: {patient.patients_id} | Phone: {patient.phone || 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedPatient && (
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <p className="text-sm text-gray-500">Selected Patient</p>
                  <p className="font-semibold text-blue-700">{selectedPatient.name}</p>
                  <p className="text-xs text-gray-500">ID: {selectedPatient.patients_id}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Patient's Sales History */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="py-3 bg-gray-50">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Sales History
              {patientSales.length > 0 && (
                <Badge variant="secondary">{patientSales.length} sales</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            {isLoadingSales ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : !selectedPatient ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <User className="h-8 w-8 mb-2" />
                <p>Search and select a patient to view their sales</p>
              </div>
            ) : patientSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <FileText className="h-8 w-8 mb-2" />
                <p>No sales found for this patient</p>
              </div>
            ) : (
              <div className="divide-y">
                {patientSales.map((sale) => (
                  <div key={sale.sale_id} className="border-b last:border-b-0">
                    {/* Sale Header */}
                    <div
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                      onClick={() => toggleSaleExpanded(sale.sale_id)}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-semibold text-blue-600">{sale.bill_number}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(sale.sale_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">{sale.payment_method}</Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-semibold">₹{sale.total_amount.toFixed(2)}</p>
                        {sale.expanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Sale Items */}
                    {sale.expanded && (
                      <div className="bg-gray-50 px-4 py-2">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-gray-500 text-xs">
                              <th className="text-left py-1">Medicine</th>
                              <th className="text-right py-1">Qty Sold</th>
                              <th className="text-right py-1">Returned</th>
                              <th className="text-right py-1">Available</th>
                              <th className="text-right py-1">Price</th>
                              <th className="text-center py-1">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sale.items.map((item) => (
                              <tr key={item.id} className="border-t border-gray-200">
                                <td className="py-2">
                                  <p className="font-medium">{item.medicine_name}</p>
                                  <p className="text-xs text-gray-500">Batch: {item.batch_number}</p>
                                </td>
                                <td className="text-right py-2">{item.quantity_sold}</td>
                                <td className="text-right py-2 text-orange-600">{item.quantity_returned}</td>
                                <td className="text-right py-2">
                                  <Badge variant={item.quantity_available > 0 ? 'default' : 'secondary'}>
                                    {item.quantity_available}
                                  </Badge>
                                </td>
                                <td className="text-right py-2">₹{item.unit_price.toFixed(2)}</td>
                                <td className="text-center py-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addItemToCart(item, sale.sale_id);
                                    }}
                                    disabled={item.quantity_available <= 0 || returnCart.some(c => c.sale_item_id === item.id)}
                                    className="h-7 px-2"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Section - Return Cart & Summary */}
      <div className="w-96 flex flex-col gap-4">
        {/* Return Cart */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="py-3 bg-orange-50">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Return Cart ({returnCart.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-2">
            {returnCart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Package className="h-8 w-8 mb-2" />
                <p className="text-sm">No items in return cart</p>
                <p className="text-xs">Select items from sales to return</p>
              </div>
            ) : (
              <div className="space-y-2">
                {returnCart.map((item) => (
                  <div key={item.sale_item_id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">{item.medicine_name}</p>
                        <p className="text-xs text-gray-500">Batch: {item.batch_number}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-500"
                        onClick={() => removeFromCart(item.sale_item_id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0"
                          onClick={() => decrementQuantity(item.sale_item_id)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity_to_return}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0"
                          onClick={() => incrementQuantity(item.sale_item_id)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="text-xs text-gray-500">/ {item.max_quantity}</span>
                      </div>
                      <p className="font-semibold text-green-600">₹{item.refund_amount.toFixed(2)}</p>
                    </div>

                    <div className="flex gap-2">
                      <Select
                        value={item.condition}
                        onValueChange={(value) => updateCartItem(item.sale_item_id, 'condition', value)}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GOOD">Good</SelectItem>
                          <SelectItem value="OPENED">Opened</SelectItem>
                          <SelectItem value="DAMAGED">Damaged</SelectItem>
                          <SelectItem value="EXPIRED">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge variant={item.can_restock ? 'default' : 'secondary'} className="text-xs">
                        {item.can_restock ? 'Restock' : 'No Restock'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Return Summary */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Return Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal Refund:</span>
              <span className="font-medium">₹{subtotalRefund.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span>Processing Fee:</span>
              <Input
                type="number"
                min={0}
                value={processingFee}
                onChange={(e) => setProcessingFee(parseFloat(e.target.value) || 0)}
                className="w-24 h-8 text-right"
              />
            </div>

            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Net Refund:</span>
              <span className="text-green-600">₹{netRefund.toFixed(2)}</span>
            </div>

            <div>
              <Label className="text-sm">Return Reason *</Label>
              <Textarea
                placeholder="Enter reason for return..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>

            {/* Refund Method */}
            <div>
              <Label className="text-sm">Refund Method</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {(['CASH', 'CARD', 'UPI', 'CREDIT'] as const).map((method) => (
                  <Button
                    key={method}
                    variant={refundMethod === method ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRefundMethod(method)}
                    className={refundMethod === method ? 'bg-orange-600 hover:bg-orange-700' : ''}
                  >
                    {method === 'CASH' && <DollarSign className="h-3 w-3 mr-1" />}
                    {method === 'CARD' && <CreditCard className="h-3 w-3 mr-1" />}
                    {method}
                  </Button>
                ))}
              </div>
            </div>

            {/* Process Button */}
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700"
              size="lg"
              onClick={processReturn}
              disabled={isProcessing || returnCart.length === 0 || !returnReason.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Process Return - ₹{netRefund.toFixed(2)}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReturnSales;
