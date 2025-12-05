
// @ts-nocheck

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Settings } from 'lucide-react';
import { SurgeryStatusEditor } from './SurgeryStatusEditor';
import { SearchableFieldSelect } from './AddPatientDialog/SearchableFieldSelect';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { VisitSurgery } from '@/types/surgery';
import { supabase } from '@/integrations/supabase/client';
import { useVisitSurgeries, useUpdateSurgeryStatus } from '@/hooks/useVisitSurgeries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, XCircle, Edit } from 'lucide-react';

interface SurgeryManagementSectionProps {
  visitId: string | undefined;
  onSurgeryChange?: () => void;
}

export const SurgeryManagementSection: React.FC<SurgeryManagementSectionProps> = ({
  visitId,
  onSurgeryChange
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState<VisitSurgery | null>(null);
  const [newSurgeryName, setNewSurgeryName] = useState('');
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: surgeries = [], isLoading } = useVisitSurgeries(visitId);
  const updateSurgeryStatus = useUpdateSurgeryStatus();

  const handleSurgeryEdit = (surgery: any) => {
    // Map the surgery data to match VisitSurgery interface
    const mappedSurgery: VisitSurgery = {
      id: surgery.id,
      visit_id: visitId || '',
      surgery_id: surgery.surgery_id || '',
      surgery_name: surgery.surgeryName || (Array.isArray(surgery.cghs_surgery) ? surgery.cghs_surgery[0]?.name : surgery.cghs_surgery?.name) || '',
      status: surgery.status || 'planned',
      sanction_status: surgery.sanction_status || 'Not Sanctioned',
      created_at: surgery.created_at || new Date().toISOString(),
      updated_at: surgery.updated_at || new Date().toISOString()
    };
    
    setSelectedSurgery(mappedSurgery);
    setIsEditorOpen(true);
  };

  const handleStatusUpdate = async (surgeryId: string, status: string) => {
    try {
      await updateSurgeryStatus(surgeryId, status as any);
      queryClient.invalidateQueries({ queryKey: ['visit-surgeries', visitId] });
      onSurgeryChange?.();
    } catch (error) {
      console.error('Error updating surgery status:', error);
      throw error;
    }
  };

  const handleAddSurgery = async (surgeryName: string) => {
    if (!visitId || !surgeryName) {
      toast({
        title: 'Error',
        description: 'Please select a surgery from the dropdown',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);
    try {
      // First, find the surgery ID from cghs_surgery table
      const { data: surgeryData, error: surgeryError } = await supabase
        .from('cghs_surgery')
        .select('id')
        .eq('name', surgeryName)
        .single();

      if (surgeryError || !surgeryData) {
        throw new Error('Surgery not found in master data');
      }

      // Check if this surgery already exists for this visit
      const { data: existingSurgery, error: checkError } = await supabase
        .from('visit_surgeries')
        .select('id')
        .eq('visit_id', visitId)
        .eq('surgery_id', surgeryData.id)
        .single();

      if (existingSurgery) {
        toast({
          title: 'Surgery Already Added',
          description: 'This surgery is already added to this visit',
          variant: 'destructive',
        });
        return;
      }

      // Add the surgery to visit_surgeries
      const { error: insertError } = await supabase
        .from('visit_surgeries')
        .insert({
          visit_id: visitId,
          surgery_id: surgeryData.id,
          status: 'planned',
          sanction_status: 'Not Sanctioned',
          implant: '',
          anaesthetist_name: '',
          anaesthesia_type: ''
        });

      if (insertError) throw insertError;

      // Refresh the surgery list
      queryClient.invalidateQueries({ queryKey: ['visit-surgeries', visitId] });
      
      toast({
        title: 'Success',
        description: 'Surgery added successfully',
      });
      
      setNewSurgeryName('');
      setIsAddingMode(false);
      onSurgeryChange?.();
    } catch (error) {
      console.error('Error adding surgery:', error);
      toast({
        title: 'Error',
        description: 'Failed to add surgery',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleSurgeryRemove = (surgeryId: string) => {
    // Refresh the list after removal
    queryClient.invalidateQueries({ queryKey: ['visit-surgeries', visitId] });
    onSurgeryChange?.();
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sanctioned':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'not sanctioned':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sanctioned':
        return 'bg-green-100 text-green-800';
      case 'not sanctioned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!visitId) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Surgery Management</Label>
        <p className="text-sm text-muted-foreground">
          Please save the patient first to manage surgeries.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Surgery Management</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingMode(!isAddingMode)}
          className="text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Surgery
        </Button>
      </div>

      {/* Add New Surgery Section */}
      {isAddingMode && (
        <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
          <Label className="text-sm font-medium">Add New Surgery</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchableFieldSelect
                tableName="cghs_surgery"
                fieldName="surgery"
                value={newSurgeryName}
                onChange={(value) => setNewSurgeryName(value)}
                placeholder="Search for surgery/procedure..."
                displayField="name"
                searchFields={['name', 'description', 'code']}
              />
            </div>
            <Button
              onClick={() => handleAddSurgery(newSurgeryName)}
              disabled={!newSurgeryName || isAdding}
              size="sm"
            >
              {isAdding ? 'Adding...' : 'Add'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingMode(false);
                setNewSurgeryName('');
              }}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Surgery List */}
      <div className="border rounded-lg p-4">
        {isLoading ? (
          <div className="text-center py-4">Loading surgeries...</div>
        ) : !surgeries || surgeries.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No surgeries found for this visit.
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Surgery Status Management</h3>
            
            {surgeries.map((surgery) => {
              // Safely access cghs_surgery data
              const cghsSurgery = Array.isArray(surgery.cghs_surgery) ? surgery.cghs_surgery[0] : surgery.cghs_surgery;
              
              return (
                <Card key={surgery.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(surgery.sanction_status)}
                        <div>
                          <h4 className="font-medium">
                            {surgery.surgeryName || 'Unknown Surgery'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Surgery ID: {surgery.id}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(surgery.sanction_status)}>
                          {surgery.sanction_status}
                        </Badge>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSurgeryEdit(surgery)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                    
                    {cghsSurgery && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Code:</span> {cghsSurgery.code}
                          </div>
                          <div>
                            <span className="font-medium">Description:</span> {cghsSurgery.description}
                          </div>
                          {cghsSurgery.category && (
                            <div className="col-span-2">
                              <span className="font-medium">Category:</span>
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {cghsSurgery.category}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Surgery Status Editor Dialog */}
      <SurgeryStatusEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedSurgery(null);
        }}
        surgery={selectedSurgery}
        onRemove={handleSurgeryRemove}
      />
    </div>
  );
};

export default SurgeryManagementSection;
