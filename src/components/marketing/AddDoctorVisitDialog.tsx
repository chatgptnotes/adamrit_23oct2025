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
import { useCreateDoctorVisit, useMarketingUsers } from '@/hooks/useMarketingData';
import { useToast } from '@/hooks/use-toast';

interface AddDoctorVisitDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddDoctorVisitDialog: React.FC<AddDoctorVisitDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const { data: marketingUsers = [] } = useMarketingUsers();
  const createVisit = useCreateDoctorVisit();

  const [formData, setFormData] = useState({
    marketingUser_id: '',
    doctor_name: '',
    specialty: '',
    hospital_clinic_name: '',
    contact_number: '',
    email: '',
    location_address: '',
    visit_date: new Date().toISOString().split('T')[0],
    comments: '',
    disposition: '',
    follow_up_date: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.marketingUser_id) {
      toast({
        title: 'Error',
        description: 'Please select a marketing staff',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.doctor_name) {
      toast({
        title: 'Error',
        description: 'Please enter doctor name',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createVisit.mutateAsync({
        ...formData,
        disposition: formData.disposition || undefined,
        follow_up_date: formData.follow_up_date || undefined,
      });
      toast({
        title: 'Success',
        description: 'Doctor visit added successfully',
      });
      handleClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add doctor visit',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setFormData({
      marketingUser_id: '',
      doctor_name: '',
      specialty: '',
      hospital_clinic_name: '',
      contact_number: '',
      email: '',
      location_address: '',
      visit_date: new Date().toISOString().split('T')[0],
      comments: '',
      disposition: '',
      follow_up_date: '',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Doctor Visit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="marketingUser_id">Marketing Staff *</Label>
              <Select
                value={formData.marketingUser_id}
                onValueChange={(value) => handleChange('marketingUser_id', value)}
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
              <Label htmlFor="doctor_name">Doctor Name *</Label>
              <Input
                id="doctor_name"
                value={formData.doctor_name}
                onChange={(e) => handleChange('doctor_name', e.target.value)}
                placeholder="Dr. Name"
              />
            </div>

            <div>
              <Label htmlFor="specialty">Specialty</Label>
              <Input
                id="specialty"
                value={formData.specialty}
                onChange={(e) => handleChange('specialty', e.target.value)}
                placeholder="e.g., Cardiologist, General Physician"
              />
            </div>

            <div>
              <Label htmlFor="hospital_clinic_name">Hospital/Clinic Name</Label>
              <Input
                id="hospital_clinic_name"
                value={formData.hospital_clinic_name}
                onChange={(e) => handleChange('hospital_clinic_name', e.target.value)}
                placeholder="Hospital or Clinic Name"
              />
            </div>

            <div>
              <Label htmlFor="contact_number">Contact Number</Label>
              <Input
                id="contact_number"
                value={formData.contact_number}
                onChange={(e) => handleChange('contact_number', e.target.value)}
                placeholder="Phone number"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="doctor@example.com"
              />
            </div>

            <div>
              <Label htmlFor="visit_date">Visit Date *</Label>
              <Input
                id="visit_date"
                type="date"
                value={formData.visit_date}
                onChange={(e) => handleChange('visit_date', e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="location_address">Address</Label>
              <Textarea
                id="location_address"
                value={formData.location_address}
                onChange={(e) => handleChange('location_address', e.target.value)}
                placeholder="Clinic/Hospital address"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="disposition">Outcome</Label>
              <Select
                value={formData.disposition}
                onValueChange={(value) => handleChange('disposition', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Positive">Positive</SelectItem>
                  <SelectItem value="Neutral">Neutral</SelectItem>
                  <SelectItem value="Negative">Negative</SelectItem>
                  <SelectItem value="Follow-up Required">Follow-up Required</SelectItem>
                  <SelectItem value="Not Available">Not Available</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="follow_up_date">Follow-up Date</Label>
              <Input
                id="follow_up_date"
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => handleChange('follow_up_date', e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="comments">Visit Notes</Label>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={(e) => handleChange('comments', e.target.value)}
                placeholder="Notes about the visit..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createVisit.isPending}>
              {createVisit.isPending ? 'Adding...' : 'Add Visit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDoctorVisitDialog;
