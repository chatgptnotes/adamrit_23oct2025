import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, TrendingDown, AlertTriangle, Calendar, BarChart3, Plus } from 'lucide-react';
import { InventoryItem } from '@/types/operation-theatre';
import { InventoryOverview } from './InventoryOverview';
import { StockManagement } from './StockManagement';
import { InventoryReports } from './InventoryReports';
import { AddInventoryDialog } from './AddInventoryDialog';

interface InventoryManagementProps {
  inventory: InventoryItem[];
  onUpdateStock: (itemId: string, quantity: number, notes?: string) => void;
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
  onUpdateItem: (itemId: string, updates: Partial<InventoryItem>) => void;
  onDeleteItem: (itemId: string) => void;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({
  inventory,
  onUpdateStock,
  onAddItem,
  onUpdateItem,
  onDeleteItem
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const getInventoryStats = () => {
    const total = inventory.length;
    const lowStock = inventory.filter(item => 
      item.current_stock <= item.min_stock_level
    ).length;
    const expiring = inventory.filter(item => 
      item.expiry_date && 
      new Date(item.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).length;
    const overstock = inventory.filter(item => 
      item.current_stock > item.max_stock_level
    ).length;

    const totalValue = inventory.reduce((sum, item) => 
      sum + (item.current_stock * item.unit_cost), 0
    );

    return { total, lowStock, expiring, overstock, totalValue };
  };

  const getCriticalAlerts = () => {
    const alerts = [];

    // Low stock items
    const lowStockItems = inventory.filter(item => 
      item.current_stock <= item.min_stock_level
    );
    if (lowStockItems.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${lowStockItems.length} items are running low on stock`,
        items: lowStockItems.slice(0, 3).map(item => item.name),
        action: 'Reorder Required'
      });
    }

    // Expiring items
    const expiringItems = inventory.filter(item => 
      item.expiry_date && 
      new Date(item.expiry_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
    if (expiringItems.length > 0) {
      alerts.push({
        type: 'error',
        title: 'Expiring Items',
        message: `${expiringItems.length} items expire within 7 days`,
        items: expiringItems.slice(0, 3).map(item => item.name),
        action: 'Use or Dispose'
      });
    }

    // Overstock items
    const overstockItems = inventory.filter(item => 
      item.current_stock > item.max_stock_level * 1.5
    );
    if (overstockItems.length > 0) {
      alerts.push({
        type: 'info',
        title: 'Overstock Alert',
        message: `${overstockItems.length} items are overstocked`,
        items: overstockItems.slice(0, 3).map(item => item.name),
        action: 'Review Usage'
      });
    }

    return alerts;
  };

  const stats = getInventoryStats();
  const alerts = getCriticalAlerts();

  const handleItemAdded = () => {
    // The AddInventoryDialog handles the actual item creation internally
    // We just need to close the dialog and refresh
    setAddDialogOpen(false);
    // If needed, trigger a refresh of the inventory list here
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">{stats.expiring}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overstock</p>
                <p className="text-2xl font-bold text-purple-600">{stats.overstock}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{stats.totalValue.toLocaleString()}
                </p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Critical Alerts</h3>
          {alerts.map((alert, index) => (
            <Alert key={index} variant={
              alert.type === 'error' ? 'destructive' : 'default'
            }>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm mt-1">{alert.message}</p>
                    {alert.items.length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        Items: {alert.items.join(', ')}
                        {alert.items.length < 3 && '...'}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-4">
                    {alert.action}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="management">Stock Management</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <InventoryOverview 
            inventory={inventory}
            onUpdateStock={onUpdateStock}
            onUpdateItem={onUpdateItem}
          />
        </TabsContent>

        <TabsContent value="management" className="mt-6">
          <StockManagement
            inventory={inventory}
            onUpdateStock={onUpdateStock}
            onUpdateItem={onUpdateItem}
            onDeleteItem={onDeleteItem}
          />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <InventoryReports inventory={inventory} />
        </TabsContent>
      </Tabs>

      {/* Add Item Dialog */}
      <AddInventoryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onItemAdded={handleItemAdded}
      />
    </div>
  );
};
