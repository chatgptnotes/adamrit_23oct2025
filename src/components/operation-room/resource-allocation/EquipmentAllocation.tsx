import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Package, AlertTriangle, Calendar, Wrench } from 'lucide-react';
import { Equipment, ResourceAllocation } from '@/types/operation-theatre';

interface EquipmentAllocationProps {
  equipment: Equipment[];
  allocations: ResourceAllocation[];
  selectedTheatre: number | null;
  onAllocate: (resourceId: string, patientId: string, quantity: number) => void;
  onDeallocate: (allocationId: string) => void;
}

export const EquipmentAllocation: React.FC<EquipmentAllocationProps> = ({
  equipment,
  allocations,
  selectedTheatre,
  onAllocate,
  onDeallocate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [allocationDialog, setAllocationDialog] = useState<{
    open: boolean;
    equipment: Equipment | null;
  }>({ open: false, equipment: null });
  const [allocationQuantity, setAllocationQuantity] = useState(1);
  const [patientId, setPatientId] = useState('');

  const categories = [
    'all',
    'surgical_instruments',
    'consumables',
    'implants',
    'medications',
    'anesthesia_supplies'
  ];

  const getStatusColor = (status: Equipment['status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_use': return 'bg-red-100 text-red-800 border-red-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out_of_stock': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: Equipment['type']) => {
    switch (type) {
      case 'surgical': return <Wrench className="w-4 h-4" />;
      case 'anesthesia': return <Package className="w-4 h-4" />;
      case 'monitoring': return <Package className="w-4 h-4" />;
      case 'disposable': return <Package className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      (item as any).category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getEquipmentAllocations = (equipmentId: string) => {
    return allocations.filter(a => 
      a.resource_id === equipmentId && 
      (a.status === 'allocated' || a.status === 'in_use')
    );
  };

  const isEquipmentCritical = (item: Equipment) => {
    const conditions = [];
    
    if (item.quantity_available <= 5 && item.type === 'disposable') {
      conditions.push('Low stock');
    }
    
    if (item.expiry_date && new Date(item.expiry_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
      conditions.push('Expiring soon');
    }
    
    if (item.last_sterilized && new Date(item.last_sterilized).getTime() < Date.now() - (24 * 60 * 60 * 1000)) {
      conditions.push('Sterilization due');
    }
    
    return conditions;
  };

  const handleAllocateClick = (equipment: Equipment) => {
    setAllocationDialog({ open: true, equipment });
    setAllocationQuantity(1);
    setPatientId('');
  };

  const handleAllocateConfirm = () => {
    if (allocationDialog.equipment && patientId.trim()) {
      onAllocate(allocationDialog.equipment.id, patientId.trim(), allocationQuantity);
      setAllocationDialog({ open: false, equipment: null });
      setAllocationQuantity(1);
      setPatientId('');
    }
  };

  const canAllocate = (equipment: Equipment, quantity: number) => {
    return equipment.status === 'available' && equipment.quantity_available >= quantity;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="equipment-search">Search Equipment</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="equipment-search"
                  placeholder="Search by equipment name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize"
                  >
                    {category.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map(item => {
          const criticalIssues = isEquipmentCritical(item);
          const itemAllocations = getEquipmentAllocations(item.id);
          
          return (
            <Card key={item.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(item.type)}
                    <CardTitle className="text-sm">{item.name}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Critical Issues */}
                {criticalIssues.length > 0 && (
                  <Alert variant="destructive" className="py-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {criticalIssues.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Equipment Details */}
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <span className="font-medium">{item.quantity_available}</span>
                  </div>
                  
                  {item.manufacturer && (
                    <div className="flex justify-between">
                      <span>Manufacturer:</span>
                      <span className="font-medium text-xs">{item.manufacturer}</span>
                    </div>
                  )}
                  
                  {item.expiry_date && (
                    <div className="flex justify-between">
                      <span>Expiry:</span>
                      <span className="font-medium text-xs">
                        {new Date(item.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {item.last_sterilized && (
                    <div className="flex justify-between">
                      <span>Sterilized:</span>
                      <span className="font-medium text-xs">
                        {new Date(item.last_sterilized).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Current Allocations */}
                {itemAllocations.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs">Current Allocations:</Label>
                    {itemAllocations.map(allocation => (
                      <div key={allocation.resource_id + allocation.allocated_at} 
                           className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                        <span>Qty: {allocation.quantity_allocated}</span>
                        <Badge variant="outline" className="text-xs">
                          {allocation.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleAllocateClick(item)}
                    disabled={!canAllocate(item, 1)}
                    className="flex-1"
                  >
                    Allocate
                  </Button>
                  
                  {itemAllocations.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        itemAllocations.forEach(allocation => 
                          onDeallocate(allocation.resource_id)
                        );
                      }}
                      className="flex-1"
                    >
                      Deallocate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredEquipment.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No equipment found matching your criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Allocation Dialog */}
      <Dialog 
        open={allocationDialog.open} 
        onOpenChange={(open) => setAllocationDialog({ open, equipment: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Equipment</DialogTitle>
          </DialogHeader>
          
          {allocationDialog.equipment && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{allocationDialog.equipment.name}</h4>
                <p className="text-sm text-gray-600">
                  Available: {allocationDialog.equipment.quantity_available} units
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patient-id">Patient ID</Label>
                <Input
                  id="patient-id"
                  placeholder="Enter patient ID..."
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity to Allocate</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={allocationDialog.equipment.quantity_available}
                  value={allocationQuantity}
                  onChange={(e) => setAllocationQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAllocationDialog({ open: false, equipment: null })}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAllocateConfirm}
              disabled={!patientId.trim() || !allocationDialog.equipment}
            >
              Allocate Equipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};