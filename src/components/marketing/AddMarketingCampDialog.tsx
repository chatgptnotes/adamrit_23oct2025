import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateMarketingCamp, useMarketingUsers } from '@/hooks/useMarketingData';
import { useToast } from '@/hooks/use-toast';

interface AddMarketingCampDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddMarketingCampDialog: React.FC<AddMarketingCampDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const { data: marketingUsers = [] } = useMarketingUsers();
  const createCamp = useCreateMarketingCamp();

  const [formData, setFormData] = useState({
    marketing_user_id: '',
    camp_name: '',
    location: '',
    address: '',
    camp_date: new Date().toISOString().split('T')[0],
    camp_type: '',
    expected_footfall: '',
    camp_notes: '',
    status: 'Scheduled',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.marketing_user_id) {
      toast({
        title: 'Error',
        description: 'Please select a marketing staff',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.camp_name) {
      toast({
        title: 'Error',
        description: 'Please enter camp name',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.location) {
      toast({
        title: 'Error',
        description: 'Please enter location',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createCamp.mutateAsync({
        ...formData,
        expected_footfall: formData.expected_footfall
          ? parseInt(formData.expected_footfall)
          : undefined,
        status: formData.status as 'Scheduled' | 'Completed' | 'Cancelled' | 'Postponed',
      });
      toast({
        title: 'Success',
        description: 'Marketing camp added successfully',
      });
      handleClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add marketing camp',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setFormData({
      marketing_user_id: '',
      camp_name: '',
      location: '',
      address: '',
      camp_date: new Date().toISOString().split('T')[0],
      camp_type: '',
      expected_footfall: '',
      camp_notes: '',
      status: 'Scheduled',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Marketing Camp</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="marketing_user_id">Marketing Staff *</Label>
              <Select
                value={formData.marketing_user_id}
                onValueChange={(value) => handleChange('marketing_user_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select marketing staff" />
                </SelectTrigger>
                <SelectContent>
                  {marketingUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="camp_name">Camp Name *</Label>
              <Input
                id="camp_name"
                value={formData.camp_name}
                onChange={(e) => handleChange('camp_name', e.target.value)}
                placeholder="e.g., Free Health Checkup Camp"
              />
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g., City Name, Area"
              />
            </div>

            <div>
              <Label htmlFor="camp_date">Camp Date *</Label>
              <Input
                id="camp_date"
                type="date"
                value={formData.camp_date}
                onChange={(e) => handleChange('camp_date', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="camp_type">Camp Type</Label>
              <Select
                value={formData.camp_type}
                onValueChange={(value) => handleChange('camp_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select camp type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Health Camp">Health Camp</SelectItem>
                  <SelectItem value="Eye Camp">Eye Camp</SelectItem>
                  <SelectItem value="Dental Camp">Dental Camp</SelectItem>
                  <SelectItem value="Blood Donation">Blood Donation</SelectItem>
                  <SelectItem value="Awareness Camp">Awareness Camp</SelectItem>
                  <SelectItem value="Vaccination Camp">Vaccination Camp</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expected_footfall">Expected Footfall</Label>
              <Input
                id="expected_footfall"
                type="number"
                value={formData.expected_footfall}
                onChange={(e) => handleChange('expected_footfall', e.target.value)}
                placeholder="Expected number of patients"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Postponed">Postponed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="address">Full Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Complete address of the camp venue"
                rows={2}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="camp_notes">Notes</Label>
              <Textarea
                id="camp_notes"
                value={formData.camp_notes}
                onChange={(e) => handleChange('camp_notes', e.target.value)}
                placeholder="Additional notes about the camp..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCamp.isPending}>
              {createCamp.isPending ? 'Adding...' : 'Add Camp'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMarketingCampDialog;
