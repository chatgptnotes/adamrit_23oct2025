
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { OperationTheatrePatient, PatientWorkflowStatus } from '@/types/operation-theatre';

interface WorkflowTransitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: OperationTheatrePatient;
  onConfirm: (newStatus: PatientWorkflowStatus, notes?: string) => void;
}

const statusTransitions: Record<PatientWorkflowStatus, PatientWorkflowStatus[]> = {
  scheduled: ['pre_op_preparation', 'cancelled'],
  pre_op_preparation: ['ready_for_surgery', 'scheduled', 'cancelled'],
  ready_for_surgery: ['in_theatre', 'pre_op_preparation', 'cancelled'],
  in_theatre: ['surgery_in_progress', 'ready_for_surgery'],
  surgery_in_progress: ['surgery_completed', 'cancelled'],
  surgery_completed: ['post_op_recovery'],
  post_op_recovery: ['discharged_from_ot'],
  discharged_from_ot: [],
  cancelled: ['scheduled']
};

const statusLabels: Record<PatientWorkflowStatus, string> = {
  scheduled: 'Scheduled',
  pre_op_preparation: 'Pre-Op Preparation',
  ready_for_surgery: 'Ready for Surgery',
  in_theatre: 'In Theatre',
  surgery_in_progress: 'Surgery in Progress',
  surgery_completed: 'Surgery Completed',
  post_op_recovery: 'Post-Op Recovery',
  discharged_from_ot: 'Discharged from OT',
  cancelled: 'Cancelled'
};

const criticalTransitions = [
  'surgery_in_progress',
  'surgery_completed',
  'cancelled'
];

export const WorkflowTransitionDialog: React.FC<WorkflowTransitionDialogProps> = ({
  open,
  onOpenChange,
  patient,
  onConfirm
}) => {
  const [selectedStatus, setSelectedStatus] = useState<PatientWorkflowStatus | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const availableTransitions = statusTransitions[patient.status] || [];
  const isCriticalTransition = selectedStatus && criticalTransitions.includes(selectedStatus);

  const handleConfirm = () => {
    if (selectedStatus) {
      setIsConfirming(true);
      setTimeout(() => {
        onConfirm(selectedStatus, notes || undefined);
        setIsConfirming(false);
        setSelectedStatus(undefined);
        setNotes('');
      }, 500);
    }
  };

  const handleCancel = () => {
    setSelectedStatus(undefined);
    setNotes('');
    onOpenChange(false);
  };

  const getStatusColor = (status: PatientWorkflowStatus) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600';
      case 'pre_op_preparation': return 'text-yellow-600';
      case 'ready_for_surgery': return 'text-green-600';
      case 'in_theatre': return 'text-purple-600';
      case 'surgery_in_progress': return 'text-red-600';
      case 'surgery_completed': return 'text-indigo-600';
      case 'post_op_recovery': return 'text-orange-600';
      case 'discharged_from_ot': return 'text-gray-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const requiresNotes = (status: PatientWorkflowStatus) => {
    return ['cancelled', 'surgery_completed'].includes(status);
  };

  const isFormValid = () => {
    if (!selectedStatus) return false;
    if (requiresNotes(selectedStatus) && !notes.trim()) return false;
    return true;
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value as PatientWorkflowStatus);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Patient Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">{patient.patient_name}</h4>
                <p className="text-xs text-gray-600">{patient.surgery}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Current Status</p>
                <p className={`font-medium text-sm ${getStatusColor(patient.status)}`}>
                  {statusLabels[patient.status]}
                </p>
              </div>
            </div>
          </div>

          {/* Status Transition */}
          {availableTransitions.length > 0 ? (
            <div className="space-y-3">
              <Label>Update to Status</Label>
              <Select value={selectedStatus || ''} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTransitions.map(status => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center">
                        <ArrowRight className="w-4 h-4 mr-2 text-gray-400" />
                        <span className={getStatusColor(status)}>
                          {statusLabels[status]}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Critical Transition Warning */}
              {isCriticalTransition && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This is a critical status change that cannot be easily reversed. 
                    Please ensure all procedures are completed before confirming.
                  </AlertDescription>
                </Alert>
              )}

              {/* Notes Section */}
              <div className="space-y-2">
                <Label>
                  Notes {selectedStatus && requiresNotes(selectedStatus) && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  placeholder={
                    selectedStatus && requiresNotes(selectedStatus) 
                      ? "Notes are required for this status change..." 
                      : "Optional notes about this status change..."
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No status transitions are available from the current status: {statusLabels[patient.status]}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {availableTransitions.length > 0 && (
            <Button 
              onClick={handleConfirm} 
              disabled={!isFormValid() || isConfirming}
              className={isCriticalTransition ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {isConfirming ? 'Updating...' : 'Confirm Status Change'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
