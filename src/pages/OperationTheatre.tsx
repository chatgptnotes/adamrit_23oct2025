import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientWorkflowBoard } from '@/components/operation-room/workflows/PatientWorkflowBoard';
import { ResourceAllocationDashboard } from '@/components/operation-room/resource-allocation/ResourceAllocationDashboard';
import { InventoryManagement } from '@/components/operation-room/inventory/InventoryManagement';
import { 
  OperationTheatrePatient, 
  OperationTheatre as OTType, 
  Equipment, 
  StaffMember, 
  ResourceAllocation, 
  InventoryItem,
  PatientWorkflowStatus 
} from '@/types/operation-theatre';

const OperationTheatre: React.FC = () => {
  const [activeTab, setActiveTab] = useState('workflow');

  // Mock data for development - replace with actual API calls
  const [patients] = useState<OperationTheatrePatient[]>([]);
  const [theatres] = useState<OTType[]>([]);
  const [equipment] = useState<Equipment[]>([]);
  const [staff] = useState<StaffMember[]>([]);
  const [allocations] = useState<ResourceAllocation[]>([]);
  const [inventory] = useState<InventoryItem[]>([]);

  const handleStatusUpdate = (patientId: string, newStatus: PatientWorkflowStatus, notes?: string) => {
    console.log('Status update:', { patientId, newStatus, notes });
    // TODO: Implement API call to update patient status
  };

  const handlePatientSelect = (patient: OperationTheatrePatient) => {
    console.log('Patient selected:', patient);
    // TODO: Implement patient selection logic
  };

  const handleAllocateResource = (resourceId: string, patientId: string, quantity: number) => {
    console.log('Allocate resource:', { resourceId, patientId, quantity });
    // TODO: Implement API call to allocate resource
  };

  const handleDeallocateResource = (allocationId: string) => {
    console.log('Deallocate resource:', allocationId);
    // TODO: Implement API call to deallocate resource
  };

  const handleUpdateStock = (itemId: string, quantity: number, notes?: string) => {
    console.log('Update stock:', { itemId, quantity, notes });
    // TODO: Implement API call to update stock
  };

  const handleAddItem = (item: Omit<InventoryItem, 'id'>) => {
    console.log('Add item:', item);
    // TODO: Implement API call to add inventory item
  };

  const handleUpdateItem = (itemId: string, updates: Partial<InventoryItem>) => {
    console.log('Update item:', { itemId, updates });
    // TODO: Implement API call to update inventory item
  };

  const handleDeleteItem = (itemId: string) => {
    console.log('Delete item:', itemId);
    // TODO: Implement API call to delete inventory item
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Operation Theatre Management</h1>
        <p className="text-gray-600 mt-1">
          Manage surgical workflows, resources, and inventory
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflow">Patient Workflow</TabsTrigger>
          <TabsTrigger value="resources">Resource Allocation</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="mt-6 h-full">
          <PatientWorkflowBoard
            patients={patients}
            onStatusUpdate={handleStatusUpdate}
            onPatientSelect={handlePatientSelect}
          />
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <ResourceAllocationDashboard
            theatres={theatres}
            equipment={equipment}
            staff={staff}
            allocations={allocations}
            onAllocateResource={handleAllocateResource}
            onDeallocateResource={handleDeallocateResource}
          />
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <InventoryManagement
            inventory={inventory}
            onUpdateStock={handleUpdateStock}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OperationTheatre;