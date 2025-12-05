import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Download, Calendar, DollarSign, Package, AlertTriangle } from 'lucide-react';
import { InventoryItem } from '@/types/operation-theatre';

interface InventoryReportsProps {
  inventory: InventoryItem[];
}

interface UsageReport {
  item_id: string;
  item_name: string;
  category: string;
  consumed_quantity: number;
  current_stock: number;
  cost_consumed: number;
  usage_trend: 'increasing' | 'decreasing' | 'stable';
}

interface StockValuationReport {
  category: string;
  total_items: number;
  total_quantity: number;
  total_value: number;
  percentage_of_total: number;
}

export const InventoryReports: React.FC<InventoryReportsProps> = ({ inventory }) => {
  const [selectedReport, setSelectedReport] = useState<'valuation' | 'usage' | 'expiry' | 'turnover'>('valuation');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  // Mock usage data - in real implementation, this would come from transaction history
  const mockUsageData: UsageReport[] = [
    {
      item_id: '1',
      item_name: 'Surgical Gloves',
      category: 'consumables',
      consumed_quantity: 500,
      current_stock: 150,
      cost_consumed: 25000,
      usage_trend: 'increasing'
    },
    {
      item_id: '2',
      item_name: 'Gauze Pads',
      category: 'consumables',
      consumed_quantity: 300,
      current_stock: 200,
      cost_consumed: 15000,
      usage_trend: 'stable'
    },
    {
      item_id: '3',
      item_name: 'Syringes',
      category: 'consumables',
      consumed_quantity: 800,
      current_stock: 100,
      cost_consumed: 40000,
      usage_trend: 'increasing'
    }
  ];

  const getStockValuationReport = (): StockValuationReport[] => {
    const categoryTotals = inventory.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {
          total_items: 0,
          total_quantity: 0,
          total_value: 0
        };
      }
      acc[item.category].total_items += 1;
      acc[item.category].total_quantity += item.current_stock;
      acc[item.category].total_value += item.current_stock * item.unit_cost;
      return acc;
    }, {} as Record<string, any>);

    const totalValue = Object.values(categoryTotals).reduce((sum: number, cat: any) => sum + cat.total_value, 0);

    return Object.entries(categoryTotals).map(([category, data]: [string, any]) => ({
      category,
      total_items: data.total_items,
      total_quantity: data.total_quantity,
      total_value: data.total_value,
      percentage_of_total: (data.total_value / totalValue) * 100
    }));
  };

  const getExpiryReport = () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    return {
      expired: inventory.filter(item => 
        item.expiry_date && new Date(item.expiry_date) <= now
      ),
      expiring_soon: inventory.filter(item => 
        item.expiry_date && 
        new Date(item.expiry_date) > now && 
        new Date(item.expiry_date) <= thirtyDaysFromNow
      ),
      expiring_3_months: inventory.filter(item => 
        item.expiry_date && 
        new Date(item.expiry_date) > thirtyDaysFromNow && 
        new Date(item.expiry_date) <= ninetyDaysFromNow
      )
    };
  };

  const getTurnoverReport = () => {
    return inventory.map(item => {
      const daysOfStock = item.usage_per_day ? item.current_stock / item.usage_per_day : 0;
      const turnoverRate = daysOfStock > 0 ? 365 / daysOfStock : 0;
      const category = turnoverRate > 12 ? 'fast' : turnoverRate > 4 ? 'medium' : 'slow';
      
      return {
        ...item,
        daysOfStock,
        turnoverRate,
        category
      };
    }).sort((a, b) => b.turnoverRate - a.turnoverRate);
  };

  const valuationReport = getStockValuationReport();
  const expiryReport = getExpiryReport();
  const turnoverReport = getTurnoverReport();

  const downloadReport = (reportType: string) => {
    // In real implementation, this would generate and download a CSV/PDF report
    console.log(`Downloading ${reportType} report for ${timeRange}`);
  };

  const renderValuationReport = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Stock Valuation by Category
          <Button variant="outline" onClick={() => downloadReport('valuation')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Quantity</TableHead>
              <TableHead>Total Value</TableHead>
              <TableHead>% of Total</TableHead>
              <TableHead>Distribution</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {valuationReport.map(category => (
              <TableRow key={category.category}>
                <TableCell className="font-medium capitalize">
                  {category.category.replace('_', ' ')}
                </TableCell>
                <TableCell>{category.total_items}</TableCell>
                <TableCell>{category.total_quantity}</TableCell>
                <TableCell>₹{category.total_value.toLocaleString()}</TableCell>
                <TableCell>{category.percentage_of_total.toFixed(1)}%</TableCell>
                <TableCell>
                  <Progress value={category.percentage_of_total} className="h-2" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderUsageReport = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Usage Analysis ({timeRange})
          <Button variant="outline" onClick={() => downloadReport('usage')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Consumed</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Cost Consumed</TableHead>
              <TableHead>Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockUsageData.map(item => (
              <TableRow key={item.item_id}>
                <TableCell className="font-medium">{item.item_name}</TableCell>
                <TableCell className="capitalize">{item.category.replace('_', ' ')}</TableCell>
                <TableCell>{item.consumed_quantity}</TableCell>
                <TableCell>{item.current_stock}</TableCell>
                <TableCell>₹{item.cost_consumed.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={
                    item.usage_trend === 'increasing' ? 'destructive' :
                    item.usage_trend === 'decreasing' ? 'default' : 'outline'
                  }>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {item.usage_trend}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderExpiryReport = () => (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired Items</p>
                <p className="text-2xl font-bold text-red-600">{expiryReport.expired.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring (30 days)</p>
                <p className="text-2xl font-bold text-orange-600">{expiryReport.expiring_soon.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring (90 days)</p>
                <p className="text-2xl font-bold text-yellow-600">{expiryReport.expiring_3_months.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Expiry Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Expiry Details
            <Button variant="outline" onClick={() => downloadReport('expiry')}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Batch Number</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Days Until Expiry</TableHead>
                <TableHead>Value at Risk</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...expiryReport.expired, ...expiryReport.expiring_soon, ...expiryReport.expiring_3_months]
                .sort((a, b) => {
                  if (!a.expiry_date) return 1;
                  if (!b.expiry_date) return -1;
                  return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
                })
                .map(item => {
                  if (!item.expiry_date) return null;
                  const daysUntilExpiry = Math.ceil(
                    (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  const valueAtRisk = item.current_stock * item.unit_cost;
                  const status = daysUntilExpiry <= 0 ? 'expired' : 
                                daysUntilExpiry <= 30 ? 'critical' : 'warning';
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.batch_number || '-'}</TableCell>
                      <TableCell>{item.current_stock}</TableCell>
                      <TableCell>{new Date(item.expiry_date).toLocaleDateString()}</TableCell>
                      <TableCell>{daysUntilExpiry} days</TableCell>
                      <TableCell>₹{valueAtRisk.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          status === 'expired' ? 'destructive' :
                          status === 'critical' ? 'default' : 'outline'
                        }>
                          {status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderTurnoverReport = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Inventory Turnover Analysis
          <Button variant="outline" onClick={() => downloadReport('turnover')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Daily Usage</TableHead>
              <TableHead>Days of Stock</TableHead>
              <TableHead>Annual Turnover</TableHead>
              <TableHead>Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {turnoverReport.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.current_stock}</TableCell>
                <TableCell>{item.usage_per_day || 'N/A'}</TableCell>
                <TableCell>
                  {item.daysOfStock > 0 ? `${Math.round(item.daysOfStock)} days` : 'N/A'}
                </TableCell>
                <TableCell>
                  {item.turnoverRate > 0 ? `${item.turnoverRate.toFixed(1)}x` : 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge variant={
                    item.category === 'fast' ? 'default' :
                    item.category === 'medium' ? 'outline' : 'destructive'
                  }>
                    {item.category} moving
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={selectedReport} onValueChange={(value: any) => setSelectedReport(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="valuation">Stock Valuation</SelectItem>
              <SelectItem value="usage">Usage Analysis</SelectItem>
              <SelectItem value="expiry">Expiry Management</SelectItem>
              <SelectItem value="turnover">Turnover Analysis</SelectItem>
            </SelectContent>
          </Select>

          {selectedReport === 'usage' && (
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Report Content */}
      {selectedReport === 'valuation' && renderValuationReport()}
      {selectedReport === 'usage' && renderUsageReport()}
      {selectedReport === 'expiry' && renderExpiryReport()}
      {selectedReport === 'turnover' && renderTurnoverReport()}
    </div>
  );
};