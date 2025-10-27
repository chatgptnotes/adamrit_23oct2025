// Enterprise Pharmacy Dashboard
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pill,
  ShoppingCart,
  FileText,
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Clock,
  Calendar,
  BarChart3,
  Plus,
  Scan
} from 'lucide-react';

// Import pharmacy components (we'll create these)
import MedicineInventory from './MedicineInventory';
import PrescriptionManagement from './PrescriptionManagement';
import PharmacyBilling from './PharmacyBilling';
import StockManagement from './StockManagement';
import PharmacyReports from './PharmacyReports';
import SupplierMaster from './SupplierMaster';
import SalesDetails from './SalesDetails';
import TreatmentSheetList from './TreatmentSheetList';
import MedicineItems from './MedicineItems';
import DirectSaleBill from './DirectSaleBill';
import DirectSaleView from './DirectSaleView';
import PurchaseOrders from './PurchaseOrders';
import AddPurchaseOrder from './AddPurchaseOrder';

const PharmacyDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [directSaleSubTab, setDirectSaleSubTab] = useState('bill'); // 'bill' or 'view'
  const [purchaseOrderView, setPurchaseOrderView] = useState<'list' | 'add'>('list');

  // Mock data for dashboard - will be replaced with real data from hooks
  const dashboardData = {
    todaySales: 45,
    todayRevenue: 125750,
    pendingPrescriptions: 12,
    lowStockItems: 8,
    nearExpiryItems: 15,
    totalMedicines: 1247,
    monthRevenue: 3876540,
    prescriptionsProcessed: 567
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);

  const recentActivities = [
    { id: 1, type: 'sale', description: 'Medicine dispensed to Patient #1234', time: '2 min ago', amount: 450 },
    { id: 2, type: 'prescription', description: 'New prescription received from Dr. Smith', time: '5 min ago' },
    { id: 3, type: 'stock', description: 'Low stock alert: Paracetamol 500mg', time: '10 min ago', critical: true },
    { id: 4, type: 'sale', description: 'OTC sale completed', time: '15 min ago', amount: 125 },
    { id: 5, type: 'expiry', description: 'Medicines expiring in 30 days', time: '1 hour ago', critical: true }
  ];

  const topSellingMedicines = [
    { name: 'Paracetamol 500mg', sold: 145, revenue: 7250 },
    { name: 'Amoxicillin 250mg', sold: 89, revenue: 8900 },
    { name: 'Ibuprofen 400mg', sold: 67, revenue: 6700 },
    { name: 'Cetrizine 10mg', sold: 54, revenue: 2700 },
    { name: 'Omeprazole 20mg', sold: 43, revenue: 4300 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Pill className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Pharmacy Management</h1>
            <p className="text-muted-foreground">
              Enterprise-level pharmacy operations and inventory management
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-10 bg-blue-50 rounded-md">
          <div className="flex flex-row items-center gap-x-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="direct-sale">Direct Sale</TabsTrigger>
          <TabsTrigger value="billing">Sale Bill</TabsTrigger>
          <TabsTrigger value="view_sales">View Sales</TabsTrigger>
            <TabsTrigger value="stock-mgmt">Stock Mgmt</TabsTrigger>
          <TabsTrigger value="treatment-sheet">Treatment Sheet</TabsTrigger>
          <TabsTrigger value="manufacturer">Manufacturer</TabsTrigger>
          <TabsTrigger value="supplier">Supplier</TabsTrigger>
          <TabsTrigger value="purchase-order">Purchase Order</TabsTrigger>
          </div>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Today's Sales</p>
                    <p className="text-2xl font-bold text-green-600">{dashboardData.todaySales}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Revenue: {formatCurrency(dashboardData.todayRevenue)}
                    </p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Prescriptions</p>
                    <p className="text-2xl font-bold text-orange-600">{dashboardData.pendingPrescriptions}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Awaiting processing
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Stock Alerts</p>
                    <p className="text-2xl font-bold text-red-600">{dashboardData.lowStockItems}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Low stock items
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Medicines</p>
                    <p className="text-2xl font-bold">{dashboardData.totalMedicines}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      In inventory
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-auto flex-col py-4"
                  onClick={() => setSelectedTab('direct-sale')}
                >
                  <ShoppingCart className="h-6 w-6 mb-2" />
                  <span>Direct Sale</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col py-4"
                  onClick={() => setSelectedTab('billing')}
                >
                  <ShoppingCart className="h-6 w-6 mb-2" />
                  <span>Sale Bill</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col py-4"
                  onClick={() => setSelectedTab('items')}
                >
                  <Plus className="h-6 w-6 mb-2" />
                  <span>Add Medicine</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto flex-col py-4"
                >
                  <Scan className="h-6 w-6 mb-2" />
                  <span>Barcode Scan</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.critical ? 'bg-red-500' : 
                          activity.type === 'sale' ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                      {activity.amount && (
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(activity.amount)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Selling Medicines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Selling Medicines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topSellingMedicines.map((medicine, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium">{medicine.name}</p>
                        <p className="text-xs text-muted-foreground">{medicine.sold} units sold</p>
                      </div>
                      <span className="text-sm font-semibold">
                        {formatCurrency(medicine.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Today</span>
                    <span className="font-semibold">{formatCurrency(dashboardData.todayRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">This Month</span>
                    <span className="font-semibold">{formatCurrency(dashboardData.monthRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average/Day</span>
                    <span className="font-semibold">{formatCurrency(dashboardData.monthRevenue / 30)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Critical Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Low Stock</span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                      {dashboardData.lowStockItems}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Near Expiry</span>
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                      {dashboardData.nearExpiryItems}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Orders</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      3
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Prescriptions Processed</span>
                    <span className="font-semibold">{dashboardData.prescriptionsProcessed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average Processing Time</span>
                    <span className="font-semibold">4.2 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Customer Satisfaction</span>
                    <span className="font-semibold">98.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items">
          <MedicineItems />
        </TabsContent>

        <TabsContent value="direct-sale">
          <div className="space-y-4">
            {/* Sub-tabs for Direct Sale */}
            <div className="flex gap-2 border-b pb-2">
              <Button
                variant={directSaleSubTab === 'bill' ? 'default' : 'outline'}
                onClick={() => setDirectSaleSubTab('bill')}
                className="px-6"
              >
                Bill
              </Button>
              <Button
                variant={directSaleSubTab === 'view' ? 'default' : 'outline'}
                onClick={() => setDirectSaleSubTab('view')}
                className="px-6"
              >
                View
              </Button>
            </div>

            {/* Content based on selected sub-tab */}
            {directSaleSubTab === 'bill' && <DirectSaleBill />}
            {directSaleSubTab === 'view' && <DirectSaleView />}
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <PharmacyBilling />
        </TabsContent>

        <TabsContent value="stock-mgmt">
          <StockManagement />
        </TabsContent>

        <TabsContent value="reports">
          <PharmacyReports />
        </TabsContent>

        <TabsContent value="manufacturer">
          <SupplierMaster activeTab="manufacturer" />
        </TabsContent>

        <TabsContent value="supplier">
          <SupplierMaster activeTab="supplier" />
        </TabsContent>

        <TabsContent value="view_sales">
          <SalesDetails />
        </TabsContent>

        <TabsContent value="treatment-sheet">
          <TreatmentSheetList />
        </TabsContent>

        <TabsContent value="purchase-order">
          <div className="space-y-4">
            {/* Sub-tabs for Purchase Order */}
            <div className="flex gap-2 border-b pb-2">
              <Button
                variant={purchaseOrderView === 'list' ? 'default' : 'outline'}
                onClick={() => setPurchaseOrderView('list')}
                className="px-6"
              >
                Purchase Order List
              </Button>
              <Button
                variant={purchaseOrderView === 'add' ? 'default' : 'outline'}
                onClick={() => setPurchaseOrderView('add')}
                className="px-6"
              >
                Add Purchase Order
              </Button>
            </div>

            {/* Content based on selected sub-tab */}
            {purchaseOrderView === 'list' && (
              <PurchaseOrders onAddClick={() => setPurchaseOrderView('add')} />
            )}
            {purchaseOrderView === 'add' && (
              <AddPurchaseOrder onBack={() => setPurchaseOrderView('list')} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PharmacyDashboard;