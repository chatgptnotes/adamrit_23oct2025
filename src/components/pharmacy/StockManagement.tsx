// Stock Management Component
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Calendar,
  Eye,
  Edit,
  Plus,
  Minus,
  RefreshCw,
  Download,
  Upload,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  Truck,
  Factory,
  MapPin,
  ShoppingCart,
  Loader2,
  History
} from 'lucide-react';
import {
  useBatchInventory,
  useAllAlerts,
  useAdjustBatchStock,
  useMedicineBatches
} from '@/hooks/useBatchInventory';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface StockItem {
  id: string;
  medicine_id: string;
  medicine_name: string;
  generic_name?: string;
  strength?: string;
  dosage_form?: string;
  batch_number: string;
  manufacturing_date?: string;
  expiry_date: string;
  received_quantity: number;
  current_stock: number;
  reserved_stock: number;
  damaged_stock: number;
  supplier_name?: string;
  purchase_rate?: number;
  mrp: number;
  rack_number?: string;
  shelf_location?: string;
  minimum_stock_level: number;
  reorder_level: number;
  is_active: boolean;
  days_to_expiry: number;
}

interface StockMovement {
  id: string;
  medicine_name: string;
  batch_number: string;
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'DAMAGE' | 'EXPIRY';
  reference_type?: string;
  quantity_before: number;
  quantity_changed: number;
  quantity_after: number;
  reason?: string;
  performed_by: string;
  movement_date: string;
}

interface StockAlert {
  id: string;
  medicine_name: string;
  alert_type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED' | 'NEAR_EXPIRY';
  current_stock: number;
  threshold?: number;
  days_to_expiry?: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  batch_number?: string;
  expiry_date?: string;
}

