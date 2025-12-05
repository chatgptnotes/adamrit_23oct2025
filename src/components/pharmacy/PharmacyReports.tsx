// Pharmacy Reports and Analytics Component
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  Package,
  Download,
  FileText,
  ShoppingCart
} from 'lucide-react';

const PharmacyReports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateRange, setDateRange] = useState({ from: '2025-06-01', to: '2025-06-13' });

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);

  const generateReport = () => {
    console.log('Generating report:', { selectedReport, dateRange });
    alert(`Generating ${selectedReport} report from ${dateRange.from} to ${dateRange.to}`);
  };

  const exportReport = (format: 'PDF' | 'Excel' | 'CSV') => {
    console.log('Exporting report:', { selectedReport, format });
    alert(`Exporting ${selectedReport} report as ${format} (Demo mode)`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Pharmacy Reports & Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Generate comprehensive reports and analyze pharmacy performance
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport('PDF')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => exportReport('Excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Report Type</label>
              <select
                className="w-full p-2 border rounded"
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
              >
                <option value="sales">Sales Report</option>
                <option value="inventory">Inventory Report</option>
                <option value="profitability">Profitability Report</option>
                <option value="prescription">Prescription Report</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={generateReport} className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedReport} onValueChange={setSelectedReport} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="prescription">Prescriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          {/* Sales Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                    <p className="text-2xl font-bold">1,247</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(3876540)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Items Sold</p>
                    <p className="text-2xl font-bold">15,670</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Bill Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(3108)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">June 2025 Sales Summary</h3>
                  <p className="text-muted-foreground">Comprehensive sales analytics for the current period</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">↗ 12%</div>
                    <div className="text-sm text-muted-foreground">Growth vs Last Month</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">567</div>
                    <div className="text-sm text-muted-foreground">Unique Customers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">4.2</div>
                    <div className="text-sm text-muted-foreground">Avg Items per Sale</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">89%</div>
                    <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">1,247</div>
                  <div className="text-sm text-muted-foreground">Total Medicines</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{formatCurrency(5670000)}</div>
                  <div className="text-sm text-muted-foreground">Stock Value</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">23</div>
                  <div className="text-sm text-muted-foreground">Low Stock Items</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profitability Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{formatCurrency(986540)}</div>
                  <div className="text-sm text-muted-foreground">Gross Profit</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">25.4%</div>
                  <div className="text-sm text-muted-foreground">Profit Margin</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{formatCurrency(2890000)}</div>
                  <div className="text-sm text-muted-foreground">Total Cost</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prescription Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">567</div>
                  <div className="text-sm text-muted-foreground">Total Prescriptions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">89%</div>
                  <div className="text-sm text-muted-foreground">Fulfillment Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">4.2 min</div>
                  <div className="text-sm text-muted-foreground">Avg Processing Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Report Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col" onClick={() => exportReport('PDF')}>
              <FileText className="h-6 w-6 mb-2" />
              <span>Daily Sales</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => exportReport('Excel')}>
              <Package className="h-6 w-6 mb-2" />
              <span>Stock Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => exportReport('PDF')}>
              <TrendingUp className="h-6 w-6 mb-2" />
              <span>Profit Analysis</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => exportReport('CSV')}>
              <BarChart3 className="h-6 w-6 mb-2" />
              <span>Custom Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PharmacyReports;