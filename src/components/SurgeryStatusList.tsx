
// @ts-nocheck

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { safeArrayAccess } from '@/utils/arrayHelpers';

interface VisitSurgery {
  id: string;
  visit_id: string;
  surgery_id: string;
  surgery_name?: string;
  surgeryName?: string;
  status: string;
  sanction_status: string;
  created_at: string;
  updated_at: string;
  cghs_surgery?: {
    id: string;
    name: string;
    code: string;
    description: string;
  };
}

interface SurgeryStatusListProps {
  surgeries: any[];
  onStatusUpdate: (surgeryId: string, status: string) => void;
  isUpdating?: boolean;
}

const SurgeryStatusList: React.FC<SurgeryStatusListProps> = ({
  surgeries,
  onStatusUpdate,
  isUpdating = false
}) => {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (surgeryId: string, newStatus: string) => {
    try {
      setUpdatingId(surgeryId);
      await onStatusUpdate(surgeryId, newStatus);
      toast({
        title: "Success",
        description: "Surgery status updated successfully",
      });
    } catch (error) {
      console.error('Error updating surgery status:', error);
      toast({
        title: "Error",
        description: "Failed to update surgery status",
        variant: "destructive"
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!surgeries || surgeries.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No surgeries found for this visit.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Surgery Status Management</h3>
      
      {surgeries.map((surgery) => {
        // Create a proper VisitSurgery object
        const visitSurgery: VisitSurgery = {
          id: surgery.id,
          visit_id: surgery.visit_id || '',
          surgery_id: surgery.surgery_id || '',
          surgery_name: surgery.surgeryName || safeArrayAccess(surgery.cghs_surgery, 'name'),
          surgeryName: surgery.surgeryName || safeArrayAccess(surgery.cghs_surgery, 'name'),
          status: surgery.status || 'pending',
          sanction_status: surgery.sanction_status || 'pending',
          created_at: surgery.created_at || new Date().toISOString(),
          updated_at: surgery.updated_at || new Date().toISOString(),
          cghs_surgery: surgery.cghs_surgery
        };

        return (
          <Card key={surgery.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(surgery.sanction_status)}
                  <div>
                    <h4 className="font-medium">
                      {visitSurgery.surgeryName || 'Unknown Surgery'}
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
                  
                  <Select
                    value={surgery.sanction_status}
                    onValueChange={(value) => handleStatusChange(surgery.id, value)}
                    disabled={updatingId === surgery.id || isUpdating}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {surgery.cghs_surgery && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Code:</span> {safeArrayAccess(surgery.cghs_surgery, 'code')}
                    </div>
                    <div>
                      <span className="font-medium">Description:</span> {safeArrayAccess(surgery.cghs_surgery, 'description')}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SurgeryStatusList;