const StockManagement: React.FC = () => {
  const { hospitalConfig } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [alertFilter, setAlertFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedStockItem, setSelectedStockItem] = useState<any | null>(null);
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [isOpeningStockDialogOpen, setIsOpeningStockDialogOpen] = useState(false);
  const [selectedBatchForHistory, setSelectedBatchForHistory] = useState<string | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [openingStockHistory, setOpeningStockHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch real data using custom hooks
  const { data: batchInventoryData, isLoading: isLoadingInventory, refetch: refetchInventory } = useBatchInventory({
    has_stock: stockFilter === 'out' ? false : stockFilter === 'low' ? undefined : undefined,
    search_term: searchTerm || undefined
  });

  const { alerts: stockAlerts, isLoading: isLoadingAlerts, refetch: refetchAlerts } = useAllAlerts(90);

  // Transform batch inventory data to match StockItem interface
  const stockItems: any[] = batchInventoryData?.map(batch => ({
    id: batch.id,
    medicine_id: batch.medicine_id,
    medicine_name: batch.medicine_name || 'Unknown',
    generic_name: batch.generic_name,
    strength: batch.strength,
    dosage_form: batch.dosage_form,
    batch_number: batch.batch_number,
    manufacturing_date: batch.manufacturing_date,
    expiry_date: batch.expiry_date,
    received_quantity: batch.received_quantity || 0,
    current_stock: batch.current_stock || 0,
    reserved_stock: batch.reserved_stock || 0,
    damaged_stock: 0, // TODO: Add damaged stock tracking
    supplier_name: batch.supplier_name,
    purchase_rate: batch.purchase_price,
    mrp: batch.mrp,
    rack_number: batch.rack_number,
    shelf_location: batch.shelf_location,
    minimum_stock_level: 0, // TODO: Get from medication table
    reorder_level: 0, // TODO: Get from medication table
    is_active: batch.is_active,
    days_to_expiry: batch.days_to_expiry || 0,
    expiry_status: batch.expiry_status
  })) || [];

  // Fetch stock movements for selected batch (will be implemented when viewing batch details)
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  // Fetch opening stock history (three-query approach - NO joins due to missing FK constraints)
  const fetchOpeningStockHistory = async () => {
    setLoadingHistory(true);
    try {
      // Step 1: Fetch movement records (no join)
      const { data: movements, error: movementError } = await supabase
        .from('batch_stock_movements')
        .select('*')
        .eq('reference_type', 'OPENING_STOCK')
        .eq('hospital_name', hospitalConfig?.fullName || '')
        .order('movement_date', { ascending: false });

      if (movementError) throw movementError;

      if (!movements || movements.length === 0) {
        setOpeningStockHistory([]);
        return;
      }

      // Step 2: Get unique batch_inventory_ids
      const batchIds = [...new Set(movements.map(m => m.batch_inventory_id).filter(Boolean))];

      if (batchIds.length === 0) {
        setOpeningStockHistory(movements);
        return;
      }

      // Step 3: Fetch batch details (NO medicine join - just basic fields)
      const { data: batches, error: batchError } = await supabase
        .from('medicine_batch_inventory')
        .select('id, batch_number, pieces_per_pack, medicine_id')
        .in('id', batchIds);

      if (batchError) {
        console.error('Error fetching batch details:', batchError);
        setOpeningStockHistory(movements);
        return;
      }

      // Step 4: Get unique medicine_ids from batches
      const medicineIds = [...new Set(batches?.map(b => b.medicine_id).filter(Boolean) || [])];

      // Step 5: Fetch medicine names separately (NO join)
      let medicineMap = new Map<string, string>();
      if (medicineIds.length > 0) {
        const { data: medicines, error: medError } = await supabase
          .from('medicine_master')
          .select('id, medicine_name')
          .in('id', medicineIds);

        if (!medError && medicines) {
          medicineMap = new Map(medicines.map(m => [m.id, m.medicine_name]));
        }
      }

      // Step 6: Create batch lookup map with medicine names attached
      const batchMap = new Map(batches?.map(b => [b.id, {
        ...b,
        medicine_name: medicineMap.get(b.medicine_id) || 'N/A'
      }]) || []);

      // Step 7: Merge all data together
      const enrichedHistory = movements.map(movement => ({
        ...movement,
        batch: batchMap.get(movement.batch_inventory_id) || null
      }));

      setOpeningStockHistory(enrichedHistory);
    } catch (error) {
      console.error('Error fetching opening stock history:', error);
      toast.error('Failed to fetch opening stock history');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Refresh handler
  const handleRefresh = () => {
    refetchInventory();
    refetchAlerts();
    toast.success('Stock data refreshed');
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);

  const getStockStatus = (current: number, minimum: number, reorder: number) => {
    if (current === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (current <= minimum) return { status: 'Critical Low', color: 'bg-red-100 text-red-800' };
    if (current <= reorder) return { status: 'Low Stock', color: 'bg-orange-100 text-orange-800' };
    if (current <= reorder * 2) return { status: 'Moderate', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'Good Stock', color: 'bg-green-100 text-green-800' };
  };

  const getExpiryStatus = (days: number) => {
    if (days < 0) return { status: 'Expired', color: 'bg-red-100 text-red-800' };
    if (days <= 30) return { status: 'Expiring Soon', color: 'bg-orange-100 text-orange-800' };
    if (days <= 90) return { status: 'Expires in 3 months', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'Good', color: 'bg-green-100 text-green-800' };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'OUT': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'ADJUSTMENT': return <ArrowUpDown className="h-4 w-4 text-blue-600" />;
      case 'TRANSFER': return <Truck className="h-4 w-4 text-purple-600" />;
      case 'DAMAGE': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'EXPIRY': return <Clock className="h-4 w-4 text-orange-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredStockItems = stockItems.filter(item => {
    const matchesSearch = item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.batch_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStockFilter = stockFilter === 'all' || 
                              (stockFilter === 'low' && item.current_stock <= item.minimum_stock_level) ||
                              (stockFilter === 'out' && item.current_stock === 0) ||
                              (stockFilter === 'expiring' && item.days_to_expiry <= 90);
    
    return matchesSearch && matchesStockFilter;
  });

  const filteredAlerts = (stockAlerts || []).filter(alert => {
    if (alertFilter === 'all') return true;
    if (alertFilter === 'EXPIRING_SOON') return alert.alert_type === 'EXPIRING_SOON';
    return alert.alert_type === alertFilter;
  });

  const stockStats = {
    totalItems: stockItems.length,
    lowStockItems: (stockAlerts || []).filter(a => a.alert_type === 'LOW_STOCK').length,
    outOfStockItems: stockItems.filter(item => item.current_stock === 0).length,
    expiringItems: (stockAlerts || []).filter(a => a.alert_type === 'NEAR_EXPIRY').length,
    expiredItems: (stockAlerts || []).filter(a => a.alert_type === 'EXPIRED').length,
    totalValue: stockItems.reduce((sum, item) => sum + (item.current_stock * (item.purchase_rate || item.mrp || 0)), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Stock Management</h2>
            <p className="text-sm text-muted-foreground">
              Monitor inventory levels, track stock movements, and manage alerts
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoadingInventory}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingInventory ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsHistoryDialogOpen(true);
              fetchOpeningStockHistory();
            }}
          >
            <History className="h-4 w-4 mr-2" />
            Opening Stock History
          </Button>
          <Dialog open={isOpeningStockDialogOpen} onOpenChange={setIsOpeningStockDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Add Opening Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Opening Stock</DialogTitle>
              </DialogHeader>
              <OpeningStockForm onSuccess={() => {
                setIsOpeningStockDialogOpen(false);
                handleRefresh();
              }} />
            </DialogContent>
          </Dialog>
          <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Stock Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Stock Adjustment</DialogTitle>
              </DialogHeader>
              <StockAdjustmentForm onSuccess={() => {
                setIsAdjustmentDialogOpen(false);
                handleRefresh();
              }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stockStats.totalItems}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stockStats.lowStockItems}</div>
              <div className="text-sm text-muted-foreground">Low Stock</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stockStats.outOfStockItems}</div>
              <div className="text-sm text-muted-foreground">Out of Stock</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stockStats.expiringItems}</div>
              <div className="text-sm text-muted-foreground">Expiring Soon</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stockStats.expiredItems}</div>
              <div className="text-sm text-muted-foreground">Expired</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{formatCurrency(stockStats.totalValue)}</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoadingInventory && (
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading batch inventory...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoadingInventory && (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory">Inventory ({stockItems.length})</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({(stockAlerts || []).length})</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by medicine name, generic name, or batch number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  className="px-3 py-2 border rounded-md"
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                >
                  <option value="all">All Stock Levels</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                  <option value="expiring">Expiring Soon</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Items ({filteredStockItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicine Details</TableHead>
                      <TableHead>Batch Info</TableHead>
                      <TableHead>Stock Levels</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Expiry Status</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStockItems.map((item) => {
                      const stockStatus = getStockStatus(item.current_stock, item.minimum_stock_level, item.reorder_level);
                      const expiryStatus = getExpiryStatus(item.days_to_expiry);
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.medicine_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.generic_name} • {item.strength} • {item.dosage_form}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-mono text-sm">{item.batch_number}</div>
                              <div className="text-xs text-muted-foreground">
                                MFG: {item.manufacturing_date}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                EXP: {item.expiry_date}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">Current: {item.current_stock}</div>
                              <div className="text-sm text-muted-foreground">
                                Reserved: {item.reserved_stock}
                              </div>
                              {item.damaged_stock > 0 && (
                                <div className="text-sm text-red-600">
                                  Damaged: {item.damaged_stock}
                                </div>
                              )}
                              <Badge className={stockStatus.color}>
                                {stockStatus.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <div className="text-sm">
                                <div>{item.rack_number}</div>
                                <div className="text-muted-foreground">{item.shelf_location}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm">{item.days_to_expiry} days</div>
                              <Badge className={expiryStatus.color}>
                                {expiryStatus.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {formatCurrency(item.current_stock * (item.purchase_rate || item.mrp))}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Rate: {formatCurrency(item.purchase_rate || item.mrp)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedStockItem(item)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <select
                  className="px-3 py-2 border rounded-md"
                  value={alertFilter}
                  onChange={(e) => setAlertFilter(e.target.value)}
                >
                  <option value="all">All Alerts</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                  <option value="NEAR_EXPIRY">Near Expiry</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {filteredAlerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <AlertTriangle className={`h-6 w-6 ${
                        alert.severity === 'CRITICAL' ? 'text-red-600' :
                        alert.severity === 'HIGH' ? 'text-orange-600' :
                        alert.severity === 'MEDIUM' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                      <div>
                        <div className="font-medium">{alert.medicine_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Batch: {alert.batch_number}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        {alert.alert_type === 'LOW_STOCK' && `Stock: ${alert.current_stock}/${alert.threshold}`}
                        {alert.alert_type === 'OUT_OF_STOCK' && 'No stock available'}
                        {alert.alert_type === 'NEAR_EXPIRY' && `Expires in ${alert.days_to_expiry} days`}
                        {alert.alert_type === 'EXPIRED' && `Expired ${Math.abs(alert.days_to_expiry!)} days ago`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredAlerts.length === 0 && (
              <Card>
                <CardContent className="pt-8 pb-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">No alerts matching your criteria</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockMovements.map((movement) => (
                  <div key={movement.id} className="flex items-center gap-4 p-3 border rounded">
                    {getMovementIcon(movement.movement_type)}
                    <div className="flex-1">
                      <div className="font-medium">{movement.medicine_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Batch: {movement.batch_number}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {movement.reason}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {movement.quantity_changed > 0 ? '+' : ''}{movement.quantity_changed}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {movement.quantity_before} → {movement.quantity_after}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(movement.movement_date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Stock Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span>Inventory Valuation Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  <span>Low Stock Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Calendar className="h-6 w-6 mb-2" />
                  <span>Expiry Analysis Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <ArrowUpDown className="h-6 w-6 mb-2" />
                  <span>Stock Movement Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}

      {/* Empty State */}
      {!isLoadingInventory && stockItems.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Package className="h-16 w-16 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">No Batch Inventory Found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  No batch inventory records available. Stock will appear here after you receive medicines through GRN.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Item Details Dialog */}
      <Dialog open={!!selectedStockItem} onOpenChange={() => setSelectedStockItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Stock Item Details</DialogTitle>
          </DialogHeader>
          {selectedStockItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Medicine Name</label>
                  <p className="font-medium">{selectedStockItem.medicine_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Batch Number</label>
                  <p className="font-mono">{selectedStockItem.batch_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
                  <p className="text-2xl font-bold">{selectedStockItem.current_stock} units</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reserved Stock</label>
                  <p>{selectedStockItem.reserved_stock} units</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Supplier</label>
                  <p>{selectedStockItem.supplier_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p>{selectedStockItem.rack_number} - {selectedStockItem.shelf_location}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Opening Stock History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Opening Stock History
            </DialogTitle>
          </DialogHeader>
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading history...</p>
            </div>
          ) : openingStockHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No opening stock entries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead>Date</TableHead>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead className="text-right">Qty Added</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openingStockHistory.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {new Date(item.movement_date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(item.movement_date).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {item.batch?.medicine_name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {item.batch?.batch_number || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          +{item.quantity_changed}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {item.performed_by || 'System'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {item.reason || 'Opening Stock Entry'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Stock Adjustment Form Component
const StockAdjustmentForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { selectedHospital } = useAuth();
  const adjustBatchStockMutation = useAdjustBatchStock();

  const [medicineSearch, setMedicineSearch] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [searchingMedicines, setSearchingMedicines] = useState(false);

  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const { data: batches, isLoading: loadingBatches } = useMedicineBatches(
    selectedMedicine?.id || null,
    { has_stock: true }
  );

  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'EXPIRY'>('ADJUSTMENT');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');

  // Search medicines
  const searchMedicines = async (term: string) => {
    if (!term || term.length < 2) {
      setMedicines([]);
      return;
    }

    setSearchingMedicines(true);
    try {
      const { data, error } = await supabase
        .from('medication')
        .select('id, product_name, generic, manufacturer, item_code')
        .or(`product_name.ilike.%${term}%,generic.ilike.%${term}%,item_code.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;
      setMedicines(data || []);
    } catch (error) {
      console.error('Error searching medicines:', error);
      toast.error('Failed to search medicines');
    } finally {
      setSearchingMedicines(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBatch) {
      toast.error('Please select a batch');
      return;
    }

    if (quantity === 0) {
      toast.error('Quantity cannot be zero');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for adjustment');
      return;
    }

    try {
      await adjustBatchStockMutation.mutateAsync({
        batch_id: selectedBatch.id,
        adjustment_type: adjustmentType,
        quantity: Math.abs(quantity),
        reason: reason,
        performed_by: 'Current User', // TODO: Get from auth context
        reference_type: 'ADJUSTMENT'
      });

      toast.success('Stock adjustment recorded successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Error adjusting stock:', error);
      toast.error(error.message || 'Failed to adjust stock');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Medicine Search */}
      <div>
        <label className="text-sm font-medium block mb-2">Medicine *</label>
        <div className="relative">
          <Input
            required
            placeholder="Search by medicine name, generic name, or code..."
            value={medicineSearch}
            onChange={(e) => {
              setMedicineSearch(e.target.value);
              searchMedicines(e.target.value);
              setSelectedMedicine(null);
              setSelectedBatch(null);
            }}
            className="mb-2"
          />
          {searchingMedicines && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {medicines.length > 0 && !selectedMedicine && (
          <div className="border rounded-md max-h-48 overflow-y-auto">
            {medicines.map((med) => (
              <div
                key={med.id}
                className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                onClick={() => {
                  setSelectedMedicine(med);
                  setMedicineSearch(med.product_name);
                  setMedicines([]);
                }}
              >
                <div className="font-medium">{med.product_name}</div>
                <div className="text-sm text-muted-foreground">
                  {med.generic} • {med.manufacturer} • Code: {med.item_code}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedMedicine && (
          <div className="p-3 bg-accent rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{selectedMedicine.product_name}</div>
                <div className="text-sm text-muted-foreground">{selectedMedicine.generic}</div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedMedicine(null);
                  setSelectedBatch(null);
                  setMedicineSearch('');
                }}
              >
                Change
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Batch Selection */}
      {selectedMedicine && (
        <div>
          <label className="text-sm font-medium block mb-2">Select Batch *</label>
          {loadingBatches ? (
            <div className="flex items-center gap-2 p-3 border rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading batches...</span>
            </div>
          ) : batches && batches.length > 0 ? (
            <div className="border rounded-md max-h-64 overflow-y-auto">
              {batches.map((batch: any) => (
                <div
                  key={batch.id}
                  className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-accent ${
                    selectedBatch?.id === batch.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => setSelectedBatch(batch)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium font-mono">{batch.batch_number}</div>
                      <div className="text-sm text-muted-foreground">
                        Stock: {batch.current_stock} • Expires: {new Date(batch.expiry_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Location: {batch.rack_number} {batch.shelf_location}
                      </div>
                    </div>
                    {selectedBatch?.id === batch.id && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 border rounded-md text-center text-sm text-muted-foreground">
              No batches with stock available for this medicine
            </div>
          )}
        </div>
      )}

      {/* Adjustment Type */}
      <div>
        <label className="text-sm font-medium block mb-2">Adjustment Type *</label>
        <select
          className="w-full p-2 border rounded-md"
          value={adjustmentType}
          onChange={(e) => setAdjustmentType(e.target.value as any)}
          required
        >
          <option value="IN">Stock In (Increase)</option>
          <option value="OUT">Stock Out (Decrease)</option>
          <option value="ADJUSTMENT">Manual Adjustment</option>
          <option value="DAMAGE">Damage/Loss</option>
          <option value="EXPIRY">Expiry Removal</option>
        </select>
      </div>

      {/* Quantity */}
      <div>
        <label className="text-sm font-medium block mb-2">
          Quantity * {selectedBatch && `(Available: ${selectedBatch.current_stock})`}
        </label>
        <Input
          type="number"
          required
          min="1"
          max={adjustmentType === 'OUT' || adjustmentType === 'DAMAGE' || adjustmentType === 'EXPIRY'
            ? selectedBatch?.current_stock : undefined}
          value={quantity || ''}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          placeholder="Enter quantity"
        />
        {adjustmentType === 'IN' && (
          <p className="text-xs text-muted-foreground mt-1">This will increase the stock</p>
        )}
        {(adjustmentType === 'OUT' || adjustmentType === 'DAMAGE' || adjustmentType === 'EXPIRY') && (
          <p className="text-xs text-muted-foreground mt-1">This will decrease the stock</p>
        )}
      </div>

      {/* Reason */}
      <div>
        <label className="text-sm font-medium block mb-2">Reason *</label>
        <textarea
          className="w-full p-2 border rounded-md"
          rows={3}
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason for stock adjustment (e.g., Physical count correction, Damaged items, etc.)"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="submit"
          disabled={!selectedBatch || quantity === 0 || !reason.trim() || adjustBatchStockMutation.isPending}
        >
          {adjustBatchStockMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Recording...
            </>
          ) : (
            'Record Adjustment'
          )}
        </Button>
      </div>
    </form>
  );
};

// Opening Stock Form Component
const OpeningStockForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { hospitalConfig } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [medicineSearch, setMedicineSearch] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [searchingMedicines, setSearchingMedicines] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    batch_number: '',
    pieces_per_pack: '',
    qty_strips: '',
    qty_tablets: '',
    expiry_date: '',
    manufacturing_date: '',
    purchase_price: '',
    mrp: '',
    selling_price: '',
    supplier_id: '',
  });

  // Calculate total quantity
  const calculatedTotal = (() => {
    const piecesPerPack = parseInt(formData.pieces_per_pack) || 0;
    const qtyStrips = parseInt(formData.qty_strips) || 0;
    const qtyTablets = parseInt(formData.qty_tablets) || 0;
    return (qtyStrips * piecesPerPack) + qtyTablets;
  })();

  // Fetch suppliers on mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data } = await supabase
        .from('suppliers')
        .select('id, supplier_name')
        .order('supplier_name');
      if (data) setSuppliers(data);
    };
    fetchSuppliers();
  }, []);

  // Search medicines from medicine_master
  const searchMedicines = async (term: string) => {
    if (!term || term.length < 2) {
      setMedicines([]);
      return;
    }

    setSearchingMedicines(true);
    try {
      const { data, error } = await supabase
        .from('medicine_master')
        .select(`
          id,
          medicine_name,
          generic_name,
          type,
          manufacturer:manufacturer_companies(name)
        `)
        .eq('is_deleted', false)
        .eq('hospital_name', hospitalConfig?.fullName || '')
        .or(`medicine_name.ilike.%${term}%,generic_name.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;
      setMedicines(data || []);
    } catch (error) {
      console.error('Error searching medicines:', error);
      toast.error('Failed to search medicines');
    } finally {
      setSearchingMedicines(false);
    }
  };

  const handleMedicineSelect = (med: any) => {
    setSelectedMedicine(med);
    setMedicineSearch(med.medicine_name);
    setMedicines([]);
    // Auto-fill prices from medicine master
    setFormData(prev => ({
      ...prev,
      purchase_price: med.purchase_price?.toString() || '',
      mrp: med.mrp_price?.toString() || '',
      selling_price: med.selling_price?.toString() || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMedicine) {
      toast.error('Please select a medicine');
      return;
    }

    if (!formData.batch_number.trim()) {
      toast.error('Please enter batch number');
      return;
    }

    if (!formData.pieces_per_pack || parseInt(formData.pieces_per_pack) <= 0) {
      toast.error('Please enter pieces per pack (tablets per strip)');
      return;
    }

    if (!formData.qty_strips || parseInt(formData.qty_strips) <= 0) {
      toast.error('Please enter number of strips');
      return;
    }

    if (calculatedTotal <= 0) {
      toast.error('Total quantity must be greater than 0');
      return;
    }

    if (!formData.expiry_date) {
      toast.error('Please enter expiry date');
      return;
    }

    setIsSubmitting(true);
    try {
      const { addOpeningStock } = await import('@/lib/batch-inventory-service');

      await addOpeningStock({
        medicine_id: selectedMedicine.id,
        batch_number: formData.batch_number,
        quantity: calculatedTotal,
        pieces_per_pack: parseInt(formData.pieces_per_pack),
        expiry_date: formData.expiry_date,
        manufacturing_date: formData.manufacturing_date || undefined,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : undefined,
        mrp: formData.mrp ? parseFloat(formData.mrp) : undefined,
        selling_price: formData.selling_price ? parseFloat(formData.selling_price) : undefined,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : undefined,
        hospital_name: hospitalConfig.fullName,
      });

      toast.success('Opening stock added successfully! Stock is now available for sale.');
      onSuccess();
    } catch (error: any) {
      console.error('Error adding opening stock:', error);
      toast.error(error.message || 'Failed to add opening stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Medicine Search */}
      <div>
        <label className="text-sm font-medium block mb-2">Medicine *</label>
        <div className="relative">
          <Input
            required
            placeholder="Search by medicine name or generic name..."
            value={medicineSearch}
            onChange={(e) => {
              setMedicineSearch(e.target.value);
              searchMedicines(e.target.value);
              setSelectedMedicine(null);
            }}
            className="mb-2"
          />
          {searchingMedicines && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {medicines.length > 0 && !selectedMedicine && (
          <div className="border rounded-md max-h-48 overflow-y-auto">
            {medicines.map((med) => (
              <div
                key={med.id}
                className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                onClick={() => handleMedicineSelect(med)}
              >
                <div className="font-medium">{med.medicine_name}</div>
                <div className="text-sm text-muted-foreground">
                  {med.generic_name} • {med.manufacturer?.name || 'N/A'} • {med.type || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedMedicine && (
          <div className="p-3 bg-accent rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{selectedMedicine.medicine_name}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedMedicine.generic_name} • {selectedMedicine.manufacturer?.name || 'N/A'}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedMedicine(null);
                  setMedicineSearch('');
                }}
              >
                Change
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Batch Number */}
      <div>
        <label className="text-sm font-medium block mb-2">Batch Number *</label>
        <Input
          required
          placeholder="e.g., BATCH001"
          value={formData.batch_number}
          onChange={(e) => setFormData(prev => ({ ...prev, batch_number: e.target.value }))}
        />
      </div>

      {/* Quantity Section */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium block mb-2">Pieces/Pack *</label>
          <Input
            type="number"
            required
            min="1"
            placeholder="e.g., 10"
            value={formData.pieces_per_pack}
            onChange={(e) => setFormData(prev => ({ ...prev, pieces_per_pack: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground mt-1">Tablets per strip</p>
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">No. of Strips *</label>
          <Input
            type="number"
            required
            min="1"
            placeholder="e.g., 5"
            value={formData.qty_strips}
            onChange={(e) => setFormData(prev => ({ ...prev, qty_strips: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">Loose Tablets</label>
          <Input
            type="number"
            min="0"
            placeholder="e.g., 0"
            value={formData.qty_tablets}
            onChange={(e) => setFormData(prev => ({ ...prev, qty_tablets: e.target.value }))}
          />
        </div>
      </div>

      {/* Show calculated total */}
      {(formData.pieces_per_pack && formData.qty_strips) && (
        <div className="bg-gray-50 p-3 rounded-md border">
          <p className="text-sm">
            Total Stock: <strong className="text-lg">{calculatedTotal}</strong> tablets
            {formData.pieces_per_pack && formData.qty_strips && (
              <span className="text-muted-foreground ml-2">
                ({formData.qty_strips} strips × {formData.pieces_per_pack} tablets{formData.qty_tablets ? ` + ${formData.qty_tablets} loose` : ''})
              </span>
            )}
          </p>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-2">Manufacturing Date</label>
          <Input
            type="date"
            value={formData.manufacturing_date}
            onChange={(e) => setFormData(prev => ({ ...prev, manufacturing_date: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">Expiry Date *</label>
          <Input
            type="date"
            required
            value={formData.expiry_date}
            onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
          />
        </div>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium block mb-2">Purchase Price (₹)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.purchase_price}
            onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">Selling Price (₹)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.selling_price}
            onChange={(e) => setFormData(prev => ({ ...prev, selling_price: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">MRP (₹)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.mrp}
            onChange={(e) => setFormData(prev => ({ ...prev, mrp: e.target.value }))}
          />
        </div>
      </div>

      {/* Supplier */}
      <div>
        <label className="text-sm font-medium block mb-2">Supplier</label>
        <select
          className="w-full p-2 border rounded-md"
          value={formData.supplier_id}
          onChange={(e) => setFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
        >
          <option value="">Select Supplier</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.supplier_name}</option>
          ))}
        </select>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="submit"
          disabled={!selectedMedicine || !formData.batch_number || !formData.pieces_per_pack || !formData.qty_strips || calculatedTotal <= 0 || !formData.expiry_date || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Adding Stock...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Opening Stock
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default StockManagement;