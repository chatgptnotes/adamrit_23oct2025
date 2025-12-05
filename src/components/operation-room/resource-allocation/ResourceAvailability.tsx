import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, TrendingUp, AlertTriangle, CheckCircle, Users, Package, Wrench } from 'lucide-react';
import { Equipment, StaffMember, OperationTheatre } from '@/types/operation-theatre';

interface ResourceAvailabilityProps {
  equipment: Equipment[];
  staff: StaffMember[];
  theatres: OperationTheatre[];
}

export const ResourceAvailability: React.FC<ResourceAvailabilityProps> = ({
  equipment,
  staff,
  theatres
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month'>('today');

  const getEquipmentAvailability = () => {
    const total = equipment.length;
    const available = equipment.filter(e => e.status === 'available').length;
    const inUse = equipment.filter(e => e.status === 'in_use').length;
    const maintenance = equipment.filter(e => e.status === 'maintenance').length;
    const outOfStock = equipment.filter(e => e.status === 'out_of_stock').length;

    return {
      total,
      available,
      inUse,
      maintenance,
      outOfStock,
      availabilityRate: Math.round((available / total) * 100)
    };
  };

  const getStaffAvailability = () => {
    const total = staff.length;
    const available = staff.filter(s => s.availability_status === 'available').length;
    const busy = staff.filter(s => s.availability_status === 'busy').length;
    const onBreak = staff.filter(s => s.availability_status === 'on_break').length;
    const offDuty = staff.filter(s => s.availability_status === 'off_duty').length;

    return {
      total,
      available,
      busy,
      onBreak,
      offDuty,
      availabilityRate: Math.round((available / total) * 100)
    };
  };

  const getTheatreAvailability = () => {
    const total = theatres.length;
    const available = theatres.filter(t => t.status === 'available').length;
    const occupied = theatres.filter(t => t.status === 'occupied').length;
    const cleaning = theatres.filter(t => t.status === 'cleaning').length;
    const maintenance = theatres.filter(t => t.status === 'maintenance').length;

    return {
      total,
      available,
      occupied,
      cleaning,
      maintenance,
      utilizationRate: Math.round((occupied / total) * 100)
    };
  };

  const getResourceUtilizationTrends = () => {
    // Mock data for demonstration - in real implementation, this would come from historical data
    const equipmentTrend = [
      { time: '08:00', utilization: 45 },
      { time: '10:00', utilization: 78 },
      { time: '12:00', utilization: 92 },
      { time: '14:00', utilization: 85 },
      { time: '16:00', utilization: 67 },
      { time: '18:00', utilization: 34 },
    ];

    const staffTrend = [
      { time: '08:00', utilization: 56 },
      { time: '10:00', utilization: 89 },
      { time: '12:00', utilization: 95 },
      { time: '14:00', utilization: 78 },
      { time: '16:00', utilization: 67 },
      { time: '18:00', utilization: 45 },
    ];

    return { equipmentTrend, staffTrend };
  };

  const getCriticalResourceAlerts = () => {
    const alerts = [];

    // Equipment alerts
    const lowStockEquipment = equipment.filter(e => 
      e.quantity_available <= 5 && e.type === 'disposable'
    );
    if (lowStockEquipment.length > 0) {
      alerts.push({
        type: 'equipment',
        severity: 'warning',
        message: `${lowStockEquipment.length} equipment items running low`,
        items: lowStockEquipment.map(e => e.name)
      });
    }

    // Staff alerts
    const availableStaff = staff.filter(s => s.availability_status === 'available');
    if (availableStaff.length < 5) {
      alerts.push({
        type: 'staff',
        severity: 'critical',
        message: `Only ${availableStaff.length} staff members available`,
        items: []
      });
    }

    // Theatre alerts
    const availableTheatres = theatres.filter(t => t.status === 'available');
    if (availableTheatres.length === 0) {
      alerts.push({
        type: 'theatre',
        severity: 'critical',
        message: 'No operation theatres available',
        items: []
      });
    }

    return alerts;
  };

  const getResourceForecast = () => {
    // Mock forecast data - in real implementation, this would be calculated based on historical patterns
    return {
      peakHours: ['10:00-14:00'],
      expectedShortages: [
        { resource: 'Surgical Nurses', time: '14:00', severity: 'medium' },
        { resource: 'Anesthesia Machines', time: '11:00', severity: 'low' }
      ],
      recommendations: [
        'Schedule additional staff for 10:00-14:00 peak period',
        'Prepare backup equipment for high-demand procedures',
        'Consider staggering non-emergency surgeries'
      ]
    };
  };

  const equipmentStats = getEquipmentAvailability();
  const staffStats = getStaffAvailability();
  const theatreStats = getTheatreAvailability();
  const utilization = getResourceUtilizationTrends();
  const alerts = getCriticalResourceAlerts();
  const forecast = getResourceForecast();

  return (
    <div className="space-y-6">
      {/* Resource Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Equipment Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-green-600">
                  {equipmentStats.available}
                </span>
                <Badge variant="outline">
                  {equipmentStats.availabilityRate}% Available
                </Badge>
              </div>
              <Progress value={equipmentStats.availabilityRate} className="h-2" />
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>In Use:</span>
                  <span>{equipmentStats.inUse}</span>
                </div>
                <div className="flex justify-between">
                  <span>Maintenance:</span>
                  <span>{equipmentStats.maintenance}</span>
                </div>
                <div className="flex justify-between">
                  <span>Out of Stock:</span>
                  <span>{equipmentStats.outOfStock}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Staff Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-blue-600">
                  {staffStats.available}
                </span>
                <Badge variant="outline">
                  {staffStats.availabilityRate}% Available
                </Badge>
              </div>
              <Progress value={staffStats.availabilityRate} className="h-2" />
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Busy:</span>
                  <span>{staffStats.busy}</span>
                </div>
                <div className="flex justify-between">
                  <span>On Break:</span>
                  <span>{staffStats.onBreak}</span>
                </div>
                <div className="flex justify-between">
                  <span>Off Duty:</span>
                  <span>{staffStats.offDuty}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Wrench className="w-4 h-4 mr-2" />
              Theatre Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-purple-600">
                  {theatreStats.occupied}
                </span>
                <Badge variant="outline">
                  {theatreStats.utilizationRate}% Utilized
                </Badge>
              </div>
              <Progress value={theatreStats.utilizationRate} className="h-2" />
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Available:</span>
                  <span>{theatreStats.available}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cleaning:</span>
                  <span>{theatreStats.cleaning}</span>
                </div>
                <div className="flex justify-between">
                  <span>Maintenance:</span>
                  <span>{theatreStats.maintenance}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
              Critical Resource Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  alert.severity === 'critical' 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{alert.message}</span>
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                      {alert.severity}
                    </Badge>
                  </div>
                  {alert.items.length > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      {alert.items.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analytics */}
      <Tabs value={selectedTimeRange} onValueChange={(value: any) => setSelectedTimeRange(value)}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Resource Analytics</h3>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={selectedTimeRange} className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Utilization Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Resource Utilization Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Equipment Utilization</h4>
                    <div className="space-y-2">
                      {utilization.equipmentTrend.map((point, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{point.time}</span>
                          <div className="flex items-center gap-2 flex-1 mx-3">
                            <Progress value={point.utilization} className="h-2" />
                            <span className="text-xs text-gray-600 w-10">{point.utilization}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Staff Utilization</h4>
                    <div className="space-y-2">
                      {utilization.staffTrend.map((point, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{point.time}</span>
                          <div className="flex items-center gap-2 flex-1 mx-3">
                            <Progress value={point.utilization} className="h-2" />
                            <span className="text-xs text-gray-600 w-10">{point.utilization}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resource Forecast */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Resource Forecast & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Peak Hours</h4>
                    <div className="flex flex-wrap gap-2">
                      {forecast.peakHours.map((hour, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {hour}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Expected Shortages</h4>
                    <div className="space-y-2">
                      {forecast.expectedShortages.map((shortage, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                          <div className="flex justify-between items-center">
                            <span>{shortage.resource}</span>
                            <Badge variant="outline" className="text-xs">
                              {shortage.time}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                    <div className="space-y-2">
                      {forecast.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};