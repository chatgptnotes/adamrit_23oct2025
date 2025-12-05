import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Search, Package, AlertTriangle, Calendar, Edit, Minus, Plus } from 'lucide-react';

// Use the inventory_items type structure based on the database schema
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  unit_cost: number;
  supplier: string;
  expiry_date?: string;
  batch_number?: string;
  last_restocked?: string;
  last_sterilized?: string;
  sterilization_required: boolean;
  usage_per_day?: number;
  created_at: string;
  updated_at: string;
}

interface InventoryOverviewProps {
  inventory: InventoryItem[];
  onUpdateStock: (itemId: string, quantity: number, notes?: string) => void;
  onUpdateItem: (itemId: string, updates: Partial<InventoryItem>) => void;
}

export const InventoryOverview: React.FC<InventoryOverviewProps> = ({
  inventory,
  onUpdateStock,
  onUpdateItem
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockDialog, setStockDialog] = useState<{
    open: boolean;
    item: InventoryItem | null;
    operation: 'add' | 'remove';
  }>({ open: false, item: null, operation: 'add' });
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(1);
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  const categories = [
    'all',
    'surgical_instruments',
    'consumables',
    'implants',
    'medications',
    'anesthesia_supplies'
  ];

  const getStockLevel = (item: InventoryItem) => {
    const percentage = (item.current_stock / item.max_stock_level) * 100;
    if (item.current_stock <= item.min_stock_level) return 'critical';
    if (percentage < 30) return 'low';
    if (percentage > 90) return 'high';
    return 'normal';
  };

  const getStockLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'low': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'high': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'normal': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const isExpiringSoon = (item: InventoryItem) => {
    if (!item.expiry_date) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30;
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleStockAdjustment = (item: InventoryItem, operation: 'add' | 'remove') => {
    setStockDialog({ open: true, item, operation });
    setAdjustmentQuantity(1);
    setAdjustmentNotes('');
  };

  const handleStockAdjustmentConfirm = () => {
    if (stockDialog.item) {
      const newQuantity = stockDialog.operation === 'add' 
        ? stockDialog.item.current_stock + adjustmentQuantity
        : stockDialog.item.current_stock - adjustmentQuantity;
      
      if (newQuantity >= 0) {
        onUpdateStock(stockDialog.item.id, newQuantity, adjustmentNotes || undefined);
      }
      
      setStockDialog({ open: false, item: null, operation: 'add' });
    }
  };

  const getUsageRate = (item: InventoryItem) => {
    if (!item.usage_per_day) return 'Unknown';
    const daysOfStock = Math.floor(item.current_stock / item.usage_per_day);
    if (daysOfStock <= 7) return `${daysOfStock} days left`;
    if (daysOfStock <= 30) return `${Math.floor(daysOfStock / 7)} weeks left`;
    return `${Math.floor(daysOfStock / 30)} months left`;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="inventory-search">Search Inventory</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="inventory-search"
                  placeholder="Search by item name or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInventory.map(item => {
          const stockLevel = getStockLevel(item);
          const expiringSoon = isExpiringSoon(item);
          const stockPercentage = (item.current_stock / item.max_stock_level) * 100;
          
          return (
            <Card key={item.id} className="relative">
              {/* Warning badges */}
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                {stockLevel === 'critical' && (
                  <Badge variant="destructive" className="text-xs">
                    Critical
                  </Badge>
                )}
                {expiringSoon && (
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600">
                    Expiring
                  </Badge>
                )}
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between pr-20">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <CardTitle className="text-sm">{item.name}</CardTitle>
                  </div>
                </div>
                <p className="text-xs text-gray-600 capitalize">
                  {item.category.replace('_', ' ')}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stock Level */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Stock Level</span>
                    <Badge className={`text-xs ${getStockLevelColor(stockLevel)}`}>
                      {stockLevel}
                    </Badge>
                  </div>
                  <Progress value={Math.min(stockPercentage, 100)} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Current: {item.current_stock}</span>
                    <span>Max: {item.max_stock_level}</span>
                  </div>
                </div>

                {/* Key Information */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min Level:</span>
                    <span className="font-medium">{item.min_stock_level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit Cost:</span>
                    <span className="font-medium">₹{item.unit_cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Value:</span>
                    <span className="font-medium">
                      ₹{(item.current_stock * item.unit_cost).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supplier:</span>
                    <span className="font-medium text-xs">{item.supplier}</span>
                  </div>
                </div>

                {/* Expiry and Usage */}
                <div className="space-y-1 text-sm">
                  {item.expiry_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expiry:</span>
                      <span className={`font-medium text-xs ${
                        expiringSoon ? 'text-orange-600' : ''
                      }`}>
                        {new Date(item.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {item.usage_per_day && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Usage Rate:</span>
                      <span className="font-medium text-xs">{getUsageRate(item)}</span>
                    </div>
                  )}
                  {item.batch_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Batch:</span>
                      <span className="font-medium text-xs">{item.batch_number}</span>
                    </div>
                  )}
                </div>

                {/* Sterilization Status */}
                {item.sterilization_required && (
                  <div className="p-2 bg-blue-50 rounded text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700">Sterilization Required</span>
                      {item.last_sterilized && (
                        <span className="text-blue-600">
                          Last: {new Date(item.last_sterilized).toLocaleDateString()}
                        </span>
                      )}
                      {!item.last_sterilized && (
                        <Badge variant="outline" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStockAdjustment(item, 'remove')}
                    disabled={item.current_stock === 0}
                    className="flex-1"
                  >
                    <Minus className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleStockAdjustment(item, 'add')}
                    className="flex-1"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredInventory.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No inventory items found matching your criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Stock Adjustment Dialog */}
      <Dialog 
        open={stockDialog.open} 
        onOpenChange={(open) => setStockDialog({ open, item: null, operation: 'add' })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {stockDialog.operation === 'add' ? 'Add Stock' : 'Remove Stock'}
            </DialogTitle>
          </DialogHeader>

          {stockDialog.item && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{stockDialog.item.name}</h4>
                <p className="text-sm text-gray-600">
                  Current Stock: {stockDialog.item.current_stock} units
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustment-quantity">
                  Quantity to {stockDialog.operation}
                </Label>
                <Input
                  id="adjustment-quantity"
                  type="number"
                  min="1"
                  max={stockDialog.operation === 'remove' ? stockDialog.item.current_stock : undefined}
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustment-notes">Notes (Optional)</Label>
                <Input
                  id="adjustment-notes"
                  placeholder="Reason for adjustment..."
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <p className="text-blue-700">
                  New stock level will be: {
                    stockDialog.operation === 'add' 
                      ? stockDialog.item.current_stock + adjustmentQuantity
                      : stockDialog.item.current_stock - adjustmentQuantity
                  } units
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setStockDialog({ open: false, item: null, operation: 'add' })}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStockAdjustmentConfirm}
              disabled={!stockDialog.item || adjustmentQuantity <= 0}
            >
              Confirm {stockDialog.operation === 'add' ? 'Addition' : 'Removal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
