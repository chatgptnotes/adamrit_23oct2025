import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateSurgeryStatus } from '@/hooks/useVisitSurgeries';
import { VisitSurgery, SanctionStatus, SANCTION_STATUSES } from '@/types/surgery';
import { supabase } from '@/integrations/supabase/client';

interface SurgeryStatusEditorProps {
  isOpen: boolean;
  onClose: () => void;
  surgery: VisitSurgery | null;
  onRemove?: (surgeryId: string) => void;
}

export const SurgeryStatusEditor: React.FC<SurgeryStatusEditorProps> = ({
  isOpen,
  onClose,
  surgery,
  onRemove
}) => {
  const [selectedStatus, setSelectedStatus] = useState<SanctionStatus>(
    surgery?.sanction_status || 'Not Sanctioned'
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateSurgeryStatus = useUpdateSurgeryStatus();

  const handleSave = async () => {
    if (!surgery) return;

    setIsUpdating(true);
    try {
      await updateSurgeryStatus(surgery.id, selectedStatus);
      
      // Invalidate and refetch the visit surgeries
      queryClient.invalidateQueries({ queryKey: ['visit-surgeries', surgery.visit_id] });
      
      toast({
        title: 'Success',
        description: `Surgery status updated to ${selectedStatus}`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating surgery status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update surgery status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (!surgery) return;

    setIsRemoving(true);
    try {
      const { error } = await supabase
        .from('visit_surgeries')
        .delete()
        .eq('id', surgery.id);

      if (error) throw error;

      // Invalidate and refetch the visit surgeries
      queryClient.invalidateQueries({ queryKey: ['visit-surgeries', surgery.visit_id] });
      
      toast({
        title: 'Success',
        description: 'Surgery removed successfully',
      });
      
      onRemove?.(surgery.id);
      onClose();
    } catch (error) {
      console.error('Error removing surgery:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove surgery',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  // Update selected status when surgery changes
  React.useEffect(() => {
    if (surgery) {
      setSelectedStatus(surgery.sanction_status);
    }
  }, [surgery]);

  if (!surgery) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Edit Surgery Status
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Surgery Name</Label>
            <div className="p-3 bg-gray-50 rounded-md border">
              <span className="text-sm font-medium">{surgery.surgery_name}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sanction-status" className="text-sm font-medium">
              Sanction Status
            </Label>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as SanctionStatus)}>
              <SelectTrigger id="sanction-status">
                <SelectValue placeholder="Select sanction status" />
              </SelectTrigger>
              <SelectContent>
                {SANCTION_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      {status === 'Sanctioned' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>{status}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-xs text-muted-foreground">
              Last updated: {new Date(surgery.updated_at).toLocaleDateString()}
            </span>
            
            {onRemove && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={isRemoving}
                className="text-red-600 hover:text-red-700"
              >
                {isRemoving ? (
                  <>Removing...</>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isUpdating || selectedStatus === surgery.sanction_status}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUpdating ? 'Updating...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SurgeryStatusEditor;