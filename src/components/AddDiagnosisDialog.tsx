
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AddDiagnosisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDiagnosis: (diagnosis: string, description?: string) => void;
}

export const AddDiagnosisDialog: React.FC<AddDiagnosisDialogProps> = ({
  isOpen,
  onClose,
  onAddDiagnosis
}) => {
  const [formData, setFormData] = useState({
    diagnosis: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.diagnosis) {
      return;
    }

    onAddDiagnosis(formData.diagnosis, formData.description);

    // Reset form
    setFormData({
      diagnosis: '',
      description: ''
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Diagnosis Category</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="diagnosis">Diagnosis Name *</Label>
            <Input
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
              placeholder="e.g., Inguinal Hernia, Hypospadias"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the diagnosis category"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Diagnosis
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
