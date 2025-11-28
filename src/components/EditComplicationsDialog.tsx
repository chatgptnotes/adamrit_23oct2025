
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface EditComplicationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  diagnosis: string;
  complications: string[];
  onSave: (diagnosis: string, complications: string[]) => void;
}

export const EditComplicationsDialog: React.FC<EditComplicationsDialogProps> = ({
  isOpen,
  onClose,
  diagnosis,
  complications,
  onSave
}) => {
  const { toast } = useToast();
  const [editedComplications, setEditedComplications] = useState<string[]>(complications);

  const handleComplicationChange = (index: number, value: string) => {
    const updated = [...editedComplications];
    updated[index] = value;
    setEditedComplications(updated);
  };

  const handleSave = () => {
    const validComplications = editedComplications.filter(comp => comp.trim() !== '');
    if (validComplications.length < 4) {
      toast({
        title: "Error",
        description: "Please provide all 4 complications",
        variant: "destructive"
      });
      return;
    }

    onSave(diagnosis, validComplications);
    toast({
      title: "Success",
      description: "Complications updated successfully"
    });
    onClose();
  };

  const handleClose = () => {
    setEditedComplications(complications);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Complications for {diagnosis}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Edit the 4 most common and expensive complications for this diagnosis:
          </p>
          
          {editedComplications.map((complication, index) => (
            <div key={index}>
              <Label htmlFor={`complication-${index}`}>
                Complication {index + 1}
              </Label>
              <Input
                id={`complication-${index}`}
                value={complication}
                onChange={(e) => handleComplicationChange(index, e.target.value)}
                placeholder={`Enter complication ${index + 1}`}
                className="mt-1"
              />
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
