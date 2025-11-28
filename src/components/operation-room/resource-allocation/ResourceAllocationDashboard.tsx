import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Users, Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { OperationTheatre, Equipment, StaffMember, ResourceAllocation } from '@/types/operation-theatre';
import { EquipmentAllocation } from './EquipmentAllocation';
import { StaffAllocation } from './StaffAllocation';
import { ResourceAvailability } from './ResourceAvailability';

interface ResourceAllocationDashboardProps {
  theatres: OperationTheatre[];
  equipment: Equipment[];
  staff: StaffMember[];
  allocations: ResourceAllocation[];
  onAllocateResource: (resourceId: string, patientId: string, quantity: number) => void;
  onDeallocateResource: (allocationId: string) => void;
}

export const ResourceAllocationDashboard: React.FC<ResourceAllocationDashboardProps> = ({
  theatres,
  equipment,
  staff,
  allocations,
  onAllocateResource,
  onDeallocateResource
}) => {
  const [selectedTheatre, setSelectedTheatre] = useState<number | null>(null);

  const getResourceStats = () => {
    const equipmentStats = {
      total: equipment.length,
      available: equipment.filter(e => e.status === 'available').length,
      inUse: equipment.filter(e => e.status === 'in_use').length,
      maintenance: equipment.filter(e => e.status === 'maintenance').length,
      outOfStock: equipment.filter(e => e.status === 'out_of_stock').length
    };

    const staffStats = {
      total: staff.length,
      available: staff.filter(s => s.availability_status === 'available').length,
      busy: staff.filter(s => s.availability_status === 'busy').length,
      onBreak: staff.filter(s => s.availability_status === 'on_break').length,
      offDuty: staff.filter(s => s.availability_status === 'off_duty').length
    };

    return { equipmentStats, staffStats };
  };

  const getTheatreStatus = (theatre: OperationTheatre) => {
    const statusColors = {
      available: 'bg-green-100 text-green-800 border-green-200',
      occupied: 'bg-red-100 text-red-800 border-red-200',
      cleaning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      maintenance: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return statusColors[theatre.status];
  };

  const getCriticalAlerts = () => {
    const alerts = [];
    
    // Low stock equipment
    const lowStockEquipment = equipment.filter(e => 
      e.quantity_available <= 5 && e.type === 'disposable'
    );
    if (lowStockEquipment.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${lowStockEquipment.length} disposable items running low on stock`
      });
    }

    // Equipment maintenance due
    const maintenanceDue = equipment.filter(e => 
      e.last_sterilized && 
      new Date(e.last_sterilized).getTime() < Date.now() - (24 * 60 * 60 * 1000)
    );
    if (maintenanceDue.length > 0) {
      alerts.push({
        type: 'error',
        message: `${maintenanceDue.length} equipment items need sterilization`
      });
    }

    // Staff availability
    const availableStaff = staff.filter(s => s.availability_status === 'available');
    if (availableStaff.length < 3) {
      alerts.push({
        type: 'warning',
        message: `Only ${availableStaff.length} staff members available`
      });
    }

    return alerts;
  };

  const { equipmentStats, staffStats } = getResourceStats();
  const criticalAlerts = getCriticalAlerts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Resource Allocation Dashboard</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Clock className="w-4 h-4 mr-1" />
            {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="space-y-2">
          {criticalAlerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Equipment Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {equipmentStats.available}
                </p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {equipmentStats.inUse} in use, {equipmentStats.maintenance} maintenance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Staff Available</p>
                <p className="text-2xl font-bold text-blue-600">
                  {staffStats.available}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {staffStats.busy} busy, {staffStats.onBreak} on break
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Theatres</p>
                <p className="text-2xl font-bold text-purple-600">
                  {theatres.filter(t => t.status === 'occupied').length}
                </p>
              </div>
              <Wrench className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              of {theatres.length} total theatres
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Allocations</p>
                <p className="text-2xl font-bold text-orange-600">
                  {allocations.filter(a => a.status === 'allocated' || a.status === 'in_use').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Total: {allocations.length} allocations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Theatre Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Operation Theatre Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {theatres.map(theatre => (
              <Card 
                key={theatre.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTheatre === theatre.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedTheatre(
                  selectedTheatre === theatre.id ? null : theatre.id
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{theatre.name}</h3>
                    <Badge className={getTheatreStatus(theatre)}>
                      {theatre.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Capacity: {theatre.capacity} patients</p>
                    <p>Equipment: {theatre.equipment.length} items</p>
                    {theatre.specialty_type && (
                      <p>Specialty: {theatre.specialty_type}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Management Tabs */}
      <Tabs defaultValue="equipment" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="equipment">Equipment Allocation</TabsTrigger>
          <TabsTrigger value="staff">Staff Assignment</TabsTrigger>
          <TabsTrigger value="availability">Resource Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="mt-6">
          <EquipmentAllocation
            equipment={equipment}
            allocations={allocations.filter(a => a.resource_type === 'equipment')}
            selectedTheatre={selectedTheatre}
            onAllocate={onAllocateResource}
            onDeallocate={onDeallocateResource}
          />
        </TabsContent>

        <TabsContent value="staff" className="mt-6">
          <StaffAllocation
            staff={staff}
            allocations={allocations.filter(a => a.resource_type === 'staff')}
            selectedTheatre={selectedTheatre}
            onAllocate={onAllocateResource}
            onDeallocate={onDeallocateResource}
          />
        </TabsContent>

        <TabsContent value="availability" className="mt-6">
          <ResourceAvailability
            equipment={equipment}
            staff={staff}
            theatres={theatres}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};