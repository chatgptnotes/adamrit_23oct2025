import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Minus, Edit, Trash2, Package, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { InventoryItem } from '@/types/operation-theatre';

interface StockManagementProps {
  inventory: InventoryItem[];
  onUpdateStock: (itemId: string, quantity: number, notes?: string) => void;
  onUpdateItem: (itemId: string, updates: Partial<InventoryItem>) => void;
  onDeleteItem: (itemId: string) => void;
}

interface StockTransaction {
  id: string;
  item_id: string;
  item_name: string;
  type: 'addition' | 'consumption' | 'adjustment' | 'expiry';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  notes?: string;
  performed_by: string;
  timestamp: string;
}

export const StockManagement: React.FC<StockManagementProps> = ({
  inventory,
  onUpdateStock,
  onUpdateItem,
  onDeleteItem
}) => {
  const [selectedView, setSelectedView] = useState<'bulk' | 'transactions' | 'reorder'>('bulk');
  const [bulkUpdateDialog, setBulkUpdateDialog] = useState(false);
  const [reorderDialog, setReorderDialog] = useState<{
    open: boolean;
    item: InventoryItem | null;
  }>({ open: false, item: null });
  const [reorderQuantity, setReorderQuantity] = useState(0);
  const [reorderNotes, setReorderNotes] = useState('');

  // Mock transaction data - in real implementation, this would come from the backend
  const mockTransactions: StockTransaction[] = [
    {
      id: '1',
      item_id: 'item1',
      item_name: 'Surgical Gloves',
      type: 'consumption',
      quantity: -50,
      previous_stock: 200,
      new_stock: 150,
      performed_by: 'Dr. Smith',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      item_id: 'item2',
      item_name: 'Gauze Pads',
      type: 'addition',
      quantity: 100,
      previous_stock: 50,
      new_stock: 150,
      notes: 'Restocked from supplier',
      performed_by: 'Nurse Johnson',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    }
  ];

  const getLowStockItems = () => {
    return inventory.filter(item => item.current_stock <= item.min_stock_level);
  };

  const getReorderSuggestions = () => {
    return inventory
      .filter(item => item.current_stock <= item.min_stock_level * 1.5)
      .map(item => {
        const suggestedQuantity = item.max_stock_level - item.current_stock;
        const estimatedCost = suggestedQuantity * item.unit_cost;
        const urgency = item.current_stock <= item.min_stock_level ? 'urgent' : 'recommended';
        
        return {
          ...item,
          suggestedQuantity,
          estimatedCost,
          urgency
        };
      })
      .sort((a, b) => {
        if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
        if (b.urgency === 'urgent' && a.urgency !== 'urgent') return 1;
        return a.current_stock - a.min_stock_level - (b.current_stock - b.min_stock_level);
      });
  };

  const handleBulkReorder = (items: any[]) => {
    items.forEach(item => {
      const newStock = item.current_stock + item.suggestedQuantity;
      onUpdateStock(item.id, newStock, `Bulk reorder: +${item.suggestedQuantity} units`);
    });
    setBulkUpdateDialog(false);
  };

  const handleReorderItem = () => {
    if (reorderDialog.item && reorderQuantity > 0) {
      const newStock = reorderDialog.item.current_stock + reorderQuantity;
      onUpdateStock(
        reorderDialog.item.id, 
        newStock, 
        reorderNotes || `Reordered: +${reorderQuantity} units`
      );
      setReorderDialog({ open: false, item: null });
      setReorderQuantity(0);
      setReorderNotes('');
    }
  };

  const getTransactionIcon = (type: StockTransaction['type']) => {
    switch (type) {
      case 'addition': return <Plus className="w-4 h-4 text-green-600" />;
      case 'consumption': return <Minus className="w-4 h-4 text-red-600" />;
      case 'adjustment': return <Edit className="w-4 h-4 text-blue-600" />;
      case 'expiry': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const lowStockItems = getLowStockItems();
  const reorderSuggestions = getReorderSuggestions();

  return (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Critical Stock Alert</p>
                <p className="text-sm mt-1">
                  {lowStockItems.length} items are at or below minimum stock levels
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedView('reorder')}>
                View Reorder Suggestions
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* View Selection */}
      <div className="flex gap-2">
        <Button
          variant={selectedView === 'bulk' ? 'default' : 'outline'}
          onClick={() => setSelectedView('bulk')}
        >
          Bulk Operations
        </Button>
        <Button
          variant={selectedView === 'transactions' ? 'default' : 'outline'}
          onClick={() => setSelectedView('transactions')}
        >
          Transaction History
        </Button>
        <Button
          variant={selectedView === 'reorder' ? 'default' : 'outline'}
          onClick={() => setSelectedView('reorder')}
        >
          Reorder Management
        </Button>
      </div>

      {/* Bulk Operations View */}
      {selectedView === 'bulk' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Bulk Stock Operations
              <Button onClick={() => setBulkUpdateDialog(true)}>
                Bulk Reorder Low Stock
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map(item => {
                  const isLowStock = item.current_stock <= item.min_stock_level;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="capitalize">
                        {item.category.replace('_', ' ')}
                      </TableCell>
                      <TableCell>{item.current_stock}</TableCell>
                      <TableCell>{item.min_stock_level}</TableCell>
                      <TableCell>
                        <Badge variant={isLowStock ? 'destructive' : 'outline'}>
                          {isLowStock ? 'Low Stock' : 'Normal'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReorderDialog({ open: true, item })}
                          >
                            Reorder
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Handle edit item
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Transaction History View */}
      {selectedView === 'transactions' && (
        <Card>
          <CardHeader>
            <CardTitle>Stock Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTransactions.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.item_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.type)}
                        <span className="capitalize">{transaction.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={
                        transaction.quantity > 0 ? 'text-green-600' : 'text-red-600'
                      }>
                        {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      {transaction.previous_stock} → {transaction.new_stock}
                    </TableCell>
                    <TableCell>{transaction.performed_by}</TableCell>
                    <TableCell>
                      {new Date(transaction.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{transaction.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Reorder Management View */}
      {selectedView === 'reorder' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Reorder Suggestions
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleBulkReorder(
                    reorderSuggestions.filter(item => item.urgency === 'urgent')
                  )}
                  disabled={reorderSuggestions.filter(item => item.urgency === 'urgent').length === 0}
                >
                  Reorder All Urgent
                </Button>
                <Button
                  onClick={() => handleBulkReorder(reorderSuggestions)}
                  disabled={reorderSuggestions.length === 0}
                >
                  Reorder All Suggested
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reorderSuggestions.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No items require reordering at this time</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Level</TableHead>
                    <TableHead>Suggested Quantity</TableHead>
                    <TableHead>Estimated Cost</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reorderSuggestions.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.current_stock}</TableCell>
                      <TableCell>{item.min_stock_level}</TableCell>
                      <TableCell>{item.suggestedQuantity}</TableCell>
                      <TableCell>₹{item.estimatedCost.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={item.urgency === 'urgent' ? 'destructive' : 'default'}>
                          {item.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => {
                            setReorderDialog({ open: true, item });
                            setReorderQuantity(item.suggestedQuantity);
                          }}
                        >
                          Reorder
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reorder Dialog */}
      <Dialog 
        open={reorderDialog.open} 
        onOpenChange={(open) => setReorderDialog({ open, item: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reorder Item</DialogTitle>
          </DialogHeader>

          {reorderDialog.item && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{reorderDialog.item.name}</h4>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
                  <div>Current Stock: {reorderDialog.item.current_stock}</div>
                  <div>Min Level: {reorderDialog.item.min_stock_level}</div>
                  <div>Max Level: {reorderDialog.item.max_stock_level}</div>
                  <div>Unit Cost: ₹{reorderDialog.item.unit_cost}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorder-quantity">Quantity to Order</Label>
                <Input
                  id="reorder-quantity"
                  type="number"
                  min="1"
                  value={reorderQuantity}
                  onChange={(e) => setReorderQuantity(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorder-notes">Notes (Optional)</Label>
                <Textarea
                  id="reorder-notes"
                  placeholder="Purchase order details, supplier info, etc..."
                  value={reorderNotes}
                  onChange={(e) => setReorderNotes(e.target.value)}
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <div className="space-y-1">
                  <p className="text-blue-700">
                    New stock level: {reorderDialog.item.current_stock + reorderQuantity} units
                  </p>
                  <p className="text-blue-700">
                    Total cost: ₹{(reorderQuantity * reorderDialog.item.unit_cost).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setReorderDialog({ open: false, item: null })}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReorderItem}
              disabled={!reorderDialog.item || reorderQuantity <= 0}
            >
              Confirm Reorder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};